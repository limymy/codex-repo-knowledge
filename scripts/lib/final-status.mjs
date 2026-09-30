import { hash } from './io.mjs';
export const FINAL_STATUS_LIMIT = 16384;
// This consumes only the host's current final-message field, never a transcript.
export function parseFinalStatus(message) {
  if (typeof message !== 'string' || Buffer.byteLength(message, 'utf8') > FINAL_STATUS_LIMIT) return null;
  const text = message.replace(/\r\n/g, '\n').trimEnd();
  const lines = text.split('\n');
  const final = lines.pop();
  let fence = null;
  let quotedOrListedParagraph = false;
  let htmlComment = false;
  let rawHtml = null;
  for (const line of lines) {
    if (!fence) {
      for (const token of line.matchAll(/<!--|-->/g)) htmlComment = token[0] === '<!--';
      const opening = /^ {0,3}<(pre|script|style|textarea)(?:\s|>|$)/i.exec(line);
      if (opening && !rawHtml) rawHtml = opening[1].toLowerCase();
      if (rawHtml && new RegExp('</' + rawHtml + '\\s*>', 'i').test(line)) rawHtml = null;
    }
    if (!line.trim()) quotedOrListedParagraph = false;
    if (!fence && /^ {0,3}(?:>|[-+*][ \t]|[0-9]+[.)][ \t])/.test(line)) quotedOrListedParagraph = true;
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!match) continue;
    if (!fence) fence = { char: match[1][0], length: match[1].length };
    else if (match[1][0] === fence.char && match[1].length >= fence.length && !match[2].trim()) { fence = null; quotedOrListedParagraph = false; }
  }
  if (fence || quotedOrListedParagraph || htmlComment || rawHtml) return null;
  let match = /^Knowledge maintenance: docs=(updated|not-needed|deferred); notes=(updated|not-needed|deferred)$/.exec(final);
  if (match) return { docs: match[1], notes: match[2], messageHash: hash(text) };
  match = /^知识维护：文档=(已更新|无需更新|暂缓)；笔记=(已更新|无需更新|暂缓)$/.exec(final);
  if (!match) return null;
  const values = { '已更新': 'updated', '无需更新': 'not-needed', '暂缓': 'deferred' };
  return { docs: values[match[1]], notes: values[match[2]], messageHash: hash(text) };
}
export function finalStatusInstructions() {
  return 'After authorized development with relevant edits, report independent docs/notes outcomes in the last line of your final answer: Knowledge maintenance: docs=updated; notes=not-needed. Choose each value independently from updated, not-needed, deferred. Chinese form: 知识维护：文档=已更新；笔记=无需更新, choosing each independently from 已更新, 无需更新, 暂缓. Place this single plain line outside quotes/code fences, separated from any preceding list or quote by a blank line, after your normal explanation. Explain any deferral honestly in the preceding prose. The host Stop hook records this self-report; do not run a receipt command or write plugin state. Read-only discussion needs no status line. A status is not proof of semantic correctness and grants no write permission.';
}
