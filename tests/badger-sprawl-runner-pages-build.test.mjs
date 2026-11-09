import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));
const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
const badger = source.items.find((item) => item.id === 'badger-sprawl-runner');

assert.ok(badger?.deploy?.build, 'badger-sprawl-runner must be built by the Pages materializer');
assert.match(
  badger.deploy.build.command,
  /\bpnpm\b/,
  'badger-sprawl-runner currently depends on pnpm for its materialized build command',
);

const {loadPortfolio} = await import('../tooling/artifactctl/src/portfolio.mjs');
const inventory=await loadPortfolio(process.cwd());
for(const id of ['badger-sprawl-runner','peerjslib-lobby-share']) {
 const recipe=inventory.recipes[id];
 assert.equal(recipe.source.kind,'submodule');assert.equal(recipe.source.recursive,true);
 assert.equal(recipe.prepare,'build');assert.deepEqual(recipe.install,[['pnpm','install','--frozen-lockfile']]);
 assert.deepEqual(recipe.commands,[[ 'pnpm','run',id==='badger-sprawl-runner'?'build':'sample:build' ]]);
}
assert.ok(workflow.indexOf('corepack enable') < workflow.indexOf('run: pnpm build'));
assert.ok(workflow.indexOf('run: pnpm build') < workflow.indexOf('Upload Pages artifact'));
