# Planning package validation

Validated on 2026-10-28. These checks apply to the plan and orchestration utilities, not to an implemented mobile app.

- 2,056 unique tasks:8 bootstrap,512 implementation,1,536 behavioral/adverse/integration checks.
- 32 components including10 round designs.
- 3,897 dependency edges; no cycles or unknown prerequisite IDs.
- 240 first-day priority candidates; dependency closure verified.
- Exclusive feature-task file paths do not overlap. Initial bootstrap batch also passes runtime conflict selection.
- All local Markdown links and code fences checked; JSON plans/schemas parse.
- Approved model IDs and Standard mode configuration validated; live routes remain gated.
- 57 TypeScript tests cover dependency validation, file ownership, dispatch/lease behavior, verification failures, review ingestion and recovery after actual child-process termination.
- 7 Python compatibility/legacy-runner tests preserve pinned CLI behavior while delegating planning validation and queue operations to TypeScript.
- Strict TypeScript 5.9.3 checks pass; runtime validation uses Node 22.18.0 on macOS arm64.
- `taskctl verify BOOT-001` correctly fails with missing application outputs. Missing implementation is not reported as success.

Reproduce:

```sh
node tools/validate-plan.mts
node --test tests/*.test.mts
python3 -m unittest discover -s tests -v
node tools/taskctl.mts ready --limit 5
```

No Flutter build, Firebase deployment, physical-device audio test, live Muse inference, catalogue rights check or singing benchmark has run. Those are implementation and release gates with explicit task ownership. OpenCode's external process is not started by these files.
