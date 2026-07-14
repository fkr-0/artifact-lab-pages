import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { generateBuildStats } from '../app-hub-v11/server/generate-build-stats.mjs';

test('V11 Hub build stats expose semantic version and source provenance', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'artifact-build-stats-'));
  const sourcePath = join(temp, 'artifacts.json');
  const packagePath = join(temp, 'package.json');
  const outputPath = join(temp, 'nested', 'build-stats.json');
  await writeFile(sourcePath, JSON.stringify({ items: [{ id: 'one' }, { id: 'two' }] }));
  await writeFile(packagePath, JSON.stringify({ version: '9.8.7' }));

  const stats = await generateBuildStats({ sourcePath, packagePath, outputPath });
  const persisted = JSON.parse(await readFile(outputPath, 'utf8'));

  assert.equal(stats.schemaVersion, 2);
  assert.equal(stats.version, '9.8.7');
  assert.equal(stats.artifactCount, 2);
  assert.match(stats.commitHash, /^[0-9a-f]{40}$/);
  assert.match(stats.commitShort, /^[0-9a-f]{7,12}$/);
  assert.ok(Number.isFinite(Date.parse(stats.commitDate)));
  assert.ok(Number.isFinite(Date.parse(stats.builtAt)));
  assert.equal(typeof stats.dirty, 'boolean');
  assert.deepEqual(persisted, stats);
});

test('V11 Hub renders version, commit, and last-built metadata', async () => {
  const html = await readFile(new URL('../app-hub-v11/index.html', import.meta.url), 'utf8');
  for (const marker of [
    'id="headerVersion"',
    'id="headlineBuildVersion"',
    'id="headlineBuildCommit"',
    'id="headlineBuildDate"',
    'id="buildVersion"',
    'stats.commitShort',
    'stats.commitDate',
    'document.documentElement.dataset.hubVersion',
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

