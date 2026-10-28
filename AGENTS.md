# Antakshari agent execution rules

This repository is initially a PRD/design/backlog package, not a working application. Read `README.md`, `OPENCODE.md`, the assigned task card, its component design and `docs/contracts/README.md` before coding.

- The user has appointed Codex as orchestrator. OpenCode consumes at most five assigned tasks every30minutes. Do not launch thousands of tasks or infer authorization to start a new independent swarm.
- `orchestration/queue.json` assigns the current batch. `orchestration/state.json` is the status authority. Workers never edit queue/state or declare their own task done.
- Branch/worktree per task from the dispatch baseline. Modify only `owned_paths` plus `orchestration/results/TASK_ID.json`. Shared schemas, lockfiles, registries and routing require their owner/integrator assignment.
- Implement real behavior and meaningful checks. Missing credentials/tools/tests are explicit blockers; never create an empty pass script or report fake-provider evidence as live validation.
- Keep all scoring, membership, deadlines and private answer keys server-authoritative. Do not duplicate a round-specific match engine.
- Provider calls stay outside retryable Firestore transactions. Exactly-once score effects do not imply exactly-once provider billing.
- Use only the approved Standard Meta IDs and server-side secrets. Spark1.3 audio, TTS, native confidence and word timestamps must not be assumed available. Read `docs/AI_MODELS.md`.
- No raw singing, private tokens, copyrighted lyrics/media or personal data in commits, logs or public test fixtures. Use owned synthetic fixtures.
- Test only the assigned scope plus required integration gates; do not rewrite unrelated features. Runtime APIs and dependencies must be checked against current primary documentation when implementing.
- Submit a task-scoped PR and result schema with actual command output/evidence. Report `implemented`, `blocked` or `failed`; the orchestrator verifies/merges and updates `done`.
- No production deployment, paid provisioning, unrelated communication or destructive cleanup is implied by a task card. Follow the user's explicit authorization and applicable tool permission rules.

For contradictions, the current user instruction takes precedence. Record the conflict and let the orchestrator reconcile contracts before dependent work proceeds.
