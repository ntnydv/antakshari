# Antakshari — product and implementation plan

A private multiplayer mobile music game built around song recognition, lyric recall and team singing. Planned application stack: **Flutter/Dart, Firebase, TypeScript/Node22, Cloud Run, and Meta Muse**.

**Current status:** design and executable backlog are published; the application has not been implemented or deployed. Python in this repository is for planning, validation and orchestration/operations scripts, not the application runtime.

## Start here

1. [Detailed PRD](docs/PRD.md)
2. [Architecture](docs/ARCHITECTURE.md) and [technology stack](docs/TECH_STACK.md)
3. [Multiplayer journeys and state machines](docs/MULTIPLAYER_FLOWS.md)
4. [Muse models, verified capabilities and costs](docs/AI_MODELS.md)
5. [32 component/round design documents](docs/design/README.md)
6. [Canonical contracts and schemas](docs/contracts/README.md)
7. [Release gates](docs/RELEASE_GATES.md) and [external inputs](docs/orchestration/RELEASE_INPUTS.md)
8. [2,056 executable task cards](backlog/README.md)

## Ten MVP formats

| ID | Format | Design |
| --- | --- | --- |
| R01 | Classic Antakshari | [Starting-sound chain](docs/rounds/01-classic-chain.md) |
| R02 | Dhun Pehchano | [Recognise a musical cue](docs/rounds/02-dhun-pehchano.md) |
| R03 | Antara Se Mukhda | [Verse to refrain](docs/rounds/03-antara-to-mukhda.md) |
| R04 | Mukhda Se Antara | [Refrain to verse](docs/rounds/04-mukhda-to-antara.md) |
| R05 | Agla Bol | [Continue the next phrase](docs/rounds/05-agla-bol.md) |
| R06 | Shabd Se Geet | [Sing a phrase containing the word](docs/rounds/06-shabd-se-geet.md) |
| R07 | Hum & Guess | [Private teammate humming](docs/rounds/07-hum-and-guess.md) |
| R08 | Do Gaane Ek Clue | [Identify two song fragments](docs/rounds/08-two-song-fragments.md) |
| R09 | Silent Video | [Recognise a physically muted video](docs/rounds/09-silent-video.md) |
| R10 | Tasveer Se Geet | [Recognise a picture clue](docs/rounds/10-picture-clue.md) |

Private1v1 and2v2 rooms, max4 players. Standard matches choose six eligible formats; the all-ten marathon requires2v2 because R07 needs a teammate. Server-owned scores reward correct song/section recall. Automatic pitch judging and guaranteed humming recognition are not MVP dependencies.

## OpenCode and orchestration

- [OpenCode startup prompt](OPENCODE.md)
- [Worker protocol](docs/orchestration/WORKER_PROTOCOL.md)
- [Orchestrator runbook](ORCHESTRATOR.md)
- [Current five-task batch](orchestration/queue.json)
- [Live task states](orchestration/state.json)
- [First-day plan](docs/orchestration/ONE_DAY_PLAN.md)

The backlog comprises8 foundation tasks and512 implementation slices. Each slice has one implementation task and three separate meaningful verification tasks: expected behavior, adverse cases, and port integration. Task prerequisites and exclusive paths are explicit. No worker may change shared schema/registry/lockfile paths opportunistically.

At five starts every30minutes, one worker can start at most240 tasks/day. The full backlog needs at least9days of starts, before blockers/retries. The240-task first-day list is a prioritization aid, not a promise of a production-ready app in one day. The queue may contain fewer than five tasks when prerequisites or active leases require it.

## Local planning checks

```sh
python3 tools/validate_plan.py
python3 -m unittest discover -s tests -v
python3 tools/taskctl.py status
python3 tools/taskctl.py ready --limit 5
python3 tools/taskctl.py show BOOT-001
```

These scripts need only Python's standard library. Application verification additionally needs the toolchain created by bootstrap tasks. `verify` intentionally fails when implementation, tests or tools are missing.

Regenerate cards and indexes from the authored slice catalogue with `python3 tools/planning/generate.py`. It preserves existing orchestration state/queue; do not run it to erase worker progress. Contract/policy seed generation is `python3 tools/planning/write_contracts.py`; run only when intentionally updating the baseline contracts, never over active schema changes without review.

## Model allocation

Muse Voice Transcribe1.0 is the primary transcription route; Muse Spark1.3 handles text/visual interpretation; Spark1.2 audio fallback is gated by a singing benchmark. Wonder1.0 and Image1.0 are optional offline editorial routes. Host speech uses prerecorded lines or device speech. Live routes start disabled until account/evaluation gates pass. See [AI model design](docs/AI_MODELS.md) and [source ledger](docs/research/SOURCES.md) for verified limitations and date-stamped provider facts.
