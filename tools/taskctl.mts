#!/usr/bin/env node
/** Read/verify migration entrypoint. Queue mutations remain in the legacy CLI
 * until its lock and interrupted-write protocol have been migrated together. */
import { globSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

export class TaskError extends Error {}
export const ACTIVE = new Set(['dispatched', 'leased', 'in_progress', 'implemented', 'review_pending', 'needs_review']);
const STATUSES = new Set(['pending', 'done', 'blocked', 'failed', ...ACTIVE]);
type Task = {
  id: string; owned_paths: string[]; dependencies: string[];
  required_outputs?: string[]; verification_commands?: string[][];
  verification_cwd?: string; first_day?: boolean; wave?: number; priority?: string;
  [key: string]: unknown;
};
type Progress = { status: string; lease_expires_at?: string; [key: string]: unknown };
type State = { revision?: number; tasks: Record<string, Progress> };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(x => typeof x === 'string' && x.length > 0);
}
function readJSON(path: string): unknown {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new TaskError(`Cannot read JSON: ${path}`); }
}
export function pathParts(value: unknown): string[] {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') ||
      isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.split('/').includes('..')) {
    throw new TaskError(`Invalid or escaping repository-relative path: ${String(value)}`);
  }
  return value.split('/').filter(part => part !== '' && part !== '.');
}

// Support the catalogue's *, ?, [] and ** ownership syntax. Two globs use
// conservative literal-prefix overlap; ambiguous intersections reserve the path.
function segmentRegex(pattern: string): RegExp {
  let expression = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') expression += '.*';
    else if (c === '?') expression += '.';
    else if (c === '[') {
      const end = pattern.indexOf(']', i + (pattern[i + 1] === '!' ? 2 : 1));
      if (end === -1) expression += '\\[';
      else {
        const body = pattern.slice(i + 1, end);
        expression += '[' + (body.startsWith('!') ? '^' + body.slice(1) : body.replace(/^\^/, '\\^')) + ']';
        i = end;
      }
    } else expression += c.replace(/[\\^$+?.()|{}\[\]]/g, '\\$&');
  }
  try { return new RegExp(`^${expression}$`); }
  catch { throw new TaskError(`Invalid ownership glob: ${pattern}`); }
}
function segmentsOverlap(a: string, b: string): boolean {
  const wildcard = /[*?\[]/;
  if (!wildcard.test(a)) return segmentRegex(b).test(a);
  if (!wildcard.test(b)) return segmentRegex(a).test(b);
  const ap = a.split(wildcard)[0], bp = b.split(wildcard)[0];
  return ap.startsWith(bp) || bp.startsWith(ap);
}
export function pathsConflict(left: string, right: string): boolean {
  const a = pathParts(left), b = pathParts(right), memo = new Map<string, boolean>();
  function overlap(i: number, j: number): boolean {
    const key = `${i}:${j}`;
    if (memo.has(key)) return memo.get(key)!;
    const result = i === a.length || j === b.length ? true
      : a[i] === '**' ? overlap(i + 1, j) || overlap(i, j + 1)
      : b[j] === '**' ? overlap(i, j + 1) || overlap(i + 1, j)
      : segmentsOverlap(a[i], b[j]) && overlap(i + 1, j + 1);
    memo.set(key, result);
    return result;
  }
  return overlap(0, 0);
}
function conflicts(a: Task, b: Task): boolean {
  return a.owned_paths.some(x => b.owned_paths.some(y => pathsConflict(x, y)));
}
function inside(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}
function leaseTime(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new TaskError('Lease timestamp must be ISO-8601 with timezone');
  }
  return Date.parse(value);
}

export class TaskRepository {
  readonly root: string;
  constructor(root: string) { this.root = realpathSync(root); }
  load(): { tasks: Map<string, Task>; state: State } {
    const index = readJSON(resolve(this.root, 'backlog/index.json'));
    const rawState = readJSON(resolve(this.root, 'orchestration/state.json'));
    if (!object(index) || !Array.isArray(index.tasks) || !object(rawState) || !object(rawState.tasks)) {
      throw new TaskError('Expected index tasks array and state tasks map');
    }
    const tasks = new Map<string, Task>();
    for (const raw of index.tasks) {
      if (!object(raw) || typeof raw.id !== 'string' || !raw.id || tasks.has(raw.id)) throw new TaskError('Invalid or duplicate task ID');
      if (!strings(raw.owned_paths) || !raw.owned_paths.length) throw new TaskError(`${raw.id}: owned_paths must be nonempty`);
      raw.owned_paths.forEach(pathParts);
      const deps = raw.dependencies ?? [];
      if (!strings(deps) || new Set(deps).size !== deps.length) throw new TaskError(`${raw.id}: invalid dependencies`);
      if (raw.first_day !== undefined && typeof raw.first_day !== 'boolean') throw new TaskError('Invalid first_day');
      if (raw.wave !== undefined && (typeof raw.wave !== 'number' || !Number.isFinite(raw.wave))) throw new TaskError('Invalid wave');
      if (raw.priority !== undefined && typeof raw.priority !== 'string') throw new TaskError('Invalid priority');
      tasks.set(raw.id, { ...raw, dependencies: deps } as Task);
    }
    const degrees = new Map<string, number>(), children = new Map<string, string[]>();
    for (const id of tasks.keys()) children.set(id, []);
    for (const task of tasks.values()) {
      degrees.set(task.id, task.dependencies.length);
      for (const dep of task.dependencies) {
        if (!tasks.has(dep)) throw new TaskError(`${task.id}: unknown dependency ${dep}`);
        children.get(dep)!.push(task.id);
      }
    }
    const roots = [...tasks.keys()].filter(id => degrees.get(id) === 0);
    for (let cursor = 0; cursor < roots.length; cursor++) {
      for (const child of children.get(roots[cursor])!) {
        degrees.set(child, degrees.get(child)! - 1);
        if (degrees.get(child) === 0) roots.push(child);
      }
    }
    if (roots.length !== tasks.size) throw new TaskError('Dependency graph contains a cycle');
    for (const [id, progress] of Object.entries(rawState.tasks)) {
      if (!object(progress) || typeof progress.status !== 'string' || !STATUSES.has(progress.status)) throw new TaskError(`${id}: invalid status`);
      if (!tasks.has(id) && ACTIVE.has(progress.status)) throw new TaskError(`Unknown active task: ${id}`);
      if (progress.lease_expires_at !== undefined) {
        if (typeof progress.lease_expires_at !== 'string') throw new TaskError(`${id}: invalid lease`);
        leaseTime(progress.lease_expires_at);
      }
    }
    return { tasks, state: rawState as State };
  }
  progress(state: State, id: string): Progress { return state.tasks[id] ?? { status: 'pending', attempts: 0 }; }
  select(tasks: Map<string, Task>, state: State, limit: number): Task[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new TaskError('--limit must be between 1 and 5');
    const active = [...tasks.values()].filter(t => ACTIVE.has(this.progress(state, t.id).status));
    const capacity = Math.min(limit, Math.max(0, 5 - active.length)), selected: Task[] = [];
    const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
    const ordered = [...tasks.values()].sort((a, b) => Number(!a.first_day) - Number(!b.first_day)
      || (a.wave ?? 999999) - (b.wave ?? 999999) || compare(a.priority ?? 'P9', b.priority ?? 'P9') || compare(a.id, b.id));
    for (const task of ordered) {
      if (selected.length >= capacity) break;
      if (this.progress(state, task.id).status !== 'pending' || task.dependencies.some(id => this.progress(state, id).status !== 'done')) continue;
      if ([...active, ...selected].some(other => conflicts(task, other))) continue;
      selected.push(task);
    }
    return selected;
  }
  ready(limit = 5): Task[] { const { tasks, state } = this.load(); return this.select(tasks, state, limit); }
  show(id: string) {
    const { tasks, state } = this.load(), task = tasks.get(id);
    if (!task) throw new TaskError(`Unknown task: ${id}`);
    return { task, progress: this.progress(state, id) };
  }
  status(now = Date.now()) {
    const { tasks, state } = this.load(), counts: Record<string, number> = {}, expired: string[] = [];
    for (const id of tasks.keys()) {
      const p = this.progress(state, id);
      counts[p.status] = (counts[p.status] ?? 0) + 1;
      if (ACTIVE.has(p.status) && p.status !== 'needs_review' && p.lease_expires_at && leaseTime(p.lease_expires_at) <= now) expired.push(id);
    }
    return { total: tasks.size, revision: state.revision ?? 0, counts, expired_active_ids: expired, ready_ids: this.select(tasks, state, 5).map(t => t.id) };
  }
  verify(id: string, timeout = 300) {
    if (!Number.isFinite(timeout) || timeout <= 0) throw new TaskError('--timeout must be positive');
    const { task } = this.show(id), outputs = task.required_outputs ?? [];
    if (!strings(outputs)) throw new TaskError(`${id}: invalid required_outputs`);
    const missing: string[] = [];
    for (const output of outputs) {
      pathParts(output);
      const matches = globSync(output, { cwd: this.root });
      if (!matches.length) missing.push(output);
      for (const match of matches) {
        if (!inside(this.root, realpathSync(resolve(this.root, match)))) throw new TaskError(`Required output resolves outside repository: ${output}`);
      }
    }
    if (missing.length) throw new TaskError(`${id}: missing required outputs: ${missing.join(', ')}`);
    const commands = task.verification_commands;
    if (!Array.isArray(commands) || !commands.length) throw new TaskError(`${id}: no executable verification_commands`);
    const cwdInput = task.verification_cwd ?? '.';
    pathParts(cwdInput);
    let cwd: string;
    try { cwd = realpathSync(resolve(this.root, cwdInput)); }
    catch { throw new TaskError(`${id}: invalid or missing verification cwd`); }
    if (!inside(this.root, cwd) || !statSync(cwd).isDirectory()) throw new TaskError(`${id}: invalid verification cwd`);
    // Validate every command before executing any of them. Never infer shell
    // semantics from strings; existing published cards already use argv arrays.
    for (const argv of commands) {
      if (!strings(argv) || !argv.length) throw new TaskError('Verification commands must be nonempty argv arrays');
      if (argv.some(arg => ['taskctl.py', 'taskctl.mts'].includes(basename(arg))) && argv.includes('verify')) throw new TaskError('Recursive taskctl verify is not verification');
      if (argv.some(arg => ['&&', '||', ';', '|', '>', '>>'].includes(arg))) throw new TaskError('Shell pipelines are not verification commands');
    }
    const results = [];
    for (const argv of commands) {
      const result = spawnSync(argv[0], argv.slice(1), { cwd, shell: false, encoding: 'utf8', timeout: timeout * 1000, maxBuffer: 8 * 1024 * 1024 });
      if (result.error) throw new TaskError(`${id}: verification process error: ${result.error.message}`);
      const entry = { argv, cwd, returncode: result.status, stdout: (result.stdout ?? '').slice(-12000), stderr: (result.stderr ?? '').slice(-12000) };
      results.push(entry);
      if (result.status !== 0) throw new TaskError(`${id}: verification failed (${result.status ?? result.signal})\n${entry.stdout}\n${entry.stderr}`);
    }
    return { task_id: id, verified: true, commands: results, note: 'Local verification only; task status is unchanged.' };
  }
}

export function main(args: string[]): number {
  try {
    let root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    if (args[0] === '--root') { if (!args[1]) throw new TaskError('Missing --root value'); root = args[1]; args = args.slice(2); }
    const [command, ...rest] = args, repo = new TaskRepository(root);
    let result: unknown;
    if (command === 'status' && !rest.length) result = repo.status();
    else if (command === 'show' && rest.length === 1) result = repo.show(rest[0]);
    else if (command === 'ready' && (!rest.length || rest.length === 2 && rest[0] === '--limit')) {
      const tasks = repo.ready(rest.length ? Number(rest[1]) : 5);
      result = { task_ids: tasks.map(t => t.id), tasks };
    } else if (command === 'verify' && (rest.length === 1 || rest.length === 3 && rest[1] === '--timeout')) {
      result = repo.verify(rest[0], rest.length === 3 ? Number(rest[2]) : 300);
    } else if (command === 'dispatch' || command === 'ingest-review') {
      throw new TaskError('Mutation migration pending: use the existing Python orchestrator command; do not run two different state writers');
    } else throw new TaskError('Usage: node tools/taskctl.mts [--root DIR] status|show ID|ready [--limit 1..5]|verify ID [--timeout SECONDS]');
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) { console.error(`taskctl: ${error instanceof Error ? error.message : String(error)}`); return 2; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
