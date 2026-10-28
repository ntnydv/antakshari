# R02: Dhun Pehchano

Status: MVP round specification. Round type: `dhun_pehchano`. Revision: 2026-10-27.

## Goal and eligible modes

Recognize a song from an instrumental opening and demonstrate recall by singing its opening. Available in 1v1 and 2v2. Equal-turn play with two primary opportunities per team is the default; an optional four-clue shared-buzzer preset uses the same catalogue and answer checks.

## Player flow and timing

Prepare a licensed five-second instrumental cue (allowed catalogue range: three to seven seconds) for each primary opportunity. Both teams hear it once after all players have loaded the sanitized asset. Once playback finishes, the assigned team has eight seconds to identify the song. In the optional buzzer preset, ownership is granted through the shared 100 ms contender-window policy before the eight-second identification timer begins. The designated singer identifies it with a text/title entry or a spoken title, then has one 15-second recording budget to sing an approved opening phrase. Title and singing stages belong to the same attempt so retries cannot obtain multiple bonuses.

Show recognition and singing as two separate result chips. On a definitely wrong or expired primary attempt, the opposing team may use one eight-second steal to name the song for 10 points, without a singing bonus. The correct title remains hidden until the steal closes. After four primary clues, end the round. The default assigns two opportunities per team; the optional buzzer preset uses four shared clues.

## Content contract

Private plan: `songId`, `songFamilyId`, `cueAssetId`, `cueDurationMs`, accepted title aliases, approved opening phrases, difficulty bucket, `instrumentalVerified`, and territorial availability. A human editor confirms that the cue is recognizable and contains no sung title or accidental announcer speech. Do not depend on real-time vocal separation to manufacture instrumental clips during a match.

Public cue: opaque asset grant, duration, round instructions, current performer, and answer deadline. Strip song names from file paths, ID3 tags, album art, subtitles, object metadata, and source URLs. There is no reason to ask a model which song the application's own cue represents; the answer is already recorded in private state.

## Adjudication and score

Canonical title/alias match earns 10. A valid opening phrase for the same expected song earns another 10. If the performer sings the correct opening without explicitly naming the title, identification is established by the verified phrase and both parts may be awarded. If the spoken title is wrong but the sung phrase clearly belongs to the expected song, request clarification rather than guessing whether the player changed their answer; use the sealed final answer rule defined in the UI.

A one-use hint supplies approved artist/decade metadata for a five-point reduction. Awarded wrong buzzes cost five only after a confirmed incorrect decision. A title-only correct primary receives 10, and the missing singing bonus is not separately stealable. All corrections use the shared ledger.

## Failure and abuse cases

If the cue cannot play for any required participant, replace it before the answer window opens. The application never decrements answering time while buffering. If the instrumental is shared by multiple approved songs, the catalogue must declare the ambiguity and accepted alternatives or exclude it; inference cannot settle an editorially ambiguous cue. A clean recognition title cannot compensate for singing a different song when awarding the singing bonus.

## Round-specific acceptance

- Correct alias plus correct opening earns 20; title only earns 10.
- A soundtrack filename or metadata inspection reveals no expected title.
- Lost cue download triggers a replacement without consuming a primary opportunity.
- A correct title with the wrong sung phrase earns only the recognition part.
- The opponent sees no transcript or answer key before its steal ends.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R02-01-I](../../backlog/tasks/R02/R02-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-02-I](../../backlog/tasks/R02/R02-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-03-I](../../backlog/tasks/R02/R02-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-04-I](../../backlog/tasks/R02/R02-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-05-I](../../backlog/tasks/R02/R02-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-06-I](../../backlog/tasks/R02/R02-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-07-I](../../backlog/tasks/R02/R02-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-08-I](../../backlog/tasks/R02/R02-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-09-I](../../backlog/tasks/R02/R02-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-10-I](../../backlog/tasks/R02/R02-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-11-I](../../backlog/tasks/R02/R02-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-12-I](../../backlog/tasks/R02/R02-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-13-I](../../backlog/tasks/R02/R02-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-14-I](../../backlog/tasks/R02/R02-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-15-I](../../backlog/tasks/R02/R02-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R02-16-I](../../backlog/tasks/R02/R02-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
