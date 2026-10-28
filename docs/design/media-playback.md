# Cue media playback — component design

Component: C13. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Preload authorized opaque cue assets and coordinate audio/video/still playback with the match cue barrier.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C02, C16. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `fetchCueManifest; preloadCue; acknowledgeReady; playAt`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Opaque asset IDs; short-lived URLs; bounded local cache; playable acknowledgements.

**Invariant:** No future answer metadata or stable public download URLs; a cue becomes playable only to authorized current-match members.

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
| REQ-C13-01 | cue-manifest | S | Issue sanitized current-round media manifests with short-lived URLs. | Manifest strips original filenames and answer metadata. |
| REQ-C13-02 | audio-cue-player | M | Preload and play an authorized audio segment through the shared session. | Cue failure reports not-ready before answer time starts. |
| REQ-C13-03 | video-cue-player | M | Play the physically muted video cue in a bounded accessible frame. | A video asset with an audio track fails content preflight. |
| REQ-C13-04 | still-cue-view | M | Render the authorized still without exposing alt text containing the answer. | Missing image presents neutral retry rather than blank guessing time. |
| REQ-C13-05 | cue-preload-cache | M | Cache only authorized assets within a small size/age budget. | Expired or revoked assets are evicted rather than replayed. |
| REQ-C13-06 | playback-clock | M | Use server cue time and measured offset for coordinated start display. | A late download triggers readiness failure instead of skipping the first clue seconds. |
| REQ-C13-07 | cue-replay-policy | S | Grant only the replays allowed by the round and hint policy. | A client cannot request unlimited fresh signed URLs as replays. |
| REQ-C13-08 | asset-integrity | M | Verify declared hash and byte length before readiness acknowledgement. | Corrupt download never reports playable. |
| REQ-C13-09 | audio-focus | M | Duck optional host audio and stop it before clue or answer capture. | Host speech cannot overlap and mask a competitive cue. |
| REQ-C13-10 | background-media | M | Stop cue playback and mark the client unready when the app backgrounds. | Returning foreground cannot resume a now-expired clue locally. |
| REQ-C13-11 | caption-policy | M | Show rule captions while suppressing clue captions that reveal answers. | Accessibility text never contains hidden song titles. |
| REQ-C13-12 | progressive-reveal | M | Reveal still-image regions according to server stage index. | Local clock changes cannot reveal the full image early. |
| REQ-C13-13 | media-error-report | S | Record safe asset fault codes and trigger symmetric round retry. | One team's playback failure cannot grant the other team automatic points. |
| REQ-C13-14 | download-cancellation | M | Cancel and delete partial downloads when a room is left. | Old download completion cannot populate the next room's cache. |
| REQ-C13-15 | media-expiry | S | Reject expired clue grants and regenerate only for eligible active phases. | A finished match cannot access private future clues. |
| REQ-C13-16 | media-device-matrix | O | Record playback support and interruption behavior on Android and iOS devices. | Emulator-only success does not satisfy physical audio/video validation. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C13-01-I](../../backlog/tasks/C13/C13-01-I.md): cue-manifest (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-02-I](../../backlog/tasks/C13/C13-02-I.md): audio-cue-player (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-03-I](../../backlog/tasks/C13/C13-03-I.md): video-cue-player (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-04-I](../../backlog/tasks/C13/C13-04-I.md): still-cue-view (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-05-I](../../backlog/tasks/C13/C13-05-I.md): cue-preload-cache (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-06-I](../../backlog/tasks/C13/C13-06-I.md): playback-clock (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-07-I](../../backlog/tasks/C13/C13-07-I.md): cue-replay-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-08-I](../../backlog/tasks/C13/C13-08-I.md): asset-integrity (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-09-I](../../backlog/tasks/C13/C13-09-I.md): audio-focus (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-10-I](../../backlog/tasks/C13/C13-10-I.md): background-media (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-11-I](../../backlog/tasks/C13/C13-11-I.md): caption-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-12-I](../../backlog/tasks/C13/C13-12-I.md): progressive-reveal (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-13-I](../../backlog/tasks/C13/C13-13-I.md): media-error-report (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-14-I](../../backlog/tasks/C13/C13-14-I.md): download-cancellation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-15-I](../../backlog/tasks/C13/C13-15-I.md): media-expiry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C13-16-I](../../backlog/tasks/C13/C13-16-I.md): media-device-matrix (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
