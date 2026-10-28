#!/usr/bin/env python3
"""Local task queue and verification helper.

This tool does not contact GitHub. An orchestrator review is a local attestation,
not proof of reviewer identity, commit ancestry, merge status, or passing CI.
The orchestrator must verify those facts externally before ingesting it and
commit state/queue changes together. File locking only coordinates this checkout.
Worker result files are deliberately not ingested as completion evidence.
"""

from __future__ import annotations

import argparse
from collections import Counter, deque
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import fnmatch
from functools import lru_cache
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import subprocess
import sys
import tempfile


ACTIVE_STATUSES = frozenset({
    "dispatched", "leased", "in_progress", "implemented", "review_pending",
    "needs_review",
})
MAX_ACTIVE = 5
LEASE_MINUTES = 120


class TaskError(Exception):
    """An invalid or blocked task operation; callers should return nonzero."""


def utc_now():
    return datetime.now(timezone.utc)


def timestamp(value):
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_timestamp(value):
    if not isinstance(value, str):
        raise TaskError("Expected an ISO-8601 timestamp with timezone")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise TaskError(f"Invalid timestamp: {value}") from error
    if parsed.tzinfo is None:
        raise TaskError("Timestamps must include a timezone")
    return parsed.astimezone(timezone.utc)


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise TaskError(f"Cannot read JSON {path}: {error}") from error


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent, delete=False,
            prefix=f".{path.name}.", suffix=".tmp",
        ) as stream:
            temporary = Path(stream.name)
            json.dump(value, stream, indent=2, ensure_ascii=False)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


@contextmanager
def checkout_lock(root):
    """Protect read-modify-write in one checkout, not across Git clones."""
    lock_path = root / "orchestration/.taskctl.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+b") as stream:
        if os.name == "nt":
            import msvcrt
            stream.seek(0)
            if not stream.read(1):
                stream.write(b"0")
                stream.flush()
            stream.seek(0)
            msvcrt.locking(stream.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                stream.seek(0)
                msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(stream.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(stream.fileno(), fcntl.LOCK_UN)


def path_parts(pattern):
    if not isinstance(pattern, str) or not pattern or "\\" in pattern:
        raise TaskError(f"Invalid repository-relative path: {pattern!r}")
    path = PurePosixPath(pattern)
    if path.is_absolute() or ".." in path.parts:
        raise TaskError(f"Path escapes the repository: {pattern}")
    return path.parts


def segments_overlap(left, right):
    """Exact for literal-vs-glob; conservative for two wildcard segments."""
    meta = "*?["
    left_glob = any(char in left for char in meta)
    right_glob = any(char in right for char in meta)
    if not left_glob:
        return fnmatch.fnmatchcase(left, right)
    if not right_glob:
        return fnmatch.fnmatchcase(right, left)
    left_prefix = re.split(r"[\*\?\[]", left, maxsplit=1)[0]
    right_prefix = re.split(r"[\*\?\[]", right, maxsplit=1)[0]
    return left_prefix.startswith(right_prefix) or right_prefix.startswith(left_prefix)


def paths_conflict(left, right):
    """Treat owned directories as prefixes and ** as recursive ownership.

    Ambiguous wildcard intersections conflict conservatively. Prefix comparison
    is segment-based, so src/foo and src/foobar do not collide.
    """
    a, b = path_parts(left), path_parts(right)

    @lru_cache(maxsize=None)
    def overlap(i, j):
        if i == len(a) or j == len(b):
            return True
        if a[i] == "**":
            return overlap(i + 1, j) or overlap(i, j + 1)
        if b[j] == "**":
            return overlap(i, j + 1) or overlap(i + 1, j)
        return segments_overlap(a[i], b[j]) and overlap(i + 1, j + 1)

    return overlap(0, 0)


def tasks_conflict(left, right):
    return any(paths_conflict(a, b)
               for a in left.get("owned_paths", [])
               for b in right.get("owned_paths", []))


def check_limit(limit):
    if not 1 <= limit <= MAX_ACTIVE:
        raise TaskError("--limit must be between 1 and 5")


class TaskRepository:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.index_path = self.root / "backlog/index.json"
        self.state_path = self.root / "orchestration/state.json"
        self.queue_path = self.root / "orchestration/queue.json"

    def load(self):
        index, state = read_json(self.index_path), read_json(self.state_path)
        if not isinstance(index, dict) or not isinstance(index.get("tasks"), list):
            raise TaskError("backlog/index.json must contain a tasks array")
        if not isinstance(state, dict) or not isinstance(state.get("tasks"), dict):
            raise TaskError("orchestration/state.json must contain a tasks map")
        tasks = {}
        for task in index["tasks"]:
            task_id = task.get("id") if isinstance(task, dict) else None
            if not isinstance(task_id, str) or not task_id or task_id in tasks:
                raise TaskError(f"Invalid or duplicate task ID: {task_id}")
            tasks[task_id] = task
            if not isinstance(task.get("owned_paths"), list) or not task["owned_paths"]:
                raise TaskError(f"{task_id}: owned_paths must be nonempty")
            for path in task["owned_paths"]:
                path_parts(path)
        indegree, children = {}, {task_id: [] for task_id in tasks}
        for task_id, task in tasks.items():
            dependencies = task.get("dependencies", [])
            if not isinstance(dependencies, list) or len(set(dependencies)) != len(dependencies):
                raise TaskError(f"{task_id}: invalid dependencies")
            for dependency in dependencies:
                if dependency not in tasks:
                    raise TaskError(f"{task_id}: unknown dependency {dependency}")
                children[dependency].append(task_id)
            indegree[task_id] = len(dependencies)
        roots = deque(task_id for task_id, count in indegree.items() if count == 0)
        seen = 0
        while roots:
            task_id = roots.popleft()
            seen += 1
            for child in children[task_id]:
                indegree[child] -= 1
                if indegree[child] == 0:
                    roots.append(child)
        if seen != len(tasks):
            raise TaskError("Dependency graph contains a cycle")
        unknown_active = [task_id for task_id, progress in state["tasks"].items()
                          if task_id not in tasks and progress.get("status") in ACTIVE_STATUSES]
        if unknown_active:
            raise TaskError(f"Unknown active tasks in state: {unknown_active}")
        return tasks, state

    @staticmethod
    def progress(state, task_id):
        return state["tasks"].get(task_id, {"status": "pending", "attempts": 0})

    @staticmethod
    def expired(progress, now):
        expiry = progress.get("lease_expires_at")
        return (progress.get("status") in ACTIVE_STATUSES
                and progress.get("status") != "needs_review"
                and expiry is not None and parse_timestamp(expiry) <= now)

    def select(self, tasks, state, limit):
        check_limit(limit)
        active = [task for task_id, task in tasks.items()
                  if self.progress(state, task_id).get("status") in ACTIVE_STATUSES]
        capacity = min(limit, max(0, MAX_ACTIVE - len(active)))
        ordered = sorted(tasks.values(), key=lambda task: (
            not task.get("first_day", False), task.get("wave", 999999),
            task.get("priority", "P9"), task["id"],
        ))
        selected = []
        for task in ordered:
            if len(selected) >= capacity:
                break
            if self.progress(state, task["id"]).get("status", "pending") != "pending":
                continue
            if any(self.progress(state, dependency).get("status") != "done"
                   for dependency in task.get("dependencies", [])):
                continue
            if any(tasks_conflict(task, other) for other in active + selected):
                continue
            selected.append(task)
        return selected

    def ready(self, limit=5):
        tasks, state = self.load()
        return self.select(tasks, state, limit)

    def show(self, task_id):
        tasks, state = self.load()
        if task_id not in tasks:
            raise TaskError(f"Unknown task: {task_id}")
        return {"task": tasks[task_id], "progress": self.progress(state, task_id)}

    def status(self):
        tasks, state = self.load()
        now = utc_now()
        counts = Counter(self.progress(state, task_id).get("status", "pending") for task_id in tasks)
        return {"total": len(tasks), "revision": state.get("revision", 0),
                "counts": dict(sorted(counts.items())),
                "expired_active_ids": [task_id for task_id in tasks
                                       if self.expired(self.progress(state, task_id), now)],
                "ready_ids": [task["id"] for task in self.select(tasks, state, 5)]}

    def dispatch(self, batch_id, limit=5, now=None):
        check_limit(limit)
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}", batch_id):
            raise TaskError("Invalid batch ID")
        now = now or utc_now()
        with checkout_lock(self.root):
            tasks, state = self.load()
            changed = False
            for task_id, progress in state["tasks"].items():
                if self.expired(progress, now):
                    progress.update(status="needs_review", lease_review_at=timestamp(now),
                                    review_reason="lease_expired_do_not_requeue")
                    changed = True
            if changed:
                state["revision"] = state.get("revision", 0) + 1
                atomic_json(self.state_path, state)

            queue = read_json(self.queue_path) if self.queue_path.exists() else None
            previous = self.root / "orchestration/batches" / f"{batch_id}.json"
            same_batch_ids = [task_id for task_id in tasks
                              if self.progress(state, task_id).get("batch_id") == batch_id]
            if same_batch_ids:
                # Recover an interrupted state-first write, without issuing new work.
                batch = read_json(previous) if previous.exists() else self.make_batch(batch_id, [tasks[x] for x in same_batch_ids], now)
                batch["status"] = "completed" if all(self.progress(state, x).get("status") == "done" for x in same_batch_ids) else "dispatched"
                if any(self.progress(state, x).get("status") == "needs_review" for x in same_batch_ids):
                    batch["status"] = "needs_review"
                if queue is None or queue.get("batch_id") == batch_id:
                    atomic_json(self.queue_path, batch)
                atomic_json(previous, batch)
                return batch
            if previous.exists():
                raise TaskError("Batch ID already exists; use a new batch ID")
            if queue and queue.get("task_ids"):
                unfinished = [task_id for task_id in queue["task_ids"]
                              if self.progress(state, task_id).get("status") != "done"]
                if unfinished and queue.get("batch_id") != batch_id:
                    raise TaskError("Current queue is unfinished; it cannot be replaced")
            selected = self.select(tasks, state, limit)
            if not selected:
                raise TaskError("No dependency-ready, file-disjoint task slots are available")
            if queue and queue.get("batch_id") == batch_id and queue.get("status") == "ready":
                offered = queue.get("task_ids", [])
                if offered != [task["id"] for task in selected]:
                    raise TaskError("Existing ready queue differs from selection; orchestrator review required")
            batch = self.make_batch(batch_id, selected, now)
            for task in selected:
                progress = dict(self.progress(state, task["id"]))
                progress.update(status="dispatched", batch_id=batch_id,
                                attempts=progress.get("attempts", 0) + 1,
                                dispatched_at=timestamp(now),
                                lease_expires_at=timestamp(now + timedelta(minutes=LEASE_MINUTES)))
                state["tasks"][task["id"]] = progress
            state["revision"] = state.get("revision", 0) + 1
            atomic_json(self.state_path, state)
            atomic_json(previous, batch)
            atomic_json(self.queue_path, batch)
            return batch

    @staticmethod
    def make_batch(batch_id, selected, now):
        return {"schema_version": 1, "batch_id": batch_id, "status": "dispatched",
                "worker": "opencode", "max_concurrency": 5, "cadence_minutes": 30,
                "baseline_ref": "main", "baseline_sha": None,
                "created_at": timestamp(now),
                "lease_expires_at": timestamp(now + timedelta(minutes=LEASE_MINUTES)),
                "instructions": "Resolve main to an immutable commit before work. Record base SHA and evidence. Worker results do not complete tasks.",
                "task_ids": [task["id"] for task in selected],
                "task_cards": [task.get("card_path") for task in selected]}

    def verify(self, task_id, timeout=300):
        task = self.show(task_id)["task"]
        missing = []
        for required in task.get("required_outputs", []):
            path_parts(required)
            matches = list(self.root.glob(required))
            if not matches:
                missing.append(required)
            for match in matches:
                if not match.resolve().is_relative_to(self.root):
                    raise TaskError(f"Required output resolves outside repository: {required}")
        if missing:
            raise TaskError(f"{task_id}: missing required outputs: {', '.join(missing)}")
        commands = task.get("verification_commands", [])
        if not isinstance(commands, list) or not commands:
            raise TaskError(f"{task_id}: no executable verification_commands; verification_notes are descriptive only")
        cwd = (self.root / task.get("verification_cwd", ".")).resolve()
        if not cwd.is_relative_to(self.root) or not cwd.is_dir():
            raise TaskError(f"{task_id}: invalid or missing verification cwd: {cwd}")
        results = []
        for command in commands:
            argv = shlex.split(command) if isinstance(command, str) else command
            if not isinstance(argv, list) or not argv or not all(isinstance(arg, str) and arg for arg in argv):
                raise TaskError(f"{task_id}: verification command must be a nonempty argv list")
            if any(Path(arg).name == "taskctl.py" for arg in argv) and "verify" in argv:
                raise TaskError(f"{task_id}: recursive taskctl verify is not verification")
            if any(arg in {"&&", "||", ";", "|", ">", ">>"} for arg in argv):
                raise TaskError("Verification commands must be separate argv arrays, not shell pipelines")
            try:
                result = subprocess.run(argv, cwd=cwd, capture_output=True, text=True,
                                        timeout=timeout, check=False)
            except FileNotFoundError as error:
                raise TaskError(f"{task_id}: verification tool not found: {argv[0]}") from error
            except subprocess.TimeoutExpired as error:
                raise TaskError(f"{task_id}: verification timed out after {timeout}s: {argv}") from error
            entry = {"argv": argv, "cwd": str(cwd), "returncode": result.returncode,
                     "stdout": result.stdout[-12000:], "stderr": result.stderr[-12000:]}
            results.append(entry)
            if result.returncode:
                raise TaskError(f"{task_id}: verification failed ({result.returncode}): {shlex.join(argv)}\n{entry['stdout']}\n{entry['stderr']}")
        return {"task_id": task_id, "verified": True, "commands": results,
                "note": "Local verification only; task status is unchanged."}

    def ingest_review(self, review_path):
        review = read_json(Path(review_path))
        if not isinstance(review, dict) or review.get("reviewer_role") != "orchestrator":
            raise TaskError("Only an orchestrator review attestation is accepted; worker results do not mark done")
        if review.get("checks_verified") is not True or review.get("scope_verified") is not True:
            raise TaskError("checks_verified and scope_verified must both be true")
        for field in ("base_sha", "merge_sha"):
            if not isinstance(review.get(field), str) or not re.fullmatch(r"[0-9a-fA-F]{40}|[0-9a-fA-F]{64}", review[field]):
                raise TaskError(f"{field} must be a full commit SHA")
        reviewed_at = parse_timestamp(review.get("reviewed_at"))
        if reviewed_at > utc_now() + timedelta(minutes=5):
            raise TaskError("reviewed_at is in the future")
        with checkout_lock(self.root):
            tasks, state = self.load()
            task_id = review.get("task_id")
            if task_id not in tasks:
                raise TaskError(f"Unknown review task: {task_id}")
            progress = dict(self.progress(state, task_id))
            if progress.get("status") == "done":
                if progress.get("merge_sha") == review["merge_sha"]:
                    return {"task_id": task_id, "status": "done", "unchanged": True}
                raise TaskError("Task is already done at a different merge SHA")
            unmet = [dependency for dependency in tasks[task_id].get("dependencies", [])
                     if self.progress(state, dependency).get("status") != "done"]
            if unmet:
                raise TaskError(f"Cannot complete task with unmet dependencies: {unmet}")
            progress.update(status="done", base_sha=review["base_sha"],
                            merge_sha=review["merge_sha"], reviewed_at=timestamp(reviewed_at),
                            reviewer_role="orchestrator", checks_verified=True, scope_verified=True)
            state["tasks"][task_id] = progress
            state["revision"] = state.get("revision", 0) + 1
            atomic_json(self.state_path, state)
            if self.queue_path.exists():
                queue = read_json(self.queue_path)
                ids = queue.get("task_ids", [])
                if ids and all(self.progress(state, candidate).get("status") == "done" for candidate in ids):
                    queue.update(status="completed", completed_at=timestamp(utc_now()))
                    atomic_json(self.queue_path, queue)
                    batch_id = queue.get("batch_id", "")
                    if re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}", batch_id):
                        atomic_json(self.root / "orchestration/batches" / f"{batch_id}.json", queue)
            return {"task_id": task_id, "status": "done", "merge_sha": review["merge_sha"],
                    "note": "Accepted local orchestrator attestation; GitHub proof must be verified externally."}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("show").add_argument("task_id")
    commands.add_parser("status")
    commands.add_parser("ready").add_argument("--limit", type=int, default=5)
    dispatch = commands.add_parser("dispatch")
    dispatch.add_argument("--batch-id", required=True)
    dispatch.add_argument("--limit", type=int, default=5)
    verify = commands.add_parser("verify")
    verify.add_argument("task_id")
    verify.add_argument("--timeout", type=int, default=300)
    commands.add_parser("ingest-review").add_argument("path", type=Path)
    args = parser.parse_args(argv)
    repository = TaskRepository(args.root)
    try:
        if args.command == "show":
            result = repository.show(args.task_id)
        elif args.command == "status":
            result = repository.status()
        elif args.command == "ready":
            ready = repository.ready(args.limit)
            result = {"task_ids": [task["id"] for task in ready], "tasks": ready}
        elif args.command == "dispatch":
            result = repository.dispatch(args.batch_id, args.limit)
        elif args.command == "verify":
            if args.timeout <= 0:
                raise TaskError("--timeout must be positive")
            result = repository.verify(args.task_id, args.timeout)
        else:
            result = repository.ingest_review(args.path)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except (TaskError, OSError, TypeError, ValueError) as error:
        print(f"taskctl: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
