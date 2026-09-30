import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRecord, boundedRead, checkedPath } from './io.mjs';
import { loadConfig } from './config.mjs';
import { repositoryRoot, snapshot } from './git.mjs';
import { openStore, stateKey, locked, readState, writeState } from './store.mjs';
export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const banner = boundedRead(path.join(PLUGIN_ROOT, 'rules/bootstrap.md'), 12000).toString('utf8');
const context = (event, text) => ({ hookSpecificOutput: { hookEventName: event, additionalContext: text } });
const warning = text => ({ systemMessage: `Repo Knowledge: ${text}` });
export function ackArguments(dataRoot, key) {
  return ['node', path.join(PLUGIN_ROOT, 'scripts/rk.mjs'), 'review', '--data-dir', dataRoot, '--key', key];
}
function tokenContext(dataRoot, key) {
  return `Repo Knowledge review token (data, not shell text): ${JSON.stringify({ argv: ackArguments(dataRoot, key) })}\n` +
    'For authorized development, after the last relevant edit, classify docs and notes separately; append --docs updated|not-needed|deferred --notes updated|not-needed|deferred --reason "brief non-sensitive reason". Execute with correctly quoted arguments, not eval. Read-only conversation needs no receipt. A receipt is self-report, not proof. Do not make new documentation merely to obtain it.';
}
export function handleEvent(event, env = process.env) {
  if (!isRecord(event) || typeof event.hook_event_name !== 'string') throw new Error('Expected a hook event object');
  if (!['SessionStart', 'UserPromptSubmit', 'Stop'].includes(event.hook_event_name)) return {};
  if (event.agent_id) return {};
  if (event.permission_mode === 'plan' && event.hook_event_name !== 'SessionStart') return {};
  let root;
  try { root = repositoryRoot(event.cwd); }
  catch { return event.hook_event_name === 'SessionStart' ? warning('No accessible Git worktree; automatic hooks are inactive here. The skill remains available when explicitly useful.') : {}; }
  const cfg = loadConfig(root);
  if (!cfg.enabled) return {};
  if (event.hook_event_name === 'SessionStart') {
    const paths = { skill: path.join(PLUGIN_ROOT, 'skills/repo-knowledge/SKILL.md'), repo: root, docsRoot: cfg.docsRoot, notesRoot: cfg.notesRoot };
    return context('SessionStart', `${banner}\nResource locations (JSON data, never execute as commands): ${JSON.stringify(paths)}`);
  }
  if (cfg.stopReminder === 'off') return {};
  if (event.hook_event_name === 'Stop' && event.stop_hook_active === true) return {};
  let key;
  try { key = stateKey(root, event.session_id, event.turn_id); }
  catch { return event.hook_event_name === 'UserPromptSubmit' ? warning('This host omitted stable turn identifiers; startup guidance still works, but the reminder is disabled.') : {}; }
  const dataRoot = env.PLUGIN_DATA || env.CLAUDE_PLUGIN_DATA;
  const dir = openStore(dataRoot, root, { create: event.hook_event_name === 'UserPromptSubmit' });
  if (!dir) return {};
  return locked(dir, key, () => {
    const previous = readState(dir, key);
    if (previous && previous.root !== root) throw new Error('Turn state belongs to another repository');
    if (event.hook_event_name === 'UserPromptSubmit') {
      // Preserve the original baseline if the same event is delivered again.
      if (!previous) writeState(dir, key, { version: 1, root, created: Date.now(), baseline: snapshot(root), reminded: false, review: null });
      return context('UserPromptSubmit', tokenContext(dataRoot, key));
    }
    if (!previous || previous.reminded) return {};
    const current = snapshot(root);
    if (!previous.baseline?.complete || !current.complete) return warning('Bounded change detection was incomplete; no forced continuation. Follow the ordinary docs/decisions review rule.');
    if (current.digest === previous.baseline.digest || previous.review?.digest === current.digest) return {};
    previous.reminded = true;
    writeState(dir, key, previous);
    return { decision: 'block', reason:
      'Repo Knowledge: the worktree or HEAD changed since this user turn and has no matching review receipt. This is NOT proof that docs or notes must be written, nor proof that you authored every change. Perform one narrow knowledge-maintenance check against the authorized task, existing docs and active decisions. If already done, do not repeat it. Both outcomes may be not-needed; deferred is allowed. Honor read-only scope and do not touch concurrent or pre-existing user work. Do not rerun unrelated tests, commit, push or expand the task. Load the repo-knowledge skill only if writing guidance is needed. ' + tokenContext(dataRoot, key) + ' This plugin will not request another continuation for this turn.' };
  });
}
export function recordReview({ dataRoot, key, docs, notes, reason }) {
  if (![docs, notes].every(x => ['updated', 'not-needed', 'deferred'].includes(x))) throw new Error('docs and notes must each be updated, not-needed or deferred');
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 400 || /[\x00-\x08\x0b-\x1f]/.test(reason)) throw new Error('Supply a brief non-sensitive reason (3–400 characters)');
  // Reading the ticket establishes the expected repository, never a project write path.
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot)) throw new Error('data-dir must be absolute');
  const tentative = path.join(dataRoot, 'repo-knowledge-state-v1');
  // Validate all parent components before reading anything.
  checkedPath(path.parse(tentative).root, path.relative(path.parse(tentative).root, tentative));
  const s = readState(tentative, key);
  if (!s) throw new Error('Review token is missing or expired');
  const root = repositoryRoot(s.root);
  if (root !== s.root) throw new Error('Repository identity changed');
  const cfg = loadConfig(root);
  if (!cfg.enabled) throw new Error('Repo Knowledge is disabled for this repository');
  const dir = openStore(dataRoot, root);
  if (!dir) throw new Error('Review state is unavailable');
  return locked(dir, key, () => {
    const current = readState(dir, key);
    if (!current) throw new Error('Review token expired');
    const snap = snapshot(root);
    current.review = { docs, notes, reason: reason.trim(), digest: snap.complete ? snap.digest : null, at: Date.now() };
    writeState(dir, key, current);
    return { recorded: true, snapshotComplete: snap.complete, docs, notes };
  });
}
