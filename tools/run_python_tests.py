#!/usr/bin/env python3
"""Run unittest files/directories, failing when no tests are collected."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode = True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args(argv)
    files = set()
    for path in args.paths:
        path = path.resolve()
        if not path.exists():
            print(f"Test path does not exist: {path}", file=sys.stderr)
            return 2
        if path.is_dir():
            files.update(candidate for candidate in path.rglob("test*.py") if candidate.is_file())
        elif path.suffix == ".py":
            files.add(path)
        else:
            print(f"Expected a Python test file or directory: {path}", file=sys.stderr)
            return 2
    if not files:
        print("No Python test files discovered; refusing a false-green result.", file=sys.stderr)
        return 2
    sys.path.insert(0, str(Path.cwd()))
    suite = unittest.TestSuite()
    for path in sorted(files):
        module_name = "task_tests_" + hashlib.sha256(str(path).encode()).hexdigest()[:16]
        try:
            spec = importlib.util.spec_from_file_location(module_name, path)
            if spec is None or spec.loader is None:
                raise ImportError(f"Cannot load {path}")
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            sys.path.insert(0, str(path.parent))
            try:
                spec.loader.exec_module(module)
            finally:
                sys.path.pop(0)
            suite.addTests(unittest.defaultTestLoader.loadTestsFromModule(module))
        except Exception as error:
            print(f"Cannot import tests from {path}: {error}", file=sys.stderr)
            return 2
    count = suite.countTestCases()
    if count == 0:
        print("Zero tests collected; refusing a false-green result.", file=sys.stderr)
        return 2
    print(f"Collected {count} tests from {len(files)} file(s).", file=sys.stderr)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
