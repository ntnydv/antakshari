# R05: Agla Bol

Status: MVP round specification. Round type: `agla_bol`. Revision: 2026-10-27.

## Goal and eligible modes

Continue a song immediately after a deliberately chosen stopping point. Available in 1v1 and 2v2. This is a sequence-memory task: singing any line from the right song is insufficient.

## Player flow and timing

Play a five-to-eight-second excerpt and cut at an approved phrase boundary. Visually indicate the cut and open a 10-second start window. Allow at most 15 seconds of singing to complete the next required phrase. The UI says “Continue with the next phrase” and shows no lyrics during the primary response.

Use two assigned primary opportunities per team. A wrong/expired response may open one eight-second opposing steal start window followed by at most 15 seconds of singing. A replay lifeline is the sole hint: it replays the identical preceding cue once, costs five points, and restarts the answer window only after replay ends. The server creates a new timed phase token; stale deadlines cannot end the replayed attempt.

## Catalogue contract

Require `songId`, `versionId`, cue start/end timestamps, the exact phrase-boundary ID, approved next phrase IDs, and any declared repeat alternatives. Cut points must be reviewed against the audio, not guessed from transcript punctuation. Silence, musical bridges, and repeated choruses can have ambiguous continuations; exclude them unless the accepted sequence is explicit.

The prepared cue is physically trimmed to its end, so a modified client cannot continue playing an underlying full recording. The response target is server-only. Reveal can replay the small licensed continuation after both primary and steal are closed.

## Decision and score

Align the response to the allowed immediately following phrase. An approved small amount of leading overlap with the previous phrase is permitted, but the required next phrase must be present in order. Repeating only the already-heard cue does not qualify. Jumping to a later verse or singing the right words out of sequence fails unless that exact variant is approved.

Award 20 for a valid primary, 10 for a steal, and subtract the five-point replay cost from the primary's available award under shared scoring rules. Small vocal timing variations are tolerated; the player is not required to match the exact recording tempo. The backend evaluates content order, not a karaoke rhythm grade.

## Failure and abuse cases

A playback failure or cue that exposes future audio invalidates the prompt without penalty. Replaying the cue through a stale cache after a new prompt cannot unlock the response; assets and grants bind to prompt IDs. If device audio focus is lost at the cut point, request a replacement before accepting an answer. If the accepted next phrase is shorter than the minimum sufficient evidence threshold, choose another cut point rather than making the AI infer intent.

## Round-specific acceptance

- The immediate next phrase passes while a different verse of the same song fails.
- A repeat-only response does not receive points.
- File inspection proves there are no post-cut samples in the served cue.
- Replay charges once, preserves the exact cue, and supersedes stale timer tasks.
- Accepted version-specific repeated lines resolve deterministically.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R05-01-I](../../backlog/tasks/R05/R05-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-02-I](../../backlog/tasks/R05/R05-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-03-I](../../backlog/tasks/R05/R05-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-04-I](../../backlog/tasks/R05/R05-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-05-I](../../backlog/tasks/R05/R05-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-06-I](../../backlog/tasks/R05/R05-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-07-I](../../backlog/tasks/R05/R05-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-08-I](../../backlog/tasks/R05/R05-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-09-I](../../backlog/tasks/R05/R05-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-10-I](../../backlog/tasks/R05/R05-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-11-I](../../backlog/tasks/R05/R05-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-12-I](../../backlog/tasks/R05/R05-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-13-I](../../backlog/tasks/R05/R05-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-14-I](../../backlog/tasks/R05/R05-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-15-I](../../backlog/tasks/R05/R05-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R05-16-I](../../backlog/tasks/R05/R05-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
