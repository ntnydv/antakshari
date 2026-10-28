# BOOT-007: Build collision-free feature registration tooling

Status: pending (live state: `orchestration/state.json`). Priority: P0. Component: BOOT. Dependency wave: 1.
Estimate: 20–90 minutes; estimate only. First-day candidate: yes.

## Read first

- [Component design](../../../docs/orchestration/BOOTSTRAP.md)
- [PRD](../../../docs/PRD.md)
- [Canonical contracts](../../../docs/contracts/README.md)
- [Worker protocol](../../../docs/orchestration/WORKER_PROTOCOL.md)

## Outcome

Scan task-owned registration descriptors and generate deterministic backend/Flutter registries. Reject duplicate IDs and dependency cycles. Feature workers only edit their descriptor, never shared registries or root imports.

Create the shared foundation described below. Do not implement unrelated product features or provision paid services.

## Prerequisites

- [BOOT-001](../BOOT/BOOT-001.md)
- [BOOT-002](../BOOT/BOOT-002.md)
- [BOOT-004](../BOOT/BOOT-004.md)

Work starts only after these task results are accepted and merged. Branch from the dispatch baseline commit. If a documented interface is missing or contradictory, report a blocker; do not create an incompatible substitute.

## Exclusive production/test paths

- `tools/registry/**`
- `services/game-api/src/generated/**`
- `apps/mobile/lib/generated/**`

Also allowed: `orchestration/results/BOOT-007.json`. Do not edit sibling tasks, queue/state files, shared registries, dependency locks, schemas, or global routing outside these paths. Ask the orchestrator for a separately owned integration task when a cross-cutting change is necessary.

## Acceptance criteria

1. Demonstrate the outcome above using a concrete fixture and externally visible result.
2. Required failure behavior: A missing tool, credential or environment must be reported as blocked; do not fabricate passing evidence.
3. Respect invariant: No production implementation is claimed before evidence exists. Shared foundations remain deterministic and isolated from live services.
4. Use the component ports `bootstrap interfaces` and data scope: only the explicitly owned foundation artifacts.
5. No credentials, raw player recordings, unlicensed media, hidden answer keys, or personal data enter logs/public fixtures.
6. Every assigned verification command actually runs and passes; missing tools/tests are blocked, not skipped-success.
7. Commit only owned paths and report evidence, changed files, risks and any unresolved dependencies.

## Execute and verify

```sh
python3 tools/taskctl.py show BOOT-007
python3 tools/taskctl.py verify BOOT-007
```

Underlying checks (working directory: `.`):

```text
python3 tools/registry/check.py
```

Bootstrap checks are specified as work to be created and then executed; they are not implemented yet. Live AI credentials, device signing and content rights are external release inputs, never invented by an implementation agent.

## Handoff

Open one task-scoped PR with title `[BOOT-007] Build collision-free feature registration tooling` and add `orchestration/results/BOOT-007.json` using the result schema. Include base commit, implementation commit, exact commands, exit codes, evidence paths and blockers. Set status `implemented`, `blocked`, or `failed`; only the orchestrator sets `done` after review and merge. Do not self-approve or deploy production.
