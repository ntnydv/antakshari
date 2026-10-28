# AI host and stage presentation — component design

Component: C17. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Deliver concise Hindi/Hinglish hosting around verified events while keeping the competitive path usable without generation.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C02, C09, C14. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `renderHostEvent; getHostLine; playHostLine; cancelHostLine`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Versioned line templates; optional Spark text; client speech settings; no celebrity voice clone.

**Invariant:** Host text cannot mutate game state; fallback lines and device/prerecorded speech are always available. Muse is not a TTS service.

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
| REQ-C17-01 | host-event-mapping | S | Map known match events to safe host intents with permitted facts only. | Unknown event types use a neutral template without guessed scores. |
| REQ-C17-02 | host-stage-widget | M | Render short host text alongside rules without blocking primary controls. | Long generated text is bounded and accessible without overflowing. |
| REQ-C17-03 | template-fallback | S | Return deterministic Hindi/English host lines when AI is unavailable. | Provider timeout cannot delay answer_open. |
| REQ-C17-04 | host-generation | S | Generate optional Spark1.3 lines from sanitized event facts and bounded style instructions. | Model output cannot announce a score differing from the event. |
| REQ-C17-05 | device-speech | M | Use device speech or bundled recorded lines when available and captions always. | Missing Hindi voice falls back to captions without blocking play. |
| REQ-C17-06 | host-priority | M | Cancel host speech before cue playback or active singing. | Queued congratulations cannot overlap a new clue. |
| REQ-C17-07 | host-length-limit | S | Enforce line length and safe content before publication. | An overlong or off-topic line is replaced by a template. |
| REQ-C17-08 | host-localization | S | Choose user-visible language from the room agreement. | The model cannot change language policy from lyric content. |
| REQ-C17-09 | host-repetition | S | Avoid repeating the same nonessential line within a short match. | No unused variant means use concise silence rather than delaying. |
| REQ-C17-10 | host-mute | M | Let players independently mute host audio while retaining rule captions. | Mute preference does not silence required cue audio. |
| REQ-C17-11 | host-reveal | M | Synchronize reveal text to the authoritative reveal phase. | Premature AI response cannot disclose the answer early. |
| REQ-C17-12 | host-celebration | M | Celebrate team effort without evaluating voice attractiveness or identity. | No performance label is inferred from a user's accent. |
| REQ-C17-13 | host-content-policy | S | Reject harmful or personal generated commentary using approved topic constraints. | User nickname injection cannot change the host instructions. |
| REQ-C17-14 | host-cache | S | Cache safe generic lines keyed by language and event template version. | Player-specific content is not reused in another room. |
| REQ-C17-15 | host-cost-budget | S | Skip optional generation when the host text budget is exhausted. | Budget exhaustion has no scoring or timing effect. |
| REQ-C17-16 | host-device-tests | O | Exercise speech cancellation and captions on both physical mobile platforms. | Emulator-only TTS success does not satisfy the host-audio gate. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C17-01-I](../../backlog/tasks/C17/C17-01-I.md): host-event-mapping (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-02-I](../../backlog/tasks/C17/C17-02-I.md): host-stage-widget (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-03-I](../../backlog/tasks/C17/C17-03-I.md): template-fallback (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-04-I](../../backlog/tasks/C17/C17-04-I.md): host-generation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-05-I](../../backlog/tasks/C17/C17-05-I.md): device-speech (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-06-I](../../backlog/tasks/C17/C17-06-I.md): host-priority (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-07-I](../../backlog/tasks/C17/C17-07-I.md): host-length-limit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-08-I](../../backlog/tasks/C17/C17-08-I.md): host-localization (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-09-I](../../backlog/tasks/C17/C17-09-I.md): host-repetition (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-10-I](../../backlog/tasks/C17/C17-10-I.md): host-mute (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-11-I](../../backlog/tasks/C17/C17-11-I.md): host-reveal (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-12-I](../../backlog/tasks/C17/C17-12-I.md): host-celebration (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-13-I](../../backlog/tasks/C17/C17-13-I.md): host-content-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-14-I](../../backlog/tasks/C17/C17-14-I.md): host-cache (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-15-I](../../backlog/tasks/C17/C17-15-I.md): host-cost-budget (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C17-16-I](../../backlog/tasks/C17/C17-16-I.md): host-device-tests (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
