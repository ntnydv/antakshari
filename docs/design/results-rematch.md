# Results and rematches — component design

Component: C18. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Close the game with a trustworthy score breakdown and a low-friction private rematch.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C09, C10. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `finalizeResult; getResult; requestRematch; confirmRematch`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: matchResults/{id}; round summaries; rematch votes; consented local history.

**Invariant:** Results derive from the immutable ledger; an abandoned match is distinct from a win, draw or provisional party result.

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
| REQ-C18-01 | result-projection | S | Build final team totals and per-round breakdown from settled ledger entries. | Unsettled or inconsistent ledger blocks final result publication. |
| REQ-C18-02 | results-screen | M | Show winner/draw/provisional status and per-round points clearly. | A provisional result is never rendered as verified competition. |
| REQ-C18-03 | rematch-vote | S | Collect each participant's intent and create one fresh lobby when eligible. | Duplicate votes cannot create several rematches. |
| REQ-C18-04 | rematch-ui | M | Display who is ready to replay and allow a player to leave. | A departed player is removed from the required vote count by policy. |
| REQ-C18-05 | round-breakdown | M | Explain identification, singing, hint and steal points without raw model reasoning. | Reversed entries do not appear as unexplained total differences. |
| REQ-C18-06 | player-participation | M | Show turns taken and helpful team contributions without pitch ranking. | A disconnected player's absence is not labelled poor singing. |
| REQ-C18-07 | result-access | S | Restrict detailed results to match participants and scoped shared summaries. | A guessed matchId cannot retrieve recordings. |
| REQ-C18-08 | history-list | M | List the current user's bounded recent match summaries. | Changing identity clears the previous user's history view. |
| REQ-C18-09 | rematch-pack | S | Carry forward agreed preferences while rechecking current pack eligibility. | Withdrawn content cannot return through cached rematch settings. |
| REQ-C18-10 | result-share | M | Create an optional score-only share card after user action. | No audio, invite token or private nickname is shared without consent. |
| REQ-C18-11 | abandoned-result | M | Explain technical abandonment without awarding a fabricated winner. | Returning late to an abandoned match cannot reopen gameplay. |
| REQ-C18-12 | result-deduplication | S | Finalize and notify a match result idempotently. | Repeated finalization events do not create duplicate history rows. |
| REQ-C18-13 | history-retention | S | Delete or anonymize result views according to retention settings. | Account deletion cannot remove other players' own permitted results. |
| REQ-C18-14 | review-resolution-view | M | Show accepted review corrections and final score status. | Late obsolete review events cannot overwrite the current result. |
| REQ-C18-15 | result-analytics | S | Emit completed/abandoned outcome metrics without identifying song lyrics. | Analytics opt-out prevents user-level result events. |
| REQ-C18-16 | rematch-concurrency | S | Resolve competing rematch/create requests using one source-match reservation. | Two captains clicking simultaneously produce one new match context. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C18-01-I](../../backlog/tasks/C18/C18-01-I.md): result-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-02-I](../../backlog/tasks/C18/C18-02-I.md): results-screen (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-03-I](../../backlog/tasks/C18/C18-03-I.md): rematch-vote (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-04-I](../../backlog/tasks/C18/C18-04-I.md): rematch-ui (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-05-I](../../backlog/tasks/C18/C18-05-I.md): round-breakdown (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-06-I](../../backlog/tasks/C18/C18-06-I.md): player-participation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-07-I](../../backlog/tasks/C18/C18-07-I.md): result-access (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-08-I](../../backlog/tasks/C18/C18-08-I.md): history-list (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-09-I](../../backlog/tasks/C18/C18-09-I.md): rematch-pack (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-10-I](../../backlog/tasks/C18/C18-10-I.md): result-share (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-11-I](../../backlog/tasks/C18/C18-11-I.md): abandoned-result (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-12-I](../../backlog/tasks/C18/C18-12-I.md): result-deduplication (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-13-I](../../backlog/tasks/C18/C18-13-I.md): history-retention (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-14-I](../../backlog/tasks/C18/C18-14-I.md): review-resolution-view (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-15-I](../../backlog/tasks/C18/C18-15-I.md): result-analytics (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C18-16-I](../../backlog/tasks/C18/C18-16-I.md): rematch-concurrency (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
