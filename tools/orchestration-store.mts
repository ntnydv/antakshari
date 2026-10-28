/** Single-checkout transaction journal. GitHub concurrency still needs a ref lease. */
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  realpathSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { hostname } from 'node:os';

export const LOCK = 'orchestration/.taskctl-write.lock';
export const JOURNAL = 'orchestration/.taskctl-transaction.json';
export type Write = { path: string; value: unknown };
type Entry = { path: string; before: string | null; after: string; content: string };
function digest(content: string): string { return createHash('sha256').update(content).digest('hex'); }
function current(path: string): string | null { return existsSync(path) ? digest(readFileSync(path, 'utf8')) : null; }
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function safePath(root: string, path: string): string {
  if (![LOCK, JOURNAL, `${LOCK}/owner.json`, `${LOCK}/recovery.lock`].includes(path) &&
      !/^orchestration\/(state\.json|queue\.json|batches\/[A-Za-z0-9][A-Za-z0-9._-]{0,79}\.json)$/.test(path)) {
    throw new Error(`Invalid orchestration store path: ${path}`);
  }
  const target = resolve(root, path);
  // Do not follow a symlink in any store path, including a dangling symlink.
  for (let cursor = target; cursor !== root; cursor = dirname(cursor)) {
    const rel = relative(root, cursor);
    if (rel === '..' || rel.startsWith(`..${sep}`)) throw new Error('Store path escapes checkout');
    try { if (lstatSync(cursor).isSymbolicLink()) throw new Error(`Symlink in orchestration store: ${path}`); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return target;
}
function atomicText(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.taskctl-${randomUUID()}.tmp`);
  const fd = openSync(temporary, 'wx', 0o600);
  try { writeFileSync(fd, content, 'utf8'); fsyncSync(fd); }
  finally { closeSync(fd); }
  try { renameSync(temporary, path); }
  finally { if (existsSync(temporary)) unlinkSync(temporary); }
  // Directory fsync is supported on POSIX. Windows directory handles cannot be
  // opened this way; the protocol guarantees process-interruption recovery,
  // not storage-hardware or OS power-loss durability on every platform.
  if (process.platform !== 'win32') {
    const dir = openSync(dirname(path), 'r');
    try { fsyncSync(dir); } finally { closeSync(dir); }
  }
}
export function assertReadable(root: string): void {
  if (existsSync(safePath(root, LOCK)) || existsSync(safePath(root, JOURNAL))) {
    throw new Error('Orchestration write or recovery pending; do not dispatch from a partial snapshot');
  }
}
export function withStoreLock<T>(rootInput: string, callback: () => T): T {
  const root = realpathSync(rootInput), lock = safePath(root, LOCK);
  mkdirSync(dirname(lock), { recursive: true });
  try { mkdirSync(lock); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Orchestration writer lock exists; inspect its owner, never reclaim by age');
    throw error;
  }
  const owner = { token: randomUUID(), pid: process.pid, hostname: hostname(), created_at: new Date().toISOString() };
  try {
    atomicText(safePath(root, `${LOCK}/owner.json`), JSON.stringify(owner) + '\n');
    return callback();
  } finally {
    // A mismatched lock belongs to somebody else. Never remove it.
    const path = safePath(root, `${LOCK}/owner.json`);
    if (existsSync(path) && JSON.parse(readFileSync(path, 'utf8')).token === owner.token) {
      unlinkSync(path); rmdirSync(lock);
    }
  }
}
export function recoverLock(rootInput: string, expectedToken: string): { recovered: true } {
  const root = realpathSync(rootInput), lock = safePath(root, LOCK), ownerPath = safePath(root, `${LOCK}/owner.json`);
  // Serialize explicit recovery attempts inside the existing lock directory.
  // A crashed recovery marker also requires review; never remove it by age.
  const recoveryPath = safePath(root, `${LOCK}/recovery.lock`);
  const recoveryFd = openSync(recoveryPath, 'wx');
  let removeDirectory = false;
  try {
  const original = readFileSync(ownerPath, 'utf8');
  const owner: unknown = JSON.parse(original);
  if (!object(owner) || owner.token !== expectedToken || typeof expectedToken !== 'string' || !expectedToken ||
      owner.hostname !== hostname() || !Number.isSafeInteger(owner.pid) || (owner.pid as number) <= 0) {
    throw new Error('Lock owner/token cannot be verified on this host; manual review required');
  }
  try { process.kill(owner.pid as number, 0); throw new Error('Lock owner process is still live; no recovery performed'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error; }
  // No automatic timeout reclamation. PID reuse and EPERM both fail closed.
  // The lock directory remains present until removal, excluding new writers.
  if (readFileSync(ownerPath, 'utf8') !== original) throw new Error('Lock owner changed; retry inspection');
  unlinkSync(ownerPath); removeDirectory = true;
  } finally {
    closeSync(recoveryFd); unlinkSync(recoveryPath);
    if (removeDirectory) rmdirSync(lock);
  }
  return { recovered: true };
}
function validateEntries(root: string, raw: unknown): Entry[] {
  if (!Array.isArray(raw) || !raw.length) throw new Error('Invalid transaction entries');
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!object(entry) || typeof entry.path !== 'string' || seen.has(entry.path) || typeof entry.content !== 'string' ||
        !(entry.before === null || typeof entry.before === 'string' && /^[a-f0-9]{64}$/.test(entry.before)) ||
        entry.after !== digest(entry.content)) throw new Error('Invalid transaction entry');
    if (entry.path === LOCK || entry.path === JOURNAL || entry.path.startsWith(LOCK + '/')) throw new Error('Transaction cannot replace lock or journal');
    safePath(root, entry.path); JSON.parse(entry.content); seen.add(entry.path);
  }
  return raw as Entry[];
}
export function recoverTransaction(root: string): boolean {
  const journal = safePath(root, JOURNAL);
  if (!existsSync(journal)) return false;
  const raw: unknown = JSON.parse(readFileSync(journal, 'utf8'));
  if (!object(raw) || raw.version !== 1) throw new Error('Invalid transaction journal');
  const entries = validateEntries(root, raw.entries);
  // Compare every path before writing any: never overwrite an external edit.
  for (const entry of entries) {
    const hash = current(safePath(root, entry.path));
    if (hash !== entry.before && hash !== entry.after) throw new Error(`Recovery conflict: ${entry.path}; preserve journal and reconcile`);
  }
  for (const entry of entries) {
    const path = safePath(root, entry.path);
    if (current(path) !== entry.after) atomicText(path, entry.content);
  }
  unlinkSync(journal);
  return true;
}
export function transact(root: string, writes: Write[]): void {
  if (existsSync(safePath(root, JOURNAL))) throw new Error('Recover the pending transaction before writing');
  const entries = validateEntries(root, writes.map(write => {
    const content = JSON.stringify(write.value, null, 2) + '\n';
    return { path: write.path, before: current(safePath(root, write.path)), after: digest(content), content };
  }));
  atomicText(safePath(root, JOURNAL), JSON.stringify({ version: 1, entries }) + '\n');
  recoverTransaction(root);
}
