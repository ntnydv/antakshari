# Safety, privacy and access policies — component design

Component: C19. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Enforce participant access, minimal recording retention, reporting and consistent handling of personal data.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C03, C01. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `authorizeResource; recordConsent; reportParticipant; eraseData`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Consent records; scoped moderation reports; deletion jobs; security rule test fixtures.

**Invariant:** Private rooms are not public broadcasts; explicit audio processing consent is required, raw attempts are not analytics payloads.

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
| REQ-C19-01 | firestore-rules | O | Deny client mutation of scores, private answers and authoritative match state. | Authenticated outsiders cannot read another room or answer key. |
| REQ-C19-02 | storage-rules | O | Restrict attempt uploads to owner/grant and cue access to approved delivery paths. | Guessing object paths never grants recording access. |
| REQ-C19-03 | consent-screen | M | Explain who hears audio, Meta processing and retention before singing. | Declining consent leaves capture disabled without dark patterns. |
| REQ-C19-04 | retention-cleanup | S | Delete ordinary raw attempts within24hours and clean expired provider files when supported. | Cleanup retries are idempotent and do not delete active media. |
| REQ-C19-05 | report-flow | M | Let a participant report another room member with fixed reasons. | Reports cannot expose prior unrelated room history. |
| REQ-C19-06 | mute-player | M | Allow local muting with explicit consequences for listening rounds. | Muted state is visible so missed cues are understandable. |
| REQ-C19-07 | room-removal | S | Allow supported lobby removal with owner checks and immediate ticket revocation. | Removal cannot be used to alter an active result without the published policy. |
| REQ-C19-08 | privacy-settings | M | Separate optional analytics from required competitive audio consent. | Analytics consent never silently enables sharing recordings. |
| REQ-C19-09 | data-export | S | Prepare an authenticated export of the user's own eligible records. | Export excludes other players' recordings and private provider prompts. |
| REQ-C19-10 | erasure-orchestrator | S | Erase owned personal data across Auth, Firestore and Storage via resumable steps. | Partial deletion remains tracked rather than falsely marked complete. |
| REQ-C19-11 | admin-access | S | Require verified server claims and least-privilege role checks for content/admin actions. | Client-set role or email domain never grants admin access. |
| REQ-C19-12 | security-audit-log | S | Record privileged mutations with actor, reason and request ID without secrets. | Audit logging failure blocks high-risk publication changes. |
| REQ-C19-13 | abuse-rate-controls | S | Apply bounded per-user and room actions for invites, reports and capture attempts. | One user's abuse cannot consume the whole tenant quota. |
| REQ-C19-14 | provider-data-mode | S | Reject Contributor model IDs and document actual provider retention configuration. | Standard no-training policy is not misrepresented as zero retention. |
| REQ-C19-15 | recording-access-log | S | Audit authorized review access to retained attempts. | A review outside membership and retention windows is denied. |
| REQ-C19-16 | security-regression | O | Run rules and API authorization adversarial fixtures across user roles. | A passed happy path cannot mask an outsider-read regression. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C19-01-I](../../backlog/tasks/C19/C19-01-I.md): firestore-rules (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-02-I](../../backlog/tasks/C19/C19-02-I.md): storage-rules (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-03-I](../../backlog/tasks/C19/C19-03-I.md): consent-screen (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-04-I](../../backlog/tasks/C19/C19-04-I.md): retention-cleanup (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-05-I](../../backlog/tasks/C19/C19-05-I.md): report-flow (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-06-I](../../backlog/tasks/C19/C19-06-I.md): mute-player (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-07-I](../../backlog/tasks/C19/C19-07-I.md): room-removal (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-08-I](../../backlog/tasks/C19/C19-08-I.md): privacy-settings (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-09-I](../../backlog/tasks/C19/C19-09-I.md): data-export (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-10-I](../../backlog/tasks/C19/C19-10-I.md): erasure-orchestrator (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-11-I](../../backlog/tasks/C19/C19-11-I.md): admin-access (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-12-I](../../backlog/tasks/C19/C19-12-I.md): security-audit-log (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-13-I](../../backlog/tasks/C19/C19-13-I.md): abuse-rate-controls (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-14-I](../../backlog/tasks/C19/C19-14-I.md): provider-data-mode (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-15-I](../../backlog/tasks/C19/C19-15-I.md): recording-access-log (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C19-16-I](../../backlog/tasks/C19/C19-16-I.md): security-regression (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
