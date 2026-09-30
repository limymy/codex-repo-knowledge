// This entry point runs when imported by the shell-neutral hook launcher.
import { handleEvent } from './lib/runtime.mjs';
let bytes = 0;
const chunks = [];
try {
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 1048576) throw new Error('Hook payload exceeds 1 MiB');
    chunks.push(chunk);
  }
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  process.stdout.write(`${JSON.stringify(handleEvent(payload))}\n`);
} catch (error) {
  // Advisory failure: never trap the user in a continuation loop.
  // Repository-controlled names, paths and parser excerpts must not become context.
  process.stdout.write(`${JSON.stringify({ systemMessage: 'Repo Knowledge hook skipped: invalid input, configuration, Git snapshot or plugin state. Check project configuration, Node/Git availability and PLUGIN_DATA; no continuation requested.' })}\n`);
}
