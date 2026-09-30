// Read-only native discovery. This never starts a thread, calls a model, or trusts hooks.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { inside } from './io.mjs';

export async function inspectInstalled(exe, env, cwd, installedPath) {
  const child = spawn(exe, ['app-server', '--stdio'], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const pending = new Map();
  let closed = false;
  const closure = new Promise(resolve => child.once('close', () => { closed = true; resolve(); }));
  let id = 0, bytes = 0, terminalError;
  const fail = error => { terminalError ||= error; for (const item of pending.values()) item.reject(terminalError); pending.clear(); };
  child.on('error', fail);
  child.stdin.on('error', fail);
  child.stdout.on('error', fail);
  child.stdout.on('data', chunk => {
    bytes += chunk.length;
    if (bytes > 2 * 1024 * 1024) { fail(new Error('Codex discovery output exceeded budget')); child.kill(); }
  });
  child.on('exit', () => fail(new Error('Codex app-server exited before discovery completed')));
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    if (terminalError) return;
    try {
      const message = JSON.parse(line), item = pending.get(message.id);
      if (item) { pending.delete(message.id); message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result); }
    } catch { fail(new Error('Invalid JSON from Codex app-server')); }
  });
  const call = (method, params) => new Promise((resolve, reject) => {
    if (terminalError) { reject(terminalError); return; }
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(requestId, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    child.stdin.write(JSON.stringify({ id: requestId, method, params }) + '\n');
  });
  try {
    const host = await call('initialize', { clientInfo: { name: 'repo-knowledge-smoke', version: '1' }, capabilities: { experimentalApi: true } });
    if (path.resolve(host.codexHome) !== path.resolve(env.CODEX_HOME)) throw new Error('Codex did not use the isolated profile');
    child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    const skillsResult = await call('skills/list', { cwds: [cwd], forceReload: true });
    const hooksResult = await call('hooks/list', { cwds: [cwd] });
    const skills = (skillsResult.data || []).flatMap(item => item.skills || []).filter(item => inside(installedPath, item.path));
    const hooks = (hooksResult.data || []).flatMap(item => item.hooks || []).filter(item => item.pluginId === 'repo-knowledge@codex-repo-knowledge');
    const errors = [...(skillsResult.data || []), ...(hooksResult.data || [])].flatMap(item => item.errors || []);
    if (errors.length) throw new Error(`Native discovery errors: ${JSON.stringify(errors)}`);
    if (skills.map(item => item.name.split(':').at(-1)).sort().join(',') !== 'repo-knowledge,repo-knowledge-setup' || skills.some(item => !item.enabled)) throw new Error('Installed skills were not both discovered and enabled');
    if (hooks.map(item => item.eventName).sort().join(',') !== 'sessionStart,stop,userPromptSubmit') throw new Error('Expected three installed hooks');
    if (hooks.some(item => item.trustStatus !== 'untrusted' || item.isManaged || !item.enabled || !inside(installedPath, item.sourcePath))) throw new Error('Hook source or isolated trust state was unexpected');
    const session = hooks.find(item => item.eventName === 'sessionStart');
    const matcher = new RegExp(session.matcher);
    if (!['startup', 'resume', 'clear', 'compact'].every(source => matcher.test(source))) throw new Error('SessionStart lifecycle coverage is incomplete');
    return {
      installedSkillDiscovery: 'passed', nativeHookDiscovery: 'passed',
      nativeHookExecution: 'not-run', modelBehavior: 'not-run', hookTrust: 'untrusted',
      skills: skills.map(item => ({ name: item.name, enabled: item.enabled })),
      hooks: hooks.map(item => ({ eventName: item.eventName, matcher: item.matcher, trustStatus: item.trustStatus, timeoutSec: item.timeoutSec })),
    };
  } finally {
    lines.close(); child.stdin.end();
    if (!closed) child.kill();
    const timer = setTimeout(() => { if (!closed) child.kill('SIGKILL'); }, 2000);
    try { await closure; } finally { clearTimeout(timer); }
  }
}
