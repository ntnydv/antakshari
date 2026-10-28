#!/usr/bin/env python3
"""Validate the executable planning package without third-party dependencies."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict, deque
from dataclasses import dataclass, field
import fnmatch
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


IGNORED_DIRS = {'.git', '__pycache__', '.pytest_cache', '.mypy_cache',
                '.dart_tool', 'node_modules', '.cache', 'build', 'dist'}
SECRET_PATTERNS = (
    ('private key', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
    ('GitHub token', re.compile(r'\bgh[pousr]_[A-Za-z0-9]{36,}\b')),
    ('GitHub fine-grained token', re.compile(r'\bgithub_pat_[A-Za-z0-9]{20,}_[A-Za-z0-9]{30,}\b')),
    ('Google API key', re.compile(r'\bAIza[A-Za-z0-9_-]{35}\b')),
    ('AWS access key', re.compile(r'\bAKIA[A-Z0-9]{16}\b')),
)


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    stats: dict[str, int] = field(default_factory=dict)


def dependency_errors(tasks: list[dict]) -> list[str]:
    """Check reference integrity and cycles; accept arbitrary tiny task fixtures."""
    errors = []
    ids = [task.get('id') for task in tasks]
    if any(not isinstance(task_id, str) or not task_id for task_id in ids):
        return ['Every task must have a nonempty string id']
    repeated = [key for key, count in Counter(ids).items() if count > 1]
    errors.extend(f'Duplicate task ID: {key}' for key in repeated)
    by_id = {task['id']: task for task in tasks}
    incoming = {key: 0 for key in by_id}
    outgoing = defaultdict(list)
    for task in tasks:
        deps = task.get('dependencies', [])
        if not isinstance(deps, list) or any(not isinstance(dep, str) for dep in deps):
            errors.append(f"{task['id']}: dependencies must be a string list")
            continue
        if len(deps) != len(set(deps)):
            errors.append(f"{task['id']}: repeated dependency")
        for dep in set(deps):
            if dep not in by_id:
                errors.append(f"{task['id']}: missing dependency {dep}")
            else:
                incoming[task['id']] += 1
                outgoing[dep].append(task['id'])
    ready = deque(key for key, degree in incoming.items() if degree == 0)
    seen = set()
    while ready:
        current = ready.popleft()
        seen.add(current)
        for child in outgoing[current]:
            incoming[child] -= 1
            if incoming[child] == 0:
                ready.append(child)
    blocked = sorted(set(by_id) - seen)
    if blocked:
        errors.append('Dependency cycle or cycle-dependent tasks: ' + ', '.join(blocked[:20]))
    return errors


def _normal_path(value: str) -> str:
    return value.replace('\\', '/').removeprefix('./').rstrip('/')


def paths_overlap(left: str, right: str) -> bool:
    """Detect exact, directory, and conservative wildcard ownership conflicts."""
    left, right = _normal_path(left), _normal_path(right)
    if left == right or left.startswith(right + '/') or right.startswith(left + '/'):
        return True
    left_wild, right_wild = bool(re.search(r'[*?\[]', left)), bool(re.search(r'[*?\[]', right))
    if left_wild and fnmatch.fnmatchcase(right, left):
        return True
    if right_wild and fnmatch.fnmatchcase(left, right):
        return True
    if left_wild and right_wild:
        # Overlapping directory prefixes cannot establish independent ownership.
        lprefix = re.split(r'[*?\[]', left, 1)[0]
        rprefix = re.split(r'[*?\[]', right, 1)[0]
        return lprefix.startswith(rprefix) or rprefix.startswith(lprefix)
    return False


def ownership_errors(tasks: list[dict]) -> list[str]:
    """Bootstrap owns shared foundations; later tasks must have exclusive scopes."""
    errors, entries = [], []
    for task in tasks:
        paths = task.get('owned_paths', [])
        if not isinstance(paths, list) or not paths:
            errors.append(f"{task.get('id')}: owned_paths must be a nonempty list")
            continue
        for value in paths:
            if not isinstance(value, str) or not value or value.startswith('/') or '..' in value.split('/'):
                errors.append(f"{task.get('id')}: unsafe owned path {value!r}")
                continue
            if task.get('component') != 'BOOT' and task.get('kind') != 'bootstrap':
                entries.append((task['id'], value))
    # Exact paths dominate the generated plan; group them for a linear common case.
    exact_owners = defaultdict(set)
    for task_id, path in entries:
        exact_owners[_normal_path(path)].add(task_id)
    for path, owners in exact_owners.items():
        if len(owners) > 1:
            errors.append(f"Owned path overlap: {path} ({', '.join(sorted(owners))})")
    sorted_entries = sorted(entries, key=lambda pair: _normal_path(pair[1]))
    for i, (task_id, path) in enumerate(sorted_entries):
        normalized = _normal_path(path)
        is_wild = bool(re.search(r'[*?\[]', normalized))
        for other_id, other_path in sorted_entries[i + 1:]:
            other_normal = _normal_path(other_path)
            other_wild = bool(re.search(r'[*?\[]', other_normal))
            if task_id == other_id or normalized == other_normal:
                continue
            if not is_wild and not other_wild:
                if not other_normal.startswith(normalized):
                    break
            if paths_overlap(path, other_path):
                errors.append(f'Owned path overlap: {task_id} {path} <> {other_id} {other_path}')
    return errors


def first_day_errors(tasks: list[dict], selected: list[str], expected_count: int | None = None) -> list[str]:
    errors = []
    if not isinstance(selected, list) or any(not isinstance(item, str) for item in selected):
        return ['First-day task_ids must be a string list']
    if expected_count is not None and len(selected) != expected_count:
        errors.append(f'First-day list must contain {expected_count} tasks; found {len(selected)}')
    if len(selected) != len(set(selected)):
        errors.append('First-day list contains duplicate task IDs')
    by_id, chosen = {task['id']: task for task in tasks}, set(selected)
    for task_id in selected:
        if task_id not in by_id:
            errors.append(f'First-day task does not exist: {task_id}')
            continue
        for dep in by_id[task_id].get('dependencies', []):
            if dep not in chosen:
                errors.append(f'First-day closure: {task_id} requires omitted {dep}')
    return errors


def _walk_files(root: Path):
    for path in root.rglob('*'):
        if path.is_file() and not any(part in IGNORED_DIRS for part in path.relative_to(root).parts):
            yield path


def _without_fences(text: str) -> tuple[str, bool]:
    visible, opener = [], None
    for line in text.splitlines():
        match = re.match(r'^\s{0,3}(`{3,}|~{3,})(.*)$', line)
        if match:
            fence, tail = match.groups()
            if opener is None:
                opener = (fence[0], len(fence))
            elif fence[0] == opener[0] and len(fence) >= opener[1] and not tail.strip():
                opener = None
            continue
        if opener is None:
            visible.append(line)
    return '\n'.join(visible), opener is None


def _anchors(text: str) -> set[str]:
    visible, _ = _without_fences(text)
    result, occurrences = set(), Counter()
    for line in visible.splitlines():
        match = re.match(r'^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$', line)
        if not match:
            continue
        heading = re.sub(r'<[^>]+>', '', match.group(1))
        heading = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', heading)
        slug = re.sub(r'[^\w\-\s]', '', heading.lower()).replace(' ', '-')
        suffix = occurrences[slug]
        result.add(slug + (f'-{suffix}' if suffix else ''))
        occurrences[slug] += 1
    result.update(re.findall(r'\b(?:id|name)=["\']([^"\']+)["\']', visible))
    return result


def markdown_errors(root: Path, path: Path, text: str) -> list[str]:
    errors = []
    relative = path.relative_to(root).as_posix()
    visible, balanced = _without_fences(text)
    if not balanced:
        errors.append(f'{relative}: unclosed fenced code block')
    links = re.findall(r'!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+["\'][^\n]*?["\'])?\s*\)', visible)
    links += re.findall(r'^\s{0,3}\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)', visible, re.M)
    for raw in links:
        destination = raw.strip('<>')
        if destination.startswith('#') or urlsplit(destination).scheme or destination.startswith('//'):
            continue
        parsed = urlsplit(destination)
        target_path = unquote(parsed.path)
        if not target_path:
            continue
        if any(char in target_path for char in '*?['):
            errors.append(f'{relative}: linked path contains a glob: {destination}')
            continue
        target = (root / target_path.lstrip('/') if target_path.startswith('/') else path.parent / target_path).resolve()
        if not target.is_relative_to(root.resolve()):
            errors.append(f'{relative}: local link escapes repository: {destination}')
        elif not target.exists():
            errors.append(f'{relative}: missing local link target: {destination}')
        elif parsed.fragment and target.is_file() and target.suffix.lower() == '.md':
            fragment = unquote(parsed.fragment)
            if fragment not in _anchors(target.read_text(encoding='utf-8')):
                errors.append(f'{relative}: missing Markdown anchor: {destination}')
    return errors


def _read_json(path: Path, report: Report):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        report.errors.append(f'{path}: invalid or missing JSON ({exc})')
        return None


def model_policy_errors(policy: dict) -> list[str]:
    """Permit schema evolution while rejecting unsupported or opt-in model IDs."""
    errors = []
    allowed = {'muse-voice-transcribe-1.0', 'muse-spark-1.3', 'muse-spark-1.2',
               'muse-wonder-1.0', 'muse-image-1.0'}
    def visit(value, path='policy'):
        if isinstance(value, dict):
            for key, child in value.items():
                visit(child, f'{path}.{key}')
        elif isinstance(value, list):
            for i, child in enumerate(value):
                visit(child, f'{path}[{i}]')
        elif isinstance(value, str) and value.startswith('muse-') and value not in allowed:
            errors.append(f'{path}: unapproved model ID {value}')
    visit(policy)
    return errors


def validate(root: Path, expected_tasks: int = 2056, expected_first_day: int = 240) -> Report:
    root = root.resolve()
    report = Report()
    index = _read_json(root / 'backlog/index.json', report)
    if not isinstance(index, dict) or not isinstance(index.get('tasks'), list):
        report.errors.append('backlog/index.json must be an object with a tasks list')
        return report
    tasks, components = index['tasks'], index.get('components', [])
    if any(not isinstance(item, dict) for item in tasks + components):
        report.errors.append('Every task and component must be an object')
        return report
    if index.get('schema_version') != 1:
        report.errors.append('Backlog schema_version must be 1')
    if len(tasks) != expected_tasks or index.get('task_count') != len(tasks):
        report.errors.append(f'Task count mismatch: expected {expected_tasks}, found {len(tasks)}, declared {index.get("task_count")}')
    if len(components) != 32:
        report.errors.append(f'Expected 32 components; found {len(components)}')
    component_ids = [component.get('code') for component in components]
    if len(set(component_ids)) != len(component_ids):
        report.errors.append('Duplicate component codes')
    round_ids = {code for code in component_ids if isinstance(code, str) and code.startswith('R')}
    if round_ids != {f'R{i:02}' for i in range(1, 11)}:
        report.errors.append('Round components must be exactly R01 through R10')
    report.errors += dependency_errors(tasks)
    report.errors += ownership_errors(tasks)
    titles = Counter((task.get('component'), task.get('title', '').strip().casefold()) for task in tasks)
    report.errors += [f'Duplicate title within component {component}: {title}' for (component, title), count in titles.items() if count > 1]
    for item in tasks + components:
        if not isinstance(item.get('design'), str) or not (root / item['design']).is_file():
            report.errors.append(f"{item.get('id', item.get('code'))}: missing design {item.get('design')}")
    for task in tasks:
        if task.get('component') not in set(component_ids) | {'BOOT'}:
            report.errors.append(f"{task['id']}: unknown component {task.get('component')}")
        if not isinstance(task.get('card_path'), str) or not (root / task['card_path']).is_file():
            report.errors.append(f"{task['id']}: missing task card {task.get('card_path')}")
    first_day = _read_json(root / 'backlog/first-day.json', report)
    if isinstance(first_day, dict):
        selected = first_day.get('task_ids', [])
        report.errors += first_day_errors(tasks, selected, expected_first_day)
        selected_set = set(selected)
        for task in tasks:
            if bool(task.get('first_day')) != (task['id'] in selected_set):
                report.errors.append(f"{task['id']}: first_day flag disagrees with selected list")
    else:
        selected = []
    json_count, markdown_count, checked_files = 0, 0, 0
    for path in _walk_files(root):
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeError:
            continue
        checked_files += 1
        relative = path.relative_to(root).as_posix()
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(text):
                report.errors.append(f'{relative}: possible committed {label}; value redacted')
        if path.suffix.lower() == '.json':
            value = _read_json(path, report)
            json_count += 1
            if relative == 'config/model-policy.json' and isinstance(value, dict):
                report.errors += model_policy_errors(value)
        elif path.suffix.lower() == '.md':
            markdown_count += 1
            report.errors += markdown_errors(root, path, text)
    report.stats = {
        'tasks': len(tasks), 'components': len(components), 'rounds': len(round_ids),
        'first_day_candidates': len(selected), 'dependency_edges': sum(len(t.get('dependencies', [])) for t in tasks),
        'json_files': json_count, 'markdown_files': markdown_count, 'text_files_scanned': checked_files,
        'errors': len(report.errors),
    }
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--expected-tasks', type=int, default=2056)
    parser.add_argument('--expected-first-day', type=int, default=240)
    parser.add_argument('--json', action='store_true', help='Print machine-readable summary and errors')
    args = parser.parse_args()
    report = validate(args.root, args.expected_tasks, args.expected_first_day)
    if args.json:
        print(json.dumps({'ok': not report.errors, 'summary': report.stats, 'errors': report.errors}, indent=2))
    else:
        print('Planning validation: ' + ('PASS' if not report.errors else 'FAIL'))
        print(json.dumps(report.stats, sort_keys=True))
        for error in report.errors:
            print('ERROR: ' + error)
    return 1 if report.errors else 0


if __name__ == '__main__':
    sys.exit(main())
