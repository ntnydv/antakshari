# Release gates, verification and one-day execution plan

Status: proposed evidence requirements. Date: 2026-10-27. This document defines what must be demonstrated; none of the gates is marked passed by the existence of the planning documents.

Related: [PRD](PRD.md), [architecture](ARCHITECTURE.md), [stack](TECH_STACK.md), [orchestration designs](orchestration/).

## 1. Three different milestones

| Milestone | What it proves | What it does not prove |
|---|---|---|
| Internal demo | Two/four development devices complete a fixture-backed game using visible mocks or a clearly labelled manual judgment fallback | Production model accuracy, commercial song rights, public scale, app-store readiness |
| Private pilot | Invited participants complete supported formats with real services, permitted content and measured failure handling | Broad public reliability or language coverage beyond the evaluated cohort |
| Public MVP | All required functional, security, content, privacy, model and operational gates pass on release builds | Future languages, ranking, payments or large-scale public matchmaking |

All ten round modules belong to MVP scope. The internal demo may prioritise one full end-to-end slice first, but it must show unfinished formats as unavailable rather than simulating completion. The ten-round marathon requires 2v2 because Hum & Guess needs a teammate.

## 2. Gate inventory and owners

Every gate record has an owner, build/commit, environment, timestamp, evidence links, observed result and explicit pass/fail/block status. A screenshot alone is insufficient evidence for concurrency, privacy or model correctness.

| Gate | Required evidence | Blocking condition |
|---|---|---|
| G00 — External readiness | Firebase/Meta account access, environment identifiers, limits, permitted fixture pack, devices, signing readiness | Missing access is recorded; workers may implement fakes but cannot claim a live integration |
| G01 — Contracts | Validated schemas, shared version, known fixtures, generated representations and ownership map | Conflicting state or payload definitions across components |
| G02 — Foundations | Reproducible clean build, emulator setup, baseline CI and secret scan | Only one machine can run the project or secrets are committed |
| G03 — Identity/access | Auth/rules tests for member, nonmember, removed user, expired token and operator | Any unauthorised answer/media/state access |
| G04 — Lobby/multiplayer | Concurrent join/start tests and real multi-device setup | Oversized teams, stale readiness starts or host loss kills the match |
| G05 — Core engine | Deterministic transitions, ledger reconciliation, idempotency and stale deadline tests | Duplicate points, indefinite turns, wrong actor acceptance |
| G06 — Media | Android/iOS physical-device PCM, playback, interruption, cross-instance and recovery evidence | Silent/corrupt capture, leaked private target or unbounded buffering |
| G07 — Muse integration | Live request fixtures, supported model IDs, failure mapping, budget limits, no client secret | Unsupported capability assumed or live provider data unverified |
| G08 — Singing evaluation | Held-out corpus report, precision/coverage, subgroup results, calibration and fallback evidence | Accuracy target fails or silent provider failures score as wrong answers |
| G09 — Ten rounds | Success/error/privacy/compatibility journeys for every R01–R10 | A listed enabled round is a placeholder or bypasses the common engine |
| G10 — Content | Asset provenance, permissions, boundaries, accepted variants, expiry checks and review history | Unpermitted media, accidental answer leakage or insufficient clue supply |
| G11 — Privacy | Consent version, scoped evidence access, deletion and retention reconciliation | Recordings persist beyond promised retention or appear in analytics |
| G12 — Reliability/capacity | Repeatable load/network/restart run against the stated pilot capacity | Unbounded retry/cost, unrecovered state divergence or unmet target without scope adjustment |
| G13 — Accessibility/UX | Large text, screen reader, colour/sound alternatives, denied permission and recovery journeys | Critical task cannot be completed with supported accessibility settings |
| G14 — Operations | Alerts, runbooks, rollback, feature kill switch, support trace and on-call owner | No practical response to broken content/model/relay |
| G15 — Distribution | Signed Android/iOS release builds, store declarations, environment sanity and production smoke | Debug endpoints, debug attestation or unapproved content in production |

G03/G05/G10/G11 defects that expose data, corrupt scores or distribute unsupported content block public release regardless of a successful demo. A gate waiver is a documented scope reduction, not a declaration that the failed behavior works.

## 3. Required gameplay scenarios

For every round, collect one accepted answer, one clearly incorrect answer, one uncertain/unsupported answer, one timeout, one stale/duplicate submission and one disconnect/recovery run. These are scenario families, not permission to create duplicate test files that merely repeat the implementation.

Round-specific cases:

| Round | Distinct required cases |
|---|---|
| R01 | Script/transliteration aliases; final-sound extraction; repeated canonical song with a different recording; unsupported starting sound; no valid remaining clue/answer policy |
| R02 | Correct title and wrong sung phrase scored separately; buzzer contention; cue starts synchronously after preload; failed audio cannot count as wrong guess |
| R03 | Correct song but wrong refrain; alternate accepted refrain; cue from remade recording; no accidental title in cue URL |
| R04 | Any accepted verse in normal mode; specified verse in hard mode; repeated refrain rejected as wrong section; variant boundaries preserved |
| R05 | Correct successor after an annotated phrase; skipping ahead; long silence; alternate version ordering; no lyric text in public snapshot |
| R06 | Keyword actually present in submitted phrase; allowed inflection; word occurs elsewhere in song but not in answer; reused song; lexical ambiguity |
| R07 | Target visible only to performer; teammate-only guess; 1v1 incompatibility; humming audio audible to eligible listeners; lyric-leakage uncertainty; removed performer loses access |
| R08 | Neither/one/both correct; order-aware and order-independent configuration; duplicate song entered in both slots; partial credit cap; fragment boundary metadata |
| R09 | Video has no playable audio track; subtitles/title leakage review; buffering timeout; background resume; answer identity tied to exact video version |
| R10 | Each reveal stage; score cap after reveal/hint; ambiguous-image accepted set; accessible nonvisual compatible alternative; cache does not reveal future assets |

Cross-round tests cover two equal assigned attempts per team by default, the final team round ceiling of 40 and floor of −10, lifeline ownership, one permitted steal, reveal timing, no double result after rematch, and a result published after an attempt was cancelled. Party corrections require both captains to approve the same proposal; verify that one approval is insufficient, duplicate approvals cannot add points twice, and the resulting match is visibly unranked with an append-only audit trail.

## 4. Model evaluation protocol

### Dataset

Create a consented/permitted corpus with a minimum starting target of 600 held-out attempts. The exact number may increase after error analysis. Include valid known-song phrases, valid free-choice answers, wrong songs, wrong sections, partial phrases, silence, background clue leakage and ambiguous variants. Target at least 200 automatically accepted held-out examples before making a precision claim. Split by singer and recording session; use an additional song-separated analysis for retrieval generalisation where feasible.

Use real capture from representative low/mid/high device classes and Android/iOS. Include Hindi, English song titles and Hinglish code-switching, multiple accents, quieter/louder voices, casual singing, tempo/key changes, room noise and compressed network conditions. Evaluation audio is not automatically authorised for future training. Preserve consent/provenance separately from model inputs.

Two human reviewers label song identity, section correctness, round eligibility and whether an ordinary listener can decide. Resolve disagreements before final scoring. The label set includes uncertain; forcing every ambiguous recording into correct/incorrect would give misleading evaluation targets.

### Measurements

- Accepted-answer precision: human-correct automated accepts divided by all automated accepts.
- Automated coverage: accepted + rejected terminal decisions divided by eligible attempts; report invalid transport separately.
- False reject rate for human-correct attempts.
- Uncertain/retry rate, disagreement rate and correction rate.
- Capture-end to verdict latency, with p50/p95 and timeout fraction: target 4 seconds and maximum 8 seconds before neutral uncertain fallback.
- Cost per processed attempt and completed match, by route.
- Subgroup counts and performance for each material accent/device/noise/singing cohort.

Initial targets are at least 98% observed accepted-answer precision and at least 80% automated coverage, with sample sizes and 95% confidence intervals reported. These are proposed launch targets, not measured model capabilities. Do not tune thresholds on the held-out set; use a separate calibration split. A small subgroup cannot be declared solved from an aggregate pass.

### Required ablations and failure tests

Compare transcript-plus-catalogue baseline with the constrained Spark classification route. Enable Spark 1.2 audio fallback only if the extra route improves held-out results enough to justify latency and cost. Spark 1.3 audio remains disabled until its documented limitation changes and the route is independently re-evaluated.

Test empty/malformed output, wrong catalogue IDs, plausible but unreferenced lyrics, adversarial instructions spoken or inserted in transcripts, provider 429/5xx, network stall, late response, duplicate callback, invalid audio and missing final transcript. Every such path must converge to a bounded retry/uncertain/cancel outcome with no duplicate score.

The product does not claim voice-quality grading, sound-event recognition, emotion detection, calibrated ASR confidence or word-level alignment unless an independently implemented and evaluated component supplies it. A mock model is acceptable for local functional testing but cannot satisfy G07/G08.

## 5. Concurrency and failure verification

The following tests are required because ordinary single-device tests cannot establish correctness:

1. Two users join the final room slot simultaneously; exactly one obtains membership.
2. Start races with leave/settings change; either a valid snapshot starts or the request is rejected.
3. In optional party buzzer mode, two eligible claims arrive within the persisted 100 ms contender cutoff; stored rotating team priority selects one winner. Claims after the cutoff are excluded, duplicate claims are idempotent, and a restart cannot reset the window or change its priority.
4. Same command is replayed with same/different payload; same returns original result, different rejects conflict.
5. Provider effect retries after a worker restart; one score entry exists.
6. Old deadline task arrives after a new attempt; it cannot close the new attempt.
7. User leaves/removal occurs during capture; media permissions and scoring eligibility are revoked according to the sealed-attempt policy. An accidental disconnect receives at most one 30-second grace per interrupted turn; repeated disconnection cannot reset that deadline.
8. Relay publisher and listeners connect to different Cloud Run instances; room audio still arrives through the bus.
9. Redis/relay restarts during audio; the UI recovers or voids the attempt, with no local alternate score.
10. Firestore temporarily fails after audio upload; the sealed upload is reconciled or expired without an orphan forever.
11. Model quota is exhausted or judgment stalls; neutral fallback occurs by 8 seconds after capture ends, no score penalty is applied for missing inference, and no retry storm occurs.
12. Match completion races with rematch; the new match has separate IDs, manifests and receipts.

Use controlled clocks in deterministic tests and actual delayed deliveries in staging. Test both the emulator rules and deployed service identities; the emulator alone cannot prove real IAM, attestation or network behavior.

## 6. Physical-device and accessibility matrix

At minimum, run the end-to-end flow on two Android devices, two iOS devices where available, and a mixed four-device room. If the iOS cohort is unavailable, label the pilot Android-only and block iOS release rather than inferring support from compilation.

Network runs include stable Wi-Fi, mobile data, 150–300 ms added round-trip delay, intermittent packet loss, temporary offline, background/foreground and app process restart. Audio runs include built-in mic/speaker, wired headset where supported, Bluetooth route change and incoming call interruption. Record actual measured conditions; labels such as “bad network” alone are not evidence.

Accessibility runs include large text, TalkBack/VoiceOver, reduced motion, muted device, high contrast, microphone denied and screen orientation/size changes. The available feature set may explain that a singing round needs a microphone, but joining, settings and compatible non-singing flows must remain navigable.

## 7. Security/content/privacy review

Use test accounts to attempt direct reads of private manifests, future clue IDs, performer targets, another user's uploads and operator evidence. Attempt direct client writes to points, room capacity, host identity, ready version and attempt verdict. Ensure service-side checks remain present where Admin SDK bypasses client rules.

Review public repository/build artifacts for secrets and private/licensed media. Production media access uses scoped credentials; no permanent public token for answer recordings. Review model prompts for unnecessary personal data and Contributor model IDs. A provider's general documentation is not proof of the project's selected retention configuration.

Exercise recording expiration, account deletion and support-consent withdrawal. Deletion evidence must include storage objects, private transcripts, derived evaluation copies where applicable, analytics identifiers according to policy, and outstanding background jobs. A failed cleanup must alert and retry; it must not merely remove a UI entry.

For every published cue, an editor verifies rights/provenance, audio/video/image boundaries, accepted answers, language, difficulty, uniqueness and accidental answer leakage. A signed-off rights manifest is a release artifact. Development fixtures must never be silently switched to a real-song catalogue without review.

## 8. OpenCode throughput and task execution

User-specified cadence: one OpenCode worker picks up at most five tasks every 30 minutes. The theoretical ceiling is 48 batches × 5 = 240 task starts per day. With a 2,000-plus backlog, a single day cannot cover the whole plan; reviews, retries and dependencies reduce effective throughput further.

A task is dispatchable only when its prerequisite completion is verified on the shared integration base, its external requirements are met, its write paths are free, and its acceptance command is available. Five tasks in a batch need not belong to five components, but they must not compete for the same file or registry. A test task can run independently once the implementation and required fixtures are available; it must not claim production capability simply by testing a fake.

The task ownership map assigns backend slices under `services/game-api/src/features/<component>/`, Flutter slices under `apps/mobile/lib/features/<component>/`, and operations under `tools/ops/<component>/`, with corresponding task-owned test paths. Canonical schemas are in `packages/contracts/schema/`. Each task contributes a separate registration descriptor; the bootstrap/integrator generates common registries. A worker must not bypass these boundaries by editing shared imports, introducing a parallel service package, or adding a second admin app.

Each worker handoff contains task ID, base commit, output commit/PR, changed files, acceptance commands and results, evidence paths, discovered blockers, remaining risks and a short integration note. “Done” means accepted evidence and integrated output. A proposed branch without checks is “review pending.” Automatic completion based solely on a self-authored status string is prohibited.

The orchestrator resolves contract decisions, integration conflicts and blocked external inputs. It does not rewrite completed task evidence to hide failures. Failed tasks return with a concrete next action; indefinitely re-running an unchanged blocker is not progress.

## 9. Suggested first-day sequence

The timeline is an ordering proposal, not a completion promise. The orchestrator dispatches only the currently ready subset within the five-task capacity. A published first-day-priority list does not claim that 240 starts can finish, verify and integrate the full production MVP. The actual demonstrable scope is determined by merged work and gate evidence at the end of the day.

| Window | Focus | Exit evidence |
|---|---|---|
| Hours 0–2 | Contract/build foundations, fixtures, repository tooling, component ownership | Clean app/service build and validated shared contracts |
| Hours 2–5 | Guest identity, room/lobby, authoritative engine and score ledger | Two clients complete one deterministic fixture round |
| Hours 5–8 | Physical-device audio, relay/bus, sealed attempts and fake/live Muse adapter | Audible turn plus bounded final evidence across devices |
| Hours 8–14 | Parallel round modules and safe clue projections | Ten round modules exercise their primary paths on fixtures |
| Hours 14–18 | Cross-round integration, reconnect, roles, results/rematch | One complete four-player ten-round fixture match |
| Hours 18–22 | Failure/security tests, accessibility corrections, model sample run | Critical defects repaired; unresolved gates explicitly listed |
| Hours 22–24 | Signed internal build, operator handoff and demo evidence | Honest demo/pilot status with measured results and next batch |

Content licensing, model-account access, app signing and sufficient evaluation participation may have lead times unrelated to coding-agent capacity. Start those dependency checks immediately. If they are unavailable, produce a reproducible internal fixture demo and mark live/public gates blocked.

## 10. Release evidence package

Store or link a versioned release report containing:

- App/server commit SHAs and build identifiers.
- Environment, region, toolchain/package lock versions and configuration revision.
- Catalogue revision, content/rights manifest and model/prompt route versions.
- Gate table with actual status and artifact links.
- Device/network matrix, latency distributions, crash/error summary and capacity limit.
- Model evaluation counts, cohort breakdown, confidence intervals and failure examples under restricted access.
- Security/rules/deletion checks and operational rollback drill.
- Known limitations, feature flags, support/on-call owner and rollout/rollback decision.

A public repository report should contain redacted summaries and opaque references, not participant audio or licensed source content. Re-run affected gates when the model route, prompt, catalogue semantics, audio adapter, scoring rule or security boundary changes.
