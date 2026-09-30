import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OMIT = new Set(['.git', 'node_modules', '.evals', 'dist', 'coverage']);
export function packageFiles(root = ROOT) {
  const files = [];
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
      if (OMIT.has(e.name)) continue;
      const f = path.join(dir, e.name);
      if (e.isSymbolicLink()) throw new Error(`Symlinks are not distributable: ${f}`);
      if (e.isDirectory()) walk(f);
      else if (e.isFile()) {
        const bytes = fs.readFileSync(f);
        files.push({ path: path.relative(root, f).split(path.sep).join('/'), bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex') });
      }
    }
  }
  walk(root); return files.sort((a,b)=>a.path.localeCompare(b.path));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify({ root: path.basename(ROOT), files: packageFiles() }, null, 2));
}
