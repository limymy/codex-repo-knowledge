// This entry point runs when imported by the shell-neutral hook launcher.
import path from 'node:path';
import { beginDiagnostic, recordDiagnostic, diagnosticResult } from './lib/diagnostics.mjs';
import { PLUGIN_ROOT, handleEvent } from './lib/runtime.mjs';
let ticket = null;
let bytes = 0;
const chunks = [];
try {
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 1048576) throw new Error('Hook payload exceeds 1 MiB');
    chunks.push(chunk);
  }
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  ticket = beginDiagnostic(payload);
  const output = handleEvent(payload);
  const recorded = recordDiagnostic(ticket, 'completed', diagnosticResult(output));
  if (recorded && payload.hook_event_name === 'SessionStart') {
    const argv = ['node', path.join(PLUGIN_ROOT, 'scripts/rk.mjs'), 'diagnostics', '--cwd', ticket.root, '--data-dir', ticket.dataRoot];
    output.systemMessage = (output.systemMessage ? output.systemMessage + '\n' : '') + 'Repo Knowledge diagnostics recorded script execution only. Reader arguments (JSON data, not shell text): ' + JSON.stringify({ argv });
  }
  process.stdout.write(`${JSON.stringify(output)}\n`);
} catch (error) {
  recordDiagnostic(ticket, 'failed', 'runtime-error');
  // Advisory failure: never trap the user in a continuation loop.
  // Repository-controlled names, paths and parser excerpts must not become context.
  process.stdout.write(`${JSON.stringify({ systemMessage: 'Repo Knowledge hook skipped: invalid input, configuration, Git snapshot or plugin state. Check project configuration, Node/Git availability and PLUGIN_DATA; no continuation requested.' })}\n`);
}
