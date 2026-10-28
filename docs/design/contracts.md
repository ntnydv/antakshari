# Versioned contracts — component design

Component: C01. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Generate compatible Dart and TypeScript boundaries from the checked-in schemas; reject invalid wire data before business logic.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: shared bootstrap only. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `decodeCommand; encodeSnapshot; validateAdjudication; generateBindings`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: packages/contracts/schema; generated Dart/TS bindings; golden fixtures.

**Invariant:** schemaVersion is 1; unknown command types fail closed; additive event fields may be ignored. No answer key appears in public projection.

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
| REQ-C01-01 | command-envelope | S | Validate UUID commandId, matchId, expectedVersion and typed payload before dispatch. | Reject missing commandId without executing handler. |
| REQ-C01-02 | snapshot-decoder | M | Decode authoritative version and phase into immutable Flutter state. | Reject decreasing versions instead of rolling UI backward. |
| REQ-C01-03 | event-union | S | Decode known event discriminators and preserve event sequence. | Ignore additive metadata but reject unknown required discriminator. |
| REQ-C01-04 | error-envelope | S | Map stable error code, retryable flag and retryAfterMs to transport response. | Never expose provider key or raw exception in error details. |
| REQ-C01-05 | timestamp-codec | S | Convert epoch milliseconds without device-local timezone dependence. | Reject nonfinite, negative or fractional protocol times. |
| REQ-C01-06 | identifier-codec | S | Validate room, team, user and attempt identifiers separately. | Reject separators that could become nested document paths. |
| REQ-C01-07 | private-projection | S | Build player-specific projections from private match records. | Opponent cannot observe hum target or expected song IDs. |
| REQ-C01-08 | round-config-union | S | Validate the ten round config variants against their schema. | Reject a video-only config carrying a spoken-answer field. |
| REQ-C01-09 | answer-evidence | S | Validate evidence origin, attemptId, transcript and candidate identifiers. | An invented native ASR confidence field cannot bypass policy. |
| REQ-C01-10 | adjudication-union | S | Decode accepted, rejected, uncertain, invalid_attempt and cancelled with reason codes. | Refusal or missing candidate becomes abstain rather than accept. |
| REQ-C01-11 | event-gap | M | Detect an event sequence gap and request a full snapshot. | A replayed event never produces a duplicate visible score. |
| REQ-C01-12 | unknown-fields | M | Retain forward-compatible display state with additive server fields. | An unsupported schema major version shows upgrade-required. |
| REQ-C01-13 | redaction-codec | S | Remove transcript and media URLs from analytics-safe projections. | Nested free-text fields cannot leak through shallow redaction. |
| REQ-C01-14 | schema-migration | S | Register explicit compatible v1 upgrade transforms for stored records. | Records without a supported migration enter quarantine. |
| REQ-C01-15 | fixture-parity | O | Compare Dart and TypeScript serialization against shared fixtures. | Different integer or Unicode encodings fail the parity check. |
| REQ-C01-16 | contract-manifest | O | Produce a hash manifest for schema and generated binding artifacts. | A stale generated binding fails CI even if source compiles. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C01-01-I](../../backlog/tasks/C01/C01-01-I.md): command-envelope (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-02-I](../../backlog/tasks/C01/C01-02-I.md): snapshot-decoder (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-03-I](../../backlog/tasks/C01/C01-03-I.md): event-union (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-04-I](../../backlog/tasks/C01/C01-04-I.md): error-envelope (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-05-I](../../backlog/tasks/C01/C01-05-I.md): timestamp-codec (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-06-I](../../backlog/tasks/C01/C01-06-I.md): identifier-codec (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-07-I](../../backlog/tasks/C01/C01-07-I.md): private-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-08-I](../../backlog/tasks/C01/C01-08-I.md): round-config-union (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-09-I](../../backlog/tasks/C01/C01-09-I.md): answer-evidence (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-10-I](../../backlog/tasks/C01/C01-10-I.md): adjudication-union (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-11-I](../../backlog/tasks/C01/C01-11-I.md): event-gap (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-12-I](../../backlog/tasks/C01/C01-12-I.md): unknown-fields (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-13-I](../../backlog/tasks/C01/C01-13-I.md): redaction-codec (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-14-I](../../backlog/tasks/C01/C01-14-I.md): schema-migration (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-15-I](../../backlog/tasks/C01/C01-15-I.md): fixture-parity (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C01-16-I](../../backlog/tasks/C01/C01-16-I.md): contract-manifest (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
