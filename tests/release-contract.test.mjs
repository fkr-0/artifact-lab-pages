import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [packageText, bridge, changelog, evidence, gitignore] = await Promise.all([
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
  readFile(new URL('../bridge.yml', import.meta.url), 'utf8'),
  readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/release-evidence-v1.5.1.yml', import.meta.url), 'utf8'),
  readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
]);
const pkg = JSON.parse(packageText);

test('root release gate stays comprehensive and excludes independent release units', () => {
  const rootE2e = pkg.scripts['test:e2e:root'];
  const releaseCheck = pkg.scripts['release:check'];

  assert.match(rootE2e, /app-hub-file-share\.spec\.mjs/);
  assert.match(rootE2e, /sprite-fan-\*\.spec\.mjs/);
  assert.match(rootE2e, /studios-modernization\.spec\.mjs/);
  assert.match(rootE2e, /inline-handler-migrations\.spec\.mjs/);
  assert.doesNotMatch(rootE2e, /hyperblast|v11-peer-daw/);

  for (const command of [
    'build:sprite-fan',
    'build:catalog',
    'audit:artifacts',
    'test:portfolio',
    'pnpm test',
    'test:e2e:root',
    'generate-build-stats.mjs',
  ]) {
    assert.ok(releaseCheck.includes(command), `release:check should include ${command}`);
  }

  assert.match(bridge, /^  e2e:root-portfolio:/m);
  assert.match(bridge, /^  release:check:/m);
});

test('v1.5.1 release metadata is consistent and remains non-publishing', () => {
  assert.equal(pkg.version, '1.5.1');
  assert.match(changelog, /^## \[Unreleased\]/m);
  assert.match(changelog, /^## \[1\.5\.1\] - 2026-07-24$/m);
  assert.match(changelog, /^\[Unreleased\]: .*v1\.5\.1\.\.\.HEAD$/m);
  assert.match(changelog, /^\[1\.5\.1\]: .*v1\.5\.0\.\.\.v1\.5\.1$/m);
  assert.match(evidence, /candidate: 1.5.1/);
  assert.match(evidence, /releaseReady: true/);
  assert.match(evidence, /releaseIsolation: selective-index/);
  assert.match(evidence, /tagProposed: v1.5.1/);
  assert.match(evidence, /tagCreated: false/);
  assert.match(evidence, /publishState: not_requested/);
  assert.match(evidence, /pushState: requested/);
  assert.match(evidence, /deployState: not_requested/);
  assert.match(evidence, /independentIntegrationsExcludedFromRootMutation: 5/);
});

test('local dependency, test, bytecode, and agent outputs stay ignored', () => {
  for (const entry of [
    'node_modules/',
    'test-results/',
    'playwright-report/',
    '__pycache__/',
    '*.py[cod]',
    '.artifacts-test-module-fix/',
    '.test-build-stats.json',
    '.serena/',
    '.ws-bridge/',
  ]) {
    assert.match(gitignore, new RegExp(`^${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
});
