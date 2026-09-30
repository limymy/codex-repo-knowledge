import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { parseFinalStatus, FINAL_STATUS_LIMIT } from '../scripts/lib/final-status.mjs';
import { handleEvent } from '../scripts/lib/runtime.mjs';
import { stateKey, openStore, readState } from '../scripts/lib/store.mjs';
import { fixture, plugin } from './helpers.mjs';
const line = 'Knowledge maintenance: docs=updated; notes=not-needed';
function state(f) { return readState(openStore(f.data, f.repo), stateKey(f.repo, 'session-one', 'turn-one')); }
function start(f) { handleEvent(f.event('UserPromptSubmit'), f.env); }
function stop(f, text = line, extra = {}) { return handleEvent(f.event('Stop', { last_assistant_message: text, ...extra }), f.env); }
for (const docs of ['updated', 'not-needed', 'deferred']) for (const notes of ['updated', 'not-needed', 'deferred']) test(`final status preserves ${docs}/${notes}`, () => {
  const r = parseFinalStatus(`Finished.\nKnowledge maintenance: docs=${docs}; notes=${notes}\n`);
  assert.equal(r.docs, docs); assert.equal(r.notes, notes); assert.match(r.messageHash, /^[a-f0-9]{64}$/);
});
test('Chinese statuses preserve deferred independently', () => {
  const r = parseFinalStatus('权限受限，笔记暂缓。\n知识维护：文档=已更新；笔记=暂缓');
  assert.equal(r.docs, 'updated'); assert.equal(r.notes, 'deferred');
});
test('only exact unquoted unfenced final line is accepted within budget', () => {
  for (const text of [undefined, null, 3, 'x'.repeat(FINAL_STATUS_LIMIT + 1), `> ${line}`, `- ${line}`, `> Quoted example\n${line}`, `- Listed example\n${line}`, `    ${line}`, `"${line}"`, `\`${line}\``, line+'\nMore prose', line.replace('updated','maybe'), '-\tExample\n'+line, '1.\tExample\n'+line, '<pre>\n<script></script>\n'+line, '<script\n'+line, '<!-- Example\n'+line, '<pre>\n\n'+line, '```text\n'+line, '~~~\n'+line, '```\n'+line+'\n```']) assert.equal(parseFinalStatus(text), null);
  assert.ok(parseFinalStatus('```text\nExample only\n```\n'+line));
  assert.ok(parseFinalStatus('- Summary item\n\n'+line));
  assert.ok(parseFinalStatus('~~~\nExample only\n~~~\n'+line));
});
test('host records final status when a read-only model process cannot write plugin data', t => {
  const f = fixture(t); start(f); f.write('app.js', 'changed');
  const key = stateKey(f.repo, 'session-one', 'turn-one');
  const flag = Number(process.versions.node.split('.')[0]) >= 22 ? '--permission' : '--experimental-permission';
  // Real child-process filesystem permission denial; no mocked file APIs.
  const child = spawnSync(process.execPath, [flag, '--allow-fs-read=*', '--allow-child-process', path.join(plugin,'scripts/rk.mjs'), 'review','--data-dir',f.data,'--turn-state-id',key,'--docs','updated','--notes','not-needed','--reason','Synthetic permission boundary'], {env:f.env,encoding:'utf8'});
  assert.notEqual(child.status, 0); assert.match(child.stderr, /Access to this API has been restricted|AccessDenied|permission|ERR_ACCESS_DENIED/i);
  assert.equal(state(f).review, null);
  assert.deepEqual(stop(f), {});
  const receipt = state(f).review;
  assert.equal(receipt.source, 'stop-final-status'); assert.equal(receipt.docs, 'updated'); assert.equal(receipt.notes, 'not-needed');
  assert.equal(JSON.stringify(receipt).includes('Knowledge maintenance:'), false);
});
test('status after one reminder persists even when host marks continuation active', t => {
  const f = fixture(t); start(f); f.write('app.js','changed');
  assert.equal(stop(f,'Finished without status.').decision,'block');
  assert.deepEqual(stop(f,'Unable to maintain notes.\nKnowledge maintenance: docs=updated; notes=deferred',{stop_hook_active:true}),{});
  assert.equal(state(f).review.notes,'deferred'); assert.equal(state(f).reminded,true);
  f.write('app.js','changed again'); assert.deepEqual(stop(f,'No additional status.'),{});
});
test('duplicate final message cannot renew a stale receipt after another edit', t => {
  const f = fixture(t); start(f); f.write('app.js','changed'); stop(f);
  const digest=state(f).review.digest;
  assert.deepEqual(stop(f),{});
  f.write('app.js','changed again'); assert.equal(stop(f).decision,'block'); assert.equal(state(f).review.digest,digest);
  assert.deepEqual(stop(f,'Rechecked after the additional change.\n'+line,{stop_hook_active:true}),{});
  assert.notEqual(state(f).review.digest,digest);
});
test('read-only unchanged tasks need no status and foreign turns or subagents cannot receipt this turn', t => {
  const f=fixture(t); start(f); assert.deepEqual(stop(f,'Read-only explanation.'),{}); assert.equal(state(f).review,null);
  f.write('app.js','changed');
  assert.deepEqual(stop(f,line,{turn_id:'other-turn'}),{});assert.equal(state(f).review,null);
  assert.deepEqual(stop(f,line,{agent_id:'other-agent'}),{});assert.equal(state(f).review,null);
});
test('missing or oversized host final message fails open without consuming reminder budget', t => {
  const f=fixture(t); start(f);f.write('app.js','changed');
  for (const text of [null,undefined,12,'x'.repeat(FINAL_STATUS_LIMIT+1)]) {
    const r=handleEvent(f.event('Stop',{last_assistant_message:text}),f.env);assert.equal(r.decision,undefined);assert.equal(state(f).review,null);assert.equal(state(f).reminded,false);
  }
});

test('out-of-order replay cannot renew an older accepted status and history is bounded', t => {
  const f=fixture(t);start(f);
  for(let i=0;i<8;i++) { f.write('app.js',`change ${i}`);assert.deepEqual(stop(f,`Review ${i}.\n${line}`),{}); }
  const before=state(f);assert.equal(before.acceptedFinalHashes.length,8);
  f.write('app.js','later change');assert.equal(stop(f,`Review 0.\n${line}`).decision,'block');
  assert.equal(state(f).review.digest,before.review.digest);
  const exhausted=stop(f,`A new review beyond the bound.\n${line}`);
  assert.equal(exhausted.decision,undefined);assert.equal(state(f).acceptedFinalHashes.length,8);
  assert.equal(state(f).review.digest,before.review.digest);
});

test('valid final status seen on unchanged baseline cannot receipt later edits on replay', t => {
  const f=fixture(t);start(f);assert.deepEqual(stop(f),{});
  assert.equal(state(f).review,null);assert.equal(state(f).acceptedFinalHashes.length,1);
  f.write('app.js','later edit');assert.equal(stop(f).decision,'block');
  assert.equal(state(f).review,null);
});
test('new valid status seen on reviewed digest cannot receipt later edits on replay', t => {
  const f=fixture(t);start(f);f.write('app.js','first edit');stop(f);
  const digest=state(f).review.digest;
  const another='A later response on the same snapshot.\n'+line;
  assert.deepEqual(stop(f,another),{});assert.equal(state(f).acceptedFinalHashes.length,2);
  f.write('app.js','later edit');assert.equal(stop(f,another).decision,'block');
  assert.equal(state(f).review.digest,digest);
});
