import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { schemas } from './schemas.generated.js';
import type { ContractByName, ContractName, Command, Snapshot, Adjudication } from './generated.js';

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: false, validateFormats: true });
// ajv-formats uses export=; NodeNext interop exposes its callable default.
(addFormats as unknown as (instance: Ajv2020) => void)(ajv);
for (const schema of Object.values(schemas)) ajv.addSchema(schema);
export class ContractError extends Error {
  constructor(readonly contract: string, readonly issues: ReadonlyArray<string>) {
    super(`Invalid ${contract}: ${issues.join('; ')}`);
    this.name = 'ContractError';
  }
}
export function assertJson(value: unknown): void {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return;
  if (Array.isArray(value)) { value.forEach(assertJson); return; }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    Object.values(value).forEach(assertJson); return;
  }
  throw new ContractError('JSON', ['Only finite safe integers, strings, booleans, null, arrays and plain objects are supported']);
}
function semantics(name: string, input: unknown): void {
  const v = input as Record<string, any>;
  const fail = (reason: string): never => { throw new ContractError(name,[reason]); };
  if (name === 'command') {
    if (!['room.create','room.join'].includes(v.type) && v.roomId === null) fail('Existing-room command requires roomId');
    if (['match.','cue.','answer.','hint.','review.'].some(prefix => v.type.startsWith(prefix)) && v.type !== 'match.start' && v.matchId === null) fail('Match command requires matchId');
    if (!['room.create','room.join','match.resume'].includes(v.type) && v.expectedVersion === null) fail('Mutation requires expectedVersion');
  }
  if (name === 'transcript-evidence') {
    if (v.mode === 'PUSH_TO_TALK' && v.turns !== undefined) fail('PUSH_TO_TALK does not provide turn spans');
    if (v.captureTiming && v.captureTiming.endAtMs < v.captureTiming.startAtMs) fail('Application capture end precedes start');
  }
  if (name === 'model-evidence') {
    if (v.relation === 'MATCH' && (v.candidateId === null || v.insufficientEvidence)) fail('MATCH needs candidate and sufficient evidence');
    if (v.relation === 'INSUFFICIENT' && !v.insufficientEvidence) fail('INSUFFICIENT must flag insufficientEvidence');
  }
  if (name === 'command-receipt') {
    if ((v.status === 'rejected') !== (v.error !== null)) fail('Rejected receipt requires error; applied receipt forbids it');
    if (v.expiresAtMs < v.createdAtMs) fail('Receipt expiry precedes creation');
  }
  if (name === 'room-projection') {
    if (v.mode === '1v1' && (v.members.length > 2 || v.preset === 'marathon10')) fail('1v1 capacity/preset mismatch');
    if (new Set(v.members.map((m: any) => m.uid)).size !== v.members.length) fail('Duplicate member UID');
    if (new Set(v.members.map((m: any) => m.seat)).size !== v.members.length) fail('Duplicate member seat');
  }
}
export function validate<N extends ContractName>(name: N, value: unknown): asserts value is ContractByName[N] {
  assertJson(value);
  const schema=schemas[name];
  if (!schema) throw new ContractError(String(name),['Unknown contract']);
  const check=ajv.getSchema(schema.$id as string);
  if (!check) throw new ContractError(name,['Schema not registered']);
  if (!check(value)) throw new ContractError(name, (check.errors || []).map(e => `${e.instancePath || '/'} ${e.keyword}`));
  semantics(name,value);
}
function immutable<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(immutable);
    Object.freeze(value);
  }
  return value;
}
export function decode<N extends ContractName>(name: N, value: unknown): ContractByName[N] {
  validate(name,value);
  return immutable(structuredClone(value));
}
export const decodeCommand = (value: unknown): Command => decode('command',value);
export const encodeSnapshot = (value: Snapshot): string => { validate('snapshot',value); return JSON.stringify(value); };
export const validateAdjudication = (value: unknown): Adjudication => decode('adjudication',value);
export function validateAllSchemas(): number {
  for (const [name,schema] of Object.entries(schemas)) {
    if (!ajv.validateSchema(schema)) throw new ContractError(name,['Invalid JSON Schema']);
    ajv.getSchema(schema.$id as string);
  }
  return Object.keys(schemas).length;
}
