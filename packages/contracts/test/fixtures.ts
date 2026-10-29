import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decode, decodeCommand, validateAllSchemas, ContractError, type ContractName, type Clock, type FeatureDescriptor, type MatchRepository } from '../src/index.js';
const corpus = JSON.parse(fs.readFileSync(new URL('../../fixtures/golden.json',import.meta.url),'utf8')) as { fixtures: {id:string; schema:ContractName; valid:boolean; value:unknown}[] };
assert.equal(validateAllSchemas(),17);
assert.equal(new Set(corpus.fixtures.map(f => f.id)).size,corpus.fixtures.length);
const results = corpus.fixtures.map(f => {
  let roundTrip: unknown;
  let valid = false;
  try { roundTrip=decode(f.schema,f.value); valid=true; }
  catch (error) { if (!(error instanceof ContractError)) throw error; }
  assert.equal(valid,f.valid,`Expected validity for ${f.id}`);
  if (valid) assert.deepEqual(roundTrip,f.value,`Roundtrip ${f.id}`);
  return { id:f.id, valid, ...(valid ? {roundTrip} : {}) };
});
for (const schema of new Set(corpus.fixtures.map(f => f.schema))) {
  assert.ok(corpus.fixtures.some(f => f.schema === schema && f.valid));
  assert.ok(corpus.fixtures.some(f => f.schema === schema && !f.valid));
}
assert.equal(corpus.fixtures.filter(f => f.id.startsWith('config-R') && f.valid).length,10);
assert.equal(corpus.fixtures.filter(f => f.id.startsWith('command-') && f.valid).length,16);
const source=structuredClone(corpus.fixtures.find(f => f.id === 'command-answer.request')!.value) as any;
const command=decodeCommand(source);
source.payload.promptId='changed';
assert.equal(command.type,'answer.request');
if (command.type === 'answer.request') {
  assert.equal(command.payload.promptId,'prompt_fixture');
  assert.throws(() => Object.assign(command.payload,{promptId:'changed'}),TypeError);
}
assert.throws(() => decode('snapshot', {...(corpus.fixtures.find(f => f.id === 'snapshot-recording')!.value as any),serverNowMs:Infinity}),ContractError);
const clock:Clock={nowMs:()=>1793145600000};
const feature:FeatureDescriptor={id:'fixture_contract_consumer',requires:[],register:ports=>{assert.equal(ports.clock.nowMs(),clock.nowMs());}};
assert.equal(feature.id,'fixture_contract_consumer');
// A real Firestore adapter must be able to await reads inside its retried callback.
const trace: string[]=[];
const repository: MatchRepository={
  getSnapshot:async()=>null,
  transact:async(_matchId,_expectedVersion,operation)=>operation({
    readSnapshot:async()=>{ await Promise.resolve(); trace.push('snapshot'); return null; },
    findReceipt:async()=>{ await Promise.resolve(); trace.push('receipt'); return null; },
    putSnapshot:()=>{trace.push('write');},putReceipt:()=>{},appendEvent:()=>{},appendScore:()=>{},enqueue:()=>{},
  }),
};
const absent=await repository.transact('fixture',0,async tx=>{
  const snapshot=await tx.readSnapshot('fixture');
  const receipt=await tx.findReceipt('fixture','11111111-1111-4111-8111-111111111111');
  trace.push('observed');
  return snapshot===null && receipt===null;
});
assert.equal(absent,true);
assert.deepEqual(trace,['snapshot','receipt','observed']);
console.log(JSON.stringify(results));
