# Mobile audio capture — component design

Component: C11. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Capture short consented singing attempts with one mobile microphone, explicit controls and predictable PCM framing.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C02, C03. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `prepareMicrophone; startAttempt; emitFrame; stopAttempt`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Transient PCM buffer; attempt grant; bounded local retry recording.

**Invariant:** 24kHz mono signed16 little-endian; max20 seconds; stop immediately on grant revocation or background. Never record before consent.

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
| REQ-C11-01 | pcm-recorder | M | Produce 24kHz mono signed16 PCM from the selected mobile input. | Unsupported native format triggers explicit conversion or blocks start. |
| REQ-C11-02 | capture-control | M | Start capture only after the server answer grant and local consent. | A pregrant button press never records audio. |
| REQ-C11-03 | duration-cap | M | Stop at the configured20-second capture limit and finalize once. | Timer and user stop racing cannot finalize twice. |
| REQ-C11-04 | audio-session | M | Coordinate capture and cue playback through one audio-session owner. | An incoming call stops capture and reports interruption. |
| REQ-C11-05 | frame-pacing | M | Emit bounded PCM frames at realtime cadence without queue growth. | A stalled socket does not buffer unbounded private audio. |
| REQ-C11-06 | mic-permission | M | Handle denied and permanently denied permissions with useful recovery UI. | Returning from settings rechecks actual permission before enabling capture. |
| REQ-C11-07 | waveform-meter | M | Display local amplitude for feedback without treating it as song evidence. | Silence cannot masquerade as successful recording. |
| REQ-C11-08 | sample-resampler | M | Resample hardware output into required24kHz PCM deterministically. | Odd byte lengths and unsupported channel counts fail validation. |
| REQ-C11-09 | bluetooth-routing | M | Handle headset route changes while keeping a stable attempt lifecycle. | Disconnecting headphones stops or safely reinitializes the active attempt. |
| REQ-C11-10 | echo-control | M | Pause cue output before competitive capture and recommend headphones. | Reference cue audio is not intentionally fed into the judging stream. |
| REQ-C11-11 | buffer-cleanup | M | Erase transient audio files after upload/expiry according to policy. | A crash recovery run removes abandoned private recordings. |
| REQ-C11-12 | grant-revocation | M | Stop recording immediately when the server revokes the attempt. | Buffered frames after revocation are discarded. |
| REQ-C11-13 | capture-interruption | M | Classify phone call, device lock and OS interruption separately. | Interrupted audio is not automatically submitted as complete. |
| REQ-C11-14 | offline-recording-policy | M | Block new competitive capture when the relay is unavailable. | Cached grants cannot enable offline competitive submissions. |
| REQ-C11-15 | audio-quality | M | Flag clipping and silence locally as advisory quality indicators. | Local quality flags never decide competitive correctness. |
| REQ-C11-16 | capture-accessibility | M | Provide semantic start/stop controls and haptic state feedback. | Screen-reader activation cannot start two recorder instances. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C11-01-I](../../backlog/tasks/C11/C11-01-I.md): pcm-recorder (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-02-I](../../backlog/tasks/C11/C11-02-I.md): capture-control (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-03-I](../../backlog/tasks/C11/C11-03-I.md): duration-cap (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-04-I](../../backlog/tasks/C11/C11-04-I.md): audio-session (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-05-I](../../backlog/tasks/C11/C11-05-I.md): frame-pacing (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-06-I](../../backlog/tasks/C11/C11-06-I.md): mic-permission (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-07-I](../../backlog/tasks/C11/C11-07-I.md): waveform-meter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-08-I](../../backlog/tasks/C11/C11-08-I.md): sample-resampler (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-09-I](../../backlog/tasks/C11/C11-09-I.md): bluetooth-routing (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-10-I](../../backlog/tasks/C11/C11-10-I.md): echo-control (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-11-I](../../backlog/tasks/C11/C11-11-I.md): buffer-cleanup (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-12-I](../../backlog/tasks/C11/C11-12-I.md): grant-revocation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-13-I](../../backlog/tasks/C11/C11-13-I.md): capture-interruption (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-14-I](../../backlog/tasks/C11/C11-14-I.md): offline-recording-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-15-I](../../backlog/tasks/C11/C11-15-I.md): audio-quality (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C11-16-I](../../backlog/tasks/C11/C11-16-I.md): capture-accessibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
