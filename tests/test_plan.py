"""Pinned validator CLI compatibility; behavioral tests live in TypeScript."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ValidatorCompatibilityTests(unittest.TestCase):
    def test_pinned_python_cli_validates_published_plan(self):
        result = subprocess.run([sys.executable, str(ROOT / "tools/validate_plan.py"), "--json"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertTrue(report["ok"])
        self.assertEqual(report["summary"]["tasks"], 2056)

    def test_missing_plan_is_not_success(self):
        with tempfile.TemporaryDirectory() as root:
            result = subprocess.run([sys.executable, str(ROOT / "tools/validate_plan.py"), "--root", root, "--json"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1, result.stderr)
            self.assertFalse(json.loads(result.stdout)["ok"])

if __name__ == "__main__":
    unittest.main()
