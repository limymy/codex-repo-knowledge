// Repository-specific consistency checks, NOT the upstream Codex validator.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageFiles } from './package-files.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function checkPackage(root = ROOT) {
  const errors = [];
  const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
  const json = rel => JSON.parse(read(rel));
  const fail = (ok,msg) => { if (!ok) errors.push(msg); };
  try {
    const manifest=json('.codex-plugin/plugin.json'), legacy=manifest, pkg=json('package.json');
    fail(manifest.name==='repo-knowledge', 'Wrong plugin name');
    fail(pkg.version===manifest.version, 'Version mismatch');
    fail(!fs.existsSync(path.join(root, 'plugin.json')), 'Unverified portable manifest can suppress native hooks');
    fail(!Object.hasOwn(manifest, 'hooks'), 'Use default hooks/hooks.json discovery for compatibility validation');
    fail(legacy.skills==='./skills/', 'Skills must use the root skills directory');
    fail(!pkg.dependencies || Object.keys(pkg.dependencies).length===0, 'Unexpected runtime dependency');
    const market=json('.agents/plugins/marketplace.json');
    fail(market.name==='codex-repo-knowledge', 'Wrong marketplace name');
    fail(market.plugins.length===1 && market.plugins[0].name===manifest.name, 'Wrong marketplace entries');
    fail(market.plugins[0].source.source==='local' && market.plugins[0].source.path==='./', 'Unexpected marketplace source');
    const hooks=json('hooks/hooks.json').hooks;
    fail(Object.keys(hooks).sort().join(',')==='SessionStart,Stop,UserPromptSubmit', 'Unexpected hook event');
    for (const [name, groups] of Object.entries(hooks)) {
      fail(groups.length===1 && groups[0].hooks.length===1, `${name}: duplicate handlers`);
      const h=groups[0].hooks[0];
      fail(h.type==='command' && h.command.includes('process.env.PLUGIN_ROOT') && h.command.includes("'hook.mjs'"), `${name}: wrong launcher`);
      fail(h.timeout>0 && h.timeout<=15, `${name}: unbounded timeout`);
    }
    for (const [name, implicit] of [['repo-knowledge',true],['repo-knowledge-setup',false]]) {
      const skill=read(`skills/${name}/SKILL.md`);
      fail(skill.startsWith(`---\nname: ${name}\ndescription: `), `${name}: invalid frontmatter`);
      fail(skill.indexOf('\n---\n',4)>0, `${name}: unclosed frontmatter`);
      const metadata=read(`skills/${name}/agents/openai.yaml`);
      fail(metadata.includes(`allow_implicit_invocation: ${implicit}`), `${name}: invocation policy mismatch`);
    }
    for (const file of packageFiles(root)) {
      if (!/\.(md|json|mjs|ya?ml)$/.test(file.path)) continue;
      const text=read(file.path);
      fail(text.endsWith('\n') && !text.endsWith('\n\n'), `${file.path}: require one final newline`);
      if (!file.path.endsWith('.md')) continue;
      const prose=text.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm,'');
      for (const match of prose.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
        const target=match[1].split('#')[0];
        if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
        const dest=path.resolve(root,path.dirname(file.path),decodeURIComponent(target));
        fail(dest.startsWith(root+path.sep) && fs.existsSync(dest), `${file.path}: missing/unsafe link ${target}`);
      }
    }
  } catch(e) { errors.push(e.message); }
  return errors;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const errors=checkPackage();
  console.log(JSON.stringify({scope:'local package consistency, not native Codex validation', status:errors.length?'failed':'passed',errors},null,2));
  process.exitCode=errors.length?1:0;
}
