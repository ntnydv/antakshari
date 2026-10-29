import 'dart:convert';
import 'dart:io';
import '../lib/antakshari_contracts.dart' as c;

dynamic decode(String name,Object? value) => switch(name) {
  'adjudication' => c.Adjudication.fromJson(value),
  'attempt' => c.Attempt.fromJson(value),
  'command' => c.Command.fromJson(value),
  'command-receipt' => c.CommandReceipt.fromJson(value),
  'domain-event' => c.DomainEvent.fromJson(value),
  'error' => c.Error.fromJson(value),
  'model-evidence' => c.ModelEvidence.fromJson(value),
  'private-role-view' => c.PrivateRoleView.fromJson(value),
  'recording-grant' => c.RecordingGrant.fromJson(value),
  'room-projection' => c.RoomProjection.fromJson(value),
  'round-config' => c.RoundConfig.fromJson(value),
  'safe-cue' => c.SafeCue.fromJson(value),
  'safe-reveal' => c.SafeReveal.fromJson(value),
  'score-entry' => c.ScoreEntry.fromJson(value),
  'snapshot' => c.Snapshot.fromJson(value),
  'task-result' => c.TaskResult.fromJson(value),
  'transcript-evidence' => c.TranscriptEvidence.fromJson(value),
  _ => throw StateError('Unknown test contract $name'),
};
Never fail(String reason) => throw StateError(reason);
Future<void> main(List<String> args) async {
  final corpus=jsonDecode(File(args.single).readAsStringSync()) as Map;
  final fixtures=corpus['fixtures'] as List;
  final observations=<Map<String,Object?>>[];
  for(final raw in fixtures) {
    final f=raw as Map;
    var valid=false;
    Object? roundTrip;
    try { final decoded=decode(f['schema'] as String,f['value']); roundTrip=decoded.toJson(); valid=true; }
    on c.ContractException { valid=false; }
    if (valid != f['valid']) fail('Expected validity for ${f['id']}');
    observations.add({'id':f['id'],'valid':valid,if(valid)'roundTrip':roundTrip});
  }
  final source=jsonDecode(jsonEncode((fixtures.firstWhere((f) => f['id'] == 'command-answer.request') as Map)['value'])) as Map;
  final command=c.Command.fromJson(source) as c.CommandAnswerRequest;
  (source['payload'] as Map)['promptId']='changed';
  if(command.payload.promptId != 'prompt_fixture') fail('Mutable input aliases binding');
  final copy=command.toJson();
  (copy['payload'] as Map)['promptId']='changed';
  if(command.payload.promptId != 'prompt_fixture') fail('toJson aliases binding');
  try { c.CommandAnswerSubmit.fromJson(command.toJson()); fail('Concrete union subtype accepted different discriminator'); }
  on c.ContractException { /* Expected. */ }
  final transcript=decode('transcript-evidence',(fixtures.firstWhere((f) => f['id'] == 'transcript-final') as Map)['value']) as c.TranscriptEvidence;
  if(!transcript.isFinal || !transcript.text.contains('🎵')) fail('Typed Unicode getter failed');
  final room=decode('room-projection',(fixtures.firstWhere((f) => f['id'] == 'room-unicode') as Map)['value']) as c.RoomProjection;
  try { room.members.clear(); fail('Mutable generated list'); } on UnsupportedError { /* Expected. */ }
  final trace=<String>[];
  final repository=ReadProbeRepository(trace);
  final absent=await repository.transact('fixture',0,(tx) async {
    final snapshot=await tx.readSnapshot('fixture');
    final receipt=await tx.findReceipt('fixture','11111111-1111-4111-8111-111111111111');
    trace.add('observed');
    return snapshot == null && receipt == null;
  });
  if(!absent || trace.join(',') != 'snapshot,receipt,observed') fail('Async transactional read port failed');
  stdout.writeln(jsonEncode(observations));
}

final class ReadProbeRepository implements c.MatchRepository {
  final List<String> trace;
  ReadProbeRepository(this.trace);
  @override
  Future<c.Snapshot?> getSnapshot(String matchId,c.AuthenticatedPrincipal principal) async => null;
  @override
  Future<T> transact<T>(String matchId,int expectedVersion,Future<T> Function(c.TransactionContext) operation) => operation(ReadProbeTransaction(trace));
}
final class ReadProbeTransaction implements c.TransactionContext {
  final List<String> trace;
  ReadProbeTransaction(this.trace);
  @override
  Future<c.Snapshot?> readSnapshot(String matchId) async { await Future<void>.value(); trace.add('snapshot'); return null; }
  @override
  Future<c.CommandReceipt?> findReceipt(String uid,String commandId) async { await Future<void>.value(); trace.add('receipt'); return null; }
  @override
  void putSnapshot(c.Snapshot snapshot) => fail('Read-only fixture must not write');
  @override
  void putReceipt(String uid,c.CommandReceipt receipt) => fail('Read-only fixture must not write');
  @override
  void appendEvent(c.DomainEvent event) => fail('Read-only fixture must not write');
  @override
  void appendScore(c.ScoreEntry entry) => fail('Read-only fixture must not write');
  @override
  void enqueue(c.OutboxEffect effect) => fail('Read-only fixture must not write');
}
