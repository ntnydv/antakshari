# R10: Tasveer Se Geet

Status: MVP round specification. Round type: `picture_clue`. Revision: 2026-10-27.

## Goal and eligible modes

Recognize a song from a curated image, still frame, or illustrated clue. Available in 1v1 and 2v2. The MVP uses approved assets with an explicit answer key. AI-generated imagery is an optional offline content source; it does not make an ambiguous clue objectively correct.

## Player flow and timing

Display the initial clue level and open a 15-second answer-start window. The designated player names the song and may sing a qualifying opening within 20 seconds. A one-use “Reveal more” hint lowers the identification award from 10 to 5 and replaces the asset with a clearer editorially approved image or crop. The maximum combined award becomes 15, and a wrong answer cannot become negative solely because of this hint. Hint usage does not restart the existing answer deadline.

Give each team two assigned opportunities. A definitely wrong/expired primary permits one opposing eight-second title-only steal. The opponent receives the same highest reveal level already shown, not a more informative private image. The correct title is revealed only after the prompt closes.

## Asset and answer contract

The plan records `clueId`, one or two independently generated derivative asset IDs, expected song family/version, accepted title aliases, opening phrases, difficulty, alt-content policy, and processing/display rights. Images may be licensed movie stills or original illustrations. Editor review confirms that the intended song can reasonably be inferred and that incidental text does not expose the title.

If partial reveal is used, serve physically cropped or masked derivatives. Do not download the full image and conceal it only with Flutter layers: a modified client could remove the mask. The full reveal grant is issued only after the hint command commits. Strip EXIF/IPTC/title metadata and use opaque object names.

## Decision and score

Canonical song identification earns 10; the matching approved opening earns another 10. An opening alone can establish identification if the evidence is sufficient. A title-only steal earns 10. A movie name, actor identity, or plausible visual association is not accepted unless the clue's reviewed answer set explicitly includes that song.

For deliberately broad illustrated clues, either provide a finite, reviewed accepted-song set or classify the item as party-voting content outside the scored pool. A language model cannot expand the answer set during a live match just because an argument sounds convincing. Spark 1.3 may assist offline ambiguity review; Muse Image 1.0 can produce optional originals whose use is still subject to editorial and rights review.

## Failure and accessibility

A missing derivative cannot fall back to an unmasked original. Replace the clue without penalty. Low-bandwidth mode can serve a smaller derivative of identical semantic content, with image quality validated for recognizability. A visually impaired player can exclude visual rounds at lobby setup; the playlist presents the replacement clearly. Do not put the answer in an accessibility label. A true alternate accessible clue is a separate curated item with separate difficulty metadata.

## Round-specific acceptance

- Initial image bytes cannot reconstruct the unrevealed content.
- “Reveal more” is charged once, grants only the approved next level, and keeps the deadline unchanged.
- Both teams receive equivalent revealed information before a steal.
- A plausible but unlisted answer yields uncertainty/review where appropriate, not an invented canonical match.
- An absent thumbnail or image grant never exposes the original source asset.

## Shared implementation boundaries

Use the round plugin seam and command envelope in [Multiplayer flows](../MULTIPLAYER_FLOWS.md). The shared schema package owns request/result types; the plugin owns only its content selection, viewer-safe cue projection, and pure answer decision. The server owns grants, deadlines, idempotency, scoring, and next-phase transitions. Never duplicate a second match reducer inside this feature.

Equal-turn play with two primary opportunities per team is the default; R02/R09 can use an optional four-clue shared-buzzer policy frozen before start. The first team and, in 2v2, the designated performer rotate. The default team round-score cap is 40 and floor is -10; apply the shared ledger policy after all deltas. A provider abstention or infrastructure failure costs no points. Judgment targets p95 within four seconds after capture ends and uses neutral fallback at eight seconds. An interrupted turn receives one 30-second reconnect grace, with no second grace from repeated disconnects in that turn. A private party override requires both captains after reveal and any steal, creates a correction event, and marks the result unranked. A successful transcript alone does not prove the requested song or section is correct.

## Delivery checklist

Deliver the plugin implementation, Flutter task/cue/answer/reveal views, catalogue eligibility query, deterministic decision fixtures, authorized cue projection fixture, and at least one real two-device integration recording. Use original or cleared development media. Verify timer expiry, duplicate submission, corrupt media, an uncertain answer, a reconnect, and attempted answer-key access. Record model-dependent evaluation separately from emulator tests; fake inference does not satisfy the live singing acceptance gate.

## Executable delivery slices

- [R10-01-I](../../backlog/tasks/R10/R10-01-I.md): plugin (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-02-I](../../backlog/tasks/R10/R10-02-I.md): renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-03-I](../../backlog/tasks/R10/R10-03-I.md): cue-projection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-04-I](../../backlog/tasks/R10/R10-04-I.md): answer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-05-I](../../backlog/tasks/R10/R10-05-I.md): timer-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-06-I](../../backlog/tasks/R10/R10-06-I.md): actor-rotation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-07-I](../../backlog/tasks/R10/R10-07-I.md): hint-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-08-I](../../backlog/tasks/R10/R10-08-I.md): steal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-09-I](../../backlog/tasks/R10/R10-09-I.md): repeat-and-variant (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-10-I](../../backlog/tasks/R10/R10-10-I.md): uncertain-judge (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-11-I](../../backlog/tasks/R10/R10-11-I.md): resume-renderer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-12-I](../../backlog/tasks/R10/R10-12-I.md): projection-privacy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-13-I](../../backlog/tasks/R10/R10-13-I.md): content-eligibility (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-14-I](../../backlog/tasks/R10/R10-14-I.md): result-summary (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-15-I](../../backlog/tasks/R10/R10-15-I.md): content-linter (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [R10-16-I](../../backlog/tasks/R10/R10-16-I.md): scenario-driver (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
