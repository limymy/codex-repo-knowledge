import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}
export function relativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 1024 ||
      /[\x00-\x1f\x7f\\:]/.test(value) || path.isAbsolute(value)) throw new Error('Expected a safe repository-relative path');
  const parts = value.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || p === '.git')) throw new Error('Repository paths cannot contain empty, dot, parent or .git components');
  return value;
}
// Refuse symlink traversal, including existing parents of not-yet-created paths.
export function checkedPath(root, relative, { leafSymlink = false } = {}) {
  const target = path.resolve(root, relative);
  if (!inside(root, target)) throw new Error('Path escapes its owning root');
  let current = root;
  const parts = path.relative(root, target).split(path.sep).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    try {
      const st = fs.lstatSync(current);
      if (st.isSymbolicLink() && !(leafSymlink && i === parts.length - 1)) throw new Error('Symlink traversal is not allowed');
      if (i < parts.length - 1 && !st.isDirectory()) throw new Error('A path parent is not a directory');
    } catch (error) { if (error.code === 'ENOENT') break; throw error; }
  }
  return target;
}
export function boundedRead(file, limit = 1048576) {
  const entry = fs.lstatSync(file);
  if (!entry.isFile() || entry.isSymbolicLink() || entry.size > limit) throw new Error('File is non-regular or exceeds the read budget');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile() || before.size > limit) throw new Error('File is non-regular or exceeds the read budget');
    const buffer = Buffer.alloc(before.size + 1);
    let count = 0;
    while (count < buffer.length) {
      const n = fs.readSync(fd, buffer, count, buffer.length - count, null);
      if (!n) break;
      count += n;
    }
    const after = fs.fstatSync(fd);
    if (count > limit || count !== before.size || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new Error('File changed while being read');
    return buffer.subarray(0, count);
  } finally { fs.closeSync(fd); }
}
export function readJson(file, limit = 65536) {
  let value;
  const text = boundedRead(file, limit).toString('utf8');
  try { value = JSON.parse(text); }
  catch { throw new Error('Invalid JSON document'); }
  if (!isRecord(value)) throw new Error('Expected a JSON object');
  return value;
}
export function atomicJson(file, value) {
  if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('Refusing a symlink state file');
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(value)}\n`, { flag: 'wx', mode: 0o600 });
    fs.renameSync(tmp, file);
  } finally { try { fs.unlinkSync(tmp); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
}
