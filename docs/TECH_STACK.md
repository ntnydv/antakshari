# Technology stack and model routing

Status: selected design, not installed infrastructure. Date verified: 2026-10-27. The bootstrap task pins exact tool/package versions in lockfiles after resolving compatibility. Workers must not independently upgrade shared dependencies.

## 1. Application stack

| Layer | Selection | Responsibility and boundary |
|---|---|---|
| Mobile | Flutter stable + bundled Dart | Android/iOS UI, lifecycle and native integration; freeze a tested stable SDK in CI |
| State | Riverpod | Feature view models/providers; authoritative game state remains server supplied |
| Navigation | go_router | Typed route structure, authenticated guards and invite navigation |
| Firebase client | FlutterFire plugins | Auth, safe Firestore subscriptions, RTDB presence, Storage transfer, App Check, Crashlytics and Performance |
| Audio capture | `record` behind an `AudioCapture` interface | PCM microphone stream; validate actual format on both mobile platforms |
| Live playback | `flutter_sound` PCM stream adapter, with native adapter fallback | Playback of relayed PCM with a bounded jitter buffer; physical-device spike required |
| Cue playback | `just_audio` | Buffered audio clues and approved host lines |
| Video clues | Flutter `video_player` | Muted curated video assets; source audio also stripped in preparation |
| Socket client | `web_socket_channel` | App relay protocol; provider protocol is server-only |
| Local state | Minimal preferences/cache abstraction | Locale, consent display state and ephemeral assets; no authoritative score/offline command queue |
| Accessibility/localisation | Flutter semantics and generated localisation | Hindi/English UI, font scaling, captions, role/countdown announcements |
| Testing | Flutter unit/widget/integration tooling | Feature tests, golden states where valuable and physical-device journeys |

Use repositories/services/view models to separate UI from data and platform adapters, consistent with [Flutter's architecture guidance](https://docs.flutter.dev/app-architecture/guide). Feature code lives under `apps/mobile/lib/features/<component>/<slice>.dart`, with task-owned tests and registration descriptors. Protected editor/operator routes use this same Flutter app for the MVP; extracting a separate admin app is deferred. A plugin's advertised support does not replace testing PCM capture/playback, background interruptions and Bluetooth on the chosen devices. The initial candidates are documented by the [record package](https://pub.dev/packages/record) and [flutter_sound package](https://pub.dev/packages/flutter_sound).

## 2. Firebase/GCP stack

| Component | Selection | Why and key restriction |
|---|---|---|
| Identity | Firebase Authentication | Stable guest UIDs and later account linking; custom authorisation still required |
| App attestation | Firebase App Check | Enforce gradually after monitoring legitimate pilot traffic |
| Durable game state | Cloud Firestore | Atomic command/state/ledger transactions and authorised real-time projections |
| Presence | Firebase Realtime Database | Connection/disconnect signalling; advisory only |
| Object storage | Cloud Storage for Firebase | Permitted clues and temporary sealed recordings; private paths need explicit access |
| Commands | Cloud Functions for Firebase gen2, Node.js 22, TypeScript | Short authenticated operations, deterministic transactions and worker entrypoints |
| Timed/asynchronous jobs | Cloud Tasks + outbox dispatch | Expiry checks, bounded retries and deletion; handlers validate stored deadlines/generations |
| Audio relay | Cloud Run, Node.js 22, TypeScript, Fastify/WebSocket adapter | Long-lived client audio connections and server-side Muse proxy |
| Cross-instance transient bus | Memorystore for Redis Pub/Sub | Fan out one active publisher across relay instances; no durable scoring data |
| Secrets | Google Secret Manager | Muse credential and service-only secrets |
| Observability | Cloud Logging/Monitoring + Firebase Crashlytics/Performance | Redacted traces, client crash visibility, service metrics and alerts |
| Runtime feature flags | Server configuration plus Firebase Remote Config for display | Server locks per-match rule/config version; client flags cannot change authority |
| Invitations | Android App Links + iOS Universal Links + manual code | Owned HTTPS invite route; no Firebase Dynamic Links dependency |
| Local development | Firebase Emulator Suite + fake Muse/relay fixtures | Deterministic tests without production credentials |
| CI/CD | GitHub Actions with workload identity federation | Validate, build, integration evidence and controlled deployment; no long-lived service-account JSON in repo |

Keep latency-sensitive services and data near the pilot audience where each product is available. Region selection must be recorded before provisioning; the design does not assume the Meta endpoint is co-located with Firebase. Separate development, staging and production projects. Runtime language and function settings must be checked against the [current supported functions configuration](https://firebase.google.com/docs/functions/manage-functions).

Firestore lacks native presence; Firebase's [documented presence pattern](https://firebase.google.com/docs/firestore/solutions/presence) uses RTDB and optional mirroring. Do not put audio frames into either database. [Cloud Run WebSockets](https://docs.cloud.google.com/run/docs/triggering/websockets) require reconnect handling and synchronization between instances. [Firebase Dynamic Links](https://firebase.google.com/support/dynamic-links-faq) should not be introduced into a new project.

## 3. Muse model decision table

The official entry point is [Meta Model API](https://dev.meta.ai/), base URL `https://api.meta.ai/v1`. The choices below use Standard variants. Availability, account limits and production retention settings must be checked for the actual account.

| Feature | Model ID | Route | Release policy |
|---|---|---|---|
| Spoken/sung response transcript | `muse-voice-transcribe-1.0` | Realtime ASR through server proxy; WAV file fallback | Primary candidate; singing quality must pass the app's evaluation |
| Candidate/song/section evidence classification | `muse-spark-1.3` | Chat Completions or Responses with strict structured output | Ground in bounded catalogue candidates; deterministic evaluator decides score |
| Visual clue review and annotation | `muse-spark-1.3` | Image/video input to text | Offline content workflow; editor approves before publishing |
| Short host text and hints | `muse-spark-1.3` | Text generation with schema/length constraints | Optional; approved templates are always available |
| Audio reasoning fallback | `muse-spark-1.2` | Supported audio input through server adapter | Feature-flagged only after benchmark; never silently route to 1.3 audio |
| Complex offline catalogue/evaluation audit | `muse-wonder-1.0` | Text/multimodal reasoning | Optional offline job with explicit cost budget |
| Original illustration preparation | `muse-image-1.0` | Images generation/editing | Optional offline tool; generated asset receives review and provenance |

Meta's [model catalogue](https://dev.meta.ai/docs/models) documents these IDs and modalities. Its [audio/video guide](https://dev.meta.ai/docs/video-understanding) warns that Spark 1.3 audio understanding is not fully supported. Muse Voice Transcribe is transcription only, so host speech uses prerecorded assets or the device's TTS. Muse Wonder Full is not selected because it is not a Model API variant.

Muse Image is not a video generator. No video generation, voice cloning, word-level ASR timestamps, emotion inference or calibrated ASR confidence is assumed. Humming recognition is not required to award R07 points: the teammate's answer is checked against the known target. Future humming-search capability needs its own evidence and catalogue indexing work.

## 4. Integration policy

The mobile app calls only app-owned services. The backend uses a typed HTTP/WebSocket adapter with endpoint allowlisting, schema validation, request/response size caps, redaction, bounded timeouts and a per-route concurrency budget. The application judgment deadline is measured from capture end: target 4 seconds, hard maximum 8 seconds before neutral fallback. A language-model SDK may be used behind that adapter if compatible, but no SDK-specific request object crosses the app's domain interface.

Freeze each adapter's request/response fixtures against the official docs before activating live calls. Preserve provider request/session IDs for troubleshooting without logging credentials or raw recordings. Unknown additive event types must be safely ignored. A provider error is mapped into stable application reason codes.

Prompt inputs explicitly separate instructions from untrusted lyric/transcript data. Structured output validates shape, not factual correctness; all returned song IDs and phrase relationships are checked against the catalogue. The adapter has no generic internet-search tool in live gameplay.

## 5. Cost model and quotas

Track costs by match, feature and model route, while keeping billing identifiers private. The model configuration stores a dated price snapshot sourced from [Meta pricing and limits](https://dev.meta.ai/docs/pricing-rate-limits); deployments must refresh it when provider rates change. Never use a subscription entitlement for a coding product as an assumed inference budget for app users.

Estimate a match with:

`ASR cost = processed audio seconds / 3600 × configured hourly rate`

`Reasoning cost = uncached input tokens × input rate + cached input tokens × cached rate + output tokens × output rate`

Add relay egress, Redis baseline, Firestore operations, Storage and job execution. The exact total is unknown until measured. Reduce cost by opening one transcription stream per active attempt, caching invariant host text, doing visual review offline, bounding retries and using catalogue retrieval before reasoning. Alert on budget burn; apply a server-enforced session/tenant cap rather than relying on the mobile client.

## 6. Dependency and version ownership

The bootstrap/integrator owns Flutter SDK pinning, `pubspec.lock`, Node runtime, package manager, root workspaces, lockfiles, emulator versions and CI images. Feature agents list dependency requests in their handoff and stay inside assigned feature paths. Update shared packages in a dedicated task with both Android and iOS build evidence.

All backend component slices live in `services/game-api/src/features/<component>/<slice>.ts`, with tests in `services/game-api/test/<component>/{unit,adverse,integration}/<slice>.test.ts`. Role-separated entrypoints compose modules for commands, relay, AI and background workers; those roles do not imply a separate codebase or microservice for every feature. Operational tools use `tools/ops/<component>/<slice>.py` and task-owned tests under `tools/ops/tests/<component>/`.

Canonical contracts are in `packages/contracts/schema/`; `docs/contracts/` is the human-readable companion. Each task writes its own registration descriptor and the bootstrap registry generator combines descriptors deterministically. Workers must not edit common imports or route registries to register a feature. These ownership rules are required for safe five-task parallel batches.

A native media compatibility spike is a prerequisite for using the same media adapter in every round. If the selected playback plugin cannot meet the device requirements, replace that adapter before parallel feature work adopts its API. Avoid mixing multiple competing state-management or microphone ownership systems.

## 7. Alternatives deliberately deferred

- A managed external voice-room provider may replace the relay later, but the MVP architecture does not require another commercial API.
- WebRTC/SFU/Opus can improve bandwidth/latency at larger scale; that is a later transport project behind the media interface.
- Self-hosted Muse models add GPU operations and are not necessary for this first implementation.
- A dedicated search/vector service is not needed for a bounded pilot catalogue; begin with a curated text/alias index and measure retrieval failures.
- SQL/Firestore migration, global multi-region active-active rooms and public matchmaking are outside the MVP.

The stack is intentionally compatible with a small private pilot. Performance and reliability targets become claims only after the evidence listed in [RELEASE_GATES.md](RELEASE_GATES.md) is collected.
