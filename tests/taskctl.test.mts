import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TaskRepository, pathsConflict } from '../tools/taskctl.mts';

type Spec = Record<string, unknown>;
function task(id: string, overrides: Spec = {}) {
  return { id, dependencies: [], owned_paths: [`src/${id}.ts`], required_outputs: [], verification_commands: [], ...overrides };
}
function fixture(t: TestContext, tasks: Spec[], states: Spec = {}) {
  const root = mkdtempSync(join(tmpdir(), 'antakshari-taskctl-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  function write(path: string, content: string) {
    const target = join(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, content); return target;
  }
  write('backlog/index.json', JSON.stringify({ tasks }));
  write('orchestration/state.json', JSON.stringify({ revision: 1, tasks: states }));
  write('orchestration/queue.json', JSON.stringify({ batch_id: 'untouched' }));
  return { root, write, repo: new TaskRepository(root), snapshot: () => readFileSync(join(root, 'orchestration/state.json'), 'utf8') + readFileSync(join(root, 'orchestration/queue.json'), 'utf8') };
}

test('selection honors dependencies, priority and read-only state', t => {
  const f = fixture(t, [task('A'), task('B', { dependencies: ['A'] }), task('C', { first_day: true })]);
  const before = f.snapshot();
  assert.deepEqual(f.repo.ready().map(t => t.id), ['C', 'A']);
  assert.equal(f.repo.show('A').progress.status, 'pending');
  assert.equal(f.snapshot(), before);
});
test('only accepted done prerequisites unlock tasks', t => {
  const f = fixture(t, [task('A'), task('B', { dependencies: ['A'] }), task('C'), task('D', { dependencies: ['C'] })], { A: { status: 'implemented' }, C: { status: 'done' } });
  assert.deepEqual(f.repo.ready().map(t => t.id), ['D']);
});
test('all active statuses retain ownership; five active tasks fill capacity', t => {
  for (const status of ['dispatched', 'leased', 'in_progress', 'implemented', 'review_pending', 'needs_review']) {
    const f = fixture(t, [task('A', { owned_paths: ['src/shared/**'] }), task('B', { owned_paths: ['src/shared/item.ts'] }), task('C')], { A: { status } });
    assert.deepEqual(f.repo.ready().map(t => t.id), ['C']);
  }
  const f = fixture(t, Array.from({ length: 8 }, (_, n) => task(String(n))), Object.fromEntries(Array.from({ length: 5 }, (_, n) => [String(n), { status: 'implemented' }])));
  assert.deepEqual(f.repo.ready(), []);
});
test('selection is disjoint and capped at five; invalid limits fail', t => {
  const f = fixture(t, [task('A', { owned_paths: ['src/shared/**'] }), task('B', { owned_paths: ['src/shared/b.ts'] }), ...Array.from({ length: 7 }, (_, n) => task(`C${n}`))]);
  assert.deepEqual(f.repo.ready().map(t => t.id), ['A', 'C0', 'C1', 'C2', 'C3']);
  for (const n of [0, 6, 1.5, NaN]) assert.throws(() => f.repo.ready(n), /between 1 and 5/);
});
test('ownership handles segment boundaries and conservative glob intersections', () => {
  for (const [a, b] of [['src/a/**', 'src/a/file.ts'], ['src/a', 'src/a/nested/file.ts'], ['src/*/model.ts', 'src/rooms/model.ts'], ['src/**/model.ts', 'src/rooms/nested/model.ts'], ['src/a*.ts', 'src/ab*.ts'], ['src/[ab].ts', 'src/a.ts'], ['src/[!a].ts', 'src/b.ts']]) {
    assert.equal(pathsConflict(a, b), true, `${a}, ${b}`); assert.equal(pathsConflict(b, a), true);
  }
  for (const [a, b] of [['src/a', 'src/another'], ['src/*.ts', 'src/file.dart'], ['src/a*.ts', 'src/b*.ts'], ['src/a.ts', 'test/a.ts'], ['src/[!a].ts', 'src/a.ts']]) assert.equal(pathsConflict(a, b), false);
  for (const a of ['../outside', '/absolute', 'C:/outside', 'a\\b']) assert.throws(() => pathsConflict(a, 'src/a'), /escaping/);
});
test('cycles, unknown/duplicate dependencies and duplicate IDs fail closed', t => {
  for (const [tasks, error] of [
    [[task('A', { dependencies: ['B'] }), task('B', { dependencies: ['A'] })], /cycle/],
    [[task('A', { dependencies: ['missing'] })], /unknown dependency/],
    [[task('A', { dependencies: ['B', 'B'] }), task('B')], /invalid dependencies/],
    [[task('A'), task('A')], /duplicate/],
  ] as [Spec[], RegExp][]) assert.throws(() => fixture(t, tasks).repo.ready(), error);
});
test('unknown active work and malformed statuses cannot disappear from capacity', t => {
  assert.throws(() => fixture(t, [task('A')], { other: { status: 'leased' } }).repo.ready(), /Unknown active/);
  assert.throws(() => fixture(t, [task('A')], { A: { status: 'typo' } }).repo.ready(), /invalid status/);
});
test('expired leases report review need without requeueing or mutating files', t => {
  const f = fixture(t, [task('A')], { A: { status: 'dispatched', lease_expires_at: '2026-10-27T10:00:00Z' } });
  const before = f.snapshot();
  assert.deepEqual(f.repo.status(Date.parse('2026-10-27T10:01:00Z')).expired_active_ids, ['A']);
  assert.deepEqual(f.repo.ready(), []);
  assert.equal(f.snapshot(), before);
});
test('lease timestamps require timezone', t => {
  assert.throws(() => fixture(t, [task('A')], { A: { status: 'leased', lease_expires_at: '2026-10-27T10:00:00' } }).repo.status(), /timezone/);
});
test('missing required output prevents command execution', t => {
  const f = fixture(t, [task('A', { required_outputs: ['absent.ts'], verification_commands: [[process.execPath, '-e', 'process.exit(19)']] })]);
  assert.throws(() => f.repo.verify('A'), /missing required outputs/);
});
test('required glob outputs and real cwd are checked; success does not mark done', t => {
  const f = fixture(t, [task('A', { required_outputs: ['apps/mobile/*.mjs'], verification_cwd: 'apps/mobile', verification_commands: [[process.execPath, 'check.mjs']] })]);
  f.write('apps/mobile/check.mjs', "import assert from 'node:assert/strict'; import {basename} from 'node:path'; assert.equal(basename(process.cwd()), 'mobile'); console.log('actual check');");
  const before = f.snapshot(), result = f.repo.verify('A');
  assert.equal(result.verified, true); assert.match(result.commands[0].stdout, /actual check/);
  assert.equal(f.snapshot(), before); assert.equal(f.repo.show('A').progress.status, 'pending');
});
test('empty commands, shell strings, pipelines and recursive verification fail', t => {
  for (const commands of [[], 'node -v', ['node -v'], [[process.execPath, 'tools/taskctl.mts', 'verify', 'A']], [[process.execPath, 'tools/taskctl.py', 'verify', 'A']], [['echo', 'ok', '&&', 'echo', 'ok']]]) {
    const f = fixture(t, [task('A', { verification_commands: commands })]);
    assert.throws(() => f.repo.verify('A'), /commands|Recursive/);
  }
});
test('all command arguments are validated before any execution', t => {
  const f = fixture(t, [task('A', { verification_commands: [[process.execPath, '-e', 'process.exit(19)'], 'invalid'] })]);
  assert.throws(() => f.repo.verify('A'), /argv arrays/);
});
test('missing tools and failing checks are failures with actual output', t => {
  assert.throws(() => fixture(t, [task('A', { verification_commands: [['nonexistent-antakshari-check-991']] })]).repo.verify('A'), /process error/);
  assert.throws(() => fixture(t, [task('A', { verification_commands: [[process.execPath, '-e', "console.error('real failure'); process.exit(7)"]] })]).repo.verify('A'), /failed \(7\)[\s\S]*real failure/);
});
test('timeouts and signal termination cannot pass', t => {
  const timed = fixture(t, [task('A', { verification_commands: [[process.execPath, '-e', 'setTimeout(() => {}, 10000)']] })]);
  assert.throws(() => timed.repo.verify('A', 0.1), /process error/);
  const killed = fixture(t, [task('A', { verification_commands: [[process.execPath, '-e', "process.kill(process.pid, 'SIGTERM')"]] })]);
  assert.throws(() => killed.repo.verify('A'), /failed \(SIGTERM\)/);
  for (const n of [0, -1, NaN]) assert.throws(() => timed.repo.verify('A', n), /positive/);
});
test('symlink outputs and cwd outside repo fail', t => {
  const outside = fixture(t, []), f = fixture(t, [task('A', { required_outputs: ['escape.txt'], verification_commands: [[process.execPath, '-v']] })]);
  outside.write('outside.txt', 'owned fixture'); symlinkSync(join(outside.root, 'outside.txt'), join(f.root, 'escape.txt'));
  assert.throws(() => f.repo.verify('A'), /outside repository/);
  const g = fixture(t, [task('A', { verification_cwd: 'escape', verification_commands: [[process.execPath, '-v']] })]);
  symlinkSync(outside.root, join(g.root, 'escape'));
  assert.throws(() => g.repo.verify('A'), /invalid verification cwd/);
});
test('CLI refuses mutation and unknown options without state changes', t => {
  const f = fixture(t, [task('A')]), before = f.snapshot();
  const cli = resolve(dirname(fileURLToPath(import.meta.url)), '../tools/taskctl.mts');
  for (const args of [['dispatch', '--batch-id', 'b1'], ['ingest-review', 'file.json'], ['status', '--force'], ['ready', '--limit', '6']]) {
    const result = spawnSync(process.execPath, [cli, '--root', f.root, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 2); assert.equal(f.snapshot(), before);
  }
  const result = spawnSync(process.execPath, [cli, '--root', f.root, 'status'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).total, 1);
});
test('published backlog loads and all verification commands use explicit argv arrays', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { tasks } = new TaskRepository(root).load();
  assert.ok(tasks.size >= 2056);
  for (const task of tasks.values()) {
    assert.ok(Array.isArray(task.verification_commands) && task.verification_commands.length > 0, task.id);
    for (const command of task.verification_commands!) assert.ok(Array.isArray(command) && command.length > 0, task.id);
  }
});
