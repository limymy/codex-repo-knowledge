// Test/evaluation fixtures only. Never inherit a caller's repository or executable Git configuration.
import path from 'node:path';
export function fixtureGitEnvironment(cwd, inherited = process.env) {
  const env = { ...inherited };
  for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key];
  return { ...env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_SYSTEM: path.join(cwd, '.git', 'absent-system-config'), GIT_CONFIG_GLOBAL: path.join(cwd, '.git', 'absent-global-config'), GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' };
}
export function fixtureGitArguments(cwd, args) {
  const command = args[0] === 'init' ? ['init', '--template=', ...args.slice(1)] : args;
  return ['-c', 'core.hooksPath='+path.join(cwd, '.git', 'disabled-hooks'), '-c', 'commit.gpgSign=false', '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', ...command];
}
