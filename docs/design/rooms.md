# Private room service — component design

Component: C05. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Create private 1v1/2v2 rooms with transactional membership, short-lived invitations and an explicit lifecycle.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C03, C04. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `createRoom; joinRoom; leaveRoom; closeRoom`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: rooms/{roomId}; roomCodes/{digest}; rooms/{roomId}/members/{uid}.

**Invariant:** At most four members; authenticated membership is required for every room read; invite code is not sufficient for answer access.

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
| REQ-C05-01 | create-room | S | Create room and creator membership atomically with immutable mode. | Retrying the commandId returns the same room rather than a second room. |
| REQ-C05-02 | join-room | S | Atomically enforce capacity and membership uniqueness for a valid invite. | Two concurrent joins for the final slot produce exactly one admission. |
| REQ-C05-03 | room-screen | M | Display create/join progress and authoritative member list. | A rejected join never leaves a phantom local member. |
| REQ-C05-04 | leave-room | S | Remove membership and apply lobby or in-match departure policy. | Duplicate leave is a no-op with the same result. |
| REQ-C05-05 | room-capacity | S | Enforce two slots for 1v1 and four for 2v2. | A fifth participant cannot exploit a stale member count. |
| REQ-C05-06 | room-expiry | S | Expire idle lobbies after the configured 30-minute window. | An expired invite cannot resurrect a closed room. |
| REQ-C05-07 | close-room | S | Allow lobby owner to close before a match starts. | A nonowner close command returns permission-denied. |
| REQ-C05-08 | room-code-resolution | S | Resolve normalized invite codes without exposing membership details to outsiders. | Invalid code requests are rate limited and have generic errors. |
| REQ-C05-09 | room-settings | M | Edit pack, round count and party adjudication policy before readiness. | Changing settings clears readiness for all participants. |
| REQ-C05-10 | room-settings-validation | S | Freeze approved settings and reject unsupported round combinations. | Hum-and-guess is disabled in1v1; the all-ten marathon requires2v2. |
| REQ-C05-11 | room-subscription | M | Subscribe and dispose room streams on navigation. | Leaving a room cancels listeners from the old room. |
| REQ-C05-12 | room-owner-transfer | S | Transfer lobby owner to earliest eligible connected member. | A disconnected former owner cannot reclaim control via a stale command. |
| REQ-C05-13 | room-membership-token | S | Mint scoped relay access only for current room membership. | A token from another room cannot join this room's media bus. |
| REQ-C05-14 | room-abandonment | S | Close a room when all participants leave and schedule cleanup. | Late presence signals cannot reopen a terminal room. |
| REQ-C05-15 | room-summary | S | Provide a compact permitted room view for invitation landing. | Private cue and song manifest fields are absent. |
| REQ-C05-16 | room-creation-quota | S | Limit simultaneous active lobbies per user. | Quota exhaustion returns a list of the user's own resumable rooms only. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C05-01-I](../../backlog/tasks/C05/C05-01-I.md): create-room (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-02-I](../../backlog/tasks/C05/C05-02-I.md): join-room (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-03-I](../../backlog/tasks/C05/C05-03-I.md): room-screen (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-04-I](../../backlog/tasks/C05/C05-04-I.md): leave-room (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-05-I](../../backlog/tasks/C05/C05-05-I.md): room-capacity (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-06-I](../../backlog/tasks/C05/C05-06-I.md): room-expiry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-07-I](../../backlog/tasks/C05/C05-07-I.md): close-room (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-08-I](../../backlog/tasks/C05/C05-08-I.md): room-code-resolution (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-09-I](../../backlog/tasks/C05/C05-09-I.md): room-settings (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-10-I](../../backlog/tasks/C05/C05-10-I.md): room-settings-validation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-11-I](../../backlog/tasks/C05/C05-11-I.md): room-subscription (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-12-I](../../backlog/tasks/C05/C05-12-I.md): room-owner-transfer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-13-I](../../backlog/tasks/C05/C05-13-I.md): room-membership-token (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-14-I](../../backlog/tasks/C05/C05-14-I.md): room-abandonment (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-15-I](../../backlog/tasks/C05/C05-15-I.md): room-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C05-16-I](../../backlog/tasks/C05/C05-16-I.md): room-creation-quota (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
