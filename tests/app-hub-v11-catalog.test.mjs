import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileArtifactCollection, defaultArtifactOperations } from '../app-hub-v11/server/artifact-catalog.mjs';

const root = await mkdtemp(join(tmpdir(), 'app-hub-v11-catalog-'));
await mkdir(join(root, 'source-app'), { recursive: true });
await writeFile(join(root, 'source-app', 'index.html'), '<!doctype html><title>Source App</title>');

const source = {
  collection: { id: 'test-hub', title: 'Test Hub' },
  deploy: { basePath: 'app-hub-v11', copyRoot: 'compiled' },
  items: [
    {
      id: 'external-doc',
      title: 'External Docs',
      kind: 'external-link',
      href: 'https://example.invalid/docs',
      tags: ['docs'],
      operations: ['validate', 'index'],
    },
    {
      id: 'local-html',
      title: 'Local HTML App',
      kind: 'html-path',
      source: 'source-app/index.html',
      launch: { modes: ['inline', 'newWindow'] },
      operations: ['validate', 'copy', 'index'],
    },
    {
      id: 'note-only',
      title: 'Note Only',
      kind: 'info',
      note: 'Documentation-only item that should not require an href.',
      operations: ['validate', 'index'],
    },
  ],
};

const result = await compileArtifactCollection(source, {
  rootDir: root,
  outDir: join(root, 'dist'),
  operations: defaultArtifactOperations(),
});

assert.equal(result.collection.id, 'test-hub');
assert.equal(result.items.length, 3);
assert.deepEqual(result.summary.byKind, {
  'external-link': 1,
  'html-path': 1,
  info: 1,
});

const copied = result.items.find((item) => item.id === 'local-html');
assert.equal(copied.hubHref, 'compiled/local-html/index.html');
assert.equal(copied.deploy.include, true);
await stat(join(root, 'dist', 'compiled', 'local-html', 'index.html'));

const emitted = JSON.parse(await readFile(join(root, 'dist', 'artifact-collection.json'), 'utf8'));
assert.equal(emitted.items[0].id, 'external-doc');
assert.equal(emitted.items[1].hubHref, 'compiled/local-html/index.html');
assert.ok(emitted.operations.copy.description.includes('deployment'));

const shooterCatalog = JSON.parse(
  await readFile('app-hub-v11/data/artifact-collection.json', 'utf8')
);
const shooter = shooterCatalog.items.find((item) => item.id === 'hyperblast-shooter');
assert.ok(shooter, 'expected Hyperblast Shooter artifact in v11 catalog');
assert.equal(shooter.href, '../app-hub/shooter.html');
assert.deepEqual(
  shooter.launch.modes,
  ['inline', 'floating', 'newWindow'],
  'shooter should preserve v10-enhanced launch modes'
);
