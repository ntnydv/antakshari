# R01: Classic Antakshari

Status: MVP round specification. Round type: `classic_chain`. Revision: 2026-10-27.

## Goal and eligible modes

Preserve the familiar chain: the next player sings a different song whose opening begins with the final pronounced sound of the previous accepted phrase. Available in 1v1 and 2v2. This round tests recall and participation; vocal timbre, pitch accuracy, and professional delivery do not affect points.

## Player flow and timing

1. The intro shows the chain rule and the current accepted starting-sound token in Devanagari and transliteration, for example `म / ma`.
2. The designated singer has 20 seconds to begin. A private one-use teammate pass may be requested before recording in 2v2; it does not reset the deadline.
3. The performer sings one complete catalogue phrase within a 15-second recording budget. Merely saying a title or singing the required syllable is insufficient.
4. The sealed answer is checked. On reveal, the next sound is displayed with its transliteration; players never have to infer which written Roman letter the system chose.
5. Advance to the opposing team. After four primary opportunities, the round closes.

A wrong or expired attempt gives zero points and leaves the required sound unchanged for the next primary opportunity. Do not offer a same-song steal: the next primary turn already advances the chain. This avoids rewarding the same musical answer twice.

## Content and private state

Maintain `acceptedStartingSounds`, approved opening-phrase IDs, phrase-ending phonemes, song-family IDs, language, script aliases, and quality-checked transliterations in the catalogue. Freeze a language-specific sound policy in `rulesVersion`. Vowels, nasal endings, silent letters, and compound consonants must have editorially approved mappings; an LLM cannot invent the next sound.

The plan contains the initial sound and an allowed fallback-sound set selected for sufficient catalogue coverage. Keep canonical lyrics and the full candidate list server-only. Expose only the current sound, remaining attempts, used song titles after reveal, and permitted hints. Reject aliases of a previously used song using the canonical song ID. Catalogue-approved versions and remakes map to that duplicate-detection identity where the frozen catalogue policy declares them equivalent.

## Decision algorithm and score

Identify the candidate within the active catalogue, then verify that the singer performed an approved opening phrase, that the first sound matches an accepted token, and that its song family has not appeared earlier in the match. Use normalized transcript evidence plus curated aliases. If available evidence cannot identify the phrase ending reliably, return `uncertain` and request one short repeat; do not guess the next sound.

Award 20 for a valid answer. A permitted artist/era hint costs 5 and cannot directly disclose a valid title. Persist `acceptedSongFamilyId`, `acceptedPhraseId`, and the approved next phoneme in the result; the shared reducer updates the chain only after a committed correct result. Invalid/uncertain results cannot mutate the used-song set.

## Failure and abuse cases

The singer cannot end early on a chosen letter by stopping mid-word: only approved phrase boundaries yield a next token. Speech-only answers, repeated refrain filler, one-syllable humming, a noncatalogue song, and mixed lyrics from two songs are distinct rejection or uncertainty cases. A catalogue miss is labelled unsupported/uncertain and can receive party review; it is not asserted to be a nonexistent song. Transcription variants such as Romanized Hindi must map to the same approved phrase.

## Round-specific acceptance

- Accepted `ma` and its Devanagari form yield the same result without Latin-letter suffix logic.
- An alias or remake mapped to the same canonical song ID cannot bypass the duplicate constraint.
- The final phoneme is taken from the accepted phrase, not arbitrary trailing speech.
- An uncertain phrase boundary produces retry without advancing the chain.
- Duplicate valid submissions add one song family and award points once.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R01-01-I](../../backlog/tasks/R01/R01-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-02-I](../../backlog/tasks/R01/R01-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-03-I](../../backlog/tasks/R01/R01-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-04-I](../../backlog/tasks/R01/R01-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-05-I](../../backlog/tasks/R01/R01-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-06-I](../../backlog/tasks/R01/R01-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-07-I](../../backlog/tasks/R01/R01-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-08-I](../../backlog/tasks/R01/R01-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-09-I](../../backlog/tasks/R01/R01-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-10-I](../../backlog/tasks/R01/R01-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-11-I](../../backlog/tasks/R01/R01-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-12-I](../../backlog/tasks/R01/R01-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-13-I](../../backlog/tasks/R01/R01-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-14-I](../../backlog/tasks/R01/R01-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-15-I](../../backlog/tasks/R01/R01-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R01-16-I](../../backlog/tasks/R01/R01-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
