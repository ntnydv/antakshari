# Build, Firebase infrastructure and release — component design

Component: C22. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Make emulator development, isolated environments, CI, controlled deployment and evidence-based release reproducible.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: shared bootstrap only. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `bootstrap; emulate; verify; deployStaging; rollback`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Version locks; infrastructure manifests; CI definitions; release evidence; environment templates.

**Invariant:** Planning does not provision billing resources. No production deploy until secrets, rights, security and device gates are evidenced.

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
| REQ-C22-01 | workspace-toolchain | O | Pin Flutter/Dart, Node22, package manager and test tool versions reproducibly. | A missing tool fails with installation guidance rather than a silent skip. |
| REQ-C22-02 | firebase-emulators | O | Start Auth, Firestore, RTDB, Storage and Functions emulators with seed fixtures. | Local tests cannot accidentally point at a production project. |
| REQ-C22-03 | ci-gates | O | Run schema, backend, Flutter and rules checks with explicit required statuses. | Missing tests or ignored failures cannot produce a green gate. |
| REQ-C22-04 | environment-manifests | O | Separate dev/staging/prod project IDs, regions and resource configuration. | A staging command carrying production identifiers fails preflight. |
| REQ-C22-05 | secret-config | O | Wire Secret Manager references without storing secret values in repository files. | A generated environment file containing a key fails validation. |
| REQ-C22-06 | cloudrun-manifest | O | Define relay/worker service resources, timeouts and least-privilege identities. | Default instance affinity is never accepted as shared-room correctness. |
| REQ-C22-07 | redis-manifest | O | Define private Memorystore connectivity for cross-instance media pubsub. | Deployment without reachable private Redis fails readiness checks. |
| REQ-C22-08 | firestore-indexes | O | Declare required indexes and TTL policies with emulator-compatible validation. | An unindexed required query is discovered before release. |
| REQ-C22-09 | tasks-outbox-config | O | Define Cloud Tasks retry, rate and authentication policy for deadline workers. | Unauthenticated timer execution is rejected. |
| REQ-C22-10 | release-build | O | Produce signed-build instructions and artifact provenance for both platforms. | Absent signing credentials reports blocked rather than a fake release artifact. |
| REQ-C22-11 | staging-smoke | O | Run two-device or four-device room and media smoke with captured evidence. | Mocks cannot satisfy the live staging smoke gate. |
| REQ-C22-12 | rollback-plan | O | Define rollback of server version and feature flags without breaking active schema versions. | Incompatible schema rollback is prevented. |
| REQ-C22-13 | dependency-audit | O | Check licenses and known dependency issues with recorded tool versions. | A failed audit fetch is not reported as no issues. |
| REQ-C22-14 | backup-restore | O | Document and exercise restoration of catalogue metadata in a safe environment. | Restore cannot overwrite production records during a drill. |
| REQ-C22-15 | release-checklist | O | Require rights, singing evaluation, security, device and load evidence before pilot release. | Missing model credentials keep live-AI gate explicitly blocked. |
| REQ-C22-16 | operations-handoff | O | Produce environment-specific run commands, owners and incident recovery references. | Undocumented production-only manual steps fail handoff review. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C22-01-I](../../backlog/tasks/C22/C22-01-I.md): workspace-toolchain (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-02-I](../../backlog/tasks/C22/C22-02-I.md): firebase-emulators (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-03-I](../../backlog/tasks/C22/C22-03-I.md): ci-gates (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-04-I](../../backlog/tasks/C22/C22-04-I.md): environment-manifests (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-05-I](../../backlog/tasks/C22/C22-05-I.md): secret-config (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-06-I](../../backlog/tasks/C22/C22-06-I.md): cloudrun-manifest (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-07-I](../../backlog/tasks/C22/C22-07-I.md): redis-manifest (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-08-I](../../backlog/tasks/C22/C22-08-I.md): firestore-indexes (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-09-I](../../backlog/tasks/C22/C22-09-I.md): tasks-outbox-config (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-10-I](../../backlog/tasks/C22/C22-10-I.md): release-build (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-11-I](../../backlog/tasks/C22/C22-11-I.md): staging-smoke (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-12-I](../../backlog/tasks/C22/C22-12-I.md): rollback-plan (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-13-I](../../backlog/tasks/C22/C22-13-I.md): dependency-audit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-14-I](../../backlog/tasks/C22/C22-14-I.md): backup-restore (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-15-I](../../backlog/tasks/C22/C22-15-I.md): release-checklist (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C22-16-I](../../backlog/tasks/C22/C22-16-I.md): operations-handoff (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
