import fs from 'node:fs';
import { checkedPath, isRecord, readJson, relativePath } from './io.mjs';
export const defaults = Object.freeze({ version: 1, enabled: true, docsRoot: 'docs', notesRoot: '.agents/notes', stopReminder: 'once' });
export function validateConfig(value, root) {
  if (!isRecord(value)) throw new Error('Configuration must be an object');
  for (const key of Object.keys(value)) if (!Object.hasOwn(defaults, key)) throw new Error('Unknown configuration key');
  const cfg = { ...defaults, ...value };
  if (cfg.version !== 1) throw new Error('Unsupported .repo-knowledge.json version');
  if (typeof cfg.enabled !== 'boolean') throw new Error('enabled must be boolean');
  if (!['once', 'off'].includes(cfg.stopReminder)) throw new Error('stopReminder must be once or off');
  for (const key of ['docsRoot', 'notesRoot']) checkedPath(root, relativePath(cfg[key]));
  if (cfg.docsRoot === cfg.notesRoot) throw new Error('docsRoot and notesRoot must have distinct owners');
  return cfg;
}
export function loadConfig(root) {
  const file = checkedPath(root, '.repo-knowledge.json');
  return validateConfig(fs.existsSync(file) ? readJson(file) : {}, root);
}
