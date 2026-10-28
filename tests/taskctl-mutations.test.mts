import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir, hostname } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { TaskRepository } from '../tools/taskctl.mts';
import { JOURNAL, LOCK, recoverLock, transact, withStoreLock } from '../tools/orchestration-store.mts';

const BASE = 'a'.repeat(40), MERGE = 'b'.repeat(40), NOW = Date.parse('2026-10-28T04:00:00Z');
const CLI = resolve(dirname(fileURLToPath(import.meta.url)), '../tools/taskctl.mts');
const MODULE = pathToFileURL(CLI).href;
function task(id: string, dependencies: string[] = [], paths = [`src/${id}.ts`]) {
  return { id, dependencies, owned_paths: paths, card_path: `backlog/${id}.md` };
}
function fixture(t: TestContext, tasks = [task('A'), task('B', ['A'])]) {
  const root = mkdtempSync(join(tmpdir(), 'antakshari-mutation-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  function write(path: string, value: unknown) {
    const full = join(root, path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, JSON.stringify(value, null, 2) + '\n'); return full;
  }
  function read(path: string) { return JSON.parse(readFileSync(join(root, path), 'utf8')); }
  write('backlog/index.json', { tasks }); write('orchestration/state.json', { revision: 1, tasks: {} });
  function review(id = 'A', extra: Record<string, unknown> = {}) {
    return write('review.json', { task_id: id, reviewer_role: 'orchestrator', base_sha: BASE, merge_sha: MERGE,
      checks_verified: true, scope_verified: true, reviewed_at: new Date(NOW).toISOString(), ...extra });
  }
  return { root, read, write, review, repo: new TaskRepository(root) };
}
test('dispatch pins baseline, creates two-hour leases and reserves no more than five', t => {
  const f = fixture(t, Array.from({ length: 9 }, (_, i) => task(`A${i}`)));
  const batch = f.repo.dispatch('batch-1', 5, BASE, NOW);
  assert.equal(batch.baseline_sha, BASE); assert.equal(batch.task_ids.length, 5);
  const state = f.read('orchestration/state.json'); assert.equal(state.revision, 2);
  for (const id of batch.task_ids) {
    assert.equal(state.tasks[id].attempts, 1); assert.equal(state.tasks[id].status, 'dispatched');
    assert.equal(Date.parse(state.tasks[id].lease_expires_at), NOW + 120 * 60_000);
  }
  assert.deepEqual(f.read('orchestration/queue.json'), f.read('orchestration/batches/batch-1.json'));
  assert.equal(existsSync(join(f.root, JOURNAL)), false); assert.equal(existsSync(join(f.root, LOCK)), false);
});
test('same-batch retries never extend leases or increment attempts', t => {
  const f = fixture(t), first = f.repo.dispatch('batch-1', 5, BASE, NOW);
  const original = f.read('orchestration/state.json');
  assert.deepEqual(f.repo.dispatch('batch-1', 5, BASE, NOW + 60_000), first);
  assert.deepEqual(f.read('orchestration/state.json'), original);
  assert.throws(() => f.repo.dispatch('batch-1', 5, MERGE, NOW), /baseline cannot change/);
  assert.throws(() => f.repo.dispatch('batch-2', 5, BASE, NOW), /unfinished/);
});
test('new dispatch requires immutable SHA and rejects invalid IDs and limits', t => {
  const f = fixture(t);
  for (const baseline of [undefined, 'main', 'abcd']) assert.throws(() => f.repo.dispatch('batch-1', 5, baseline, NOW), /baseline-sha/);
  for (const id of ['../outside', '', 'x'.repeat(81)]) assert.throws(() => f.repo.dispatch(id, 5, BASE, NOW), /batch ID/);
  for (const limit of [0, 6, 1.5]) assert.throws(() => f.repo.dispatch('batch-1', limit, BASE, NOW), /between 1 and 5/);
  assert.deepEqual(f.read('orchestration/state.json').tasks, {});
});
test('initial ready queue activates only its exact selection', t => {
  const f = fixture(t);
  f.write('orchestration/queue.json', { schema_version: 1, batch_id: 'initial', status: 'ready', task_ids: ['A'] });
  assert.deepEqual(f.repo.dispatch('initial', 5, BASE, NOW).task_ids, ['A']);
  const g = fixture(t);
  g.write('orchestration/queue.json', { batch_id: 'initial', status: 'ready', task_ids: ['B'] });
  assert.throws(() => g.repo.dispatch('initial', 5, BASE, NOW), /differs from selection/);
});
test('expiry needs review and never releases ownership; repeated expiry is idempotent', t => {
  const f = fixture(t, [task('A', [], ['src/shared/**']), task('B', [], ['src/shared/b.ts'])]);
  f.repo.dispatch('batch-1', 5, BASE, NOW);
  const result = f.repo.expire(NOW + 121 * 60_000);
  assert.deepEqual(result.needs_review_ids, ['A']);
  assert.deepEqual(f.repo.ready(), []); assert.equal(f.read('orchestration/queue.json').status, 'needs_review');
  assert.equal(f.repo.expire(NOW + 122 * 60_000).changed, false);
  const retried = f.repo.dispatch('batch-1', 5, BASE, NOW + 123 * 60_000);
  assert.equal(retried.status, 'needs_review'); assert.equal(retried.created_at, new Date(NOW).toISOString());
  assert.equal(f.read('orchestration/state.json').tasks.A.attempts, 1);
});
test('review completes assigned task, closes queue, then unlocks dependencies', t => {
  const f = fixture(t); f.repo.dispatch('batch-1', 5, BASE, NOW);
  f.repo.ingestReview(f.review(), NOW);
  assert.equal(f.read('orchestration/queue.json').status, 'completed');
  assert.deepEqual(f.repo.ready().map(t => t.id), ['B']);
  const revision = f.read('orchestration/state.json').revision;
  assert.equal(f.repo.ingestReview(f.review(), NOW).unchanged, true);
  assert.equal(f.read('orchestration/state.json').revision, revision);
  assert.throws(() => f.repo.ingestReview(f.review('A', { merge_sha: 'c'.repeat(40) }), NOW), /different merge SHA/);
  f.repo.dispatch('batch-2', 5, MERGE, NOW);
  f.repo.dispatch('batch-1', 5, BASE, NOW);
  assert.equal(f.read('orchestration/queue.json').batch_id, 'batch-2');
});
test('worker results, false checks, mismatched baselines and unassigned tasks cannot complete', t => {
  const f = fixture(t); f.repo.dispatch('batch-1', 5, BASE, NOW);
  for (const extra of [{ reviewer_role: 'worker' }, { checks_verified: false }, { scope_verified: 1 },
    { merge_sha: 'short' }, { base_sha: MERGE }, { reviewed_at: 'yesterday' },
    { reviewed_at: new Date(NOW + 6 * 60_000).toISOString() }]) assert.throws(() => f.repo.ingestReview(f.review('A', extra), NOW));
  assert.throws(() => f.repo.ingestReview(f.review('B'), NOW), /assigned batch/);
  assert.equal(f.read('orchestration/state.json').tasks.A.status, 'dispatched');
});
test('review rejects unmet dependencies even if an invalid assignment was externally recorded', t => {
  const f = fixture(t);
  f.write('orchestration/state.json', { revision: 1, tasks: { B: { status: 'dispatched', batch_id: 'bad' } } });
  f.write('orchestration/queue.json', { batch_id: 'bad', task_ids: ['B'], status: 'dispatched', baseline_sha: BASE });
  assert.throws(() => f.repo.ingestReview(f.review('B'), NOW), /unmet dependencies/);
});
test('partial historical batch does not invent a new baseline or lease', t => {
  const f = fixture(t);
  f.write('orchestration/state.json', { revision: 1, tasks: { A: { status: 'dispatched', batch_id: 'old' } } });
  assert.throws(() => f.repo.dispatch('old', 5, BASE, NOW), /historical batch/);
});
test('concurrent processes cannot dispatch a second overlapping batch', async t => {
  const f = fixture(t, Array.from({ length: 8 }, (_, i) => task(`A${i}`)));
  const run = (batch: string) => new Promise<number | null>((done, fail) => {
    const child = spawn(process.execPath, [CLI, '--root', f.root, 'dispatch', '--batch-id', batch, '--baseline-sha', BASE], { stdio: 'pipe' });
    child.on('error', fail); child.on('close', done);
  });
  const statuses = await Promise.all([run('batch-1'), run('batch-2'), run('batch-3')]);
  assert.equal(statuses.filter(x => x === 0).length, 1);
  assert.equal(Object.keys(f.read('orchestration/state.json').tasks).length, 5);
  assert.equal(f.read('orchestration/queue.json').task_ids.length, 5);
});
test('live writer lock blocks readers, writers and explicit recovery', async t => {
  const f = fixture(t);
  const storeURL = pathToFileURL(resolve(dirname(CLI), 'orchestration-store.mts')).href;
  const source = `import {withStoreLock} from ${JSON.stringify(storeURL)}; withStoreLock(process.argv[1], () => {process.stdout.write('locked\\n'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10000);});`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', source, f.root], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
  const closed = once(child, 'close');
  await once(child.stdout, 'data');
  const owner = f.read(`${LOCK}/owner.json`);
  assert.throws(() => f.repo.ready(), /partial snapshot/);
  assert.throws(() => f.repo.dispatch('batch-1', 5, BASE, NOW), /writer lock/);
  assert.throws(() => recoverLock(f.root, owner.token), /still live/);
  child.kill('SIGKILL'); await closed;
  assert.throws(() => recoverLock(f.root, 'wrong-token'), /cannot be verified/);
  recoverLock(f.root, owner.token);
  assert.equal(f.repo.ready().length, 1);
});
test('foreign-host and malformed lock owners fail closed', t => {
  const f = fixture(t);
  f.write(`${LOCK}/owner.json`, { token: 'owned', pid: process.pid, hostname: hostname() + '-other' });
  assert.throws(() => recoverLock(f.root, 'owned'), /cannot be verified/);
  f.write(`${LOCK}/owner.json`, { token: 'owned', pid: -1, hostname: hostname() });
  assert.throws(() => recoverLock(f.root, 'owned'), /cannot be verified/);
  assert.equal(existsSync(join(f.root, LOCK)), true);
});

// Terminate a real child immediately after each durable rename, including the
// journal. This exercises interrupted files, not a mock successful transaction.
function crashMutation(root: string, operation: string, cut: number) {
  const source = `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module';
    const original = fs.renameSync; let count = 0;
    fs.renameSync = (...args) => { original(...args); if (!String(args[1]).includes('owner.json') && ++count === ${cut}) process.kill(process.pid, 'SIGKILL'); };
    syncBuiltinESMExports(); const {TaskRepository} = await import(${JSON.stringify(MODULE)});
    const repo = new TaskRepository(process.argv[1]); ${operation};`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source, root], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.signal, 'SIGKILL', result.stderr);
}
for (const cut of [1, 2, 3, 4]) {
  test(`dispatch recovers real process interruption after rename ${cut}`, t => {
    const f = fixture(t);
    crashMutation(f.root, `repo.dispatch('batch-1', 5, '${BASE}', ${NOW})`, cut);
    assert.throws(() => f.repo.ready(), /partial snapshot/);
    const owner = f.read(`${LOCK}/owner.json`); recoverLock(f.root, owner.token); f.repo.recover();
    const batch = f.repo.dispatch('batch-1', 5, BASE, NOW + 60_000);
    assert.equal(batch.baseline_sha, BASE); assert.equal(batch.created_at, new Date(NOW).toISOString());
    assert.equal(f.read('orchestration/state.json').tasks.A.attempts, 1);
    assert.deepEqual(f.read('orchestration/queue.json'), f.read('orchestration/batches/batch-1.json'));
    assert.equal(existsSync(join(f.root, JOURNAL)), false);
  });
  test(`review recovers real process interruption after rename ${cut}`, t => {
    const f = fixture(t); f.repo.dispatch('batch-1', 5, BASE, NOW); const review = f.review();
    crashMutation(f.root, `repo.ingestReview(${JSON.stringify(review)}, ${NOW})`, cut);
    recoverLock(f.root, f.read(`${LOCK}/owner.json`).token); f.repo.recover();
    assert.equal(f.read('orchestration/state.json').tasks.A.status, 'done');
    assert.equal(f.read('orchestration/queue.json').status, 'completed');
    assert.equal(f.repo.ingestReview(review, NOW).unchanged, true);
  });
}
test('recovery preserves external edits and refuses partial replay', t => {
  const f = fixture(t);
  crashMutation(f.root, `repo.dispatch('batch-1', 5, '${BASE}', ${NOW})`, 2);
  recoverLock(f.root, f.read(`${LOCK}/owner.json`).token);
  f.write('orchestration/queue.json', { external: 'edit' });
  const before = f.read('orchestration/state.json');
  assert.throws(() => f.repo.recover(), /Recovery conflict/);
  assert.deepEqual(f.read('orchestration/queue.json'), { external: 'edit' });
  assert.deepEqual(f.read('orchestration/state.json'), before);
  assert.equal(existsSync(join(f.root, JOURNAL)), true);
  assert.equal(existsSync(join(f.root, 'orchestration/batches/batch-1.json')), false);
});
test('store rejects symlinks, traversal, duplicate entries and corrupt journals', t => {
  const f = fixture(t), outside = fixture(t);
  for (const path of ['../outside', 'orchestration/batches/../../outside', LOCK]) {
    assert.throws(() => withStoreLock(f.root, () => transact(f.root, [{ path, value: {} }])));
  }
  assert.throws(() => withStoreLock(f.root, () => transact(f.root, [{ path: 'orchestration/state.json', value: {} }, { path: 'orchestration/state.json', value: {} }])), /Invalid transaction entry/);
  symlinkSync(outside.root, join(f.root, 'orchestration/batches'));
  assert.throws(() => withStoreLock(f.root, () => transact(f.root, [{ path: 'orchestration/batches/batch-1.json', value: {} }])), /Symlink/);
  f.write(JOURNAL, { version: 1, entries: [{ path: 'orchestration/state.json', before: null, content: '{}', after: 'invalid' }] });
  assert.throws(() => f.repo.recover(), /Invalid transaction entry/);
});
