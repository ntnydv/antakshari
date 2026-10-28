# Flutter application shell — component design

Component: C02. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Provide mobile navigation, dependency injection, common stage chrome and accessible view states for independently owned features.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C01. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `AppRouter; FeatureRegistry; SessionRepository; StageScaffold`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: In-memory view models; bounded local preferences; no answer cache.

**Invariant:** Views render repository state and issue intents; they never calculate competitive scores or own provider credentials.

Mutable competitive state is server-owned. Read/write authorization applies at each entrypoint; UI hiding is not access control. Command effects bind authenticated actor, commandId, current generation and immutable catalogue/rule version. Client snapshots are projections with answer-bearing data excluded until the relevant reveal phase.

## Processing and concurrency

The caller supplies a validated intent; this component checks prerequisites and returns a typed success, conflict, invalid input, unavailable or denied result. Pure transformations are deterministic. Persistent effects are committed with idempotency receipts. Network calls and provider I/O run outside retryable Firestore transactions, using a durable outbox where a committed side effect must be recovered.

For Flutter slices, repository state drives the view model and rendering; cancellation/disposal prevents an older operation from replacing a newer screen. For server slices, optimistic expectedVersion preconditions and resource-generation fencing prevent stale commands. Operations tooling defaults to validation/dry-run and prints a concrete plan before any separately authorized live operation.

## Failure behavior

The table below defines one explicit adverse behavior per capability. A failed dependency returns a bounded recoverable result; no empty success or fabricated model decision. Retries reuse operation identity and stop at the component deadline. Offline clients cannot queue competitive answers for later. Infrastructure uncertainty never changes scores without a verified attempt outcome.

Resource cleanup must run on cancel, timeout, disposal and successful completion. Late callbacks compare attempt/phase generation before applying results. Cross-instance state is never assumed to live in one server process; durable authority is Firestore and the realtime transport uses its shared bus.

## Security, privacy and observability

Use server-derived UID and current role; reject unknown mutable fields. Never expose provider keys, private answer manifests or raw singing in public logs. Emit structured component/operation IDs, duration, result class and redacted error code. Metrics describe observed behavior; configured thresholds are not evidence that a target has been met.

## Capability contracts and acceptance cases

`S` is a TypeScript server slice; `M` is Flutter; `O` is local/CI operations tooling. Each is one meaningful implementation outcome with three independently owned verification tasks. Integration here means the defined port boundary; live-device and real-provider qualification belongs to release gates.

| Requirement | Slice | Kind | Required behavior | Required adverse behavior |
| --- | --- | --- | --- | --- |
| REQ-C02-01 | application-bootstrap | M | Start Firebase and dependency providers before showing the home route. | Initialization failure shows retry with no blank screen. |
| REQ-C02-02 | feature-registry | M | Discover generated feature descriptors and mount round renderers by roundId. | Duplicate renderer IDs fail the build rather than override silently. |
| REQ-C02-03 | route-guards | M | Route unauthenticated sessions through guest entry before protected rooms. | A stale invitation preserves its code across sign-in. |
| REQ-C02-04 | stage-scaffold | M | Render cue, score, timer, active singer and primary action in one responsive stage. | 320px width and large text never overlap the microphone action. |
| REQ-C02-05 | async-view-state | M | Represent loading, ready, empty and recoverable failure explicitly. | A stale error cannot replace a newer successful response. |
| REQ-C02-06 | connectivity-banner | M | Show offline state while keeping the last authoritative score read-only. | Offline buttons cannot enqueue competitive answers for later. |
| REQ-C02-07 | theme-tokens | M | Implement readable light/dark music-stage tokens and team labels. | Team identity remains distinguishable without color. |
| REQ-C02-08 | navigation-restoration | M | Restore the last eligible room after process recreation. | A finished match routes to results instead of answer capture. |
| REQ-C02-09 | permission-education | M | Explain microphone use before the system permission prompt. | Declining permission keeps join and observer views usable. |
| REQ-C02-10 | screen-reader-stage | M | Announce turn changes and final scores without repeating every timer tick. | Rapid snapshots do not flood accessibility announcements. |
| REQ-C02-11 | reduced-motion | M | Respect reduced motion for score reveals and transitions. | Disabling animation preserves all state changes and controls. |
| REQ-C02-12 | localization-shell | M | Load Hindi and English UI text with locale-aware number formatting. | An absent translation falls back to English rather than a key string. |
| REQ-C02-13 | app-lifecycle | M | Pause capture on background and resync when foreground resumes. | A background recording cannot continue after turn revocation. |
| REQ-C02-14 | global-error-boundary | M | Recover from feature rendering errors with a bounded error state. | Failure telemetry excludes raw song lyrics and user audio. |
| REQ-C02-15 | device-settings | M | Persist captions, haptics and playback-volume preferences locally. | Resetting preferences never signs the player out. |
| REQ-C02-16 | update-required | M | Present incompatible-client guidance before room entry. | An old client cannot bypass a server minimum-version response. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C02-01-I](../../backlog/tasks/C02/C02-01-I.md): application-bootstrap (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-02-I](../../backlog/tasks/C02/C02-02-I.md): feature-registry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-03-I](../../backlog/tasks/C02/C02-03-I.md): route-guards (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-04-I](../../backlog/tasks/C02/C02-04-I.md): stage-scaffold (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-05-I](../../backlog/tasks/C02/C02-05-I.md): async-view-state (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-06-I](../../backlog/tasks/C02/C02-06-I.md): connectivity-banner (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-07-I](../../backlog/tasks/C02/C02-07-I.md): theme-tokens (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-08-I](../../backlog/tasks/C02/C02-08-I.md): navigation-restoration (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-09-I](../../backlog/tasks/C02/C02-09-I.md): permission-education (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-10-I](../../backlog/tasks/C02/C02-10-I.md): screen-reader-stage (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-11-I](../../backlog/tasks/C02/C02-11-I.md): reduced-motion (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-12-I](../../backlog/tasks/C02/C02-12-I.md): localization-shell (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-13-I](../../backlog/tasks/C02/C02-13-I.md): app-lifecycle (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-14-I](../../backlog/tasks/C02/C02-14-I.md): global-error-boundary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-15-I](../../backlog/tasks/C02/C02-15-I.md): device-settings (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C02-16-I](../../backlog/tasks/C02/C02-16-I.md): update-required (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
