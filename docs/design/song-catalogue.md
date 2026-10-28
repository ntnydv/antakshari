# Component design: song catalogue and content pipeline

Status: proposed. Owner: content platform workstream. The catalogue is the game's source of truth for answers. The model's musical memory is not authoritative.

## MVP content scope

Target a curated Hindi/Bollywood pilot of 300 approved song families spanning several eras, with at least 100 carrying complete section annotations and cue assets for the singing/recognition rounds. Target at least 40 approved silent-video clues and 40 approved visual clues; reuse only when the match selector's no-repeat policy permits it. These counts are planning targets, not an existing licensed inventory. The first-day demonstration can use 20 original or otherwise cleared fixture songs with synthetic titles and purpose-made visual/video clues. A fixture build is labelled as a demonstration and cannot be represented as a catalogue of famous licensed songs.

The content gate checks breadth per round and era, not only total song count. If a pack lacks valid cues for a selected round, prevent match start and explain which round cannot be supported. Do not invent answers or scrape a replacement during play.

## Data model

| Entity | Key fields | Access |
| --- | --- | --- |
| `songFamily` | stable ID, canonical title, approved aliases, language, film, year, credits | Sanitized metadata may be public |
| `songVersion` | family ID, recording/version label, performance language, duration, release metadata | Approved display fields only |
| `lyricSection` | version ID, section ID, type (`MUKHDA`, `ANTARA`, `BRIDGE`), sequence, lyric spans | Server/editor only |
| `lyricSpan` | ordered tokens, approved transliterations, accepted variants, phrase boundaries, evidence requirements | Server/editor only |
| `cue` | round type, asset references, clip boundaries, difficulty, permitted answers, hint tiers | Client receives a sanitized projection |
| `asset` | opaque ID, object path, MIME type, duration/dimensions, checksum, territory, licence references | Signed access for approved recipients |
| `rightsRecord` | allowed uses, territories, start/expiry, rights owner reference, approval evidence | Admin only |
| `packVersion` | immutable content manifest, eligibility filters, policy versions, publication status | Server pins version per match |
| `contentReview` | editor identities, checks, ambiguity notes, approval/rejection time | Admin/audit only |

Store lyric spans outside client-readable song documents. Firestore security rules cannot redact selected fields from an otherwise readable document; split public and private documents physically. Use opaque asset object names rather than title-revealing paths. A signed URL and its metadata must not expose the answer key, original filename, embedded artwork, or subtitles.

## Version and section handling

Songs can have remakes, reprises, alternate languages, multiple soundtrack versions, and live performances. A `songFamilyId` represents the no-repeat identity; a `songVersionId` represents the exact accepted phrase order. Every cue pins a version or an explicit set of equivalent versions. A title alias does not automatically make all versions interchangeable.

Editors mark section boundaries and allowable successor spans. The Mukhda Se Antara round normally accepts any approved antara in the selected song unless the manifest explicitly asks for an index. Antara Se Mukhda accepts the appropriate approved refrain. Agla Bol uses the exact selected recording's continuation, with accepted alternate renderings enumerated before publication.

Antakshari sound metadata includes script text, Roman display, normalised phoneme class, and reviewer notes for ambiguous endings. The next starting sound is derived from the accepted sung phrase's endpoint, using the game's documented sound policy. It is not necessarily the last Latin character of a title or transcript.

## Publication pipeline

```mermaid
flowchart LR
  Draft[Editor draft] --> Rights[Rights and territory check]
  Rights --> Asset[Asset processing]
  Asset --> Annotate[Section and answer annotation]
  Annotate --> Assist[Optional Muse review]
  Assist --> Human[Second editor review]
  Human --> Validate[Manifest validation]
  Validate --> Publish[Immutable pack version]
  Publish --> Select[Server match selection]
```

The optional Muse review checks likely ambiguity, metadata inconsistency, or visual text that might reveal the answer. It cannot approve rights, fill missing lyric truth from memory, or publish content. Audio/video stillness, duration, checksum, decode, muted track requirements, and overlay text checks are deterministic processing tasks where possible.

Rights approval must distinguish recordings, lyrics, images, video, transformations, territory, and intended in-app use. A generic licence field is not sufficient. Attach an external rights reference without committing confidential agreements into the public repository. A content-rights specialist should approve the actual release inventory; this design is a workflow requirement, not a determination that a particular asset is cleared.

## Round asset requirements

| Round | Content that must exist before selection |
| --- | --- |
| Classic | Approved opening phrases, start/end phoneme metadata, alias index |
| Dhun Pehchano | Cleared instrumental/intro excerpt with verified title and singing answer |
| Antara Se Mukhda | Antara cue and one or more corresponding refrain spans |
| Mukhda Se Antara | Refrain cue and allowed verse sections |
| Agla Bol | Cut point at a reviewed phrase boundary and successor answer spans |
| Shabd Se Geet | Searchable lyric tokens with accepted morphological/phonetic variants |
| Hum & Guess | Performer-only song prompt, team-guess aliases, no clue to opponents |
| Do Gaane, Ek Clue | Two independently approved fragments and a joint answer manifest |
| Silent Video | Cleared clip exported without audible track and without answer captions |
| Tasveer Se Geet | Cleared image plus approved answer set and reveal-stage crops |

Do Gaane, Ek Clue uses a curated sequence of two fragments. It does not require a model to generate a mashup. Silent Video and picture rounds use preapproved assets; the mobile runtime does not generate visual clues while a match waits.

## Server manifest and client projection

The private `RoundManifest` contains cue IDs, allowed song/version/section IDs, rule version, hints, timing, scoring criteria, and asset access policy. The client `RoundView` contains only visible prompt text, opaque playable asset references, current reveal stage, permitted action types, and public clock/turn state.

Access to Hum & Guess's selected title is bound to the designated performer. The teammate sees a guessing interface; opponents see turn status and hear only the room-authorized audio. Snapshot listeners must not point at a shared document that contains the performer's secret field.

Use a server `reveal` operation to publish approved answer metadata after the attempt and steal window close. The resulting reveal projection is distinct from the hidden manifest and can contain only content the app is entitled to display.

## Search and match selection

For the pilot, create a compact versioned token/phonetic index in backend memory from an approved pack snapshot. Partition by language and active pack; invalidate by version rather than mutable document timestamps. Rebuild offline and load from private storage. A later dedicated search service can replace the adapter without changing the adjudicator contract.

The match selector chooses an eligible pack, then creates a seeded plan with equal difficulty distributions for both teams. Hold the seed and answer ordering server-side. Exclude song families already used, withdrawn assets, and clues shown in the current match. Limit avoid-recently-seen history to available inventory; if diversity constraints cannot be met, fail setup or offer a shorter match rather than silently repeat clues.

The selector must calculate availability for all selected rounds before a match starts. A six-round match uses a preset balanced subset; a ten-round marathon includes all ten. The plan is immutable after start except an explicit replacement clue following a voided turn. Replacement selection preserves the original round's difficulty and score opportunity.

## Withdrawal, expiry, and cleanup

Set a scheduled rights-expiry job and a server-side deny list checked before issuing every media URL. Firestore/Storage TTL deletion alone is not an immediate revocation mechanism. Revoking content prevents new matches and new access tokens; current matches replace the affected clue before reveal where possible. Short-lived URLs can remain usable until expiry, so select an expiry consistent with the content agreement and do not promise instant revocation of already-downloaded media.

Content changes create new versions. Active matches keep their pinned semantic data to preserve fairness unless a safety/rights withdrawal requires a replacement. Do not mutate an accepted answer halfway through an attempt. Editors can file a correction proposal that a later release incorporates.

## Observability and quality gates

Track approved cues per round/language/era, missing section metadata, rights-expiry horizon, cache load failures, clue rejection rate, ambiguity reports, and false-award clusters by cue. A sudden burst of disputes on one cue can disable it for new matches without disabling the whole game.

Publication checks: all referenced IDs exist; boundaries are ordered and within asset duration; every answer has evidence spans; no public projection contains private fields; two-song clues use distinct family IDs; muted video has no audible channel; images have no unintended answer text; rights windows cover the scheduled release; checksums match; both editors approved; fixtures and production content are separated.

## Completion criteria

- A fixture pack can be imported, validated, versioned, selected, revealed, and withdrawn end to end.
- The ten round plugins consume the same immutable content interfaces.
- Security tests prove that an opponent cannot fetch private spans, performer prompts, or unrevealed answer IDs.
- At least one negative fixture covers each publication rule.
- Release readiness states actual approved inventory and licences; proposed counts never appear as completed content.

## Executable delivery slices

- [C16-01-I](../../backlog/tasks/C16/C16-01-I.md): song-record (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-02-I](../../backlog/tasks/C16/C16-02-I.md): section-records (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-03-I](../../backlog/tasks/C16/C16-03-I.md): pack-publication (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-04-I](../../backlog/tasks/C16/C16-04-I.md): cue-selection (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-05-I](../../backlog/tasks/C16/C16-05-I.md): alias-index (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-06-I](../../backlog/tasks/C16/C16-06-I.md): starting-sound-index (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-07-I](../../backlog/tasks/C16/C16-07-I.md): word-index (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-08-I](../../backlog/tasks/C16/C16-08-I.md): rights-ledger (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-09-I](../../backlog/tasks/C16/C16-09-I.md): private-answer-manifest (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-10-I](../../backlog/tasks/C16/C16-10-I.md): asset-sanitizer (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-11-I](../../backlog/tasks/C16/C16-11-I.md): difficulty-tags (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-12-I](../../backlog/tasks/C16/C16-12-I.md): catalogue-versioning (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-13-I](../../backlog/tasks/C16/C16-13-I.md): withdrawal-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-14-I](../../backlog/tasks/C16/C16-14-I.md): fixture-catalogue (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-15-I](../../backlog/tasks/C16/C16-15-I.md): coverage-report (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C16-16-I](../../backlog/tasks/C16/C16-16-I.md): catalogue-integrity (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
