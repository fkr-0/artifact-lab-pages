import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const html = await read('apps/app-hub-v13/index.html');
const app = await read('apps/app-hub-v13/app.js');
const css = await read('apps/app-hub-v13/styles.css');
const catalog = JSON.parse(await read('apps/app-hub-v13/catalog.json'));
const rootIndex = await read('index.html');
const rootPackage = JSON.parse(await read('package.json'));

test('V13 is the root publication target with explicit release metadata', () => {
  assert.match(rootIndex, /apps\/app-hub-v13\/index\.html/);
  assert.match(html, /<h1>App Hub V13<\/h1>/);
  assert.match(html, /id="portfolio-version"/);
  assert.match(html, /id="build-date"/);
  assert.match(html, /id="runtime-footer"/);
  assert.match(html, /id="artifact-count"/);
  assert.match(html, /id="load-ms"/);
});

test('V13 search and filters are wired to one responsive catalog grid', () => {
  assert.match(html, /id="search"[^>]*type="search"/);
  assert.match(html, /id="kind-filter"/);
  assert.match(html, /id="availability-filter"/);
  assert.match(html, /id="clear-filters"/);
  assert.match(app, /function matchingItems\(/);
  assert.match(app, /kindFilterNode\.value/);
  assert.match(app, /availabilityFilterNode\.value/);
  assert.match(app, /clearFiltersNode\.addEventListener/);
  assert.match(app, /\.\/vendor\/artifact-bridge\/bridge\.js/);
  assert.match(app, /\.\.\/\.\.\/packages\/artifact-bridge\/bridge\.js/);
  assert.match(css, /\.catalog\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.catalog \{ grid-template-columns: 1fr; \}/);
  assert.doesNotMatch(css, /resize:\s*(horizontal|vertical|both)/);
});

test('V13 catalog build is first-class while V11 generation remains explicit legacy compatibility', () => {
  assert.equal(rootPackage.version, '1.7.0');
  assert.match(rootPackage.scripts['build:catalog'], /tooling\/artifactctl\/src\/cli\.mjs catalog/);
  assert.doesNotMatch(rootPackage.scripts['build:catalog'], /build:catalog:v11/);
  assert.match(rootPackage.scripts['build:catalog:v11'], /app-hub-v11\/build-artifacts-order\.js/);
});

test('generated V13 catalog is portfolio-complete, versioned, and newest-first by Git date', () => {
  assert.equal(catalog.schemaVersion, 'artifacts.fkr.dev/catalog-v1');
  assert.equal(catalog.build.portfolioVersion, '1.7.0');
  assert.equal(catalog.build.ordering, 'git-last-committed-change-desc');
  assert.ok(catalog.items.length >= 50, `expected V11 compatibility backfill plus native manifests, got ${catalog.items.length}`);
  assert.equal(catalog.summary.total, catalog.items.length);
  assert.ok(catalog.items.some((item) => item.id === 'app-hub-v13'));
  assert.ok(catalog.items.some((item) => item.id === 'qr-studio' && item.url && item.git?.basis === 'source'));
  for (let index = 1; index < catalog.items.length; index += 1) {
    const previous = Date.parse(catalog.items[index - 1].changedAt || '') || 0;
    const current = Date.parse(catalog.items[index].changedAt || '') || 0;
    assert.ok(previous >= current, `${catalog.items[index - 1].id} should not sort before newer ${catalog.items[index].id}`);
  }
});
