# R06: Shabd Se Geet

Status: MVP round specification. Round type: `shabd_se_geet`. Revision: 2026-10-27.

## Goal and eligible modes

Sing a song phrase containing a displayed word. Available in 1v1 and 2v2. This is open-choice catalogue recall with a precise lyric constraint. Players must sing the word in context; a song title containing the word does not qualify if the sung phrase omits it.

## Player flow and timing

Display a word in Devanagari and transliteration, plus any explicitly accepted inflections. The designated performer has 15 seconds to start and up to 20 seconds to sing a qualifying phrase. Alternate teams for four primary opportunities using the same word, or use a frozen paired-word plan when the catalogue lacks enough distinct eligible songs.

No direct steal is used: the next primary turn already asks the opponent for a new qualifying song. A word remains visible throughout the answer and reveal. An approved first-artist/era hint costs five points once and never gives a complete song title.

## Word and catalogue policy

The plan stores `keywordId`, normalized token forms, `acceptedInflections`, language, and a candidate pool of approved phrase/song-family IDs. An editor confirms at least eight eligible distinct song families for a shared-word round before it is selectable. Matching is token/phoneme-aware; a short syllable hidden inside an unrelated word does not count.

Display accepted inflections when they are enabled. For example, whether singular/plural or grammatical variants are allowed is a rules decision; do not silently broaden the target with an LLM. The active pool excludes used song families from the match. The client receives the word and public aliases, never the candidate pool.

## Decision and score

Identify the song family and an approved sung phrase, then verify that the required word or accepted inflection occurs inside the recorded qualifying phrase. The correct word spoken before singing does not satisfy the rule. Check that the family has not already been used. Apply phonetic normalization for ordinary Hindi/Hinglish transcription differences while retaining enough evidence to distinguish near-homophones.

A valid primary earns 20. A repeat, spoken-only keyword, wrong word, or phrase lacking the word earns zero. Catalogue/recognition uncertainty gets one repeat or party review without a wrong-answer penalty. The accepted family is added to the used set exactly once when the scoring decision commits.

## Edge cases

If four valid answers exhaust the eligible candidates, the round naturally ends. If curation overestimates coverage and an earlier issue empties the pool, select an approved replacement word and preserve completed points; never penalize a player for a depleted pool. A compound word may be accepted only if the catalogue tokenization rule says so. Song variants sharing a family cannot bypass the no-repeat rule.

## Round-specific acceptance

- The keyword sung in an approved phrase passes; the same keyword merely spoken before a wrong phrase fails.
- A substring inside another word is rejected unless explicitly accepted.
- Both scripts map to the same keyword ID.
- Two concurrent duplicate song submissions update the used set once.
- Insufficient candidate coverage prevents room preparation for that plan.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R06-01-I](../../backlog/tasks/R06/R06-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-02-I](../../backlog/tasks/R06/R06-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-03-I](../../backlog/tasks/R06/R06-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-04-I](../../backlog/tasks/R06/R06-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-05-I](../../backlog/tasks/R06/R06-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-06-I](../../backlog/tasks/R06/R06-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-07-I](../../backlog/tasks/R06/R06-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-08-I](../../backlog/tasks/R06/R06-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-09-I](../../backlog/tasks/R06/R06-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-10-I](../../backlog/tasks/R06/R06-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-11-I](../../backlog/tasks/R06/R06-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-12-I](../../backlog/tasks/R06/R06-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-13-I](../../backlog/tasks/R06/R06-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-14-I](../../backlog/tasks/R06/R06-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-15-I](../../backlog/tasks/R06/R06-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R06-16-I](../../backlog/tasks/R06/R06-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
