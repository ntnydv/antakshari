# Observability, analytics and costs — component design

Component: C21. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

Measure product completion, realtime latency, AI outcomes and spend while keeping user content out of logs.

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: C01, C19. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `emitMetric; recordTrace; settleUsage; evaluateBudget`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: Redacted structured logs; analytics event registry; cost aggregates; release dashboards.

**Invariant:** Metrics are structured and bounded; performance targets remain unmeasured until physical-device and load evidence exists.

Mutable competitive state is server-owned. Read/write authorization applies at each entrypoint; UI hiding is not access control. Command effects bind authenticated actor, commandId, current generation and immutable catalogue/rule version. Client snapshots are projections with answer-bearing data excluded until the relevant reveal phase.

## Processing and concurrency

The caller supplies a validated intent; this component checks prerequisites and returns a typed success, conflict, invalid input, unavailable or denied result. Pure transformations are deterministic. Persistent effects are committed with idempotency receipts. Network calls and provider I/O run outside retryable Firestore transactions, using a durable outbox where a committed side effect must be recovered.

For Flutter slices, repository state drives the view model and rendering; cancellation/disposal prevents an older operation from replacing a newer screen. For server slices, optimistic expectedVersion preconditions and resource-generation fencing prevent stale commands. Operations tooling defaults to validation/dry-run and prints a concrete plan before any separately authorized live operation.

## Failure behavior

The table below defines one explicit adverse behavior per capability. A failed dependency returns a bounded recoverable result; no empty success or fabricated model decision. Retries reuse operation identity and stop at the component deadline. Offline clients cannot queue competitive answers for later. Infrastructure uncertainty never changes scores without a verified attempt outcome.

Resource cleanup must run on cancel, timeout, disposal and successful completion. Late callbacks compare attempt/phase generation before applying results. Cross-instance state is never assumed to live in one server process; durable authority is Firestore and the realtime transport uses its shared bus.

## Security, privacy and observability

Use server-derived UID and current role; reject unknown mutable fields. Never expose provider keys, private answer manifests or raw singing in public logs. Emit structured component/operation IDs, duration, result class and redacted error code. Metrics describe observed behavior; configured thresholds are not evidence that a target has been met.

## Capability contracts and acceptance cases

`S` is a TypeScript server slice; `M` is Flutter; `O` is local/CI operations tooling. Each is one meaningful implementation outcome with three independently owned verification tasks. Integration here means the defined port boundary; live-device and real-provider qualification belongs to release gates.

| Requirement | Slice | Kind | Required behavior | Required adverse behavior |
| --- | --- | --- | --- | --- |
| REQ-C21-01 | event-registry | S | Validate analytics event names and allowed fields against a versioned registry. | Unknown free-text fields are rejected before logging. |
| REQ-C21-02 | request-correlation | S | Propagate request, match and attempt IDs across server and provider stages. | No bearer token or raw invite token is used as a correlation ID. |
| REQ-C21-03 | crash-reporting | M | Capture sanitized Flutter crashes with build and screen context. | User audio and lyric content are stripped from diagnostic breadcrumbs. |
| REQ-C21-04 | latency-histograms | S | Measure command, audio transport and adjudication stages separately. | Client clock skew cannot create negative authoritative durations. |
| REQ-C21-05 | completion-funnel | S | Measure room-created through match-finished stages with consent rules. | Repeated events do not inflate unique match completion. |
| REQ-C21-06 | ai-outcome-metrics | S | Track accept/reject/abstain/retry and override rates by model/prompt version. | A high accept rate is not labelled accuracy without ground truth. |
| REQ-C21-07 | cost-estimator | S | Estimate ASR/token/media costs from dated configurable rates and actual usage. | Missing usage is marked unknown rather than zero. |
| REQ-C21-08 | budget-alerts | S | Alert on room and tenant spend thresholds with deduplicated incidents. | A noisy alert loop cannot generate unbounded notifications. |
| REQ-C21-09 | provider-health | S | Track429/timeouts and circuit status for each provider operation. | A text endpoint success cannot declare ASR healthy. |
| REQ-C21-10 | relay-health | S | Measure cross-instance fanout latency and dropped frame counts. | Single-instance samples are labelled separately. |
| REQ-C21-11 | dashboard-definitions | O | Version dashboards for completion, latency, AI abstention and spend. | Dashboard queries cannot include private transcript fields. |
| REQ-C21-12 | privacy-audit | O | Scan synthetic telemetry fixtures for prohibited sensitive field names and nested content. | A renamed nested secret field triggers a failed audit fixture. |
| REQ-C21-13 | sampling-policy | S | Apply deterministic sampling to high-volume traces while retaining required errors. | Sampling never drops the only cost ledger entry. |
| REQ-C21-14 | alert-runbooks | O | Attach actionable diagnostics and rollback links to critical alerts. | An alert without a safe recovery action fails runbook review. |
| REQ-C21-15 | load-report | O | Produce measured p50/p95 rates with concurrency, region and device context. | Reports cannot substitute configured targets for observed measurements. |
| REQ-C21-16 | analytics-opt-out | M | Apply analytics preference before emitting optional client events. | Events queued before opt-out are discarded by policy. |

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.

## Executable delivery slices

- [C21-01-I](../../backlog/tasks/C21/C21-01-I.md): event-registry (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-02-I](../../backlog/tasks/C21/C21-02-I.md): request-correlation (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-03-I](../../backlog/tasks/C21/C21-03-I.md): crash-reporting (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-04-I](../../backlog/tasks/C21/C21-04-I.md): latency-histograms (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-05-I](../../backlog/tasks/C21/C21-05-I.md): completion-funnel (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-06-I](../../backlog/tasks/C21/C21-06-I.md): ai-outcome-metrics (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-07-I](../../backlog/tasks/C21/C21-07-I.md): cost-estimator (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-08-I](../../backlog/tasks/C21/C21-08-I.md): budget-alerts (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-09-I](../../backlog/tasks/C21/C21-09-I.md): provider-health (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-10-I](../../backlog/tasks/C21/C21-10-I.md): relay-health (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-11-I](../../backlog/tasks/C21/C21-11-I.md): dashboard-definitions (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-12-I](../../backlog/tasks/C21/C21-12-I.md): privacy-audit (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-13-I](../../backlog/tasks/C21/C21-13-I.md): sampling-policy (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-14-I](../../backlog/tasks/C21/C21-14-I.md): alert-runbooks (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-15-I](../../backlog/tasks/C21/C21-15-I.md): load-report (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
- [C21-16-I](../../backlog/tasks/C21/C21-16-I.md): analytics-opt-out (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior).
