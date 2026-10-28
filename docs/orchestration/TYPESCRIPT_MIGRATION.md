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
node --test tests/taskctl.test.mts tests/taskctl-mutations.test.mts
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

1. Port the plan validator, catalogue generator, contract seed generator and their
   checks, preserving stable task IDs and state history.
2. Replace Python operations-task outputs and verification commands in future
   task cards through a reviewed plan revision. Reconcile already dispatched
   tasks before changing their acceptance criteria. Do not regenerate over active
   assignments to silently change what a worker was asked to deliver.
3. Remove compatibility launchers once pinned callers and generators are migrated.

The Python task CLI is now a compatibility launcher that executes the TypeScript
CLI. It has no independent queue writer and no Python fallback when Node is
missing. Existing pinned task cards therefore continue to work with Node 22.18+
installed. The Python task module's internal class API is retired; its behavior
tests have moved to TypeScript. Unmigrated planning and operation scripts still
require Python; this is not a claim that Python has been removed from the repo.

## Queue writes and recovery

Orchestrator commands (workers must not run these):

```sh
node tools/taskctl.mts dispatch --batch-id batch-0002 --baseline-sha <VERIFIED_MAIN_SHA>
node tools/taskctl.mts ingest-review orchestration/local-reviews/TASK_ID.json
node tools/taskctl.mts expire
node tools/taskctl.mts recover
```

New dispatches require the full immutable SHA independently checked on GitHub.
The tool validates its format, not its existence or ancestry. Retrying an existing
batch preserves its original baseline, timestamps and attempt counts. A live or
expired unfinished assignment reserves its paths; expiry moves it to
`needs_review` and never issues a replacement. Reviews must name an assigned task
and match its batch baseline. A local review JSON remains an attestation, not
proof that the claimed GitHub merge or tests happened.

All writers share an atomic directory lock at
`orchestration/.taskctl-write.lock/`. State, archived batch and current queue
updates are recorded in a local transaction journal before any target is
replaced. Recovery checks every file against its recorded before/after digest
before replaying writes. External edits stop recovery and preserve the journal
for reconciliation. Readers refuse a pending lock/journal rather than select
work from a partial update. These local files are ignored by Git; publish only
the reconciled state/queue/batch in a single Git commit with an expected-head ref
lease. The lock does not coordinate separate clones.

After a process dies, inspect the lock's `owner.json`. On the same host, run:

```sh
node tools/taskctl.mts recover-lock --token <EXACT_OWNER_TOKEN>
node tools/taskctl.mts recover
```

Lock recovery checks that the recorded PID no longer exists; live processes,
permission errors, foreign hosts, mismatched tokens and PID reuse fail closed.
Age alone never authorizes lock deletion. A crash before owner metadata is
written, or during explicit lock recovery, requires manual inspection of the
checkout and processes; do not delete an ambiguous lock automatically. Do not
run a previously imported legacy Python writer during the migration: stop old
orchestrator invocations, update the checkout, then use the launcher or Node CLI.
Workers on pinned older clones are read/verify-only and must not mutate state.

The tests kill real child processes after each journal/state/batch/queue rename
and verify recovery without duplicate attempts or lease extension. They also
exercise competing dispatchers, live locks, failed reviews and external edits.
This validates process interruption on the tested platform. Filesystem hardware
failure and cross-platform power-loss durability are not certified.

## Primary runtime references

Verified 2026-10-28:

- [Node 22 native TypeScript execution](https://nodejs.org/download/release/v22.23.3/docs/api/typescript.html)
- [Node 22 filesystem glob API](https://nodejs.org/docs/latest-v22.x/api/fs.html#fsglobsyncpattern-options)
