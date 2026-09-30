import { diagnosticStatus } from './lib/diagnostics.mjs';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { repositoryRoot, snapshot } from './lib/git.mjs';
import { loadConfig } from './lib/config.mjs';
import { recordReview, PLUGIN_ROOT } from './lib/runtime.mjs';
import { checkNotes } from './lib/notes.mjs';
try {
  const { values: v, positionals } = parseArgs({ allowPositionals: true, strict: true, options: {
    cwd: { type: 'string' }, 'data-dir': { type: 'string' }, key: { type: 'string' }, 'turn-state-id': { type: 'string' },
    docs: { type: 'string' }, notes: { type: 'string' }, reason: { type: 'string' },
    help: { type: 'boolean' },
  } });
  if (v.help || positionals.length === 0) {
    console.log('Repo Knowledge\n  doctor --cwd <repo>\n  diagnostics --cwd <repo> --data-dir <actual PLUGIN_DATA>\n  check-notes --cwd <repo>\n  review --data-dir <PLUGIN_DATA> --turn-state-id <turn-state-id> --docs <outcome> --notes <outcome> --reason <reason>\nOutcomes: updated | not-needed | deferred. Review writes plugin data only.');
  } else if (positionals.length !== 1) throw new Error('Expected exactly one subcommand');
  else if (positionals[0] === 'review') {
    if (v.key !== undefined && v['turn-state-id'] !== undefined) throw new Error('Use one turn-state identifier option, not both');
    console.log(JSON.stringify(recordReview({ dataRoot: v['data-dir'], key: v['turn-state-id'] ?? v.key, docs: v.docs, notes: v.notes, reason: v.reason }), null, 2));
  }
  else if (positionals[0] === 'diagnostics') console.log(JSON.stringify(diagnosticStatus({ cwd: path.resolve(v.cwd || process.cwd()), dataRoot: v['data-dir'] || process.env.PLUGIN_DATA || process.env.CLAUDE_PLUGIN_DATA }), null, 2));
  else if (positionals[0] === 'doctor') {
    const root = repositoryRoot(path.resolve(v.cwd || process.cwd()));
    console.log(JSON.stringify({ node: process.version, pluginRoot: PLUGIN_ROOT, repo: root, config: loadConfig(root), snapshot: snapshot(root), nativeCodexVerified: false, note: 'This command checks local prerequisites/configuration, not plugin installation, hook trust, or model behavior.' }, null, 2));
  } else if (positionals[0] === 'check-notes') {
    const result = checkNotes(repositoryRoot(path.resolve(v.cwd || process.cwd())));
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } else throw new Error('Unknown subcommand');
} catch (error) {
  console.error(`Repo Knowledge: ${error.message}`);
  process.exitCode = 1;
}
