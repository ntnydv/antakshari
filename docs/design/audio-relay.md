# Realtime audio relay — component design

Component: C12. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Run an authenticated Cloud Run WebSocket gateway with Redis room fan-out, one active singer and a server-only Muse stream.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C03, C09, C11. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `issueRelayTicket; authenticateSocket; relayFrame; closeAttempt`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Single-use relay tickets; Redis room channels; transient attempt buffers; connection generations.

**Invariant:** Cloud Run affinity is not a correctness mechanism. Room authorization and active attempt are rechecked; never put PCM in Firestore.

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
| REQ-C12-01 | socket-auth | S | Consume a short-lived uid/room/attempt-scoped ticket before accepting binary frames. | Reusing a consumed ticket or wrong-room ticket is rejected. |
| REQ-C12-02 | room-fanout | S | Fan out permitted PCM through Redis channels to members on different instances. | Cross-room subscribers never receive frames. |
| REQ-C12-03 | active-singer-gate | S | Forward frames only from the authoritative active singer and grant generation. | Revoked or simultaneous sender frames are dropped and counted. |
| REQ-C12-04 | asr-stream-bridge | S | Open one Muse PUSH_TO_TALK stream per attempt and close it after endStream. | A completed ASR socket is never reused for the next answer. |
| REQ-C12-05 | relay-backpressure | S | Bound per-connection queued bytes and close persistently slow consumers. | A slow listener cannot stall every player or grow memory without limit. |
| REQ-C12-06 | frame-validation | S | Validate PCM frame size, total duration and permitted sample format. | WAV headers and client-injected sequence prefixes never reach Muse PCM input. |
| REQ-C12-07 | room-permission-refresh | S | Refresh membership and grant permissions when relevant match versions change. | A removed member loses media access promptly. |
| REQ-C12-08 | socket-heartbeat | S | Detect disconnected sockets and clean their subscription state. | A lost pong cannot leave a permanent active-singer reservation. |
| REQ-C12-09 | redis-outage | S | Fail new room media grants clearly during pubsub outage. | Instance-local fallback cannot silently isolate teams in different instances. |
| REQ-C12-10 | reconnect-fencing | S | Fence old connection generations when a player resumes. | Frames from the old socket cannot interleave with the replacement stream. |
| REQ-C12-11 | asr-fallback-file | S | Retry one completed bounded WAV through file ASR when the live stream fails. | The retry uses the same attemptId and cannot duplicate scoring. |
| REQ-C12-12 | room-listener | M | Play permitted incoming PCM with a bounded jitter buffer. | Stale attempt frames are flushed at turn changes. |
| REQ-C12-13 | relay-shutdown | S | Drain connections and publish recoverable interruption before instance shutdown. | Clients do not wait indefinitely for a final transcript from a dead socket. |
| REQ-C12-14 | traffic-limits | S | Enforce room, uid and tenant byte/concurrency quotas. | Exhausted quota triggers neutral game fallback rather than accepted empty audio. |
| REQ-C12-15 | relay-metrics | S | Track bytes, dropped frames, connection age and turnaround without raw audio logs. | Diagnostic modes cannot publish PCM content. |
| REQ-C12-16 | relay-load-probe | O | Exercise cross-instance fanout and bounded memory with four-client rooms. | A passing single-instance test cannot satisfy the cross-instance release gate. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C12-01-I](../../backlog/tasks/C12/C12-01-I.md): socket-auth (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-02-I](../../backlog/tasks/C12/C12-02-I.md): room-fanout (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-03-I](../../backlog/tasks/C12/C12-03-I.md): active-singer-gate (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-04-I](../../backlog/tasks/C12/C12-04-I.md): asr-stream-bridge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-05-I](../../backlog/tasks/C12/C12-05-I.md): relay-backpressure (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-06-I](../../backlog/tasks/C12/C12-06-I.md): frame-validation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-07-I](../../backlog/tasks/C12/C12-07-I.md): room-permission-refresh (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-08-I](../../backlog/tasks/C12/C12-08-I.md): socket-heartbeat (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-09-I](../../backlog/tasks/C12/C12-09-I.md): redis-outage (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-10-I](../../backlog/tasks/C12/C12-10-I.md): reconnect-fencing (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-11-I](../../backlog/tasks/C12/C12-11-I.md): asr-fallback-file (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-12-I](../../backlog/tasks/C12/C12-12-I.md): room-listener (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-13-I](../../backlog/tasks/C12/C12-13-I.md): relay-shutdown (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-14-I](../../backlog/tasks/C12/C12-14-I.md): traffic-limits (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-15-I](../../backlog/tasks/C12/C12-15-I.md): relay-metrics (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C12-16-I](../../backlog/tasks/C12/C12-16-I.md): relay-load-probe (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
