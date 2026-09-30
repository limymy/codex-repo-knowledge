import fs from 'node:fs';
import { openStore, locked } from './store.mjs';
import { checkedPath, hash, readJson, atomicJson } from './io.mjs';
import { repositoryRoot } from './git.mjs';
import { loadConfig } from './config.mjs';
export const DIAGNOSTIC_LIMIT = 128;
const EVENTS = ['SessionStart', 'UserPromptSubmit', 'Stop'];
const PHASES = ['started', 'completed', 'failed'];
const RESULTS = ['pending', 'context-produced', 'reminder-produced', 'warning-produced', 'no-op', 'runtime-error'];
const SOURCES = ['startup', 'resume', 'clear', 'compact', 'unspecified'];
function location(dataRoot, root, create) {
  const dir = openStore(dataRoot, root, { create });
  return dir ? { dir, key: hash(`diagnostics:${root}`), file: checkedPath(dir, `diagnostics-${hash(root)}.json`) } : null;
}
function entries(file) {
  if (!fs.existsSync(file)) return [];
  const value = readJson(file, 32768);
  if (value.version !== 1 || !Array.isArray(value.events) || value.events.length > DIAGNOSTIC_LIMIT) throw new Error('Invalid diagnostics');
  // Rebuild from a closed schema: never echo extra fields or arbitrary disk text.
  return value.events.map(e => {
    if (!e || !EVENTS.includes(e.event) || !PHASES.includes(e.phase) || !RESULTS.includes(e.result) || !SOURCES.includes(e.source) ||
        typeof e.at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at)) throw new Error('Invalid diagnostics');
    return { at: e.at, event: e.event, source: e.source, phase: e.phase, result: e.result };
  });
}
export function beginDiagnostic(event, env = process.env) {
  try {
    if (!EVENTS.includes(event?.hook_event_name)) return null;
    const root = repositoryRoot(event.cwd);
    const cfg = loadConfig(root);
    if (!cfg.enabled || !cfg.diagnostics) return null;
    const dataRoot = env.PLUGIN_DATA || env.CLAUDE_PLUGIN_DATA;
    const loc = location(dataRoot, root, true);
    if (!loc) return null;
    const ticket = { ...loc, root, dataRoot, event: event.hook_event_name,
      source: event.hook_event_name === 'SessionStart' && SOURCES.includes(event.source) ? event.source : 'unspecified' };
    return recordDiagnostic(ticket, 'started', 'pending') ? ticket : null;
  } catch { return null; }
}
export function recordDiagnostic(ticket, phase, result) {
  if (!ticket) return false;
  try {
    if (!PHASES.includes(phase) || !RESULTS.includes(result)) return false;
    return locked(ticket.dir, ticket.key, () => {
      const events = entries(ticket.file);
      events.push({ at: new Date().toISOString(), event: ticket.event, source: ticket.source, phase, result });
      atomicJson(ticket.file, { version: 1, events: events.slice(-DIAGNOSTIC_LIMIT) });
      return true;
    });
  } catch { return false; }
}
export function diagnosticResult(output) {
  if (output?.decision === 'block') return 'reminder-produced';
  if (output?.hookSpecificOutput?.additionalContext) return 'context-produced';
  if (output?.systemMessage) return 'warning-produced';
  return 'no-op';
}
export function diagnosticStatus({ cwd, dataRoot }) {
  const limits = 'Started records show this script reached instrumentation; completed records show the runtime computed the listed result. Neither proves stdout delivery, host handling or model consumption. Missing records do not establish hook trust, non-execution or host support. Manual script runs also create records. Concurrent writes, invalid input/configuration, unsafe paths and write errors can leave no record. Retention is the latest 128 records, not a complete audit trail.';
  try {
    const root = repositoryRoot(cwd);
    const cfg = loadConfig(root);
    const loc = location(dataRoot, root, false);
    return { status: 'read', enabled: cfg.enabled && cfg.diagnostics, events: loc ? entries(loc.file) : [], limits };
  } catch { return { status: 'unavailable', errorCategory: 'configuration-or-state-unavailable', events: [], limits }; }
}
