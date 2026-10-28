# TypeScript tooling migration

The application remains Flutter/Dart plus TypeScript. Repository tooling is being
migrated to TypeScript following the user's question about Python. This is an
orchestrator-owned change outside the five dispatched foundation tasks. It does
not reassign those tasks or change their pinned baseline or acceptance criteria.

## Available now

Use Node 22.18 or later, which can execute erasable TypeScript in `.mts` files
without a compilation step. These commands need no third-party runtime packages:

```sh
node tools/taskctl.mts status
node tools/taskctl.mts ready --limit 5
node tools/taskctl.mts show BOOT-001
node tools/taskctl.mts verify BOOT-001
node --test tests/taskctl.test.mts
```

`--root DIRECTORY` can precede the command. Verification accepts explicit argv
arrays, not shell strings, and runs the commands from the task's configured
directory. Output paths and the working directory must resolve inside the
repository. Missing files, missing executables, timeouts, signals and nonzero
exit statuses fail verification. Task state does not change after successful
local verification; the orchestrator still reviews implementation and evidence.

The readiness calculation preserves dependencies, the five-active-task limit,
first-day ordering and conservative file ownership. Expired assignments remain
reserved and appear in `expired_active_ids`; observing expiry is not permission
to start a replacement worker.

Native execution strips types; it does not type-check them. Run the TypeScript
compiler separately when validating this tooling. The runtime tests cover graph,
ownership, capacity, command execution and failure behavior, including tests
against the published backlog. They do not prove that the application exists or
that any provider/device/release gate passed.

## Remaining migration work

1. Move dispatch and review ingestion together with a single cross-process lock
   protocol and interrupted state/queue write recovery. The new CLI deliberately
   rejects mutation commands until that is complete. Mixing independent writers
   would make the five-task limit unreliable.
2. Port the plan validator, catalogue generator, contract seed generator and their
   checks, preserving stable task IDs and state history.
3. Replace Python operations-task outputs and verification commands in future
   task cards through a reviewed plan revision. Reconcile already dispatched
   tasks before changing their acceptance criteria. Do not regenerate over active
   assignments to silently change what a worker was asked to deliver.
4. Update worker instructions and remove legacy scripts after their callers and
   mutation protocol are migrated and verified.

Until then, existing Python files and pinned task commands remain functional.
This incremental port is not a claim that Python has been removed from the repo.

## Primary runtime references

Verified 2026-10-28:

- [Node 22 native TypeScript execution](https://nodejs.org/download/release/v22.23.3/docs/api/typescript.html)
- [Node 22 filesystem glob API](https://nodejs.org/docs/latest-v22.x/api/fs.html#fsglobsyncpattern-options)
