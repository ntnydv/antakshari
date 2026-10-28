"""Behavior tests for queue safety, verification and review acceptance."""

from datetime import datetime, timedelta, timezone
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("taskctl", REPO_ROOT / "tools/taskctl.py")
taskctl = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(taskctl)


def task(task_id, paths=None, dependencies=None, **overrides):
    value = {"id": task_id, "title": task_id, "dependencies": dependencies or [],
             "owned_paths": paths or [f"src/{task_id}.py"],
             "required_outputs": [], "verification_commands": [],
             "verification_cwd": ".", "wave": 0, "first_day": True,
             "priority": "P0", "stage": "I", "card_path": f"backlog/{task_id}.md"}
    value.update(overrides)
    return value


class RepositoryCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.repository = taskctl.TaskRepository(self.root)

    def seed(self, tasks, progress=None, queue=None):
        taskctl.atomic_json(self.root / "backlog/index.json", {"tasks": tasks})
        states = {item["id"]: {"status": "pending", "attempts": 0} for item in tasks}
        states.update(progress or {})
        taskctl.atomic_json(self.root / "orchestration/state.json",
                            {"schema_version": 1, "revision": 1, "tasks": states})
        if queue:
            taskctl.atomic_json(self.root / "orchestration/queue.json", queue)

    def write(self, relative, content="value = 1\n"):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def ids(self, result):
        return [item["id"] for item in result]

    def review(self, task_id="A", **overrides):
        value = {"task_id": task_id, "reviewer_role": "orchestrator",
                 "base_sha": "a" * 40, "merge_sha": "b" * 40,
                 "checks_verified": True, "scope_verified": True,
                 "reviewed_at": taskctl.timestamp(taskctl.utc_now())}
        value.update(overrides)
        path = self.root / "review.json"
        taskctl.atomic_json(path, value)
        return path

    def test_ready_requires_done_dependencies_and_is_read_only(self):
        self.seed([task("A"), task("B", dependencies=["A"]), task("C")])
        before = self.repository.state_path.read_bytes()
        self.assertEqual(self.ids(self.repository.ready()), ["A", "C"])
        self.assertEqual(before, self.repository.state_path.read_bytes())
        self.repository.ingest_review(self.review())
        self.assertEqual(self.ids(self.repository.ready()), ["B", "C"])

    def test_cycles_and_unknown_dependencies_fail(self):
        self.seed([task("A", dependencies=["B"]), task("B", dependencies=["A"])])
        with self.assertRaisesRegex(taskctl.TaskError, "cycle"):
            self.repository.ready()
        self.seed([task("A", dependencies=["missing"])])
        with self.assertRaisesRegex(taskctl.TaskError, "unknown dependency"):
            self.repository.ready()

    def test_segment_prefix_and_glob_conflicts(self):
        for a, b in [
            ("src/a/**", "src/a/file.py"), ("src/a", "src/a/child/file.py"),
            ("src/*/model.ts", "src/rooms/model.ts"),
            ("src/**/model.ts", "src/rooms/nested/model.ts"),
            ("src/a*.ts", "src/ab*.ts"), ("src/exact.py", "src/exact.py"),
        ]:
            with self.subTest(a=a, b=b):
                self.assertTrue(taskctl.paths_conflict(a, b))
                self.assertTrue(taskctl.paths_conflict(b, a))
        for a, b in [("src/a", "src/another"), ("src/*.ts", "src/file.py"),
                     ("src/a*.ts", "src/b*.ts"), ("src/a.py", "test/a.py")]:
            with self.subTest(a=a, b=b):
                self.assertFalse(taskctl.paths_conflict(a, b))

    def test_ready_batch_is_file_disjoint(self):
        self.seed([task("A", ["src/shared/**"]), task("B", ["src/shared/file.py"]), task("C")])
        self.assertEqual(self.ids(self.repository.ready()), ["A", "C"])

    def test_active_implemented_and_needs_review_keep_ownership(self):
        for status in ["leased", "in_progress", "implemented", "needs_review"]:
            with self.subTest(status=status):
                self.seed([task("A", ["src/shared/**"]), task("B", ["src/shared/f.py"]), task("C")],
                          {"A": {"status": status}})
                self.assertEqual(self.ids(self.repository.ready()), ["C"])

    def test_active_count_reduces_capacity(self):
        tasks = [task(str(i)) for i in range(9)]
        self.seed(tasks, {str(i): {"status": "implemented"} for i in range(4)})
        self.assertEqual(len(self.repository.ready()), 1)

    def test_five_task_limit_and_invalid_limit(self):
        self.seed([task(str(i)) for i in range(9)])
        self.assertEqual(len(self.repository.ready()), 5)
        with self.assertRaisesRegex(taskctl.TaskError, "between 1 and 5"):
            self.repository.ready(6)
        with self.assertRaisesRegex(taskctl.TaskError, "between 1 and 5"):
            self.repository.dispatch("too-many", 6)

    def test_dispatch_creates_120_minute_leases_and_is_idempotent(self):
        self.seed([task(str(i)) for i in range(8)])
        now = datetime(2026, 10, 27, 10, tzinfo=timezone.utc)
        batch = self.repository.dispatch("batch-1", now=now)
        self.assertEqual(len(batch["task_ids"]), 5)
        state = taskctl.read_json(self.repository.state_path)
        for task_id in batch["task_ids"]:
            progress = state["tasks"][task_id]
            self.assertEqual(progress["status"], "dispatched")
            self.assertEqual(taskctl.parse_timestamp(progress["lease_expires_at"]), now + timedelta(minutes=120))
        again = self.repository.dispatch("batch-1", now=now + timedelta(minutes=1))
        self.assertEqual(batch["task_ids"], again["task_ids"])
        state = taskctl.read_json(self.repository.state_path)
        self.assertTrue(all(state["tasks"][task_id]["attempts"] == 1 for task_id in batch["task_ids"]))
        with self.assertRaisesRegex(taskctl.TaskError, "unfinished"):
            self.repository.dispatch("batch-2", now=now + timedelta(minutes=1))

    def test_dispatch_activates_initial_ready_queue(self):
        self.seed([task("A"), task("B")], queue={"batch_id": "initial", "status": "ready", "task_ids": ["A", "B"]})
        batch = self.repository.dispatch("initial")
        self.assertEqual(batch["status"], "dispatched")
        self.assertEqual(batch["task_ids"], ["A", "B"])

    def test_expired_lease_requires_review_never_requeues(self):
        self.seed([task("A", ["src/shared/**"]), task("B", ["src/shared/f.py"])])
        now = datetime(2026, 10, 27, 10, tzinfo=timezone.utc)
        self.repository.dispatch("batch-1", now=now)
        result = self.repository.dispatch("batch-1", now=now + timedelta(minutes=121))
        state = taskctl.read_json(self.repository.state_path)
        self.assertEqual(state["tasks"]["A"]["status"], "needs_review")
        self.assertEqual(result["status"], "needs_review")
        self.assertEqual(self.repository.ready(), [])

    def test_review_completion_closes_queue_and_does_not_redispatch(self):
        self.seed([task("A"), task("B", dependencies=["A"])])
        self.repository.dispatch("batch-1")
        self.repository.ingest_review(self.review())
        self.assertEqual(taskctl.read_json(self.repository.queue_path)["status"], "completed")
        old = self.repository.dispatch("batch-1")
        self.assertEqual(old["status"], "completed")
        new = self.repository.dispatch("batch-2")
        self.assertEqual(new["task_ids"], ["B"])

    def test_worker_result_cannot_complete_task(self):
        self.seed([task("A")])
        path = self.review(reviewer_role="worker", status="completed")
        with self.assertRaisesRegex(taskctl.TaskError, "orchestrator review"):
            self.repository.ingest_review(path)
        self.assertEqual(self.repository.show("A")["progress"]["status"], "pending")

    def test_review_checks_scope_sha_and_dependencies(self):
        self.seed([task("A"), task("B", dependencies=["A"])])
        for changes in [{"checks_verified": False}, {"scope_verified": 1}, {"merge_sha": "short"},
                        {"reviewed_at": "yesterday"}]:
            with self.subTest(changes=changes):
                with self.assertRaises(taskctl.TaskError):
                    self.repository.ingest_review(self.review(**changes))
        with self.assertRaisesRegex(taskctl.TaskError, "unmet dependencies"):
            self.repository.ingest_review(self.review("B"))

    def test_missing_output_fails_before_command_runs(self):
        self.seed([task("A", required_outputs=["absent.py"],
                        verification_commands=[[sys.executable, "-c", "raise SystemExit(0)"]])])
        with self.assertRaisesRegex(taskctl.TaskError, "missing required outputs"):
            self.repository.verify("A")

    def test_empty_commands_and_notes_do_not_false_green(self):
        self.seed([task("A", verification_notes=["python3 tools/taskctl.py verify A"])])
        with self.assertRaisesRegex(taskctl.TaskError, "no executable verification_commands"):
            self.repository.verify("A")

    def test_missing_tool_and_failed_command_are_nonzero_failures(self):
        self.seed([task("A", verification_commands=[["antakshari-tool-that-does-not-exist-922791"]])])
        with self.assertRaisesRegex(taskctl.TaskError, "tool not found"):
            self.repository.verify("A")
        self.seed([task("A", verification_commands=[[sys.executable, "-c", "raise SystemExit(7)"]])])
        with self.assertRaisesRegex(taskctl.TaskError, "verification failed \\(7\\)"):
            self.repository.verify("A")

    def test_verify_runs_in_actual_cwd_without_marking_done(self):
        self.write("apps/mobile/check.py", "from pathlib import Path\nassert Path.cwd().name == 'mobile'\nprint('cwd checked')\n")
        self.seed([task("A", required_outputs=["apps/mobile/check.py"], verification_cwd="apps/mobile",
                        verification_commands=[[sys.executable, "check.py"]])])
        result = self.repository.verify("A")
        self.assertTrue(result["verified"])
        self.assertIn("cwd checked", result["commands"][0]["stdout"])
        self.assertEqual(self.repository.show("A")["progress"]["status"], "pending")

    def test_recursive_verification_and_escaping_paths_fail(self):
        self.seed([task("A", verification_commands=[[sys.executable, "tools/taskctl.py", "verify", "A"]])])
        with self.assertRaisesRegex(taskctl.TaskError, "recursive"):
            self.repository.verify("A")
        self.seed([task("A", verification_cwd="..", verification_commands=[[sys.executable, "-V"]])])
        with self.assertRaisesRegex(taskctl.TaskError, "cwd"):
            self.repository.verify("A")
        with self.assertRaisesRegex(taskctl.TaskError, "escapes"):
            taskctl.paths_conflict("../outside", "src/inside")

    def test_status_counts_current_states(self):
        self.seed([task("A"), task("B"), task("C")], {"A": {"status": "done"}, "B": {"status": "implemented"}})
        self.assertEqual(self.repository.status()["counts"], {"done": 1, "implemented": 1, "pending": 1})

    def test_python_runner_rejects_zero_tests_and_missing_files(self):
        empty = self.write("test_empty.py", "CONSTANT = 3\n")
        for path in [empty, self.root / "test_missing.py"]:
            with self.subTest(path=path):
                result = subprocess.run([sys.executable, str(REPO_ROOT / "tools/run_python_tests.py"), str(path)],
                                        capture_output=True, text=True, check=False)
                self.assertNotEqual(result.returncode, 0)

    def test_python_runner_runs_hyphenated_directory_and_fails_bad_assertion(self):
        good = self.write("hyphen-name/test_good.py", "import unittest\nclass Good(unittest.TestCase):\n def test_it(self): self.assertEqual(2 + 2, 4)\n")
        runner = str(REPO_ROOT / "tools/run_python_tests.py")
        result = subprocess.run([sys.executable, runner, str(good.parent)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.write("hyphen-name/test_bad.py", "import unittest\nclass Bad(unittest.TestCase):\n def test_it(self): self.assertTrue(False)\n")
        result = subprocess.run([sys.executable, runner, str(good.parent)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1, result.stderr)


if __name__ == "__main__":
    unittest.main()
