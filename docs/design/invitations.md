# Invitations and app links — component design

Component: C07. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Support room code, QR and HTTPS app links with a browser fallback and explicit code entry after installation.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C05. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `createInvite; resolveInvite; revokeInvite; consumeInviteIntent`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Hashed invite token; expiresAt; revocation version; local pending invite.

**Invariant:** Firebase Dynamic Links is excluded; no invite grants membership without authenticated join and capacity checks.

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
| REQ-C07-01 | invite-creation | S | Issue an expiring room invitation without embedding an answer or credential. | A closed room cannot issue a new invite. |
| REQ-C07-02 | invite-share | M | Share the safe HTTPS URL and room code through the native sheet. | Cancelling the share sheet does not mark anyone as invited. |
| REQ-C07-03 | deep-link-router | M | Parse only the configured HTTPS host and allowed join path. | Malicious redirect or foreign scheme is rejected. |
| REQ-C07-04 | landing-page | O | Build a minimal hosted fallback with copyable code and install links. | No authentication token is stored in the landing page query. |
| REQ-C07-05 | qr-encoding | M | Render the same normalized invitation URL as a QR code. | Oversized or invalid invitation data never reaches the encoder. |
| REQ-C07-06 | manual-code-entry | M | Normalize case and spacing while preserving code validation. | Ambiguous invalid characters show validation before a network call. |
| REQ-C07-07 | pending-invite | M | Persist one bounded invitation intent through authentication. | Expired persisted invite is removed on resume. |
| REQ-C07-08 | invite-revocation | S | Invalidate the room's prior invitation generation atomically. | Old links fail after regeneration even before their expiry time. |
| REQ-C07-09 | android-app-links | O | Define assetlinks association using release signing inputs supplied at deployment. | Placeholder signing fingerprints fail release validation. |
| REQ-C07-10 | ios-universal-links | O | Define association file and entitlement settings for the release bundle. | Development bundle identifiers cannot pass production verification. |
| REQ-C07-11 | invite-rate-limit | S | Throttle invalid invitation resolution attempts. | Errors cannot distinguish an existing full private room from guessed codes. |
| REQ-C07-12 | clipboard-code | M | Copy room code with accessible confirmation and explicit user action. | The app never reads clipboard contents in the background. |
| REQ-C07-13 | invite-preview | M | Show safe room mode and expiry after authenticated resolution. | Unknown inviter identity is not fabricated. |
| REQ-C07-14 | install-return | M | Support explicit code re-entry when installation loses link context. | The UI does not promise automatic deferred deep linking. |
| REQ-C07-15 | invite-telemetry | S | Measure opened and joined counts without recording raw invite tokens. | Revoked tokens cannot be included in event payloads. |
| REQ-C07-16 | invite-cleanup | S | Remove expired invitation lookup records with retention-safe jobs. | Cleanup of one room never revokes another room's token. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C07-01-I](../../backlog/tasks/C07/C07-01-I.md): invite-creation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-02-I](../../backlog/tasks/C07/C07-02-I.md): invite-share (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-03-I](../../backlog/tasks/C07/C07-03-I.md): deep-link-router (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-04-I](../../backlog/tasks/C07/C07-04-I.md): landing-page (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-05-I](../../backlog/tasks/C07/C07-05-I.md): qr-encoding (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-06-I](../../backlog/tasks/C07/C07-06-I.md): manual-code-entry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-07-I](../../backlog/tasks/C07/C07-07-I.md): pending-invite (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-08-I](../../backlog/tasks/C07/C07-08-I.md): invite-revocation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-09-I](../../backlog/tasks/C07/C07-09-I.md): android-app-links (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-10-I](../../backlog/tasks/C07/C07-10-I.md): ios-universal-links (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-11-I](../../backlog/tasks/C07/C07-11-I.md): invite-rate-limit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-12-I](../../backlog/tasks/C07/C07-12-I.md): clipboard-code (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-13-I](../../backlog/tasks/C07/C07-13-I.md): invite-preview (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-14-I](../../backlog/tasks/C07/C07-14-I.md): install-return (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-15-I](../../backlog/tasks/C07/C07-15-I.md): invite-telemetry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C07-16-I](../../backlog/tasks/C07/C07-16-I.md): invite-cleanup (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
