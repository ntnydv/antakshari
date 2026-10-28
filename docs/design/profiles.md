# Player profiles and preferences — component design

Component: C04. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Collect minimal nicknames, avatar presets, language and era preferences used to build a fair shared room pack.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C03. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `upsertProfile; getPublicProfile; resolvePackPreferences`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: profiles/{uid}; userPrivate/{uid}; immutable room preference snapshot.

**Invariant:** Public profile contains no email or consent detail; preference intersection cannot silently exclude a player.

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
| REQ-C04-01 | profile-editor | M | Save nickname and preset avatar with visible pending state. | Whitespace-only or overlength nicknames cannot be submitted. |
| REQ-C04-02 | profile-write-policy | S | Allow nickname and avatar fields only for the authenticated owner. | Unknown profile fields are rejected rather than persisted. |
| REQ-C04-03 | public-profile | S | Return nickname and avatar only to authorized room participants. | Email and consent fields never enter the public projection. |
| REQ-C04-04 | language-preference | M | Choose Hindi/English UI and available song-language packs separately. | Selecting an unavailable song pack shows availability rather than silently switching. |
| REQ-C04-05 | era-preference | M | Choose broad catalogue eras without asking for a player's age. | No chosen era means use the published room default. |
| REQ-C04-06 | pack-intersection | S | Compute a nonempty room pack agreed by all participants. | An empty preference intersection blocks start with actionable choices. |
| REQ-C04-07 | nickname-moderation | S | Apply deterministic profanity/length controls and moderation state to public names. | Model timeout cannot publish an unreviewed flagged nickname. |
| REQ-C04-08 | avatar-allowlist | S | Accept only bundled avatar IDs for MVP. | Remote image URLs or file paths are rejected. |
| REQ-C04-09 | profile-snapshot | M | Freeze displayed teammate identity for a running match with explicit refresh policy. | Mid-match nickname edits cannot impersonate another participant. |
| REQ-C04-10 | preference-reset | M | Restore published defaults after explicit reset action. | Reset does not erase historical match results. |
| REQ-C04-11 | profile-conflict | S | Use version preconditions to prevent stale preference writes. | A stale edit returns conflict and the current profile version. |
| REQ-C04-12 | nickname-uniqueness | M | Disambiguate identical room nicknames with team/slot indicators. | Duplicate names remain accessible to screen readers. |
| REQ-C04-13 | recent-pack-choice | M | Remember last selected eligible pack for room creation. | A withdrawn pack is not automatically reselected. |
| REQ-C04-14 | profile-cache-isolation | M | Clear private preferences when the active uid changes. | Another guest cannot see a prior guest's preferences. |
| REQ-C04-15 | profile-deletion | S | Remove profile data and anonymize eligible result projections under retention policy. | Deletion cannot alter aggregate match scores. |
| REQ-C04-16 | preference-analytics | S | Emit consented coarse language/era choice events without free text. | Declined analytics consent results in no preference event. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C04-01-I](../../backlog/tasks/C04/C04-01-I.md): profile-editor (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-02-I](../../backlog/tasks/C04/C04-02-I.md): profile-write-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-03-I](../../backlog/tasks/C04/C04-03-I.md): public-profile (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-04-I](../../backlog/tasks/C04/C04-04-I.md): language-preference (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-05-I](../../backlog/tasks/C04/C04-05-I.md): era-preference (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-06-I](../../backlog/tasks/C04/C04-06-I.md): pack-intersection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-07-I](../../backlog/tasks/C04/C04-07-I.md): nickname-moderation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-08-I](../../backlog/tasks/C04/C04-08-I.md): avatar-allowlist (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-09-I](../../backlog/tasks/C04/C04-09-I.md): profile-snapshot (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-10-I](../../backlog/tasks/C04/C04-10-I.md): preference-reset (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-11-I](../../backlog/tasks/C04/C04-11-I.md): profile-conflict (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-12-I](../../backlog/tasks/C04/C04-12-I.md): nickname-uniqueness (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-13-I](../../backlog/tasks/C04/C04-13-I.md): recent-pack-choice (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-14-I](../../backlog/tasks/C04/C04-14-I.md): profile-cache-isolation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-15-I](../../backlog/tasks/C04/C04-15-I.md): profile-deletion (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C04-16-I](../../backlog/tasks/C04/C04-16-I.md): preference-analytics (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
