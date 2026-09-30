import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { checkPackage } from '../scripts/check-package.mjs';
import { packageFiles } from '../scripts/package-files.mjs';
import { prepare, grade, prepareContinuity, CASES, CONTINUITY_CASES } from '../scripts/eval.mjs';
import { fixture, directoryFixture, plugin } from './helpers.mjs';
test('package inventory sorts source files and excludes generated directories', t => {
 const f = directoryFixture(t);
 f.write('z-last.txt', 'last'); f.write('a-first.txt', 'first');
 for (const dir of ['.git', 'node_modules', '.evals', 'dist', 'coverage']) f.write(`${dir}/generated.txt`, 'excluded');
 const items = packageFiles(f.repo);
 assert.deepEqual(items.map(item => item.path), ['a-first.txt', 'app.js', 'z-last.txt']);
 assert.equal(items[0].bytes, 5);
 assert.equal(items[0].sha256, 'a7937b64b8caa58f03721bb6bacf5c78cb235febe0e70b1b84cd99541461a08e');
});
test('eval preparation makes isolated baselines; grader rejects unchanged implementation',t=>{
 const dir=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'rk-eval-test-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const out=path.join(dir,'new');const p=prepare(out);assert.equal(p.cases, CASES.length);assert.equal(p.modelInvocations,0);assert.throws(()=>prepare(out),/overwrite/);
 const g=grade(out);assert.equal(g.objectiveStatus,'failed');assert.equal(g.semanticStatus,'pending');assert.equal(g.modelBehaviorValidated,false);
 assert.equal(g.results.find(x=>x.id==='discussion-only').objectiveStatus,'passed');
 assert.equal(g.results.find(x=>x.id==='documented-default').objectiveStatus,'failed');
});
test('native smoke reports missing binary as skipped, not passed',()=>{
 const r=spawnSync(process.execPath,[path.join(plugin,'scripts/codex-smoke.mjs')],{encoding:'utf8',env:{...process.env,RK_CODEX_BIN:path.join(os.tmpdir(),'rk-intentionally-missing-codex')}});
 assert.equal(r.status,2);const report=JSON.parse(r.stdout);assert.equal(report.status,'skipped');assert.equal(report.nativeHookExecution,'not-run');
});

test('native discovery reports a closed server stdin without crashing', { skip: process.platform === 'win32' }, t => {
 const f = directoryFixture(t), fake = path.join(f.home, 'fake-codex');
 const source = `#!${process.execPath}\nconst fs=require('node:fs');process.stdin.once('data', chunk => {const request=JSON.parse(chunk.toString().trim());fs.closeSync(0);process.stdout.write(JSON.stringify({id:request.id,result:{codexHome:process.env.CODEX_HOME}})+'\\n');});setInterval(()=>{},1000);\n`;
 fs.writeFileSync(fake, source, { mode: 0o700 });
 const probe = new URL('../scripts/lib/codex-probe.mjs', import.meta.url).href;
 const run = `import {inspectInstalled} from ${JSON.stringify(probe)};try {await inspectInstalled(process.argv[1], {...process.env,CODEX_HOME:process.argv[2]}, process.argv[2], process.argv[2]);process.exitCode=2;} catch(e) {console.log('EXPECTED:'+e.message);}`;
 const r = spawnSync(process.execPath, ['--input-type=module', '-e', run, fake, f.home], { encoding: 'utf8', timeout: 10000 });
 assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /EXPECTED:/);
});

for (const mode of ['unterminated-output', 'ignore-termination']) test(`native discovery contains ${mode}`, { skip: process.platform === 'win32' }, t => {
 const f = directoryFixture(t), fake = path.join(f.home, 'fake-codex'), pidFile = path.join(f.home, 'pid');
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
 const f = directoryFixture(t), copy = path.join(f.home, 'crlf-plugin');
 fs.cpSync(plugin, copy, { recursive: true, filter: source => path.basename(source) !== '.git' });
 for (const skill of ['repo-knowledge', 'repo-knowledge-setup']) {
  const file = path.join(copy, 'skills', skill, 'SKILL.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\r?\n/g, '\r\n'));
 }
 assert.deepEqual(checkPackage(copy), []);
});

test('continuity preparation preserves ordinary prompts and exposes no fake acceptance', t => {
 const f = directoryFixture(t), out = path.join(f.home, 'continuity');
 const result = prepareContinuity(out);
 assert.equal(result.cases, CONTINUITY_CASES.length);
 assert.equal(result.stages, CONTINUITY_CASES.reduce((n, item) => n + item.stages.length, 0));
 assert.equal(result.modelInvocations, 0); assert.equal(result.semanticAcceptance, 'not-run');
 const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
 const retrieval = manifest.cases.find(item => item.id === 'later-decision-retrieval');
 assert.equal(retrieval.stages[1].session, 'fresh-with-repository-only');
 assert.ok(!/notes|ADR|旧决定|查阅.*记录/.test(retrieval.stages[1].prompt));
 assert.ok(!fs.existsSync(path.join(out, retrieval.id, 'AGENTS.md')), 'Do not substitute a pasted plugin bootstrap');
 const refresh = manifest.cases.find(item => item.id === 'existing-owners-and-rules-refresh');
 assert.match(refresh.stages[1].before.replaceFiles['src/AGENTS.md'], /RangeError/);
 assert.match(refresh.stages[2].before.replaceFiles['src/AGENTS.md'], /SyntaxError/);
 assert.throws(() => prepareContinuity(out), /overwrite/);
});

test('evaluation preparation ignores ambient Git repositories, templates and executable config', t => {
 const f = fixture(t), hooks = path.join(f.home, 'ambient-hooks'), template = path.join(f.home, 'ambient-template'), marker = path.join(f.home, 'hook-ran');
 fs.mkdirSync(hooks); fs.mkdirSync(template);
 fs.writeFileSync(path.join(hooks, 'post-index-change'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'ran');\n`, { mode: 0o700 });
 fs.writeFileSync(path.join(template, 'template-canary'), 'must not enter fixture');
 const before = f.git('rev-parse', 'HEAD');
 for (const mode of ['prepare', 'prepare-continuity']) {
  const out = path.join(f.home, mode);
  const r = spawnSync(process.execPath, [path.join(plugin, 'scripts/eval.mjs'), mode, '--out', out], { encoding: 'utf8', timeout: 20000, env: { ...process.env, GIT_DIR: path.join(f.repo, '.git'), GIT_WORK_TREE: f.repo, GIT_TEMPLATE_DIR: template, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.hooksPath', GIT_CONFIG_VALUE_0: hooks } });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).modelInvocations, 0);
  const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
  for (const item of manifest.cases) assert.ok(!fs.existsSync(path.join(out, item.id, '.git', 'template-canary')));
 }
 assert.ok(!fs.existsSync(marker)); assert.equal(f.git('rev-parse', 'HEAD'), before);
});
