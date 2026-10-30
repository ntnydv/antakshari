#!/usr/bin/env python3
"""Compatibility entry point for the pinned task card; real checks run in Node/Dart."""
import os
from pathlib import Path
import shutil
import subprocess
import sys

node = os.environ.get('CONTRACTS_NODE') or shutil.which('node')
if not node:
    print('BLOCKED: Node 22 is required; install it or set CONTRACTS_NODE.', file=sys.stderr)
    sys.exit(2)
root = Path(__file__).resolve().parents[2]
try:
    sys.exit(subprocess.call([node, str(root / 'tools/contracts/check.mjs')], cwd=root))
except OSError as error:
    print(f'BLOCKED: unable to execute Node: {error}', file=sys.stderr)
    sys.exit(2)
