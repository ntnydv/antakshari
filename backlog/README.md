# Executable implementation backlog

There are **2,056 individually scoped task cards**: 8 foundation tasks and 512 authored delivery slices, each split into implementation (I), expected-behavior verification (U), adverse-case verification (A), and port-integration verification (X). This is 512 implementation tasks and 1,536 substantive verification tasks, not 2,048 unrelated features.

- [Machine-readable task index](index.json)
- [First-day priority candidates](first-day.json): 240 dependency-closed task starts, not a promise that those tasks finish or certify an MVP in one day.
- [Component designs](../docs/design/README.md)
- [OpenCode worker protocol](../docs/orchestration/WORKER_PROTOCOL.md)
- [Current dispatch queue](../orchestration/queue.json)

At five new tasks every30minutes there are at most240 starts per24hours. The full 2,056-task backlog takes at least9days of starts with one worker, before blockers, integration or retries. Five means a maximum, not a quota: fewer are dispatched when dependencies or exclusive paths prevent safe concurrency.

Read the assigned card and design before coding. A card is executable once all dependencies have merged; 'independent' means isolated file ownership and a complete contract, not that prerequisites do not exist. Verify through `python3 tools/taskctl.py verify TASK_ID`; no command treats missing implementation/tests as success.

All task cards initially say pending. `orchestration/state.json` is the sole mutable status authority; cards and index describe the plan. OpenCode submits task-scoped PRs and evidence. The orchestrator verifies, merges eligible work and updates state before generating the next batch.
