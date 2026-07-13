import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const shooterPackage = JSON.parse(fs.readFileSync('hyperblast-shooter/package.json', 'utf8'));

assert.ok(packageJson.scripts['check:hyperblast']?.includes('test:hyperblast'), 'parent package should expose the scoped Hyperblast release gate');
assert.match(packageJson.scripts['test:hyperblast'], /npm --prefix hyperblast-shooter test/, 'parent gate should run the standalone repository tests');
assert.match(pagesWorkflow, /submodules: recursive/, 'Pages checkout should initialize the Hyperblast submodule');
assert.match(pagesWorkflow, /Run Hyperblast release gate/, 'Pages workflow should name the Hyperblast release gate step');
assert.match(pagesWorkflow, /npm run check:hyperblast/, 'Pages workflow should run the gate before deploy materialization');
assert.ok(
  pagesWorkflow.indexOf('npm run check:hyperblast') < pagesWorkflow.indexOf('Materialize deploy stage'),
  'Hyperblast release gate should run before materializing/uploading the Pages artifact',
);

for (const script of ['test', 'test:e2e', 'check', 'serve']) {
  assert.equal(typeof shooterPackage.scripts[script], 'string', `standalone package should expose ${script}`);
}

const readme = fs.readFileSync('hyperblast-shooter/README.md', 'utf8');
assert.match(readme, /npm run check/, 'README should document the standalone release gate');
assert.match(readme, /Stage Story Mode/, 'README should document the persistent stage campaign');
assert.match(readme, /1-vs-1/, 'README should document implemented versus gameplay');
assert.match(readme, /victim-authoritative/, 'README should document the network authority model');
assert.match(readme, /Bindings are editable/, 'README should document key rebinding');

const changelog = fs.readFileSync('hyperblast-shooter/changelog.md', 'utf8');
assert.match(changelog, /## 0\.1\.0 — 2026-07-13/, 'changelog should contain the initial release');
assert.match(changelog, /Production 1-vs-1 mode/, 'changelog should include the duel implementation');

const releaseTodo = fs.readFileSync('hyperblast-shooter/release-todo.yml', 'utf8');
for (const required of ['REL-001', 'REL-002', 'REL-003', 'REL-004', 'REL-005', 'REL-006']) {
  assert.match(releaseTodo, new RegExp(required), `release-todo.yml should include ${required}`);
}

console.log('hyperblast release readiness smoke checks passed');
