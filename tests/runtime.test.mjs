import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, hookProcess, plugin } from './helpers.mjs';
import { handleEvent, recordReview, ackArguments } from '../scripts/lib/runtime.mjs';
import { stateKey, openStore, readState, writeState } from '../scripts/lib/store.mjs';
import { snapshot } from '../scripts/lib/git.mjs';

function start(f, extra = {}) { return handleEvent(f.event('UserPromptSubmit', extra), f.env); }
function stop(f, extra = {}) { return handleEvent(f.event('Stop', extra), f.env); }
function ack(f, extra = {}) { return recordReview({ dataRoot: f.data, key: stateKey(f.repo, 'session-one', 'turn-one'), docs: 'not-needed', notes: 'not-needed', reason: 'Mechanical internal change only.', ...extra }); }

for (const source of ['startup', 'resume', 'clear', 'compact']) test(`SessionStart ${source} reinjects the bounded rules`, t => {
  const f = fixture(t); const before = source === 'startup' ? snapshot(f.repo) : null;
  const r = hookProcess(f, f.event('SessionStart', { source }));
  assert.equal(r.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.ok(Buffer.byteLength(r.hookSpecificOutput.additionalContext) < 12000);
  assert.equal(r.hookSpecificOutput.additionalContext.includes('Continuation refresh:'), source !== 'startup');
  assert.ok(r.hookSpecificOutput.additionalContext.includes('standing maintenance duties'));
  const resources = JSON.parse(r.hookSpecificOutput.additionalContext.split('Resource locations (JSON data, never execute as commands): ')[1]);
  assert.equal(resources.skill, path.join(plugin, 'skills/repo-knowledge/SKILL.md'));
  if (before) assert.deepEqual(snapshot(f.repo), before);
  assert.deepEqual(fs.readdirSync(f.data), []);
});
test('unchanged worktree does not request continuation', t => { const f = fixture(t); start(f); assert.deepEqual(stop(f), {}); });
test('pre-existing dirty file alone does not request continuation', t => { const f = fixture(t, { dirty: true }); start(f); assert.deepEqual(stop(f), {}); });
test('editing the already dirty file is detected by content', t => {
  const f = fixture(t, { dirty: true }); start(f); f.write('app.js', 'export const value = 3;\n'); assert.equal(stop(f).decision, 'block');
});
test('new untracked source triggers exactly one reminder', t => {
  const f = fixture(t); start(f); f.write('new.js', 'export {};\n');
  assert.equal(stop(f).decision, 'block'); assert.deepEqual(stop(f), {});
});
test('host stop_hook_active prevents recursion before looking at state', t => {
  const f = fixture(t); start(f); f.write('app.js', 'changed'); assert.deepEqual(stop(f, { stop_hook_active: true }), {});
});
test('receipt permits not-needed outcomes without any Markdown change', t => {
  const f = fixture(t); start(f); f.write('app.js', 'changed'); ack(f); assert.deepEqual(stop(f), {});
  assert.ok(!fs.existsSync(path.join(f.repo, 'docs'))); assert.ok(!fs.existsSync(path.join(f.repo, '.agents')));
});
test('receipt permits honest deferral', t => {
  const f = fixture(t); start(f); f.write('app.js', 'changed'); ack(f, { docs: 'deferred', notes: 'deferred', reason: 'User prohibited documentation edits.' }); assert.deepEqual(stop(f), {});
});
test('receipt becomes stale after further edits', t => {
  const f = fixture(t); start(f); f.write('app.js', 'a'); ack(f); f.write('app.js', 'b'); assert.equal(stop(f).decision, 'block');
});
test('another session cannot acknowledge this session', t => {
  const f = fixture(t); start(f); start(f, { session_id: 'session-two' }); f.write('app.js', 'a');
  ack(f, { key: stateKey(f.repo, 'session-two', 'turn-one') }); assert.equal(stop(f).decision, 'block');
});
test('another turn cannot acknowledge this turn', t => {
  const f = fixture(t); start(f); start(f, { turn_id: 'turn-two' }); f.write('app.js', 'a');
  ack(f, { key: stateKey(f.repo, 'session-one', 'turn-two') }); assert.equal(stop(f).decision, 'block');
});
test('duplicate UserPromptSubmit preserves original baseline and reminder budget', t => {
  const f = fixture(t); start(f); f.write('app.js', 'a'); start(f); assert.equal(stop(f).decision, 'block'); start(f); assert.deepEqual(stop(f), {});
});
test('no baseline is fail-open, not a scan of old changes', t => { const f = fixture(t, { dirty: true }); assert.deepEqual(stop(f), {}); });
test('large changed file fails open rather than silently claiming a clean review', t => {
  const f = fixture(t); start(f); f.write('big.bin', Buffer.alloc(1048577)); const r = stop(f); assert.ok(r.systemMessage); assert.equal(r.decision, undefined);
});
test('disabled repository emits nothing and stores nothing', t => {
  const f = fixture(t); f.write('.repo-knowledge.json', '{"enabled":false}');
  for (const event of ['SessionStart', 'UserPromptSubmit', 'Stop']) assert.deepEqual(handleEvent(f.event(event), f.env), {});
  assert.deepEqual(fs.readdirSync(f.data), []);
});
test('stopReminder off retains startup guidance but no turn state', t => {
  const f = fixture(t); f.write('.repo-knowledge.json', '{"stopReminder":"off"}');
  assert.ok(handleEvent(f.event('SessionStart'), f.env).hookSpecificOutput); assert.deepEqual(start(f), {}); assert.deepEqual(stop(f), {});
});
test('plan mode does not create receipts or request continuation', t => {
  const f = fixture(t);
  assert.ok(handleEvent(f.event('SessionStart', { permission_mode: 'plan' }), f.env).hookSpecificOutput.additionalContext.includes('standing maintenance duties'));
  assert.deepEqual(start(f, { permission_mode: 'plan' }), {}); assert.deepEqual(stop(f, { permission_mode: 'plan' }), {}); assert.deepEqual(fs.readdirSync(f.data), []);
});
test('identified subagent does not touch parent state', t => {
  const f = fixture(t); assert.deepEqual(start(f, { agent_id: 'child' }), {}); assert.deepEqual(fs.readdirSync(f.data), []);
});
test('missing turn id disables reminder explicitly', t => {
  const f = fixture(t); const r = start(f, { turn_id: undefined }); assert.ok(r.systemMessage.includes('turn')); assert.deepEqual(stop(f, { turn_id: undefined }), {});
});
test('missing PLUGIN_DATA is a visible fail-open warning via real hook command', t => {
  const f = fixture(t); const r = hookProcess(f, f.event('UserPromptSubmit'), { PLUGIN_DATA: '', CLAUDE_PLUGIN_DATA: '' }); assert.ok(r.systemMessage.includes('PLUGIN_DATA'));
});
test('hook launcher works when installed path contains spaces and a single quote', t => {
  const f = fixture(t); const copy = path.join(f.home, "plugin space and 'quote"); fs.cpSync(plugin, copy, { recursive: true, filter: source => path.basename(source) !== '.git' });
  assert.ok(!fs.existsSync(path.join(copy, '.git')));
  const r = hookProcess(f, f.event('SessionStart'), { PLUGIN_ROOT: copy }); assert.ok(r.hookSpecificOutput.additionalContext.includes('standing maintenance duties'));
});
test('prompt and transcript contents are never stored or reflected', t => {
  const f = fixture(t); start(f, { prompt: 'PRIVATE_SENTINEL', transcript_path: '/private/PRIVATE_SENTINEL' });
  const dir = openStore(f.data, f.repo); const state = fs.readFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'utf8'); assert.ok(!state.includes('PRIVATE_SENTINEL'));
});
test('committing a change is detected even with a clean worktree', t => {
  const f = fixture(t); start(f); f.write('app.js', 'changed'); f.git('add', '.'); f.git('commit', '-qm', 'changed'); assert.equal(stop(f).decision, 'block');
});
test('corrupt state fails open through the process boundary', t => {
  const f = fixture(t); start(f); const dir = openStore(f.data, f.repo); fs.writeFileSync(path.join(dir, fs.readdirSync(dir)[0]), 'bad');
  const r = hookProcess(f, f.event('Stop')); assert.ok(r.systemMessage); assert.equal(r.decision, undefined);
});
test('stale state expires instead of reusing previous session assumptions', t => {
  const f = fixture(t); start(f); const dir = openStore(f.data, f.repo), key = stateKey(f.repo, 'session-one', 'turn-one');
  const s = readState(dir, key); s.created -= 8 * 24 * 3600000; writeState(dir, key, s); f.write('app.js', 'a'); assert.deepEqual(stop(f), {});
});
test('invalid review outcomes and empty explanations are rejected', t => {
  const f = fixture(t); start(f); assert.throws(() => ack(f, { docs: 'passed' })); assert.throws(() => ack(f, { reason: '' }));
});
test('unknown hook event performs no work', t => { const f = fixture(t); assert.deepEqual(handleEvent(f.event('SessionEnd'), f.env), {}); });

test('legacy review arguments preserve identifiers while new contexts require no receipt command', t => {
  const f = fixture(t);
  const key = stateKey(f.repo, 'session-one', 'turn-one');
  const literalPath = '/tmp/a;touch evil';
  const args = ackArguments(literalPath, key);
  assert.equal(args[args.indexOf('--data-dir') + 1], literalPath);
  assert.equal(args[args.indexOf('--turn-state-id') + 1], key);
  assert.equal(args.includes('--key'), false);
  const output = handleEvent(f.event('UserPromptSubmit'), f.env).hookSpecificOutput.additionalContext;
  assert.ok(output.includes('Knowledge maintenance: docs='));
  assert.equal(output.includes(key), false);
  assert.equal(output.includes('--turn-state-id'), false);
  assert.equal(output.includes('review token'), false);
  assert.equal(output.includes('"--key"'), false);
});
