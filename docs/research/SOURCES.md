# Research and evidence ledger

Checked: 2026-10-27. This ledger distinguishes provider facts from product decisions. Linked documentation was readable during planning; no authenticated API smoke test, key creation, cloud deployment, singing benchmark, or rights clearance was performed as part of writing these documents.

| ID | Primary source | Fact used | Design consequence |
| --- | --- | --- | --- |
| META-01 | [Meta model catalogue](https://dev.meta.ai/docs/models) | Current named model IDs and modality families | Pin exact IDs in the server gateway; do not assume arbitrary future versions |
| META-02 | [Meta speech-to-text guide](https://dev.meta.ai/docs/speech-to-text) | Voice transcription protocol and supported speech features | Use a provider adapter, controlled capture format, and a fresh ASR attempt session |
| META-03 | [Meta audio/video guide](https://dev.meta.ai/docs/video-understanding) | Spark 1.3 audio quality limitation | Keep audio fallback on an evaluated 1.2 route; do not use1.3 audio as default judge |
| META-04 | [Meta structured output](https://dev.meta.ai/docs/structured-output) | JSON Schema response mode | Require a narrow evidence schema and application-level semantic validation |
| META-05 | [Meta pricing and rate limits](https://dev.meta.ai/docs/pricing-rate-limits) | Published Standard prices and account/team capacity dimensions | Budget by audio seconds and tokens; gate concurrency |
| FB-01 | [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions) | Transactions can retry and writes commit atomically | Keep provider calls outside transaction callbacks; commit decisions once |
| FB-02 | [Firestore presence solution](https://firebase.google.com/docs/firestore/solutions/presence) | Native presence comes from Realtime Database integration | Use RTDB disconnect signalling and treat presence as advisory |
| FB-03 | [Cloud Tasks functions](https://firebase.google.com/docs/functions/task-functions) | Managed queued function execution | Persist deadline work and idempotent retry handlers |
| FB-04 | [Flutter App Check](https://firebase.google.com/docs/app-check/flutter/default-providers) | Platform attestation integration | Add App Check alongside authentication; do not equate attestation with authorisation |
| FB-05 | [Dynamic Links FAQ](https://firebase.google.com/support/dynamic-links-faq) | Dynamic Links is deprecated for new projects | Use app/universal links and room-code fallback |
| GCP-01 | [Cloud Run WebSockets](https://docs.cloud.google.com/run/docs/triggering/websockets) | Connections have timeouts; affinity is best effort | Reconnect, resume from server state, and synchronise instances explicitly |
| FL-01 | [Flutter architecture guide](https://docs.flutter.dev/app-architecture/guide) | UI/data separation and explicit component boundaries | Feature views and controllers depend on repository ports |
| FL-02 | [record package](https://pub.dev/packages/record) | Microphone capture to stream/file | Prototype the capture adapter and lock a tested version |
| FL-03 | [flutter_sound package](https://pub.dev/packages/flutter_sound) | Recording/playback toolkit | Candidate PCM playback adapter subject to physical-device evaluation |

## Unverified items and required follow-up

1. **Account entitlement:** verify that the user's Meta account can call each selected model from the intended deployment region. Public model documentation is not proof of account access.
2. **Singing quality:** no source here establishes Hindi Antakshari singing accuracy, calibrated song-recognition probability, or reliable section verification. The application benchmark is a release gate.
3. **Latency and cost:** the stated service targets and match examples are design estimates. Measure actual device/network/provider performance and billable usage.
4. **Provider retention:** Standard mode's no-training statement does not alone establish retention or deletion behaviour. Check account terms and available controls before sending production recordings.
5. **Music rights:** no commercial recordings, lyrics, stills, or videos have been licensed through this documentation task. Use cleared fixtures until the release inventory is approved.
6. **Versions:** select a compatible Flutter/Dart/Firebase package set during bootstrap, commit lockfiles, and document the tested matrix. Package-page versions are not a substitute for a resolved build.
7. **Native audio:** verify microphone interruption, Bluetooth routing, speaker echo, and PCM playback on physical Android/iOS devices before declaring the live-media flow ready.

## Evidence maintenance

When a model, endpoint, price, or limitation changes, update its source row, observation date, configuration, and affected evaluation report together. An orchestrator should refuse a task completion that changes a provider assumption without a primary-source reference or measured evidence. Keep copied vendor prose out of implementation prompts; link to documentation and retain only the field names and facts needed by the contract.
