import 'dart:typed_data';
import 'bindings.g.dart';

typedef RoundId = String;
typedef TeamId = String;
abstract interface class Clock { int nowMs(); }
typedef AuthenticatedPrincipal = ({String uid, bool appCheckVerified, String consentVersion});
typedef Viewer = ({String uid, TeamId teamId, String role});
typedef EligibilityContext = ({String mode, String catalogueVersion, int eligibleSongCount, List<String> enabledCapabilities});
typedef EligibilityResult = ({bool eligible, String? reason});
typedef FrozenRules = ({String version, RoundConfig config, int floor, int cap, bool partyReview});
typedef CatalogueSong = ({String songId, String songFamilyId, String versionId, List<String> sectionIds, List<RoundId> eligibleRounds});
typedef PrivatePreparationContext = ({String promptId, String roundInstanceId, String seed, FrozenRules rules, String catalogueVersion, List<CatalogueSong> candidates});
typedef PreparedRound<Plan> = ({String promptId, RoundId roundId, Plan privatePlan});
typedef AttemptContext = ({Attempt attempt, RoundId roundId, String opportunity});
typedef EvidenceRequirements = ({int titleSlots, String section, int maxAudioDurationMs, bool requireFinalTranscript});
typedef ValidatedEvidence = ({String attemptId, int generation, List<String> titleSongIds, TranscriptEvidence? transcript, ModelEvidence? interpretation, List<String> matchedSectionIds});
typedef EvaluationProposal = ({String verdict, List<String> reasonCodes, List<String> categories, List<String> songIds, List<String> sectionIds});
abstract interface class RoundPlugin<Plan> {
  RoundId get roundId;
  EligibilityResult eligible(EligibilityContext context);
  PreparedRound<Plan> prepare(PrivatePreparationContext context);
  SafeCue projectCue(PreparedRound<Plan> round, Viewer viewer);
  PrivateRoleView? getPrivateView(PreparedRound<Plan> round, Viewer viewer);
  EvidenceRequirements evidenceRequirements(AttemptContext attempt);
  EvaluationProposal evaluate(ValidatedEvidence evidence, FrozenRules rules);
  SafeReveal reveal(PreparedRound<Plan> round);
}
abstract interface class FeatureDescriptor {
  String get id;
  List<String> get requires;
  void register(ApplicationPorts ports);
}
abstract interface class ReceiptStore { Future<CommandReceipt?> find(String uid,String commandId); }
abstract interface class TransactionContext {
  Future<Snapshot?> readSnapshot(String matchId);
  Future<CommandReceipt?> findReceipt(String uid,String commandId);
  void putSnapshot(Snapshot snapshot);
  void putReceipt(String uid,CommandReceipt receipt);
  void appendEvent(DomainEvent event);
  void appendScore(ScoreEntry entry);
  void enqueue(OutboxEffect effect);
}
abstract interface class MatchRepository {
  Future<Snapshot?> getSnapshot(String matchId,AuthenticatedPrincipal principal);
  // Retryable database operations only; never call providers or other network services here.
  Future<T> transact<T>(String matchId,int expectedVersion,Future<T> Function(TransactionContext) operation);
}
abstract interface class CatalogueReader { Future<List<CatalogueSong>> get(String version,List<String> songIds); }
abstract interface class LedgerReader { Future<List<ScoreEntry>> list(String matchId,String? afterEntryId,int limit); }
typedef OutboxEffect = ({String effectId,String kind,String matchId,String? attemptId,int generation,int dueAtMs,String payloadDigest});
abstract interface class DurableOutbox {
  Future<OutboxEffect?> claim(int nowMs,String workerId,int leaseMs);
  Future<void> complete(String effectId,String workerId);
}
abstract interface class MediaGrantPort {
  Future<RecordingGrant> issue(AuthenticatedPrincipal principal,Attempt attempt,String matchId,String promptId);
  Future<void> revoke(String attemptId,int generation);
}
typedef AudioFrame = ({String attemptId,int generation,int seq,Uint8List pcm});
abstract interface class AudioTransport {
  Future<void> send(AudioFrame frame);
  Stream<AudioFrame> receive(RecordingGrant grant);
  Future<void> close(String attemptId,int generation);
}
abstract interface class CancellationSignal { bool get cancelled; Stream<void> get onCancel; }
abstract interface class TranscriptionPort { Future<TranscriptEvidence> transcribe(RecordingGrant grant,Stream<AudioFrame> frames,CancellationSignal signal); }
abstract interface class EvidenceInterpreter { Future<ModelEvidence> interpret(TranscriptEvidence evidence,List<String> candidateIds,List<String> sectionIds,CancellationSignal signal); }
abstract interface class HostPresenter { Future<void> present(String instructionKey,String locale); void cancel(); }
abstract interface class EventSink { Future<void> publish(DomainEvent event); }
abstract interface class RegistrationPort {
  void registerCommand(String type,Future<CommandReceipt> Function(AuthenticatedPrincipal,Command) handler);
  void registerRound<Plan>(RoundPlugin<Plan> plugin);
}
abstract interface class ApplicationPorts {
  Clock get clock;
  ReceiptStore get receipts;
  MatchRepository get matches;
  CatalogueReader get catalogue;
  LedgerReader get ledger;
  DurableOutbox get outbox;
  MediaGrantPort get media;
  AudioTransport get audio;
  TranscriptionPort get transcription;
  EvidenceInterpreter get interpreter;
  HostPresenter get host;
  EventSink get events;
  RegistrationPort get registration;
}
