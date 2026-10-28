# OpenCode worker and orchestrator protocol

Status: execution contract for the repository backlog. Revision: 2026-10-27. Worker: externally operated OpenCode. Orchestrator: this Codex chat and its scheduled repository review. This document configures a handoff protocol; it does not assert that an OpenCode process, API connection, or external scheduler is already running.

## 1. Authority and workload

The backlog contains 2,056 task cards: eight bootstrap tasks, 512 implementation tasks, and 1,536 focused verification tasks across 32 components. A task is independently executable after its prerequisites have been accepted and merged. File isolation does not remove dependency order.

The worker polls the repository every 30 minutes and admits at most five tasks per poll, with no more than five active tasks at any time. Five is a ceiling, not a required batch size. If three previous tasks remain active, only two additional slots exist. A task may take longer than one polling interval. Do not kill it or reassign its files merely because another 30-minute tick occurs.

The orchestrator is the sole writer of queue, batch dispatch, and shared task state. Workers submit code and evidence in task-scoped pull requests. Workers never mark themselves `done`, merge their own PRs, edit another task's result, or publish a replacement batch.

## 2. Repository sources of truth

| Artifact | Purpose | Writer |
|---|---|---|
| `backlog/index.json` | Stable task definitions, dependencies, file ownership and verification commands | Planner/orchestrator |
| `backlog/tasks/<component>/<task>.md` | Human-readable execution instructions | Planner/orchestrator |
| `backlog/first-day.json` | Prioritised dependency-closed candidate set | Planner/orchestrator |
| `orchestration/state.json` | Mutable authoritative task lifecycle | Orchestrator only |
| `orchestration/queue.json` | Current dispatched batch, baseline and capacity | Orchestrator only |
| `orchestration/batches/` | Dispatch history | Orchestrator only |
| `orchestration/results/<TASK_ID>.json` | One worker's scoped implementation/evidence handoff | Assigned worker |
| `packages/contracts/schema/task-result.schema.json` | Exact worker-result field contract | Contract owner |
| `docs/PRD.md`, component design, contracts | Required product and interface behaviour | Respective design owners |

Static task cards may say pending after a task has progressed. Read `orchestration/state.json` for current lifecycle status. Never infer readiness from a card title, numeric ID, elapsed time, or the mere presence of a source file.

## 3. Admission and immutable baseline

At each poll:

1. Fetch the remote `main` ref and read the queue and state from the same immutable planning commit. Record its SHA locally.
2. Confirm the queue is ready, assigned to `opencode`, and not already admitted by this worker instance. Prevent duplicate local runner admission using a worker-local lock outside committed repository state.
3. If `baseline_sha` is populated, use that exact commit. If it is null, resolve the queue's `baseline_ref` once to an immutable commit and record that commit in every result from the batch. The initial queue deliberately uses `main` with a null SHA; do not leave `base_sha` null in a task result.
4. Check all task prerequisites are `done`, required implementation commits are present in the chosen baseline, and assigned paths do not overlap another active task. Treat any discrepancy as a blocker for the orchestrator.
5. Admit only listed `task_ids`, within both the queue's limit and the five-active-task global ceiling. Do not substitute an attractive unqueued task when an assigned task is blocked.
6. Create one branch and one worktree per task from the pinned baseline. Use branch names such as `task/BOOT-001`. If a branch/worktree already exists, inspect its association and status; never reset it automatically.

Example inspection commands, run from the repository clone:

```sh
git fetch origin main
git rev-parse origin/main
git show origin/main:orchestration/queue.json
python3 tools/taskctl.py show BOOT-001
```

Resolve and record the baseline before creating the worktree. The following placeholder must be replaced with the recorded 40-character commit SHA:

```sh
git worktree add ../antakshari-BOOT-001 -b task/BOOT-001 <BASELINE_SHA>
```

A worker-local claim is not a remote state mutation. If two external OpenCode runners are configured, they must share a coordinator/lock or receive separate worker identities and queues; this repository currently assumes one worker coordinator. No claim protocol here makes two uncoordinated pollers safe.

## 4. Task execution and file ownership

Read the assigned card, its linked component design, the PRD, and the canonical contract before editing. Use only the card's `owned_paths` and `orchestration/results/<TASK_ID>.json`. A task's ownership is evaluated against the diff from its baseline, not against every file present in its worktree.

Shared registries, schemas, dependency locks, navigation, root configuration, and generated composition files are protected unless explicitly owned by that card. A dependency addition that needs a protected lockfile is a new integration prerequisite; do not silently edit it. Feature authors contribute through the registration seams established by bootstrap work rather than concurrently editing a shared index.

Allowed work is repository implementation, local/emulator verification, and scoped GitHub handoff. Do not provision live services, deploy infrastructure, change billing, expose secrets, upload raw player recordings, or introduce unlicensed media. Never fabricate an account identifier, live API response, model accuracy result, signed app build, or content-rights approval. A missing external input is a declared blocker or a permitted fake, as stated in the task card.

If a design is contradictory or a dependency's interface is incomplete, preserve the useful scoped work, report the exact mismatch, and stop dependent implementation. A worker must not create a second incompatible protocol to keep moving. Questions and blockers are recorded in the task PR/result for the orchestrator; no separate messaging service is required.

## 5. Verification and evidence

Run the assigned verification entrypoint inside the task worktree:

```sh
python3 tools/taskctl.py show BOOT-001
python3 tools/taskctl.py verify BOOT-001
```

The task tool reads the task's executable checks and required outputs. Missing tools, missing implementation, absent tests, a zero-test selection, or a failing command must not become success. Missing prerequisites yield `blocked`; an implemented behaviour that fails its required check yields `failed` until repaired. Record the real exit code and the environment. Never replace a failed integration check with a smaller passing check and claim the task is verified.

Bootstrap tasks establish the required tools and seams before downstream tasks run. Node 22 is the backend baseline. Use the pnpm version and lockfile established by BOOT-001 and the Flutter SDK selected and pinned by BOOT-002; do not upgrade them independently. Flutter commands run in `apps/mobile`, and backend package commands use their task-specified directory. A Firebase emulator check is not evidence of a live Firebase deployment; a fake Muse adapter is not evidence of singing accuracy.

Evidence must be remotely reviewable. Prefer CI job/artifact URLs or logs inside a path already owned by the task. Do not add an unowned `evidence/` directory. A machine-local `/tmp` path alone is insufficient for remote acceptance. Keep logs bounded and redact credentials, signed URLs, private lyric references, and personal data. Evidence links must identify the tested commit and cannot be substituted with a screenshot saying “passed.”

## 6. Result schema and commit order

Every task result must validate against [task-result.schema.json](../../packages/contracts/schema/task-result.schema.json). The authoritative schema currently requires:

| Field | Meaning |
|---|---|
| `schema_version` | Integer `1` |
| `task_id` | Exact assigned ID, such as `BOOT-001` or `R04-01-I` |
| `worker` | Stable worker identifier |
| `batch_id` | Queue batch that authorised the work |
| `status` | `implemented`, `blocked`, or `failed` |
| `base_sha` | Actual immutable 40-character baseline commit |
| `implementation_sha` | Last code/test commit before the result-evidence commit; null only when no implementation commit exists |
| `summary` | Concrete outcome and relevant limitation |
| `changed_files` | Complete task PR file changes, including the task result file |
| `checks` | Exact command, actual exit code, accessible `log_path`, and environment for each check |
| `blockers` | Missing inputs or unresolved dependencies |
| `remaining_risks` | Material unverified behaviour |
| `provider_mode` | `not_used`, `fake`, or `live`, based on what actually ran |
| `evidence_paths` | Accessible evidence references |

Avoid a self-referential commit hash:

1. Commit the production/test changes. This is the `implementation_sha`.
2. Run or collect verification against that commit; preserve exact command and log references.
3. Create/update `orchestration/results/<TASK_ID>.json`, referring to the implementation commit from step 1.
4. Commit the result as a later evidence-only commit. The PR head includes both commits; the result never attempts to name its own enclosing commit.
5. If code changes after evidence collection, create a new implementation commit, rerun the affected checks, and update the result in a new evidence-only commit.

An `implemented` result is a worker claim awaiting review, not acceptance or release approval. For a blocked task with no code, `implementation_sha` is null and the blocker explains the missing input. Never use all-zero placeholder hashes to satisfy the schema. The schema is strict about extra fields; put PR discussion in the PR body rather than inventing result keys.

## 7. Pull request handoff

Open one PR per task against `main`, titled `[TASK_ID] Concrete outcome`. The body identifies the assigned batch, baseline, implementation commit, acceptance criteria met, exact verification and evidence, plus blockers/risks. A draft PR may be opened while work is in progress to show that the task is active; mark it ready only after required checks pass and the result says `implemented`.

Do not bundle all five tasks into one PR or merge them together locally. Stage only owned files. Before handoff, inspect the diff and confirm that no secret, temporary file, unrelated formatting change, generated lockfile, shared state update, or another task's code appears. If the base changes incompatibly, request an updated task baseline; do not resolve a cross-owner conflict by overwriting another agent's work.

`blocked` and `failed` PRs/results are kept for diagnosis. The worker must not rerun a failed/stale task under a second ID or reopen the same task from a newer batch without an explicit redispatch.

## 8. Orchestrator review and dispatch

Every 30 minutes the orchestrator reads repository state, dispatched tasks, relevant PRs and CI outcomes. Review must establish:

- The task was actually dispatched to this worker and has the claimed baseline and dependencies.
- Changed paths fit ownership plus the task's result file.
- The implementation satisfies the card and canonical design, including adverse cases.
- Required checks ran against the relevant implementation/PR commit and passed; logs are accessible.
- Reported provider mode, blockers, and remaining risks are truthful.
- The branch is mergeable and merging it does not invalidate completed dependencies or shared contracts.

Only scoped passing work is eligible for merge. After a successful merge, the orchestrator records the actual merge commit and evidence review, then marks the task done and considers dependents. A green badge without a diff review is insufficient. A worker result cannot self-promote via a `done` field or orchestrator review metadata.

Operator commands are provided by the checked-in tools:

```sh
python3 tools/validate_plan.py
python3 tools/taskctl.py ready
python3 tools/taskctl.py ingest-review <REVIEW_JSON_PATH>
python3 tools/taskctl.py dispatch --batch-id batch-0002
```

`ingest-review` consumes an orchestrator-authored review record after merge, including `reviewer_role: "orchestrator"`, `task_id`, `merge_sha`, `base_sha`, `reviewed_at`, and true `checks_verified`/`scope_verified` fields. Use the tool's current `--help` and validation for any additional required fields. Workers must never invoke `ingest-review` or `dispatch`.

The next dispatch contains up to five dependency-ready tasks with nonoverlapping owned paths, minus tasks still active. Priority comes from the first-day candidate plan and explicit product blockers, not merely task ID order. Commit the queue/state/batch changes together so the external poller sees a consistent plan. A repository update must use the current head/lease and recheck after a conflict; never overwrite a newer orchestrator state.

## 9. Stale, interrupted and ambiguous work

An expired or missing lease does not prove that a worker stopped. Unknown stale activity moves to `needs_review`; it does not automatically return to pending or get assigned again. Inspect the task branch, PR, last evidence and worker availability before redispatch. Reclaiming paths while the previous worker is still active can destroy isolation.

If a worker crashes after a commit or PR creation but before writing its result, preserve the branch and reconstruct status through review. If merge status is ambiguous, read GitHub before retrying. If checks are inaccessible, keep the task unaccepted. A queue with no safe ready work is a valid outcome; it is not an invitation to remove dependencies.

The orchestrator remains quiet while nothing actionable changes. Notify the user on meaningful milestones, a blocking input, a failed safety/quality gate, or completion. External OpenCode startup and its 30-minute polling must be configured by its operator; this repository and the Codex heartbeat cannot guarantee that process is running.
