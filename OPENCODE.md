# OpenCode worker entrypoint

Codex orchestrates OpenCode and Codex implementation agents together. Take **at most five active task IDs total across both runtimes**. Read the per-task `worker` in state and `task_workers` in the queue; a queue-wide `worker: mixed` does not assign every task to OpenCode. This file is a worker prompt and protocol; it does not itself start a process.

Read [the worker protocol](docs/orchestration/WORKER_PROTOCOL.md) and [first-day plan](docs/orchestration/ONE_DAY_PLAN.md). Current assignments are in [orchestration/queue.json](orchestration/queue.json); task definitions are in [backlog/index.json](backlog/index.json).

## Copy-paste worker prompt

> You are the OpenCode implementation worker for `ntnydv/antakshari`. Read the current queue and state from one pinned planning commit. Work only on task IDs whose per-task worker is `opencode`; if no per-task mapping exists, use the queue-wide worker. Codex may simultaneously implement other assigned tasks, with a combined maximum of five active task IDs. Do not run a duplicate polling loop alongside the orchestrator. Use `baseline_sha` when present; otherwise resolve `baseline_ref` to an exact commit once and record it as `base_sha`. Never branch from an unrecorded moving ref.
>
> Create one branch/worktree and one PR per task. Read the task card, its component design, PRD and canonical contracts. Edit only its owned paths plus `orchestration/results/TASK_ID.json`. Never edit shared queue/state, sibling results, protected schemas/locks/registries, or another task's files. Do not provision services, deploy, reveal secrets, or fabricate live evidence. Report missing prerequisites as blocked.
>
> Implement the assigned outcome and run `node tools/taskctl.mts verify TASK_ID`. Missing tools, missing tests, no tests selected, or failed checks are not success. Record actual command exit codes and accessible evidence. Use the exact task-result schema. Set only `implemented`, `blocked`, or `failed`; the orchestrator alone reviews, merges and marks done.
>
> Commit code first. Put that code commit in `implementation_sha`, then add the result JSON in a separate evidence-only commit so the result does not need its own commit hash. Open a PR titled `[TASK_ID] Concrete outcome`, with the batch, baseline, checks, evidence and blockers. Do not merge or self-approve. If a lease or prior worker state is ambiguous, stop and request review; do not automatically reclaim the task. After the handoff, wait for a new safe dispatch.

## Initial batch

The initial queue assigns `BOOT-001` through `BOOT-005`. They establish the backend workspace, Flutter bootstrap, Firebase emulator harness, contract bindings, and original media fixtures in separate owned paths. BOOT-006/007 depend on those foundations; BOOT-008 composes them. Dependency completion means accepted and merged, not merely an open PR.

## Inspection and verification

From the repository clone:

```sh
git fetch origin main
git rev-parse origin/main
git show origin/main:orchestration/queue.json
node tools/taskctl.mts show BOOT-001
```

After resolving and recording the queue's baseline, create the task's isolated worktree. Run inside that worktree:

```sh
node tools/taskctl.mts verify BOOT-001
```

Substitute the assigned task ID. Use Node 22 and the pnpm/lockfile selected by BOOT-001. Use the Flutter SDK pinned by BOOT-002; Flutter commands run from `apps/mobile`. Use Node 22.18 or later for task orchestration. Python remains temporarily required by unmigrated planning generators and pinned bootstrap check commands. Bootstrap cards create the missing application tooling; a missing runtime or unavailable external input must be reported rather than skipped.

Workers never run the orchestrator-only `dispatch` or `ingest-review` commands. The orchestrator inspects diffs and checks every 30 minutes, merges eligible work, then publishes the next batch. The full 2,056-card backlog exceeds a single day at this cadence; the 240 first-day candidates are a prioritisation pool, not a completion promise.
