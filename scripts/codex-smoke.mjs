// Native management smoke only: never runs a model, imports auth, or trusts hooks.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectInstalled } from './lib/codex-probe.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exe = process.env.RK_CODEX_BIN || 'codex';
const home = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'rk-native-smoke-')));
const profile = path.join(home, 'codex');
fs.mkdirSync(profile);
const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: profile, XDG_CONFIG_HOME: path.join(home, 'config'), XDG_CACHE_HOME: path.join(home, 'cache') };
for (const name of ['OPENAI_API_KEY', 'CODEX_API_KEY', 'OPENAI_ADMIN_KEY', 'CODEX_AUTH_JSON']) delete env[name];
const report = { scope: 'native CLI marketplace management and installed skill/hook discovery in isolated HOME/CODEX_HOME; no model or hook execution', status: 'skipped', commands: [], modelBehavior: 'not-run', installedSkillDiscovery: 'not-run', nativeHookExecution: 'not-run' };
function run(args) {
  const r = spawnSync(exe, args, { cwd: home, env, encoding: 'utf8', timeout: 30000, maxBuffer: 1048576, windowsHide: true });
  report.commands.push({ args, status: r.status, error: r.error?.code || null, stdout: r.stdout?.slice(0, 12000) || '', stderr: r.stderr?.slice(0, 2000) || '' });
  return r;
}
function requireSuccess(args) {
  const r = run(args);
  if (r.error || r.status !== 0) throw new Error(`Failed: codex ${args.join(' ')}`);
  return r;
}
try {
  const version = run(['--version']);
  if (version.error?.code === 'ENOENT') {
    report.reason = 'Codex executable not found'; process.exitCode = 2;
  } else {
    if (version.error || version.status !== 0) throw new Error('Cannot execute Codex');
    report.codexVersion = version.stdout.trim();
    requireSuccess(['plugin', 'marketplace', 'add', ROOT]);
    const markets = requireSuccess(['plugin', 'marketplace', 'list']);
    if (!markets.stdout.includes('codex-repo-knowledge')) throw new Error('Marketplace was not listed');
    const installed = requireSuccess(['plugin', 'add', 'repo-knowledge@codex-repo-knowledge', '--json']);
    const details = JSON.parse(installed.stdout);
    if (details.name !== 'repo-knowledge') throw new Error('Unexpected installed plugin identity');
    const listing = requireSuccess(['plugin', 'list', '--marketplace', 'codex-repo-knowledge', '--json']);
    const plugins = JSON.parse(listing.stdout);
    if (!plugins.installed?.some(item => item.name === 'repo-knowledge' && item.enabled)) throw new Error('Installed plugin was not listed and enabled');
    Object.assign(report, await inspectInstalled(exe, env, home, details.installedPath));
    requireSuccess(['plugin', 'remove', 'repo-knowledge@codex-repo-knowledge']);
    report.status = 'passed'; report.reason = 'Native management and installed skill/hook discovery passed; hooks remain untrusted, execution and model behavior are not tested';
  }
} catch (error) {
  report.status = 'failed'; report.reason = error.message; process.exitCode = 1;
} finally {
  fs.rmSync(home, { recursive: true, force: true });
  console.log(JSON.stringify(report, null, 2));
}
