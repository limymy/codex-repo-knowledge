import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = fs.readdirSync(path.join(root, 'tests')).filter(s => s.endsWith('.test.mjs')).sort().map(s => path.join(root, 'tests', s));
const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
