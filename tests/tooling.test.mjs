import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { checkPackage } from '../scripts/check-package.mjs';
import { packageFiles } from '../scripts/package-files.mjs';
import { prepare, grade } from '../scripts/eval.mjs';
import { handleEvent } from '../scripts/lib/runtime.mjs';
import { fixture, plugin } from './helpers.mjs';
test('package manifests and local references are consistent',()=>assert.deepEqual(checkPackage(),[]));
test('package inventory is sorted and excludes generated state',()=>{
 const items=packageFiles();assert(items.length>20);assert(items.every(x=>/^[0-9a-f]{64}$/.test(x.sha256)));assert(!items.some(x=>x.path.startsWith('.evals/')));
});
test('plan mode still receives startup guidance without turn state',t=>{
 const f=fixture(t);const out=handleEvent(f.event('SessionStart',{permission_mode:'plan'}),f.env);assert(out.hookSpecificOutput.additionalContext.includes('standing maintenance duties'));
 assert.deepEqual(fs.readdirSync(f.data),[]);
});
test('eval preparation makes isolated baselines; grader rejects unchanged implementation',t=>{
 const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'rk-eval-test-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const out=path.join(dir,'new');const p=prepare(out);assert.equal(p.cases,6);assert.equal(p.modelInvocations,0);assert.throws(()=>prepare(out),/overwrite/);
 const g=grade(out);assert.equal(g.objectiveStatus,'failed');assert.equal(g.semanticStatus,'pending');assert.equal(g.modelBehaviorValidated,false);
 assert.equal(g.results.find(x=>x.id==='discussion-only').objectiveStatus,'passed');
 assert.equal(g.results.find(x=>x.id==='documented-default').objectiveStatus,'failed');
});
test('native smoke reports missing binary as skipped, not passed',()=>{
 const r=spawnSync(process.execPath,[path.join(plugin,'scripts/codex-smoke.mjs')],{encoding:'utf8',env:{...process.env,RK_CODEX_BIN:path.join(os.tmpdir(),'rk-intentionally-missing-codex')}});
 assert.equal(r.status,2);const report=JSON.parse(r.stdout);assert.equal(report.status,'skipped');assert.equal(report.nativeHookExecution,'not-run');
});

test('native discovery reports a closed server stdin without crashing', { skip: process.platform === 'win32' }, t => {
 const f = fixture(t), fake = path.join(f.home, 'fake-codex');
 const source = `#!${process.execPath}\nconst fs=require('node:fs');process.stdin.once('data', chunk => {const request=JSON.parse(chunk.toString().trim());fs.closeSync(0);process.stdout.write(JSON.stringify({id:request.id,result:{codexHome:process.env.CODEX_HOME}})+'\\n');});setInterval(()=>{},1000);\n`;
 fs.writeFileSync(fake, source, { mode: 0o700 });
 const probe = new URL('../scripts/lib/codex-probe.mjs', import.meta.url).href;
 const run = `import {inspectInstalled} from ${JSON.stringify(probe)};try {await inspectInstalled(process.argv[1], {...process.env,CODEX_HOME:process.argv[2]}, process.argv[2], process.argv[2]);process.exitCode=2;} catch(e) {console.log('EXPECTED:'+e.message);}`;
 const r = spawnSync(process.execPath, ['--input-type=module', '-e', run, fake, f.home], { encoding: 'utf8', timeout: 10000 });
 assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /EXPECTED:/);
});

for (const mode of ['unterminated-output', 'ignore-termination']) test(`native discovery contains ${mode}`, { skip: process.platform === 'win32' }, t => {
 const f = fixture(t), fake = path.join(f.home, 'fake-codex'), pidFile = path.join(f.home, 'pid');
 const action = mode === 'unterminated-output'
  ? "process.stdout.write(Buffer.alloc(2*1024*1024+1, 120));"
  : "process.on('SIGTERM',()=>{});process.stdout.write('not-json\\n');";
 fs.writeFileSync(fake, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(pidFile)},String(process.pid));process.stdin.once('data',()=>{${action}});setInterval(()=>{},1000);\n`, { mode: 0o700 });
 const probe = new URL('../scripts/lib/codex-probe.mjs', import.meta.url).href;
 const run = `import {inspectInstalled} from ${JSON.stringify(probe)};try {await inspectInstalled(process.argv[1], {...process.env,CODEX_HOME:process.argv[2]}, process.argv[2], process.argv[2]);process.exitCode=2;} catch(e) {console.log('EXPECTED:'+e.message);}`;
 const r = spawnSync(process.execPath, ['--input-type=module', '-e', run, fake, f.home], { encoding: 'utf8', timeout: 10000 });
 assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, mode === 'unterminated-output' ? /exceeded budget/ : /Invalid JSON/);
 const pid = Number(fs.readFileSync(pidFile, 'utf8'));
 assert.throws(() => process.kill(pid, 0), error => error.code === 'ESRCH');
});

test('package checker accepts CRLF skill frontmatter', t => {
 const f = fixture(t), copy = path.join(f.home, 'crlf-plugin');
 fs.cpSync(plugin, copy, { recursive: true, filter: source => path.basename(source) !== '.git' });
 for (const skill of ['repo-knowledge', 'repo-knowledge-setup']) {
  const file = path.join(copy, 'skills', skill, 'SKILL.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\r?\n/g, '\r\n'));
 }
 assert.deepEqual(checkPackage(copy), []);
});
