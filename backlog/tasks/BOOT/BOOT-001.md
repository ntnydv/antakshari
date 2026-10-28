# BOOT-001: Bootstrap the TypeScript backend workspace

Status: pending (live state: `orchestration/state.json`). Priority: P0. Component: BOOT. Dependency wave: 0.
Estimate: 20–90 minutes; estimate only. First-day candidate: yes.

## Read first

- [Component design](../../../docs/orchestration/BOOTSTRAP.md)
- [PRD](../../../docs/PRD.md)
- [Canonical contracts](../../../docs/contracts/README.md)
- [Worker protocol](../../../docs/orchestration/WORKER_PROTOCOL.md)

## Outcome

Create Node22 TypeScript build and Vitest setup with separate command, relay and worker entrypoints; no business feature code. Commit reproducible dependency locks and an executable smoke check.

Create the shared foundation described below. Do not implement unrelated product features or provision paid services.

## Prerequisites

- None. This is an initial independent foundation task.

Work starts only after these task results are accepted and merged. Branch from the dispatch baseline commit. If a documented interface is missing or contradictory, report a blocker; do not create an incompatible substitute.

## Exclusive production/test paths

- `services/game-api/package.json`
- `services/game-api/tsconfig.json`
- `services/game-api/vitest.config.ts`
- `services/game-api/src/entrypoints/**`
- `services/game-api/test/toolchain.test.ts`
- `pnpm-workspace.yaml`
- `package.json`
- `pnpm-lock.yaml`

Also allowed: `orchestration/results/BOOT-001.json`. Do not edit sibling tasks, queue/state files, shared registries, dependency locks, schemas, or global routing outside these paths. Ask the orchestrator for a separately owned integration task when a cross-cutting change is necessary.

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
python3 tools/taskctl.py show BOOT-001
python3 tools/taskctl.py verify BOOT-001
```

Underlying checks (working directory: `.`):

```text
pnpm --dir services/game-api exec tsc --noEmit
pnpm --dir services/game-api exec vitest run test/toolchain.test.ts
```

Bootstrap checks are specified as work to be created and then executed; they are not implemented yet. Live AI credentials, device signing and content rights are external release inputs, never invented by an implementation agent.

## Handoff

Open one task-scoped PR with title `[BOOT-001] Bootstrap the TypeScript backend workspace` and add `orchestration/results/BOOT-001.json` using the result schema. Include base commit, implementation commit, exact commands, exit codes, evidence paths and blockers. Set status `implemented`, `blocked`, or `failed`; only the orchestrator sets `done` after review and merge. Do not self-approve or deploy production.
