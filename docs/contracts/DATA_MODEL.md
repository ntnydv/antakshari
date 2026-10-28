# Data model and access matrix

All names below are application design choices. The server validates these records even when using Admin SDK, which bypasses client security rules. Keep private fields in separate documents; Firestore read rules do not provide field-level redaction.

| Path | Fields and invariant | Client access |
| --- | --- | --- |
| profiles/{uid} | displayName, presetAvatarId, publicVersion | Current room's minimal profile projection only |
| userPrivate/{uid} | locale, eras, consentVersion, analyticsConsent, deletionState | Owner reads; validated limited writes |
| rooms/{roomId} | mode, ownerUid, status, settingsVersion, packId, activeMatchId, expiryMs | Members read; server writes |
| rooms/{roomId}/members/{uid} | teamId, seat, joinedAtMs, readyVersion, micReady | Members read safe fields; server writes |
| inviteLookups/{digest} | roomId, generation, expiresAtMs | Server only |
| matches/{matchId} | safe current snapshot, roster membership identifiers | Participants read; server writes |
| privateMatches/{matchId} | immutable cue order, target IDs, seed, accepted sections, rule/catalogue versions | Server only |
| privateMatches/{matchId}/prompts/{promptId} | answer key, phaseToken, contender cutoff/receipts, opportunity | Server only |
| matches/{matchId}/events/{seq} | immutable safe event payload and version | Participants read |
| privateAttempts/{attemptId} | uid, grant generation, media digest, capture status, decision reference, retention expiry | Server only |
| privateEvidence/{evidenceId} | final transcript, model/prompt version, known candidates, actual provider usage, reason codes | Server; audited review endpoint only |
| matches/{matchId}/ledger/{entryId} | requested/applied delta, category, cap adjustment, correctionOf, rulesVersion | Participants read after permitted reveal |
| commandReceipts/{uid-commandId} | canonical request hash, status, result, expiry | Server only |
| outbox/{effectId} | owner, action, payload digest, attempt count, lease, terminal state | Workers only |
| inferenceJobs/{jobId} | attempt/stage/policy key, provider correlation, usage, timeout | Workers only |
| songs/{songId}/versions/{versionId} | aliases, language, accepted sections/spans, rights references | Server/content editor only |
| packs/{packVersion} | immutable eligible cue IDs, publication hash, rights check | Server; safe summary separately |
| publicPackSummaries/{packId} | title, languages, available rounds, approximate size | Authenticated read |
| reports/{reportId} | reporter, subject, room, enumerated reason, review status | Reporter status only; moderator details |
| erasureJobs/{uid-jobId} | resumable step state, inventories, completion evidence | Owner status only |

## RTDB and Redis

RTDB `connections/{uid}/{connectionId}` holds connection state, generation and last change. onDisconnect is registered before online publication. Owner writes only their connection record; server mirrors a debounced projection for authorized rooms. RTDB connectivity does not prove Firestore/relay connectivity.

Redis channels are `room:{opaqueRoomId}:attempt:{opaqueAttemptId}:generation:{n}`. Publication and subscription require server checks; channel secrecy alone is not authorization. Pub/Sub carries transient PCM and floor-change signals, never the only copy of competitive state. Shared counters/leases include generation fencing and bounded expiry. Redis loss stops new live-media grants and invokes neutral recovery.

## Storage

Separate prefixes/buckets for `editor-source/`, `published-cues/`, `attempts/` and `evidence-export/`. IDs are opaque. Validate declared MIME type by inspecting the file, not trusting the extension. Attempt uploads bind UID, attemptId, maximum bytes and duration. Published silent-video derivatives have no audio/subtitle stream; image stages are distinct masked derivatives. The original full image is not downloaded before the reveal schedule permits it.

Use signed URLs only where server authorization already establishes scope. Short expiry reduces replay but is not revocation by itself; use a gateway when immediate withdrawal is required. Ordinary raw attempts expire within24hours; operator cleanup plus reconciliation enforces the policy rather than assuming asynchronous TTL deletion occurs exactly on time. Never publish test recordings or copyrighted lyrics to the GitHub repository.

## Transaction boundaries

1. Create room + member + invitation reservation atomically.
2. Join reads capacity/current membership and commits one slot.
3. Match transition commits state/version, command receipt, safe event and outbox effect together.
4. Attempt settlement commits immutable verdict and unique ledger entry together.
5. Correction appends a compensating ledger entry and both-captain audit record.

Provider calls and task enqueues occur after commit under outbox identity. A worker death after provider dispatch may cause a second billed call on retry; it must never cause a second score award.

## Query/index plan

Declare only indexes needed by bounded server queries: own recent matches by participant UID/completedAt; active rooms by owner/status; pending outbox by state/nextAttemptMs; inference jobs by state/leaseExpiry; catalogue by pack/language/publication; cleanup by expiry. Store large membership arrays cautiously; max-four-player rooms are bounded. Paginate admin/result queries. The index owner checks emulator/query evidence before merging a new query.

## Version and cleanup policy

Rules/catalogue/prompt/model policy versions are immutable within a match. Write new pack revisions; do not patch an active answer key. Withdrawn rights stop new scheduling and may require replacement/void of an active clue. Account erasure revokes identity and capture access first, then removes personal data in resumable steps while preserving other participants' permitted aggregate outcomes.
