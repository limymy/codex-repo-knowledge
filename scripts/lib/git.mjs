import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkedPath, boundedRead, hash } from './io.mjs';

function git(cwd, args, { allowUnborn = false } = {}) {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', GIT_PAGER: 'cat', GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES']) delete env[key];
  const options = { env, encoding: 'utf8', timeout: 2500, maxBuffer: 2 * 1024 * 1024, windowsHide: true };
  const base = ['--no-optional-locks', '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', '-C', cwd];
  // Even `git status` can execute clean/process filters. Read only their names,
  // then override both executable forms and required=true in this child process.
  // Never change repository/global configuration or execute repository commands.
  const filters = spawnSync('git', [...base, 'config', '--null', '--name-only', '--get-regexp', '^filter\\..*\\.(clean|process|required)$'], options);
  if (filters.error || ![0, 1].includes(filters.status)) throw new Error('Git filter configuration unavailable; snapshot skipped');
  const drivers = [...new Set(filters.stdout.split('\0').filter(Boolean).map(key => key.replace(/\.(clean|process|required)$/, '')))];
  if (drivers.length > 1000 || drivers.some(key => !key.startsWith('filter.') || /[\x00-\x1f\x7f]/.test(key))) throw new Error('Unsafe or excessive Git filter configuration; snapshot skipped');
  const overrides = drivers.flatMap(key => ['-c', `${key}.clean=`, '-c', `${key}.process=`, '-c', `${key}.required=false`]);
  const r = spawnSync('git', [...base, ...overrides, ...args], options);
  if (allowUnborn && r.status === 1) return '';
  if (r.error || r.status !== 0) throw new Error('Git snapshot unavailable (missing Git, untrusted repository, error or budget exceeded)');
  return r.stdout;
}
export function repositoryRoot(cwd) {
  if (typeof cwd !== 'string' || !path.isAbsolute(cwd)) throw new Error('Hook cwd must be absolute');
  const output = git(cwd, ['rev-parse', '--show-toplevel']).replace(/\r?\n$/, '');
  return fs.realpathSync.native(output);
}
export function parseStatus(text) {
  const records = text.split('\0');
  const entries = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record) continue;
    if (record.length < 4 || record[2] !== ' ') throw new Error('Malformed Git status');
    const status = record.slice(0, 2);
    const entry = { status, path: record.slice(3) };
    if (/[RC]/.test(status)) {
      entry.original = records[++i];
      if (!entry.original) throw new Error('Malformed Git rename');
    }
    entries.push(entry);
  }
  return entries;
}
export function isSensitive(rel) {
  const name = rel.split('/').at(-1).toLowerCase();
  return name === '.env' || name.startsWith('.env.') || /\.(pem|p12|pfx|key)$/.test(name) ||
    /^(id_rsa|id_ed25519|credentials\.json|auth\.json)$/.test(name);
}
// Bounded change detection, not an author-attribution or integrity-security system.
export function snapshot(root, { maxPaths = 1000, maxFileBytes = 1048576, maxTotalBytes = 8388608 } = {}) {
  // Do not descend into a submodule with its own executable Git configuration.
  // A repository containing gitlinks remains advisory-only for change tracking.
  const tracked = git(root, ['ls-files', '--stage', '-z']);
  if (tracked.split('\0').some(entry => entry.startsWith('160000 '))) return { complete: false, reason: 'submodule-worktree', digest: null, count: 0 };
  const entries = parseStatus(git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=all']));
  if (entries.length > maxPaths) return { complete: false, reason: 'path-budget', digest: null, count: entries.length };
  const head = git(root, ['rev-parse', '--verify', '--quiet', 'HEAD'], { allowUnborn: true }).trim();
  const index = git(root, ['diff', '--cached', '--raw', '--no-abbrev', '--no-ext-diff', '--no-textconv', '-z']);
  const values = [];
  let total = 0;
  for (const entry of entries) {
    let identity;
    try {
      const file = checkedPath(root, entry.path, { leafSymlink: true });
      const st = fs.lstatSync(file);
      if (st.isSymbolicLink()) identity = { link: hash(fs.readlinkSync(file)), mode: st.mode };
      else if (isSensitive(entry.path)) identity = { excluded: true, size: st.size, mtimeMs: st.mtimeMs, ctimeMs: st.ctimeMs };
      else if (!st.isFile()) return { complete: false, reason: 'non-regular-path', digest: null, count: entries.length };
      else {
        if (st.size > maxFileBytes || total + st.size > maxTotalBytes) return { complete: false, reason: 'byte-budget', digest: null, count: entries.length };
        const bytes = boundedRead(file, maxFileBytes);
        total += bytes.length;
        identity = { hash: hash(bytes), mode: st.mode };
      }
    } catch (e) {
      if (e.code === 'ENOENT' && /D/.test(entry.status)) identity = { deleted: true };
      else return { complete: false, reason: 'unsafe-or-changing-path', digest: null, count: entries.length };
    }
    values.push({ ...entry, identity });
  }
  values.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return { complete: true, digest: hash(JSON.stringify({ head, index, values })), count: entries.length };
}
