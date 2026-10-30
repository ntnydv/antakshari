# Shared protocol contracts

BOOT-004 implements the protocol foundation for the [canonical contract design](../../docs/contracts/README.md). The JSON Schemas in [schema](schema) are the wire source of truth. There is no Firebase, scoring engine, provider invocation, or live media implementation in this package.

## Use and verification

Install Node 22, Python 3 and Dart 3.9 or later (below Dart 4). The recorded verification used Node 22.18.0, TypeScript 5.9.3 and Dart 3.13.7. From this directory, install the package-local locked dependencies:

```sh
npm ci --ignore-scripts --workspaces=false
```

From the repository root:

```sh
node tools/contracts/generate.mjs
python3 tools/contracts/check.py
python3 tools/taskctl.py verify BOOT-004
```

`CONTRACTS_NODE` and `CONTRACTS_DART` may name explicit executables when they are absent from PATH. `DART_BINARY` is also accepted. The check does not download runtimes, fetch credentials, or skip missing tools. Missing dependencies or a failed command produce a nonzero exit. The Python entry point only invokes the Node checker required by the original task card.

The checker compares generated content against checked-in bytes, compiles TypeScript in strict mode, validates all 17 schemas with AJV draft 2020-12, executes the positive/negative golden corpus, runs Dart static analysis, then executes the generated Dart classes against the same corpus and compares every verdict and serialized value. Generated `toJson` methods exercise typed getters and nested classes; this is actual codec execution, not source-text comparison. Input aliases and returned mutable JSON copies cannot mutate bindings.

Use `decode('safe-cue', untrustedValue)`, `decodeCommand`, `encodeSnapshot` and `validateAdjudication` from [src/index.ts](src/index.ts). Returned TypeScript data is a detached, recursively frozen object. Dart consumers import [antakshari_contracts.dart](dart/lib/antakshari_contracts.dart), then use `SafeCue.fromJson`, `Command.fromJson` and the other generated factories. Concrete command/event/config subclasses also verify their own discriminator. The wire key `final` is exposed as Dart `isFinal` because `final` is a reserved word.

## Schema corrections and additions

The initial snapshot required a round before any round existed. The orchestrator approved this v1 correction before any production rollout: `roundId` and `roundInstanceId` must be either both present or both null. Null is permitted only in `lobby`, `preparing`, `countdown`, `finished`, and `abandoned`. All other phases, including `paused`, require both IDs. The schema itself enforces this rule, and positive/negative fixtures cover every phase. An aborted pre-round match uses `abandoned`; a paused active match retains its round identity. No stored production records require migration at this bootstrap stage.

Added schemas implement the design's missing boundaries:

| Schema | Visibility and purpose |
| --- | --- |
| room-projection | Member-only safe room settings, roster and readiness |
| domain-event | Discriminated public event payload and sequence/version |
| safe-cue | Opaque assets, optional HTTPS grants, timing and instruction key |
| private-role-view | Hummer-only target card through an authorized private endpoint |
| recording-grant | Actor, attempt, generation, direction and bounded capture grant |
| transcript-evidence | Backend-only observed transcript and actual provider fields |
| attempt | Backend attempt lifecycle and media digest |
| score-entry | Immutable score proposal/result record; no mutation implementation |
| safe-reveal | Titles/section labels that may be projected only after reveal authorization |
| command-receipt | Idempotency digest, result references and typed error |
| round-config | Ten discriminated, frozen MVP configuration shapes |

Round IDs remain R01–R10. Config timing follows the round designs, including R09's 12-second answer-start window and 20-second recording budget. R08 has a 15-second total answer window and no additional singing budget. These config schemas describe defaults frozen for the MVP; future modifiers require an explicit schema/rules revision, not unknown fields.

Events support `snapshot.updated`, `cue.started`, `answer.opened`, `attempt.changed`, `round.revealed`, `score.changed` and `match.finished`. They reject unknown discriminators and top-level extensions. Optional metadata contains only five approved typed counters/flags: `delivery_attempt`, `replay`, `trace_sampled`, `x_metric_resync`, `x_metric_delivery_latency_ms`. Consumers may ignore these additive optional metadata values. New metadata names require contract-owner review and regenerated fixtures; arbitrary names, free text, answer keys and nested objects cannot pass through an extension dictionary. This is deliberately stricter than unrestricted metadata compatibility.

Public schema validation does not establish authorization, phase legality, or the safety of the content behind an opaque asset ID. The server must obtain instructions from an approved localization catalogue, scrub media metadata, issue scoped grants, check membership, and authorize reveal/private views. A schema cannot determine whether a valid-looking string secretly contains an answer. Private-role, transcript, model-evidence and attempt records must never be placed in public events.

## Validation boundaries

Wire `schemaVersion` is integer 1. Task-result records retain `schema_version`. All protocol numbers use finite safe integers so JavaScript and Dart agree exactly; fractional, nonfinite and unsafe values fail. Strings preserve Unicode without transliteration or normalization at this layer. Both runtimes close mutable inputs and reject unknown fields.

Semantic guards implement documented structural preconditions: existing-room commands require roomId; match commands require matchId except `match.start`, which creates one; versioned mutations require expectedVersion. Create/join may omit scopes with explicit null, while resume accepts a null expected version. Actual version comparison, room membership, generation fencing, candidate membership, deadlines and idempotency storage remain the owning services' responsibility.

PUSH_TO_TALK transcripts have no synthesized turn spans, confidence scores or word timestamps. Continuous-mode optional turns carry only actual text/language fields. Application capture timing identifies its origin. Partial transcripts can be represented for observability; their existence does not authorize a final answer or score. Model MATCH requires a candidate and sufficient-evidence flag, while candidate/section membership still requires the bounded catalogue context.

The Dart validator implements only the JSON Schema keyword subset used here, while AJV validates the schemas against the full draft. The generator fails on unsupported keywords or formats; adding a schema feature requires Dart support and a shared adverse fixture. It does not fetch remote references. URI values use a bounded HTTPS host/path/query grammar with percent encoding; empty hosts, nonnumeric ports, fragments and unencoded Unicode are excluded. Asset ownership and expiry comparison are server checks. UUID format accepts the optional `urn:uuid:` prefix consistently with AJV. The checked-in [manifest](manifest.json) hashes schemas and generated artifacts; stale outputs fail checks.

## Shared ports and downstream ownership

[TypeScript ports](src/ports.ts) and [Dart ports](dart/lib/src/ports.dart) declare FeatureDescriptor, generic RoundPlugin and application boundaries for clocks, authenticated principals, transactional match/receipt/event/ledger writes, immutable catalogue reads, durable effects, grants, audio, transcription, evidence interpretation, presentation and registration. Round plugins are pure functions over prepared data. Transaction callbacks await database reads inside the transaction; adapters must prohibit provider calls and other external network side effects in retried callbacks. Do not prefetch authoritative records outside the transaction to satisfy a synchronous interface. Both runtime suites execute an async transactional-read consumer fixture.

Ports are reviewed source interfaces, while wire classes/types are generated from schemas. Dart ports use platform records, Stream and CancellationSignal; TypeScript uses readonly records, AsyncIterable and AbortSignal. Enum-like port strings are internal application values; untrusted wire data must enter through generated decoders. BOOT-006 supplies fake implementations and BOOT-007 registration composition. Feature workers must use these ports instead of duplicating private wire shapes.

The [golden fixtures](fixtures/golden.json) contain invented text, IDs and `.invalid` URLs only. They include all command/config/event variants, exact verdicts, nullable active-phase failures, safe metadata, forged score/actor fields, invalid identifiers, timestamps, model confidence injection and Unicode. They are contract evidence, not provider, device, music-licensing, scoring-correctness or production authorization evidence.

Implementation references: [AJV draft 2020-12](https://ajv.js.org/json-schema.html), [Dart class modifiers](https://dart.dev/language/class-modifiers), and [JSON Schema 2020-12](https://json-schema.org/draft/2020-12).
