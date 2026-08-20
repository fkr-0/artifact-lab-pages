import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildArtifact } from '../src/build.mjs';

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'artifactctl-'));
  await mkdir(join(rootDir, 'packages/demo-lib'), { recursive: true });
  await writeFile(join(rootDir, 'packages/demo-lib/package.release.json'), JSON.stringify({
    schemaVersion: 'artifacts.fkr.dev/library-release-v1', name: 'demo-lib', version: '1.0.0', files: ['demo.js'],
  }));
  await writeFile(join(rootDir, 'packages/demo-lib/demo.js'), 'globalThis.demoLibrary = true;\n');
  return rootDir;
}

test('single file stages independently and receives vendor provenance', async (t) => {
  const rootDir = await fixture();
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await writeFile(join(rootDir, 'tool.html'), '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Tool</title></head><body>ok</body></html>');
  const result = await buildArtifact({
    schemaVersion: 'artifacts.fkr.dev/v1', id: 'tool', version: '1.0.0', title: 'Tool', kind: 'application', status: 'active', required: true,
    source: { kind: 'file', path: 'tool.html', git: { mode: 'root' } },
    build: { mode: 'assemble', renderer: 'copy' },
    libraries: [{ name: 'demo-lib', version: '1.0.0', delivery: 'vendor', target: 'vendor/demo-lib' }],
    release: { kind: 'file', entrypoint: 'index.html', offline: true },
    launch: { default: 'newWindow', modes: ['newWindow'] },
    verify: { expectedFiles: ['index.html', 'vendor/demo-lib/demo.js'] },
  }, { rootDir, outDir: join(rootDir, 'out/artifacts'), libraryOutDir: join(rootDir, 'out/libraries') });
  assert.equal(result.receipt.verification.ok, true);
  assert.match(await readFile(join(result.stageRoot, 'vendor/demo-lib/receipt.json'), 'utf8'), /demo-lib/);
});

test('markdown assembles into standalone HTML', async (t) => {
  const rootDir = await fixture();
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await writeFile(join(rootDir, 'guide.md'), '# Guide\n\n- one\n- two\n');
  const result = await buildArtifact({
    schemaVersion: 'artifacts.fkr.dev/v1', id: 'guide', version: '1.0.0', title: 'Guide', kind: 'document', status: 'active', required: true,
    source: { kind: 'file', path: 'guide.md', git: { mode: 'root' } },
    build: { mode: 'assemble', renderer: 'markdown-html' },
    release: { kind: 'file', entrypoint: 'index.html', offline: true },
    launch: { default: 'newWindow', modes: ['newWindow'] },
    verify: { expectedFiles: ['index.html'] },
  }, { rootDir, outDir: join(rootDir, 'out/artifacts') });
  const html = await readFile(join(result.stageRoot, 'index.html'), 'utf8');
  assert.match(html, /<h1>Guide<\/h1>/);
  assert.match(html, /<li>one<\/li>/);
});

test('release-escaping references fail standalone verification', async (t) => {
  const rootDir = await fixture();
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await writeFile(join(rootDir, 'bad.html'), '<!doctype html><html lang="en"><head><title>Bad</title></head><body><script src="../hub/lib.js"></script></body></html>');
  await assert.rejects(() => buildArtifact({
    schemaVersion: 'artifacts.fkr.dev/v1', id: 'bad', title: 'Bad', kind: 'application', status: 'active', required: true,
    source: { kind: 'file', path: 'bad.html', git: { mode: 'root' } },
    build: { mode: 'none' },
    release: { kind: 'file', entrypoint: 'index.html' },
  }, { rootDir, outDir: join(rootDir, 'out/artifacts') }), /release-escaping reference/);
});
