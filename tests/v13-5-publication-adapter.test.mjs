import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { HANDOFF_SCHEMA, INTEGRATION_SCHEMA, stageQualifiedV13_5, validateSourceTransition } from '../scripts/stage-v13-5-publication.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');

async function fixture({
  catalogItems = 55,
  sourceRevision = 'a'.repeat(40),
  killer = false,
  nakamoto = false,
  vim = false,
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'v13-5-pages-adapter-'));
  const artifacts = join(root, 'artifacts');
  const v13 = join(root, 'v13');
  const dist = join(v13, 'dist');
  const output = join(root, 'stage');
  const files = {
    'index.html': '<!doctype html><title>V13.5</title>',
    'app.js': 'console.log("v13.5");',
    'styles.css': 'body{}',
    'meme-lab/meme-lab.html': '<!doctype html><title>Meme Lab</title>',
    'artifacts/revealive/0.1.0/index.html': '<!doctype html><title>Revealive</title>',
    'git-recipe-book/index.html': '<script type="module" src="./assets/main.js"></script><link rel="stylesheet" href="./assets/main.css">',
    'git-recipe-book/assets/main.js': 'console.log("git recipe");',
    'git-recipe-book/assets/main.css': 'body{display:block}',
    'catalog.json': '{"items":[]}',
    'parity-report.json': '{"summary":{}}',
    'route-manifest.json': '{"entries":[]}',
  };
  if (killer) {
    const prefix = 'artifacts/killer-sudoku-lab/1.0.0/';
    for (const name of ['index.html', 'app.mjs', 'engine.mjs', 'styles.css']) files[prefix + name] = 'qualified Killer Sudoku ' + name;
    files['catalog.json'] = JSON.stringify({items:[{id:'killer-sudoku-lab',availability:'verified',url:'/' + prefix + 'index.html'}]});
    files['route-manifest.json'] = JSON.stringify({entries:[{id:'killer-sudoku-lab',path:prefix + 'index.html',state:'staged'}]});
  }
  if (nakamoto) {
    const prefix = 'artifacts/nakamotos-disciples/0.2.0-alpha.13/';
    for (const name of ['index.html', 'icon.svg', 'manifest.webmanifest',
      'sw.js', 'SHA256SUMS']) files[prefix + name] = 'qualified Nakamoto ' + name;
    files[prefix + 'BUILD_PROVENANCE.json'] = JSON.stringify({
      artifactId: 'nakamotos-disciples',
      sourceVersion: '0.2.0-alpha.13',
      sourceRevision: '3d6f5360efdffa1b247c08dc0b9a6041df56eec7',
      sourceMapsIncluded: false,
    });
    for (let i = 0; i < 10; i += 1) files[prefix + 'assets/asset-' + i + '.js'] = 'qualified asset ' + i;
    files['catalog.json'] = JSON.stringify({items:[{
      id:'nakamotos-disciples', version:'0.2.0-alpha.13',
      availability:'verified', url:'/' + prefix + 'index.html',
    }]});
    files['route-manifest.json'] = JSON.stringify({entries:[{
      id:'nakamotos-disciples', path:prefix + 'index.html', state:'staged',
    }]});
  }
  if (vim) {
    const prefix = 'artifacts/vim-tomb-raider/1.0.0-rc.2/';
    files[prefix + 'index.html'] = '<script type="module" src="./assets/index-CGqy7tDU.js"></script><link rel="stylesheet" href="./assets/index-UZOijEoK.css">';
    files[prefix + 'assets/index-CGqy7tDU.js'] = 'console.log("Vim Tomb Raider");';
    files[prefix + 'assets/index-UZOijEoK.css'] = 'body{margin:0}';
    files[prefix + 'assets/sprites/explorer-core.png'] = 'mock-sprite';
    files[prefix + 'BUILD_PROVENANCE.json'] = JSON.stringify({
      artifactId: 'vim-tomb-raider', sourceVersion: '1.0.0-rc.2',
      sourceTag: 'v1.0.0-rc.2', sourceRevision: 'd851f478276c27048633fb6822bfb72eaa2569ef',
      sourceReleaseArchiveSha256: '7d415136b1552d58f8248aa6d2f1bcf687171ced6880c8aaf4702eb5ebe6bf42',
      sourceMapsIncluded: false, vendoredRuntimeFiles: 4,
    });
    files[prefix + 'SHA256SUMS'] = Object.entries(files)
      .filter(([path]) => path.startsWith(prefix) && !path.endsWith('/SHA256SUMS'))
      .map(([path, value]) => digest(value) + '  ' + path.slice(prefix.length)).join('\n') + '\n';
    files['catalog.json'] = JSON.stringify({items:[{
      id: 'vim-tomb-raider', version: '1.0.0-rc.2', availability: 'verified',
      url: '/' + prefix + 'index.html',
    }]});
    files['route-manifest.json'] = JSON.stringify({entries:[{
      id:'vim-tomb-raider', path:prefix + 'index.html', state:'staged',
    }]});
  }
  for (const [path, contents] of Object.entries(files)) {
    const target = join(dist, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  const assetManifest = {
    files: Object.fromEntries(Object.entries(files).map(([path, contents]) => [path, { sha256: digest(contents), bytes: Buffer.byteLength(contents) }])),
  };
  const assetText = JSON.stringify(assetManifest);
  await writeFile(join(dist, 'asset-manifest.json'), assetText);
  const handoff = {
    schemaVersion: HANDOFF_SCHEMA,
    release: { commit: 'b'.repeat(40), catalogItems, expectedV12Local: 44, stagedV12Local: 44, missingV12Local: 0 },
    canonicalSource: {
      repository: 'fkr-0/artifact-lab-pages',
      revision: 'a'.repeat(40),
      currentRevision: sourceRevision,
      transition: sourceRevision === 'a'.repeat(40) ? 'exact' : 'descendant',
    },
    catalog: { currentNativeAdded: killer ? ['revealive', 'killer-sudoku-lab'] : nakamoto ? ['revealive', 'nakamotos-disciples'] : vim ? ['revealive', 'vim-tomb-raider'] : ['revealive'] },
    regressions: {
      gitRecipeBook: { url: '/git-recipe-book/index.html', version: '1.1.0', assets: 2,
        sha256: digest(files['git-recipe-book/index.html']) },
      memeLab: { url: '/meme-lab/meme-lab.html', sha256: digest(files['meme-lab/meme-lab.html']) },
      revealive: { url: '/artifacts/revealive/0.1.0/index.html', sha256: digest(files['artifacts/revealive/0.1.0/index.html']) },
    },
    rootLauncher: {
      indexSha256: digest(files['index.html']),
      appSha256: digest(files['app.js']),
      stylesSha256: digest(files['styles.css']),
    },
    evidence: {
      assetManifestSha256: digest(assetText),
      catalogSha256: digest(files['catalog.json']),
      parityReportSha256: digest(files['parity-report.json']),
      routeManifestSha256: digest(files['route-manifest.json']),
      hashedFiles: Object.keys(assetManifest.files).length,
    },
  };
  await writeFile(join(dist, 'PUBLICATION_HANDOFF.json'), JSON.stringify(handoff));
  await mkdir(artifacts, { recursive: true });
  return { artifacts, v13, output };
}

test('qualified V13.5 handoff becomes the complete Pages stage', async () => {
  const { artifacts, v13, output } = await fixture();
  const result = await stageQualifiedV13_5({
    artifactRoot: artifacts,
    v13Root: v13,
    outDir: output,
    artifactSourceRevision: 'a'.repeat(40),
    v13Revision: 'b'.repeat(40),
  });
  assert.equal(result.receipt.schemaVersion, INTEGRATION_SCHEMA);
  assert.equal(result.receipt.v13_5.catalogItems, 55);
  assert.equal(result.receipt.v13_5.stagedV12Local, 44);
  assert.equal(result.receipt.v13_5.missingV12Local, 0);
  assert.match(await readFile(join(output, 'meme-lab', 'meme-lab.html'), 'utf8'), /Meme Lab/);
  assert.match(await readFile(join(output, 'artifacts', 'revealive', '0.1.0', 'index.html'), 'utf8'), /Revealive/);
  assert.equal(JSON.parse(await readFile(join(output, 'V13_5_PAGES_INTEGRATION.json'), 'utf8')).deployment.performed, false);
});

test('Vim Tomb Raider source changes require an exact reviewed release file set', () => {
  const transition = {
    pinnedRevision: 'a'.repeat(40), currentRevision: 'b'.repeat(40),
    pinnedIsAncestor: true,
    changedPaths: [
      'registry/sources.d/vim-tomb-raider.json',
      'vim-tomb-raider/index.html',
      'vim-tomb-raider/BUILD_PROVENANCE.json',
      'vim-tomb-raider/SHA256SUMS',
      'vim-tomb-raider/assets/index-CGqy7tDU.js',
    ],
  };
  assert.throws(() => validateSourceTransition(transition), /outside reviewed publication paths/);
  assert.equal(validateSourceTransition({
    ...transition, currentNativeAdded: ['vim-tomb-raider'],
  }).mode, 'integration-descendant');
  assert.throws(() => validateSourceTransition({
    ...transition, currentNativeAdded: ['vim-tomb-raider'],
    changedPaths: [...transition.changedPaths, 'vim-tomb-raider/assets/unreviewed.js'],
  }), /unreviewed\.js/);
});

test('Vim Tomb Raider release requires proven source, route and every intact runtime hash', async () => {
  const { artifacts, v13, output } = await fixture({ vim: true });
  const args = { artifactRoot: artifacts, v13Root: v13, outDir: output,
    artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) };
  await stageQualifiedV13_5(args);
  assert.match(await readFile(join(output, 'artifacts/vim-tomb-raider/1.0.0-rc.2/index.html'), 'utf8'), /assets\/index-CGqy7tDU.js/);
  await writeFile(join(v13, 'dist/artifacts/vim-tomb-raider/1.0.0-rc.2/assets/index-CGqy7tDU.js'), 'tampered');
  await assert.rejects(stageQualifiedV13_5(args), /hash mismatch.*vim-tomb-raider.*index-CGqy7tDU/);
});

test('Vim Tomb Raider provenance and checksums fail closed on inconsistent release evidence', async () => {
  const { artifacts, v13, output } = await fixture({ vim: true });
  const args = { artifactRoot: artifacts, v13Root: v13, outDir: output,
    artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) };
  const prefix = join(v13, 'dist/artifacts/vim-tomb-raider/1.0.0-rc.2');
  const sumsPath = join(prefix, 'SHA256SUMS');
  await writeFile(sumsPath, 'a'.repeat(64) + '  nonexistent.js\n');
  await assert.rejects(stageQualifiedV13_5(args), /SHA256SUMS has an invalid entry/);
});

test('reviewed Sudoku source changes require the handoff to contain the native addition', () => {
  const transition = {
    pinnedRevision: 'a'.repeat(40),
    currentRevision: 'b'.repeat(40),
    pinnedIsAncestor: true,
    changedPaths: [
      'registry/sources.d/sudoku-lab.json',
      'sudoku-lab/app.mjs',
      'sudoku-lab/engine.mjs',
      'sudoku-lab/index.html',
      'sudoku-lab/styles.css',
      'tests/e2e/sudoku-lab.spec.mjs',
      'tests/sudoku-lab.test.mjs',
    ],
  };
  assert.throws(() => validateSourceTransition(transition), /outside reviewed publication paths/);
  assert.equal(validateSourceTransition({ ...transition, currentNativeAdded: ['sudoku-lab'] }).mode, 'integration-descendant');
  assert.throws(() => validateSourceTransition({
    ...transition,
    currentNativeAdded: ['sudoku-lab'],
    changedPaths: [...transition.changedPaths, 'sudoku-lab/unreviewed.js'],
  }), /unreviewed\.js/);
});

test('Killer Sudoku source changes require a separately qualified native addition', () => {
  const changedPaths = [
    'registry/sources.d/killer-sudoku-lab.json',
    'killer-sudoku-lab/app.mjs', 'killer-sudoku-lab/engine.mjs',
    'killer-sudoku-lab/index.html', 'killer-sudoku-lab/styles.css',
    'tests/e2e/killer-sudoku-lab.spec.mjs', 'tests/killer-sudoku-lab.test.mjs',
  ];
  const transition = { pinnedRevision: 'a'.repeat(40), currentRevision: 'b'.repeat(40), pinnedIsAncestor: true, changedPaths };
  assert.throws(() => validateSourceTransition(transition), /outside reviewed publication paths/);
  assert.equal(validateSourceTransition({ ...transition, currentNativeAdded: ['killer-sudoku-lab'] }).mode, 'integration-descendant');
  assert.throws(() => validateSourceTransition({ ...transition, currentNativeAdded: ['killer-sudoku-lab'], changedPaths: [...changedPaths, 'killer-sudoku-lab/hidden.js'] }), /hidden.js/);
});

test('Killer Sudoku staged native route and executable hashes are checked', async () => {
  const { artifacts, v13, output } = await fixture({ killer: true });
  await stageQualifiedV13_5({ artifactRoot: artifacts, v13Root: v13, outDir: output, artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) });
  assert.match(await readFile(join(output, 'artifacts/killer-sudoku-lab/1.0.0/index.html'), 'utf8'), /qualified Killer Sudoku/);
  await writeFile(join(v13, 'dist/artifacts/killer-sudoku-lab/1.0.0/app.mjs'), 'tampered');
  await assert.rejects(stageQualifiedV13_5({ artifactRoot: artifacts, v13Root: v13, outDir: output, artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) }), /hash mismatch.*killer-sudoku-lab.*app.mjs/);
});

test('Nakamoto publication requires reviewed source paths and qualified catalog membership', () => {
  const transition = {
    pinnedRevision: 'a'.repeat(40),
    currentRevision: 'b'.repeat(40),
    pinnedIsAncestor: true,
    changedPaths: [
      'registry/sources.d/nakamotos-disciples.json',
      'nakamotos-disciples/BUILD_PROVENANCE.json',
      'nakamotos-disciples/assets/segwit-v0-lab-C1mLqn49.js',
    ],
  };
  assert.throws(() => validateSourceTransition(transition), /outside reviewed publication paths/);
  assert.equal(validateSourceTransition({...transition, currentNativeAdded:['nakamotos-disciples']}).mode, 'integration-descendant');
  assert.throws(() => validateSourceTransition({
    ...transition, currentNativeAdded:['nakamotos-disciples'],
    changedPaths:[...transition.changedPaths, 'nakamotos-disciples/assets/unreviewed.js'],
  }), /unreviewed.js/);
});

test('Nakamoto qualified release requires intact, hashed PWA assets and pinned provenance', async () => {
  const { artifacts, v13, output } = await fixture({ nakamoto: true });
  const args = { artifactRoot: artifacts, v13Root: v13, outDir: output,
    artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) };
  const success = await stageQualifiedV13_5(args);
  assert.equal(success.receipt.v13_5.stagedV12Local, 44);
  assert.match(await readFile(join(output, 'artifacts/nakamotos-disciples/0.2.0-alpha.13/index.html'), 'utf8'), /qualified Nakamoto/);
  await writeFile(join(v13, 'dist/artifacts/nakamotos-disciples/0.2.0-alpha.13/assets/asset-0.js'), 'tampered');
  await assert.rejects(stageQualifiedV13_5(args), /hash mismatch.*nakamotos-disciples.*asset-0.js/);
});

test('Git Recipe Book baseline correction is allowed only with qualified handoff', () => {
  const sourceTransition = { pinnedRevision: 'a'.repeat(40), currentRevision: 'b'.repeat(40),
    pinnedIsAncestor: true, changedPaths: ['git-recipe-book/index.html'] };
  assert.throws(() => validateSourceTransition(sourceTransition), /outside reviewed publication paths/);
  assert.equal(validateSourceTransition({ ...sourceTransition, gitRecipeBookQualified: true }).mode, 'integration-descendant');
  assert.throws(() => validateSourceTransition({ ...sourceTransition, gitRecipeBookQualified: true,
    changedPaths: ['git-recipe-book/index.html', 'git-recipe-book/hidden.js'] }), /hidden.js/);
});

test('Git Recipe Book release hash and compiled assets cannot be tampered with', async () => {
  const { artifacts, v13, output } = await fixture();
  const args = { artifactRoot: artifacts, v13Root: v13, outDir: output,
    artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) };
  await stageQualifiedV13_5(args);
  await writeFile(join(v13, 'dist/git-recipe-book/assets/main.js'), 'tampered');
  await assert.rejects(stageQualifiedV13_5(args), /hash mismatch.*git-recipe-book.*main.js/);
});

test('adapter rejects a handoff below the 55-item catalog floor', async () => {
  const { artifacts, v13, output } = await fixture({ catalogItems: 54 });
  await assert.rejects(
    stageQualifiedV13_5({
      artifactRoot: artifacts,
      v13Root: v13,
      outDir: output,
      artifactSourceRevision: 'a'.repeat(40),
      v13Revision: 'b'.repeat(40),
    }),
    /catalog is smaller than the qualified superset floor/,
  );
});

test('adapter rejects a handoff generated from a different Artifact Lab checkout', async () => {
  const { artifacts, v13, output } = await fixture({ sourceRevision: 'c'.repeat(40) });
  await assert.rejects(
    stageQualifiedV13_5({
      artifactRoot: artifacts,
      v13Root: v13,
      outDir: output,
      artifactSourceRevision: 'a'.repeat(40),
      v13Revision: 'b'.repeat(40),
    }),
    /does not match the source checkout recorded by the V13\.5 handoff/,
  );
});

test('adapter fails closed when the Artifact Lab source revision differs from the qualification pin', async () => {
  const { artifacts, v13, output } = await fixture({ sourceRevision: 'c'.repeat(40) });
  await assert.rejects(
    stageQualifiedV13_5({ artifactRoot: artifacts, v13Root: v13, outDir: output, artifactSourceRevision: 'c'.repeat(40), v13Revision: 'b'.repeat(40) }),
    /Canonical Artifact Lab revision mismatch/,
  );
});
test('adapter fails closed when Meme Lab payload no longer matches handoff evidence', async () => {
  const { artifacts, v13, output } = await fixture();
  await writeFile(join(v13, 'dist', 'meme-lab', 'meme-lab.html'), 'tampered');
  await assert.rejects(
    stageQualifiedV13_5({ artifactRoot: artifacts, v13Root: v13, outDir: output, artifactSourceRevision: 'a'.repeat(40), v13Revision: 'b'.repeat(40) }),
    /hash mismatch for meme-lab\/meme-lab\.html/,
  );
});

test('integration-only descendants may consume the pinned handoff', () => {
  const result = validateSourceTransition({
    pinnedRevision: 'a'.repeat(40),
    currentRevision: 'b'.repeat(40),
    pinnedIsAncestor: true,
    changedPaths: [
      '.github/workflows/pages.yml',
      '.gitignore',
      'apps/app-hub-v13/artifact.json',
      'package.json',
      'registry/generated/catalog.json',
      'scripts/stage-v13-5-publication.mjs',
      'tests/app-hub-v11-pages-workflow.test.mjs',
      'tests/hyperblast-release-smoke.mjs',
      'tests/v13-5-publication-adapter.test.mjs',
      'docs/v13-5-publication-integration.md',
    ],
  });
  assert.equal(result.mode, 'integration-descendant');
});

test('artifact-source changes require a fresh V13.5 handoff', () => {
  assert.throws(
    () => validateSourceTransition({
      pinnedRevision: 'a'.repeat(40),
      currentRevision: 'b'.repeat(40),
      pinnedIsAncestor: true,
      changedPaths: ['meme-lab/meme-lab.html'],
    }),
    /outside reviewed publication paths: meme-lab\/meme-lab\.html/,
  );
});
