# AI models and routing

Status: implementation design. Documentation checked 2026-10-27. Provider account access, latency, singing accuracy, and deployed integration have **not** been validated. Product targets below are acceptance gates, not measured results.

## Decision

Use Meta Model API behind a server-owned gateway. Flutter never receives a Meta API credential. Keep song identities, accepted phrases, section annotations, and score calculation in application-controlled data and code. Muse supplies transcription, constrained evidence interpretation, and optional host wording.

The first ten rounds can work without music generation, remote video generation, open-world melody identification, or a synthetic celebrity voice. The launch host uses curated recordings, displayed text, and optional operating-system text-to-speech. Players hear the active singer through the multiplayer media service.

## Model allocation

| Workload | Exact model selection | Execution | MVP treatment |
| --- | --- | --- | --- |
| Player utterance transcription | `muse-voice-transcribe-1.0` | Gateway, one session per answer | Primary, subject to singing evaluation |
| Transcript/accepted-phrase interpretation | `muse-spark-1.3` | Gateway, small structured request | Only when deterministic matching is ambiguous |
| Host wording | `muse-spark-1.3` | Cached text generation | Optional embellishment; templates always available |
| Audio evidence second pass | `muse-spark-1.2` | Gateway, bounded recording | Disabled until independently evaluated |
| Still/video clue quality review | `muse-spark-1.3` | Admin ingestion job | Assistance for a human editor |
| Complex catalogue ambiguity audit | `muse-wonder-1.0` | Offline admin job | Optional, outside the answer deadline |
| Illustrated clue artwork | `muse-image-1.0` | Offline admin job | Optional; not needed for the ten-round MVP |

These IDs and modalities are documented by [Meta's model catalogue](https://dev.meta.ai/docs/models). The catalogue describes text output for the reasoning models and transcription output for Voice Transcribe; it does not make either a speech synthesizer. Muse Wonder Full is not a Model API option. Use the listed Standard IDs, never automatically substitute a `-contributor` variant.

Spark 1.3's audio input currently has an explicit quality limitation in the [audio/video guide](https://dev.meta.ai/docs/video-understanding). A later or more capable general-purpose model is not automatically the safer audio judge. Changing this routing requires a versioned evaluation report.

## Transport facts to preserve

The [speech guide](https://dev.meta.ai/docs/speech-to-text) specifies Hindi/code-switching support for speech, but supplies no singing benchmark. It supplies neither confidence scores nor word-level timestamps. Use `POST https://api.meta.ai/v1/asr/transcribe` for a supported recording and `wss://api.meta.ai/v1/asr/realtime` for live PCM. File requests use multipart `request` and `audio` parts. WAV input is mono 16-bit PCM at 16 or 24 kHz. Realtime credentials belong in the first handshake frame, not its HTTP authorization header. `PUSH_TO_TALK` finishes with a final transcript; `endStream` terminates that session's input. The app uses a fresh provider session for each answer. `PUSH_TO_TALK` does not supply detected turn boundaries; keep them absent. Preserve boundaries only when the selected endpoint/mode actually returns them, never as word alignment.

## Routing policy

1. Validate a server-issued attempt authorization and room phase before spending on inference.
2. Run local/server audio quality checks. Empty or unusable audio yields `uncertain` with reason `INSUFFICIENT_AUDIO`, making the neutral retry policy available.
3. Obtain a final transcript. Cumulative partials are ephemeral UI assistance and never decide points.
4. Compare normalized transcript evidence with approved catalogue answers. For known-song rounds, search only that cue's allowed sections and versions.
5. For free-choice rounds, retrieve at most eight candidate song versions from the private catalogue index. The pool is bounded to the room's published pack.
6. If the deterministic result is unambiguous, return evidence directly. Otherwise, request structured evidence from Spark 1.3 using only supplied candidates.
7. Require independent content, timing, repetition, and section checks before an award. The deterministic scorer accepts an `AdjudicationOutcome`, never a raw model response.
8. On timeout, ambiguity, invalid output, refusal, or unverified audio, return the wire verdict `uncertain` with a specific reason. The room follows its predefined retry/manual fallback policy. `invalid_attempt` is reserved for an application-invalid attempt, such as an unauthorized actor or a broken lease; it does not describe a provider failure. A superseded/cancelled attempt returns `cancelled` and cannot score.

`muse-spark-1.2` audio second pass is an experiment route. It may improve some examples but must not convert unsupported input into a confident score. Its result can remain insufficient even when the response is well formed.

## Feature flags and model configuration

The backend owns immutable configurations identified by `aiPolicyVersion`. A match pins one version at start. Client Remote Config may display availability but cannot enable a disabled provider or change a scoring threshold.

```json
{
  "schemaVersion": 1,
  "aiPolicyVersion": "ai-policy-v1",
  "transcribeModel": "muse-voice-transcribe-1.0",
  "evidenceTextModel": "muse-spark-1.3",
  "audioSecondPassModel": "muse-spark-1.2",
  "audioSecondPassEnabled": false,
  "liveHostGenerationEnabled": false,
  "offlineWonderReviewEnabled": false,
  "offlineImageGenerationEnabled": false,
  "maxCandidates": 8,
  "maxReasoningCallsPerAttempt": 1,
  "providerMode": "standard",
  "scoringPolicy": "catalogue-evidence-v1"
}
```

App-specific configuration fields above are not Meta request fields. The gateway translates its own policy to each documented provider request. Reject unlisted model IDs at startup. Make a rollback a server configuration change affecting new matches; emergency disable can force existing attempts into fallback but never rescore completed turns silently.

## Accuracy evaluation before automatic awards

Create a consented, rights-compatible held-out evaluation set of at least 600 attempts from at least 60 speakers and 60 song versions, separate from the calibration/development set. This is a proposed pilot minimum. Hold out speakers and sessions; additionally report a song-separated retrieval analysis. Do not split near-duplicate recordings randomly across development and evaluation. Keep near-match negatives from remakes, common lyric fragments, wrong sections, and repeated songs.

Evaluate Hindi and Hinglish speech, singing with extended vowels, different keys/tempos, cheap microphones, speaker playback leakage, clipped starts, silence, and overlapping voices. Include wrong answers intentionally; a corpus of only correct singing cannot measure false acceptance.

| Gate | Proposed acceptance target | Measurement |
| --- | --- | --- |
| Accepted-answer precision | At least 98% observed, with at least 200 automatically accepted held-out attempts | Human-correct automated accepts divided by all automated accepts; publish a 95% confidence interval |
| Automated decision coverage | At least 80% of eligible attempts | Accepted plus rejected terminal decisions divided by eligible attempts; report invalid transport separately |
| False accepts and rejects | Diagnostic rates by positive/negative class, with counts | Include at least 300 negative/near-match attempts where feasible; do not equate overall precision with negative-class specificity |
| Section classification | Diagnostic confusion matrix on section-specific attempts | Report mukhda/antara/successor errors and abstentions; a missing section cannot pass a mandatory criterion |
| Processing delay | p95 at most 4 seconds after answer input ends under pilot load | Include network and provider latency; report p99 separately |
| Abstention integrity | Every timeout/invalid response stays unscored until fallback resolves | Deterministic integration suite |
| Data leakage | No answer key or raw recording in client snapshots, analytics, or ordinary logs | Rules tests and sampled logs |

Targets must be revisited using measured pilot results. If the accuracy gate fails, release a clearly labelled private-room assisted mode with participant adjudication, or keep the affected round disabled. Do not claim an autonomous singing judge has shipped because the transcription API returns text.

## Cost model

The [published Standard pricing](https://dev.meta.ai/docs/pricing-rate-limits), checked 2026-10-27, lists Voice Transcribe at $0.18/audio hour; Spark at $1.25/M uncached input tokens, $0.15/M cached input, and $4.25/M output; Wonder at $4/$0.20/$20 for those categories; Image at $0.01/image. These are reference prices, not a quote for the user's account. The same page lists ASR limits of 256 concurrent sessions and 16,000 starts/hour, with live and file traffic sharing capacity. Verify account limits before launch.

For each match, calculate:

```text
ASR = processed_audio_seconds / 3600 * 0.18
Spark = uncached_input_tokens / 1e6 * 1.25
      + cached_input_tokens / 1e6 * 0.15
      + output_tokens / 1e6 * 4.25
Total AI = ASR + Spark + optional offline costs allocated per use
Total service = Total AI + Firebase/Cloud Run/Redis + storage/egress + content costs
```

Illustrative workload, not a forecast: 24 answers averaging 12 processed seconds produce $0.0144 ASR cost. If eight ambiguous attempts each use 1,500 uncached input and 250 output tokens, the Spark portion is $0.0235. Combined inference is about $0.0379 before infrastructure, retries, host generation, or licensing. A failed/live request may still consume infrastructure and possibly provider resources; record observed usage rather than infer billing from final HTTP status.

Set pilot admission budgets independently of supplier maximums: proposed global cap 50 active matches, one active singer per match, and reserved inference capacity for retries. Keep a hard per-attempt call count and room spend ceiling. A budget denial falls back gracefully and cannot penalize the player.

## Data and operational requirements

- Keep the provider secret in Secret Manager, bound only to the gateway service account. Redact credential-bearing headers and handshake fields.
- Record only request IDs, model/policy versions, durations, token/audio usage, result classes, and latency in ordinary logs.
- Store raw player audio temporarily under the attempt's private object path; proposed default deletion is 24 hours after match end, sooner on an accepted deletion request unless a documented operational obligation applies.
- Obtain explicit consent for retaining recordings in the evaluation corpus. A gameplay consent is not evaluation consent.
- Standard mode's training policy does not establish this app's retention duration. Verify provider retention controls and terms separately before public release.
- Authenticate every inbound application request. A model-generated explanation cannot create room membership, grant turns, write scores, or call administrative tools.

Detailed boundaries are in [the Muse gateway design](design/muse-gateway.md), [answer adjudication](design/answer-adjudication.md), and [song catalogue](design/song-catalogue.md).
