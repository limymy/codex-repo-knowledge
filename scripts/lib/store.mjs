import fs from 'node:fs';
import path from 'node:path';
import { atomicJson, checkedPath, hash, inside, readJson } from './io.mjs';
export const STATE_DIRECTORY = 'repo-knowledge-state-v1';
export function stateKey(root, session, turn) {
  if (![session, turn].every(v => typeof v === 'string' && v.length > 0 && v.length <= 256)) throw new Error('Stable session_id and turn_id required');
  return hash(JSON.stringify([root, session, turn]));
}
export function openStore(dataRoot, repoRoot, { create = false } = {}) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot)) throw new Error('PLUGIN_DATA is unavailable; reminder disabled');
  const full = path.resolve(dataRoot);
  if (inside(repoRoot, full)) throw new Error('Plugin runtime data cannot be stored inside the project');
  // Host supplies PLUGIN_DATA. Refuse existing symlink components, not just leaves.
  checkedPath(path.parse(full).root, path.relative(path.parse(full).root, full));
  // Resolve existing ancestors before mkdir: Windows 8.3 aliases must not evade
  // containment checks or create even an empty directory in the project.
  const canonicalRepo = fs.realpathSync.native(repoRoot);
  let ancestor = full;
  const missing = [];
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('Plugin data root is unavailable');
    missing.unshift(path.basename(ancestor)); ancestor = parent;
  }
  const canonical = path.join(fs.realpathSync.native(ancestor), ...missing);
  if (inside(canonicalRepo, canonical) || inside(canonicalRepo, path.join(canonical, STATE_DIRECTORY))) throw new Error('Plugin runtime data cannot be stored inside the project');
  if (create) fs.mkdirSync(full, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(full)) return null;
  const resolved = fs.realpathSync.native(full);
  if (inside(canonicalRepo, resolved)) throw new Error('Plugin data resolves into the project');
  const dir = checkedPath(resolved, STATE_DIRECTORY);
  if (inside(canonicalRepo, dir)) throw new Error('Plugin state cannot be stored inside the project');
  if (create) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(dir)) return null;
  return dir;
}
export function statePath(dir, key) {
  if (!/^[0-9a-f]{64}$/.test(key)) throw new Error('Invalid turn key');
  return checkedPath(dir, `${key}.json`);
}
export function readState(dir, key) {
  const file = statePath(dir, key);
  if (!fs.existsSync(file)) return null;
  const s = readJson(file, 32768);
  if (s.version !== 1 || typeof s.root !== 'string' || typeof s.created !== 'number') throw new Error('Invalid turn state');
  if (Date.now() - s.created > 7 * 24 * 3600 * 1000 || s.created > Date.now() + 60000) return null;
  return s;
}
export function locked(dir, key, operation) {
  const lock = checkedPath(dir, `${key}.lock`);
  let fd;
  try { fd = fs.openSync(lock, 'wx', 0o600); }
  catch (e) { if (e.code === 'EEXIST') throw new Error('Concurrent hook operation; reminder skipped'); throw e; }
  try { return operation(); }
  finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
export function writeState(dir, key, state) { atomicJson(statePath(dir, key), state); }
