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
