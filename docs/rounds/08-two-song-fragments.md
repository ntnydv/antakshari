# R08: Do Gaane, Ek Clue

Status: MVP round specification. Round type: `two_song_fragments`. Revision: 2026-10-27.

## Goal and eligible modes

Identify two songs from a pair of short consecutive musical fragments. Available in 1v1 and 2v2. The MVP uses two independently curated clips joined with a clearly audible gap; it does not ask a generative model to create or separate a live mashup.

## Player flow and timing

Play fragment A for four seconds, a 500 ms gap, then fragment B for four seconds. The UI labels the slots “A” and “B.” After playback, open a 15-second total answer window. The player enters or speaks titles for both slots before that same window closes; there is no separate additional recording budget and no singing stage. Show two result columns so partial success is intelligible.

Each team gets two assigned pairs. After the primary closes, the opponent can attempt one eight-second title-only steal on any unfilled slot. The correct answer for a failed slot remains hidden until that steal ends; a successful slot may be shown only if doing so cannot reveal the second through a shared clue.

## Content contract

The private plan records ordered distinct `songFamilyId` values, version IDs, cue grants, and accepted title aliases. Exclude pairs that are aliases/remakes of the same family. Use equivalent total duration, era familiarity, and difficulty for both teams. Both assets must pass rights and metadata checks before the pair is eligible.

Generate a physically bounded composite or publish two sanitized asset grants with the server-approved gap; do not send underlying full recordings. Public slot IDs are opaque and cannot be resolved to song names. If pair order matters, the task card states it; MVP accepts the correct two titles in either slot and normalizes them once.

## Decision and scoring

Each distinct song contributes 10 points for identification, for a maximum of 20 per primary. The same identified song cannot fill both slots. A sung response can establish an identification only when it unambiguously matches the expected song under the same catalogue rules, but it adds no separate bonus. Incorrect parts do not erase correct parts.

A steal awards 5 per previously unanswered song, up to 10 total, for titles only. A one-use five-point hint supplies approved era metadata for both fragments; it cannot be charged separately for each slot. Track per-song subresults and an immutable aggregate attempt result to prevent duplicate partial-score writes.

## Failure and ambiguity policy

If either clip fails or contains the answer title in metadata, invalidate the whole pair and replace it with a matched-difficulty pair. Do not score one valid clip and then show a different second clip after hearing the player's answer. Ambiguous shared intros need predeclared accepted alternatives for their own slot. Model output naming a plausible third song cannot expand the accepted set.

## Round-specific acceptance

- Correctly identifying both songs earns 20 without any singing requirement.
- One correctly identified song earns 10; duplicate aliases cannot fill both slots.
- Unordered correct titles normalize to the two unique expected IDs.
- Failure of either media asset replaces the entire pair without penalty.
- A retry/steal cannot award a subresult already committed to the primary team.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R08-01-I](../../backlog/tasks/R08/R08-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-02-I](../../backlog/tasks/R08/R08-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-03-I](../../backlog/tasks/R08/R08-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-04-I](../../backlog/tasks/R08/R08-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-05-I](../../backlog/tasks/R08/R08-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-06-I](../../backlog/tasks/R08/R08-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-07-I](../../backlog/tasks/R08/R08-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-08-I](../../backlog/tasks/R08/R08-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-09-I](../../backlog/tasks/R08/R08-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-10-I](../../backlog/tasks/R08/R08-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-11-I](../../backlog/tasks/R08/R08-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-12-I](../../backlog/tasks/R08/R08-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-13-I](../../backlog/tasks/R08/R08-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-14-I](../../backlog/tasks/R08/R08-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-15-I](../../backlog/tasks/R08/R08-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R08-16-I](../../backlog/tasks/R08/R08-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
