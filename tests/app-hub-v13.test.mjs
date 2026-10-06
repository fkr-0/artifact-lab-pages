import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [rootIndex, html, app, css, manifest, peerBoundary, collection, packageJson] = await Promise.all([
  read('index.html'),
  read('src/v13hub/index.html'),
  read('src/v13hub/app.js'),
  read('src/v13hub/styles.css'),
  read('registry/sources.d/app-hub-v13.json').then(JSON.parse),
  read('src/v13hub/peer-boundary.js'),
  read('src/v13hub/collection.js'),
  read('package.json').then(JSON.parse),
]);

test('V13Hub is a first-class registered product and the root source-tree target', () => {
  assert.match(rootIndex, /apps\/app-hub-v13\/index\.html/);
  assert.equal(manifest.id, 'app-hub-v13');
  assert.equal(manifest.version, '2.1.0');
  assert.equal(manifest.source.path, 'src/v13hub');
  assert.equal(manifest.build.mode, 'assemble');
  assert.equal(manifest.release.offline, false);
  assert.match(html, /<h1 id="hero-title">Find the artifact/);
  assert.match(html, /id="catalog"/);
  assert.match(html, /id="inspector"/);
});

test('discovery, provenance, health, local collection, and peer boundaries have explicit UI seams', () => {
  for (const id of ['search', 'kind-filter', 'availability-filter', 'collected-only', 'collection-boundary', 'peer-boundary', 'facet-strip']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /loadCatalog/);
  assert.match(app, /createLocalCollectionStore/);
  assert.match(app, /readPeerSnapshot/);
  assert.match(collection, /permission-required/);
  assert.match(peerBoundary, /explicit-review-required/);
  assert.match(html, /PeerJSNet lobby/);
  assert.match(html, /id="arcade-tools"/);
  assert.doesNotMatch(html, /<iframe/i);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.match(packageJson.scripts['build:catalog'], /artifactctl\/src\/cli\.mjs catalog --out registry\/generated\/catalog\.json/);
  assert.doesNotMatch(packageJson.scripts['build:catalog'], /app-hub-v11/);
  assert.ok(packageJson.scripts['test:v13hub']);
  assert.ok(packageJson.scripts['test:e2e:v13hub']);
});

test('V13Hub UI is responsive, keyboard-visible, and reduced-motion aware', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /role="status"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.catalog\s*\{[^}]*display:\s*grid/s);
  assert.doesNotMatch(css, /resize:\s*(horizontal|vertical|both)/);
});
