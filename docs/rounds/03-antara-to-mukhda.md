# R03: Antara Se Mukhda

Status: MVP round specification. Round type: `antara_to_mukhda`. Revision: 2026-10-27.

## Goal and eligible modes

Hear a verse from the middle of a song and sing its opening refrain. Available in 1v1 and 2v2. The task is explicitly to produce the mukhda; naming the film or repeating the presented verse does not complete it.

## Player flow and timing

The cue is an editorially selected six-to-eight-second antara excerpt. End playback at a meaningful phrase boundary and open a 15-second start window. The player records an approved mukhda phrase in at most 20 seconds. Reveal labels both sections so players understand why their response did or did not qualify.

Two assigned opportunities per team are the default. A definitely incorrect/expired primary may be followed by one opposing eight-second steal start window and a 15-second recording maximum. The steal asks for the mukhda, not merely the song title. One no-penalty repeat is available for uncertain recognition; do not replay the clue more than the configured count.

## Catalogue and cue selection

Private fields include `songId`, `versionId`, `cueAntaraSectionId`, approved mukhda phrase IDs, accepted alternate renditions, and section-boundary timestamps. Every cue must belong to a verified antara and avoid including the expected mukhda as a transition at its end. Annotators must identify versions where the refrain differs; accepted variants are explicit rather than inferred during scoring.

Prepare paired difficulty buckets by recognizability, decade, phrase length, and verse popularity. Avoid assigning a famous hook to one team and an obscure extended verse to the other. Selection excludes recently played song families and rechecks the active rights window immediately before preparing the cue.

Public projection contains the audio grant and the instruction “Sing this song's mukhda,” with no title, section text, or exact catalogue IDs that can be resolved to the answer. Section labels can be revealed after the attempt closes.

## Decision and score

The candidate song is known from the cue. Transcribe the sung response and align it to the approved mukhda alternatives, allowing documented phonetic and minor wording variants. Check sufficient phrase coverage so a common two-word fragment does not pass. Coverage thresholds must be calibrated per phrase using the singing evaluation set; a model's self-reported confidence is not sufficient.

Award 20 for a qualifying mukhda; title-only, the presented antara, or another song receives zero. A valid steal awards 10. A five-point hint can disclose approved film/artist context, once. The normal recording remains limited to 20 seconds regardless of hint usage.

## Failure and ambiguity policy

If the artist repeats the mukhda inside an antara, the catalogue marks the excerpt's structural role and acceptable answer separately. If two songs use the same verse fragment, remove the clue or accept both predeclared mappings. A player may sing the full opening stanza if an approved minimum phrase is present within the recording budget. A low-quality recording or mismatched language variant returns uncertainty rather than confidently rejecting a genuine answer.

## Round-specific acceptance

- Singing the cue's antara back does not receive mukhda points.
- An approved alternate-version mukhda is accepted; an unapproved version triggers review/uncertainty.
- A title-only response is clearly explained as insufficient.
- A cue crossing into the refrain is rejected by content validation.
- The reveal shows the selected song and structural section without exposing future answers.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R03-01-I](../../backlog/tasks/R03/R03-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-02-I](../../backlog/tasks/R03/R03-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-03-I](../../backlog/tasks/R03/R03-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-04-I](../../backlog/tasks/R03/R03-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-05-I](../../backlog/tasks/R03/R03-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-06-I](../../backlog/tasks/R03/R03-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-07-I](../../backlog/tasks/R03/R03-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-08-I](../../backlog/tasks/R03/R03-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-09-I](../../backlog/tasks/R03/R03-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-10-I](../../backlog/tasks/R03/R03-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-11-I](../../backlog/tasks/R03/R03-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-12-I](../../backlog/tasks/R03/R03-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-13-I](../../backlog/tasks/R03/R03-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-14-I](../../backlog/tasks/R03/R03-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-15-I](../../backlog/tasks/R03/R03-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R03-16-I](../../backlog/tasks/R03/R03-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
