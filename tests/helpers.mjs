import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const plugin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function fixture(t, { dirty = false } = {}) {
  const home = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'rk-test-')));
  const repo = path.join(home, 'repo with spaces');
  const data = path.join(home, 'plugin-data');
  fs.mkdirSync(repo); fs.mkdirSync(data);
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'core.hooksPath='+path.join(home,'disabled-hooks'), '-c', 'commit.gpgSign=false', '-c', 'core.fsmonitor=false', '-C', repo, ...args], { encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0) throw new Error(r.stderr);
    return r.stdout;
  };
  git('init', '-q'); git('config', 'user.name', 'Local test'); git('config', 'user.email', 'test@example.invalid');
  fs.writeFileSync(path.join(repo, 'app.js'), 'export const value = 1;\n');
  git('add', '.'); git('commit', '-qm', 'fixture');
  if (dirty) fs.writeFileSync(path.join(repo, 'app.js'), 'export const value = 2;\n');
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const event = (name, extra = {}) => ({ hook_event_name: name, session_id: 'session-one', turn_id: 'turn-one', cwd: repo, permission_mode: 'default', ...extra });
  const env = { ...process.env, PLUGIN_ROOT: plugin, PLUGIN_DATA: data };
  const write = (name, value) => { fs.mkdirSync(path.dirname(path.join(repo, name)), { recursive: true }); fs.writeFileSync(path.join(repo, name), value); };
  return { home, repo, data, git, event, env, write };
}
export function hookProcess(f, event, env = {}) {
  const hooks = JSON.parse(fs.readFileSync(path.join(plugin, 'hooks/hooks.json'), 'utf8'));
  const command = hooks.hooks[event.hook_event_name]?.[0].hooks[0].command;
  if (!command) throw new Error('No configured hook command');
  const r = spawnSync(command, { shell: true, input: JSON.stringify(event), encoding: 'utf8', cwd: f.repo, env: { ...f.env, ...env }, timeout: 15000 });
  if (r.status !== 0) throw new Error(r.stderr || `status ${r.status}`);
  return JSON.parse(r.stdout);
}
export const implemented = `# Decision: Compatibility\n\n<!-- repo-knowledge:decision -->\nStatus: implemented\n\n## Problem\nLegacy consumers require text output.\n\n## Decision\nJSON is opt-in.\n\n## Alternatives considered\nChanging the default was rejected because existing consumers parse text.\n\n## Consequences\nTwo output modes must be maintained.\n\n## Evidence\nThe parser regression test passes; external consumers were not run.\n`;
