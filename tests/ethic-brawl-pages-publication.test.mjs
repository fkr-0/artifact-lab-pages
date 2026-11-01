import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import {
  inspectEthicBrawl, publishEthicBrawl, verifyEthicBrawlStage,
} from '../scripts/publish-ethic-brawl-pages.mjs';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}
const html = `<!doctype html><html><head><link rel="stylesheet" href="./assets/index-abc123.css">
<script type="module" src="./assets/index-abc123.js"></script></head><body>play</body></html>`;
async function json(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2));
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'ethic-brawl-pages-'));
  const game = join(root, 'ethic-brawl');
  const stage = join(root, 'stage');
  await mkdir(game, { recursive: true });
  git(root, 'init', '-q');
  git(game, 'init', '-q');
  git(game, 'config', 'user.name', 'Release Test');
  git(game, 'config', 'user.email', 'release@example.invalid');
  await json(join(game, 'package.json'), { name: 'ethic-brawl', version: '1.9.3' });
  await mkdir(join(game, 'dist/assets'), { recursive: true });
  await writeFile(join(game, 'dist/index.html'), html);
  await writeFile(join(game, 'dist/assets/index-abc123.js'), 'console.log("play");');
  await writeFile(join(game, 'dist/assets/index-abc123.css'), 'body{color:white}');
  git(game, 'add', 'package.json');
  git(game, 'commit', '-qm', 'release source');
  const revision = git(game, 'rev-parse', 'HEAD');
  git(root, 'update-index', '--add', '--cacheinfo', '160000,' + revision + ',ethic-brawl');
  const manifest = {
    id: 'ethic-brawl', version: '1.9.3',
    source: { kind: 'project', path: 'ethic-brawl',
      git: { mode: 'submodule', revision, repository: 'https://github.com/fkr-0/ethic-brawl.git' } },
    build: { mode: 'compile', cwd: 'ethic-brawl', output: 'dist' },
    release: { kind: 'directory', path: 'dist', entrypoint: 'index.html', offline: true },
  };
  const manifestPath = join(root, 'registry/sources.d/ethic-brawl.json');
  await json(manifestPath, manifest);
  await json(join(stage, 'V13_5_PAGES_INTEGRATION.json'), {
    v13_5: { stagedV12Local: 44, missingV12Local: 0, catalogItems: 55 },
    deployment: { performed: false },
  });
  await json(join(stage, 'PUBLICATION_HANDOFF.json'), {
    schemaVersion: 'artifacts-v13.5/publication-handoff-v1',
  });
  await json(join(stage, 'asset-manifest.json'), { schemaVersion: 'artifacts-v13.5/asset-manifest-v1', files: {} });
  await json(join(stage, 'catalog.json'), { items: [
    { id: 'ethic-brawl', version: null, availability: 'provisional', url: '/ethic-brawl/index.html' },
    { id: 'ethic-brawl-source', availability: 'external', url: 'https://github.com/fkr-0/ethic-brawl' },
  ] });
  await json(join(stage, 'route-manifest.json'), { entries: [
    { id: 'ethic-brawl', path: 'ethic-brawl/index.html', state: 'staged' },
  ] });
  return { root, game, stage, revision, manifest, manifestPath };
}
const withFixture = async (fn) => {
  const f = await fixture();
  try { await fn(f); } finally { await rm(f.root, { recursive: true, force: true }); }
};

test('compiled independent submodule produces versioned Pages route, Hub entry and hashes', async () => withFixture(async (f) => {
  const receipt = await publishEthicBrawl({ root: f.root, stageRoot: f.stage });
  assert.equal(receipt.sourceRevision, f.revision);
  assert.equal(receipt.route, '/artifacts/ethic-brawl/1.9.3/index.html');
  assert.equal(receipt.runtimeFiles.length, 3);
  const catalog = JSON.parse(await readFile(join(f.stage, 'catalog.json')));
  const game = catalog.items.find((item) => item.id === 'ethic-brawl');
  assert.equal(game.version, '1.9.3');
  assert.equal(game.availability, 'verified');
  assert.equal(game.url, receipt.route);
  assert.equal(catalog.items.find((item) => item.id === 'ethic-brawl-source').availability, 'external');
  assert.match(await readFile(join(f.stage, 'ethic-brawl/index.html'), 'utf8'), /\.\.\/artifacts\/ethic-brawl\/1\.9\.3\/index\.html/u);
  const validated = await verifyEthicBrawlStage({ root: f.root, stageRoot: f.stage });
  assert.equal(validated.files, 3);
  await assert.rejects(publishEthicBrawl({ root: f.root, stageRoot: f.stage }), /refusing existing game output/u);
}));

test('preflight refuses a missing submodule gitlink', async () => withFixture(async (f) => {
  git(f.root, 'update-index', '--force-remove', 'ethic-brawl');
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /gitlink/u);
}));
test('preflight refuses a mismatched submodule pin or checkout', async () => withFixture(async (f) => {
  git(f.root, 'update-index', '--add', '--cacheinfo', '160000,' + 'a'.repeat(40) + ',ethic-brawl');
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /gitlink/u);
  git(f.root, 'update-index', '--add', '--cacheinfo', '160000,' + f.revision + ',ethic-brawl');
  const changed = { ...f.manifest, source: { ...f.manifest.source,
    git: { ...f.manifest.source.git, revision: 'b'.repeat(40) } } };
  await json(f.manifestPath, changed);
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /gitlink/u);
}));
test('preflight refuses stale registry version', async () => withFixture(async (f) => {
  await json(f.manifestPath, { ...f.manifest, version: '1.9.2' });
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /stale registry/u);
}));
test('preflight refuses missing build output and missing referenced assets', async () => withFixture(async (f) => {
  await rm(join(f.game, 'dist/index.html'));
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /dist\/index\.html is missing/u);
  await writeFile(join(f.game, 'dist/index.html'), html);
  await rm(join(f.game, 'dist/assets/index-abc123.js'));
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /missing asset/u);
}));
test('preflight refuses local tracked sprite/source edits', async () => withFixture(async (f) => {
  await writeFile(join(f.game, 'package.json'), JSON.stringify({ name: 'ethic-brawl', version: '1.9.4' }));
  await assert.rejects(inspectEthicBrawl({ root: f.root }), /tracked source is dirty/u);
}));
test('stage fails when the V13.5 parity gate or Hub source link is damaged', async () => withFixture(async (f) => {
  await json(join(f.stage, 'V13_5_PAGES_INTEGRATION.json'), {
    v13_5: { stagedV12Local: 43, missingV12Local: 1, catalogItems: 55 },
    deployment: { performed: false },
  });
  await assert.rejects(publishEthicBrawl({ root: f.root, stageRoot: f.stage }), /parity receipt/u);
  await json(join(f.stage, 'V13_5_PAGES_INTEGRATION.json'), {
    v13_5: { stagedV12Local: 44, missingV12Local: 0, catalogItems: 55 },
    deployment: { performed: false },
  });
  const catalog = await json(join(f.stage, 'catalog.json'), { items: [
    { id: 'ethic-brawl' }, { id: 'ethic-brawl-source', availability: 'verified', url: '/index.html' },
  ] });
  await assert.rejects(publishEthicBrawl({ root: f.root, stageRoot: f.stage }), /source link/u);
}));
test('poststage verifier catches corruption of a hashed JS asset and catalog entry', async () => withFixture(async (f) => {
  await publishEthicBrawl({ root: f.root, stageRoot: f.stage });
  const script = join(f.stage, 'artifacts/ethic-brawl/1.9.3/assets/index-abc123.js');
  await writeFile(script, 'tampered');
  await assert.rejects(verifyEthicBrawlStage({ root: f.root, stageRoot: f.stage }), /staged asset modified/u);
  await writeFile(script, 'console.log("play");');
  const catalogPath = join(f.stage, 'catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath));
  catalog.items[0].url = '/wrong/index.html';
  await json(catalogPath, catalog);
  await assert.rejects(verifyEthicBrawlStage({ root: f.root, stageRoot: f.stage }), /catalog or stage route/u);
}));
