import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [packageText, v13ManifestText, bridge, changelog, evidence, gitignore] = await Promise.all([
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
  readFile(new URL('../apps/app-hub-v13/artifact.json', import.meta.url), 'utf8'),
  readFile(new URL('../bridge.yml', import.meta.url), 'utf8'),
  readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/release-evidence-v1.7.0-20260916.yml', import.meta.url), 'utf8'),
  readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
]);
const pkg = JSON.parse(packageText);
const v13Manifest = JSON.parse(v13ManifestText);

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

test('v1.7.0 reconciled publication metadata is consistent and authorized for push', () => {
  assert.equal(pkg.version, '1.7.0');
  assert.equal(v13Manifest.version, '1.0.0');
  assert.equal(v13Manifest.status, 'active');
  assert.equal(v13Manifest.id, 'app-hub-v13');
  assert.match(changelog, /^## \[Unreleased\]/m);
  assert.match(changelog, /^## \[1\.7\.0\] - 2026-08-20$/m);
  assert.match(changelog, /^\[Unreleased\]: .*v1\.7\.0\.\.\.HEAD$/m);
  assert.match(changelog, /^\[1\.7\.0\]: .*v1\.6\.0\.\.\.v1\.7\.0$/m);
  assert.match(changelog, /^\[1\.6\.0\]: .*v1\.5\.1\.\.\.v1\.6\.0$/m);
  assert.match(changelog, /App Hub V13/);
  assert.match(evidence, /candidate: 1.7.0/);
  assert.match(evidence, /v13Ready: true/);
  assert.match(evidence, /releaseReady: true/);
  assert.match(evidence, /releaseIsolation: isolated-main-reconciliation-worktree/);
  assert.match(evidence, /tagProposed: v1.7.0/);
  assert.match(evidence, /tagCreated: false/);
  assert.match(evidence, /commitState: performed/);
  assert.match(evidence, /publishState: authorized_pending/);
  assert.match(evidence, /pushState: authorized_pending/);
  assert.match(evidence, /deployState: github_pages_pending_vps_mirror_blocked_auth/);
  assert.match(evidence, /total: 58/);
  assert.match(evidence, /dated: 58/);
  assert.match(evidence, /rootNodeTests: 145/);
  assert.match(evidence, /chromiumTests: 63/);
  assert.match(evidence, /sha256: e540ba03853e2c25d7d36d5bdd03190673d6f3b92cfe72df70dd805106f5df50/);
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
    '.ws-bridge/*',
  ]) {
    assert.match(gitignore, new RegExp(`^${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
  assert.match(gitignore, /^!\.ws-bridge\/bridge\.yml$/m);
});
