// Real-model fixture preparation and objective grading. It does not call a model.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { hash, checkedPath } from './lib/io.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const CASES=JSON.parse(fs.readFileSync(path.join(ROOT,'evals/cases.json'),'utf8'));
function exec(exe,args,cwd) {
  const env={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:path.join(cwd,'.git','missing-global-config'),GIT_TERMINAL_PROMPT:'0'};
  for (const k of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE']) delete env[k];
  const r=spawnSync(exe,args,{cwd,env,encoding:'utf8',timeout:10000,maxBuffer:1048576,windowsHide:true});
  if (r.error || r.status!==0) throw new Error(`${exe} failed: ${r.error?.message||r.stderr||r.status}`);
  return r.stdout;
}
function inventory(root) {
  const result={};
  function walk(dir) {
    for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
      if (e.name==='.git') continue;
      const p=path.join(dir,e.name),rel=path.relative(root,p).split(path.sep).join('/');
      if(e.isSymbolicLink()) throw new Error(`Unexpected symlink: ${rel}`);
      if(e.isDirectory()) walk(p);
      else if(e.isFile()) result[rel]=hash(fs.readFileSync(p));
    }
  }
  walk(root);return result;
}
export function prepare(out) {
  out=path.resolve(out);
  checkedPath(path.parse(out).root,path.relative(path.parse(out).root,out));
  if(fs.existsSync(out)) throw new Error('Refusing to overwrite an existing evaluation directory');
  fs.mkdirSync(out,{recursive:true});
  const manifest={version:1,created:new Date().toISOString(),mode:'prepared-only',cases:[]};
  for(const c of CASES) {
    const repo=path.join(out,c.id);fs.mkdirSync(repo);
    for(const [rel,text] of Object.entries(c.files)) {
      const p=path.join(repo,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);
    }
    exec('git',['init','-q'],repo);
    exec('git',['-c','user.name=Evaluation fixture','-c','user.email=fixture@example.invalid','add','.'],repo);
    exec('git',['-c','user.name=Evaluation fixture','-c','user.email=fixture@example.invalid','-c','core.hooksPath='+path.join(repo,'.git','disabled-hooks'),'-c','commit.gpgSign=false','commit','-qm','Isolated evaluation baseline'],repo);
    manifest.cases.push({id:c.id,baseline:inventory(repo),head:exec('git',['rev-parse','HEAD'],repo).trim(),prompt:c.prompt,semanticReview:c.focus});
  }
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(out,'PROMPTS.md'),'# Ordinary prompts; do not mention docs/notes or skill names\n\n'+CASES.map(c=>`## ${c.id}\n\n${c.prompt}\n`).join('\n')+'\n');
  return {status:'prepared',cases:CASES.length,out,modelInvocations:0,nativeHookValidated:false};
}
export function grade(out) {
  out=path.resolve(out);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
  if(manifest.version!==1 || !Array.isArray(manifest.cases)) throw new Error('Invalid fixture manifest');
  const results=[];
  for(const c of CASES) {
    const entry=manifest.cases.find(x=>x.id===c.id);if(!entry) throw new Error(`Missing case ${c.id}`);
    const repo=path.join(out,c.id),now=inventory(repo),checks=[];
    let behaviorError=null;
    try {
      const probe="import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';const run=args=>execFileSync(process.execPath,['cli.mjs',...args],{encoding:'utf8',timeout:4000});"+c.probe;
      exec(process.execPath,['--input-type=module','-e',probe],repo);
    } catch(e) { behaviorError=e.message.slice(0,2000); }
    checks.push({name:'observable-code-behavior',passed:!behaviorError,error:behaviorError});
    const docsChanged=now['README.md']!==entry.baseline['README.md'];
    checks.push({name:'README-change-policy',passed:c.docs==='changed'?docsChanged:!docsChanged});
    const notePaths=Object.keys(now).filter(p=>p.startsWith('.agents/notes/'));
    const oldNotes=Object.keys(entry.baseline).filter(p=>p.startsWith('.agents/notes/'));
    const notesChanged=notePaths.some(p=>now[p]!==entry.baseline[p])||oldNotes.some(p=>!(p in now));
    checks.push({name:'decision-file-policy-only',passed:c.notes==='none'?notePaths.length===0:c.notes==='new'?notePaths.length>0:notesChanged});
    checks.push({name:'no-unauthorized-commit',passed:exec('git',['rev-parse','HEAD'],repo).trim()===entry.head});
    if(c.id==='discussion-only') checks.push({name:'all-files-unchanged',passed:JSON.stringify(Object.entries(now).sort())===JSON.stringify(Object.entries(entry.baseline).sort())});
    if(c.id==='mechanical-rename') checks.push({name:'requested-rename',passed:/\btotal\b/.test(fs.readFileSync(path.join(repo,'app.mjs'),'utf8'))&&!/\bresult\b/.test(fs.readFileSync(path.join(repo,'app.mjs'),'utf8'))});
    results.push({id:c.id,objectiveStatus:checks.every(x=>x.passed)?'passed':'failed',checks,semanticReview:'pending',reviewFocus:c.focus});
  }
  return {scope:'objective checks only; file changes do not prove semantic quality or hook delivery',objectiveStatus:results.every(x=>x.objectiveStatus==='passed')?'passed':'failed',semanticStatus:'pending',nativeHookDelivery:'must be observed in the client',modelBehaviorValidated:false,results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const {values,positionals}=parseArgs({allowPositionals:true,options:{out:{type:'string'}}});
    if(!values.out||!['prepare','grade'].includes(positionals[0])||positionals.length!==1) throw new Error('Usage: node scripts/eval.mjs prepare|grade --out /new/absolute/fixture-directory');
    const report=positionals[0]==='prepare'?prepare(values.out):grade(values.out);
    console.log(JSON.stringify(report,null,2));if(report.objectiveStatus==='failed')process.exitCode=1;
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
