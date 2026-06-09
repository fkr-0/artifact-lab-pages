import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.ok(packageJson.scripts['check:hyperblast']?.includes('test:hyperblast'), 'package.json should expose the scoped Hyperblast release gate');
assert.match(pagesWorkflow, /Run Hyperblast release gate/, 'Pages workflow should name the Hyperblast release gate step');
assert.match(pagesWorkflow, /npm run check:hyperblast/, 'Pages workflow should run npm run check:hyperblast before deploy materialization');
assert.ok(
  pagesWorkflow.indexOf('npm run check:hyperblast') < pagesWorkflow.indexOf('Materialize deploy stage'),
  'Hyperblast release gate should run before materializing/uploading the Pages artifact',
);

const readme = fs.readFileSync('hyperblast-shooter/README.md', 'utf8');
assert.match(readme, /npm run check:hyperblast/, 'README should document the release gate command');
assert.match(readme, /Versus Mode \(experimental\)/, 'README should clearly label VS as experimental');
assert.match(readme, /Key rebinding/, 'README should document key rebinding');

const releaseTodo = fs.readFileSync('hyperblast-shooter/release-todo.yml', 'utf8');
for (const required of [
  'P0-001',
  'P0-002',
  'P0-003',
  'P1-001',
  'P1-002',
  'P1-003',
  'P1-004',
  'P1-005',
  'P2-001',
]) {
  assert.match(releaseTodo, new RegExp(required), `release-todo.yml should include ${required}`);
}

console.log('hyperblast release readiness smoke checks passed');
