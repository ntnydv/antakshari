# Lobby, team selection and readiness — component design

Component: C06. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Make team membership and device readiness explicit before server-authorized match start.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C05. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `selectTeam; setReady; nominateSinger; requestStart`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: members teamId/slot/readyVersion; readiness report; turn rotation schedule.

**Invariant:** Teams balance exactly for the selected mode; every present player acknowledges the same settings version.

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
| REQ-C06-01 | team-selection | S | Assign available team slots transactionally for the selected mode. | Two users selecting one slot cannot both acquire it. |
| REQ-C06-02 | lobby-view | M | Render team slots, mic status, pack and ready controls. | A full team remains visibly unavailable during stale updates. |
| REQ-C06-03 | ready-toggle | S | Record readiness against the current room settings version. | Old-version ready commands cannot satisfy the start barrier. |
| REQ-C06-04 | start-barrier | S | Start only when teams are balanced and all required clients are ready. | Owner start during asset preparation returns not-ready. |
| REQ-C06-05 | mic-check | M | Record a local-only microphone test with clear level feedback. | Denied microphone permission does not falsely report ready-to-sing. |
| REQ-C06-06 | team-swap | S | Swap lobby slots with both affected participants' consent. | Pending swap is cancelled when either user leaves. |
| REQ-C06-07 | singer-rotation | S | Build a deterministic per-team singer rotation at match creation. | The same teammate cannot occupy every slot by resubmitting nomination. |
| REQ-C06-08 | captain-nomination | S | Assign one captain for limited party dispute decisions. | A captain cannot override another team's vote. |
| REQ-C06-09 | ready-reset | M | Explain why readiness resets after a pack or roster change. | A prior ready animation cannot restore server readiness. |
| REQ-C06-10 | device-preflight | M | Check supported playback and capture before advertising media readiness. | Unsupported video codec blocks affected rounds with a clear reason. |
| REQ-C06-11 | preload-progress | M | Display local cue-cache progress without revealing future song names. | Asset failures expose safe identifiers only. |
| REQ-C06-12 | team-labels | M | Provide stable text and icon identifiers for the two teams. | Color blindness mode retains unambiguous team ownership. |
| REQ-C06-13 | late-join-policy | S | Reject new participants once the match roster is frozen. | Invitation retries cannot replace an active player mid-match. |
| REQ-C06-14 | lobby-chat-presets | M | Send only fixed readiness/help reactions during the pilot. | Arbitrary user text is not accepted by the reaction payload. |
| REQ-C06-15 | start-idempotency | S | Reserve one matchId for repeated start commands. | Concurrent starts never create two active matches for a room. |
| REQ-C06-16 | preflight-timeout | S | Return clients to lobby when the readiness barrier expires. | No player loses points for a failed preflight. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C06-01-I](../../backlog/tasks/C06/C06-01-I.md): team-selection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-02-I](../../backlog/tasks/C06/C06-02-I.md): lobby-view (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-03-I](../../backlog/tasks/C06/C06-03-I.md): ready-toggle (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-04-I](../../backlog/tasks/C06/C06-04-I.md): start-barrier (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-05-I](../../backlog/tasks/C06/C06-05-I.md): mic-check (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-06-I](../../backlog/tasks/C06/C06-06-I.md): team-swap (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-07-I](../../backlog/tasks/C06/C06-07-I.md): singer-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-08-I](../../backlog/tasks/C06/C06-08-I.md): captain-nomination (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-09-I](../../backlog/tasks/C06/C06-09-I.md): ready-reset (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-10-I](../../backlog/tasks/C06/C06-10-I.md): device-preflight (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-11-I](../../backlog/tasks/C06/C06-11-I.md): preload-progress (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-12-I](../../backlog/tasks/C06/C06-12-I.md): team-labels (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-13-I](../../backlog/tasks/C06/C06-13-I.md): late-join-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-14-I](../../backlog/tasks/C06/C06-14-I.md): lobby-chat-presets (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-15-I](../../backlog/tasks/C06/C06-15-I.md): start-idempotency (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C06-16-I](../../backlog/tasks/C06/C06-16-I.md): preflight-timeout (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
