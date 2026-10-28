#!/usr/bin/env python3
"""Compatibility entrypoint for pinned cards; all task logic lives in TypeScript.

ANTAKSHARI_NODE may select an installed Node >=22.18 executable. This wrapper
never reads or mutates task state itself and never falls back to a Python writer.
"""
import os
from pathlib import Path
import sys


def main():
    node = os.environ.get("ANTAKSHARI_NODE", "node")
    script = Path(__file__).resolve().with_suffix(".mts")
    try:
        os.execvp(node, [node, str(script), *sys.argv[1:]])
    except OSError as error:
        print(f"taskctl: Node >=22.18 is required: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
