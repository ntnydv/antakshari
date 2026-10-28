#!/usr/bin/env node
/** Offline planning validation. Passing does not certify the application. */
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pathParts, pathsConflict } from './taskctl.mts';

type RecordValue = Record<string, unknown>;
export type PlanTask = RecordValue & { id: string; dependencies?: string[]; owned_paths?: string[]; component?: string; kind?: string };
export type Report = { errors: string[]; stats: Record<string, number> };
const ignored = new Set(['.git', '__pycache__', '.pytest_cache', '.mypy_cache', '.dart_tool', 'node_modules', '.cache', 'build', 'dist']);
const privatePaths = ['orchestration/local-reviews', 'orchestration/local-logs', 'orchestration/.taskctl'];
const secretPatterns: [string, RegExp][] = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9]{20,}_[A-Za-z0-9]{30,}\b/],
  ['Google API key', /\bAIza[A-Za-z0-9_-]{35}\b/],
  ['AWS access key', /\bAKIA[A-Z0-9]{16}\b/],
];
function object(value: unknown): value is RecordValue { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.every(x => typeof x === 'string'); }
function within(root: string, path: string): boolean { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); }
function safeFile(root: string, value: unknown): boolean {
  try {
    pathParts(value);
    const path = realpathSync(resolve(root, value as string));
    return within(root, path) && statSync(path).isFile();
  } catch { return false; }
}
function counts<T>(items: T[]): Map<T, number> {
  const values = new Map<T, number>();
  for (const item of items) values.set(item, (values.get(item) ?? 0) + 1);
  return values;
}
export function dependencyErrors(tasks: PlanTask[]): string[] {
  const errors: string[] = [], ids = tasks.map(t => t.id);
  if (ids.some(id => typeof id !== 'string' || !id)) return ['Every task must have a nonempty string id'];
  for (const [id, count] of counts(ids)) if (count > 1) errors.push(`Duplicate task ID: ${id}`);
  const byId = new Map(tasks.map(t => [t.id, t])), incoming = new Map<string, number>(), outgoing = new Map<string, string[]>();
  for (const id of byId.keys()) { incoming.set(id, 0); outgoing.set(id, []); }
  for (const task of byId.values()) {
    const deps = task.dependencies ?? [];
    if (!strings(deps)) { errors.push(`${task.id}: dependencies must be a string list`); continue; }
    if (deps.length !== new Set(deps).size) errors.push(`${task.id}: repeated dependency`);
    for (const dep of new Set(deps)) {
      if (!byId.has(dep)) errors.push(`${task.id}: missing dependency ${dep}`);
      else { incoming.set(task.id, incoming.get(task.id)! + 1); outgoing.get(dep)!.push(task.id); }
    }
  }
  const ready = [...incoming.keys()].filter(id => incoming.get(id) === 0);
  for (let cursor = 0; cursor < ready.length; cursor++) {
    for (const child of outgoing.get(ready[cursor])!) {
      incoming.set(child, incoming.get(child)! - 1); if (incoming.get(child) === 0) ready.push(child);
    }
  }
  const visited = new Set(ready), blocked = [...byId.keys()].filter(id => !visited.has(id)).sort();
  if (blocked.length) errors.push(`Dependency cycle or cycle-dependent tasks: ${blocked.slice(0, 20).join(', ')}`);
  return errors;
}
export function ownershipErrors(tasks: PlanTask[]): string[] {
  const errors: string[] = [], entries: { id: string; path: string; wildcard: boolean }[] = [];
  for (const task of tasks) {
    if (!Array.isArray(task.owned_paths) || !task.owned_paths.length) { errors.push(`${task.id}: owned_paths must be a nonempty list`); continue; }
    for (const value of task.owned_paths) {
      try {
        const path = pathParts(value).join('/');
        if (!path) throw new Error('Empty path');
        if (task.component !== 'BOOT' && task.kind !== 'bootstrap') entries.push({ id: task.id, path, wildcard: /[*?\[]/.test(path) });
      } catch { errors.push(`${task.id}: unsafe owned path`); }
    }
  }
  const literals = entries.filter(x => !x.wildcard).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const seen = new Set<string>();
  const compare = (a: typeof entries[number], b: typeof entries[number]) => {
    if (a.id === b.id) return;
    const key = [JSON.stringify(a), JSON.stringify(b)].sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    try { if (pathsConflict(a.path, b.path)) errors.push(`Owned path overlap: ${a.id} ${a.path} <> ${b.id} ${b.path}`); }
    catch { errors.push(`Invalid ownership glob: ${a.id} or ${b.id}`); }
  };
  // Literal ownership dominates the backlog. Only equal/prefix paths need pair
  // checks; wildcard ownership is compared against every entry conservatively.
  for (let i = 0; i < literals.length; i++) {
    for (let j = i + 1; j < literals.length && literals[j].path.startsWith(literals[i].path); j++) compare(literals[i], literals[j]);
  }
  for (const wildcard of entries.filter(x => x.wildcard)) for (const entry of entries) compare(wildcard, entry);
  return errors;
}
export function firstDayErrors(tasks: PlanTask[], selected: unknown, expectedCount?: number): string[] {
  if (!strings(selected)) return ['First-day task_ids must be a string list'];
  const errors: string[] = [], chosen = new Set(selected), byId = new Map(tasks.map(t => [t.id, t]));
  if (expectedCount !== undefined && selected.length !== expectedCount) errors.push(`First-day list must contain ${expectedCount} tasks; found ${selected.length}`);
  if (chosen.size !== selected.length) errors.push('First-day list contains duplicate task IDs');
  for (const id of selected) {
    const task = byId.get(id);
    if (!task) { errors.push(`First-day task does not exist: ${id}`); continue; }
    if (!strings(task.dependencies ?? [])) continue;
    for (const dep of task.dependencies ?? []) if (!chosen.has(dep)) errors.push(`First-day closure: ${id} requires omitted ${dep}`);
  }
  return errors;
}
function withoutFences(text: string): { visible: string; balanced: boolean } {
  const visible: string[] = []; let opener: { char: string; length: number } | null = null;
  for (const line of text.split(/\r?\n/)) {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (match) {
      const [, fence, tail] = match;
      if (!opener) opener = { char: fence[0], length: fence.length };
      else if (fence[0] === opener.char && fence.length >= opener.length && !tail.trim()) opener = null;
    } else if (!opener) visible.push(line);
  }
  return { visible: visible.join('\n'), balanced: opener === null };
}
function anchors(text: string): Set<string> {
  const { visible } = withoutFences(text), result = new Set<string>(), occurrences = new Map<string, number>();
  for (const line of visible.split('\n')) {
    const match = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const heading = match[1].replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    const slug = heading.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/ /g, '-');
    const count = occurrences.get(slug) ?? 0;
    result.add(slug + (count ? `-${count}` : '')); occurrences.set(slug, count + 1);
  }
  for (const match of visible.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) result.add(match[1]);
  return result;
}
export function markdownErrors(root: string, path: string, text: string): string[] {
  // macOS exposes /var as a symlink to /private/var. Compare targets against
  // one canonical root without changing the document's relative link base.
  const sourceRelative = relative(resolve(root), resolve(path));
  root = realpathSync(root); path = resolve(root, sourceRelative);
  if (!within(root, path)) return ['Markdown source escapes repository'];
  const errors: string[] = [], label = relative(root, path).split(sep).join('/');
  const { visible, balanced } = withoutFences(text);
  if (!balanced) errors.push(`${label}: unclosed fenced code block`);
  const links = [...visible.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g)].map(m => m[1]);
  links.push(...[...visible.matchAll(/^ {0,3}\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)/gm)].map(m => m[1]));
  for (const raw of links) {
    const destination = raw.replace(/^<|>$/g, '');
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(destination) || destination.startsWith('//')) continue;
    let targetPath: string, fragment: string;
    try {
      const hash = destination.indexOf('#');
      targetPath = decodeURIComponent((hash < 0 ? destination : destination.slice(0, hash)).split('?')[0]);
      fragment = hash < 0 ? '' : decodeURIComponent(destination.slice(hash + 1));
    } catch { errors.push(`${label}: invalid URL encoding in local link`); continue; }
    if (/[*?\[]/.test(targetPath)) { errors.push(`${label}: linked path contains a glob: ${destination}`); continue; }
    const target = targetPath ? (targetPath.startsWith('/') ? resolve(root, '.' + targetPath) : resolve(dirname(path), targetPath)) : path;
    if (!within(root, target)) { errors.push(`${label}: local link escapes repository: ${destination}`); continue; }
    if (!existsSync(target)) { errors.push(`${label}: missing local link target: ${destination}`); continue; }
    if (!within(root, realpathSync(target))) { errors.push(`${label}: local link escapes repository: ${destination}`); continue; }
    if (fragment && statSync(target).isFile() && extname(target).toLowerCase() === '.md') {
      if (!anchors(target === path ? text : readFileSync(target, 'utf8')).has(fragment)) errors.push(`${label}: missing Markdown anchor: ${destination}`);
    }
  }
  return errors;
}
export function modelPolicyErrors(policy: unknown): string[] {
  const allowed = new Set(['muse-voice-transcribe-1.0', 'muse-spark-1.3', 'muse-spark-1.2', 'muse-wonder-1.0', 'muse-image-1.0']);
  const errors: string[] = [];
  function visit(value: unknown, path: string) {
    if (Array.isArray(value)) value.forEach((child, i) => visit(child, `${path}[${i}]`));
    else if (object(value)) for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
    else if (typeof value === 'string' && value.startsWith('muse-') && !allowed.has(value)) errors.push(`${path}: unapproved model ID ${value}`);
  }
  visit(policy, 'policy'); return errors;
}
function readJSON(path: string, report: Report): unknown {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { report.errors.push(`${path}: invalid or missing JSON (contents redacted)`); return null; }
}
function* walk(root: string, path = root): Generator<string> {
  for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = resolve(path, entry.name), rel = relative(root, full).split(sep).join('/');
    if (ignored.has(entry.name) || privatePaths.some(prefix => rel.startsWith(prefix))) continue;
    if (entry.isSymbolicLink()) continue; // Never traverse an external tree or a symlink cycle.
    if (entry.isDirectory()) yield* walk(root, full);
    else if (entry.isFile()) yield full;
  }
}
export function validate(rootInput: string, expectedTasks = 2056, expectedFirstDay = 240): Report {
  const report: Report = { errors: [], stats: {} };
  let root: string;
  try { root = realpathSync(rootInput); } catch { report.errors.push('Validation root does not exist'); return report; }
  if (!safeFile(root, 'backlog/index.json')) { report.errors.push('Missing or unsafe backlog/index.json'); return report; }
  const index = readJSON(resolve(root, 'backlog/index.json'), report);
  if (!object(index) || !Array.isArray(index.tasks) || !Array.isArray(index.components)) { report.errors.push('Backlog must contain tasks and components arrays'); return report; }
  if ([...index.tasks, ...index.components].some(item => !object(item))) { report.errors.push('Every task and component must be an object'); return report; }
  const tasks = index.tasks as PlanTask[], components = index.components as RecordValue[];
  if (index.schema_version !== 1) report.errors.push('Backlog schema_version must be 1');
  if (tasks.length !== expectedTasks || index.task_count !== tasks.length) report.errors.push(`Task count mismatch: expected ${expectedTasks}, found ${tasks.length}, declared ${index.task_count}`);
  if (components.length !== 32) report.errors.push(`Expected 32 components; found ${components.length}`);
  const componentIds = components.map(c => c.code);
  if (!strings(componentIds) || componentIds.some(c => !c)) report.errors.push('Every component needs a nonempty code');
  if (new Set(componentIds).size !== componentIds.length) report.errors.push('Duplicate component codes');
  const rounds = new Set(componentIds.filter((c): c is string => typeof c === 'string' && c.startsWith('R')));
  if (rounds.size !== 10 || Array.from({ length: 10 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`).some(r => !rounds.has(r))) report.errors.push('Round components must be exactly R01 through R10');
  report.errors.push(...dependencyErrors(tasks), ...ownershipErrors(tasks));
  const titles = counts(tasks.map(t => JSON.stringify([t.component, typeof t.title === 'string' ? t.title.trim().toLowerCase() : ''])));
  for (const [key, count] of titles) if (count > 1) report.errors.push(`Duplicate title within component: ${key}`);
  for (const item of [...tasks, ...components]) if (!safeFile(root, item.design)) report.errors.push(`${item.id ?? item.code}: missing or unsafe design`);
  for (const task of tasks) {
    if (task.component !== 'BOOT' && !componentIds.includes(task.component)) report.errors.push(`${task.id}: unknown component`);
    if (!safeFile(root, task.card_path)) report.errors.push(`${task.id}: missing or unsafe task card`);
  }
  const firstDay = safeFile(root, 'backlog/first-day.json') ? readJSON(resolve(root, 'backlog/first-day.json'), report) : null;
  const selected = object(firstDay) ? firstDay.task_ids : null;
  report.errors.push(...firstDayErrors(tasks, selected, expectedFirstDay));
  if (strings(selected)) for (const task of tasks) if (Boolean(task.first_day) !== selected.includes(task.id)) report.errors.push(`${task.id}: first_day flag disagrees with selected list`);
  if (!safeFile(root, 'config/model-policy.json')) report.errors.push('Missing or unsafe model policy');
  else {
    const policy = readJSON(resolve(root, 'config/model-policy.json'), report);
    report.errors.push(...modelPolicyErrors(policy));
    if (!object(policy) || policy.dataMode !== 'standard' || policy.liveCallsRequireServerSecret !== true || policy.rawTranscriptLogging !== false) report.errors.push('Model policy requires Standard mode, server secrets and disabled raw transcript logging');
  }
  let jsonCount = 0, markdownCount = 0, checkedFiles = 0;
  for (const path of walk(root)) {
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)); }
    catch { continue; }
    checkedFiles++;
    const label = relative(root, path).split(sep).join('/');
    for (const [name, pattern] of secretPatterns) if (pattern.test(text)) report.errors.push(`${label}: possible committed ${name}; value redacted`);
    if (extname(path).toLowerCase() === '.json') {
      jsonCount++; readJSON(path, report);
    } else if (extname(path).toLowerCase() === '.md') { markdownCount++; report.errors.push(...markdownErrors(root, path, text)); }
  }
  report.stats = { tasks: tasks.length, components: components.length, rounds: rounds.size, first_day_candidates: strings(selected) ? selected.length : 0,
    dependency_edges: tasks.reduce((n, t) => n + (Array.isArray(t.dependencies) ? t.dependencies.length : 0), 0),
    json_files: jsonCount, markdown_files: markdownCount, text_files_scanned: checkedFiles, errors: report.errors.length };
  return report;
}
export function main(argv: string[]): number {
  try {
    let root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), expectedTasks = 2056, expectedFirstDay = 240, json = false;
    const seen = new Set<string>();
    for (let i = 0; i < argv.length; i++) {
      const key = argv[i]; if (seen.has(key)) throw new Error('Duplicate option'); seen.add(key);
      if (key === '--json') { json = true; continue; }
      if (!['--root', '--expected-tasks', '--expected-first-day'].includes(key) || argv[i + 1] === undefined) throw new Error('Unknown or incomplete option');
      const value = argv[++i];
      if (key === '--root') root = value;
      else { const count = Number(value); if (!Number.isSafeInteger(count) || count < 0) throw new Error('Expected count must be a nonnegative integer');
        if (key === '--expected-tasks') expectedTasks = count; else expectedFirstDay = count; }
    }
    const report = validate(root, expectedTasks, expectedFirstDay);
    if (json) console.log(JSON.stringify({ ok: !report.errors.length, summary: report.stats, errors: report.errors }, null, 2));
    else { console.log(`Planning validation: ${report.errors.length ? 'FAIL' : 'PASS'}`); console.log(JSON.stringify(report.stats)); for (const error of report.errors) console.log(`ERROR: ${error}`); }
    return report.errors.length ? 1 : 0;
  } catch (error) { console.error(`validate-plan: ${error instanceof Error ? error.message : 'Validation failed'}`); return 2; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
