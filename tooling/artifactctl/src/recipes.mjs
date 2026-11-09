import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists, resolveInside } from './core.mjs';
import { planPortfolio, validatePortfolio } from './portfolio.mjs';
const exec = promisify(execFile);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const MAX_BYTES = 256 * 1024 * 1024;
async function run(command, args, cwd, env) {
  try {
    const result = await exec(command,args,{cwd,env,encoding:'utf8',maxBuffer:32*1024*1024,timeout:15*60*1000});
    if(result.stdout) process.stdout.write(result.stdout);
    if(result.stderr) process.stderr.write(result.stderr);
    return result.stdout.trim();
  } catch(error) {throw new Error(`${command} ${args.join(' ')} failed: ${error.stderr || error.stdout || error.message}`);}
}
async function git(root,args,env) {
  const {stdout}=await exec('git',['-C',root,...args],{env,encoding:'utf8',maxBuffer:8*1024*1024,timeout:5*60*1000});return stdout.trim();
}
export async function containedPath(root,child) {
  const path=resolveInside(root,child);
  const parts=relative(resolve(root),path).split('/').filter(Boolean);
  let current=resolve(root);
  for(const part of parts){
    current=join(current,part);
    try {if((await lstat(current)).isSymbolicLink())throw new Error('Refusing symlink path: '+current);}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  return path;
}
async function assertGitClean(root,env) {
  const status=await git(root,['status','--porcelain','--untracked-files=normal'],env);
  if(status)throw new Error('Refusing dirty source before recipe: '+root+'\n'+status);
  const nested=await git(root,['submodule','status','--recursive'],env);
  if(nested && nested.split('\n').some(line=>!/^ ?[0-9a-f]{40} /u.test(line)||/^[+U-]/u.test(line)))throw new Error('Nested submodule pin drift: '+root);
  // `git` above trims the first status marker; use submodule foreach to inspect
  // every initialized child's tracked and untracked source as well.
  const children=await git(root,['submodule','foreach','--quiet','--recursive','git status --porcelain --untracked-files=normal'],env);
  if(children)throw new Error('Dirty nested submodule source: '+children);
}
export async function extractRelease(archive,target,format) {
  await mkdir(target,{recursive:true});
  const script=fileURLToPath(new URL('./extract-release.py',import.meta.url));
  await run('python3',[script,archive,target,format],dirname(archive),process.env);
}
async function acquireRelease(r,root,env) {
  const base=await containedPath(root,`.cache/releases/${r.id}-${r.source.sha256}`);
  const archive=base+'.download';
  await mkdir(dirname(base),{recursive:true});
  if(!await pathExists(archive)) {
    const response=await fetch(r.source.url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok)throw new Error('Release download failed: '+response.status);
    const chunks=[];let length=0;
    for await(const chunk of response.body){length+=chunk.length;if(length>MAX_BYTES)throw new Error('Release download exceeds limit');chunks.push(chunk);}
    const bytes=Buffer.concat(chunks);
    if(hash(bytes)!==r.source.sha256)throw new Error('Prebuilt release SHA-256 mismatch');
    await writeFile(archive,bytes,{flag:'wx'});
  }
  if(hash(await readFile(archive))!==r.source.sha256)throw new Error('Prebuilt release cache SHA-256 mismatch');
  // Extract afresh; a previous mutable extraction is never release authority.
  await rm(base,{recursive:true,force:true});await mkdir(base,{recursive:true});
  if(r.source.format==='file') {const target=await containedPath(base,r.source.filename||'release');await mkdir(dirname(target),{recursive:true});await writeFile(target,await readFile(archive));}
  else await extractRelease(archive,base,r.source.format);
  return base;
}
export async function executeRecipe(r,{rootDir,environment=process.env}={}) {
  // Reuse schema validation for standalone callers, not only inventory CLI.
  validatePortfolio({schemaVersion:'artifacts.fkr.dev/inventory-v1',recipes:{[r.id]:{...r,dependsOn:[]}},artifacts:[]});
  const root=resolve(rootDir), env={...environment,...r.environment};
  let sourceRoot,revision=null;
  if(r.source.kind==='local')sourceRoot=await containedPath(root,r.source.path);
  if(r.source.kind==='submodule') {
    const record=await git(root,['ls-files','-s','--',r.source.path],env);
    if(!record.startsWith(`160000 ${r.source.revision} 0\t`))throw new Error(`${r.id}: parent gitlink does not match recipe revision`);
    sourceRoot=await containedPath(root,r.source.path);
    // CI may already have initialized everything using checkout's recursive mode.
    if(!await pathExists(join(sourceRoot,'.git')))await run('git',['submodule','update','--init',...(r.source.recursive?['--recursive']:[]),'--',r.source.path],root,env);
    revision=await git(sourceRoot,['rev-parse','HEAD'],env);
    if(revision!==r.source.revision)throw new Error(`${r.id}: submodule revision drift`);
    if(r.source.recursive)await run('git',['submodule','update','--init','--recursive'],sourceRoot,env);
    await assertGitClean(sourceRoot,env);
  }
  if(r.source.kind==='git') {
    sourceRoot=await containedPath(root,`.cache/sources/${r.id}-${r.source.revision}`);
    await mkdir(dirname(sourceRoot),{recursive:true});
    if(!await pathExists(join(sourceRoot,'.git'))) {
      await mkdir(sourceRoot,{recursive:true});await git(sourceRoot,['init','-q'],env);
      await git(sourceRoot,['remote','add','origin',r.source.repository],env);
      await git(sourceRoot,['fetch','--depth=1','origin',r.source.revision],env);
      await git(sourceRoot,['checkout','--detach',r.source.revision],env);
    }
    if(await git(sourceRoot,['config','--get','remote.origin.url'],env)!==r.source.repository)throw new Error(`${r.id}: cached repository mismatch`);
    revision=await git(sourceRoot,['rev-parse','HEAD'],env);
    if(revision!==r.source.revision)throw new Error(`${r.id}: foreign checkout revision mismatch`);
    if(r.source.recursive)await run('git',['submodule','update','--init','--recursive'],sourceRoot,env);
    await assertGitClean(sourceRoot,env);
  }
  if (r.prepare!=='copy' && ['submodule','git'].includes(r.source.kind)) {
    const buildRoot=await containedPath(root,`.cache/builds/${r.id}-${revision}`);
    await mkdir(dirname(buildRoot),{recursive:true});
    await rm(buildRoot,{recursive:true,force:true});
    await run('git',['clone','--shared','--no-hardlinks','--no-checkout',sourceRoot,buildRoot],root,env);
    await git(buildRoot,['checkout','--detach',revision],env);
    await git(buildRoot,['config','remote.origin.url',r.source.repository],env);
    if(r.source.recursive)await run('git',['submodule','update','--init','--recursive'],buildRoot,env);
    sourceRoot=buildRoot;
  }
  if(r.source.kind==='release')sourceRoot=await acquireRelease(r,root,env);
  const sourceInfo=await lstat(sourceRoot);
  const cwd=sourceInfo.isDirectory()?await containedPath(sourceRoot,r.cwd||'.'):dirname(sourceRoot);
  if(r.prepare!=='copy') {
    // Delete only the declared generated output; never accept a stale dist.
    if(r.output==='.')throw new Error(`${r.id}: build output must differ from source root`);
    const output=await containedPath(sourceRoot,r.output);
    await rm(output,{recursive:true,force:true});
    for(const command of [...r.install||[],...r.commands||[]])await run(command[0],command.slice(1),cwd,env);
  }
  for(const command of r.checks||[])await run(command[0],command.slice(1),cwd,env);
  const outputRoot=sourceInfo.isFile()&&r.output==='.'?sourceRoot:await containedPath(sourceRoot,r.output);
  const outputInfo=await lstat(outputRoot);
  for(const expected of r.expectedFiles||[]) {
    const path=outputInfo.isFile()?outputRoot:await containedPath(outputRoot,expected);
    if(!await pathExists(path))throw new Error(`${r.id}: missing expected output ${expected}`);
  }
  return {id:r.id,source:r.source,prepare:r.prepare,sourceRoot,outputRoot,revision,commands:r.prepare==='copy'?[]:[...r.install||[],...r.commands||[]]};
}
export async function executeRecipes(p,options) {
  const results=[];
  for(const r of planPortfolio(p)) {
    console.log(`Recipe ${r.id}: ${r.source.kind} + ${r.prepare}`);
    results.push(await executeRecipe(r,options));
  }
  return results;
}
