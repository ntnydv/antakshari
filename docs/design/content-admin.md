# Content operations console — component design

Component: C20. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Provide an internal Flutter web or CLI-assisted editor for licensed song metadata, cue QA and reversible pack publication.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C16, C19. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `createDraft; editSections; validateAssets; approvePublication`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Draft content records; editor approvals; validation reports; publication history.

**Invariant:** Admin roles are server verified. AI suggestions remain draft and cannot publish content or rights claims.

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
| REQ-C20-01 | admin-entry | M | Gate the internal content route on verified role and show an unauthorized state. | A hidden route is never considered authorization. |
| REQ-C20-02 | song-editor | M | Edit song identity, aliases and language with version-aware saves. | Conflicting edits require reload or explicit reconciliation. |
| REQ-C20-03 | section-editor | M | Mark mukhda/antara/phrase spans and accepted alternatives for a version. | Out-of-range or overlapping invalid spans fail validation. |
| REQ-C20-04 | publication-command | S | Publish only validated drafts with an editor approval and rights evidence reference. | An AI-only approval or missing rights field cannot publish. |
| REQ-C20-05 | cue-upload | M | Upload draft media to a restricted staging path with clear progress. | Failed upload cannot produce a playable published clue. |
| REQ-C20-06 | rights-editor | M | Record territory, use permission and expiry with supporting evidence link. | A blank rights record remains visibly blocked. |
| REQ-C20-07 | clue-preview | M | Preview exactly the sanitized player-facing cue for each round. | Preview cannot accidentally use original unsanitized media. |
| REQ-C20-08 | validation-dashboard | M | Show publication blockers grouped by round capability and asset. | Warnings cannot be confused with passed required checks. |
| REQ-C20-09 | batch-import | S | Validate row-level metadata imports and return per-record errors. | One malformed row cannot partially publish the whole pack. |
| REQ-C20-10 | alias-review | M | Review ambiguous title and transliteration collisions before publication. | Resolving one alias cannot silently relabel another song. |
| REQ-C20-11 | pack-editor | M | Compose a balanced pack with minimum per-round coverage checks. | An empty round pool blocks the publish action. |
| REQ-C20-12 | withdraw-content | S | Withdraw an asset with reason and immutable audit record. | Withdrawal cannot erase historical proof of prior publication. |
| REQ-C20-13 | ai-suggestion-review | M | Show proposed tags or clue descriptions alongside editable source fields. | Generated text is never auto-saved as approved metadata. |
| REQ-C20-14 | role-separation | S | Distinguish content editor from publication approver for release operations. | An upload-only role cannot approve its own public pack. |
| REQ-C20-15 | publication-diff | M | Display changes from the prior immutable pack before approval. | Hidden answer or rights changes cannot disappear from the diff. |
| REQ-C20-16 | admin-recovery | S | Restore a prior eligible pack version without mutating active matches. | A rollback to expired rights is rejected. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C20-01-I](../../backlog/tasks/C20/C20-01-I.md): admin-entry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-02-I](../../backlog/tasks/C20/C20-02-I.md): song-editor (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-03-I](../../backlog/tasks/C20/C20-03-I.md): section-editor (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-04-I](../../backlog/tasks/C20/C20-04-I.md): publication-command (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-05-I](../../backlog/tasks/C20/C20-05-I.md): cue-upload (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-06-I](../../backlog/tasks/C20/C20-06-I.md): rights-editor (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-07-I](../../backlog/tasks/C20/C20-07-I.md): clue-preview (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-08-I](../../backlog/tasks/C20/C20-08-I.md): validation-dashboard (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-09-I](../../backlog/tasks/C20/C20-09-I.md): batch-import (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-10-I](../../backlog/tasks/C20/C20-10-I.md): alias-review (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-11-I](../../backlog/tasks/C20/C20-11-I.md): pack-editor (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-12-I](../../backlog/tasks/C20/C20-12-I.md): withdraw-content (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-13-I](../../backlog/tasks/C20/C20-13-I.md): ai-suggestion-review (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-14-I](../../backlog/tasks/C20/C20-14-I.md): role-separation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-15-I](../../backlog/tasks/C20/C20-15-I.md): publication-diff (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C20-16-I](../../backlog/tasks/C20/C20-16-I.md): admin-recovery (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
