# Scoring, steals and disputes — component design

Component: C10. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Convert verified evidence into a deterministic ledger with equal opportunities and explicit private-party dispute handling.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C09. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `scoreAttempt; grantSteal; requestReview; applyReviewResolution`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: scoreLedger/{entryId}; per-round opportunity counters; review requests.

**Invariant:** The model never supplies final points. Every ledger entry has a unique source attempt or reversal and a reason code.

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
| REQ-C10-01 | score-ledger | S | Append at most one score event per settled attempt and recompute team totals. | Repeated adjudication callbacks cannot double-award points. |
| REQ-C10-02 | round-score-policy | S | Implement 20 singing points or 10 identification plus10 singing as configured. | Partial recognition cannot accidentally award the full20. |
| REQ-C10-03 | scoreboard-widget | M | Render authoritative team totals and explained point changes. | Optimistic local answer state never changes the competitive score. |
| REQ-C10-04 | steal-window | S | Offer an eligible 10-point steal after a failed answer where the round allows. | Original team cannot steal its own failed attempt. |
| REQ-C10-05 | hint-deduction | S | Apply a five-point hint reduction once before the hint is revealed. | Hint retries do not multiply deductions. |
| REQ-C10-06 | wrong-buzz-penalty | S | Apply minus5 only to a confirmed wrong buzz under the room rule. | Provider uncertainty receives no wrong-answer penalty. |
| REQ-C10-07 | round-cap | S | Enforce published maximum opportunities and score caps symmetrically. | Repeated retries cannot create extra scoring opportunities. |
| REQ-C10-08 | draw-resolution | S | Resolve tied results with the configured neutral shared tiebreak or draw. | Network outage in tiebreak never defaults to one team's win. |
| REQ-C10-09 | dispute-request | M | Let a team request review with a fixed reason within the review window. | Expired review controls remain disabled after reconnect. |
| REQ-C10-10 | party-consensus | S | Apply private-room correction only after both captains agree. | A lone host vote cannot override the opposing team. |
| REQ-C10-11 | ledger-reversal | S | Correct a settled score through an auditable compensating entry. | Original ledger entries are never silently edited. |
| REQ-C10-12 | uncertain-outcome | S | Convert low-evidence answers into neutral retry or void according to policy. | Abstention is never interpreted as a correct answer. |
| REQ-C10-13 | review-expiry | S | Resolve unanswered reviews using the predeclared neutral policy. | A late vote cannot mutate finalized results. |
| REQ-C10-14 | score-explanation | M | Show concise reason codes and point breakdown without raw model reasoning. | Internal prompts and hidden answer keys are never displayed. |
| REQ-C10-15 | opportunity-audit | S | Compare team attempts and caps before publishing final outcome. | An inconsistent opportunity ledger blocks finalization for repair. |
| REQ-C10-16 | score-replay | O | Verify score totals from immutable fixtures and ledger replay. | Tampered running totals fail the audit even if UI looks correct. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C10-01-I](../../backlog/tasks/C10/C10-01-I.md): score-ledger (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-02-I](../../backlog/tasks/C10/C10-02-I.md): round-score-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-03-I](../../backlog/tasks/C10/C10-03-I.md): scoreboard-widget (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-04-I](../../backlog/tasks/C10/C10-04-I.md): steal-window (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-05-I](../../backlog/tasks/C10/C10-05-I.md): hint-deduction (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-06-I](../../backlog/tasks/C10/C10-06-I.md): wrong-buzz-penalty (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-07-I](../../backlog/tasks/C10/C10-07-I.md): round-cap (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-08-I](../../backlog/tasks/C10/C10-08-I.md): draw-resolution (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-09-I](../../backlog/tasks/C10/C10-09-I.md): dispute-request (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-10-I](../../backlog/tasks/C10/C10-10-I.md): party-consensus (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-11-I](../../backlog/tasks/C10/C10-11-I.md): ledger-reversal (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-12-I](../../backlog/tasks/C10/C10-12-I.md): uncertain-outcome (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-13-I](../../backlog/tasks/C10/C10-13-I.md): review-expiry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-14-I](../../backlog/tasks/C10/C10-14-I.md): score-explanation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-15-I](../../backlog/tasks/C10/C10-15-I.md): opportunity-audit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C10-16-I](../../backlog/tasks/C10/C10-16-I.md): score-replay (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
