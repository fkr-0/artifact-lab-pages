import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { discoverNativeManifests } from '../src/discover.mjs';

async function writeManifest(path, id) {
  await mkdir(path, { recursive: true });
  await writeFile(join(path, 'artifact.json'), JSON.stringify({ id }), 'utf8');
}

test('native discovery ignores transient publication stages', async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), 'artifactctl-discover-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));

  await writeManifest(join(rootDir, 'source-app'), 'source-app');
  await writeManifest(join(rootDir, '.artifacts-deploy-stage', 'source-app'), 'staged-copy');
  await writeManifest(join(rootDir, '.artifacts-pages-stage', 'other-app'), 'pages-copy');

  const manifests = await discoverNativeManifests({ rootDir });
  assert.deepEqual(manifests.map((manifest) => manifest.id), ['source-app']);
});
