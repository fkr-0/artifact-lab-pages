import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { HANDOFF_SCHEMA, INTEGRATION_SCHEMA, stageQualifiedV13_5, validateSourceTransition } from '../scripts/stage-v13-5-publication.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');

async function fixture() {
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
    'catalog.json': '{"items":[]}',
    'parity-report.json': '{"summary":{}}',
    'route-manifest.json': '{"entries":[]}',
  };
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
    release: { commit: 'b'.repeat(40), catalogItems: 56, expectedV12Local: 44, stagedV12Local: 44, missingV12Local: 0 },
    canonicalSource: { repository: 'fkr-0/artifact-lab-pages', revision: 'a'.repeat(40) },
    catalog: { currentNativeAdded: ['revealive'] },
    regressions: {
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
  assert.equal(result.receipt.v13_5.stagedV12Local, 44);
  assert.equal(result.receipt.v13_5.missingV12Local, 0);
  assert.match(await readFile(join(output, 'meme-lab', 'meme-lab.html'), 'utf8'), /Meme Lab/);
  assert.match(await readFile(join(output, 'artifacts', 'revealive', '0.1.0', 'index.html'), 'utf8'), /Revealive/);
  assert.equal(JSON.parse(await readFile(join(output, 'V13_5_PAGES_INTEGRATION.json'), 'utf8')).deployment.performed, false);
});
test('adapter fails closed when the Artifact Lab source revision differs', async () => {
  const { artifacts, v13, output } = await fixture();
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
    /outside integration-only paths: meme-lab\/meme-lab\.html/,
  );
});
