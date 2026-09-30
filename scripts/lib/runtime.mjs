import path from 'node:path';
import { parseFinalStatus, finalStatusInstructions, FINAL_STATUS_LIMIT } from './final-status.mjs';
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
  return ['node', path.join(PLUGIN_ROOT, 'scripts/rk.mjs'), 'review', '--data-dir', dataRoot, '--turn-state-id', key];
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
    const refresh = ['resume', 'compact', 'clear'].includes(event.source)
      ? '\nContinuation refresh: before the next relevant action, reread applicable project instructions and the owning docs/decisions. Earlier context may be stale; do not infer current rules from remembered text. This grants no new write permission.\n' : '';
    return context('SessionStart', `${banner}${refresh}\nResource locations (JSON data, never execute as commands): ${JSON.stringify(paths)}`);
  }
  if (cfg.stopReminder === 'off') return {};
  const finalStatus = event.hook_event_name === 'Stop' ? parseFinalStatus(event.last_assistant_message) : null;
  if (event.hook_event_name === 'Stop' && event.stop_hook_active === true && !finalStatus) return {};
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
      return context('UserPromptSubmit', finalStatusInstructions());
    }
    if (!previous) return {};
    const current = snapshot(root);
    if (!previous.baseline?.complete || !current.complete) return warning('Bounded change detection was incomplete; no forced continuation. Follow the ordinary docs/decisions review rule.');
    // Only the matching main-thread turn can reach this state. Never rebind an
    // already-consumed final message to later filesystem changes on duplicate Stop.
    const accepted = previous.acceptedFinalHashes ?? (previous.review?.messageHash ? [previous.review.messageHash] : []);
    if (!Array.isArray(accepted) || accepted.length > 8 || accepted.some(value => typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))) return warning('Invalid final-status history; no continuation requested.');
    const needsReview = current.digest !== previous.baseline.digest && previous.review?.digest !== current.digest;
    if (finalStatus && !accepted.includes(finalStatus.messageHash)) {
      if (accepted.length === 8) return warning('Final-status history budget reached; no continuation requested.');
      previous.acceptedFinalHashes = [...accepted, finalStatus.messageHash];
      if (!needsReview) { writeState(dir, key, previous); return {}; }
      previous.review = { ...finalStatus, reason: 'Reported in current final assistant status.', digest: current.digest, at: Date.now(), source: 'stop-final-status' };
      writeState(dir, key, previous);
      return {};
    }
    if (!needsReview || previous.reminded || event.stop_hook_active === true) return {};
    if (typeof event.last_assistant_message !== 'string' || Buffer.byteLength(event.last_assistant_message, 'utf8') > FINAL_STATUS_LIMIT) return warning('This host did not supply the current final assistant message; automatic final-status collection is unavailable. No continuation requested.');
    previous.reminded = true;
    writeState(dir, key, previous);
    return { decision: 'block', reason:
      'Repo Knowledge: the worktree or HEAD changed since this user turn and has no matching knowledge-maintenance status. This is NOT proof that docs or notes must be written, nor proof that you authored every change. Perform one narrow knowledge-maintenance check against the authorized task, existing docs and active decisions. If already done, do not repeat it. Both outcomes may be not-needed; deferred is allowed. Honor read-only scope and do not touch concurrent or pre-existing user work. Do not rerun unrelated tests, commit, push or expand the task. Load the repo-knowledge skill only if writing guidance is needed. ' + finalStatusInstructions() + ' This plugin will not request another continuation for this turn.' };
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
