#!/usr/bin/env python3
"""Compatibility launcher; planning validation is implemented in TypeScript."""
import os
from pathlib import Path
import sys

if __name__ == "__main__":
    node = os.environ.get("ANTAKSHARI_NODE", "node")
    script = Path(__file__).resolve().with_name("validate-plan.mts")
    try:
        os.execvp(node, [node, str(script), *sys.argv[1:]])
    except OSError as error:
        print(f"validate-plan: Node >=22.18 is required: {error}", file=sys.stderr)
        raise SystemExit(2)
