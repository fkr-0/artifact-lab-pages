import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validateManifest } from '../tooling/artifactctl/src/core.mjs';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = join(rootDir, 'registry/sources.d/revealive.json');
const expectedRevision = '7df572d0f14165c4596765575f91c99b34a4b4b7';

test('Revealive registry entry pins the verified standalone submodule and publication contract', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const validation = await validateManifest(manifest, { rootDir, checkExistence: true });

  assert.deepEqual(validation.errors, []);
  assert.equal(validation.ok, true);
  assert.equal(manifest.id, 'revealive');
  assert.equal(manifest.version, '0.1.0');
  assert.equal(manifest.status, 'active');
  assert.deepEqual(manifest.source, {
    kind: 'project',
    path: 'revealive',
    git: {
      mode: 'submodule',
      repository: 'https://github.com/fkr-0/revealive.git',
      revision: expectedRevision,
    },
  });
  assert.deepEqual(manifest.build, {
    mode: 'compile',
    cwd: 'revealive',
    command: ['pnpm', 'run', 'build'],
    output: 'dist',
  });
  assert.deepEqual(manifest.release, {
    kind: 'directory',
    entrypoint: 'index.html',
    path: 'dist',
    offline: true,
  });
  assert.deepEqual(manifest.launch, {
    default: 'inline',
    modes: ['inline', 'fullscreen', 'newWindow'],
    sandbox: 'trusted',
  });

  const checkoutRevision = execFileSync('git', ['-C', join(rootDir, 'revealive'), 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  assert.equal(checkoutRevision, expectedRevision);

  const gitmodules = await readFile(join(rootDir, '.gitmodules'), 'utf8');
  assert.match(gitmodules, /\[submodule "revealive"\]/);
  assert.match(gitmodules, /url = https:\/\/github\.com\/fkr-0\/revealive\.git/);
});
