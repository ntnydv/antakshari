# Foundation tasks and execution gates

The repository currently contains a planning package and tested orchestration utilities. Flutter, Firebase and backend application code are work to be implemented. These eight tasks create the shared foundation before feature tasks are eligible.

| Task | Output | Dependency |
| --- | --- | --- |
| BOOT-001 | Node22/TypeScript workspace, Vitest, command/relay/worker entrypoints, `test/toolchain.test.ts` | None |
| BOOT-002 | Flutter Android/iOS application, providers/router seams and bootstrap widget test | None |
| BOOT-003 | Firebase emulator configuration, isolated local project, deny-default rules, `infra/firebase/check.py` | None |
| BOOT-004 | Canonical schemas checked, generated Dart/TS bindings, ports and `tools/contracts/check.py` | None |
| BOOT-005 | Original synthetic songs/media covering ten formats and `fixtures/validate.py` | None |
| BOOT-006 | Injected repository/provider fakes and `test/bootstrap.test.ts` | 001,003,004,005 |
| BOOT-007 | Deterministic descriptor scanner and generated registries | 001,002,004 |
| BOOT-008 | Local composition, emulator run commands and fail-closed integration verification | 006,007 |

The first five have exclusive ownership. BOOT-001 owns root Node locks; BOOT-002 owns Flutter platform scaffolding; BOOT-003 owns Firebase rules/config; BOOT-004 owns schemas and generated contract packages; BOOT-005 owns fixtures. No worker changes a sibling's paths to make their task appear complete. If a toolchain or interface mismatch requires two owners, report it; the orchestrator creates an explicit integration assignment or updates the affected task before redispatch.

## Shared ports that must exist after bootstrap

Clock, authenticated principal, command receipt store, transactional match repository, immutable catalogue reader, score ledger, durable outbox, media grant service, audio transport, transcription/evidence interpreter, host text presenter, event sink and feature/round registration. Provide deterministic fakes for success and failure. Fakes are dependency-injected, visibly labelled, and forbidden by production configuration validation.

## Verification rules

Each card names exact required files and executable commands. Run `python3 tools/taskctl.py verify BOOT-xxx`. It fails if implementation is absent, a test file is missing, a command is unavailable, or a check fails. Bootstrap scripts must check substantive outputs; an empty script returning zero is not acceptable evidence. BOOT-001's toolchain smoke is independent of BOOT-006's later fake-repository smoke.

No live model key, Firebase project, Redis instance, signing certificate or licensed song content is provisioned by these planning tasks. Missing external inputs are tracked in [release inputs](RELEASE_INPUTS.md). Emulators and original fixtures allow most implementation work to proceed while those inputs are acquired separately.

## Integration ownership

Feature tasks own leaf module plus leaf registration descriptor or one test file. The registry generator discovers descriptors and validates globally unique IDs. Its generated shared files are owned by the integrator. New dependencies and lockfile changes go through the foundation owner. The one-day priority list includes dependencies but does not guarantee that all checks fit in30-minute windows or that it is sufficient for production release.
