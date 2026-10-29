import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { root, packageRoot, generate } from './generate.mjs';
function run(command,args,options={}) {
  const result=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:10*1024*1024,...options});
  if(result.error) throw new Error(`BLOCKED: could not execute ${command}: ${result.error.message}`);
  if(result.status!==0) throw new Error(`${command} exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
try {
  assert.equal(process.versions.node.split('.')[0],'22','Node 22 is the pinned runtime');
  const tsc=path.join(packageRoot,'node_modules/typescript/bin/tsc');
  if(!fs.existsSync(tsc)) throw new Error('BLOCKED: run npm ci --ignore-scripts --workspaces=false inside packages/contracts first.');
  console.log(`Node ${process.version}; generated artifact check: ${generate(true)} files`);
  run(process.execPath,[tsc,'-p',path.join(packageRoot,'tsconfig.json')]);
  console.log('TypeScript strict compilation: passed');
  const ts=JSON.parse(run(process.execPath,[path.join(packageRoot,'dist/test/fixtures.js')]));
  console.log(`AJV draft 2020-12, 17 schemas, ${ts.length} TypeScript cases: passed`);
  const dart=process.env.CONTRACTS_DART || process.env.DART_BINARY || 'dart';
  console.log(run(dart,['--version']).trim());
  run(dart,['analyze','--fatal-infos'],{cwd:path.join(packageRoot,'dart')});
  console.log('Dart static analysis: passed');
  const dartCases=JSON.parse(run(dart,[path.join(packageRoot,'dart/test/fixtures.dart'),path.join(packageRoot,'fixtures/golden.json')]));
  assert.deepEqual(dartCases,ts,'Dart and TypeScript must agree on every validity and roundtrip result');
  console.log(`Dart/TypeScript exact fixture parity: ${ts.length} cases passed (${ts.filter(v=>v.valid).length} valid, ${ts.filter(v=>!v.valid).length} invalid)`);
  console.log('PASS: BOOT-004 contracts, schema validation, bindings, ports and fixture checks');
} catch(error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode=2;
}
