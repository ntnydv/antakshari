# External inputs and decisions before live release

These are implementation/release dependencies, not reasons to block writing code against the approved contracts.

| Input | Needed for | Local substitute | Completion evidence |
| --- | --- | --- | --- |
| Meta project access to selected Standard model IDs | Live ASR/text evidence | Deterministic fake | Dated account-specific smoke, actual response/usage with secrets redacted |
| Meta key in server Secret Manager | Authenticated inference | Fake secret reference | Secret access under correct service identity; no client exposure |
| Firebase/GCP project and billing choice | Staging Functions/Run/Redis/Storage | Emulators/local Redis | Project/region/IAM review and deployment smoke |
| Android/iOS identifiers and signing | Test distribution | Local unsigned/debug builds | Signed artifacts, physical-device install evidence |
| Invite HTTPS host and associations | Universal/App Links | Manual room code | Verified app-site association using real signing identities |
| Licensed song/film media and lyric permissions | Real-world song catalogue | Original synthetic fixtures | Editor-reviewed rights records and per-round coverage |
| Consented singing evaluation corpus | Automatic competitive judging | Synthetic pipeline fixtures | Held-out metric report meeting precision/coverage gates |
| Physical Android and iOS devices | Audio routing/latency checks | Emulator/widget tests | Two/four-device interruption and cross-instance room report |
| OpenCode execution environment | Recurring implementation work | Queue and worker instructions | First task-scoped PR plus valid result artifact |

The planning package does not contain credentials and has not called paid Muse inference. Provider documentation establishes available interfaces, not the user's account entitlements or singing accuracy. All model routes are disabled in the example policy until their gate passes. The orchestrator can review GitHub work but cannot start an external OpenCode process without an installed, authorized control interface.
