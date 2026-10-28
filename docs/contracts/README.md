# Canonical application contracts

Version: 1. Date: 2026-10-27. These are proposed application wire contracts, not a claim that the application is implemented. [Architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and these schemas define the shared boundaries for every worker.

## Authority and naming

- Machine schemas: [`packages/contracts/schema/`](../../packages/contracts/schema/).
- `schemaVersion` is the integer `1` in application messages. Orchestration artifacts intentionally use `schema_version`.
- Backend modules use TypeScript; generated immutable bindings use Dart. BOOT-004 builds generation and parity checks.
- Phases are lowercase: `lobby`, `preparing`, `countdown`, `round_intro`, `cue`, `answer_open`, `recording`, `adjudicating`, `reveal`, `round_summary`, `finished`, `paused`, `abandoned`.
- Round IDs are `R01` through `R10`; display names and task ownership codes do not replace these protocol IDs.
- All wire timestamps are nonnegative integer epoch milliseconds; native Firestore Timestamp values convert at the boundary. Clock durations are explicitly named `*Ms`.
- Verdicts are `accepted`, `rejected`, `uncertain`, `invalid_attempt`, `cancelled`. A pending review is attempt workflow state, not a terminal verdict. Internal model relations `MATCH/MISMATCH/INSUFFICIENT` are separate from these verdicts.

## Schema inventory

| Schema | Role | Critical constraint |
| --- | --- | --- |
| [Command](../../packages/contracts/schema/command.schema.json) | Typed client mutation intent | Discriminated payload; no client score or actor UID |
| [Snapshot](../../packages/contracts/schema/snapshot.schema.json) | Safe current match projection | Version, sequence and current role; no private answers |
| [Adjudication](../../packages/contracts/schema/adjudication.schema.json) | Server evidence decision | Attempt/generation/version/provenance; no model-supplied points |
| [Model evidence](../../packages/contracts/schema/model-evidence.schema.json) | Bounded Muse interpretation output | Supplied candidate/span membership checked after JSON validation |
| [Error](../../packages/contracts/schema/error.schema.json) | Stable failure envelope | No provider exception body or secret |
| [Task result](../../packages/contracts/schema/task-result.schema.json) | OpenCode handoff | Worker can report implementation, blockage or failure; not completion |

`additionalProperties: false` closes mutable request objects. Server event consumers may ignore additive metadata, but cannot invent fallback behavior for an unknown major schema or required discriminator. BOOT-004 must add typed event, room projection, cue and recording-grant schemas following the field tables below; those additions require contract-owner review, not independent guesses by feature workers.

## Command semantics

All client mutation intents enter one authenticated command gateway. Firebase UID is derived from ID token; App Check is verified independently. `commandId` is generated once and reused for retries. Server stores the canonical body digest and receipt. A repeated ID with a different digest returns conflict.

`roomId`, `matchId` and `expectedVersion` are nullable to permit initial room creation/join. Semantic validation requires roomId for existing-room commands, matchId for match/answer/review commands and expectedVersion for versioned mutations. `room.join` resolves the invite before membership is known. Read-only resume may use the last observed version; authoritative response always returns current state.

Buzz requests name `promptId` and `phaseToken`. Collecting contenders must not increment the public match version for each arrival. The resolver advances version once after the persisted 100ms cutoff; it may run later than that cutoff. Other mutating commands compare current expectedVersion normally. A client timestamp never establishes buzz priority or extends answer time.

Commands: room create/join/leave/settings/team/ready, match start, cue ready, answer request/buzz/submit, hint request, review request/vote, resume and rematch. Provider completion and deadline execution are internal authenticated service events, not client commands.

## Public/internal ports

These interfaces are application design seams. Bootstrap generates representations; they are not provider API specifications.

```ts
interface RoundPlugin {
  readonly roundId: RoundId;
  eligible(context: EligibilityContext): EligibilityResult;
  prepare(context: PrivatePreparationContext): PreparedRound;
  projectCue(round: PreparedRound, viewer: Viewer): SafeCue;
  getPrivateView(round: PreparedRound, viewer: Viewer): PrivateRoleView | null;
  evidenceRequirements(attempt: AttemptContext): EvidenceRequirements;
  evaluate(evidence: ValidatedEvidence, rules: FrozenRules): EvaluationProposal;
  reveal(round: PreparedRound): SafeReveal;
}

interface FeatureDescriptor {
  id: string; // globally unique component/slice identifier
  requires: string[];
  register(ports: ApplicationPorts): void;
}
```

The round plugin may calculate permitted evaluation inputs and score categories; the common engine owns final ledger mutation, deadlines, authorization, attempt identity, and opportunity caps. Pure plugin methods do not call Firebase or Muse directly. Use explicit injected ports for media/catalogue lookups. Each feature's descriptor lives beside its task-owned module. BOOT-007 generates registries; workers do not manually edit shared imports.

## Projection and event field tables

| Type | Required fields | Visibility |
| --- | --- | --- |
| RoomProjection | roomId, version, mode, settingsVersion, safe members, ready flags, status | Members only |
| DomainEvent | schemaVersion, eventId, matchId, seq, version, occurredAtMs, type, typed payload | Publish only safe projection |
| SafeCue | promptId, roundId, assetIds/short-lived URLs, cueStartAtMs, allowed replay count, safe instruction | Eligible current members |
| PrivateRoleView | promptId, recipientUid, expiryMs, hum target/display data | R07 hummer only through authorized endpoint |
| RecordingGrant | attemptId, uid, matchId, promptId, generation, expiresAtMs, maxBytes, sampleRate, direction | Authorized actor; scoped relay ticket separate |
| TranscriptEvidence | attemptId, model, text, final, observedAudioDurationMs, optional actual language/turn fields | Backend/private evidence only |
| Attempt | attemptId, generation, actor, media digest, phase, sealedAtMs, decisionRef | Private backend; safe status projected |
| ScoreEntry | entryId, attemptId, teamId, category, requestedDelta, appliedDelta, capEffect, reasonCode, correctionOf | Relevant members after permitted reveal |

Native ASR confidence and word timestamps are not part of TranscriptEvidence. PUSH_TO_TALK need not have turn spans. Capture timestamps measured by the application must identify their origin; they are not provider alignment measurements.

## HTTP and realtime transport boundaries

- Commands: authenticated HTTPS Cloud Function with one command envelope; use typed error envelopes, no implicit success on HTTP200 with malformed JSON.
- Snapshot/event listeners: authorized Firestore projections; resync on sequence gaps. No raw PCM or hidden answer documents.
- Relay ticket: server-issued one-use ticket after membership, consent and attempt eligibility checks. No Meta key reaches the client.
- Relay socket: ticket authentication followed by versioned control messages and bounded binary PCM. App envelopes may contain sequence/generation; strip them before sending raw PCM to Meta.
- Current cue delivery: opaque asset IDs resolved into short-lived member-authorized URLs. No permanent public Storage download token for private recordings.
- Internal jobs: service-authenticated routes with effectId, attempt/phase generation and deduplication. Public users cannot invoke deadline or scoring callbacks.

## Error and cancellation rules

Invalid payload never writes state. Stale version returns conflict and current version. Permission denial never reveals whether a private target exists. Rate-limit responses include bounded retry guidance. Cancellation seals the attempt lifecycle; late audio or model output is diagnostic only. No result uses a zero score to silently mean provider outage; uncertainty is an explicit state with a neutral retry/void policy.

## Integration rules

Schema changes are owned by the contract workstream. Every proposed breaking change includes migration, regenerated bindings, fixtures, affected task IDs and a rollout plan. Active matches pin rule/catalogue/policy versions. Unknown new fields must not become a backdoor for client-authored points. Read [data model](DATA_MODEL.md) and [protocol examples](PROTOCOL_EXAMPLES.md) for concrete records.
