#!/usr/bin/env node
// GitHub Pages release candidate qualification from ONE immutable Git checkout.
// Never marks a stage as deployed; only deploy-pages may do so.
import { execFile } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createPublicationHandoff } from '../hub-v13.5/scripts/handoff-lib.mjs';
import { MONOREPO_HANDOFF_SCHEMA, stageQualifiedV13_5 } from './stage-v13-5-publication.mjs';

const exec = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hub = join(root, 'hub-v13.5');
const generated = join(hub, '.generated/catalog.json');
const stage = join(root, '.artifacts-pages-stage');

async function git(...args) {
  const { stdout } = await exec('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  return stdout.trim();
}
async function run(command, args, opts = {}) {
  const { stdout, stderr } = await exec(command, args, {
    cwd: opts.cwd || root, encoding: 'utf8', env: { ...process.env, ...opts.env },
    maxBuffer: 32 * 1024 * 1024,
  });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}
async function assertSourceClean() {
  // The commit must account for every authored source file and every gitlink.
  const status = await git('status', '--porcelain', '--untracked-files=no', '--ignore-submodules=all');
  if (status) throw new Error('Refusing tracked source changes:\n' + status);
  const submodules = await git('submodule', 'status');
  for (const line of submodules.split(/\r?\n/u).filter(Boolean)) {
    if (line[0] !== ' ') throw new Error('Submodule is not at its pinned Git revision: ' + line);
    const match = /^ [a-f0-9]{40} ([^ ]+)/u.exec(line);
    if (!match) throw new Error('Invalid submodule status: ' + line);
    const subPath = match[1];
    const { stdout } = await exec('git', ['-C', join(root, subPath),
      'status', '--porcelain', '--untracked-files=no'],
      { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    for (const changed of stdout.split(/\r?\n/u).filter(Boolean)) {
      const path = changed.slice(3);
      // Badger's release build rewrites only its tracked derived dist files.
      if (subPath !== 'badger-sprawl-runner' ||
          !/^packages\/(?:progression|sprite-contracts)\/dist\//u.test(path) ||
          !/^ M /u.test(changed)) {
        throw new Error('Unreviewed tracked submodule change: ' + subPath + '/' + path);
      }
    }
  }
}
const sourceRevision = await git('rev-parse', 'HEAD');
const hubTree = await git('rev-parse', 'HEAD:hub-v13.5');
if (!/^[a-f0-9]{40}$/u.test(sourceRevision) || !/^[a-f0-9]{40}$/u.test(hubTree)) {
  throw new Error('Monorepo source or hub tree revision is invalid.');
}
if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== sourceRevision) {
  throw new Error('The Pages checkout differs from GITHUB_SHA.');
}
await assertSourceClean();
await run('npm', ['test'], { cwd: hub });
// Regenerate native catalog in an ignored build-only directory, never dirty a
// committed catalog.json as a side effect of publication.
await mkdir(dirname(generated), { recursive: true });
await run(process.execPath, ['tooling/artifactctl/src/cli.mjs', 'catalog', '--out', generated]);
await run(process.execPath, ['scripts/build.mjs'], {
  cwd: hub,
  env: { ARTIFACTS_SOURCE_ROOT: root, ARTIFACTS_NATIVE_CATALOG_FILE: generated },
});
await assertSourceClean();

const handoff = await createPublicationHandoff({
  distRoot: join(hub, 'dist'),
  v13Commit: sourceRevision,
  canonicalSource: {
    repository: 'fkr-0/artifact-lab-pages',
    revision: sourceRevision,
    currentRevision: sourceRevision,
    transition: 'monorepo-exact',
  },
});
handoff.schemaVersion = MONOREPO_HANDOFF_SCHEMA;
handoff.hub = { path: 'hub-v13.5', tree: hubTree };
handoff.integration.action = 'publish-verified-monorepo-stage-through-pages-owner';
handoff.integration.note = 'Source and V13.5 hub share a single immutable Git commit; deployment has not occurred.';
await writeFile(join(hub, 'dist/PUBLICATION_HANDOFF.json'), JSON.stringify(handoff, null, 2) + '\n');

const { receipt } = await stageQualifiedV13_5({
  artifactRoot: root,
  v13Root: hub,
  outDir: stage,
});
if (receipt.provenance?.mode !== 'monorepo' ||
    receipt.provenance.commit !== sourceRevision ||
    receipt.provenance.hubTree !== hubTree ||
    receipt.v13_5.revision !== sourceRevision ||
    receipt.v13_5.missingV12Local !== 0 ||
    receipt.deployment.performed !== false) {
  throw new Error('Monorepo publication receipt does not match the qualified Git checkout.');
}
await assertSourceClean();
console.log('Monorepo Pages candidate qualified: ' + sourceRevision.slice(0, 12) +
  ', hub tree ' + hubTree.slice(0, 12) + ', ' + receipt.v13_5.catalogItems +
  ' artifacts, ' + receipt.v13_5.stagedV12Local + '/44 legacy routes; not deployed.');
