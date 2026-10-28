import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { dependencyErrors, firstDayErrors, markdownErrors, modelPolicyErrors, ownershipErrors, validate } from '../tools/validate-plan.mts';
import type { PlanTask } from '../tools/validate-plan.mts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function task(id: string, dependencies: string[] = [], owned_paths = [`src/${id}.ts`]): PlanTask {
  return { id, dependencies, owned_paths, component: 'C01', title: id, design: 'design.md', card_path: `${id}.md`, first_day: true };
}
function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'antakshari-plan-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  function write(path: string, text: string) {
    const full = join(root, path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, text); return full;
  }
  function json(path: string, value: unknown) { return write(path, JSON.stringify(value)); }
  const components = [
    ...Array.from({ length: 22 }, (_, i) => ({ code: `C${String(i + 1).padStart(2, '0')}`, design: 'design.md' })),
    ...Array.from({ length: 10 }, (_, i) => ({ code: `R${String(i + 1).padStart(2, '0')}`, design: 'design.md' })),
  ];
  const index = { schema_version: 1, task_count: 2, tasks: [task('A'), task('B', ['A'])], components };
  json('backlog/index.json', index); json('backlog/first-day.json', { task_ids: ['A', 'B'] });
  const policy = { dataMode: 'standard', liveCallsRequireServerSecret: true, rawTranscriptLogging: false, model: 'muse-spark-1.3' };
  json('config/model-policy.json', policy);
  write('design.md', '# Design\n'); write('A.md', '# A\n[design](design.md#design)\n'); write('B.md', '# B\n');
  return { root, write, json, index, policy, check: () => validate(root, 2, 2) };
}
test('diamond dependencies pass; cycles remain errors with independent roots', () => {
  assert.deepEqual(dependencyErrors([task('root'), task('left', ['root']), task('right', ['root']), task('join', ['left', 'right'])]), []);
  assert.match(dependencyErrors([task('ready'), task('A', ['B']), task('B', ['A'])]).join('\n'), /cycle/i);
  assert.match(dependencyErrors([task('A', ['missing'])]).join('\n'), /missing dependency missing/);
  assert.match(dependencyErrors([task('A'), task('A')]).join('\n'), /Duplicate/);
  assert.match(dependencyErrors([task('A', ['B', 'B']), task('B')]).join('\n'), /repeated dependency/);
  assert.match(dependencyErrors([{ id: 'A', dependencies: 'bad' } as unknown as PlanTask]).join('\n'), /string list/);
});
test('ownership excludes valid bootstrap scopes but rejects malformed paths in every stage', () => {
  assert.deepEqual(ownershipErrors([{ ...task('BOOT', [], ['src/**']), component: 'BOOT' }, task('A')]), []);
  for (const path of ['../outside', '/absolute', 'C:/windows', 'src\\file', '']) {
    assert.match(ownershipErrors([{ ...task('BOOT', [], [path]), component: 'BOOT' }]).join('\n'), /unsafe/);
  }
});
test('ownership finds literal duplicates, directory ancestors and nonadjacent wildcard conflicts', () => {
  for (const [a, b] of [['src/same.ts', 'src/same.ts'], ['src/feature/', 'src/feature/deep/file.ts'], ['src/**/model.ts', 'src/room/model.ts']]) {
    assert.match(ownershipErrors([task('A', [], [a]), task('between', [], ['src/intermediate.ts']), task('B', [], [b])]).join('\n'), /overlap/);
  }
  assert.deepEqual(ownershipErrors([task('A', [], ['src/a']), task('B', [], ['src/another'])]), []);
  assert.deepEqual(ownershipErrors([task('A', [], ['src/a', 'src/a/file.ts'])]), []);
});
test('first-day list must be dependency-closed with unique known IDs and requested count', () => {
  const tasks = [task('A'), task('B', ['A']), task('C', ['B'])];
  assert.deepEqual(firstDayErrors(tasks, ['A', 'B', 'C'], 3), []);
  assert.match(firstDayErrors(tasks, ['B', 'C'], 3).join('\n'), /omitted A/);
  assert.match(firstDayErrors(tasks, ['A', 'A', 'missing']).join('\n'), /duplicate[\s\S]*does not exist/);
  assert.match(firstDayErrors(tasks, 'A').join('\n'), /string list/);
});
test('Markdown verifies local targets, repeated anchors, same-file anchors and reference links', t => {
  const f = fixture(t);
  f.write('target.md', '# Heading\n# Heading\n<a id="manual"></a>\n');
  const text = '# Self\n[one](target.md#heading) [two](target.md#heading-1) [manual](target.md#manual) [self](#self)\n[ref]: target.md#heading\n';
  f.write('README.md', text);
  assert.deepEqual(markdownErrors(f.root, join(f.root, 'README.md'), text), []);
  const errors = markdownErrors(f.root, join(f.root, 'README.md'), '[bad](target.md#missing) [gone](absent.md) [self](#missing)');
  assert.equal(errors.length, 3); assert.match(errors.join('\n'), /anchor/); assert.match(errors.join('\n'), /missing local link/);
});
test('fenced examples do not become links; malformed fences are reported', t => {
  const f = fixture(t), path = f.write('README.md', '');
  assert.deepEqual(markdownErrors(f.root, path, '```md\n[x](future.md)\n```\n'), []);
  assert.deepEqual(markdownErrors(f.root, path, '~~~~\n```\n[x](future.md)\n~~~~\n'), []);
  assert.match(markdownErrors(f.root, path, '```\n[x](future.md)').join('\n'), /unclosed/);
});
test('local links reject traversal, malformed encoding, wildcards and escaping symlinks', t => {
  const f = fixture(t), outside = fixture(t), path = f.write('README.md', '');
  symlinkSync(outside.root, join(f.root, 'outside'));
  const errors = markdownErrors(f.root, path, '[escape](../elsewhere) [link](outside/design.md) [bad](%ZZ.md) [glob](src/*.md)');
  assert.equal(errors.length, 4);
  assert.match(errors.join('\n'), /escapes/); assert.match(errors.join('\n'), /encoding/); assert.match(errors.join('\n'), /glob/);
  assert.deepEqual(markdownErrors(f.root, path, '[remote](https://example.com/page) [mail](mailto:test@example.com)'), []);
});
test('model IDs reject contributor and unsupported capabilities recursively', () => {
  assert.deepEqual(modelPolicyErrors({ nested: [{ model: 'muse-voice-transcribe-1.0' }] }), []);
  assert.equal(modelPolicyErrors({ nested: [{ model: 'muse-spark-1.3-contributor' }, { model: 'muse-voice-generate-1.0' }] }).length, 2);
});
test('complete small fixture validates with exact topology statistics', t => {
  const f = fixture(t), report = f.check();
  assert.deepEqual(report.errors, []);
  assert.equal(report.stats.tasks, 2); assert.equal(report.stats.components, 32); assert.equal(report.stats.rounds, 10); assert.equal(report.stats.dependency_edges, 1);
});
test('malformed JSON, component shape and task shape fail instead of crashing', t => {
  const f = fixture(t);
  for (const content of ['{', JSON.stringify({ tasks: [], components: null }), JSON.stringify({ tasks: [null], components: [] })]) {
    f.write('backlog/index.json', content); assert.ok(f.check().errors.length);
  }
  f.json('backlog/index.json', { ...f.index, tasks: [{ ...task('A'), dependencies: 7 }, task('B')] });
  assert.match(f.check().errors.join('\n'), /dependencies must be/);
});
test('component inventory, titles, counts and first-day flags are independently checked', t => {
  const f = fixture(t);
  f.json('backlog/index.json', { ...f.index, schema_version: 2, task_count: 9,
    tasks: [task('A'), { ...task('B'), title: ' a ', first_day: false }],
    components: f.index.components.map(c => c.code === 'R10' ? { ...c, code: 'R09' } : c) });
  const errors = f.check().errors.join('\n');
  for (const pattern of [/schema_version/, /count mismatch/, /Duplicate component/, /R01 through R10/, /Duplicate title/, /first_day flag/]) assert.match(errors, pattern);
});
test('task cards and design references must resolve to in-repo files', t => {
  const f = fixture(t), outside = fixture(t);
  symlinkSync(outside.root, join(f.root, 'external'));
  f.json('backlog/index.json', { ...f.index, tasks: [{ ...task('A'), design: 'external/design.md', card_path: '/outside' }, { ...task('B'), component: 'unknown' }] });
  const errors = f.check().errors.join('\n');
  assert.match(errors, /unsafe design/); assert.match(errors, /unsafe task card/); assert.match(errors, /unknown component/);
});
test('model policy requires Standard mode, server secrets and redacted transcripts', t => {
  const f = fixture(t);
  for (const change of [{ dataMode: 'contributor' }, { liveCallsRequireServerSecret: false }, { rawTranscriptLogging: true }]) {
    f.json('config/model-policy.json', { ...f.policy, ...change }); assert.match(f.check().errors.join('\n'), /Model policy requires/);
  }
  rmSync(join(f.root, 'config/model-policy.json'));
  assert.match(f.check().errors.join('\n'), /Missing or unsafe model policy/);
});
test('policy and index symlinks cannot bypass checks or read an external tree', t => {
  const f = fixture(t), outside = fixture(t);
  rmSync(join(f.root, 'config/model-policy.json'));
  f.json('policy.payload', { ...f.policy, dataMode: 'contributor' });
  symlinkSync(join(f.root, 'policy.payload'), join(f.root, 'config/model-policy.json'));
  assert.match(f.check().errors.join('\n'), /Model policy requires/);
  rmSync(join(f.root, 'backlog/index.json')); symlinkSync(join(outside.root, 'backlog/index.json'), join(f.root, 'backlog/index.json'));
  assert.deepEqual(f.check().errors, ['Missing or unsafe backlog/index.json']);
});
test('secret scanning redacts values and ignores local logs and dependency trees', t => {
  const f = fixture(t), syntheticToken = ['gh', 'p_', 'A'.repeat(36)].join('');
  f.write('bad.txt', syntheticToken);
  const errors = f.check().errors.join('\n'); assert.match(errors, /possible committed GitHub token/); assert.ok(!errors.includes(syntheticToken));
  rmSync(join(f.root, 'bad.txt'));
  f.write('node_modules/package/bad.txt', syntheticToken); f.write('orchestration/local-logs/log.txt', syntheticToken);
  f.write('orchestration/.taskctl-transaction.json', '{incomplete');
  assert.deepEqual(f.check().errors, []);
});
test('CLI has real failure exit codes and JSON reports without state mutations', t => {
  const f = fixture(t), cli = join(REPO, 'tools/validate-plan.mts');
  const args = [cli, '--root', f.root, '--expected-tasks', '2', '--expected-first-day', '2', '--json'];
  const before = readFileSync(join(f.root, 'backlog/index.json'), 'utf8');
  let result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).ok, true);
  assert.equal(readFileSync(join(f.root, 'backlog/index.json'), 'utf8'), before);
  rmSync(join(f.root, 'A.md'));
  result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).ok, false);
  result = spawnSync(process.execPath, [cli, '--expected-tasks', 'NaN'], { encoding: 'utf8' }); assert.equal(result.status, 2);
});
test('published backlog passes complete TypeScript validation', () => {
  const report = validate(REPO);
  assert.deepEqual(report.errors, []); assert.equal(report.stats.tasks, 2056); assert.equal(report.stats.dependency_edges, 3897);
});
