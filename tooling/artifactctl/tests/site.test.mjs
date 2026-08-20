import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverManifests } from '../src/discover.mjs';
import { loadReceiptBuilds } from '../src/catalog.mjs';
import { assembleSite } from '../src/site.mjs';

const rootDir = resolve(import.meta.dirname, '../../..');

test('V13 site builds native releases and catalogs V11 as provisional', async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'artifact-site-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const manifests = await discoverManifests({ rootDir, adapter: 'app-hub-v11' });
  const result = await assembleSite(manifests, {
    rootDir,
    outDir: join(temporary, 'site'),
  });
  assert.ok(result.catalog.summary.total >= 50);
  assert.ok(result.catalog.summary.verified >= 5);
  assert.ok(result.catalog.items.some((item) => item.id === 'brickbreaker' && item.availability === 'provisional' && item.url === '/brickbreaker/index.html'));
  assert.equal(result.builds.some((entry) => entry.manifest.id === 'brickbreaker'), false);
  assert.match(await readFile(join(temporary, 'site/hub/v13/app.js'), 'utf8'), /artifact-bridge/);
  assert.match(await readFile(join(temporary, 'site/hub/v13/catalog.json'), 'utf8'), /catalog-v1/);
  assert.match(await readFile(join(temporary, 'site/hub/v13/vendor/artifact-bridge/receipt.json'), 'utf8'), /library-receipt/);
  assert.match(await readFile(join(temporary, 'site/catalog/catalog.json'), 'utf8'), /app-hub-v13/);
  const loaded = await loadReceiptBuilds(manifests, join(temporary, 'site/artifacts'));
  assert.equal(loaded.length, result.builds.length);
});
