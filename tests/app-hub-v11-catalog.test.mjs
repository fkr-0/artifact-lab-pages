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
      modifiedAt: '2026-01-02T00:00:00.000Z',
      operations: ['validate', 'index'],
    },
    {
      id: 'local-html',
      title: 'Local HTML App',
      kind: 'html-path',
      source: 'source-app/index.html',
      modifiedAt: '2026-01-03T00:00:00.000Z',
      launch: { modes: ['inline', 'newWindow'], defaultAction: 'inline' },
      operations: ['validate', 'copy', 'index'],
    },
    {
      id: 'note-only',
      title: 'Note Only',
      kind: 'info',
      note: 'Documentation-only item that should not require an href.',
      modifiedAt: '2026-01-01T00:00:00.000Z',
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
assert.deepEqual(result.items.map((item) => item.id), ['local-html', 'external-doc', 'note-only'], 'compiled catalog should sort artifacts by most recently modified first');
assert.equal(result.items.find((item) => item.id === 'external-doc').launch.defaultAction, 'newWindow', 'external links should default to new-window launch');
assert.equal(result.items.find((item) => item.id === 'note-only').launch.defaultAction, 'inline', 'info entries should default to inline launch');
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
assert.equal(emitted.items[0].id, 'local-html');
assert.equal(emitted.items[0].hubHref, 'compiled/local-html/index.html');
assert.ok(emitted.operations.copy.description.includes('deployment'));

const shooterCatalog = JSON.parse(
  await readFile('app-hub-v11/data/artifact-collection.json', 'utf8')
);
assert.equal(
  shooterCatalog.items.some((item) => item.id === 'root-multitext-viewer' || item.title === 'Multi-text Viewer'),
  false,
  'Multi-text Viewer should be removed from the v11 catalog'
);

const shooter = shooterCatalog.items.find((item) => item.id === 'hyperblast-shooter');
assert.ok(shooter, 'expected Hyperblast Shooter artifact in v11 catalog');
assert.equal(shooter.href, '../app-hub/shooter.html');
assert.deepEqual(
  shooter.launch.modes,
  ['inline', 'floating', 'newWindow'],
  'shooter should preserve v10-enhanced launch modes'
);
assert.deepEqual(
  shooter.launch.actions.map((action) => action.id),
  ['play-inline', 'floating-panel', 'multiplayer'],
  'shooter should expose v10-style launcher actions'
);
assert.equal(shooter.launch.actions[2].multiplayer, true);

const bomberman = shooterCatalog.items.find((item) => item.id === 'bomberman-v10');
assert.ok(bomberman, 'expected Bomberman artifact in v11 catalog');
assert.equal(bomberman.href, '../app-hub/bomberman.html');
assert.deepEqual(
  bomberman.launch.modes,
  ['inline', 'floating', 'fullscreen', 'newWindow'],
  'Bomberman should preserve v10 launch modes'
);
assert.deepEqual(
  bomberman.launch.actions.map((action) => action.id),
  ['play-inline', 'floating-panel', 'fullscreen', 'multiplayer', 'new-window'],
  'Bomberman should expose v10-style launcher actions'
);
assert.equal(bomberman.launch.actions[3].mode, 'floating');
assert.equal(bomberman.launch.actions[3].multiplayer, true);

const minesweeper = shooterCatalog.items.find((item) => item.id === 'minesweeper');
assert.ok(minesweeper, 'expected Minesweeper artifact in v11 catalog');
assert.equal(minesweeper.href, '../minesweeper/index.html');
assert.deepEqual(
  minesweeper.launch.actions.map((action) => action.id),
  ['play-inline', 'fullscreen', 'new-window'],
  'Minesweeper should expose v10-style launcher actions'
);

const solitaire = shooterCatalog.items.find((item) => item.id === 'solitaire');
assert.ok(solitaire, 'expected Solitaire artifact in v11 catalog');
assert.equal(solitaire.href, '../solitaire/index.html');
assert.deepEqual(
  solitaire.launch.actions.map((action) => action.id),
  ['play-inline', 'fullscreen', 'new-window'],
  'Solitaire should expose v10-style launcher actions'
);


assert.ok(
  shooterCatalog.items.every((item) => item.launch?.defaultAction || item.kind === 'external-link'),
  'all launchable manifest artifacts should define launch.defaultAction'
);
const catalogModifiedTimes = shooterCatalog.items.map((item) => Date.parse(item.modifiedAt || item.updatedAt || item.changedAt || item.generatedAt || item.createdAt || 0));
assert.deepEqual(
  catalogModifiedTimes,
  [...catalogModifiedTimes].sort((a, b) => b - a),
  'compiled v11 catalog should be ordered by most recently modified metadata'
);
const v8NativeNotes = shooterCatalog.items.find((item) => item.id === 'v8-native-scratchpad');
assert.ok(v8NativeNotes, 'v8 native scratchpad should be ported into legacy utilities');
assert.equal(v8NativeNotes.href, 'legacy-tools.html?tool=v8-native-scratchpad');
assert.equal(v8NativeNotes.launch.defaultAction, 'inline');
