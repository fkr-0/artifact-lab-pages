#!/usr/bin/env node
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadPortfolio,planPortfolio,portfolioBaseline,portfolioManifests} from '../tooling/artifactctl/src/portfolio.mjs';
import {executeRecipe,executeRecipes} from '../tooling/artifactctl/src/recipes.mjs';
import {sealSite,verifySite} from '../tooling/artifactctl/src/site-integrity.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const command=process.argv[2]||'plan';
const site=join(root,'dist/site');
const generated=join(root,'hub-v13.5/.generated');
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
function run(cmd,args,env={}) {
 return new Promise((resolve,reject)=>{
  const child=spawn(cmd,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});
  child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${cmd} exited ${code}`)));
 });
}
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
async function assertClean(){
 const dirty=git('status','--porcelain','--untracked-files=normal','--ignore-submodules=none');
 if(dirty)throw new Error('Publication requires committed source, including pinned clean submodules:\n'+dirty);
}
async function prepare(p){
 const prepared=await executeRecipes(p,{rootDir:root});
 const byId=Object.fromEntries(prepared.map(x=>[x.id,x]));
 const manifests=portfolioManifests(p);
 for(const m of manifests){
  const item=p.artifacts.find(a=>a.id===m.id), input=byId[item.recipe];
  if(input&&m.build.mode==='compile'){
   m.source.path=relative(root,input.sourceRoot).split('\\').join('/');
   m.build.cwd=m.source.path;m.build.output=relative(input.sourceRoot,input.outputRoot).split('\\').join('/')||'.';
   m.release.path=m.build.output;
  }
 }
 await mkdir(generated,{recursive:true});
 const json=async(name,value)=>writeFile(join(generated,name),JSON.stringify(value,null,2)+'\n');
 const historical=JSON.parse(await readFile(join(root,'hub-v13.5/catalog/v12-baseline.json'),'utf8'));
 await json('baseline.json',portfolioBaseline(p,historical));
 await json('manifests.json',Object.fromEntries(manifests.map(m=>[m.id,m])));
 await json('prepared.json',byId);
 // Editorial entries are explicitly selected by the same inventory.
 await json('editorial.json',{schemaVersion:'artifacts-v13.5/editorial-reports-v1',reports:p.artifacts.filter(a=>a.publish==='local'&&a.editorial).map(a=>a.editorial)});
 return prepared;
}
async function main(){
 if(command==='verify-site'){
  const receipt=await verifySite(site,{commit:process.env.SITE_REVISION||process.env.GITHUB_SHA||git('rev-parse','HEAD')});
  console.log(`Verified ${receipt.files.length} site files for ${receipt.commit}`);return;
 }
 if(command==='serve'){
  await verifySite(site);
  const port=process.argv[3]||'8080';if(!/^\d+$/u.test(port)||Number(port)>65535)throw new Error('Invalid port');
  console.log(`Serving qualified site at http://127.0.0.1:${port}/`);
  await run('python3',['-m','http.server',port,'--bind','127.0.0.1','--directory',site]);return;
 }
 if(command==='import-site'){
  if(!/^[a-f0-9]{40}$/u.test(process.env.SITE_REVISION||''))throw new Error('SITE_REVISION is required');
  const r={id:'whole-site',source:{kind:'release',url:process.env.SITE_URL,sha256:process.env.SITE_SHA256,format:'tar.gz'},prepare:'copy',output:'.',expectedFiles:['SITE_RECEIPT.json','index.html']};
  const input=await executeRecipe(r,{rootDir:root});await verifySite(input.outputRoot,{commit:process.env.SITE_REVISION});
  await rm(site,{recursive:true,force:true});await mkdir(dirname(site),{recursive:true});await cp(input.outputRoot,site,{recursive:true});
  await verifySite(site,{commit:process.env.SITE_REVISION});return;
 }
 const p=await loadPortfolio(root), plan=planPortfolio(p);
 if(command==='plan'||command==='inventory'){
  console.log(`${p.artifacts.length} inventory records; ${plan.length} enabled recipes`);
  for(const r of plan)console.log(`${r.id}: ${r.source.kind}${r.source.recursive?' (recursive)':''} + ${r.prepare} -> ${r.output}`);
  return;
 }
 if(command==='validate'){
  await run(process.execPath,['tooling/artifactctl/src/cli.mjs','validate']);return;
 }
 if(command!=='build')throw new Error('Expected plan, inventory, validate, build, verify-site, import-site or serve');
 await assertClean();
 const commit=git('rev-parse','HEAD');
 if(process.env.GITHUB_SHA&&process.env.GITHUB_SHA!==commit)throw new Error('Build differs from GITHUB_SHA');
 const prepared=await prepare(p);
 await run(process.execPath,['scripts/qualify-monorepo.mjs'],{
  ARTIFACTS_NATIVE_MANIFEST_FILE:join(generated,'manifests.json'),ARTIFACTS_BASELINE_FILE:join(generated,'baseline.json'),ARTIFACTS_PREPARED_FILE:join(generated,'prepared.json'),ARTIFACTS_EDITORIAL_FILE:join(generated,'editorial.json'),
 });
 await assertClean();
 const recipes=prepared.map(({id,revision,source,prepare,commands})=>({id,revision,source,prepare,commands}));
 await sealSite(site,{commit,inventorySha256:sha256(await readFile(join(root,'inventory.yml'))),recipes});
 console.log(`Qualified site: ${site}; ${commit}; not deployed`);
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
