#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const HANDOFF_SCHEMA = 'artifacts-v13.5/publication-handoff-v1';
export const INTEGRATION_SCHEMA = 'artifacts.fkr.dev/v13.5-pages-integration-v1';
export const CANONICAL_SOURCE_REPOSITORY = 'fkr-0/artifact-lab-pages';
export const EXPECTED_V12_LOCAL = 44;
export const MINIMUM_CATALOG_ITEMS = 55;

async function exists(path) {
  try { await stat(path); return true; }
  catch (error) { if (error?.code === 'ENOENT') return false; throw error; }
}
async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}
async function gitHead(root) {
  const { stdout } = await execFileAsync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return stdout.trim();
}
async function gitSourceTransition(root, pinnedRevision, currentRevision) {
  try {
    await execFileAsync('git', ['-C', root, 'merge-base', '--is-ancestor', pinnedRevision, currentRevision], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
  } catch {
    return { pinnedIsAncestor: false, changedPaths: [] };
  }
  const { stdout } = await execFileAsync(
    'git',
    ['-C', root, 'diff', '--name-only', pinnedRevision + '..' + currentRevision],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 },
  );
  return {
    pinnedIsAncestor: true,
    changedPaths: stdout.split(/\r?\n/u).map((path) => path.trim()).filter(Boolean),
  };
}
const INTEGRATION_ONLY_PATHS = new Set([
  '.github/workflows/pages.yml',
  '.gitignore',
  'apps/app-hub-v13/artifact.json',
  'docs/v13-5-publication-integration.md',
  'package.json',
  'registry/generated/catalog.json',
  'scripts/stage-v13-5-publication.mjs',
  'tests/badger-sprawl-runner-pages-build.test.mjs',
  'tests/app-hub-v11-pages-workflow.test.mjs',
  'tests/hyperblast-release-smoke.mjs',
  'tests/revealive-publication-stage.test.mjs',
  'tests/v13-5-publication-adapter.test.mjs',
]);
// Reviewed post-pin native additions are exact-path exceptions, gated by the
// current V13.5 handoff inventory and separately verified staged assets.
const REVIEWED_NATIVE_ADDITIONS = new Map([
  ['sudoku-lab', new Set([
    'registry/sources.d/sudoku-lab.json',
    'sudoku-lab/app.mjs',
    'sudoku-lab/engine.mjs',
    'sudoku-lab/index.html',
    'sudoku-lab/styles.css',
    'tests/e2e/sudoku-lab.spec.mjs',
    'tests/sudoku-lab.test.mjs',
  ])],
]);
export function validateSourceTransition({ pinnedRevision, currentRevision, pinnedIsAncestor, changedPaths, currentNativeAdded = [] }) {
  if (pinnedRevision === currentRevision) return { mode: 'exact', changedPaths: [] };
  if (!pinnedIsAncestor) {
    throw new Error('Canonical Artifact Lab revision mismatch: ' + currentRevision + ' is not a descendant of ' + pinnedRevision);
  }
  const approved = new Set(INTEGRATION_ONLY_PATHS);
  for (const id of currentNativeAdded) {
    for (const path of REVIEWED_NATIVE_ADDITIONS.get(id) || []) approved.add(path);
  }
  const disallowed = changedPaths.filter((path) => !approved.has(path));
  if (disallowed.length) {
    throw new Error(
      'Canonical Artifact Lab changed after the V13.5 handoff pin outside reviewed publication paths: ' +
      disallowed.join(', '),
    );
  }
  return { mode: 'integration-descendant', changedPaths: [...changedPaths] };
}
function safeRelative(path) {
  const value = String(path || '').replace(/^\/+/, '');
  const parts = value.split('/');
  if (!value || parts.some((part) => !part || part === '.' || part === '..')) throw new Error('Unsafe handoff path: ' + path);
  return value;
}
async function assertHash(root, relativePath, expected) {
  if (!/^[a-f0-9]{64}$/u.test(String(expected || ''))) throw new Error('Invalid SHA-256 evidence for ' + relativePath);
  const path = join(root, safeRelative(relativePath));
  if (!(await exists(path))) throw new Error('Qualified stage is missing ' + relativePath);
  const actual = await sha256(path);
  if (actual !== expected) throw new Error('Qualified stage hash mismatch for ' + relativePath + ': ' + actual + ' != ' + expected);
  return actual;
}
async function walkRegularFiles(root, current = root) {
  const info = await lstat(current);
  if (info.isSymbolicLink()) throw new Error('Qualified V13.5 stage contains a symlink: ' + relative(root, current));
  if (info.isFile()) return [relative(root, current).split(sep).join('/')];
  if (!info.isDirectory()) return [];
  const files = [];
  for (const entry of await readdir(current)) files.push(...(await walkRegularFiles(root, join(current, entry))));
  return files.sort();
}
function validateHandoff(handoff) {
  if (!handoff || handoff.schemaVersion !== HANDOFF_SCHEMA) throw new Error('Expected ' + HANDOFF_SCHEMA + ' handoff.');
  if (handoff.canonicalSource?.repository !== CANONICAL_SOURCE_REPOSITORY) throw new Error('V13.5 handoff targets unexpected canonical source repository.');
  if (handoff.release?.expectedV12Local !== EXPECTED_V12_LOCAL) throw new Error('V13.5 handoff changed the locked V12 parity floor.');
  if (handoff.release?.stagedV12Local !== EXPECTED_V12_LOCAL || handoff.release?.missingV12Local !== 0) throw new Error('V13.5 handoff does not stage the complete V12 parity floor.');
  if (!Number.isInteger(handoff.release?.catalogItems) || handoff.release.catalogItems < MINIMUM_CATALOG_ITEMS) throw new Error('V13.5 handoff catalog is smaller than the qualified superset floor.');
  if (!handoff.catalog?.currentNativeAdded?.includes('revealive')) throw new Error('V13.5 handoff is missing the qualified Revealive native addition.');
  if (handoff.regressions?.memeLab?.url !== '/meme-lab/meme-lab.html') throw new Error('V13.5 handoff does not preserve the Meme Lab route.');
  return handoff;
}
export async function stageQualifiedV13_5({
  artifactRoot = process.cwd(),
  v13Root,
  outDir,
  artifactSourceRevision = null,
  v13Revision = null,
} = {}) {
  const sourceRoot = resolve(artifactRoot);
  const configuredV13Root = v13Root || process.env.ARTIFACTS_V13_5_ROOT;
  if (!configuredV13Root) throw new Error('Set ARTIFACTS_V13_5_ROOT or pass --v13-root.');
  const releaseRoot = resolve(configuredV13Root);
  const stageRoot = resolve(outDir || join(sourceRoot, '.artifacts-pages-stage'));
  const v13Dist = join(releaseRoot, 'dist');
  const handoffPath = join(v13Dist, 'PUBLICATION_HANDOFF.json');
  if (stageRoot === sourceRoot || stageRoot === releaseRoot || stageRoot === v13Dist) throw new Error('Refusing unsafe V13.5 publication stage output path.');
  if (!(await exists(handoffPath))) throw new Error('V13.5 publication handoff is missing: ' + handoffPath);

  const handoff = validateHandoff(JSON.parse(await readFile(handoffPath, 'utf8')));
  const currentSourceRevision = artifactSourceRevision || await gitHead(sourceRoot);
  const currentV13Revision = v13Revision || await gitHead(releaseRoot);
  if (handoff.canonicalSource?.currentRevision &&
      handoff.canonicalSource.currentRevision !== currentSourceRevision) {
    throw new Error(
      'Canonical Artifact Lab checkout does not match the source checkout recorded by the V13.5 handoff: ' +
      currentSourceRevision + ' != ' + handoff.canonicalSource.currentRevision,
    );
  }
  let sourceTransition;
  if (artifactSourceRevision) {
    sourceTransition = validateSourceTransition({
      pinnedRevision: handoff.canonicalSource?.revision,
      currentRevision: currentSourceRevision,
      pinnedIsAncestor: false,
      changedPaths: [],
      currentNativeAdded: handoff.catalog?.currentNativeAdded || [],
    });
  } else {
    const transition = await gitSourceTransition(
      sourceRoot,
      handoff.canonicalSource?.revision,
      currentSourceRevision,
    );
    sourceTransition = validateSourceTransition({
      pinnedRevision: handoff.canonicalSource?.revision,
      currentRevision: currentSourceRevision,
      ...transition,
      currentNativeAdded: handoff.catalog?.currentNativeAdded || [],
    });
  }
  if (handoff.release?.commit !== currentV13Revision) {
    throw new Error('V13.5 release revision mismatch: ' + currentV13Revision + ' != ' + handoff.release?.commit);
  }

  const requiredHashes = [
    ['index.html', handoff.rootLauncher?.indexSha256],
    ['app.js', handoff.rootLauncher?.appSha256],
    ['styles.css', handoff.rootLauncher?.stylesSha256],
    ['meme-lab/meme-lab.html', handoff.regressions?.memeLab?.sha256],
    [safeRelative(handoff.regressions?.revealive?.url), handoff.regressions?.revealive?.sha256],
    ['asset-manifest.json', handoff.evidence?.assetManifestSha256],
    ['catalog.json', handoff.evidence?.catalogSha256],
    ['parity-report.json', handoff.evidence?.parityReportSha256],
    ['route-manifest.json', handoff.evidence?.routeManifestSha256],
  ];
  for (const [path, expected] of requiredHashes) await assertHash(v13Dist, path, expected);

  const assetManifest = JSON.parse(await readFile(join(v13Dist, 'asset-manifest.json'), 'utf8'));
  const hashedFileCount = Object.keys(assetManifest.files || {}).length;
  if (hashedFileCount !== handoff.evidence?.hashedFiles) {
    throw new Error('V13.5 asset manifest count mismatch: ' + hashedFileCount + ' != ' + handoff.evidence?.hashedFiles);
  }

  // A post-pin Sudoku addition is allowed only when the *new* handoff
  // publishes it as a verified route and hashes every executable asset.
  if (handoff.catalog?.currentNativeAdded?.includes('sudoku-lab')) {
    const catalog = JSON.parse(await readFile(join(v13Dist, 'catalog.json'), 'utf8'));
    const routes = JSON.parse(await readFile(join(v13Dist, 'route-manifest.json'), 'utf8'));
    const route = 'artifacts/sudoku-lab/1.0.0/index.html';
    const item = catalog.items?.find((entry) => entry.id === 'sudoku-lab');
    if (item?.availability !== 'verified' || item.url !== '/' + route ||
        !routes.entries?.some((entry) => entry.id === 'sudoku-lab' && entry.path === route && entry.state === 'staged')) {
      throw new Error('Sudoku Lab is not a verified staged native release.');
    }
    for (const name of ['index.html', 'app.mjs', 'engine.mjs', 'styles.css']) {
      const path = 'artifacts/sudoku-lab/1.0.0/' + name;
      await assertHash(v13Dist, path, assetManifest.files?.[path]?.sha256);
    }
  }

  const sourceFiles = await walkRegularFiles(v13Dist);
  if (!sourceFiles.includes('PUBLICATION_HANDOFF.json')) throw new Error('V13.5 stage inventory omitted PUBLICATION_HANDOFF.json');

  await rm(stageRoot, { recursive: true, force: true });
  await mkdir(dirname(stageRoot), { recursive: true });
  await cp(v13Dist, stageRoot, { recursive: true, dereference: false, errorOnExist: false });
  const stagedFiles = await walkRegularFiles(stageRoot);
  if (stagedFiles.length !== sourceFiles.length) throw new Error('Staged V13.5 file count changed during publication copy.');

  const receipt = {
    schemaVersion: INTEGRATION_SCHEMA,
    generatedAt: new Date().toISOString(),
    source: {
      repository: CANONICAL_SOURCE_REPOSITORY,
      inputRevision: handoff.canonicalSource.revision,
      currentRevision: currentSourceRevision,
      transition: sourceTransition,
    },
    v13_5: {
      revision: currentV13Revision,
      handoffSha256: await sha256(handoffPath),
      catalogItems: handoff.release.catalogItems,
      expectedV12Local: handoff.release.expectedV12Local,
      stagedV12Local: handoff.release.stagedV12Local,
      missingV12Local: handoff.release.missingV12Local,
    },
    stage: {
      root: relative(sourceRoot, stageRoot).split(sep).join('/') || '.',
      files: stagedFiles.length,
      hashedFiles: hashedFileCount,
    },
    deployment: { provider: 'github-pages', ownerWorkflow: '.github/workflows/pages.yml', performed: false },
  };
  await writeFile(join(stageRoot, 'V13_5_PAGES_INTEGRATION.json'), JSON.stringify(receipt, null, 2) + '\n');
  return { stageRoot, handoff, receipt };
}
function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--v13-root') options.v13Root = args[++index];
    else if (args[index] === '--out') options.outDir = args[++index];
    else throw new Error('Unknown argument: ' + args[index]);
  }
  return options;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await stageQualifiedV13_5(parseArgs(process.argv.slice(2)));
  console.log(
    'V13.5 Pages stage: ' + result.receipt.v13_5.stagedV12Local + '/' +
    result.receipt.v13_5.expectedV12Local + ' V12 routes, ' +
    result.receipt.v13_5.catalogItems + ' catalog items, ' +
    result.receipt.stage.files + ' files -> ' + result.stageRoot,
  );
}
