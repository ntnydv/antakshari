import type { Adjudication, Attempt, Command, CommandReceipt, DomainEvent, ModelEvidence, PrivateRoleView, RecordingGrant, RoundConfig, SafeCue, SafeReveal, ScoreEntry, Snapshot, TranscriptEvidence } from './generated.js';

export type RoundId = RoundConfig['roundId'];
export type TeamId = 'A' | 'B';
export interface Clock { nowMs(): number; }
export interface AuthenticatedPrincipal { readonly uid: string; readonly appCheckVerified: boolean; readonly consentVersion: string; }
export interface Viewer { readonly uid: string; readonly teamId: TeamId; readonly role: 'player' | 'captain' | 'hummer' | 'guesser'; }
export interface EligibilityContext { readonly mode: '1v1' | '2v2'; readonly catalogueVersion: string; readonly eligibleSongCount: number; readonly enabledCapabilities: ReadonlyArray<'audio' | 'image' | 'silent_video' | 'singing_evaluation'>; }
export type EligibilityResult = { readonly eligible: true } | { readonly eligible: false; readonly reason: 'TEAMMATE_REQUIRED' | 'CATALOGUE_UNAVAILABLE' | 'CAPABILITY_UNAVAILABLE' };
export interface FrozenRules { readonly version: string; readonly config: RoundConfig; readonly floor: number; readonly cap: number; readonly partyReview: boolean; }
export interface CatalogueSong { readonly songId: string; readonly songFamilyId: string; readonly versionId: string; readonly sectionIds: ReadonlyArray<string>; readonly eligibleRounds: ReadonlyArray<RoundId>; }
export interface PrivatePreparationContext { readonly promptId: string; readonly roundInstanceId: string; readonly seed: string; readonly rules: FrozenRules; readonly catalogueVersion: string; readonly candidates: ReadonlyArray<CatalogueSong>; }
export interface PreparedRound<Plan = ReadonlyArray<string>> { readonly promptId: string; readonly roundId: RoundId; readonly privatePlan: Plan; }
export interface AttemptContext { readonly attempt: Attempt; readonly roundId: RoundId; readonly opportunity: 'primary' | 'steal'; }
export interface EvidenceRequirements { readonly titleSlots: number; readonly section: 'none' | 'mukhda' | 'antara' | 'next_phrase' | 'qualifying_phrase'; readonly maxAudioDurationMs: number; readonly requireFinalTranscript: boolean; }
export interface ValidatedEvidence { readonly attemptId: string; readonly generation: number; readonly titleSongIds: ReadonlyArray<string>; readonly transcript: TranscriptEvidence | null; readonly interpretation: ModelEvidence | null; readonly matchedSectionIds: ReadonlyArray<string>; }
export interface EvaluationProposal { readonly verdict: Adjudication['verdict']; readonly reasonCodes: Adjudication['reasonCodes']; readonly categories: ReadonlyArray<ScoreEntry['category']>; readonly songIds: ReadonlyArray<string>; readonly sectionIds: ReadonlyArray<string>; }
/** Pure functions only. The engine owns authorization, deadlines and ledger mutation. */
export interface RoundPlugin<Plan = ReadonlyArray<string>> {
  readonly roundId: RoundId;
  eligible(context: EligibilityContext): EligibilityResult;
  prepare(context: PrivatePreparationContext): PreparedRound<Plan>;
  projectCue(round: PreparedRound<Plan>, viewer: Viewer): SafeCue;
  getPrivateView(round: PreparedRound<Plan>, viewer: Viewer): PrivateRoleView | null;
  evidenceRequirements(attempt: AttemptContext): EvidenceRequirements;
  evaluate(evidence: ValidatedEvidence, rules: FrozenRules): EvaluationProposal;
  reveal(round: PreparedRound<Plan>): SafeReveal;
}
export interface FeatureDescriptor { readonly id: string; readonly requires: ReadonlyArray<string>; register(ports: ApplicationPorts): void; }
export interface ReceiptStore { find(uid: string, commandId: string): Promise<CommandReceipt | null>; }
export interface TransactionContext {
  readSnapshot(matchId: string): Promise<Snapshot | null>;
  findReceipt(uid: string, commandId: string): Promise<CommandReceipt | null>;
  putSnapshot(snapshot: Snapshot): void;
  putReceipt(uid: string, receipt: CommandReceipt): void;
  appendEvent(event: DomainEvent): void;
  appendScore(entry: ScoreEntry): void;
  enqueue(effect: OutboxEffect): void;
}
export interface MatchRepository {
  getSnapshot(matchId: string, principal: AuthenticatedPrincipal): Promise<Snapshot | null>;
  /** Retryable callback: await transactional database reads only; no provider/network side effects. */
  transact<T>(matchId: string, expectedVersion: number, operation: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
export interface CatalogueReader { get(version: string, songIds: ReadonlyArray<string>): Promise<ReadonlyArray<CatalogueSong>>; }
export interface LedgerReader { list(matchId: string, afterEntryId: string | null, limit: number): Promise<ReadonlyArray<ScoreEntry>>; }
export interface OutboxEffect { readonly effectId: string; readonly kind: 'deadline' | 'inference' | 'media_cleanup' | 'publish_event'; readonly matchId: string; readonly attemptId: string | null; readonly generation: number; readonly dueAtMs: number; readonly payloadDigest: string; }
export interface DurableOutbox { claim(nowMs: number, workerId: string, leaseMs: number): Promise<OutboxEffect | null>; complete(effectId: string, workerId: string): Promise<void>; }
export interface MediaGrantPort { issue(principal: AuthenticatedPrincipal, attempt: Attempt, matchId: string, promptId: string): Promise<RecordingGrant>; revoke(attemptId: string, generation: number): Promise<void>; }
export interface AudioFrame { readonly attemptId: string; readonly generation: number; readonly seq: number; readonly pcm: Uint8Array; }
export interface AudioTransport { send(frame: AudioFrame): Promise<void>; receive(grant: RecordingGrant): AsyncIterable<AudioFrame>; close(attemptId: string, generation: number): Promise<void>; }
export interface TranscriptionPort { transcribe(grant: RecordingGrant, frames: AsyncIterable<AudioFrame>, signal: AbortSignal): Promise<TranscriptEvidence>; }
export interface EvidenceInterpreter { interpret(evidence: TranscriptEvidence, candidateIds: ReadonlyArray<string>, sectionIds: ReadonlyArray<string>, signal: AbortSignal): Promise<ModelEvidence>; }
export interface HostPresenter { present(instructionKey: string, locale: string): Promise<void>; cancel(): void; }
export interface EventSink { publish(event: DomainEvent): Promise<void>; }
export interface RegistrationPort { registerCommand(type: Command['type'], handler: (principal: AuthenticatedPrincipal, command: Command) => Promise<CommandReceipt>): void; registerRound<Plan>(plugin: RoundPlugin<Plan>): void; }
export interface ApplicationPorts { readonly clock: Clock; readonly receipts: ReceiptStore; readonly matches: MatchRepository; readonly catalogue: CatalogueReader; readonly ledger: LedgerReader; readonly outbox: DurableOutbox; readonly media: MediaGrantPort; readonly audio: AudioTransport; readonly transcription: TranscriptionPort; readonly interpreter: EvidenceInterpreter; readonly host: HostPresenter; readonly events: EventSink; readonly registration: RegistrationPort; }
