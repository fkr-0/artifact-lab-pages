import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { stageCompiledPublication } from '../scripts/stage-compiled-publication.mjs';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(
  await readFile(join(rootDir, 'registry/sources.d/revealive.json'), 'utf8'),
);
const provisionalManifest = JSON.parse(
  await readFile(join(rootDir, 'brickbreaker/artifact.json'), 'utf8'),
);

test('selective publication stages only Revealive and rewrites catalog/manifest as verified', async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), 'revealive-publication-stage-'));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const stageDir = join(scratch, 'site');
  await mkdir(join(stageDir, 'hub/v13'), { recursive: true });
  await writeFile(
    join(stageDir, 'BUILD_MANIFEST.json'),
    `${JSON.stringify({ schemaVersion: 'artifacts.fkr.dev/publication-site-v2', builds: [] }, null, 2)}\n`,
  );

  const calls = [];
  const result = await stageCompiledPublication({
    rootDir,
    stageDir,
    ids: ['revealive'],
    manifests: [manifest, provisionalManifest],
    requireParentGitlink: false,
    buildArtifactImpl: async (selected, options) => {
      calls.push({ id: selected.id, options });
      const stageRoot = join(options.outDir, selected.id, selected.version);
      await mkdir(stageRoot, { recursive: true });
      await writeFile(join(stageRoot, 'index.html'), '<!doctype html><title>Revealive</title>\n');
      return {
        manifest: selected,
        version: selected.version,
        stageRoot,
        receipt: {
          schemaVersion: 'artifacts.fkr.dev/artifact-receipt-v1',
          id: selected.id,
          version: selected.version,
          generatedAt: '2026-09-10T00:00:00.000Z',
          source: selected.source,
          build: selected.build,
          release: selected.release,
          libraries: [],
          verification: { ok: true, errors: [] },
          files: [{ path: 'index.html', size: 41, sha256: '0'.repeat(64) }],
        },
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'revealive');
  assert.equal(calls[0].options.allowCompile, true);
  assert.equal(result.compiledBuilds.length, 1);

  const catalog = JSON.parse(await readFile(join(stageDir, 'catalog/catalog.json'), 'utf8'));
  const item = catalog.items.find((entry) => entry.id === 'revealive');
  assert.equal(item.availability, 'verified');
  assert.equal(item.url, '/artifacts/revealive/0.1.0/index.html');
  assert.equal(item.receipt.version, '0.1.0');
  const provisionalItem = catalog.items.find((entry) => entry.id === provisionalManifest.id);
  assert.equal(provisionalItem.availability, 'provisional');
  assert.equal(provisionalItem.url, null, 'selective compile must not reintroduce unstaged provisional launch URLs');

  const fallback = JSON.parse(await readFile(join(stageDir, 'hub/v13/catalog.json'), 'utf8'));
  assert.deepEqual(fallback, catalog);

  const publication = JSON.parse(await readFile(join(stageDir, 'BUILD_MANIFEST.json'), 'utf8'));
  assert.ok(publication.builds.some((entry) => entry.id === 'revealive' && entry.version === '0.1.0'));
  assert.deepEqual(publication.selectiveCompiles, [
    { id: 'revealive', version: '0.1.0', revision: manifest.source.git.revision },
  ]);
});

test('selective publication rejects a checkout that does not match its immutable pin', async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), 'revealive-publication-pin-'));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const stageDir = join(scratch, 'site');
  await mkdir(stageDir, { recursive: true });

  const mismatched = {
    ...manifest,
    source: {
      ...manifest.source,
      git: { ...manifest.source.git, revision: '0'.repeat(40) },
    },
  };

  await assert.rejects(
    stageCompiledPublication({
      rootDir,
      stageDir,
      ids: ['revealive'],
      manifests: [mismatched],
      requireParentGitlink: false,
      buildArtifactImpl: async () => {
        throw new Error('builder must not run');
      },
    }),
    /does not match manifest pin/,
  );
});

test('Pages explicitly prepares and compiles pinned Revealive', async () => {
  const pages = await readFile(join(rootDir, '.github/workflows/pages.yml'), 'utf8');
  assert.match(pages, /Install dependencies \(revealive\)[\s\S]*working-directory: revealive/);
  assert.match(
    pages,
    /stage-compiled-publication\.mjs --stage \.artifacts-pages-stage --id revealive/,
  );
});
