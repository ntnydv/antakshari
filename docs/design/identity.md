# Identity and session access — component design

Component: C03. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Use Firebase anonymous sign-in for the first playable private-room pilot, with explicit optional account upgrade.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C01. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `ensureGuest; verifySession; upgradeAccount; revokeSession`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Firebase Auth users; user-private consent version; session capabilities.

**Invariant:** User identity comes from a verified Firebase token, never a uid in request payload; account deletion revokes access.

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
| REQ-C03-01 | guest-session | M | Create or restore one Firebase anonymous identity before joining a room. | Repeated startup does not create multiple guest users. |
| REQ-C03-02 | token-verifier | S | Verify Firebase ID token and derive authenticated uid server-side. | Expired or wrong-project token is rejected before database reads. |
| REQ-C03-03 | app-check-verifier | S | Verify App Check on app commands and relay ticket requests. | Debug tokens are accepted only in emulator configuration. |
| REQ-C03-04 | session-refresh | M | Refresh expired identity once and retry the same idempotent command. | Refresh failure returns to entry without duplicating a command. |
| REQ-C03-05 | anonymous-upgrade | M | Link an optional durable credential to the existing guest identity. | Credential-already-in-use enters explicit recovery without data merge. |
| REQ-C03-06 | sign-out | M | Leave active room and stop audio before clearing the local session. | Network failure still stops local capture immediately. |
| REQ-C03-07 | revoked-session | S | Reject revoked sessions and expire outstanding relay tickets. | A previously issued ticket cannot outlive its session revocation policy. |
| REQ-C03-08 | auth-rate-limit | S | Bound guest command attempts by uid and privacy-preserving abuse key. | Throttled calls return retry timing without user enumeration. |
| REQ-C03-09 | auth-emulator-switch | M | Select emulator endpoints only from development build configuration. | Production builds fail closed on emulator host overrides. |
| REQ-C03-10 | account-merge-policy | S | Reject automatic cross-uid score transfers without an explicit supported flow. | A payload cannot claim another uid's room membership. |
| REQ-C03-11 | consent-version | S | Require the current audio-processing consent version before capture grants. | Missing consent permits browsing but never provider upload. |
| REQ-C03-12 | session-capabilities | S | Issue limited app capabilities for player and content-admin roles. | Client-supplied admin flags cannot elevate privileges. |
| REQ-C03-13 | deletion-request | S | Create an idempotent account-erasure job after recent authentication. | Repeated deletion requests reference one job. |
| REQ-C03-14 | deletion-session-ui | M | Display pending deletion and prevent new match entry. | A failed deletion job remains visible with a support code. |
| REQ-C03-15 | token-redaction | S | Strip authorization headers from request logs and traces. | Nested error causes cannot print bearer tokens. |
| REQ-C03-16 | device-session-list | M | Show only the current account's active session summary and revoke action. | An unauthenticated screen never renders previous-user sessions. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C03-01-I](../../backlog/tasks/C03/C03-01-I.md): guest-session (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-02-I](../../backlog/tasks/C03/C03-02-I.md): token-verifier (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-03-I](../../backlog/tasks/C03/C03-03-I.md): app-check-verifier (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-04-I](../../backlog/tasks/C03/C03-04-I.md): session-refresh (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-05-I](../../backlog/tasks/C03/C03-05-I.md): anonymous-upgrade (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-06-I](../../backlog/tasks/C03/C03-06-I.md): sign-out (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-07-I](../../backlog/tasks/C03/C03-07-I.md): revoked-session (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-08-I](../../backlog/tasks/C03/C03-08-I.md): auth-rate-limit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-09-I](../../backlog/tasks/C03/C03-09-I.md): auth-emulator-switch (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-10-I](../../backlog/tasks/C03/C03-10-I.md): account-merge-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-11-I](../../backlog/tasks/C03/C03-11-I.md): consent-version (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-12-I](../../backlog/tasks/C03/C03-12-I.md): session-capabilities (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-13-I](../../backlog/tasks/C03/C03-13-I.md): deletion-request (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-14-I](../../backlog/tasks/C03/C03-14-I.md): deletion-session-ui (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-15-I](../../backlog/tasks/C03/C03-15-I.md): token-redaction (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C03-16-I](../../backlog/tasks/C03/C03-16-I.md): device-session-list (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
