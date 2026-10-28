# First-day integration plan and throughput limits

Status: capacity-aware execution plan, not a production delivery promise. Revision: 2026-10-27.

## What one day means

The user plans one OpenCode worker coordinator that picks up at most five tasks every 30 minutes. That creates 48 admission windows per 24 hours and a theoretical ceiling of 240 task starts. The ceiling assumes capacity becomes available at every window; long tasks, dependency waits, review, failures, and integration reduce actual throughput.

The complete backlog contains 2,056 cards: eight bootstrap tasks plus 512 implementation slices, each with three separate verification tasks. At 240 starts/day, the full backlog needs at least nine days of starts with this worker cadence. This is arithmetic, not an estimate of the time needed for a production-ready app. No amount of relabelling tasks makes sequential dependencies or external approvals disappear.

[first-day.json](../../backlog/first-day.json) contains 240 dependency-closed priority candidates. Dependency-closed means every prerequisite of a selected task is also selected; it does not mean all 240 are immediately ready. The file is a prioritisation pool, not a pre-authorised queue, a launch certificate, or a guarantee that all ten rounds are finished on day one.

## First-day objective

Aim for an integrated internal demonstration with real application boundaries: private room creation/join, an authoritative turn, capture/playback, a sealed answer, deterministic/fake inference for local repeatability, a score event, reconnect, and at least the implemented round paths exercised. Expand the ten-round surface only as its own tasks and evidence are accepted. The full product still requires the separate [release gates](../RELEASE_GATES.md), particularly physical-device audio, consented singing evaluation, permitted content, access rules, and live operational readiness.

Use original/permitted fixtures for development. Show fixture/fake modes clearly. A demo with mocked Muse responses must not be described as a validated autonomous singing judge. A compile-clean screen for a round is not evidence that its multiplayer scoring path works.

## Bootstrap dependency sequence

| Task | Output | Prerequisites | Concurrency |
|---|---|---|---|
| BOOT-001 | Node/TypeScript workspace, locked dependencies, toolchain smoke | None | Initial batch |
| BOOT-002 | Flutter app, pinned SDK, bootstrap routing and widget smoke | None | Initial batch |
| BOOT-003 | Firebase emulator and access-rule harness | None | Initial batch |
| BOOT-004 | Shared protocol bindings and schema checks | None | Initial batch |
| BOOT-005 | Original deterministic song/media fixtures | None | Initial batch |
| BOOT-006 | Deterministic repositories and provider fakes | BOOT-001, 003, 004, 005 | May run alongside BOOT-007 when ready |
| BOOT-007 | Collision-free feature registration tooling | BOOT-001, 002, 004 | May run alongside BOOT-006 when ready |
| BOOT-008 | Local integration commands and composition | BOOT-006, 007 | After both merged |

The initial queue contains exactly BOOT-001 through BOOT-005. The second polling window is not automatically a five-task batch: BOOT-006/007 become eligible only after their dependencies have passed review and merged. BOOT-008 composes the actual foundations, not guessed interfaces. Downstream cards follow their own dependency edges in `backlog/index.json`.

## Suggested checkpoints

These are review checkpoints and desired evidence, not deadlines that permit bypassing a prerequisite.

| Window | Orchestrator focus | Evidence to seek |
|---|---|---|
| Start | Publish/pin the initial five-task queue; confirm external worker admission | Each task has a unique worktree/branch and recorded baseline |
| Every 30 minutes | Review progress, merge scoped passing work, dispatch available capacity | Diff, real checks, result schema, no path conflicts |
| Foundation checkpoint | Complete the bootstrap graph | Clean local builds, fixture validation, schema generation, emulator smoke |
| First vertical slice | Connect player identity → room → turn → answer → score | Deterministic end-to-end run and identical server/client score |
| Recovery checkpoint | Exercise disconnect, retry, duplicate command and missed deadline | No duplicate score or leaked cue; recoverable visible state |
| Round checkpoint | Integrate only dependency-ready round modules | Round-specific valid/invalid/uncertain fixtures through shared contracts |
| End of day | Record actual completed, blocked and unreviewed work | Merge SHAs, evidence links, working demo scope, next safe queue |

Do not reserve the last hour as the first integration attempt. Each accepted foundation and feature should enter a thin integration path promptly, so a shared-contract mistake is found before many agents build on it.

## Dispatch priorities

1. Unblock shared foundations and canonical interfaces before leaf screens.
2. Keep room security, hidden-answer boundaries, idempotency, timing, and score correctness ahead of cosmetic polish.
3. Establish one complete musical answer flow before multiplying round variants.
4. Dispatch a feature's focused checks when its implementation is merged; do not count an untested implementation as production complete.
5. Prefer tasks that unlock several safe dependents, but retain the five-active-task ceiling and path-conflict checks.
6. Separate external-input blockers from code work. Model access, signing, device availability, and song rights cannot be faked into completion.

The first-day pool includes work across the 22 platform components and ten round components. It includes only a subset of each component's 16 slices and corresponding evidence tasks. It therefore cannot stand in for the entire product's acceptance matrix. If a first-day task is blocked, the orchestrator may select another genuinely ready task; the worker does not make that substitution independently.

## At each merge

Review actual implementation and tests, verify file ownership, and inspect whether the task's assumptions still match the canonical contract. Merge one scoped PR at a time. Update task state only after recording the real merge SHA and accepted evidence. Regenerate composition through its assigned tooling/integration owner. If a merge reveals a contract defect, stop affected dependents and issue a corrective task instead of letting every worker repair the shared file differently.

An `implemented` worker result is not `done`. A `done` implementation task also does not mean all verification cards for that slice are done. The result dashboard must show these separately. Missing tools/tests, inaccessible logs, or a silently skipped integration suite prevent acceptance.

## End-of-day handoff

The orchestrator should publish a concise factual handoff containing:

- Counts of merged/accepted, active, blocked, failed and needs-review tasks.
- Exact runnable demo scope and the command/environment used to demonstrate it.
- Which rounds were exercised through a complete multiplayer flow, and which remain partially implemented.
- Whether provider calls used fakes or live Muse, and whether any singing evaluation exists.
- Open P0 defects, external inputs and integration risks.
- The next safe queue of up to five tasks with a pinned baseline.

Do not claim a mobile release solely because 240 tasks were started, all ten round screens exist, or the planning validator passes. A one-day internal demonstration and a production-ready ten-round MVP are separate outcomes.

## Capacity changes

Additional independently coordinated worker pools could increase throughput only if the orchestrator also provides disjoint queues, a shared ownership/lease service, review capacity, and matching execution resources. The current protocol authorises one OpenCode coordinator with five active tasks; it does not silently launch more workers or call external processes. Any change in worker capacity must first update the dispatch policy and ownership checks.
