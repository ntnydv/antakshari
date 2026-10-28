"""Compatibility checks; queue behavior tests now run in Node/TypeScript."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = Path(__file__).resolve().parents[1]


class CompatibilityCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.write("backlog/index.json", json.dumps({"tasks": [{"id": "A", "owned_paths": ["src/a.ts"], "dependencies": []}]}))
        self.write("orchestration/state.json", json.dumps({"revision": 1, "tasks": {}}))

    def write(self, relative, content):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def cli(self, *args, env=None):
        return subprocess.run([sys.executable, str(REPO_ROOT / "tools/taskctl.py"), "--root", str(self.root), *args],
                              capture_output=True, text=True, env=env, check=False)

    def test_pinned_python_command_delegates_status_and_errors(self):
        result = self.cli("status")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["ready_ids"], ["A"])
        self.assertEqual(self.cli("show", "missing").returncode, 2)

    def test_python_dispatch_uses_same_typescript_lock(self):
        self.write("orchestration/.taskctl-write.lock/owner.json", "{}")
        result = self.cli("dispatch", "--batch-id", "test", "--baseline-sha", "a" * 40)
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn("writer lock", result.stderr)
        self.assertEqual(json.loads((self.root / "orchestration/state.json").read_text())["tasks"], {})

    def test_missing_node_has_no_python_mutation_fallback(self):
        env = dict(os.environ, ANTAKSHARI_NODE=str(self.root / "missing-node"))
        result = self.cli("dispatch", "--batch-id", "test", "--baseline-sha", "a" * 40, env=env)
        self.assertEqual(result.returncode, 2)
        self.assertIn("Node >=22.18 is required", result.stderr)
        self.assertEqual(json.loads((self.root / "orchestration/state.json").read_text())["tasks"], {})

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
