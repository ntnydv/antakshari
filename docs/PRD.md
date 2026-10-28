# Antakshari mobile MVP — product requirements

Status: implementation baseline, subject to the evidence gates in [RELEASE_GATES.md](RELEASE_GATES.md). Owner: product/orchestrator. Version: 1.0. Date: 2026-10-27.

This document defines the intended product. It does not claim that code, catalogue rights, provider accounts, evaluations, or deployments already exist. Canonical machine-readable schemas live at `packages/contracts/schema/`; [contracts/](contracts/) contains their human-readable explanation. Round designs live in [rounds/](rounds/). If an interface or state name changes, the contract owner must update dependent designs and task prerequisites before workers proceed.

## 1. Product promise

Friends create a private room, form teams, and play a short musical game show on their phones. Players recognise familiar Indian songs, recall lyrics, sing a requested section, and help teammates. An AI-assisted host explains rounds and interprets sung answers. Authoritative rules award points. Ordinary singing voices are welcome: knowledge and participation determine the core score.

The first release targets Hindi/Bollywood and Hindi/English code-switching. Future catalogues may add regional languages; a model listing a language does not establish acceptable performance on sung material in that language. The app uses its own visual identity and presenter character.

## 2. Goals and boundaries

### Product goals

- G1: A group can move from an invitation to a playable match without a human quizmaster.
- G2: Every player contributes through a rotating singing or answering role.
- G3: All ten round formats below are selectable and playable in the MVP.
- G4: Every score has a short, inspectable reason; uncertain AI outcomes have a predictable resolution.
- G5: A dropped connection or model outage produces a recoverable state rather than an abandoned or incorrectly scored match.
- G6: Components can be implemented by separate agents using versioned contracts, exclusive file ownership, and executable verification.

### In scope

- Android and iOS Flutter app; Android physical-device pilot first, with iOS gated by a successful physical-device audio run.
- Invite-only 1v1 or 2v2 rooms, two teams, maximum four active players.
- Anonymous guest entry, profile name/avatar, account upgrade where configured, consent and microphone checks.
- Create/join lobby, ready checks, team assignment, rotating roles, round selection, room code and OS share sheet.
- Six-round standard match and ten-round marathon; custom selection of 3–10 enabled formats for testing and private play.
- One live singer/performer at a time, audio shared with eligible room members, cue playback, answer submission, adjudication, steals, limited hints, results and rematch.
- Muse-based speech transcription and constrained reasoning, optional AI host text, and approved fixed voice lines or device text-to-speech.
- Catalogue tooling sufficient to review, version, publish, disable, and audit the MVP content packs.
- Solo practice on the same round logic, with no competitive ranking.
- Reconnect, errors, reporting, privacy controls, basic operational dashboards, and staged rollout.

### Out of scope

Public matchmaking, global leaderboards, cash prizes, payments, ads, subscription billing, friend graphs, direct messaging, camera rooms, real-time generated music/video, simultaneous network duets, vocal imitation of celebrities, an open-ended music search engine, and live pitch-based competitive scoring.

Muse Image may assist offline asset preparation. Muse Wonder may assist offline audits. Neither is required in the critical path of a live match. Image/video clue rounds use curated media and known answer IDs; the app does not need to rediscover its own clues using a model during play.

## 3. Users and jobs

| Persona | Need | Design implication |
|---|---|---|
| Casual player | Join quickly and enjoy familiar songs without being a good singer | Guest entry, lenient rendition acceptance, clear turn prompts |
| Music enthusiast | Recall difficult verses and feel the rules are fair | Version-aware answer keys, defined antara boundaries, inspectable verdicts |
| Group organiser | Start a game without manually hosting every round | Room setup, ready checks, automatic sequence and deadlines |
| Quiet teammate | Contribute without taking every singing turn | Shared recognition and team decisions, one pass-to-teammate lifeline |
| Catalogue editor | Publish playable questions without leaking answers | Separate editor workflow and private manifests |
| Operator | Diagnose a failed match without exposing private recordings | Correlation IDs, redacted events, limited-access evidence |

The pilot is an adult, invitation-only cohort. Broader age eligibility and child-account requirements are a separate product/legal decision before public release. Do not infer a user's age from voice or face.

## 4. MVP rounds

All rounds use the same attempt envelope, server deadline, adjudication result and scoring ledger. The starting defaults below are product decisions, not validated timings. Catalogue version controls the exact accepted phrase or section. A phrase is a curator-defined musical/lyric unit, not a fixed number of seconds or a fixed word count.

| ID | Name | Cue and required response | Default answer policy | Score ceiling |
|---|---|---|---|---|
| R01 | Classic Antakshari | Start with the displayed final sound of the previous accepted phrase and sing a qualifying opening phrase | 20 seconds to begin; 15 seconds of answer audio; no reused canonical song ID | 20 |
| R02 | Dhun Pehchano | Hear a 3–7 second instrumental cue; identify song and optionally sing its opening | Assigned turns by default; optional party buzzer; 8 seconds to identify after ownership; optional 15-second singing step | 10 + 10 |
| R03 | Antara Se Mukhda | Hear a verse cue and sing the corresponding refrain | 15 seconds to begin; accept only a listed refrain variant for that song version | 20 |
| R04 | Mukhda Se Antara | Hear a refrain and sing an accepted verse | 20 seconds to begin; any listed verse in normal mode; specified verse in hard mode | 20 |
| R05 | Agla Bol | Playback stops at an annotated boundary; sing the next phrase | 10 seconds to begin; correct successor phrase, with allowed small lyric variations | 20 |
| R06 | Shabd Se Geet | Sing a phrase containing the displayed keyword | 15 seconds to begin; word must occur in submitted phrase, with curated inflection aliases | 20 |
| R07 | Hum & Guess | Performer alone receives target; hums it to their teammate, who identifies it | 20-second hum plus 10-second guess; team format only; no lyric hints | 20 |
| R08 | Do Gaane, Ek Clue | Hear two sequential fragments and identify both songs | 15-second answer window; evaluate each song slot independently; order only if configured | 10 + 10 |
| R09 | Silent Video | Watch an intentionally muted 3–7 second curated video and identify its song | Assigned turns by default; optional party buzzer fixed before match; optional singing bonus | 10 + 10 |
| R10 | Tasveer Se Geet | See a curated still or gradual reveal and identify its song | 15-second window; one hint reduces identification points from 10 to 5; optional singing stage retains its own 10-point cap | 10 + 10 |

R07 requires two players on the answering team. In 1v1, the selector disables R07 and explains why; it does not silently replace the teammate with AI. The ten-round marathon is therefore a 2v2 mode. A 1v1 match may select the other nine formats. This is an intentional compatibility rule.

No copied song title, performer, filename, subtitle, embedded metadata or answer-bearing URL may accidentally appear in a clue. R08 uses licensed or permitted prepared fragments, not on-demand generative mixing. R09 has its audio track removed during preparation as well as muted in the client. R10 clues must have at least one uniquely supportable answer or an explicit accepted answer set.

## 5. Match rules

### Room presets

- Standard: six compatible formats selected from the ten, approximately 10–12 minutes, with a visible pre-match sequence.
- Marathon: all ten formats in 2v2, approximately 18–22 minutes.
- Practice: one player selects a compatible format and difficulty; no team points or public result.
- Custom: 3–10 compatible formats for private hosts and QA; room validates compatibility and available clue counts before start.

Default scored play gives each team two assigned attempts per round, with equivalent difficulty and a maximum of 20 points per attempt. Every team's final round contribution is clamped to a ceiling of 40 and a floor of −10, including any penalties, steals or corrections. Optional party buzzer rounds use shared clues and the persisted contender-window policy below. Players see how a round allocates points before it starts. A judge or host cannot increase the configured caps.

### Answer and scoring policy

1. A response counts only when submitted by the current authorised actor or team captain for that attempt.
2. Song correctness, phrase/section correctness, keyword/starting-sound eligibility, and duplicate-song eligibility are separate checks.
3. Identification-only responses can be spoken or typed. A round requiring singing still requires audio; the app offers an accessible compatible mode or teammate pass where available.
4. Singing quality, accent, voice timbre and absolute musical key do not affect the base score.
5. Identification plus singing rounds award 10 + 10; other full answers award 20; R08 awards 10 for each correctly identified song.
6. A used hint reduces the remaining maximum by 5, with a floor of zero. The available score is displayed before confirming the hint.
7. One pass-to-teammate per team per match transfers the turn without resetting its deadline. It is unavailable in 1v1.
8. A failed ordinary attempt may open one 10-point steal to the opposing team. The previous answer is not revealed before the steal closes.
9. In optional party buzzer mode, a deliberately claimed incorrect answer costs 5 points, subject to the team round floor of −10. Transport failure, missing media, or uncertain AI evidence is not an incorrect answer and carries no penalty.
10. Wrong audio section is distinct from wrong song. The result must say which condition failed without exposing the answer before any steal.
11. Ties use one preselected compatible recognition clue. If it cannot be resolved reliably, report a draw instead of inventing a winner.
12. Rematch creates a new match ID and a fresh content manifest; historical results are immutable except through append-only corrections.

### Timing and buzzer policy

Every authoritative deadline is a server timestamp. Clients estimate their clock offset for display and preload clues before a server-scheduled start. A response begins only after the server accepts the attempt reservation; initial audio must arrive within the configured onset grace. A player cannot reserve a turn indefinitely by tapping the microphone. The recording cap is independent of the response-start deadline.

Default scored play uses equal assigned turns. The optional party buzzer opens a persisted 100 ms contender window when the first eligible claim is accepted. The server stores the cutoff and admits eligible contenders only until that cutoff; it then resolves the admitted team set using the persisted rotating team priority. It does not simply award the round to the first transaction. Duplicate claims return the recorded outcome, late claims cannot extend the cutoff, and a restarted resolver uses the same stored contender set and priority. Network delay can still affect admission; the product does not promise tournament-level latency equivalence. There are no millisecond speed bonuses. Any later ranked mode needs a separately evaluated fairness mechanism.

The judging target is a final result within 4 seconds after capture ends, with a hard maximum of 8 seconds for that attempt before a neutral uncertain fallback. While waiting, show “Checking your answer” and hold score publication. A timeout cannot become a wrong answer, a penalty or an indefinite wait. Any allowed retry is a new linked attempt with its own bounded lifecycle.

### Uncertain verdicts and disputes

- Decision outcomes: accepted, rejected, uncertain, invalid-attempt, or cancelled.
- Uncertain: allow one same-team retry using the same rule and no penalty; if still uncertain, replace the clue or void the attempt symmetrically.
- In private party rooms, a correction is permitted only after the explanation/reveal phase and after both team captains approve the same proposed adjustment. In 1v1, the two players act as captains. The backend records both approvals and an append-only compensating ledger entry, marks the result unranked, and retains the original evidence. A host cannot unilaterally change the score.
- Each team has one formal review request per match. Evidence and review decisions are visible only to permitted members and operators.
- A malformed model response, provider outage, unsupported media type or unverified candidate song is uncertain, not a valid adjudication.

## 6. Multiplayer journeys

### New player → first match

Open app → language and name → guest session → explain live audio and short recording use → microphone permission and local playback check → home → create/join room → lobby → teams and readiness → catalogue/media readiness → countdown → round briefing → clue → answer → verdict/steal → score → next round → results → rematch or leave.

Guest sign-in must survive app restart. Users can choose a preset avatar; camera upload is not needed. Permission refusal retains access to supported recognition/playback screens and clearly identifies rounds requiring a microphone. The user can return from OS settings without rebuilding the room.

### Create room

The host selects 1v1 or 2v2, compatible formats/preset, language pack, era preferences and difficulty. The backend creates a cryptographically random internal room ID and a human-readable expiring code. Code lookup is rate-limited. Host sees the room code, share action, team slots, role order, rule summary and readiness state. Changing gameplay settings clears readiness so every participant accepts the new configuration.

### Join invitation

Universal/App Link or pasted code → resolve valid room without revealing member details to unauthorised callers → authenticate → join transaction checks room status/capacity → pick an available team if permitted → microphone/media check → ready. Full, expired, invalid, removed-user and already-started states have separate explanations. Manual room-code entry is always available. Firebase Dynamic Links is not a dependency.

### Start and play

Only the current host can request start. The server requires the expected member count, both teams, all eligible players ready, valid room version and adequate content. It creates the private manifest, publishes a safe match projection, and arms deadlines. Readiness acknowledgement refers to media asset hashes; a client that cannot preload within the bounded preparation period receives a retry or the match returns to the lobby.

Each round displays a short rule, current team/singer, time, score and available lifelines. Answer titles are hidden until allowed. The active singer is audible to authorised listeners; for R07 only the performer sees the target. Nonperformers cannot publish scored audio. Scorecards update from server events and ledger projections, never optimistic local points.

### Disconnect and rejoin

An offline indication is advisory presence, not proof that a player abandoned the game. Rejoining fetches a fresh authorised snapshot and resumes from its sequence number. The reconnect grace is 30 seconds, granted at most once per interrupted turn. Repeated disconnects in the same turn do not reset or extend that grace. Recovery does not rewind an already scored attempt or disclose a private cue; expiration invokes the recorded transfer, neutral-void or forfeit policy.

If the active player cannot recover, a remaining teammate may take over through a server-issued role transfer. In 1v1, repeated failure ends in an incomplete match or forfeit under the displayed policy. Host departure elects an eligible replacement by stable membership order; host identity grants room-management rights, not ownership of the match process. If no players remain, the server expires the room and cleans up its transient media.

### Results and replay

Results show final team scores, each round's points, accepted song titles after reveal, any voided attempts, and a lightweight participation summary. A match with a party correction is visibly marked unranked and links to its auditable adjustment. Private audio replay is opt-in and time-limited; social sharing defaults to score artwork without a recording. Rematch requires current members' readiness. A result distinguishes completed, drawn, abandoned and forfeited matches.

## 7. Screen inventory

| Screen | Essential states |
|---|---|
| Welcome/profile | guest creation, loading, failure, name validation, consent |
| Home | create, join, practice, recent own results, service notice |
| Room setup | preset, compatible rounds, unavailable content, validation |
| Join | code/link parsing, expired/full/locked, authenticated retry |
| Lobby | team selection, role order, readiness, host migration, settings changed |
| Mic check | prompt, denied/permanent denial, capture, playback, route interruption |
| Match stage | briefing, buffering, scheduled cue, active turn, listening, judging, paused |
| Round-specific surface | sound/word cue, audio cue, masked target, video/still, reveal |
| Adjudication | accepted, rejected, uncertain/retry, steal, review, correction |
| Results | winner/draw/incomplete, round ledger, share, rematch |
| Settings/privacy | language, captions, host voice, retention choice, deletion |
| Operator/editor | draft/review/publish/disable, evidence access, audit history |

All destructive controls require deliberate UI confirmation. Ordinary gameplay actions use immediate acknowledgement and a visible state change. Audio action labels must remain readable with large text and screen readers. Countdown, active role and verdict must not depend on colour or sound alone. Reduced motion disables decorative reveal animation without changing clue timing or points.

## 8. Functional requirements and acceptance anchors

| Requirement | Acceptance anchor |
|---|---|
| FR-AUTH-01 | Guest obtains a stable UID and can rejoin the same authorised room after restart. |
| FR-ROOM-01 | Simultaneous last-slot joins cannot exceed four players. |
| FR-ROOM-02 | Nonmembers cannot read a room's private members, target, future clues or answers. |
| FR-LOBBY-01 | Any gameplay setting change invalidates stale readiness and stale start requests. |
| FR-MATCH-01 | The same idempotency key cannot create two matches or two scoring entries. |
| FR-MATCH-02 | Reconnect reconstructs score and current phase from authoritative durable state. |
| FR-ROUND-01 | Every enabled R01–R10 has a playable success path and documented no-content/error path. |
| FR-ROUND-02 | R07 is unavailable in 1v1 and its target is restricted to the active performer. |
| FR-AUDIO-01 | Only the current actor can publish audio; transport does not accept a forged actor identity. |
| FR-AUDIO-02 | Backgrounding, Bluetooth changes and incoming calls release capture and produce a recoverable state. |
| FR-AI-01 | Muse secrets never appear in the mobile bundle, logs, task cards or repository. |
| FR-AI-02 | Invalid/late inference cannot award points or overwrite a newer attempt. |
| FR-AI-03 | Judgment references catalogue IDs and accepted sections, with app-derived evidence quality rather than invented ASR confidence. |
| FR-SCORE-01 | Score totals equal the append-only ledger after duplicate delivery and reconnect. |
| FR-CONTENT-01 | Rights-expired or disabled assets cannot be selected for a new match. |
| FR-CONTENT-02 | Asset URLs and metadata do not disclose answers before reveal. |
| FR-PRIVACY-01 | Expired recording retention is enforced independently of a client opening the app. |
| FR-OPS-01 | Operators can disable one round/model route without changing the rules of an already started attempt. |

## 9. AI product requirements

Muse Voice Transcribe supplies speech text; evaluation must establish whether it handles this catalogue's singing well enough. The app recognises catalogue song candidates from normalised text and, where validated, audio evidence. Muse Spark can classify candidate evidence into a strict answer schema. It is not allowed to introduce songs outside the enabled catalogue or to assert exact lyrics without an authorised reference.

Host generation consumes a small safe match snapshot: round name, roles, public score and permitted verdict reason. It never receives future answers merely to create banter. Use approved templates if text generation fails. Do not put web search or open-ended tools into live judgment. Muse output is untrusted input to schema validation and deterministic rules.

For known-answer rounds, compare against the private target and allowed variants. For free-choice rounds, retrieve a bounded candidate set from the enabled pack before classification. A player's supplied title is a useful disambiguation hint but cannot establish that they sang the required phrase. Pure humming recognition is not a hard requirement of R07: the teammate identifies the song. Detection of lyric leakage in humming is advisory until specifically validated; the private-room review policy handles ambiguous cases.

## 10. Targets, evaluation and analytics

These are initial acceptance targets, not measured results:

| Area | Target and measurement |
|---|---|
| Join | p95 join acknowledgement under 2 seconds on the defined pilot network profile, excluding interactive authentication |
| Commands | p95 accepted command acknowledgement under 750 ms in target region with warm services |
| Live voice | p95 mouth-to-ear under 500 ms in the defined four-player pilot; record test route and device |
| Judgment | p95 final result within 4 seconds after capture ends for ordinary attempts; maximum 8 seconds before neutral uncertain fallback |
| Reliability | At least 95% of eligible started pilot matches complete without an unrecovered system error |
| Automated verdicts | Accepted-answer precision at least 98% on the held-out pilot evaluation set, reported with sample count and uncertainty |
| Coverage | Automated decision coverage at least 80%; coverage must not be raised by accepting uncertain answers |
| Inclusiveness | Report precision, rejection and uncertainty by accent, device class, singing ability and noise cohort; no hidden aggregate-only release decision |
| Stability | No known P0/P1 authentication, privacy, answer-leak or duplicate-score defect |

Event names should cover onboarding_completed, room_created, room_joined, readiness_failed, match_started, round_started, attempt_started, attempt_submitted, judgment_completed, uncertainty_retry, score_corrected, reconnect_started, reconnect_succeeded, match_completed and rematch_started. Include schema version, opaque identifiers, round ID, model route/version, durations and reason codes. Exclude raw lyrics, audio, names, auth tokens and private target text from general analytics.

Business signals for the pilot are time-to-first-match, invited-player join completion, match completion, uncertainty rate, rematch rate, fraction of players contributing an attempt, and post-match fairness feedback. Retention targets should be set after the first measured cohort instead of invented baseline percentages.

## 11. Content, privacy and operations

The development pack contains original/permitted fixtures, including deliberately similar titles, alternate sections and silence/noise files. It is visibly labelled as a fixture pack. A public Bollywood pack requires documented rights for each distributed recording, lyric reference, video and image use. A familiar song being available online is not sufficient evidence for catalogue publication.

Live recordings are temporary by default. The initial proposal is deletion within 24 hours of match end, shorter where processing permits; optional support/evaluation retention requires explicit consent and a separate expiration. User-visible account deletion starts an auditable deletion workflow. Standard Muse model variants are the default; do not silently switch to Contributor variants. Verify provider retention settings and regional availability before sending production data.

An operator can suspend new matches, disable a bad content pack, lower model concurrency, or switch to template hosting. Every override is logged with actor, reason and prior/new configuration. Operational secrets and licensed source media remain outside this public repository.

## 12. Delivery and external dependencies

The repository contains a large decomposed backlog, but task count is not a throughput forecast. One OpenCode worker taking five tasks every 30 minutes can start at most 240 tasks in 24 hours before accounting for failed verification, reviews, dependencies and integration. A one-day internal demo is a stretch target for a prioritised vertical slice; all-ten-round production readiness is governed by evidence, not a date.

Required external inputs are: Firebase/GCP projects and billing, Meta Model API access and limits, app signing identifiers and certificates, appropriate test devices, permitted pilot content, participant consent and a tested operational owner. Tasks that need these must declare the dependency explicitly and may use fakes only where the task card authorises them.

Implementation ownership follows the task manifest: backend slices under `services/game-api/src/features/<component>/`, Flutter slices under `apps/mobile/lib/features/<component>/`, and operational tooling under `tools/ops/<component>/`. Internal editor/operator routes remain in the mobile Flutter codebase for the MVP, protected by explicit server roles; a separate admin application is a later extraction. Each worker owns its assigned slice and registration descriptor. The bootstrap/integrator generates shared registries; feature workers must not compete over shared import or route files.

Completion means: required implementation is merged, the ten compatible round paths are demonstrated in 2v2, cross-device flows pass, model evaluation meets gates or a clearly labelled private-pilot mode using both-captain correction is selected, content rights and privacy gates pass, and release evidence is retained. A manual private pilot does not establish readiness of automated public judging. Generating this PRD or completing task cards alone does not meet that definition. The first-day-priority task list is an execution order, not a claim that 240 task starts are sufficient to deliver a production-ready MVP.

## 13. Source notes

Product rules, timing defaults and targets above are design decisions. Provider capability facts are grounded in the official [Meta models catalogue](https://dev.meta.ai/docs/models), [speech-to-text guide](https://dev.meta.ai/docs/speech-to-text), and [video/audio guide](https://dev.meta.ai/docs/video-understanding). Platform separation follows [Flutter's architecture guide](https://docs.flutter.dev/app-architecture/guide). Firebase's [presence solution](https://firebase.google.com/docs/firestore/solutions/presence) informs the distinction between advisory presence and authoritative match state.
