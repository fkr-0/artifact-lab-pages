import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildPublicationSite, REQUIRED_PUBLICATION_PATHS } from '../scripts/build-publication-site.mjs';

const rootDir = fileURLToPath(new URL('../', import.meta.url));

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

test('publication stage promotes V13 while retaining V11 compatibility and relocated artifact URLs', async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), 'artifact-lab-publication-test-'));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const outDir = join(scratch, 'site');

  const result = await buildPublicationSite({ rootDir, outDir, runBuilds: false });
  assert.equal(result.manifest.rootIndex, 'hub/v13/index.html');
  assert.equal(result.manifest.verifiedRequiredPaths, REQUIRED_PUBLICATION_PATHS.length);
  assert.equal(result.v13.catalog.summary.total, 58);
  assert.equal(result.v13.catalog.summary.verified, 5);
  assert.ok(result.v13.catalog.items.some((item) => item.id === 'brickbreaker' && item.availability === 'provisional' && item.url === '/brickbreaker/index.html'));
  assert.equal(result.v13.builds.some((entry) => entry.manifest.id === 'brickbreaker'), false);
  assert.ok(result.v13.builds.some((entry) => entry.manifest.id === 'app-hub-v13'));

  for (const path of REQUIRED_PUBLICATION_PATHS) {
    assert.equal(await exists(join(outDir, path)), true, `publication stage should include ${path}`);
  }

  const rootIndex = await readFile(join(outDir, 'index.html'), 'utf8');
  assert.match(rootIndex, /hub\/v13\/index\.html/);
  const catalogText = await readFile(join(outDir, 'catalog/catalog.json'), 'utf8');
  const fallbackCatalogText = await readFile(join(outDir, 'hub/v13/catalog.json'), 'utf8');
  assert.equal(fallbackCatalogText, catalogText, 'V13 same-directory fallback catalog must match the authoritative generated catalog');
  const catalog = JSON.parse(catalogText);
  assert.equal(catalog.build.portfolioVersion, '1.7.0');
  assert.ok(catalog.items.some((item) => item.id === 'club-ledger' && item.url === '/club-ledger/index.html'));
  assert.ok(catalog.items.some((item) => item.id === 'qr-studio' && item.url === '/artifacts/qr-studio/0.1.0/index.html'));
});

test('Pages workflow and package scripts use the composite V13 publication builder', async () => {
  const [workflow, pkg, packageScript, deployScript] = await Promise.all([
    readFile(join(rootDir, '.github/workflows/pages.yml'), 'utf8'),
    readFile(join(rootDir, 'package.json'), 'utf8').then(JSON.parse),
    readFile(join(rootDir, 'artifacts-package'), 'utf8'),
    readFile(join(rootDir, 'artifacts-deploy'), 'utf8'),
  ]);
  assert.match(workflow, /Build \(badger-sprawl-runner\)[\s\S]*pnpm run build/);
  assert.match(workflow, /node scripts\/build-publication-site\.mjs --source \.artifacts\.source\.ci\.json --out \.artifacts-pages-stage --no-build/);
  assert.doesNotMatch(workflow, /Materialize deploy stage[\s\S]*artifact-build\.mjs/);
  assert.equal(
    pkg.scripts['build:site'],
    'node scripts/build-publication-site.mjs --out dist/site --no-build',
  );
  assert.match(packageScript, /node scripts\/build-publication-site\.mjs --out "\$STAGE"/);
  assert.match(deployScript, /node scripts\/build-publication-site\.mjs --out "\$STAGE_DIR"/);
});
