import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildPublicationSite, REQUIRED_PUBLICATION_PATHS } from '../scripts/build-publication-site.mjs';

const rootDir = fileURLToPath(new URL('../', import.meta.url));

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

test('publication stage builds V13Hub from native manifests without resurrecting deleted V11 sources', async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), 'v13hub-publication-test-'));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const outDir = join(scratch, 'site');
  const result = await buildPublicationSite({ rootDir, outDir });

  assert.equal(result.manifest.schemaVersion, 'artifacts.fkr.dev/publication-site-v2');
  assert.equal(result.manifest.rootIndex, 'hub/v13/index.html');
  assert.equal(result.manifest.compatibility.legacyHubBundled, false);
  assert.equal(result.manifest.verifiedRequiredPaths, REQUIRED_PUBLICATION_PATHS.length);
  assert.ok(result.catalog.items.some((item) => item.id === 'app-hub-v13' && item.availability === 'verified'));
  assert.ok(result.catalog.items.some((item) => item.id === 'qr-studio'));
  assert.equal(result.catalog.items.some((item) => item.id === 'bathroom-emergency-guide'), false, 'archived records must not remain in the live catalog');
  assert.ok(result.builds.some((entry) => entry.manifest.id === 'app-hub-v13'));
  assert.equal(result.builds.some((entry) => entry.manifest.id === 'bathroom-emergency-guide'), false, 'archived records must not be built into the live site');

  for (const path of REQUIRED_PUBLICATION_PATHS) assert.equal(await exists(join(outDir, path)), true, `publication stage should include ${path}`);
  const rootIndex = await readFile(join(outDir, 'index.html'), 'utf8');
  assert.match(rootIndex, /hub\/v13\/index\.html/);
  const catalog = JSON.parse(await readFile(join(outDir, 'catalog/catalog.json'), 'utf8'));
  assert.equal(catalog.schemaVersion, 'artifacts.fkr.dev/catalog-v1');
  assert.equal(catalog.summary.total, result.catalog.items.length);

  const unavailableLocal = catalog.items.filter((item) =>
    item.availability === 'provisional' || item.availability === 'source-only');
  assert.ok(unavailableLocal.length > 0, 'fixture should exercise non-published catalog records');
  for (const item of unavailableLocal) {
    assert.equal(item.url, null, `${item.id} must not advertise a local URL that the publication stage does not contain`);
  }

  for (const item of catalog.items) {
    if (!item.url || /^https?:\/\//.test(item.url)) continue;
    const pathname = new URL(item.url, 'https://artifacts.fkr.dev/').pathname.replace(/^\/+/, '');
    assert.equal(
      await exists(join(outDir, pathname)),
      true,
      `${item.id} catalog URL must resolve inside the publication stage: ${item.url}`,
    );
  }
});

test('publication builder no longer imports the deleted V11 artifact-build server', async () => {
  const source = await readFile(join(rootDir, 'scripts/build-publication-site.mjs'), 'utf8');
  assert.doesNotMatch(source, /app-hub-v11\/server\/artifact-build/);
  assert.match(source, /discoverNativeManifests/);
  assert.match(source, /assembleSite/);
});
