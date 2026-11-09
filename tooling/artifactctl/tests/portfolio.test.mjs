import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePortfolio, planPortfolio, loadPortfolio, portfolioManifests } from '../src/portfolio.mjs';
const base = () => ({schemaVersion: 'artifacts.fkr.dev/inventory-v1', recipes: {
 demo: {source: {kind:'git', repository:'https://example.org/demo.git', revision:'a'.repeat(40), recursive:true}, prepare:'copy', output:'.'}
}, artifacts:[{id:'demo', title:'Demo', recipe:'demo'}]});
import { stringify as yamlStringify } from 'yaml';
const stringify = value => yamlStringify(value, {aliasDuplicateObjects:false});
test('recursive clone-only and clone-build remain independent recipes', () => {
 const p=base(); p.recipes.built={...p.recipes.demo,prepare:'build',output:'dist',install:[['pnpm','install','--frozen-lockfile']],commands:[['pnpm','build']]};
 const plan=planPortfolio(parsePortfolio(stringify(p)));
 assert.equal(plan[0].prepare,'copy'); assert.equal(plan[0].source.recursive,true);
 assert.equal(plan[1].prepare,'build'); assert.deepEqual(plan[1].commands,[['pnpm','build']]);
});
test('reject duplicate YAML keys, unknown recipe, duplicate artifact and floating revision', () => {
 assert.throws(()=>parsePortfolio('schemaVersion: a\nschemaVersion: b'),/unique|duplicate/i);
 const p=base(); p.artifacts[0].recipe='missing'; assert.throws(()=>parsePortfolio(stringify(p)),/recipe/i);
 p.artifacts[0].recipe='demo'; p.artifacts.push(p.artifacts[0]); assert.throws(()=>parsePortfolio(stringify(p)),/duplicate/i);
 p.artifacts.pop(); p.recipes.demo.source.revision='main'; assert.throws(()=>parsePortfolio(stringify(p)),/revision/i);
});
test('reject copy recipes with commands, escaping outputs, invalid argv and dependency cycles',()=>{
 const p=base(); p.recipes.demo.commands=[['node','build.mjs']]; assert.throws(()=>parsePortfolio(stringify(p)),/copy/i);
 delete p.recipes.demo.commands;p.recipes.demo.output='../escape';assert.throws(()=>parsePortfolio(stringify(p)),/output/i);
 p.recipes.demo.output='dist';p.recipes.demo.prepare='build';p.recipes.demo.commands=['pnpm build'];assert.throws(()=>parsePortfolio(stringify(p)),/argv/i);
 p.recipes.demo.commands=[['pnpm','build']];p.recipes.demo.dependsOn=['demo'];assert.throws(()=>parsePortfolio(stringify(p)),/cycle/i);
});
test('inventory covers current native and legacy portfolio with one source authority',async()=>{
 const p=await loadPortfolio(new URL('../../../',import.meta.url).pathname);
 assert.ok(p.artifacts.length>=64);
 const manifests=portfolioManifests(p);assert.ok(manifests.some(x=>x.id==='bewusstsein'));
 assert.ok(manifests.some(x=>x.id==='groove-scratch-studio'));
 assert.equal(p.recipes['hyperblast-shooter'].prepare,'copy');
 assert.equal(p.recipes['hyperblast-shooter'].source.kind,'submodule');
 assert.equal(p.recipes.revealive.prepare,'build');
 assert.ok(p.artifacts.some(x=>x.compatibility?.url==='/meme-lab/meme-lab.html'));
});

test('shared recipes map prepared outputs to each selecting artifact',async()=>{
 const {artifactPreparations}=await import('../src/portfolio.mjs');
 const p=base();p.artifacts=[{id:'one',title:'One',publish:'local',recipe:'demo'},{id:'two',title:'Two',publish:'local',recipe:'demo'}];
 const prepared=[{id:'demo',outputRoot:'/resolved/site'}];
 assert.equal(artifactPreparations(p,prepared).one.outputRoot,'/resolved/site');
 assert.equal(artifactPreparations(p,prepared).two.outputRoot,'/resolved/site');
});

test('publication descriptors omit references while discovery preserves historical metadata',()=>{
 const p=base();p.artifacts[0].manifest={id:'demo'};p.artifacts[0].publish='reference';
 assert.equal(portfolioManifests(p).length,1);
 assert.equal(portfolioManifests(p,{publication:true}).length,0);
});

test('declarative validation accepts a pinned foreign project before acquisition',async t=>{
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const root=await mkdtemp(join(tmpdir(),'foreign-inventory-'));t.after(()=>rm(root,{recursive:true,force:true}));const p=base();
 p.artifacts[0].publish='local';p.artifacts[0].manifest={schemaVersion:'artifacts.fkr.dev/v1',id:'demo',title:'Demo',status:'active',required:true,kind:'application',source:{kind:'project',path:'not-cloned-yet',git:{mode:'external',repository:p.recipes.demo.source.repository,revision:p.recipes.demo.source.revision}},build:{mode:'none'},release:{kind:'directory',entrypoint:'index.html'}};
 await writeFile(join(root,'inventory.yml'),stringify(p));
 const cli=new URL('../src/cli.mjs',import.meta.url).pathname;
 const result=spawnSync(process.execPath,[cli,'validate','--root',root],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
