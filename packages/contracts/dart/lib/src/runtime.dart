import 'schemas.g.dart';

final class ContractException implements Exception {
  final String reason;
  const ContractException(this.reason);
  @override
  String toString() => 'Invalid contract: $reason';
}
Never _fail(String message) => throw ContractException(message);
Object? freezeJson(Object? value) {
  if (value is Map) return Map<String,Object?>.unmodifiable(value.map((k,v) => MapEntry(k as String,freezeJson(v))));
  if (value is List) return List<Object?>.unmodifiable(value.map(freezeJson));
  if (value is num) return value.toInt();
  return value;
}
Object? cloneJson(Object? value) {
  if (value is Map) return value.map((k,v) => MapEntry(k as String,cloneJson(v)));
  if (value is List) return value.map(cloneJson).toList();
  return value;
}
bool _equal(Object? a,Object? b) {
  if (a is List && b is List) return a.length == b.length && List.generate(a.length,(i) => _equal(a[i],b[i])).every((v) => v);
  if (a is Map && b is Map) return a.length == b.length && a.keys.every((k) => b.containsKey(k) && _equal(a[k],b[k]));
  // JSON bool is never an integer; do not coerce strings or numbers.
  return a == b;
}
bool _valid(Object? schema,Object? value) { try { validateAgainst(schema,value); return true; } on ContractException { return false; } }
void assertJson(Object? value) {
  if (value == null || value is String || value is bool) return;
  if (value is num && value.isFinite && value == value.truncateToDouble() && value.abs() <= 9007199254740991) return;
  if (value is List) { for(final v in value) { assertJson(v); } return; }
  if (value is Map && value.keys.every((k) => k is String)) { for(final v in value.values) { assertJson(v); } return; }
  _fail('Only finite safe integer JSON is supported');
}
void validateAgainst(Object? rawSchema,Object? value) {
  if (rawSchema == true) return;
  if (rawSchema == false) _fail('Forbidden value');
  final s=rawSchema as Map;
  if (s.containsKey(r'$ref')) {
    final target=(schemas.values.cast<Map>()).where((v) => v[r'$id'] == s[r'$ref']);
    if (target.length != 1) _fail('Unknown reference');
    validateAgainst(target.single,value);
  }
  if (s.containsKey('const') && !_equal(s['const'],value)) _fail('const');
  if (s.containsKey('enum') && !(s['enum'] as List).any((v) => _equal(v,value))) _fail('enum');
  if (s.containsKey('oneOf') && (s['oneOf'] as List).where((v) => _valid(v,value)).length != 1) _fail('oneOf');
  if (s.containsKey('anyOf') && !(s['anyOf'] as List).any((v) => _valid(v,value))) _fail('anyOf');
  if (s.containsKey('allOf')) { for(final child in s['allOf'] as List) { validateAgainst(child,value); } }
  if (s.containsKey('not') && _valid(s['not'],value)) _fail('not');
  if (s.containsKey('if') && _valid(s['if'],value) && s.containsKey('then')) validateAgainst(s['then'],value);
  final type=s['type'];
  if (type != null) {
    final correct=switch(type) { 'object' => value is Map && value.keys.every((k) => k is String), 'array' => value is List, 'string' => value is String, 'boolean' => value is bool, 'integer' => value is num && value.isFinite && value == value.truncateToDouble(), 'number' => value is num && value.isFinite, 'null' => value == null, _ => false };
    if (!correct) _fail('type $type');
  }
  if (value is num) {
    if (s['minimum'] != null && value < s['minimum']) _fail('minimum');
    if (s['maximum'] != null && value > s['maximum']) _fail('maximum');
  }
  if (value is String) {
    final length=value.runes.length;
    if (s['minLength'] != null && length < s['minLength']) _fail('minLength');
    if (s['maxLength'] != null && length > s['maxLength']) _fail('maxLength');
    if (s['pattern'] != null && !RegExp(s['pattern'] as String,unicode:true).hasMatch(value)) _fail('pattern');
    if (s['format'] == 'uuid' && !RegExp(r'^(?:urn:uuid:)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',caseSensitive:false).hasMatch(value)) _fail('uuid');
    if (s['format'] == 'uri' && (Uri.tryParse(value)?.hasScheme != true || value.contains(RegExp(r'\s')))) _fail('uri');
  }
  if (value is List) {
    if (s['minItems'] != null && value.length < s['minItems']) _fail('minItems');
    if (s['maxItems'] != null && value.length > s['maxItems']) _fail('maxItems');
    if (s['items'] != null) { for(final v in value) { validateAgainst(s['items'],v); } }
  }
  if (value is Map) {
    if (s['maxProperties'] != null && value.length > s['maxProperties']) _fail('maxProperties');
    for (final key in (s['required'] as List? ?? [])) { if (!value.containsKey(key)) _fail('required $key'); }
    final properties=s['properties'] as Map? ?? {};
    final patterns=s['patternProperties'] as Map? ?? {};
    for (final key in value.keys) {
      var known=false;
      if (properties.containsKey(key)) { known=true; validateAgainst(properties[key],value[key]); }
      for (final pattern in patterns.keys) {
        if (RegExp(pattern as String,unicode:true).hasMatch(key as String)) { known=true; validateAgainst(patterns[pattern],value[key]); }
      }
      if (!known && s['additionalProperties'] == false) _fail('additionalProperties');
    }
  }
}
void validateNamed(String name,Object? value) {
  assertJson(value);
  if (!schemas.containsKey(name)) _fail('Unknown contract');
  validateAgainst(schemas[name],value);
  final v=value as Map;
  if (name == 'command') {
    final type=v['type'] as String;
    if (!['room.create','room.join'].contains(type) && v['roomId'] == null) _fail('Existing-room command requires roomId');
    if (['match.','cue.','answer.','hint.','review.'].any(type.startsWith) && type != 'match.start' && v['matchId'] == null) _fail('Match command requires matchId');
    if (!['room.create','room.join','match.resume'].contains(type) && v['expectedVersion'] == null) _fail('Mutation requires expectedVersion');
  }
  if (name == 'transcript-evidence') {
    if (v['mode'] == 'PUSH_TO_TALK' && v.containsKey('turns')) _fail('PUSH_TO_TALK does not provide turn spans');
    final t=v['captureTiming'] as Map?;
    if (t != null && t['endAtMs'] < t['startAtMs']) _fail('Application capture end precedes start');
  }
  if (name == 'model-evidence') {
    if (v['relation'] == 'MATCH' && (v['candidateId'] == null || v['insufficientEvidence'] == true)) _fail('MATCH needs candidate and sufficient evidence');
    if (v['relation'] == 'INSUFFICIENT' && v['insufficientEvidence'] != true) _fail('INSUFFICIENT must flag insufficientEvidence');
  }
  if (name == 'command-receipt') {
    if ((v['status'] == 'rejected') != (v['error'] != null)) _fail('Receipt error/status mismatch');
    if (v['expiresAtMs'] < v['createdAtMs']) _fail('Receipt expiry precedes creation');
  }
  if (name == 'room-projection') {
    final members=v['members'] as List;
    if (v['mode'] == '1v1' && (members.length > 2 || v['preset'] == 'marathon10')) _fail('1v1 capacity/preset mismatch');
    if (members.map((m) => m['uid']).toSet().length != members.length) _fail('Duplicate member UID');
    if (members.map((m) => m['seat']).toSet().length != members.length) _fail('Duplicate member seat');
  }
}
