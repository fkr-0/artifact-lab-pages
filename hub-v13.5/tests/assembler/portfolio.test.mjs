import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assemblePortfolio, classifyBaselineItem, routePath } from '../../scripts/portfolio-lib.mjs';

function baseline(items) {
  return { schemaVersion: 'artifacts-v13.5/baseline-v1', source: { kind: 'test-fixture' }, items };
}
const meme = {
  id: 'meme-lab', title: 'Meme Lab', availability: 'provisional',
  sourceKind: 'directory', buildMode: 'none', url: '/meme-lab/meme-lab.html',
};

test('routePath strips query strings and rejects external routes', () => {
  assert.equal(routePath('/legacy-tools.html?tool=v9-notepad'), 'legacy-tools.html');
  assert.equal(routePath('https://example.test/tool'), null);
});

test('Git Recipe Book serves the compiled curriculum at its stable legacy route', async () => {
  const root = await mkdtemp(join(tmpdir(), 'v13-5-git-recipe-'));
  const source = join(root, 'source');
  const dist = join(source, 'git-recipe-book/dist');
  const output = join(root, 'out');
  await mkdir(join(dist, 'assets'), { recursive: true });
  await mkdir(join(source, 'meme-lab'), { recursive: true });
  await writeFile(join(source, 'meme-lab/meme-lab.html'), '<title>Meme</title>');
  await writeFile(join(source, 'git-recipe-book/index.html'), '<script type="module" src="./src/main.tsx"></script>');
  await writeFile(join(dist, 'index.html'),
    '<link rel="icon" href="data:,"><script type="module" src="./assets/main.js"></script><link rel="stylesheet" href="./assets/main.css">');
  await writeFile(join(dist, 'assets/main.js'), 'document.querySelector("body").dataset.loaded = "true";');
  await writeFile(join(dist, 'assets/main.css'), 'body{display:block}');
  const item = { id: 'git-recipe-book', title: 'Git Recipe Book', version: '1.1.0',
    availability: 'source-only', sourceKind: 'project', buildMode: 'compile',
    url: '/git-recipe-book/index.html' };
  const manifest = { build: { mode: 'compile', cwd: 'git-recipe-book', output: 'dist' },
    release: { entrypoint: 'index.html' }, verify: { expectedFiles: ['index.html'] } };
  const result = await assemblePortfolio({ baseline: baseline([meme, item]), sourceRoot: source,
    nativeManifests: { 'git-recipe-book': manifest }, outputRoot: output, strict: true });
  const deployed = result.deploymentCatalog.items.find((candidate) => candidate.id === 'git-recipe-book');
  assert.equal(deployed.availability, 'verified');
  assert.equal(deployed.url, '/git-recipe-book/index.html');
  assert.equal(deployed.deployment.sourceKind, 'canonical-compiled');
  assert.equal(deployed.receipt.files, 3);
  assert.equal(result.parity.summary.expectedLocal, 1);
  assert.equal(result.routeManifest.entries.find((entry) => entry.id === 'git-recipe-book').state, 'staged');
  assert.match(await readFile(join(output, 'git-recipe-book/index.html'), 'utf8'), /assets\/main.js/);
  const assets = JSON.parse(await readFile(join(output, 'asset-manifest.json'), 'utf8'));
  assert.match(assets.files['git-recipe-book/assets/main.js'].sha256, /^[a-f0-9]{64}$/u);

  await writeFile(join(dist, 'index.html'), '<script type="module" src="./src/main.tsx"></script>');
  await assert.rejects(assemblePortfolio({ baseline: baseline([item]), sourceRoot: source,
    nativeManifests: { 'git-recipe-book': manifest }, outputRoot: output, strict: true }),
    /compiled JavaScript and CSS entrypoints/);
});

test('Git Recipe Book refuses missing builds rather than silently shipping Vite source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'v13-5-git-recipe-missing-'));
  const source = join(root, 'source');
  await mkdir(join(source, 'git-recipe-book'), { recursive: true });
  await writeFile(join(source, 'git-recipe-book/index.html'), '<script src="./src/main.tsx"></script>');
  const item = { id: 'git-recipe-book', title: 'Git Recipe Book', version: '1.1.0',
    availability: 'source-only', sourceKind: 'project', buildMode: 'compile',
    url: '/git-recipe-book/index.html' };
  await assert.rejects(assemblePortfolio({ baseline: baseline([item]), sourceRoot: source,
    outputRoot: join(root, 'out'), strict: true }), /compiled release manifest/);
  await assert.rejects(assemblePortfolio({ baseline: baseline([item]), sourceRoot: source,
    outputRoot: join(root, 'out'), nativeManifests: { 'git-recipe-book': {
      build: { mode: 'compile', cwd: 'git-recipe-book', output: 'dist' }, release: { entrypoint: 'index.html' },
    } }, strict: true }), /compiled dist\/index.html is missing/);
});

test('provisional local V12 entries are release parity requirements', () => {
  assert.equal(classifyBaselineItem(meme), 'expected-local');
  assert.equal(classifyBaselineItem({ ...meme, id: 'source', availability: 'source-only' }), 'optional-local');
});

test('migration assembly physically stages Meme Lab and hashes the payload', async () => {
  const root = await mkdtemp(join(tmpdir(), 'v13-5-assembler-'));
  const source = join(root, 'source');
  const output = join(root, 'dist');
  await mkdir(join(source, 'meme-lab'), { recursive: true });
  await writeFile(join(source, 'meme-lab', 'meme-lab.html'), '<!doctype html><title>Meme</title>');
  const result = await assemblePortfolio({ baseline: baseline([meme]), sourceRoot: source, outputRoot: output, strict: true });
  assert.equal(result.parity.regressions.memeLab.staged, true);
  assert.equal(result.parity.summary.missingExpected, 0);
  assert.match(await readFile(join(output, 'meme-lab', 'meme-lab.html'), 'utf8'), /Meme/);
  const manifest = JSON.parse(await readFile(join(output, 'asset-manifest.json'), 'utf8'));
  assert.equal(typeof manifest.files['meme-lab/meme-lab.html'].sha256, 'string');
});

test('strict assembly fails when an expected V12 artifact disappears', async () => {
  const root = await mkdtemp(join(tmpdir(), 'v13-5-missing-'));
  const source = join(root, 'source');
  const output = join(root, 'dist');
  await mkdir(join(source, 'meme-lab'), { recursive: true });
  await writeFile(join(source, 'meme-lab', 'meme-lab.html'), 'meme');
  const missing = {
    id: 'lost-tool', title: 'Lost Tool', availability: 'provisional',
    sourceKind: 'directory', buildMode: 'none', url: '/lost-tool/index.html',
  };
  await assert.rejects(
    assemblePortfolio({ baseline: baseline([meme, missing]), sourceRoot: source, outputRoot: output, strict: true }),
    /strict parity failed/,
  );
  const report = JSON.parse(await readFile(join(output, 'parity-report.json'), 'utf8'));
  assert.equal(report.summary.missingExpected, 1);
  assert.equal(report.entries.find((entry) => entry.id === 'lost-tool').state, 'missing');
});

test('source-only local entries may remain unresolved without weakening expected parity', async () => {
  const root = await mkdtemp(join(tmpdir(), 'v13-5-source-only-'));
  const source = join(root, 'source');
  const output = join(root, 'dist');
  await mkdir(join(source, 'meme-lab'), { recursive: true });
  await writeFile(join(source, 'meme-lab', 'meme-lab.html'), 'meme');
  const result = await assemblePortfolio({
    baseline: baseline([
      meme,
      { id: 'docs-source', title: 'Docs source', availability: 'source-only',
        sourceKind: 'file', buildMode: 'assemble', url: '/docs/missing.md' },
    ]),
    sourceRoot: source, outputRoot: output, strict: true,
  });
  assert.equal(result.parity.summary.missingExpected, 0);
  assert.equal(result.parity.entries.find((entry) => entry.id === 'docs-source').state, 'source-only');
});

test('prepared project releases replace development HTML at stable compatibility routes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prepared-route-'));const source=join(root,'source'),output=join(root,'output'),release=join(source,'.cache/builds/game/dist');
 await mkdir(release,{recursive:true});await mkdir(join(source,'game'),{recursive:true});
 await writeFile(join(source,'game/index.html'),'<script src="/src/main.ts"></script>');
 await writeFile(join(release,'index.html'),'<script src="./game.js"></script>');await writeFile(join(release,'game.js'),'/* compiled */');
 const item={id:'game',title:'Game',availability:'provisional',sourceKind:'project',buildMode:'compile',url:'/game/index.html'};
 await mkdir(join(source,'meme-lab'),{recursive:true});await writeFile(join(source,'meme-lab/meme-lab.html'),'Meme');
 await assemblePortfolio({baseline:baseline([meme,item]),sourceRoot:source,outputRoot:output,preparedReleases:{game:{outputRoot:release,revision:'a'.repeat(40)}},nativeManifests:{game:{build:{mode:'compile'},release:{entrypoint:'index.html'},verify:{expectedFiles:['index.html']}}}});
 assert.match(await readFile(join(output,'game/index.html'),'utf8'),/\.\/game.js/);
 assert.equal(await readFile(join(output,'game/game.js'),'utf8'),'/* compiled */');
});

test('prepared static outputs control both compatibility routes and native additions',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prepared-copy-')),source=join(root,'source'),output=join(root,'output');
 await mkdir(join(source,'meme-lab'),{recursive:true});await writeFile(join(source,'meme-lab/meme-lab.html'),'Meme');
 await mkdir(join(source,'old'),{recursive:true});await writeFile(join(source,'old/index.html'),'OLD');
 await mkdir(join(source,'.cache/prebuilt'),{recursive:true});await writeFile(join(source,'.cache/prebuilt/index.html'),'NEW');
 const prepared={outputRoot:join(source,'.cache/prebuilt'),sourceRoot:join(source,'.cache/prebuilt')};
 const item={id:'static',title:'Static',availability:'provisional',sourceKind:'directory',buildMode:'none',url:'/old/index.html'};
 const manifest={source:{path:'old',kind:'directory'},build:{mode:'none'},release:{entrypoint:'index.html'}};
 await assemblePortfolio({baseline:baseline([meme,item]),sourceRoot:source,outputRoot:output,preparedReleases:{static:prepared},nativeManifests:{static:manifest}});
 assert.equal(await readFile(join(output,'old/index.html'),'utf8'),'NEW');
 const native={id:'new-static',version:'1',title:'New',buildMode:'none',availability:'source-only'};
 await assemblePortfolio({baseline:baseline([meme]),sourceRoot:source,outputRoot:output,preparedReleases:{'new-static':prepared},nativeCatalog:{items:[native]},nativeManifests:{'new-static':manifest}});
 assert.equal(await readFile(join(output,'artifacts/new-static/1/index.html'),'utf8'),'NEW');
});

test('reachable legacy assets cannot follow symlinks outside source',async()=>{
 const {symlink}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'route-symlink-')),source=join(root,'source');
 await mkdir(join(source,'meme-lab'),{recursive:true});await writeFile(join(root,'secret.js'),'private bytes');
 await writeFile(join(source,'meme-lab/meme-lab.html'),'<script src="./secret.js"></script>');await symlink(join(root,'secret.js'),join(source,'meme-lab/secret.js'));
 await assert.rejects(assemblePortfolio({baseline:baseline([meme]),sourceRoot:source,outputRoot:join(root,'out')}),/symlink|contain/i);
});

test('public parity metadata does not disclose the build checkout path',async()=>{
 const root=await mkdtemp(join(tmpdir(),'public-provenance-')),source=join(root,'source');await mkdir(join(source,'meme-lab'),{recursive:true});await writeFile(join(source,'meme-lab/meme-lab.html'),'Meme');
 const result=await assemblePortfolio({baseline:baseline([meme]),sourceRoot:source,outputRoot:join(root,'out')});
 assert.equal(result.parity.sourceRoot,'.');
});

test('an inventoried built project replaces its old metadata-only record with one launchable release',async()=>{
 const root=await mkdtemp(join(tmpdir(),'promoted-native-')),source=join(root,'source'),output=join(root,'out'),release=join(source,'.cache/prepared/dist');
 await mkdir(join(source,'meme-lab'),{recursive:true});await writeFile(join(source,'meme-lab/meme-lab.html'),'Meme');await mkdir(release,{recursive:true});await writeFile(join(release,'index.html'),'COMPILED');
 const item={id:'canvas',title:'Canvas',version:'1',sourceKind:'project',buildMode:'compile',availability:'source-only',url:null};
 const manifest={source:{kind:'project',path:'unused'},build:{mode:'compile',cwd:'unused',output:'dist'},release:{entrypoint:'index.html'}};
 const result=await assemblePortfolio({baseline:baseline([meme,item]),sourceRoot:source,outputRoot:output,nativeCatalog:{items:[item]},nativeManifests:{canvas:manifest},preparedReleases:{canvas:{outputRoot:release,revision:'a'.repeat(40)}}});
 const records=result.deploymentCatalog.items.filter(x=>x.id==='canvas');assert.equal(records.length,1);assert.equal(records[0].availability,'verified');assert.equal(records[0].url,'/artifacts/canvas/1/index.html');
 assert.equal(await readFile(join(output,'artifacts/canvas/1/index.html'),'utf8'),'COMPILED');
});

test('a relocatable compiled release rejects root-absolute asset references',async()=>{
 const root=await mkdtemp(join(tmpdir(),'root-asset-')),source=join(root,'source'),release=join(source,'project/dist');await mkdir(join(source,'meme-lab'),{recursive:true});await writeFile(join(source,'meme-lab/meme-lab.html'),'Meme');await mkdir(release,{recursive:true});await writeFile(join(release,'index.html'),'<script src="/assets/app.js"></script>');
 const item={id:'app',title:'App',version:'1',buildMode:'compile',availability:'source-only'};
 const manifest={source:{kind:'project',path:'project'},build:{mode:'compile',cwd:'project',output:'dist'},release:{entrypoint:'index.html'},verify:{relocatable:true}};
 await assert.rejects(assemblePortfolio({baseline:baseline([meme]),sourceRoot:source,outputRoot:join(root,'out'),nativeCatalog:{items:[item]},nativeManifests:{app:manifest}}),/relocat|absolute/i);
});
