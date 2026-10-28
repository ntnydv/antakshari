# R09: Silent Video

Status: MVP round specification. Round type: `silent_video`. Revision: 2026-10-27.

## Goal and eligible modes

Recognize a song from its visual sequence without hearing the soundtrack. Available in 1v1 and 2v2. The app already knows the expected song for its own clip; a vision model is an offline content-review aid, not the authoritative answer key.

## Player flow and timing

Show a six-second silent clip in a player that supports replay only through the hint action. After playback, open a 12-second answer-start window. The designated player names the song and may sing an approved opening within a 20-second recording budget. Display the silent-video badge throughout so a phone on mute is not mistaken for a malfunction.

Use two assigned clues per team. A confirmed incorrect/expired primary allows one opposing eight-second title-only steal. A one-use replay hint costs five points and replays the same silent asset; response time restarts only after replay ends under a new phase token.

## Media preparation and privacy

The asset pipeline must physically remove every audio stream, not merely set the client volume to zero. Strip subtitles, closed captions, track titles, thumbnails with textual answers, original filenames, source URLs, and container metadata. Server validation enumerates streams and rejects any audio/subtitle track. Store an audited silent derivative as the served asset; do not give the client access to the original video.

Private fields include song/version ID, clip timestamps, aspect ratio, accepted title aliases, approved opening phrases, difficulty, rights coverage, and `silentDerivativeVerifiedAt`. Public projection contains an opaque derivative grant, dimensions, duration, and task instruction. Use edited music-video scenes only when they identify the intended song; generic footage shared across songs is unsuitable.

## Adjudication and score

Correct identification is worth 10; a valid opening from the same expected song is worth another 10. An opening alone may establish both if verified. A title-only steal earns 10. Movie title, actor name, or story description alone does not qualify unless it is also an accepted song title alias.

Muse Spark 1.3 can assist an editor in describing or flagging clues before publication; its output cannot overwrite canonical song metadata. During play, the title/lyrics adjudication follows the shared known-song pipeline. Do not upload copyrighted video to a model without the catalogue's processing permission.

## Failure and accessibility

If the video cannot decode, provide a new eligible clue or an agreed equivalent round replacement; a poster still is not silently substituted because difficulty changes. A visually impaired participant's lobby preferences should exclude this round before the playlist freezes, with the replacement clearly shown. All transport and controls remain accessible, but visual song recognition itself requires vision; do not claim a text description is equivalent without explicit alternate-mode rules.

## Round-specific acceptance

- Inspecting the served file finds zero audio and subtitle streams.
- System volume, headphones, or a modified player cannot reveal the soundtrack.
- An actor/movie-only answer earns zero unless it exactly matches an accepted song alias.
- Decoder failure replaces the clue without consuming the opportunity.
- Private source URLs and expected-title metadata never enter the client projection.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R09-01-I](../../backlog/tasks/R09/R09-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-02-I](../../backlog/tasks/R09/R09-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-03-I](../../backlog/tasks/R09/R09-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-04-I](../../backlog/tasks/R09/R09-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-05-I](../../backlog/tasks/R09/R09-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-06-I](../../backlog/tasks/R09/R09-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-07-I](../../backlog/tasks/R09/R09-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-08-I](../../backlog/tasks/R09/R09-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-09-I](../../backlog/tasks/R09/R09-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-10-I](../../backlog/tasks/R09/R09-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-11-I](../../backlog/tasks/R09/R09-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-12-I](../../backlog/tasks/R09/R09-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-13-I](../../backlog/tasks/R09/R09-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-14-I](../../backlog/tasks/R09/R09-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-15-I](../../backlog/tasks/R09/R09-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R09-16-I](../../backlog/tasks/R09/R09-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
