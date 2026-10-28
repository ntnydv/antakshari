# R07: Hum & Guess

Status: MVP round specification. Round type: `hum_and_guess`. Revision: 2026-10-27.

## Goal and eligible modes

One teammate sees a private song card and hums while the other identifies the tune. This round requires 2v2 and is disabled in 1v1 with the explanation “This round needs a teammate.” No prerecorded-hum or AI-teammate substitute is part of the MVP. The all-ten marathon is therefore a 2v2-only preset.

## Live 2v2 flow and timing

The designated hummer receives a participant-private card, confirms readiness within 10 seconds, and then gets up to 20 seconds to hum without words. All room members may hear the performance, but only the hummer's teammate can submit during the primary guessing window. Do not allow the hummer to send typed clues. The hummer's team has 10 seconds after humming ends to identify the song. The correct title completes the attempt; there is no additional singing stage or bonus in this round.

Swap hummer/guesser roles for the team's second primary opportunity. Teams receive two primary opportunities each. A wrong/expired guess permits one opposing eight-second title-only steal. The hum card remains private until the steal closes.

## Private-card and audio contract

Server-private state includes `songId`, accepted title aliases, opening phrases, and the designated hummer/guesser UIDs. Only the hummer receives the title card. Listeners receive an opaque performer/attempt reference, never the expected title, canonical lyrics, or recognition metadata. A reconnected guesser still cannot read the hummer's projection.

The media relay authorizes the hummer first, then revokes that lease before the guesser can speak a title. The guesser may also type the title. There is no simultaneous audio publishing and no alternate 1v1 media path.

## Decision and score

Judge the teammate's title, not the hum's artistic quality. Correct primary identification earns 20; a title-only steal earns 10. No dedicated humming-identification model is required for this MVP mechanic. Muse may transcribe the spoken guess; it must not reveal its own inferred title as a live assist.

An approved five-point hint reveals an era or film context privately to the guessing team only after humming ends. A word-leak detector may flag clear spoken lyrics for review, but automated speech transcription over humming is not sufficiently authoritative to impose penalties by itself. If both captains confirm that the hummer sang identifying words, replace the prompt and record the incident without awarding points.

## Failure and anti-leak rules

A hum card cannot be included in notifications, room snapshots, analytics, or accessibility text on other participants' devices. The hummer must not receive the next card early. A silent recording or microphone failure grants one replacement; humming off-key is allowed. Collusion via another app cannot be perfectly prevented in private rooms and is not represented as solved by AI.

## Round-specific acceptance

- A guesser using a modified client cannot read the hum card.
- Hummer and guesser roles rotate and the two audio leases never overlap.
- A successful teammate guess scores without running a humming-retrieval model.
- R07 is disabled in 1v1, the reason is visible, and no API request can bypass the eligibility check.
- Lyric-leak suspicion alone cannot cause an automatic loss.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R07-01-I](../../backlog/tasks/R07/R07-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-02-I](../../backlog/tasks/R07/R07-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-03-I](../../backlog/tasks/R07/R07-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-04-I](../../backlog/tasks/R07/R07-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-05-I](../../backlog/tasks/R07/R07-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-06-I](../../backlog/tasks/R07/R07-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-07-I](../../backlog/tasks/R07/R07-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-08-I](../../backlog/tasks/R07/R07-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-09-I](../../backlog/tasks/R07/R07-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-10-I](../../backlog/tasks/R07/R07-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-11-I](../../backlog/tasks/R07/R07-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-12-I](../../backlog/tasks/R07/R07-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-13-I](../../backlog/tasks/R07/R07-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-14-I](../../backlog/tasks/R07/R07-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-15-I](../../backlog/tasks/R07/R07-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R07-16-I](../../backlog/tasks/R07/R07-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
