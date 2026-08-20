import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { collectGitMetadata, generateCatalog } from '../src/catalog.mjs';

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(import.meta.dirname, '../../..');

function manifest(id, path, title) {
  return {
    schemaVersion: 'artifacts.fkr.dev/v1',
    id,
    version: '1.0.0',
    title,
    description: `${title} fixture`,
    kind: 'application',
    status: 'active',
    required: true,
    source: { kind: 'file', path, git: { mode: 'root' } },
    build: { mode: 'none' },
    release: { kind: 'file', entrypoint: 'index.html' },
    launch: { default: 'newWindow', modes: ['newWindow'] },
  };
}

async function commit(rootDir, path, message, date) {
  await execFileAsync('git', ['add', '--', path], { cwd: rootDir });
  await execFileAsync('git', ['-c', 'user.name=Artifact Test', '-c', 'user.email=artifact-test@example.invalid', 'commit', '-q', '-m', message], {
    cwd: rootDir,
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
}

test('catalog ordering follows Git last-committed change dates', async (t) => {
  await mkdir(join(repositoryRoot, '.wsbridge'), { recursive: true });
  const rootDir = await mkdtemp(join(repositoryRoot, '.wsbridge', 'artifactctl-catalog-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await execFileAsync('git', ['init', '-q'], { cwd: rootDir });

  await writeFile(join(rootDir, 'older.html'), '<title>Older</title>\n');
  await commit(rootDir, 'older.html', 'older', '2026-01-10T12:00:00Z');
  await writeFile(join(rootDir, 'newer.html'), '<title>Newer</title>\n');
  await commit(rootDir, 'newer.html', 'newer', '2026-02-20T12:00:00Z');

  const manifests = [manifest('older', 'older.html', 'Older'), manifest('newer', 'newer.html', 'Newer')];
  const gitMetadata = await collectGitMetadata(manifests, { rootDir });
  const catalog = generateCatalog(manifests, [], { gitMetadata, portfolioVersion: '1.7.0' });

  assert.deepEqual(catalog.items.map((item) => item.id), ['newer', 'older']);
  assert.equal(catalog.items[0].git.basis, 'source');
  assert.equal(catalog.items[0].changedAt, '2026-02-20T12:00:00.000Z');
  assert.equal(catalog.items[0].url, '/newer.html');
  assert.equal(catalog.build.portfolioVersion, '1.7.0');
  assert.equal(catalog.build.ordering, 'git-last-committed-change-desc');
  assert.equal(catalog.summary.dated, 2);
});

test('declared generated source paths do not become their own Git-change provenance', async (t) => {
  const rootDir = await mkdtemp(join(repositoryRoot, '.wsbridge', 'artifactctl-catalog-ignore-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await execFileAsync('git', ['init', '-q'], { cwd: rootDir });

  await mkdir(join(rootDir, 'hub'));
  await writeFile(join(rootDir, 'hub', 'index.html'), '<title>Hub</title>\n');
  await commit(rootDir, 'hub/index.html', 'hub source', '2026-02-20T12:00:00Z');
  await writeFile(join(rootDir, 'hub', 'catalog.json'), '{}\n');
  await commit(rootDir, 'hub/catalog.json', 'generated catalog', '2026-03-20T12:00:00Z');

  const hub = {
    ...manifest('hub', 'hub', 'Hub'),
    source: { kind: 'directory', path: 'hub', entrypoint: 'index.html', git: { mode: 'root', ignorePaths: ['catalog.json'] } },
    release: { kind: 'directory', entrypoint: 'index.html' },
  };
  const gitMetadata = await collectGitMetadata([hub], { rootDir });

  assert.equal(gitMetadata.get('hub').basis, 'source');
  assert.equal(gitMetadata.get('hub').changedAt, '2026-02-20T12:00:00.000Z');
});

test('legacy timestamps remain a transparent fallback when a moved source has no commit at its new path', async (t) => {
  const rootDir = await mkdtemp(join(repositoryRoot, '.wsbridge', 'artifactctl-catalog-fallback-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await execFileAsync('git', ['init', '-q'], { cwd: rootDir });
  await writeFile(join(rootDir, 'moved.html'), '<title>Moved</title>\n');
  const moved = {
    ...manifest('moved', 'moved.html', 'Moved'),
    legacy: { adapter: 'app-hub-v11', href: '../old-name.html', changedAt: '2025-12-03T08:30:00Z' },
  };
  const gitMetadata = await collectGitMetadata([moved], { rootDir });
  assert.equal(gitMetadata.get('moved').basis, 'legacy');
  assert.equal(gitMetadata.get('moved').changedAt, '2025-12-03T08:30:00.000Z');
});
