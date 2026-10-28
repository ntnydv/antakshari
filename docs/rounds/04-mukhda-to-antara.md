# R04: Mukhda Se Antara

Status: MVP round specification. Round type: `mukhda_to_antara`. Revision: 2026-10-27.

## Goal and eligible modes

Hear a song's opening refrain and sing a valid verse. Available in 1v1 and 2v2. This is the primary feature requested by the product concept: distinguish knowing the song from remembering its antara.

## Player flow and timing

Play a six-second mukhda cue, then open a 20-second start window. The designated performer records up to 20 seconds. In the MVP default, any approved antara for the selected song/version is valid. The intro and answer screen display “Any antara accepted.” A future first/second-verse difficulty modifier must never be activated without an explicit label and catalogue support.

Give each team two primary opportunities. After a confirmed incorrect or expired answer, the other team can attempt one steal with a 10-second start window and 15-second performance. No steal is offered while an uncertain primary is being retried.

## Private content contract

Require `songId`, `versionId`, `mukhdaCueId`, and at least one complete approved `antaraSection` containing phrase IDs, normalized/transliterated variants, boundaries, and the minimum accepted phrase span. Select songs with enough verse material to permit a meaningful answer in 20 seconds. A song with no editorially approved antara is ineligible even if a general model claims it has one.

Public cue data exposes the audio grant, requested section policy, and time limits. The accepted verse list and canonical lyrics remain server-only. The reveal may show the recognized verse number and a short licensed reference phrase as permitted by the content policy.

## Adjudication and score

The server checks the sealed response against every accepted antara alternative for the frozen version family, excluding mukhda-only matches. Minor skipped particles or pronunciation variants can be accepted where the editorial threshold permits. Require a complete recognisable phrase, not simply the first word of a verse. Lyrics and section identification determine correctness; transposition and ordinary out-of-tune singing are allowed.

A correct primary receives 20; a correct steal receives 10. A once-only five-point hint can give the approved first word of one antara, provided that this does not constitute the complete required phrase. The hint is catalogue-authored and reveals no additional verse text. Repeating the mukhda earns zero with the explanation “Correct song; this round needs an antara.”

## Edge cases

Some recordings reorder verses, repeat sections, or introduce a spoken prelude. Version metadata decides which spans count. A response bridging the end of the mukhda into a substantial accepted antara can pass only if the minimum antara coverage is present. A pure refrain repetition fails even if the model names the song correctly. A valid verse from an unknown version is uncertain and can enter the consensual party-review path; do not fabricate evidence.

## Round-specific acceptance

- Every accepted antara alternative can pass a fixture for the default policy.
- Correct song with mukhda-only response fails section validation while preserving a friendly explanation.
- A minimum fragment with a common word fails; a sufficient approved verse passes.
- A reordered but approved recording version passes without relying on verse index alone.
- The first-word hint is charged once and does not reset timing.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R04-01-I](../../backlog/tasks/R04/R04-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-02-I](../../backlog/tasks/R04/R04-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-03-I](../../backlog/tasks/R04/R04-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-04-I](../../backlog/tasks/R04/R04-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-05-I](../../backlog/tasks/R04/R04-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-06-I](../../backlog/tasks/R04/R04-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-07-I](../../backlog/tasks/R04/R04-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-08-I](../../backlog/tasks/R04/R04-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-09-I](../../backlog/tasks/R04/R04-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-10-I](../../backlog/tasks/R04/R04-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-11-I](../../backlog/tasks/R04/R04-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-12-I](../../backlog/tasks/R04/R04-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-13-I](../../backlog/tasks/R04/R04-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-14-I](../../backlog/tasks/R04/R04-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-15-I](../../backlog/tasks/R04/R04-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R04-16-I](../../backlog/tasks/R04/R04-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
