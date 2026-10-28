"""Authored implementation slices. The task generator expands each into four owned work items."""
COMPONENTS = []

def component(code, slug, title, layer, depends, design, intent, invariant, operations, data, rows):
    features=[]
    for line in rows.strip().splitlines():
        key, kind, outcome, adverse = [v.strip() for v in line.split('|')]
        features.append(dict(key=key,kind=kind,outcome=outcome,adverse=adverse))
    assert len(features)==16,(code,len(features))
    COMPONENTS.append(dict(code=code,slug=slug,title=title,layer=layer,depends=depends.split(),design=design,intent=intent,invariant=invariant,operations=operations,data=data,features=features))

component('C01','contracts','Versioned contracts',0,'','docs/design/contracts.md',
 'Generate compatible Dart and TypeScript boundaries from the checked-in schemas; reject invalid wire data before business logic.',
 'schemaVersion is 1; unknown command types fail closed; additive event fields may be ignored. No answer key appears in public projection.',
 'decodeCommand; encodeSnapshot; validateAdjudication; generateBindings',
 'packages/contracts/schema; generated Dart/TS bindings; golden fixtures', '''
command-envelope|S|Validate UUID commandId, matchId, expectedVersion and typed payload before dispatch.|Reject missing commandId without executing handler.
snapshot-decoder|M|Decode authoritative version and phase into immutable Flutter state.|Reject decreasing versions instead of rolling UI backward.
event-union|S|Decode known event discriminators and preserve event sequence.|Ignore additive metadata but reject unknown required discriminator.
error-envelope|S|Map stable error code, retryable flag and retryAfterMs to transport response.|Never expose provider key or raw exception in error details.
timestamp-codec|S|Convert epoch milliseconds without device-local timezone dependence.|Reject nonfinite, negative or fractional protocol times.
identifier-codec|S|Validate room, team, user and attempt identifiers separately.|Reject separators that could become nested document paths.
private-projection|S|Build player-specific projections from private match records.|Opponent cannot observe hum target or expected song IDs.
round-config-union|S|Validate the ten round config variants against their schema.|Reject a video-only config carrying a spoken-answer field.
answer-evidence|S|Validate evidence origin, attemptId, transcript and candidate identifiers.|An invented native ASR confidence field cannot bypass policy.
adjudication-union|S|Decode accepted, rejected, uncertain, invalid_attempt and cancelled with reason codes.|Refusal or missing candidate becomes abstain rather than accept.
event-gap|M|Detect an event sequence gap and request a full snapshot.|A replayed event never produces a duplicate visible score.
unknown-fields|M|Retain forward-compatible display state with additive server fields.|An unsupported schema major version shows upgrade-required.
redaction-codec|S|Remove transcript and media URLs from analytics-safe projections.|Nested free-text fields cannot leak through shallow redaction.
schema-migration|S|Register explicit compatible v1 upgrade transforms for stored records.|Records without a supported migration enter quarantine.
fixture-parity|O|Compare Dart and TypeScript serialization against shared fixtures.|Different integer or Unicode encodings fail the parity check.
contract-manifest|O|Produce a hash manifest for schema and generated binding artifacts.|A stale generated binding fails CI even if source compiles.
''')

component('C02','flutter-shell','Flutter application shell',1,'C01','docs/design/flutter-shell.md',
 'Provide mobile navigation, dependency injection, common stage chrome and accessible view states for independently owned features.',
 'Views render repository state and issue intents; they never calculate competitive scores or own provider credentials.',
 'AppRouter; FeatureRegistry; SessionRepository; StageScaffold',
 'In-memory view models; bounded local preferences; no answer cache', '''
application-bootstrap|M|Start Firebase and dependency providers before showing the home route.|Initialization failure shows retry with no blank screen.
feature-registry|M|Discover generated feature descriptors and mount round renderers by roundId.|Duplicate renderer IDs fail the build rather than override silently.
route-guards|M|Route unauthenticated sessions through guest entry before protected rooms.|A stale invitation preserves its code across sign-in.
stage-scaffold|M|Render cue, score, timer, active singer and primary action in one responsive stage.|320px width and large text never overlap the microphone action.
async-view-state|M|Represent loading, ready, empty and recoverable failure explicitly.|A stale error cannot replace a newer successful response.
connectivity-banner|M|Show offline state while keeping the last authoritative score read-only.|Offline buttons cannot enqueue competitive answers for later.
theme-tokens|M|Implement readable light/dark music-stage tokens and team labels.|Team identity remains distinguishable without color.
navigation-restoration|M|Restore the last eligible room after process recreation.|A finished match routes to results instead of answer capture.
permission-education|M|Explain microphone use before the system permission prompt.|Declining permission keeps join and observer views usable.
screen-reader-stage|M|Announce turn changes and final scores without repeating every timer tick.|Rapid snapshots do not flood accessibility announcements.
reduced-motion|M|Respect reduced motion for score reveals and transitions.|Disabling animation preserves all state changes and controls.
localization-shell|M|Load Hindi and English UI text with locale-aware number formatting.|An absent translation falls back to English rather than a key string.
app-lifecycle|M|Pause capture on background and resync when foreground resumes.|A background recording cannot continue after turn revocation.
global-error-boundary|M|Recover from feature rendering errors with a bounded error state.|Failure telemetry excludes raw song lyrics and user audio.
device-settings|M|Persist captions, haptics and playback-volume preferences locally.|Resetting preferences never signs the player out.
update-required|M|Present incompatible-client guidance before room entry.|An old client cannot bypass a server minimum-version response.
''')

component('C03','identity','Identity and session access',1,'C01','docs/design/identity.md',
 'Use Firebase anonymous sign-in for the first playable private-room pilot, with explicit optional account upgrade.',
 'User identity comes from a verified Firebase token, never a uid in request payload; account deletion revokes access.',
 'ensureGuest; verifySession; upgradeAccount; revokeSession',
 'Firebase Auth users; user-private consent version; session capabilities', '''
guest-session|M|Create or restore one Firebase anonymous identity before joining a room.|Repeated startup does not create multiple guest users.
token-verifier|S|Verify Firebase ID token and derive authenticated uid server-side.|Expired or wrong-project token is rejected before database reads.
app-check-verifier|S|Verify App Check on app commands and relay ticket requests.|Debug tokens are accepted only in emulator configuration.
session-refresh|M|Refresh expired identity once and retry the same idempotent command.|Refresh failure returns to entry without duplicating a command.
anonymous-upgrade|M|Link an optional durable credential to the existing guest identity.|Credential-already-in-use enters explicit recovery without data merge.
sign-out|M|Leave active room and stop audio before clearing the local session.|Network failure still stops local capture immediately.
revoked-session|S|Reject revoked sessions and expire outstanding relay tickets.|A previously issued ticket cannot outlive its session revocation policy.
auth-rate-limit|S|Bound guest command attempts by uid and privacy-preserving abuse key.|Throttled calls return retry timing without user enumeration.
auth-emulator-switch|M|Select emulator endpoints only from development build configuration.|Production builds fail closed on emulator host overrides.
account-merge-policy|S|Reject automatic cross-uid score transfers without an explicit supported flow.|A payload cannot claim another uid's room membership.
consent-version|S|Require the current audio-processing consent version before capture grants.|Missing consent permits browsing but never provider upload.
session-capabilities|S|Issue limited app capabilities for player and content-admin roles.|Client-supplied admin flags cannot elevate privileges.
deletion-request|S|Create an idempotent account-erasure job after recent authentication.|Repeated deletion requests reference one job.
deletion-session-ui|M|Display pending deletion and prevent new match entry.|A failed deletion job remains visible with a support code.
token-redaction|S|Strip authorization headers from request logs and traces.|Nested error causes cannot print bearer tokens.
device-session-list|M|Show only the current account's active session summary and revoke action.|An unauthenticated screen never renders previous-user sessions.
''')

component('C04','profiles','Player profiles and preferences',1,'C03','docs/design/profiles.md',
 'Collect minimal nicknames, avatar presets, language and era preferences used to build a fair shared room pack.',
 'Public profile contains no email or consent detail; preference intersection cannot silently exclude a player.',
 'upsertProfile; getPublicProfile; resolvePackPreferences',
 'profiles/{uid}; userPrivate/{uid}; immutable room preference snapshot', '''
profile-editor|M|Save nickname and preset avatar with visible pending state.|Whitespace-only or overlength nicknames cannot be submitted.
profile-write-policy|S|Allow nickname and avatar fields only for the authenticated owner.|Unknown profile fields are rejected rather than persisted.
public-profile|S|Return nickname and avatar only to authorized room participants.|Email and consent fields never enter the public projection.
language-preference|M|Choose Hindi/English UI and available song-language packs separately.|Selecting an unavailable song pack shows availability rather than silently switching.
era-preference|M|Choose broad catalogue eras without asking for a player's age.|No chosen era means use the published room default.
pack-intersection|S|Compute a nonempty room pack agreed by all participants.|An empty preference intersection blocks start with actionable choices.
nickname-moderation|S|Apply deterministic profanity/length controls and moderation state to public names.|Model timeout cannot publish an unreviewed flagged nickname.
avatar-allowlist|S|Accept only bundled avatar IDs for MVP.|Remote image URLs or file paths are rejected.
profile-snapshot|M|Freeze displayed teammate identity for a running match with explicit refresh policy.|Mid-match nickname edits cannot impersonate another participant.
preference-reset|M|Restore published defaults after explicit reset action.|Reset does not erase historical match results.
profile-conflict|S|Use version preconditions to prevent stale preference writes.|A stale edit returns conflict and the current profile version.
nickname-uniqueness|M|Disambiguate identical room nicknames with team/slot indicators.|Duplicate names remain accessible to screen readers.
recent-pack-choice|M|Remember last selected eligible pack for room creation.|A withdrawn pack is not automatically reselected.
profile-cache-isolation|M|Clear private preferences when the active uid changes.|Another guest cannot see a prior guest's preferences.
profile-deletion|S|Remove profile data and anonymize eligible result projections under retention policy.|Deletion cannot alter aggregate match scores.
preference-analytics|S|Emit consented coarse language/era choice events without free text.|Declined analytics consent results in no preference event.
''')

component('C05','rooms','Private room service',2,'C03 C04','docs/design/rooms.md',
 'Create private 1v1/2v2 rooms with transactional membership, short-lived invitations and an explicit lifecycle.',
 'At most four members; authenticated membership is required for every room read; invite code is not sufficient for answer access.',
 'createRoom; joinRoom; leaveRoom; closeRoom',
 'rooms/{roomId}; roomCodes/{digest}; rooms/{roomId}/members/{uid}', '''
create-room|S|Create room and creator membership atomically with immutable mode.|Retrying the commandId returns the same room rather than a second room.
join-room|S|Atomically enforce capacity and membership uniqueness for a valid invite.|Two concurrent joins for the final slot produce exactly one admission.
room-screen|M|Display create/join progress and authoritative member list.|A rejected join never leaves a phantom local member.
leave-room|S|Remove membership and apply lobby or in-match departure policy.|Duplicate leave is a no-op with the same result.
room-capacity|S|Enforce two slots for 1v1 and four for 2v2.|A fifth participant cannot exploit a stale member count.
room-expiry|S|Expire idle lobbies after the configured 30-minute window.|An expired invite cannot resurrect a closed room.
close-room|S|Allow lobby owner to close before a match starts.|A nonowner close command returns permission-denied.
room-code-resolution|S|Resolve normalized invite codes without exposing membership details to outsiders.|Invalid code requests are rate limited and have generic errors.
room-settings|M|Edit pack, round count and party adjudication policy before readiness.|Changing settings clears readiness for all participants.
room-settings-validation|S|Freeze approved settings and reject unsupported round combinations.|Hum-and-guess is disabled in1v1; the all-ten marathon requires2v2.
room-subscription|M|Subscribe and dispose room streams on navigation.|Leaving a room cancels listeners from the old room.
room-owner-transfer|S|Transfer lobby owner to earliest eligible connected member.|A disconnected former owner cannot reclaim control via a stale command.
room-membership-token|S|Mint scoped relay access only for current room membership.|A token from another room cannot join this room's media bus.
room-abandonment|S|Close a room when all participants leave and schedule cleanup.|Late presence signals cannot reopen a terminal room.
room-summary|S|Provide a compact permitted room view for invitation landing.|Private cue and song manifest fields are absent.
room-creation-quota|S|Limit simultaneous active lobbies per user.|Quota exhaustion returns a list of the user's own resumable rooms only.
''')

component('C06','lobby-teams','Lobby, team selection and readiness',2,'C05','docs/design/lobby-teams.md',
 'Make team membership and device readiness explicit before server-authorized match start.',
 'Teams balance exactly for the selected mode; every present player acknowledges the same settings version.',
 'selectTeam; setReady; nominateSinger; requestStart',
 'members teamId/slot/readyVersion; readiness report; turn rotation schedule', '''
team-selection|S|Assign available team slots transactionally for the selected mode.|Two users selecting one slot cannot both acquire it.
lobby-view|M|Render team slots, mic status, pack and ready controls.|A full team remains visibly unavailable during stale updates.
ready-toggle|S|Record readiness against the current room settings version.|Old-version ready commands cannot satisfy the start barrier.
start-barrier|S|Start only when teams are balanced and all required clients are ready.|Owner start during asset preparation returns not-ready.
mic-check|M|Record a local-only microphone test with clear level feedback.|Denied microphone permission does not falsely report ready-to-sing.
team-swap|S|Swap lobby slots with both affected participants' consent.|Pending swap is cancelled when either user leaves.
singer-rotation|S|Build a deterministic per-team singer rotation at match creation.|The same teammate cannot occupy every slot by resubmitting nomination.
captain-nomination|S|Assign one captain for limited party dispute decisions.|A captain cannot override another team's vote.
ready-reset|M|Explain why readiness resets after a pack or roster change.|A prior ready animation cannot restore server readiness.
device-preflight|M|Check supported playback and capture before advertising media readiness.|Unsupported video codec blocks affected rounds with a clear reason.
preload-progress|M|Display local cue-cache progress without revealing future song names.|Asset failures expose safe identifiers only.
team-labels|M|Provide stable text and icon identifiers for the two teams.|Color blindness mode retains unambiguous team ownership.
late-join-policy|S|Reject new participants once the match roster is frozen.|Invitation retries cannot replace an active player mid-match.
lobby-chat-presets|M|Send only fixed readiness/help reactions during the pilot.|Arbitrary user text is not accepted by the reaction payload.
start-idempotency|S|Reserve one matchId for repeated start commands.|Concurrent starts never create two active matches for a room.
preflight-timeout|S|Return clients to lobby when the readiness barrier expires.|No player loses points for a failed preflight.
''')

component('C07','invitations','Invitations and app links',2,'C05','docs/design/invitations.md',
 'Support room code, QR and HTTPS app links with a browser fallback and explicit code entry after installation.',
 'Firebase Dynamic Links is excluded; no invite grants membership without authenticated join and capacity checks.',
 'createInvite; resolveInvite; revokeInvite; consumeInviteIntent',
 'Hashed invite token; expiresAt; revocation version; local pending invite', '''
invite-creation|S|Issue an expiring room invitation without embedding an answer or credential.|A closed room cannot issue a new invite.
invite-share|M|Share the safe HTTPS URL and room code through the native sheet.|Cancelling the share sheet does not mark anyone as invited.
deep-link-router|M|Parse only the configured HTTPS host and allowed join path.|Malicious redirect or foreign scheme is rejected.
landing-page|O|Build a minimal hosted fallback with copyable code and install links.|No authentication token is stored in the landing page query.
qr-encoding|M|Render the same normalized invitation URL as a QR code.|Oversized or invalid invitation data never reaches the encoder.
manual-code-entry|M|Normalize case and spacing while preserving code validation.|Ambiguous invalid characters show validation before a network call.
pending-invite|M|Persist one bounded invitation intent through authentication.|Expired persisted invite is removed on resume.
invite-revocation|S|Invalidate the room's prior invitation generation atomically.|Old links fail after regeneration even before their expiry time.
android-app-links|O|Define assetlinks association using release signing inputs supplied at deployment.|Placeholder signing fingerprints fail release validation.
ios-universal-links|O|Define association file and entitlement settings for the release bundle.|Development bundle identifiers cannot pass production verification.
invite-rate-limit|S|Throttle invalid invitation resolution attempts.|Errors cannot distinguish an existing full private room from guessed codes.
clipboard-code|M|Copy room code with accessible confirmation and explicit user action.|The app never reads clipboard contents in the background.
invite-preview|M|Show safe room mode and expiry after authenticated resolution.|Unknown inviter identity is not fabricated.
install-return|M|Support explicit code re-entry when installation loses link context.|The UI does not promise automatic deferred deep linking.
invite-telemetry|S|Measure opened and joined counts without recording raw invite tokens.|Revoked tokens cannot be included in event payloads.
invite-cleanup|S|Remove expired invitation lookup records with retention-safe jobs.|Cleanup of one room never revokes another room's token.
''')

component('C08','presence-reconnect','Presence and reconnection',3,'C05 C06','docs/design/presence-reconnect.md',
 'Combine RTDB disconnect signals with application heartbeats and authoritative match resumption.',
 'Presence is advisory; losing RTDB connectivity alone never changes a score. Rejoining uses latest server version.',
 'publishPresence; mirrorPresence; resumeMatch; expireGrace',
 'RTDB connections/{uid}/{connectionId}; Firestore presence projection; reconnect token', '''
presence-client|M|Register connection-specific onDisconnect before publishing online state.|A crash during registration does not leave permanent online presence.
presence-mirror|S|Mirror debounced connection status into authorized room projections.|One device disconnect cannot mark another live device offline.
resume-snapshot|S|Return the latest permitted snapshot and sequence after reconnect.|A resume from another match cannot expose private player state.
reconnect-screen|M|Suspend scoring controls and show retry while preserving team context.|Repeated reconnect attempts cannot replay answer submissions.
grace-window|S|Grant a 30-second reconnect grace once per interrupted turn.|Repeated flapping cannot extend a turn indefinitely.
owner-loss|S|Transfer lobby ownership without changing the match's server authority.|Former owner commands with old version are rejected.
active-singer-loss|S|Stop media grant on singer disconnect and apply interrupted-attempt policy.|Partial capture is never silently scored as a completed answer.
background-resume|M|Request a fresh snapshot after foregrounding rather than trust cached phase.|A timer expired while backgrounded is not restarted locally.
event-resync|M|Replace local state after sequence gaps and clear obsolete effects.|Score-reveal animations do not replay on full resync.
device-replacement|S|Allow one active control connection per player while revoking the old grant.|Two devices cannot submit simultaneous answers for one uid.
heartbeat-expiry|S|Mark transport stalled only after bounded missed heartbeat policy.|Transient packet delay does not immediately forfeit a player.
team-forfeit|S|End a match only after all required team reconnect policies expire.|A stale grace-expiry task cannot end a resumed match.
clock-offset|M|Estimate server offset for display using bounded round-trip samples.|A device clock change does not alter authoritative deadlines.
resume-ticket|S|Issue short-lived room/uid/attempt-scoped reconnect tickets.|Used or expired tickets cannot resurrect revoked capture grants.
network-quality|M|Show connection quality and disable buzzer mode when room policy requires.|Quality indicators never claim exact fairness from latency estimates.
presence-cleanup|S|Remove stale connection records without deleting current-session state.|A delayed onDisconnect write cannot override a newer connection generation.
''')

component('C09','match-engine','Authoritative match engine',3,'C01 C06','docs/design/match-engine.md',
 'Execute a versioned state machine, deterministic round plugins and durable phase transitions.',
 'Only the server advances phase. Firestore transaction bodies perform no network I/O; side effects use an idempotent outbox.',
 'submitCommand; transition; runDueDeadline; processOutbox',
 'matches/{id}; privateMatchState/{id}; commands/{commandId}; events/{seq}; outbox/{id}', '''
command-dispatch|S|Validate membership and route commands through an expectedVersion transaction.|A stale command returns conflict with current version and no mutation.
phase-reducer|S|Implement the documented match phase transitions as a pure reducer.|An answer submitted outside answer_open or recording is rejected.
outbox-worker|S|Persist side effects in the same commit and execute them idempotently afterward.|Worker retries do not create duplicate provider calls or timers.
round-registry|S|Load ten round descriptors through a generated manifest.|Missing or duplicate round IDs fail preflight before a match starts.
match-planner|S|Select six or ten eligible rounds with a seeded reproducible order.|Hum-and-guess is never scheduled in1v1.
deadline-worker|S|Advance expired phases only when phase/version and deadline still match.|A delayed timer for the prior phase becomes a no-op.
answer-grant|S|Issue one active attempt grant for the eligible player and team.|Two simultaneous grants cannot both become active.
buzzer-arbitration|S|Atomically accept the first eligible server-received buzz with a deterministic tie policy.|A retried buzz cannot reorder the original receipt.
cue-preload-barrier|S|Open a cue only after required clients acknowledge playable media.|One failed client causes neutral retry rather than unequal clue time.
phase-snapshot|S|Publish redacted state and player-private projections with one version.|A snapshot cannot mix scores from one version and phase from another.
pause-policy|S|Allow only bounded technical pauses at supported phase boundaries.|A player cannot use repeated pauses to extend answer thinking time.
abort-policy|S|Terminate invalid or empty matches with explicit reason and result policy.|Aborted matches do not grant win rewards.
event-replay|S|Rebuild deterministic score/phase projections from ordered domain events.|Duplicate sequence or missing event fails replay validation.
seed-stability|S|Pin catalogue and rule versions into each match's reproducible seed context.|A mid-match catalogue update cannot change an answer key.
outbox-reconciliation|S|Find committed but unprocessed effects and safely reschedule them.|A reconciliation run cannot repeat a completed effect.
terminal-idempotency|S|Write final match outcome once and reject further competitive commands.|Late ASR completion cannot change a finished match.
''')

component('C10','scoring','Scoring, steals and disputes',4,'C09','docs/design/scoring.md',
 'Convert verified evidence into a deterministic ledger with equal opportunities and explicit private-party dispute handling.',
 'The model never supplies final points. Every ledger entry has a unique source attempt or reversal and a reason code.',
 'scoreAttempt; grantSteal; requestReview; applyReviewResolution',
 'scoreLedger/{entryId}; per-round opportunity counters; review requests', '''
score-ledger|S|Append at most one score event per settled attempt and recompute team totals.|Repeated adjudication callbacks cannot double-award points.
round-score-policy|S|Implement 20 singing points or 10 identification plus10 singing as configured.|Partial recognition cannot accidentally award the full20.
scoreboard-widget|M|Render authoritative team totals and explained point changes.|Optimistic local answer state never changes the competitive score.
steal-window|S|Offer an eligible 10-point steal after a failed answer where the round allows.|Original team cannot steal its own failed attempt.
hint-deduction|S|Apply a five-point hint reduction once before the hint is revealed.|Hint retries do not multiply deductions.
wrong-buzz-penalty|S|Apply minus5 only to a confirmed wrong buzz under the room rule.|Provider uncertainty receives no wrong-answer penalty.
round-cap|S|Enforce published maximum opportunities and score caps symmetrically.|Repeated retries cannot create extra scoring opportunities.
draw-resolution|S|Resolve tied results with the configured neutral shared tiebreak or draw.|Network outage in tiebreak never defaults to one team's win.
dispute-request|M|Let a team request review with a fixed reason within the review window.|Expired review controls remain disabled after reconnect.
party-consensus|S|Apply private-room correction only after both captains agree.|A lone host vote cannot override the opposing team.
ledger-reversal|S|Correct a settled score through an auditable compensating entry.|Original ledger entries are never silently edited.
uncertain-outcome|S|Convert low-evidence answers into neutral retry or void according to policy.|Abstention is never interpreted as a correct answer.
review-expiry|S|Resolve unanswered reviews using the predeclared neutral policy.|A late vote cannot mutate finalized results.
score-explanation|M|Show concise reason codes and point breakdown without raw model reasoning.|Internal prompts and hidden answer keys are never displayed.
opportunity-audit|S|Compare team attempts and caps before publishing final outcome.|An inconsistent opportunity ledger blocks finalization for repair.
score-replay|O|Verify score totals from immutable fixtures and ledger replay.|Tampered running totals fail the audit even if UI looks correct.
''')

component('C11','audio-capture','Mobile audio capture',2,'C02 C03','docs/design/audio-capture.md',
 'Capture short consented singing attempts with one mobile microphone, explicit controls and predictable PCM framing.',
 '24kHz mono signed16 little-endian; max20 seconds; stop immediately on grant revocation or background. Never record before consent.',
 'prepareMicrophone; startAttempt; emitFrame; stopAttempt',
 'Transient PCM buffer; attempt grant; bounded local retry recording', '''
pcm-recorder|M|Produce 24kHz mono signed16 PCM from the selected mobile input.|Unsupported native format triggers explicit conversion or blocks start.
capture-control|M|Start capture only after the server answer grant and local consent.|A pregrant button press never records audio.
duration-cap|M|Stop at the configured20-second capture limit and finalize once.|Timer and user stop racing cannot finalize twice.
audio-session|M|Coordinate capture and cue playback through one audio-session owner.|An incoming call stops capture and reports interruption.
frame-pacing|M|Emit bounded PCM frames at realtime cadence without queue growth.|A stalled socket does not buffer unbounded private audio.
mic-permission|M|Handle denied and permanently denied permissions with useful recovery UI.|Returning from settings rechecks actual permission before enabling capture.
waveform-meter|M|Display local amplitude for feedback without treating it as song evidence.|Silence cannot masquerade as successful recording.
sample-resampler|M|Resample hardware output into required24kHz PCM deterministically.|Odd byte lengths and unsupported channel counts fail validation.
bluetooth-routing|M|Handle headset route changes while keeping a stable attempt lifecycle.|Disconnecting headphones stops or safely reinitializes the active attempt.
echo-control|M|Pause cue output before competitive capture and recommend headphones.|Reference cue audio is not intentionally fed into the judging stream.
buffer-cleanup|M|Erase transient audio files after upload/expiry according to policy.|A crash recovery run removes abandoned private recordings.
grant-revocation|M|Stop recording immediately when the server revokes the attempt.|Buffered frames after revocation are discarded.
capture-interruption|M|Classify phone call, device lock and OS interruption separately.|Interrupted audio is not automatically submitted as complete.
offline-recording-policy|M|Block new competitive capture when the relay is unavailable.|Cached grants cannot enable offline competitive submissions.
audio-quality|M|Flag clipping and silence locally as advisory quality indicators.|Local quality flags never decide competitive correctness.
capture-accessibility|M|Provide semantic start/stop controls and haptic state feedback.|Screen-reader activation cannot start two recorder instances.
''')

component('C12','audio-relay','Realtime audio relay',3,'C03 C09 C11','docs/design/audio-relay.md',
 'Run an authenticated Cloud Run WebSocket gateway with Redis room fan-out, one active singer and a server-only Muse stream.',
 'Cloud Run affinity is not a correctness mechanism. Room authorization and active attempt are rechecked; never put PCM in Firestore.',
 'issueRelayTicket; authenticateSocket; relayFrame; closeAttempt',
 'Single-use relay tickets; Redis room channels; transient attempt buffers; connection generations', '''
socket-auth|S|Consume a short-lived uid/room/attempt-scoped ticket before accepting binary frames.|Reusing a consumed ticket or wrong-room ticket is rejected.
room-fanout|S|Fan out permitted PCM through Redis channels to members on different instances.|Cross-room subscribers never receive frames.
active-singer-gate|S|Forward frames only from the authoritative active singer and grant generation.|Revoked or simultaneous sender frames are dropped and counted.
asr-stream-bridge|S|Open one Muse PUSH_TO_TALK stream per attempt and close it after endStream.|A completed ASR socket is never reused for the next answer.
relay-backpressure|S|Bound per-connection queued bytes and close persistently slow consumers.|A slow listener cannot stall every player or grow memory without limit.
frame-validation|S|Validate PCM frame size, total duration and permitted sample format.|WAV headers and client-injected sequence prefixes never reach Muse PCM input.
room-permission-refresh|S|Refresh membership and grant permissions when relevant match versions change.|A removed member loses media access promptly.
socket-heartbeat|S|Detect disconnected sockets and clean their subscription state.|A lost pong cannot leave a permanent active-singer reservation.
redis-outage|S|Fail new room media grants clearly during pubsub outage.|Instance-local fallback cannot silently isolate teams in different instances.
reconnect-fencing|S|Fence old connection generations when a player resumes.|Frames from the old socket cannot interleave with the replacement stream.
asr-fallback-file|S|Retry one completed bounded WAV through file ASR when the live stream fails.|The retry uses the same attemptId and cannot duplicate scoring.
room-listener|M|Play permitted incoming PCM with a bounded jitter buffer.|Stale attempt frames are flushed at turn changes.
relay-shutdown|S|Drain connections and publish recoverable interruption before instance shutdown.|Clients do not wait indefinitely for a final transcript from a dead socket.
traffic-limits|S|Enforce room, uid and tenant byte/concurrency quotas.|Exhausted quota triggers neutral game fallback rather than accepted empty audio.
relay-metrics|S|Track bytes, dropped frames, connection age and turnaround without raw audio logs.|Diagnostic modes cannot publish PCM content.
relay-load-probe|O|Exercise cross-instance fanout and bounded memory with four-client rooms.|A passing single-instance test cannot satisfy the cross-instance release gate.
''')

component('C13','media-playback','Cue media playback',2,'C02 C16','docs/design/media-playback.md',
 'Preload authorized opaque cue assets and coordinate audio/video/still playback with the match cue barrier.',
 'No future answer metadata or stable public download URLs; a cue becomes playable only to authorized current-match members.',
 'fetchCueManifest; preloadCue; acknowledgeReady; playAt',
 'Opaque asset IDs; short-lived URLs; bounded local cache; playable acknowledgements', '''
cue-manifest|S|Issue sanitized current-round media manifests with short-lived URLs.|Manifest strips original filenames and answer metadata.
audio-cue-player|M|Preload and play an authorized audio segment through the shared session.|Cue failure reports not-ready before answer time starts.
video-cue-player|M|Play the physically muted video cue in a bounded accessible frame.|A video asset with an audio track fails content preflight.
still-cue-view|M|Render the authorized still without exposing alt text containing the answer.|Missing image presents neutral retry rather than blank guessing time.
cue-preload-cache|M|Cache only authorized assets within a small size/age budget.|Expired or revoked assets are evicted rather than replayed.
playback-clock|M|Use server cue time and measured offset for coordinated start display.|A late download triggers readiness failure instead of skipping the first clue seconds.
cue-replay-policy|S|Grant only the replays allowed by the round and hint policy.|A client cannot request unlimited fresh signed URLs as replays.
asset-integrity|M|Verify declared hash and byte length before readiness acknowledgement.|Corrupt download never reports playable.
audio-focus|M|Duck optional host audio and stop it before clue or answer capture.|Host speech cannot overlap and mask a competitive cue.
background-media|M|Stop cue playback and mark the client unready when the app backgrounds.|Returning foreground cannot resume a now-expired clue locally.
caption-policy|M|Show rule captions while suppressing clue captions that reveal answers.|Accessibility text never contains hidden song titles.
progressive-reveal|M|Reveal still-image regions according to server stage index.|Local clock changes cannot reveal the full image early.
media-error-report|S|Record safe asset fault codes and trigger symmetric round retry.|One team's playback failure cannot grant the other team automatic points.
download-cancellation|M|Cancel and delete partial downloads when a room is left.|Old download completion cannot populate the next room's cache.
media-expiry|S|Reject expired clue grants and regenerate only for eligible active phases.|A finished match cannot access private future clues.
media-device-matrix|O|Record playback support and interruption behavior on Android and iOS devices.|Emulator-only success does not satisfy physical audio/video validation.
''')

component('C14','muse-gateway','Meta Muse gateway',3,'C01 C03','docs/design/muse-gateway.md',
 'Own Meta request construction, credentials, model policies, deadlines, structured responses and metered usage.',
 'Use Standard IDs only. Voice Transcribe has no confidence scores or TTS; Spark1.3 audio is excluded until documented/evaluated.',
 'transcribeAttempt; classifyEvidence; reviewVisual; getUsage',
 'Secret Manager key; model policy; provider requestId; redacted usage ledger', '''
provider-client|S|Construct Meta HTTP clients with fixed allowlisted base URL and server secret.|A request cannot override destination URL or extract the bearer token.
asr-file-adapter|S|Submit supported mono PCM WAV using request/audio multipart to Voice Transcribe.|Unsupported encoding is rejected before a paid request.
asr-realtime-adapter|S|Authenticate Muse websocket in the first JSON handshake with PUSH_TO_TALK.|HTTP-header-only authentication is not treated as a successful connection.
structured-text|S|Call Spark1.3 for bounded JSON evidence interpretation with schema validation.|Malformed JSON or refusal returns abstain rather than free-text parsing.
audio-fallback-policy|S|Permit Spark1.2 audio review only when the feature flag and evaluation gate pass.|Spark1.3 cannot be silently substituted for an audio task.
model-allowlist|S|Resolve task type to a pinned Standard model ID.|Contributor IDs and unsupported model names fail configuration validation.
provider-timeout|S|Apply per-stage deadlines and return explicit timeout outcomes.|A late response cannot settle an already voided attempt.
provider-retry|S|Retry transient failures with bounded jitter and stable attempt correlation.|Repeated429 never creates an unbounded retry loop.
provider-circuit-breaker|S|Stop calls during sustained provider failure and expose neutral fallback status.|Opening the breaker never awards correctness by default.
usage-ledger|S|Record model, token/audio usage, attemptId and estimated cost once.|Retries cannot lose or double-count known billable usage.
budget-reservation|S|Reserve per-room AI budget before dispatch and settle with observed usage.|Concurrent calls cannot overspend a hard configured room limit.
provider-redaction|S|Redact request audio, secrets and lyric bodies from logs.|Provider exception bodies cannot bypass redaction.
prompt-registry|S|Load versioned prompts with content data treated as untrusted input.|Sung or transcribed instructions cannot change scoring policy.
offline-visual-review|S|Use Spark1.3 to flag clue leakage for editor review.|A model approval never overrides the content editor's publication gate.
offline-complex-audit|S|Route optional multi-record audits to Wonder1.0 outside live turns.|Unavailable Wonder disables audit assistance without breaking gameplay.
provider-canary|O|Run opt-in credentialed canaries that report capability and latency without committing secrets.|No-key environments report not-run rather than success.
''')

component('C15','answer-adjudication','Answer adjudication',4,'C14 C16','docs/design/answer-adjudication.md',
 'Fuse bounded transcript evidence, curated aliases and song-section rules into auditable accept/reject/abstain outcomes.',
 'Speech capability does not prove singing accuracy; acceptance uses calibrated evaluation thresholds, never invented ASR confidence.',
 'normalizeTranscript; retrieveCandidates; verifySection; decideAttempt',
 'Song aliases; phonetic forms; section alignments; immutable evidence and decision version', '''
evidence-pipeline|S|Process attempt evidence through quality, normalization, candidates and policy stages.|Missing or failed evidence yields abstain with reason.
known-song-check|S|Match a response to the already-known target song and allowed aliases.|A fluent invented title cannot pass without catalogue identity.
section-verifier|S|Verify requested mukhda, antara or next phrase using accepted section metadata.|Correct song with wrong requested section is rejected explicitly.
transcript-normalizer|S|Normalize Hindi/Latin forms, punctuation and approved pronunciation aliases.|Normalization cannot erase meaningful negation or merge unrelated songs.
candidate-retrieval|S|Retrieve bounded candidates for open-choice rounds from the authorized catalogue.|Zero or ambiguous candidates yield abstain rather than an invented song.
keyword-verifier|S|Require the target word in the actually sung accepted phrase.|A word present elsewhere in the song cannot satisfy the round.
phoneme-start-check|S|Validate canonical starting sound against the displayed chain token.|English spelling suffixes do not replace Hindi sound rules.
lyric-span-alignment|S|Align the submitted phrase to approved section spans without claiming ASR word timestamps.|Partial weak overlaps do not automatically match a full phrase.
evidence-calibration|O|Compute held-out false-accept and abstention rates by device/accent/noise slice.|Training/calibration samples cannot leak into held-out evaluation.
uncertainty-policy|S|Map calibrated uncertainty to one retry or neutral void per published rule.|Uncertainty never incurs a wrong-answer penalty.
variant-resolution|S|Resolve accepted remake, cover and verse variants against a pinned version.|A similarly named different song cannot borrow another variant's lyrics.
duplicate-song-check|S|Check canonical song identity in the current match's used-song set.|Different title spelling cannot bypass repeat restrictions.
adversarial-transcript|S|Treat sung instructions and model-like JSON as inert answer content.|An instruction to award points cannot modify the decision schema.
human-review-evidence|M|Show the permitted recording and concise mismatch reason for party review.|Review UI never reveals future round answers.
adjudication-finalizer|S|Commit decision once against the current attempt generation.|A slow provider response cannot overwrite a human-resolved or expired attempt.
evaluation-report|O|Publish reproducible singing benchmark metrics with sample counts and uncertainty.|A speech-only benchmark cannot certify the singing release gate.
''')

component('C16','song-catalogue','Song catalogue and rights',1,'C01','docs/design/song-catalogue.md',
 'Maintain versioned song identities, accepted sections, opaque clues and publication rights needed by all ten round plugins.',
 'Client catalogue never includes answer keys or licensed lyric bodies before reveal; withdrawn rights block new scheduling.',
 'ingestSong; validateSong; publishPack; selectEligibleCue',
 'songs/private variants; public pack summaries; clue assets; rights records; versioned manifests', '''
song-record|S|Validate canonical song identity, language, aliases and accepted versions.|Duplicate canonical IDs cannot silently replace a published record.
section-records|S|Store explicit mukhda/antara/phrase boundaries for each accepted version.|Missing requested section makes the cue ineligible.
pack-publication|S|Publish an immutable eligible pack only after content and rights validation.|A draft or expired-rights song never enters a match manifest.
cue-selection|S|Select a playable cue by round, language, difficulty and unused-song constraints.|Insufficient eligible cues blocks start with a clear pack issue.
alias-index|S|Build normalized title and transliteration lookup entries tied to canonical IDs.|Colliding aliases remain ambiguous instead of choosing arbitrarily.
starting-sound-index|S|Index approved first/final sound tokens for classic chain rules.|Uncurated phonetic derivation cannot create impossible chain transitions.
word-index|S|Index allowed keyword occurrences by actual phrase span.|A substring inside another word does not create a keyword match.
rights-ledger|S|Track territory, expiry, allowed cue use and source evidence per asset.|Missing rights metadata blocks publication.
private-answer-manifest|S|Store target IDs and lyric spans in server-only records.|Client-readable documents contain no nested private answer fields.
asset-sanitizer|O|Strip filenames, captions, embedded metadata and audio tracks as required by round.|Silent-video output retaining an audio stream fails validation.
difficulty-tags|S|Require editor-reviewed difficulty and familiarity tags for cue balancing.|AI-suggested tags stay draft until approved.
catalogue-versioning|S|Pin a published manifest hash for the lifetime of a match.|Publishing a new version cannot mutate an active game's cues.
withdrawal-policy|S|Block new use of withdrawn content and resolve active-use policy explicitly.|Revoked media is not left publicly accessible through stable tokens.
fixture-catalogue|O|Provide original synthetic media/lyrics and labelled fake song IDs for development.|Fixtures are visibly distinguished from licensed production songs.
coverage-report|O|Measure cue and accepted-section coverage across all ten rounds.|A large song count cannot hide zero eligible silent-video cues.
catalogue-integrity|O|Validate referential links among variants, sections, cues and rights records.|Orphan section or asset IDs fail publication checks.
''')

component('C17','host-presenter','AI host and stage presentation',4,'C02 C09 C14','docs/design/host-presenter.md',
 'Deliver concise Hindi/Hinglish hosting around verified events while keeping the competitive path usable without generation.',
 'Host text cannot mutate game state; fallback lines and device/prerecorded speech are always available. Muse is not a TTS service.',
 'renderHostEvent; getHostLine; playHostLine; cancelHostLine',
 'Versioned line templates; optional Spark text; client speech settings; no celebrity voice clone', '''
host-event-mapping|S|Map known match events to safe host intents with permitted facts only.|Unknown event types use a neutral template without guessed scores.
host-stage-widget|M|Render short host text alongside rules without blocking primary controls.|Long generated text is bounded and accessible without overflowing.
template-fallback|S|Return deterministic Hindi/English host lines when AI is unavailable.|Provider timeout cannot delay answer_open.
host-generation|S|Generate optional Spark1.3 lines from sanitized event facts and bounded style instructions.|Model output cannot announce a score differing from the event.
device-speech|M|Use device speech or bundled recorded lines when available and captions always.|Missing Hindi voice falls back to captions without blocking play.
host-priority|M|Cancel host speech before cue playback or active singing.|Queued congratulations cannot overlap a new clue.
host-length-limit|S|Enforce line length and safe content before publication.|An overlong or off-topic line is replaced by a template.
host-localization|S|Choose user-visible language from the room agreement.|The model cannot change language policy from lyric content.
host-repetition|S|Avoid repeating the same nonessential line within a short match.|No unused variant means use concise silence rather than delaying.
host-mute|M|Let players independently mute host audio while retaining rule captions.|Mute preference does not silence required cue audio.
host-reveal|M|Synchronize reveal text to the authoritative reveal phase.|Premature AI response cannot disclose the answer early.
host-celebration|M|Celebrate team effort without evaluating voice attractiveness or identity.|No performance label is inferred from a user's accent.
host-content-policy|S|Reject harmful or personal generated commentary using approved topic constraints.|User nickname injection cannot change the host instructions.
host-cache|S|Cache safe generic lines keyed by language and event template version.|Player-specific content is not reused in another room.
host-cost-budget|S|Skip optional generation when the host text budget is exhausted.|Budget exhaustion has no scoring or timing effect.
host-device-tests|O|Exercise speech cancellation and captions on both physical mobile platforms.|Emulator-only TTS success does not satisfy the host-audio gate.
''')

component('C18','results-rematch','Results and rematches',4,'C09 C10','docs/design/results-rematch.md',
 'Close the game with a trustworthy score breakdown and a low-friction private rematch.',
 'Results derive from the immutable ledger; an abandoned match is distinct from a win, draw or provisional party result.',
 'finalizeResult; getResult; requestRematch; confirmRematch',
 'matchResults/{id}; round summaries; rematch votes; consented local history', '''
result-projection|S|Build final team totals and per-round breakdown from settled ledger entries.|Unsettled or inconsistent ledger blocks final result publication.
results-screen|M|Show winner/draw/provisional status and per-round points clearly.|A provisional result is never rendered as verified competition.
rematch-vote|S|Collect each participant's intent and create one fresh lobby when eligible.|Duplicate votes cannot create several rematches.
rematch-ui|M|Display who is ready to replay and allow a player to leave.|A departed player is removed from the required vote count by policy.
round-breakdown|M|Explain identification, singing, hint and steal points without raw model reasoning.|Reversed entries do not appear as unexplained total differences.
player-participation|M|Show turns taken and helpful team contributions without pitch ranking.|A disconnected player's absence is not labelled poor singing.
result-access|S|Restrict detailed results to match participants and scoped shared summaries.|A guessed matchId cannot retrieve recordings.
history-list|M|List the current user's bounded recent match summaries.|Changing identity clears the previous user's history view.
rematch-pack|S|Carry forward agreed preferences while rechecking current pack eligibility.|Withdrawn content cannot return through cached rematch settings.
result-share|M|Create an optional score-only share card after user action.|No audio, invite token or private nickname is shared without consent.
abandoned-result|M|Explain technical abandonment without awarding a fabricated winner.|Returning late to an abandoned match cannot reopen gameplay.
result-deduplication|S|Finalize and notify a match result idempotently.|Repeated finalization events do not create duplicate history rows.
history-retention|S|Delete or anonymize result views according to retention settings.|Account deletion cannot remove other players' own permitted results.
review-resolution-view|M|Show accepted review corrections and final score status.|Late obsolete review events cannot overwrite the current result.
result-analytics|S|Emit completed/abandoned outcome metrics without identifying song lyrics.|Analytics opt-out prevents user-level result events.
rematch-concurrency|S|Resolve competing rematch/create requests using one source-match reservation.|Two captains clicking simultaneously produce one new match context.
''')

component('C19','safety-privacy','Safety, privacy and access policies',2,'C03 C01','docs/design/safety-privacy.md',
 'Enforce participant access, minimal recording retention, reporting and consistent handling of personal data.',
 'Private rooms are not public broadcasts; explicit audio processing consent is required, raw attempts are not analytics payloads.',
 'authorizeResource; recordConsent; reportParticipant; eraseData',
 'Consent records; scoped moderation reports; deletion jobs; security rule test fixtures', '''
firestore-rules|O|Deny client mutation of scores, private answers and authoritative match state.|Authenticated outsiders cannot read another room or answer key.
storage-rules|O|Restrict attempt uploads to owner/grant and cue access to approved delivery paths.|Guessing object paths never grants recording access.
consent-screen|M|Explain who hears audio, Meta processing and retention before singing.|Declining consent leaves capture disabled without dark patterns.
retention-cleanup|S|Delete ordinary raw attempts within24hours and clean expired provider files when supported.|Cleanup retries are idempotent and do not delete active media.
report-flow|M|Let a participant report another room member with fixed reasons.|Reports cannot expose prior unrelated room history.
mute-player|M|Allow local muting with explicit consequences for listening rounds.|Muted state is visible so missed cues are understandable.
room-removal|S|Allow supported lobby removal with owner checks and immediate ticket revocation.|Removal cannot be used to alter an active result without the published policy.
privacy-settings|M|Separate optional analytics from required competitive audio consent.|Analytics consent never silently enables sharing recordings.
data-export|S|Prepare an authenticated export of the user's own eligible records.|Export excludes other players' recordings and private provider prompts.
erasure-orchestrator|S|Erase owned personal data across Auth, Firestore and Storage via resumable steps.|Partial deletion remains tracked rather than falsely marked complete.
admin-access|S|Require verified server claims and least-privilege role checks for content/admin actions.|Client-set role or email domain never grants admin access.
security-audit-log|S|Record privileged mutations with actor, reason and request ID without secrets.|Audit logging failure blocks high-risk publication changes.
abuse-rate-controls|S|Apply bounded per-user and room actions for invites, reports and capture attempts.|One user's abuse cannot consume the whole tenant quota.
provider-data-mode|S|Reject Contributor model IDs and document actual provider retention configuration.|Standard no-training policy is not misrepresented as zero retention.
recording-access-log|S|Audit authorized review access to retained attempts.|A review outside membership and retention windows is denied.
security-regression|O|Run rules and API authorization adversarial fixtures across user roles.|A passed happy path cannot mask an outsider-read regression.
''')

component('C20','content-admin','Content operations console',2,'C16 C19','docs/design/content-admin.md',
 'Provide an internal Flutter web or CLI-assisted editor for licensed song metadata, cue QA and reversible pack publication.',
 'Admin roles are server verified. AI suggestions remain draft and cannot publish content or rights claims.',
 'createDraft; editSections; validateAssets; approvePublication',
 'Draft content records; editor approvals; validation reports; publication history', '''
admin-entry|M|Gate the internal content route on verified role and show an unauthorized state.|A hidden route is never considered authorization.
song-editor|M|Edit song identity, aliases and language with version-aware saves.|Conflicting edits require reload or explicit reconciliation.
section-editor|M|Mark mukhda/antara/phrase spans and accepted alternatives for a version.|Out-of-range or overlapping invalid spans fail validation.
publication-command|S|Publish only validated drafts with an editor approval and rights evidence reference.|An AI-only approval or missing rights field cannot publish.
cue-upload|M|Upload draft media to a restricted staging path with clear progress.|Failed upload cannot produce a playable published clue.
rights-editor|M|Record territory, use permission and expiry with supporting evidence link.|A blank rights record remains visibly blocked.
clue-preview|M|Preview exactly the sanitized player-facing cue for each round.|Preview cannot accidentally use original unsanitized media.
validation-dashboard|M|Show publication blockers grouped by round capability and asset.|Warnings cannot be confused with passed required checks.
batch-import|S|Validate row-level metadata imports and return per-record errors.|One malformed row cannot partially publish the whole pack.
alias-review|M|Review ambiguous title and transliteration collisions before publication.|Resolving one alias cannot silently relabel another song.
pack-editor|M|Compose a balanced pack with minimum per-round coverage checks.|An empty round pool blocks the publish action.
withdraw-content|S|Withdraw an asset with reason and immutable audit record.|Withdrawal cannot erase historical proof of prior publication.
ai-suggestion-review|M|Show proposed tags or clue descriptions alongside editable source fields.|Generated text is never auto-saved as approved metadata.
role-separation|S|Distinguish content editor from publication approver for release operations.|An upload-only role cannot approve its own public pack.
publication-diff|M|Display changes from the prior immutable pack before approval.|Hidden answer or rights changes cannot disappear from the diff.
admin-recovery|S|Restore a prior eligible pack version without mutating active matches.|A rollback to expired rights is rejected.
''')

component('C21','telemetry','Observability, analytics and costs',2,'C01 C19','docs/design/telemetry.md',
 'Measure product completion, realtime latency, AI outcomes and spend while keeping user content out of logs.',
 'Metrics are structured and bounded; performance targets remain unmeasured until physical-device and load evidence exists.',
 'emitMetric; recordTrace; settleUsage; evaluateBudget',
 'Redacted structured logs; analytics event registry; cost aggregates; release dashboards', '''
event-registry|S|Validate analytics event names and allowed fields against a versioned registry.|Unknown free-text fields are rejected before logging.
request-correlation|S|Propagate request, match and attempt IDs across server and provider stages.|No bearer token or raw invite token is used as a correlation ID.
crash-reporting|M|Capture sanitized Flutter crashes with build and screen context.|User audio and lyric content are stripped from diagnostic breadcrumbs.
latency-histograms|S|Measure command, audio transport and adjudication stages separately.|Client clock skew cannot create negative authoritative durations.
completion-funnel|S|Measure room-created through match-finished stages with consent rules.|Repeated events do not inflate unique match completion.
ai-outcome-metrics|S|Track accept/reject/abstain/retry and override rates by model/prompt version.|A high accept rate is not labelled accuracy without ground truth.
cost-estimator|S|Estimate ASR/token/media costs from dated configurable rates and actual usage.|Missing usage is marked unknown rather than zero.
budget-alerts|S|Alert on room and tenant spend thresholds with deduplicated incidents.|A noisy alert loop cannot generate unbounded notifications.
provider-health|S|Track429/timeouts and circuit status for each provider operation.|A text endpoint success cannot declare ASR healthy.
relay-health|S|Measure cross-instance fanout latency and dropped frame counts.|Single-instance samples are labelled separately.
dashboard-definitions|O|Version dashboards for completion, latency, AI abstention and spend.|Dashboard queries cannot include private transcript fields.
privacy-audit|O|Scan synthetic telemetry fixtures for prohibited sensitive field names and nested content.|A renamed nested secret field triggers a failed audit fixture.
sampling-policy|S|Apply deterministic sampling to high-volume traces while retaining required errors.|Sampling never drops the only cost ledger entry.
alert-runbooks|O|Attach actionable diagnostics and rollback links to critical alerts.|An alert without a safe recovery action fails runbook review.
load-report|O|Produce measured p50/p95 rates with concurrency, region and device context.|Reports cannot substitute configured targets for observed measurements.
analytics-opt-out|M|Apply analytics preference before emitting optional client events.|Events queued before opt-out are discarded by policy.
''')

component('C22','platform-release','Build, Firebase infrastructure and release',0,'','docs/design/platform-release.md',
 'Make emulator development, isolated environments, CI, controlled deployment and evidence-based release reproducible.',
 'Planning does not provision billing resources. No production deploy until secrets, rights, security and device gates are evidenced.',
 'bootstrap; emulate; verify; deployStaging; rollback',
 'Version locks; infrastructure manifests; CI definitions; release evidence; environment templates', '''
workspace-toolchain|O|Pin Flutter/Dart, Node22, package manager and test tool versions reproducibly.|A missing tool fails with installation guidance rather than a silent skip.
firebase-emulators|O|Start Auth, Firestore, RTDB, Storage and Functions emulators with seed fixtures.|Local tests cannot accidentally point at a production project.
ci-gates|O|Run schema, backend, Flutter and rules checks with explicit required statuses.|Missing tests or ignored failures cannot produce a green gate.
environment-manifests|O|Separate dev/staging/prod project IDs, regions and resource configuration.|A staging command carrying production identifiers fails preflight.
secret-config|O|Wire Secret Manager references without storing secret values in repository files.|A generated environment file containing a key fails validation.
cloudrun-manifest|O|Define relay/worker service resources, timeouts and least-privilege identities.|Default instance affinity is never accepted as shared-room correctness.
redis-manifest|O|Define private Memorystore connectivity for cross-instance media pubsub.|Deployment without reachable private Redis fails readiness checks.
firestore-indexes|O|Declare required indexes and TTL policies with emulator-compatible validation.|An unindexed required query is discovered before release.
tasks-outbox-config|O|Define Cloud Tasks retry, rate and authentication policy for deadline workers.|Unauthenticated timer execution is rejected.
release-build|O|Produce signed-build instructions and artifact provenance for both platforms.|Absent signing credentials reports blocked rather than a fake release artifact.
staging-smoke|O|Run two-device or four-device room and media smoke with captured evidence.|Mocks cannot satisfy the live staging smoke gate.
rollback-plan|O|Define rollback of server version and feature flags without breaking active schema versions.|Incompatible schema rollback is prevented.
dependency-audit|O|Check licenses and known dependency issues with recorded tool versions.|A failed audit fetch is not reported as no issues.
backup-restore|O|Document and exercise restoration of catalogue metadata in a safe environment.|Restore cannot overwrite production records during a drill.
release-checklist|O|Require rights, singing evaluation, security, device and load evidence before pilot release.|Missing model credentials keep live-AI gate explicitly blocked.
operations-handoff|O|Produce environment-specific run commands, owners and incident recovery references.|Undocumented production-only manual steps fail handoff review.
''')

ROUND_SPEC = [
 ('R01','classic-chain','Classic Antakshari','01-classic-chain',
 'Choose an unused song whose canonical opening sound matches the displayed Hindi sound token.',
 'Display the required script/romanized sound and capture one approved opening phrase.',
 'A title spelling ending in a different Latin letter must not alter the canonical sound.',
 'first/final sound index, canonical song IDs, accepted opening phrases',
 'Steals are disabled because the next team already receives the next primary turn.',
 'Repeated songs are rejected using canonical identity, including remake aliases.'),
 ('R02','dhun-pehchano','Dhun Pehchano','02-dhun-pehchano',
 'Play the curated instrumental intro, then accept song identification and a sung opening separately.',
 'Render intro playback, answer-title input and the optional singing-bonus step.',
 'Naming the correct film alone is not a correct song identification.',
 'instrumental intro interval, canonical target, accepted title aliases and mukhda spans',
 'A wrong primary answer permits one opponent identification steal worth10.',
 'A cue cannot reuse a canonical song already answered in this match.'),
 ('R03','antara-to-mukhda','Antara Se Mukhda','03-antara-to-mukhda',
 'Play an accepted antara cue and require the matching song opening/refrain.',
 'Render verse cue and capture the requested mukhda without showing the title.',
 'Repeating the heard antara is not a successful mukhda answer.',
 'antara cue boundaries, target song variant and accepted mukhda spans',
 'One opponent steal must also supply a valid mukhda and awards10.',
 'Variant compatibility must tie the heard verse and accepted refrain together.'),
 ('R04','mukhda-to-antara','Mukhda Se Antara','04-mukhda-to-antara',
 'Play the opening/refrain and accept an eligible antara from that pinned song version.',
 'Show whether any or a specified antara is required and capture the response.',
 'Repeating the mukhda cannot satisfy an antara request.',
 'mukhda cue, indexed antaras and accepted version relationships',
 'One opponent steal requires the same requested verse constraint and awards10.',
 'A valid alternate verse counts only when allowed by the frozen round config.'),
 ('R05','agla-bol','Agla Bol','05-agla-bol',
 'Stop the licensed cue at an annotated phrase boundary and require the next accepted phrase.',
 'Render the stopped cue state and short continuation response window.',
 'A later correct phrase from the song cannot substitute for the immediate next phrase.',
 'phrase adjacency graph, stop boundary and accepted next-phrase alternatives',
 'One opponent continuation steal awards10 after primary failure.',
 'The phrase-adjacency relationship is evaluated in the selected recording version.'),
 ('R06','shabd-se-geet','Shabd Se Geet','06-shabd-se-geet',
 'Display a curated word and accept a sung phrase containing that exact approved lexical form.',
 'Render the word in both scripts and keep used-song reminders separate from hints.',
 'The word elsewhere in the song does not count when the player sings a different phrase.',
 'word/phrase occurrence index, token forms and canonical song identity',
 'Steals are disabled for alternating word-duel primary turns.',
 'Used canonical songs cannot be reused through alternate titles or remakes.'),
 ('R07','hum-and-guess','Hum & Guess','07-hum-and-guess',
 'Give only the designated hummer a target; let the teammate identify it after bounded humming.',
 'Render separate private hummer and public guesser states without answer leakage.',
 'The guesser must never receive the target card, even on reconnect or route restoration.',
 'private song card, performer/guesser roles and accepted title alternatives',
 'Opponent steal opens only after the answering team fails and its prompt is closed.',
 'Only2v2 is eligible; do not silently use an AI teammate or prerecorded alternative.'),
 ('R08','two-song-fragments','Do Gaane Ek Clue','08-two-song-fragments',
 'Play two approved sequential song fragments and score the two component answers independently.',
 'Render two identification slots with independent submission progress.',
 'Repeating one correct song in both slots cannot earn credit for the second song.',
 'two distinct targets, clip order, source variants and accepted opening spans',
 'A steal awards5 per still-unanswered song, up to10.',
 'Each song slot allows10 identification points; no singing bonus; total primary cap20.'),
 ('R09','silent-video','Silent Video','09-silent-video',
 'Play a curated video with physically removed audio/subtitles and ask for the associated song.',
 'Render muted video, title identification and optional sung opening bonus.',
 'Player volume settings cannot make an accidentally retained audio track acceptable.',
 'sanitized video asset, approved scene interval, target aliases and opening spans',
 'One opponent identification steal awards10 after primary failure.',
 'Source filename, captions, poster and metadata cannot reveal the target prematurely.'),
 ('R10','picture-clue','Tasveer Se Geet','10-picture-clue',
 'Serve approved still-image reveal stages and ask for the linked song.',
 'Render only the current precomputed masked derivative with accessible rule text.',
 'Delivering the full image and hiding it client-side is forbidden for unrevealed stages.',
 'masked derivatives, stage schedule, target aliases and accepted opening spans',
 'One opponent identification steal awards10 after primary failure.',
 'Image alt text and embedded metadata must not reveal the answer before reveal.')
]

for code,slug,title,doc,plugin,renderer,edge,data,steal,repeat in ROUND_SPEC:
    component(code,slug,title,5,'C09 C10 C13 C15 C16',f'docs/rounds/{doc}.md',
      plugin,'Compose the common engine and scoring ports; never add another round-specific match state machine.',
      'prepare; projectCue; getPrivateView; evaluateEvidence; reveal; summarize', data, f'''
plugin|S|{plugin}|{edge}
renderer|M|{renderer}|Stale phase controls cannot submit answers after the server advances.
cue-projection|S|Build the permitted clue payload using only the round-specific catalogue fields.|A projected cue cannot include hidden target IDs or future-answer text.
answer-policy|S|Apply the exact answer and section constraints from this round design.|{edge}
timer-policy|S|Bind this round's cue, answer-start and capture durations into common engine deadlines.|An old round deadline cannot expire the next round's attempt.
actor-rotation|S|Resolve the designated team and performer from the shared opportunity schedule.|An ineligible teammate cannot submit on behalf of the active singer.
hint-policy|S|Provide only the approved metadata hint with one five-point reduction.|The hint must not contain the target title or requested phrase.
steal-policy|S|{steal}|A stale or original-team steal request is rejected.
repeat-and-variant|S|{repeat}|Alias or version ambiguity must never produce arbitrary acceptance.
uncertain-judge|S|Map missing or contradictory round evidence into the shared neutral retry policy.|Provider failure cannot award points or incur a wrong-answer penalty.
resume-renderer|M|Restore this round's current role, cue stage and controls from the latest projection.|Reconnect cannot replay a closed cue or disclose a private role card.
projection-privacy|S|Apply viewer-role access to clue, provisional transcript and reveal data.|An opponent cannot read primary-answer evidence while a steal remains possible.
content-eligibility|S|Require every round-specific asset and annotation before scheduling this format.|A pack missing {data.split(',')[0]} cannot silently fall back to an unrelated round.
result-summary|M|Explain this round's earned points, deductions and final accepted answer after reveal.|The summary cannot expose any future round's target.
content-linter|O|Validate this round's authored assets and answer annotations against its publication rules.|Malformed or leaking clue fixtures are quarantined with exact reason codes.
scenario-driver|O|Run the round's full two-team scenario with one correct, one invalid and one interrupted response.|A fixture-only run must identify itself and cannot certify live model accuracy.
''')

assert len(COMPONENTS)==32
assert sum(len(c['features']) for c in COMPONENTS)==512
