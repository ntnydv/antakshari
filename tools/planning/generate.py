#!/usr/bin/env python3
"""Generate a reviewable dependency graph from 512 authored implementation slices.

Deterministic, offline, standard-library only. Never contacts GitHub or runs workers.
"""
from pathlib import Path
import json, hashlib
from catalogue import COMPONENTS

ROOT=Path(__file__).resolve().parents[2]
def write(path,content):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content.rstrip()+'\n')
def dump(path,value):write(path,json.dumps(value,ensure_ascii=False,indent=2))

BOOT=[
 ('BOOT-001','Bootstrap the TypeScript backend workspace',[],['services/game-api/package.json','services/game-api/tsconfig.json','services/game-api/vitest.config.ts','services/game-api/src/entrypoints/**','services/game-api/test/toolchain.test.ts','pnpm-workspace.yaml','package.json','pnpm-lock.yaml'],
  'Create Node22 TypeScript build and Vitest setup with separate command, relay and worker entrypoints; no business feature code. Commit reproducible dependency locks and an executable smoke check.',
  ['pnpm --dir services/game-api exec tsc --noEmit','pnpm --dir services/game-api exec vitest run test/toolchain.test.ts']),
 ('BOOT-002','Bootstrap Flutter mobile and internal admin routes',[],['apps/mobile/pubspec.yaml','apps/mobile/pubspec.lock','apps/mobile/lib/main.dart','apps/mobile/lib/bootstrap/**','apps/mobile/android/**','apps/mobile/ios/**','apps/mobile/test/bootstrap_test.dart','apps/mobile/analysis_options.yaml','.fvmrc'],
  'Create Android/iOS Flutter application with Riverpod/go_router seams, internal role-gated admin entry, placeholder feature registry and widget smoke. Select a compatible stable SDK, lock it, and record actual versions.',
  ['flutter analyze','flutter test test/bootstrap_test.dart']),
 ('BOOT-003','Bootstrap Firebase emulator and access-rule harness',[],['infra/firebase/**','firebase.json','.firebaserc.example'],
  'Configure Auth/Firestore/RTDB/Storage/Functions emulators, deny-by-default rules and isolated local fixture project. No live resources or billing provisioning. Provide runnable authorization smoke checks.',
  ['python3 infra/firebase/check.py']),
 ('BOOT-004','Generate shared protocol bindings and validate schemas',[],['packages/contracts/**','tools/contracts/**'],
  'Validate checked-in schemas and generate Dart/TypeScript bindings, FeatureDescriptor and RoundPlugin ports plus shared positive/negative fixtures. Preserve schema meanings and generator reproducibility.',
  ['python3 tools/contracts/check.py']),
 ('BOOT-005','Build original deterministic song and media fixtures',[],['fixtures/**'],
  'Create at least12 clearly synthetic original song identities with sections and tiny owned audio/video/image fixtures covering all ten formats. Include intentionally invalid/leaking assets and rights-missing records. Never copy copyrighted film lyrics or media into the public repository.',
  ['python3 fixtures/validate.py']),
 ('BOOT-006','Build deterministic repositories and provider fakes',['BOOT-001','BOOT-003','BOOT-004','BOOT-005'],['services/game-api/src/testing/**','services/game-api/test/bootstrap.test.ts','services/game-api/test/fixtures/**'],
  'Provide injectable Auth, clock, catalogue, ledger, outbox, Redis and Muse fakes with duplicate, timeout, refusal and interrupted-capture scenarios. Fake results are labelled and forbidden in production configuration.',
  ['pnpm --dir services/game-api exec vitest run test/bootstrap.test.ts']),
 ('BOOT-007','Build collision-free feature registration tooling',['BOOT-001','BOOT-002','BOOT-004'],['tools/registry/**','services/game-api/src/generated/**','apps/mobile/lib/generated/**'],
  'Scan task-owned registration descriptors and generate deterministic backend/Flutter registries. Reject duplicate IDs and dependency cycles. Feature workers only edit their descriptor, never shared registries or root imports.',
  ['python3 tools/registry/check.py']),
 ('BOOT-008','Wire local integration commands and verification entrypoints',['BOOT-006','BOOT-007'],['tools/dev/**','services/game-api/src/composition/**','apps/mobile/lib/composition/**','tools/ops/README.md'],
  'Compose fake and emulator implementations behind generated ports; expose reproducible run/test commands and fail on missing dependencies/tests. Add instructions for replacing fakes with explicitly configured staging adapters.',
  ['python3 tools/dev/check.py'])
]

def paths(c,f,stage):
    code=c['code'];slug=c['slug'];key=f['key'].replace('-','_');kind=f['kind'];tier={'U':'unit','A':'adverse','X':'integration'}.get(stage)
    if kind=='M':
        if stage=='I':return [f'apps/mobile/lib/features/{slug}/{key}.dart',f'apps/mobile/lib/features/{slug}/{key}.registration.dart']
        return [f'apps/mobile/test/{code}/{tier}/{key}_test.dart']
    if kind=='S':
        if stage=='I':return [f'services/game-api/src/features/{slug}/{key}.ts',f'services/game-api/src/features/{slug}/{key}.registration.ts']
        return [f'services/game-api/test/{code}/{tier}/{key}.test.ts']
    if stage=='I':return [f'tools/ops/{slug}/{key}.py',f'tools/ops/{slug}/{key}.registration.json']
    return [f'tools/ops/tests/{code}/{tier}/test_{key}.py']

def task_commands(c,f,stage,owned):
    if f['kind']=='S':
        if stage=='I':return [['pnpm','--dir','services/game-api','exec','tsc','--noEmit']]
        return [['pnpm','--dir','services/game-api','exec','vitest','run',owned[0].removeprefix('services/game-api/')]]
    if f['kind']=='M':
        return [['flutter','analyze',owned[0].removeprefix('apps/mobile/')]] if stage=='I' else [['flutter','test',owned[0].removeprefix('apps/mobile/')]]
    return [['python3','-m','py_compile',owned[0]]] if stage=='I' else [['python3','tools/run_python_tests.py',owned[0]]]

import shlex
BOOT_OUTPUTS={
 'BOOT-001':['services/game-api/package.json','services/game-api/tsconfig.json','services/game-api/test/toolchain.test.ts'],
 'BOOT-002':['apps/mobile/pubspec.yaml','apps/mobile/lib/main.dart','apps/mobile/test/bootstrap_test.dart'],
 'BOOT-003':['firebase.json','infra/firebase/check.py'],
 'BOOT-004':['tools/contracts/check.py'],
 'BOOT-005':['fixtures/validate.py'],
 'BOOT-006':['services/game-api/test/bootstrap.test.ts'],
 'BOOT-007':['tools/registry/check.py'],
 'BOOT-008':['tools/dev/check.py']}
tasks=[]
for id,title,deps,owned,outcome,checks in BOOT:
    tasks.append(dict(id=id,title=title,component='BOOT',slice=None,kind='bootstrap',stage='B',priority='P0',first_day=True,
      dependencies=deps,owned_paths=owned,required_outputs=BOOT_OUTPUTS[id],design='docs/orchestration/BOOTSTRAP.md',
      outcome=outcome,adverse='A missing tool, credential or environment must be reported as blocked; do not fabricate passing evidence.',
      verification_commands=[shlex.split(x) for x in checks],verification_cwd='apps/mobile' if id=='BOOT-002' else '.',verification_notes=checks,estimated_minutes=[20,90],wave=0,status='pending'))

for c in COMPONENTS:
    for fi,f in enumerate(c['features'],1):
        prefix=f"{c['code']}-{fi:02d}"
        for stage in ['I','U','A','X']:
            id=f'{prefix}-{stage}'
            deps=['BOOT-008']
            if stage=='I':
                deps += [f'{d}-01-I' for d in c['depends']]
                if fi>1:deps+=[f"{c['code']}-01-I"]
            else:deps=[f'{prefix}-I']
            owned=paths(c,f,stage)
            title={'I':'Implement','U':'Verify expected behavior for','A':'Verify adverse behavior for','X':'Verify port integration for'}[stage]+' '+f['key'].replace('-',' ')
            outcome=f['outcome']
            if stage=='U':outcome='Add executable behavioral checks using public interfaces: '+outcome
            if stage=='A':outcome='Add an executable regression reproducing this failure and asserting the required outcome: '+f['adverse']
            if stage=='X':outcome='Exercise the slice across its registered adapter/port boundary with injected dependencies; assert observable output, side effects and resource cleanup: '+f['outcome']
            tasks.append(dict(id=id,title=title,component=c['code'],slice=f['key'],kind=f['kind'],stage=stage,
              priority='P0' if fi<=4 else 'P1',first_day=False,dependencies=sorted(set(deps)),owned_paths=owned,required_outputs=owned,
              design=c['design'],outcome=outcome,adverse=f['adverse'],verification_commands=task_commands(c,f,stage,owned),
              verification_cwd='apps/mobile' if f['kind']=='M' else '.',estimated_minutes=[15,60] if stage=='I' else [10,35],
              wave=c['layer']+1,status='pending',requirement_ref=f"REQ-{c['code']}-{fi:02d}",
              ports=c['operations'],data_scope=c['data'],invariant=c['invariant']))

byid={t['id']:t for t in tasks}
def depth(id,visiting=None):
    visiting=set() if visiting is None else visiting
    if id in visiting:raise ValueError('Dependency cycle at '+id)
    if '_depth' in byid[id]:return byid[id]['_depth']
    v=0 if not byid[id]['dependencies'] else 1+max(depth(d,visiting|{id}) for d in byid[id]['dependencies'])
    byid[id]['_depth']=v;return v
for t in tasks:t['wave']=depth(t['id'])
for t in tasks:t.pop('_depth',None)

# Capacity-limited planning shortlist. This is a proposed pull order, not a claim
# that these tasks alone satisfy the release gates or complete within one day.
firstday=set(t['id'] for t in tasks if t['component']=='BOOT')
for c in COMPONENTS:
    for i in range(1,5):firstday.add(f"{c['code']}-{i:02d}-I")
for c in COMPONENTS:
    for stage in ['U','A','X']:firstday.add(f"{c['code']}-01-{stage}")
for code in ['C03','C05','C09','C10']:
    for stage in ['U','A']:firstday.add(f'{code}-02-{stage}')
assert len(firstday)==240,len(firstday)
for t in tasks:t['first_day']=t['id'] in firstday
assert all(d in firstday for id in firstday for d in byid[id]['dependencies'])

def card(t):
    deps='\n'.join(f'- [{d}](../{byid[d]["component"]}/{d}.md)' for d in t['dependencies']) or '- None. This is an initial independent foundation task.'
    owned='\n'.join('- `'+p+'`' for p in t['owned_paths'])
    stage_rules={
      'I':'Implement real production behavior behind the assigned interface. Reuse shared services; do not duplicate room reducers or scoring. A registration descriptor is required. Include an example invocation in the handoff; do not claim downstream tests exist until their tasks land.',
      'U':'Write meaningful normal-case tests of externally observable behavior, with explicit input and expected output. Assert effects through public ports. Do not assert private implementation details or merely repeat the function body.',
      'A':'Write adversarial/boundary regression tests that would fail if the documented protection were removed. Name the exact invalid input or race and verify unchanged protected state.',
      'X':'Write adapter/contract integration checks using the shared deterministic harness. This checks component wiring; it is not a live-device or provider certification. Label fake-provider evidence and assert cleanup and one-time effects.',
      'B':'Create the shared foundation described below. Do not implement unrelated product features or provision paid services.'
    }[t['stage']]
    checklines='\n'.join(' '.join(x) for x in t.get('verification_commands',[])) or '\n'.join(t.get('verification_notes',[]))
    return f'''# {t['id']}: {t['title']}

Status: pending (live state: `orchestration/state.json`). Priority: {t['priority']}. Component: {t['component']}. Dependency wave: {t['wave']}.
Estimate: {t['estimated_minutes'][0]}–{t['estimated_minutes'][1]} minutes; estimate only. First-day candidate: {'yes' if t['first_day'] else 'no'}.

## Read first

- [Component design](../../../{t['design']})
- [PRD](../../../docs/PRD.md)
- [Canonical contracts](../../../docs/contracts/README.md)
- [Worker protocol](../../../docs/orchestration/WORKER_PROTOCOL.md)

## Outcome

{t['outcome']}

{stage_rules}

## Prerequisites

{deps}

Work starts only after these task results are accepted and merged. Branch from the dispatch baseline commit. If a documented interface is missing or contradictory, report a blocker; do not create an incompatible substitute.

## Exclusive production/test paths

{owned}

Also allowed: `orchestration/results/{t['id']}.json`. Do not edit sibling tasks, queue/state files, shared registries, dependency locks, schemas, or global routing outside these paths. Ask the orchestrator for a separately owned integration task when a cross-cutting change is necessary.

## Acceptance criteria

1. Demonstrate the outcome above using a concrete fixture and externally visible result.
2. Required failure behavior: {t['adverse']}
3. Respect invariant: {t.get('invariant','No production implementation is claimed before evidence exists. Shared foundations remain deterministic and isolated from live services.')}
4. Use the component ports `{t.get('ports','bootstrap interfaces')}` and data scope: {t.get('data_scope','only the explicitly owned foundation artifacts')}.
5. No credentials, raw player recordings, unlicensed media, hidden answer keys, or personal data enter logs/public fixtures.
6. Every assigned verification command actually runs and passes; missing tools/tests are blocked, not skipped-success.
7. Commit only owned paths and report evidence, changed files, risks and any unresolved dependencies.

## Execute and verify

```sh
python3 tools/taskctl.py show {t['id']}
python3 tools/taskctl.py verify {t['id']}
```

Underlying checks (working directory: `{t.get('verification_cwd','.')}`):

```text
{checklines}
```

Bootstrap checks are specified as work to be created and then executed; they are not implemented yet. Live AI credentials, device signing and content rights are external release inputs, never invented by an implementation agent.

## Handoff

Open one task-scoped PR with title `[{t['id']}] {t['title']}` and add `orchestration/results/{t['id']}.json` using the result schema. Include base commit, implementation commit, exact commands, exit codes, evidence paths and blockers. Set status `implemented`, `blocked`, or `failed`; only the orchestrator sets `done` after review and merge. Do not self-approve or deploy production.
'''

for t in tasks:
    t['card_path']=f"backlog/tasks/{t['component']}/{t['id']}.md"
    write(t['card_path'],card(t))

# Component designs are authored around domain-specific invariants and slices.
# Keep the separately authored AI and round narratives, and add a task index.
for c in COMPONENTS:
    table='\n'.join(f"| REQ-{c['code']}-{i:02d} | {f['key']} | {f['kind']} | {f['outcome']} | {f['adverse']} |" for i,f in enumerate(c['features'],1))
    index='\n'.join(f"- [{c['code']}-{i:02d}-I](../../backlog/tasks/{c['code']}/{c['code']}-{i:02d}-I.md): {f['key']} (implementation; paired U/A/X tasks cover expected, adverse and port integration behavior)." for i,f in enumerate(c['features'],1))
    p=ROOT/c['design']
    marker='\n## Executable delivery slices\n'
    if p.exists():base=p.read_text().split(marker)[0]
    else:
        base=f'''# {c['title']} — component design

Component: {c['code']}. Status: implementation baseline, not implemented. Date: 2026-10-27.

## Purpose and boundary

{c['intent']}

The component owns the capabilities below and composes shared contracts. It must not take ownership of adjacent services merely because it calls them. Backend feature modules live in one codebase with command/relay/worker deployment entrypoints; component names are not a request for separate microservices.

## Dependencies and integration

Depends on: {', '.join(c['depends']) or 'shared bootstrap only'}. Bind these dependencies through injected ports so a worker can execute deterministic fixtures before live integration. Read [architecture](../ARCHITECTURE.md), [multiplayer flows](../MULTIPLAYER_FLOWS.md) and [contracts](../contracts/README.md) before changing boundaries.

Ports: `{c['operations']}`. These are application interfaces, not invented external provider endpoints. Their payloads must use the canonical contract package. A missing shared shape is a contract-owner task, not an excuse to put an untyped object in production.

## Data ownership and invariants

Data: {c['data']}.

**Invariant:** {c['invariant']}

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
{table}

## Rollout and completion

Integrate behind generated feature registration. Preserve a deterministic local fake for remote dependencies, and visibly label it. Release requires relevant [release gates](../RELEASE_GATES.md), including authorization, reconnect/idempotency, bounded resource use and device/provider evidence where applicable. A task passing unit checks alone does not authorize deployment. Rollback disables the component route/flag or restores a compatible version without changing immutable active-match contracts.
'''
    write(c['design'],base+marker+'\n'+index)

write('docs/design/README.md','# Component design index\n\n'+ '\n'.join(f"- [{c['code']} — {c['title']}](../{c['design'].removeprefix('docs/')}) — 16 delivery slices / 64 tasks." for c in COMPONENTS))
manifest=dict(schema_version=1,generated_on='2026-10-27',task_count=len(tasks),implementation_slices=512,
 components=[{k:v for k,v in c.items() if k!='features'} for c in COMPONENTS],tasks=tasks)
dump('backlog/index.json',manifest)
dump('backlog/first-day.json',dict(note='Capacity-limited priority candidates; not a guarantee of completion or sufficient release evidence.',task_ids=sorted(firstday,key=lambda id:(byid[id]['wave'],id))))
write('backlog/README.md',f'''# Executable implementation backlog

There are **{len(tasks):,} individually scoped task cards**: 8 foundation tasks and 512 authored delivery slices, each split into implementation (I), expected-behavior verification (U), adverse-case verification (A), and port-integration verification (X). This is 512 implementation tasks and 1,536 substantive verification tasks, not 2,048 unrelated features.

- [Machine-readable task index](index.json)
- [First-day priority candidates](first-day.json): 240 dependency-closed task starts, not a promise that those tasks finish or certify an MVP in one day.
- [Component designs](../docs/design/README.md)
- [OpenCode worker protocol](../docs/orchestration/WORKER_PROTOCOL.md)
- [Current dispatch queue](../orchestration/queue.json)

At five new tasks every30minutes there are at most240 starts per24hours. The full {len(tasks):,}-task backlog takes at least9days of starts with one worker, before blockers, integration or retries. Five means a maximum, not a quota: fewer are dispatched when dependencies or exclusive paths prevent safe concurrency.

Read the assigned card and design before coding. A card is executable once all dependencies have merged; 'independent' means isolated file ownership and a complete contract, not that prerequisites do not exist. Verify through `python3 tools/taskctl.py verify TASK_ID`; no command treats missing implementation/tests as success.

All task cards initially say pending. `orchestration/state.json` is the sole mutable status authority; cards and index describe the plan. OpenCode submits task-scoped PRs and evidence. The orchestrator verifies, merges eligible work and updates state before generating the next batch.
''')

statepath=ROOT/'orchestration/state.json'
if not statepath.exists():
    dump('orchestration/state.json',dict(schema_version=1,revision=1,tasks={t['id']:{'status':'pending','attempts':0} for t in tasks}))
if not (ROOT/'orchestration/queue.json').exists():
    dump('orchestration/queue.json',dict(schema_version=1,batch_id='batch-0001',status='ready',worker='opencode',max_concurrency=5,cadence_minutes=30,
      baseline_ref='main',baseline_sha=None,instructions='Resolve main to an immutable commit at claim; record it in each task result. No more than five active tasks.',
      task_ids=[t[0] for t in BOOT[:5]],task_cards=[f'backlog/tasks/BOOT/{t[0]}.md' for t in BOOT[:5]]))
dump('backlog/plan-stats.json',dict(tasks=len(tasks),components=32,rounds=10,implementation_slices=512,
 bootstrap=8,implementation_tasks=512,verification_tasks=1536,first_day_candidates=len(firstday),
 dependency_edges=sum(len(t['dependencies']) for t in tasks),maximum_dependency_wave=max(t['wave'] for t in tasks),
 backlog_sha256=hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()).hexdigest()))
print(json.dumps({'tasks':len(tasks),'components':32,'first_day_candidates':len(firstday)}))
