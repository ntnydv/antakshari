# Component design: answer adjudication

Status: proposed. Owner: judging workstream. Dependencies: immutable round manifest, private catalogue version, final transcript evidence, turn state, scorer contract. This component decides whether an attempt satisfies a round; the scorer applies the configured point schedule.

## Principles

Judge recall and rule compliance. Ordinary differences in pitch, key, speed, accent, or vocal quality do not reduce points. A correct song can still be a wrong section. A recognizable title can satisfy identification but cannot substitute for the required sung phrase. Hum & Guess judges the teammate's answer; automated recognition of humming is not a required MVP capability.

Do not assume a speech recognizer is a reliable singing recognizer. The model plan and evaluation gate are defined in [AI_MODELS.md](../AI_MODELS.md). A successful HTTP request and a plausible transcript are only evidence.

## Input and output

```ts
type AdjudicationRequest = {
  schemaVersion: 1;
  attemptId: string;
  matchId: string;
  roundInstanceId: string;
  expectedRoundRevision: number;
  submittedBy: string;
  answerKind: 'SUNG_PHRASE' | 'SONG_IDENTIFICATION' | 'TEAM_GUESS';
  transcriptEvidenceId?: string;
  typedAnswer?: string;
  contentPackVersion: string;
  adjudicationPolicyVersion: string;
};

type AdjudicationOutcome = {
  schemaVersion: 1;
  attemptId: string;
  decisionVersion: number;
  verdict: 'accepted' | 'rejected' | 'uncertain' | 'invalid_attempt' | 'cancelled';
  criterionResults: Array<{
    criterion: string;
    result: 'PASS' | 'FAIL' | 'UNKNOWN';
    evidenceIds: string[];
  }>;
  acceptedSongVersionId: string | null;
  acceptedSectionId: string | null;
  reasonCode: string;
  provenance: 'DETERMINISTIC' | 'MODEL_ASSISTED' | 'PARTICIPANT_REVIEW';
  calibrationVersion: string;
};
```

These illustrative types must map to the shared executable schema before parallel implementation starts. No output field asks an LLM to invent “confidence.” A future calibrated probability requires a held-out evaluation and its own calibration artifact. The MVP uses explicit evidence rules plus abstention.

The wire enum is lowercase and uses underscores. `accepted` means every required criterion passed; `rejected` means evidence establishes a required criterion failed. `uncertain` covers inadequate audio, missing provider output, malformed model evidence, or unresolved song/section ambiguity. `invalid_attempt` covers application authorization/lease/rule eligibility errors before valid adjudication; `cancelled` covers an attempt the authoritative state has terminated or superseded. A capture retry is represented as `uncertain` with `reasonCode: 'INSUFFICIENT_AUDIO'` and the room's retry policy, never as an additional verdict enum. Internal `ModelEvidence.relation` values `MATCH`, `MISMATCH`, and `INSUFFICIENT` cannot be copied directly to this result.

## Decision pipeline

1. **Authorisation and freshness.** Read the server attempt and round revision. Verify submitting player, active turn, accepted recording interval, and unused decision key. Retried jobs reuse the original deadline and audio hash.
2. **Audio eligibility.** Check recording length, decode success, channel/sample format, clipping rate, sustained silence, and missing frame percentage. These checks are application measurements. Tune thresholds on real pilot recordings; do not treat loudness as skill. Unusable capture produces `uncertain` plus an audio reason, with no wrong-answer penalty.
3. **Transcript handling.** Preserve the original final transcript privately. Build normalized alternatives using Unicode normalization, punctuation/whitespace cleanup, script-aware tokenisation, and a reviewed transliteration dictionary. Do not rewrite every uncertain token to the expected lyric.
4. **Candidate selection.** For cue-led rounds, load only allowed versions/sections. For open song rounds, search the approved pack using token and phonetic indexes, producing at most eight candidates with the retrieval evidence retained.
5. **Phrase alignment.** Align observed tokens to approved lyric spans in order, allowing measured vowel extension and a limited number of omissions. Compare alternatives against wrong-section and near-match candidates as well as the expected text.
6. **Constraint evaluation.** Apply start sound, mandatory keyword, successor phrase, repeated-song, team ownership, answer count, and time rules independently.
7. **Optional interpretation.** Ask the Muse gateway to resolve a bounded textual ambiguity. Reject nonexistent references and contradictory outcomes. Never permit free-form music trivia to override curated metadata.
8. **Final decision.** Produce criterion-level evidence. Accept only when all mandatory criteria pass; reject when a necessary criterion has established failure; abstain when evidence is missing or ambiguous.
9. **Commit.** Submit the evidence outcome to the server decision reducer. One transaction writes the immutable decision record, scoring event, round revision, and outbox event. Provider I/O already happened outside that transaction.

## Round-specific criteria

| Round | Mandatory evidence | Typical failure | Ambiguity handling |
| --- | --- | --- | --- |
| Classic Antakshari | Catalogued opening phrase, requested phoneme, no repeated song family | Correct song beginning with another sound | If final phoneme from prior turn is uncertain, display the server's resolved next cue before opening a turn |
| Dhun Pehchano | Accepted title alias for identity; opening phrase for singing bonus | Correct film but wrong song | Score identity and singing as separate criteria |
| Antara Se Mukhda | Correct song family/version and accepted mukhda span | Repeating the cue's antara | Search all accepted refrain variants for that cue |
| Mukhda Se Antara | An allowed antara distinct from the supplied refrain | Same refrain repeated | Accept any published allowed antara unless difficulty specifies an index |
| Agla Bol | Correct successor span in the selected version | A later verse that skips the requested phrase | Boundary annotations determine the successor, not an LLM's recollection |
| Shabd Se Geet | Required normalized token occurs in the actual sung phrase | Naming a song whose title contains the word without singing it | Compound/inflected variants come from the pack's explicit rule table |
| Hum & Guess | Guess by an eligible teammate matches the secret selected song | Performer submits their own answer | Humming quality is not automatically scored |
| Do Gaane, Ek Clue | Two distinct selected song IDs identified | Only one correct identity | Separate per-song criteria; do not require order unless configured |
| Silent Video | Song identity matches the video clue's answer set | Correct actor or film only | Editor must approve ambiguous-scene answer aliases |
| Tasveer Se Geet | Song identity matches the approved visual clue | Plausible unrelated song | If clue supports several songs, publish all accepted answers or withdraw clue |

## Phrase coverage policy

The initial policy requires an annotated complete phrase or a minimum discriminative token set approved by an editor. Phrase duration alone is insufficient: a long sustained vowel cannot prove recall. A short distinctive opening may be acceptable where a generic phrase is not. Store `minimumEvidenceSpanIds` and permitted omissions in the answer manifest.

A deterministic matcher should expose `matchedTokenCount`, `referenceTokenCount`, `orderViolations`, `phoneticSubstitutions`, `competingCandidateMargin`, and `sectionCompatibility`. These are measurements, not probability estimates. Initial thresholds belong in a versioned configuration and must be fitted on a development set, then evaluated on a separate holdout. Do not hard-code a universal percentage for all rounds.

To prevent leakage-driven bias, a known-song transcript must be obtained before injecting reference lyric excerpts into any comparison request. Never ask the first transcription pass “transcribe the expected line from song X” while treating its result as independent proof.

## Timing and replay protection

The authoritative server records `answerOpenedAt`, first accepted audio frame receipt, `answerClosedAt`, and stream sequence continuity. The user's thinking deadline governs when an attempt can begin; a separate recording cap governs its maximum duration. A client-reported timestamp cannot extend either boundary. Network allowance is a fixed room policy applied to both teams, not an arbitrary per-player model deduction.

Every capture authorization binds player, match, round revision, attempt, expiry, and nonce. Reject recordings attached to another turn. Replaying the same hash is not by itself proof of cheating, because retry uploads can legitimately reuse it; compare the authorization and attempt lifecycle first. Obvious prerecorded studio playback may be flagged for human review, but the MVP must not claim robust automated anti-cheat or voice identity verification.

## Abstention and private-room review

For transient capture failures permit one retry using the same clue without penalising the original attempt. Grant the same retry policy to both teams. For a content ambiguity or provider failure, show a neutral explanation and choose one of the room's preselected outcomes:

- **Assisted room:** after the answer and any permitted steal opportunity close, expose the authorized explanation/reveal and obtain approval from both team captains. The server records both approvals and `PARTICIPANT_REVIEW` provenance. A disagreement voids the clue and supplies a replacement with no score change. A revealed clue cannot be reused for a retry.
- **Automatic-only internal evaluation:** void and replace the clue, retaining evidence for diagnosis when participants consented.

A host alone cannot quietly award their own team points. Every override appears in the result history. Assisted outcomes are explicitly unranked; there is no global ranked mode in this MVP. Once both teams have seen the answer reveal, reattempting the same clue is prohibited.

## Concurrency and consistency

The decision key is `attemptId:decisionVersion`. A duplicate job may reproduce evidence but cannot produce a second award. Revoking/overriding a decision appends a correction event; it does not mutate historical evidence in place. Each correction references the superseded version and recomputes the scoreboard from the ledger.

If a round expires while inference is running, the reducer accepts the result only when that exact attempt had already been reserved in the `adjudicating` phase and its bounded processing deadline remains valid. An unrelated stale result is ignored. The match state machine and scorer own this rule; the AI service does not write directly to the scoreboard.

## Privacy, accessibility, and explanation

Display concise reason codes: correct song, correct verse, wrong section, repeated song, required word missing, insufficient audio, or uncertain match. Do not expose full private lyric references, provider prompts, or raw scores describing vocal ability. Show a transcript preview only to the submitting player during an unresolved attempt; revealing it to opponents can leak a steal answer.

Users who cannot or do not wish to sing can play identification roles and supported text-guess rounds. Room setup must explain when a selected round requires microphone participation; do not silently award a sung-answer criterion for typing.

## Verification plan

Cover valid phrase, near-match song, common fragment, wrong antara, different legitimate version, Hindi/Latin transliteration, code-switching, vowel extension, silence, clipping, microphone denied, no final transcript, forbidden candidate IDs, malformed structured output, repeat submission, double completion, expired round, cancelled match, provider delay, and conflicting captain reviews. Tests must assert observable verdict, scoreboard delta, and reveal timing, not copy the implementation's private helpers.

Use synthetic fixture songs for reproducible unit/integration tests and consented licensed examples for empirical model evaluation. Keep test fixtures' expected results independent from the model being evaluated. A version change to normalisation, prompts, catalogue spans, or models requires a replay comparison and explicit review of newly accepted negatives.

## Completion criteria

- Each of the ten round plugins maps to explicit mandatory criteria.
- Deterministic fake evidence exercises every outcome class without network access.
- Duplicate/stale evidence cannot change points twice or advance the wrong turn.
- Unknown evidence reliably abstains; no absence of evidence is converted into an incorrect-player penalty.
- Private-room review is symmetric, visible, and stored with provenance.
- The release report publishes the actual accuracy/coverage/latency measurements and failed slices.

## Executable delivery slices

- [C15-01-I](../../backlog/tasks/C15/C15-01-I.md): evidence-pipeline (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-02-I](../../backlog/tasks/C15/C15-02-I.md): known-song-check (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-03-I](../../backlog/tasks/C15/C15-03-I.md): section-verifier (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-04-I](../../backlog/tasks/C15/C15-04-I.md): transcript-normalizer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-05-I](../../backlog/tasks/C15/C15-05-I.md): candidate-retrieval (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-06-I](../../backlog/tasks/C15/C15-06-I.md): keyword-verifier (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-07-I](../../backlog/tasks/C15/C15-07-I.md): phoneme-start-check (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-08-I](../../backlog/tasks/C15/C15-08-I.md): lyric-span-alignment (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-09-I](../../backlog/tasks/C15/C15-09-I.md): evidence-calibration (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-10-I](../../backlog/tasks/C15/C15-10-I.md): uncertainty-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-11-I](../../backlog/tasks/C15/C15-11-I.md): variant-resolution (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-12-I](../../backlog/tasks/C15/C15-12-I.md): duplicate-song-check (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-13-I](../../backlog/tasks/C15/C15-13-I.md): adversarial-transcript (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-14-I](../../backlog/tasks/C15/C15-14-I.md): human-review-evidence (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-15-I](../../backlog/tasks/C15/C15-15-I.md): adjudication-finalizer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C15-16-I](../../backlog/tasks/C15/C15-16-I.md): evaluation-report (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
