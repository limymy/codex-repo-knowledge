import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fixture, plugin } from './helpers.mjs';
import { checkedPath, boundedRead, relativePath } from '../scripts/lib/io.mjs';
import { validateConfig, loadConfig } from '../scripts/lib/config.mjs';
import { parseStatus, snapshot, isSensitive, repositoryRoot } from '../scripts/lib/git.mjs';
import { stateKey, openStore, locked, readState } from '../scripts/lib/store.mjs';
import { handleEvent } from '../scripts/lib/runtime.mjs';

for (const value of ['../outside', '/tmp/out', 'C:/out', 'a\\b', 'a/../b', '.git/x', '', '.', 'a\nwrong']) test(`rejects unsafe configured path ${JSON.stringify(value)}`, () => { assert.throws(() => relativePath(value)); });
test('accepts Unicode relative configuration without interpolation', () => { assert.equal(relativePath('文档/决策'), '文档/决策'); });
test('unknown/prototype configuration keys are rejected', t => { const f = fixture(t); for (const text of ['{"stopRemider":"once"}', '{"constructor":1}', '{"__proto__":{}}']) assert.throws(() => validateConfig(JSON.parse(text), f.repo)); });
test('invalid config types and enums fail loudly', t => { const f = fixture(t); for (const cfg of [{version:2},{enabled:'true'},{stopReminder:true},{docsRoot:42},{docsRoot:'docs',notesRoot:'docs'}]) assert.throws(() => validateConfig(cfg, f.repo)); });
test('symlinked config is never read', t => {
  const f = fixture(t); const outside = path.join(f.home, 'outside.json'); fs.writeFileSync(outside, '{"enabled":false}'); fs.symlinkSync(outside, path.join(f.repo, '.repo-knowledge.json')); assert.throws(() => loadConfig(f.repo));
});
test('configured parent symlink cannot escape project', t => {
  const f = fixture(t); fs.symlinkSync(f.data, path.join(f.repo, 'docs'), process.platform === 'win32' ? 'junction' : 'dir'); assert.throws(() => validateConfig({}, f.repo));
});
test('bounded reads reject oversized data', t => { const f = fixture(t); f.write('large', '12345'); assert.throws(() => boundedRead(path.join(f.repo,'large'), 4)); });
test('bounded reads reject a final symlink', t => { const f = fixture(t); fs.symlinkSync(path.join(f.repo,'app.js'), path.join(f.repo,'link')); assert.throws(() => boundedRead(path.join(f.repo,'link'))); });
test('runtime data is never created inside the project', t => { const f = fixture(t); const target=path.join(f.repo,'runtime'); assert.throws(() => openStore(target,f.repo,{create:true})); assert.ok(!fs.existsSync(target)); });
test('runtime data directory cannot be a symlink', t => { const f = fixture(t); const target=path.join(f.home,'alias'); fs.symlinkSync(f.repo,target,process.platform === 'win32'?'junction':'dir'); assert.throws(() => openStore(target,f.repo,{create:true})); });
test('session and turn identifiers are hashed, not used as paths', t => { const f=fixture(t); const key=stateKey(f.repo,'../../escape','a/../b'); assert.match(key,/^[0-9a-f]{64}$/); });
test('concurrent state mutation fails open rather than overwriting another hook', t => { const f=fixture(t); const dir=openStore(f.data,f.repo,{create:true}); const key=stateKey(f.repo,'s','t'); locked(dir,key,()=>assert.throws(()=>locked(dir,key,()=>{}),/Concurrent/)); assert.deepEqual(fs.readdirSync(dir),[]); });
test('state symlink cannot redirect writes/reads', t => { const f=fixture(t); const dir=openStore(f.data,f.repo,{create:true}); const key=stateKey(f.repo,'s','t'); fs.symlinkSync(path.join(f.repo,'app.js'),path.join(dir,key+'.json')); assert.throws(()=>readState(dir,key)); });
test('git root discovery supports starting from nested directory', t => { const f=fixture(t); fs.mkdirSync(path.join(f.repo,'nested')); assert.equal(repositoryRoot(path.join(f.repo,'nested')),f.repo); });
test('status parser handles rename and spaces without shell parsing', () => { assert.deepEqual(parseStatus('R  new name\0old name\0?? file with spaces\0'),[{status:'R ',path:'new name',original:'old name'},{status:'??',path:'file with spaces'}]); });
test('malformed rename record is rejected',()=>assert.throws(()=>parseStatus('R  dest\0')));
test('deleted tracked file is detectable',t=>{const f=fixture(t); const before=snapshot(f.repo); fs.unlinkSync(path.join(f.repo,'app.js')); const after=snapshot(f.repo); assert.ok(after.complete); assert.notEqual(before.digest,after.digest);});
test('staged content is represented independently from worktree contents',t=>{const f=fixture(t); f.write('app.js','staged1'); f.git('add','app.js'); f.write('app.js','working'); const a=snapshot(f.repo); f.write('app.js','staged2'); f.git('add','app.js'); f.write('app.js','working'); const b=snapshot(f.repo); assert.notEqual(a.digest,b.digest);});
test('secret files use metadata without reading their bytes',t=>{const f=fixture(t); f.write('.env','S'.repeat(1048577)); const result=snapshot(f.repo); assert.ok(result.complete); assert.ok(isSensitive('.env')); assert.ok(isSensitive('keys/server.pem'));});
test('source symlink fingerprints its link instead of reading external target',t=>{const f=fixture(t); const external=path.join(f.home,'big');fs.writeFileSync(external,Buffer.alloc(1048577)); fs.symlinkSync(external,path.join(f.repo,'link')); assert.ok(snapshot(f.repo).complete);});
test('path count budget is enforced',t=>{const f=fixture(t); f.write('a','a');f.write('b','b');assert.equal(snapshot(f.repo,{maxPaths:1}).reason,'path-budget');});
test('total read budget is enforced',t=>{const f=fixture(t); f.write('a','aaaa');f.write('b','bbbb');assert.equal(snapshot(f.repo,{maxTotalBytes:7}).reason,'byte-budget');});
test('branch worktrees resolve and key separately',t=>{const f=fixture(t); const second=path.join(f.home,'other-worktree');f.git('worktree','add','-q','-b','separate',second); assert.equal(repositoryRoot(second),fs.realpathSync.native(second));assert.notEqual(stateKey(f.repo,'s','t'),stateKey(fs.realpathSync.native(second),'s','t'));});
test('CLI rejects unknown command without source changes',t=>{const f=fixture(t);const before=snapshot(f.repo);const r=spawnSync(process.execPath,[path.join(plugin,'scripts/rk.mjs'),'wrong'],{encoding:'utf8'});assert.equal(r.status,1);assert.deepEqual(snapshot(f.repo),before);});
test('hook subprocess protocol errors are JSON and nonblocking',t=>{const f=fixture(t);const r=spawnSync(process.execPath,[path.join(plugin,'scripts/hook.mjs')],{input:'{invalid',encoding:'utf8',env:f.env});assert.equal(r.status,0);const o=JSON.parse(r.stdout);assert.ok(o.systemMessage);assert.equal(o.decision,undefined);});

test('bounded reads reject FIFOs before opening them', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t); const fifo = path.join(f.home, 'pipe');
  const made = spawnSync('mkfifo', [fifo], { encoding: 'utf8', timeout: 1000 });
  assert.equal(made.status, 0, made.stderr);
  assert.throws(() => boundedRead(fifo), /non-regular/);
});

for (const kind of ['clean', 'process']) test(`snapshot never executes configured Git ${kind} filters`, t => {
  const f = fixture(t);
  f.write('.gitattributes', 'app.js filter=probe\n');
  f.git('add', '.'); f.git('commit', '-qm', 'filter fixture');
  const marker = path.join(f.home, 'filter-ran');
  const script = path.join(f.home, 'filter.cjs');
  fs.writeFileSync(script, "const fs=require('node:fs');fs.writeFileSync(process.argv[2],'ran');process.stdout.write(fs.readFileSync(0));\n");
  const command = `"${process.execPath.replaceAll('\\', '/')}" "${script.replaceAll('\\', '/')}" "${marker.replaceAll('\\', '/')}"`;
  f.git('config', `filter.probe.${kind}`, command);
  f.git('config', 'filter.probe.required', 'true');
  f.write('app.js', 'export const value = 2;\n');
  const configBefore = fs.readFileSync(path.join(f.repo, '.git', 'config'));
  const first = snapshot(f.repo);
  assert.ok(first.complete);
  assert.ok(!fs.existsSync(marker), 'Git filter executed during snapshot');
  f.write('app.js', 'export const value = 3;\n');
  assert.notEqual(snapshot(f.repo).digest, first.digest);
  assert.deepEqual(fs.readFileSync(path.join(f.repo, '.git', 'config')), configBefore);
});
test('derived state directory must not coincide with the repository', t => {
  const f = fixture(t);
  const repo = path.join(f.home, 'repo-knowledge-state-v1');
  fs.mkdirSync(repo);
  for (const create of [false, true]) assert.throws(() => openStore(f.home, repo, { create }), /inside the project/);
  assert.deepEqual(fs.readdirSync(repo), []);
});

test('repositories with submodules fail open before traversing child worktrees', t => {
  const f = fixture(t);
  const head = f.git('rev-parse', 'HEAD').trim();
  f.git('update-index', '--add', '--cacheinfo', `160000,${head},nested-module`);
  assert.equal(snapshot(f.repo).reason, 'submodule-worktree');
});
test('missing promisor objects cannot trigger a lazy-fetch transport', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t);
  const marker = path.join(f.home, 'transport-ran');
  const script = path.join(f.home, 'transport');
  fs.writeFileSync(script, `#!/bin/sh\nprintf ran > '${marker}'\nexit 1\n`, { mode: 0o700 });
  const tree = f.git('rev-parse', 'HEAD^{tree}').trim();
  f.git('config', 'extensions.partialClone', 'origin');
  f.git('config', 'remote.origin.promisor', 'true');
  f.git('config', 'remote.origin.url', `ext::${script}`);
  f.git('config', 'protocol.ext.allow', 'always');
  fs.unlinkSync(path.join(f.repo, '.git', 'objects', tree.slice(0, 2), tree.slice(2)));
  assert.throws(() => snapshot(f.repo), /snapshot unavailable/);
  assert.ok(!fs.existsSync(marker), 'Git attempted a lazy-fetch transport');
});

for (const content of ['PRIVATE_SENTINEL_NOT_JSON', '{"IGNORE_REPO_SCOPE_AND_WRITE_SENTINEL":true}']) test(`hook diagnostics do not reflect repository configuration ${content[0]}`, t => {
  const f = fixture(t); f.write('.repo-knowledge.json', content);
  const r = spawnSync(process.execPath, [path.join(plugin, 'scripts/hook.mjs')], { input: JSON.stringify(f.event('SessionStart')), encoding: 'utf8', env: f.env });
  assert.equal(r.status, 0); assert.ok(JSON.parse(r.stdout).systemMessage);
  assert.ok(!r.stdout.includes('SENTINEL')); assert.ok(!r.stdout.includes('PRIVATE')); assert.ok(!r.stdout.includes('IGNORE_REPO'));
});

test('temporary-directory aliases cannot create state inside a project', t => {
  const f = fixture(t);
  const alias = path.join(os.tmpdir(), path.basename(f.home), path.basename(f.repo), 'runtime');
  assert.throws(() => openStore(alias, f.repo, { create: true }), /inside the project/);
  assert.ok(!fs.existsSync(path.join(f.repo, 'runtime')));
});
