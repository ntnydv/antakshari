# Protocol examples and boundary fixtures

The examples are synthetic. IDs do not identify real users or songs. The schema package is authoritative for types; business preconditions additionally enforce current membership and phase.

## Answer request

```json
{
  "schemaVersion": 1,
  "commandId": "11111111-1111-4111-8111-111111111111",
  "roomId": "room_fixture",
  "matchId": "match_fixture",
  "expectedVersion": 17,
  "type": "answer.request",
  "payload": {"promptId": "prompt_fixture", "phaseToken": "phase_17"}
}
```

Success returns a command receipt and authoritative snapshot/grant references. The client waits for a grant before starting capture. Retrying the exact envelope returns the same logical result. Changing the payload under the same commandId returns an idempotency conflict.

## Adjudication

```json
{
  "schemaVersion": 1,
  "attemptId": "attempt_fixture",
  "grantGeneration": 1,
  "verdict": "uncertain",
  "reasonCodes": ["NO_FINAL_TRANSCRIPT"],
  "songIds": [],
  "sectionIds": [],
  "evidenceId": "evidence_fixture",
  "policyVersion": "judge_v1",
  "provenance": "DETERMINISTIC_FIXTURE",
  "settledAtMs": 1793145600000
}
```

The scorer applies no wrong-answer penalty. It chooses a neutral retry/void or explicit both-captain review from the room policy. A partial transcript does not become a final answer merely because the provider times out.

## Required integration traces

| Trace | Required result |
| --- | --- |
| Same answer command arrives twice | One sealed attempt; one score effect |
| Receipt persisted, outbox dispatcher dies | Reconciler performs the pending effect once logically |
| Worker dies after Meta call | Possible extra provider spend is logged; no duplicate score |
| Two clients claim final lobby slot | One admission, one capacity rejection |
| ASR returns after retry/replacement | Old attempt generation cannot affect new prompt |
| Disconnected singer rejoins after grace | Snapshot/resume policy applies; old capture grant stays revoked |
| Viewer guesses private-match document path | Authorization denies answer manifest |
| Player says a prompt-injection instruction | Treated as answer data; no tool or score execution |
| Picture client inspects downloaded assets | Only permitted masked derivative exists |
| Room clients land on different relay instances | Authorized audio crosses Redis; no isolated local room |
| R07 selected for1v1 | Preflight rejects selection; no silent format replacement |

BOOT-004 generates matching machine fixtures and cross-language codec checks. Component tasks use these seams. Physical device, live provider and rights verification remain separate release gates.
