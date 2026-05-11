import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { materializeArtifactBuild } from '../app-hub-v11/server/artifact-build.mjs';

const root = await mkdtemp(join(tmpdir(), 'artifact-build-'));
await mkdir(join(root, 'app-hub-v11'), { recursive: true });
await mkdir(join(root, 'static-tool'), { recursive: true });
await mkdir(join(root, 'built-tool', 'src'), { recursive: true });
await mkdir(join(root, 'docs'), { recursive: true });
await writeFile(join(root, 'app-hub-v11', 'index.html'), '<!doctype html><title>v11</title>');
await writeFile(join(root, 'app-hub-v11', 'package.json'), '{"type":"module"}');
await writeFile(join(root, 'static-tool', 'index.html'), '<!doctype html><title>static</title>');
await writeFile(join(root, 'docs', 'guide.md'), '# guide');
await writeFile(join(root, 'built-tool', 'package.json'), JSON.stringify({ scripts: { build: 'node build.mjs' } }));
await writeFile(join(root, 'built-tool', 'build.mjs'), "import { mkdir, writeFile } from 'node:fs/promises'; await mkdir('dist', { recursive: true }); await writeFile('dist/index.html', '<!doctype html><title>built</title>');\n");

const source = {
  collection: { id: 'demo', title: 'Demo' },
  deploy: {
    rootIndex: { source: 'app-hub-v11/index.html' },
    includeFiles: ['docs/guide.md'],
    includeDirs: ['app-hub-v11'],
  },
  items: [
    { id: 'static', title: 'Static', kind: 'html-path', href: '../static-tool/index.html', operations: ['validate', 'index'] },
    { id: 'external', title: 'External', kind: 'external-link', href: 'https://example.invalid', operations: ['validate', 'index'] },
    {
      id: 'built',
      title: 'Built Tool',
      kind: 'html-path',
      href: '../built-tool/dist/index.html',
      deploy: {
        build: { cwd: 'built-tool', command: 'node build.mjs', dist: 'dist' },
        includePath: 'built-tool/dist',
        targetPath: 'built-tool',
      },
      operations: ['validate', 'index'],
    },
  ],
};
await writeFile(join(root, 'app-hub-v11', 'artifacts.source.json'), JSON.stringify(source, null, 2));

const result = await materializeArtifactBuild({
  rootDir: root,
  sourcePath: join(root, 'app-hub-v11', 'artifacts.source.json'),
  outDir: join(root, 'stage'),
  runBuilds: true,
});

assert.equal(result.catalog.summary.total, 3);
assert.deepEqual(result.built.map((entry) => entry.id), ['built']);
assert.ok(result.included.some((entry) => entry.path === 'static-tool'));
assert.ok(result.included.some((entry) => entry.path === 'built-tool'));
assert.ok(result.skipped.some((entry) => entry.id === 'external' && entry.reason === 'external-link'));

assert.equal(await readFile(join(root, 'stage', 'index.html'), 'utf8'), '<!doctype html><title>v11</title>');
await stat(join(root, 'stage', 'app-hub-v11', 'index.html'));
await stat(join(root, 'stage', 'static-tool', 'index.html'));
assert.equal(await readFile(join(root, 'stage', 'built-tool', 'index.html'), 'utf8'), '<!doctype html><title>built</title>');
assert.equal(await readFile(join(root, 'stage', 'docs', 'guide.md'), 'utf8'), '# guide');
assert.match(await readFile(join(root, 'stage', 'BUILD_MANIFEST.json'), 'utf8'), /"built"/);

const packageScript = await readFile('artifacts-package', 'utf8');
assert.match(packageScript, /artifact-build\.mjs/, 'package script should materialize from the hub manifest');
const deployScript = await readFile('artifacts-deploy', 'utf8');
assert.match(deployScript, /\.artifacts-deploy-stage/, 'deploy should rsync a materialized manifest stage');
const serveScript = await readFile('artifacts-serve', 'utf8');
assert.match(serveScript, /app-hub-v11\/index\.html/, 'serve should open v11 by default');
const serverScript = await readFile('artifacts-server.sh', 'utf8');
assert.match(serverScript, /app-hub-v11\/index\.html/, 'server helpers should open v11 by default');
const rootIndex = await readFile('index.html', 'utf8');
assert.match(rootIndex, /app-hub-v11\/index\.html/, 'root index should redirect to v11');
