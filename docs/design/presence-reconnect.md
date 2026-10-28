# Presence and reconnection — component design

Component: C08. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Combine RTDB disconnect signals with application heartbeats and authoritative match resumption.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C05, C06. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `publishPresence; mirrorPresence; resumeMatch; expireGrace`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: RTDB connections/{uid}/{connectionId}; Firestore presence projection; reconnect token.

**Invariant:** Presence is advisory; losing RTDB connectivity alone never changes a score. Rejoining uses latest server version.

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
| REQ-C08-01 | presence-client | M | Register connection-specific onDisconnect before publishing online state. | A crash during registration does not leave permanent online presence. |
| REQ-C08-02 | presence-mirror | S | Mirror debounced connection status into authorized room projections. | One device disconnect cannot mark another live device offline. |
| REQ-C08-03 | resume-snapshot | S | Return the latest permitted snapshot and sequence after reconnect. | A resume from another match cannot expose private player state. |
| REQ-C08-04 | reconnect-screen | M | Suspend scoring controls and show retry while preserving team context. | Repeated reconnect attempts cannot replay answer submissions. |
| REQ-C08-05 | grace-window | S | Grant a 30-second reconnect grace once per interrupted turn. | Repeated flapping cannot extend a turn indefinitely. |
| REQ-C08-06 | owner-loss | S | Transfer lobby ownership without changing the match's server authority. | Former owner commands with old version are rejected. |
| REQ-C08-07 | active-singer-loss | S | Stop media grant on singer disconnect and apply interrupted-attempt policy. | Partial capture is never silently scored as a completed answer. |
| REQ-C08-08 | background-resume | M | Request a fresh snapshot after foregrounding rather than trust cached phase. | A timer expired while backgrounded is not restarted locally. |
| REQ-C08-09 | event-resync | M | Replace local state after sequence gaps and clear obsolete effects. | Score-reveal animations do not replay on full resync. |
| REQ-C08-10 | device-replacement | S | Allow one active control connection per player while revoking the old grant. | Two devices cannot submit simultaneous answers for one uid. |
| REQ-C08-11 | heartbeat-expiry | S | Mark transport stalled only after bounded missed heartbeat policy. | Transient packet delay does not immediately forfeit a player. |
| REQ-C08-12 | team-forfeit | S | End a match only after all required team reconnect policies expire. | A stale grace-expiry task cannot end a resumed match. |
| REQ-C08-13 | clock-offset | M | Estimate server offset for display using bounded round-trip samples. | A device clock change does not alter authoritative deadlines. |
| REQ-C08-14 | resume-ticket | S | Issue short-lived room/uid/attempt-scoped reconnect tickets. | Used or expired tickets cannot resurrect revoked capture grants. |
| REQ-C08-15 | network-quality | M | Show connection quality and disable buzzer mode when room policy requires. | Quality indicators never claim exact fairness from latency estimates. |
| REQ-C08-16 | presence-cleanup | S | Remove stale connection records without deleting current-session state. | A delayed onDisconnect write cannot override a newer connection generation. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C08-01-I](../../backlog/tasks/C08/C08-01-I.md): presence-client (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-02-I](../../backlog/tasks/C08/C08-02-I.md): presence-mirror (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-03-I](../../backlog/tasks/C08/C08-03-I.md): resume-snapshot (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-04-I](../../backlog/tasks/C08/C08-04-I.md): reconnect-screen (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-05-I](../../backlog/tasks/C08/C08-05-I.md): grace-window (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-06-I](../../backlog/tasks/C08/C08-06-I.md): owner-loss (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-07-I](../../backlog/tasks/C08/C08-07-I.md): active-singer-loss (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-08-I](../../backlog/tasks/C08/C08-08-I.md): background-resume (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-09-I](../../backlog/tasks/C08/C08-09-I.md): event-resync (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-10-I](../../backlog/tasks/C08/C08-10-I.md): device-replacement (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-11-I](../../backlog/tasks/C08/C08-11-I.md): heartbeat-expiry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-12-I](../../backlog/tasks/C08/C08-12-I.md): team-forfeit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-13-I](../../backlog/tasks/C08/C08-13-I.md): clock-offset (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-14-I](../../backlog/tasks/C08/C08-14-I.md): resume-ticket (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-15-I](../../backlog/tasks/C08/C08-15-I.md): network-quality (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C08-16-I](../../backlog/tasks/C08/C08-16-I.md): presence-cleanup (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
