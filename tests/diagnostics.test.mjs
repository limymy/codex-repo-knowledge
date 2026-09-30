import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture, hookProcess, plugin } from './helpers.mjs';
import { beginDiagnostic, recordDiagnostic, diagnosticStatus } from '../scripts/lib/diagnostics.mjs';
import { handleEvent } from '../scripts/lib/runtime.mjs';
const enable = f => f.write('.repo-knowledge.json', JSON.stringify({ diagnostics: true }));
const status = f => diagnosticStatus({ cwd: f.repo, dataRoot: f.data });
test('diagnostics are opt-in and disabling leaves existing records unchanged', t => {
  const f = fixture(t);
  hookProcess(f, f.event('SessionStart'));
  assert.deepEqual(fs.readdirSync(f.data), []);
  enable(f); hookProcess(f, f.event('SessionStart'));
  const before = status(f).events;
  assert.equal(before.length, 2);
  f.write('.repo-knowledge.json', '{"diagnostics":false}');
  hookProcess(f, f.event('SessionStart'));
  assert.equal(status(f).enabled, false); assert.deepEqual(status(f).events, before);
});
test('real hook subprocess records three events with sanitized results and usable reader', t => {
  const f = fixture(t); enable(f);
  const output = hookProcess(f, f.event('SessionStart', {source:'resume',prompt:'SECRET_PROMPT',transcript_path:'/secret/transcript'}));
  const reader = JSON.parse(output.systemMessage.slice(output.systemMessage.indexOf('{'))).argv;
  assert.equal(reader[2], 'diagnostics');
  hookProcess(f, f.event('UserPromptSubmit', {prompt:'SECRET_PROMPT'}));
  hookProcess(f, f.event('Stop'));
  const r = spawnSync(process.execPath, reader.slice(1), {encoding:'utf8',env:f.env});
  assert.equal(r.status, 0);
  const report = JSON.parse(r.stdout);
  assert.deepEqual(report.events.map(e=>e.event), ['SessionStart','SessionStart','UserPromptSubmit','UserPromptSubmit','Stop','Stop']);
  assert.equal(report.events[1].result, 'context-produced');
  assert.equal(report.events[1].source, 'resume');
  for (const text of [r.stdout, fs.readFileSync(path.join(f.data,'repo-knowledge-state-v1',fs.readdirSync(path.join(f.data,'repo-knowledge-state-v1')).find(n=>n.startsWith('diagnostics-'))),'utf8')]) {
    for (const secret of ['SECRET_PROMPT','transcript','session-one',f.repo,f.data]) assert.equal(text.includes(secret),false);
  }
});
test('diagnostic failure never changes hook result and paths stay outside project', t => {
  const f = fixture(t); enable(f);
  const expected = handleEvent(f.event('SessionStart'), f.env);
  assert.deepEqual(hookProcess(f, f.event('SessionStart'), {PLUGIN_DATA:f.repo}),expected);
  assert.equal(fs.existsSync(path.join(f.repo,'repo-knowledge-state-v1')),false);
  const link=path.join(f.home,'linked-data');
  try { fs.symlinkSync(f.data,link,'junction'); } catch(e) { if(e.code==='EPERM') return; throw e; }
  assert.deepEqual(hookProcess(f, f.event('SessionStart'),{PLUGIN_DATA:link}),expected);
  assert.deepEqual(fs.readdirSync(f.data),[]);
});
test('diagnostic bounded retention, lock contention and malformed state fail open', t => {
  const f=fixture(t); enable(f);
  const ticket=beginDiagnostic(f.event('SessionStart'),f.env);
  for(let i=0;i<160;i++) assert.equal(recordDiagnostic(ticket,'completed','no-op'),true);
  assert.equal(status(f).events.length,128); assert.ok(fs.statSync(ticket.file).size<=32768);
  fs.writeFileSync(path.join(ticket.dir,`${ticket.key}.lock`),'');
  assert.equal(recordDiagnostic(ticket,'failed','runtime-error'),false);
  fs.unlinkSync(path.join(ticket.dir,`${ticket.key}.lock`));
  fs.writeFileSync(ticket.file,JSON.stringify({version:1,events:[{event:'SECRET',at:'PRIVATE_PATH'}]}));
  assert.equal(status(f).status,'unavailable');
  assert.equal(JSON.stringify(status(f)).includes('SECRET'),false);
  assert.deepEqual(hookProcess(f,f.event('SessionStart')),handleEvent(f.event('SessionStart'),f.env));
});
test('runtime failures have fixed category without raw repository-controlled error', t => {
  const f=fixture(t); enable(f);
  const ticket=beginDiagnostic(f.event('UserPromptSubmit'),f.env);
  // Corrupt this turn state to force a runtime failure after diagnostics starts.
  hookProcess(f,f.event('UserPromptSubmit'));
  const turn=fs.readdirSync(ticket.dir).find(n=>/^[a-f0-9]{64}\.json$/.test(n));
  fs.writeFileSync(path.join(ticket.dir,turn),'SECRET_INVALID_JSON');
  hookProcess(f,f.event('Stop'));
  const last=status(f).events.at(-1);
  assert.equal(last.phase,'failed'); assert.equal(last.result,'runtime-error');
  assert.equal(JSON.stringify(status(f)).includes('SECRET_INVALID_JSON'),false);
});

test('review CLI accepts both explicit turn-state id and legacy option, rejecting ambiguity', t => {
  const f = fixture(t);
  hookProcess(f, f.event('UserPromptSubmit'));
  const dir = path.join(f.data, 'repo-knowledge-state-v1');
  const key = fs.readdirSync(dir).find(n => /^[a-f0-9]{64}\.json$/.test(n)).slice(0, -5);
  const base = [path.join(plugin, 'scripts/rk.mjs'), 'review', '--data-dir', f.data, '--docs', 'not-needed', '--notes', 'not-needed', '--reason', 'No semantic changes'];
  for (const option of ['--turn-state-id', '--key']) {
    const r = spawnSync(process.execPath, [...base, option, key], { env: f.env, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).recorded, true);
  }
  const bad = spawnSync(process.execPath, [...base, '--key', key, '--turn-state-id', key], { env: f.env, encoding: 'utf8' });
  assert.equal(bad.status, 1); assert.match(bad.stderr, /not both/);
});
