# Authoritative match engine — component design

Component: C09. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Execute a versioned state machine, deterministic round plugins and durable phase transitions.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C01, C06. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `submitCommand; transition; runDueDeadline; processOutbox`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: matches/{id}; privateMatchState/{id}; commands/{commandId}; events/{seq}; outbox/{id}.

**Invariant:** Only the server advances phase. Firestore transaction bodies perform no network I/O; side effects use an idempotent outbox.

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
| REQ-C09-01 | command-dispatch | S | Validate membership and route commands through an expectedVersion transaction. | A stale command returns conflict with current version and no mutation. |
| REQ-C09-02 | phase-reducer | S | Implement the documented match phase transitions as a pure reducer. | An answer submitted outside answer_open or recording is rejected. |
| REQ-C09-03 | outbox-worker | S | Persist side effects in the same commit and execute them idempotently afterward. | Worker retries do not create duplicate provider calls or timers. |
| REQ-C09-04 | round-registry | S | Load ten round descriptors through a generated manifest. | Missing or duplicate round IDs fail preflight before a match starts. |
| REQ-C09-05 | match-planner | S | Select six or ten eligible rounds with a seeded reproducible order. | Hum-and-guess is never scheduled in1v1. |
| REQ-C09-06 | deadline-worker | S | Advance expired phases only when phase/version and deadline still match. | A delayed timer for the prior phase becomes a no-op. |
| REQ-C09-07 | answer-grant | S | Issue one active attempt grant for the eligible player and team. | Two simultaneous grants cannot both become active. |
| REQ-C09-08 | buzzer-arbitration | S | Atomically accept the first eligible server-received buzz with a deterministic tie policy. | A retried buzz cannot reorder the original receipt. |
| REQ-C09-09 | cue-preload-barrier | S | Open a cue only after required clients acknowledge playable media. | One failed client causes neutral retry rather than unequal clue time. |
| REQ-C09-10 | phase-snapshot | S | Publish redacted state and player-private projections with one version. | A snapshot cannot mix scores from one version and phase from another. |
| REQ-C09-11 | pause-policy | S | Allow only bounded technical pauses at supported phase boundaries. | A player cannot use repeated pauses to extend answer thinking time. |
| REQ-C09-12 | abort-policy | S | Terminate invalid or empty matches with explicit reason and result policy. | Aborted matches do not grant win rewards. |
| REQ-C09-13 | event-replay | S | Rebuild deterministic score/phase projections from ordered domain events. | Duplicate sequence or missing event fails replay validation. |
| REQ-C09-14 | seed-stability | S | Pin catalogue and rule versions into each match's reproducible seed context. | A mid-match catalogue update cannot change an answer key. |
| REQ-C09-15 | outbox-reconciliation | S | Find committed but unprocessed effects and safely reschedule them. | A reconciliation run cannot repeat a completed effect. |
| REQ-C09-16 | terminal-idempotency | S | Write final match outcome once and reject further competitive commands. | Late ASR completion cannot change a finished match. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C09-01-I](../../backlog/tasks/C09/C09-01-I.md): command-dispatch (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-02-I](../../backlog/tasks/C09/C09-02-I.md): phase-reducer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-03-I](../../backlog/tasks/C09/C09-03-I.md): outbox-worker (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-04-I](../../backlog/tasks/C09/C09-04-I.md): round-registry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-05-I](../../backlog/tasks/C09/C09-05-I.md): match-planner (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-06-I](../../backlog/tasks/C09/C09-06-I.md): deadline-worker (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-07-I](../../backlog/tasks/C09/C09-07-I.md): answer-grant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-08-I](../../backlog/tasks/C09/C09-08-I.md): buzzer-arbitration (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-09-I](../../backlog/tasks/C09/C09-09-I.md): cue-preload-barrier (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-10-I](../../backlog/tasks/C09/C09-10-I.md): phase-snapshot (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-11-I](../../backlog/tasks/C09/C09-11-I.md): pause-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-12-I](../../backlog/tasks/C09/C09-12-I.md): abort-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-13-I](../../backlog/tasks/C09/C09-13-I.md): event-replay (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-14-I](../../backlog/tasks/C09/C09-14-I.md): seed-stability (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-15-I](../../backlog/tasks/C09/C09-15-I.md): outbox-reconciliation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C09-16-I](../../backlog/tasks/C09/C09-16-I.md): terminal-idempotency (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
