import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { executeRecipe, extractRelease } from '../src/recipes.mjs';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'portfolio-recipe-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(join(root,'project'));await writeFile(join(root,'project/index.html'),'copy bytes');
 return root;
}
test('local copy executes no commands and requires its output',async t=>{
 const root=await fixture(t);const r={id:'demo',source:{kind:'local',path:'project'},prepare:'copy',output:'.',expectedFiles:['index.html']};
 const result=await executeRecipe(r,{rootDir:root}); assert.equal(result.outputRoot,join(root,'project'));
 assert.equal(await readFile(join(result.outputRoot,'index.html'),'utf8'),'copy bytes');
 await assert.rejects(executeRecipe({...r,output:'missing'},{rootDir:root}),/missing|ENOENT/i);
 await assert.rejects(executeRecipe({...r,commands:[['node','bad']]},{rootDir:root}),/copy/i);
});
test('recursive foreign clone can copy or build at the exact pin; rejects drift',async t=>{
 const root=await fixture(t), repo=join(root,'project');
 git(repo,'init','-q');git(repo,'add','.');git(repo,'-c','user.name=Test','-c','user.email=test@example.org','commit','-qm','fixture');const revision=git(repo,'rev-parse','HEAD');
 const config=join(root,'gitconfig');await writeFile(config,`[url "file://${repo}"]\n insteadOf = https://fixtures.invalid/demo.git\n[protocol "file"]\n allow = always\n`);
 const env={...process.env,GIT_CONFIG_GLOBAL:config};
 const r={id:'demo',source:{kind:'git',repository:'https://fixtures.invalid/demo.git',revision,recursive:true},prepare:'copy',output:'.',expectedFiles:['index.html']};
 const result=await executeRecipe(r,{rootDir:root,environment:env});assert.equal(result.revision,revision);
 assert.equal(await readFile(join(result.outputRoot,'index.html'),'utf8'),'copy bytes');
 await assert.rejects(executeRecipe({...r,source:{...r.source,revision:'b'.repeat(40)}},{rootDir:root,environment:env}),/commit|revision|fetch|not our ref/i);
 const built=await executeRecipe({...r,id:'built',prepare:'build',output:'dist',commands:[['node','-e',"require('fs').mkdirSync('dist');require('fs').writeFileSync('dist/index.html','built')"]]},{rootDir:root,environment:env});
 assert.equal(await readFile(join(built.outputRoot,'index.html'),'utf8'),'built');
});
test('submodule copy checks parent gitlink before using checkout',async t=>{
 const root=await fixture(t);git(root,'init','-q');
 const r={id:'demo',source:{kind:'submodule',path:'project',repository:'https://fixtures.invalid/demo.git',revision:'a'.repeat(40),recursive:true},prepare:'copy',output:'.'};
 await assert.rejects(executeRecipe(r,{rootDir:root}),/gitlink|submodule/i);
});
test('reject escaping source and symlink output before commands can run',async t=>{
 const root=await fixture(t);await symlink('/tmp',join(root,'project/outside'));
 const r={id:'demo',source:{kind:'local',path:'project'},prepare:'copy',output:'outside'};
 await assert.rejects(executeRecipe(r,{rootDir:root}),/symlink/i);
 await assert.rejects(executeRecipe({...r,output:'../outside'},{rootDir:root}),/contained|output/i);
});
test('release extraction rejects traversal and symlinks, extracts regular payloads',async t=>{
 const root=await fixture(t); const archive=join(root,'bundle.zip');
 execFileSync('python3',['-c',"import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'w');z.writestr('../escape','bad');z.close()",archive]);
 await assert.rejects(extractRelease(archive,join(root,'out'),'zip'),/unsafe|escape|traversal/i);
 execFileSync('python3',['-c',"import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'w');z.writestr('index.html','release');z.close()",archive]);
 await extractRelease(archive,join(root,'out'),'zip');assert.equal(await readFile(join(root,'out/index.html'),'utf8'),'release');
});

test('prebuilt cache bytes must match the locked hash and file names stay contained',async t=>{
 const root=await fixture(t);const {createHash}=await import('node:crypto');const bytes=Buffer.from('payload'),digest=createHash('sha256').update(bytes).digest('hex');
 const r={id:'prebuilt',source:{kind:'release',url:'https://example.org/release',sha256:digest,format:'file',filename:'index.html'},prepare:'copy',output:'.',expectedFiles:['index.html']};
 await mkdir(join(root,'.cache/releases'),{recursive:true});await writeFile(join(root,`.cache/releases/prebuilt-${digest}.download`),bytes);
 const result=await executeRecipe(r,{rootDir:root});assert.equal(await readFile(join(result.outputRoot,'index.html'),'utf8'),'payload');
 await writeFile(join(root,`.cache/releases/prebuilt-${digest}.download`),'changed');await assert.rejects(executeRecipe(r,{rootDir:root}),/SHA-256/);
 await assert.rejects(executeRecipe({...r,source:{...r.source,filename:'../../escape'}},{rootDir:root}),/filename|contained/i);
});
test('tar package with a root directory extracts; archive symlinks fail',async t=>{
 const root=await fixture(t),archive=join(root,'release.tar.gz');
 execFileSync('tar',['-czf',archive,'-C',join(root,'project'),'.']);await extractRelease(archive,join(root,'out'),'tar.gz');
 assert.equal(await readFile(join(root,'out/index.html'),'utf8'),'copy bytes');
 await symlink('/tmp',join(root,'project/escape'));execFileSync('tar',['-czf',archive,'-C',join(root,'project'),'.']);
 await assert.rejects(extractRelease(archive,join(root,'out2'),'tar.gz'),/unsafe|symlink|link/i);
});
