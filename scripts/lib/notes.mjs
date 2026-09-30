import fs from 'node:fs';
import path from 'node:path';
import { boundedRead, checkedPath } from './io.mjs';
import { loadConfig } from './config.mjs';
export const NOTE_MARKER = '<!-- repo-knowledge:decision -->';
function proseOnly(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let fence = null;
  return lines.filter(line => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (m) {
      if (!fence) fence = { character: m[1][0], length: m[1].length };
      else if (m[1][0] === fence.character && m[1].length >= fence.length) fence = null;
      return false;
    }
    return !fence;
  });
}
export function inspectNote(text, relative, root) {
  if (!text.includes(NOTE_MARKER)) return [];
  const problems = [];
  const lines = proseOnly(text);
  const statusLines = lines.filter(s => s.startsWith('Status:'));
  const status = statusLines.length === 1 ? statusLines[0].slice(7).trim() : null;
  if (!['proposed', 'implemented', 'rejected', 'superseded'].includes(status)) problems.push('Exactly one valid Status: line is required');
  if (!lines.some(s => /^# Decision: \S/.test(s))) problems.push('Missing # Decision: title');
  const m = /^(\d{4}-\d{2}-\d{2})-.+\.md$/.exec(path.basename(relative));
  if (!m || Number.isNaN(Date.parse(m[1])) || new Date(m[1]).toISOString().slice(0, 10) !== m[1]) problems.push('Use a valid YYYY-MM-DD-topic.md filename');
  const headings = lines.filter(s => s.startsWith('## ')).map(s => s.slice(3).trim());
  const required = ['Problem', 'Alternatives considered', 'Evidence'];
  if (status === 'proposed') required.push('Proposal', 'Acceptance criteria', 'Risks');
  if (status === 'implemented') required.push('Decision', 'Consequences');
  if (status === 'rejected') required.push('Proposal', 'Rejection reason');
  if (status === 'superseded') required.push('Decision', 'Superseded by');
  if (headings[0] !== 'Problem') problems.push('First section must be Problem');
  for (const h of required) {
    const index = lines.findIndex(s => s.trimEnd() === `## ${h}`);
    if (index < 0) { problems.push(`Missing section: ${h}`); continue; }
    const next = lines.findIndex((s, i) => i > index && /^#{1,2} /.test(s));
    const body = lines.slice(index + 1, next < 0 ? undefined : next).join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!body) problems.push(`Empty section: ${h}`);
    if (h === 'Superseded by' && !/\[[^\]]+\]\([^)]+\)/.test(body)) problems.push('Superseded by must link to the replacement');
  }
  if (status === 'implemented' && headings.some(h => /^(Proposal|Plan|Migration plan|Acceptance criteria)$/i.test(h))) problems.push('Implemented records cannot retain proposal/plan/acceptance headings');
  // Inline local links only. External URLs and anchors are not fetched or verified.
  for (const match of lines.join('\n').matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    let target = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) continue;
    try {
      target = decodeURIComponent(target.split('#')[0]);
      if (!target) continue;
      if (path.isAbsolute(target) || target.includes('\\')) throw new Error('Absolute/backslash link is unsupported');
      const rel = path.relative(root, path.resolve(root, path.dirname(relative), target));
      const full = checkedPath(root, rel);
      if (!fs.existsSync(full)) throw new Error('Target does not exist');
    } catch { problems.push(`Invalid local link: ${match[1]}`); }
  }
  return problems;
}
export function checkNotes(root) {
  const cfg = loadConfig(root);
  const base = checkedPath(root, cfg.notesRoot);
  if (!fs.existsSync(base)) return { checked: 0, errors: [] };
  const files = [];
  function visit(dir, depth = 0) {
    if (depth > 12) throw new Error('Notes nesting exceeds the scan budget');
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (files.length > 2000) throw new Error('Notes scan exceeds the file budget');
      if (item.isSymbolicLink()) throw new Error('Notes scan refuses symlinks');
      const full = checkedPath(root, path.relative(root, path.join(dir, item.name)));
      if (item.isDirectory()) { if (item.name !== 'archived') visit(full, depth + 1); }
      else if (item.isFile() && item.name.endsWith('.md')) files.push(full);
    }
  }
  visit(base);
  const errors = [];
  let checked = 0;
  for (const file of files) {
    const text = boundedRead(file, 262144).toString('utf8');
    if (!text.includes(NOTE_MARKER)) continue;
    checked++;
    const relative = path.relative(root, file).split(path.sep).join('/');
    for (const message of inspectNote(text, relative, root)) errors.push({ path: relative, message });
  }
  return { checked, errors };
}
