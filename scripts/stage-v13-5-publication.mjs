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
  'publications/bewusstsein/index.html',
  'publications/bewusstsein/build/bewusstsein.html',
  'publications/bewusstsein/build/bewusstsein.pdf',
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
// Editorial supplement is introduced only into the verified Pages assembly.
const BEWUSSTSEIN_FILES = [
  ['publications/bewusstsein/index.html', 'bewusstsein/index.html'],
  ['publications/bewusstsein/build/bewusstsein.html', 'bewusstsein/lesen.html'],
  ['publications/bewusstsein/build/bewusstsein.pdf', 'bewusstsein/bewusstsein.pdf'],
];
// Reviewed post-pin native additions are exact-path exceptions, gated by the
// current V13.5 handoff inventory and separately verified staged assets.
const REVIEWED_NATIVE_ADDITIONS = new Map([
  ['vim-tomb-raider', new Set([
    'registry/sources.d/vim-tomb-raider.json',
    'vim-tomb-raider/BUILD_PROVENANCE.json',
    'vim-tomb-raider/SHA256SUMS',
    'vim-tomb-raider/assets/BitmapFont-CW4jIeul.js',
    'vim-tomb-raider/assets/BitmapFont-CnyqSKzD.js',
    'vim-tomb-raider/assets/BufferResource-0C-3DK2f.js',
    'vim-tomb-raider/assets/BufferResource-z8QIiAhb.js',
    'vim-tomb-raider/assets/CanvasRenderer-CdQ-h4x7.js',
    'vim-tomb-raider/assets/CanvasRenderer-Duick-4E.js',
    'vim-tomb-raider/assets/Filter--e4e9-QQ.js',
    'vim-tomb-raider/assets/Filter-CD1Drx4p.js',
    'vim-tomb-raider/assets/GameScreen-8Qy1nIYj.js',
    'vim-tomb-raider/assets/GameScreen-Dl3ZNBGA.js',
    'vim-tomb-raider/assets/RenderTargetSystem-CHlYkfiL.js',
    'vim-tomb-raider/assets/RenderTargetSystem-CNctLdLG.js',
    'vim-tomb-raider/assets/WebGLRenderer-Bneh5aDA.js',
    'vim-tomb-raider/assets/WebGLRenderer-agR0Pmzz.js',
    'vim-tomb-raider/assets/WebGPURenderer-pprxO92E.js',
    'vim-tomb-raider/assets/WebGPURenderer-zL1TziT5.js',
    'vim-tomb-raider/assets/browserAll-BWaguivW.js',
    'vim-tomb-raider/assets/browserAll-NZ0gKRlN.js',
    'vim-tomb-raider/assets/canvasUtils-BX_sEMZ7.js',
    'vim-tomb-raider/assets/canvasUtils-zV_nYnL-.js',
    'vim-tomb-raider/assets/index-Bf9ZOCxE.css',
    'vim-tomb-raider/assets/index-Cm9akizc.css',
    'vim-tomb-raider/assets/index-CrgHCnyl.js',
    'vim-tomb-raider/assets/index-qleDCHQm.js',
    'vim-tomb-raider/assets/sprites/explorer-core.png',
    'vim-tomb-raider/assets/sprites/pixel-adventurer-bonus.png',
    'vim-tomb-raider/assets/webworkerAll-DZFXkDpS.js',
    'vim-tomb-raider/assets/webworkerAll-mfDyHGR4.js',
    'vim-tomb-raider/index.html',
  ])],
  ['sudoku-lab', new Set([
    'registry/sources.d/sudoku-lab.json',
    'sudoku-lab/app.mjs',
    'sudoku-lab/engine.mjs',
    'sudoku-lab/index.html',
    'sudoku-lab/styles.css',
    'tests/e2e/sudoku-lab.spec.mjs',
    'tests/sudoku-lab.test.mjs',
  ])],
  ['killer-sudoku-lab', new Set([
    'registry/sources.d/killer-sudoku-lab.json',
    'killer-sudoku-lab/app.mjs',
    'killer-sudoku-lab/engine.mjs',
    'killer-sudoku-lab/index.html',
    'killer-sudoku-lab/styles.css',
    'tests/e2e/killer-sudoku-lab.spec.mjs',
    'tests/killer-sudoku-lab.test.mjs',
  ])],
  // Explicitly enumerate every alpha.10 removal and qualified alpha.13 addition.
  ['nakamotos-disciples', new Set([
    'registry/sources.d/nakamotos-disciples.json',
    'nakamotos-disciples/BUILD_PROVENANCE.json',
    'nakamotos-disciples/SHA256SUMS',
    'nakamotos-disciples/index.html',
    'nakamotos-disciples/sw.js',
    'nakamotos-disciples/assets/GuidedProtocolCourse-Ci_BzAw0.js',
    'nakamotos-disciples/assets/GuidedProtocolCourse-DSsCQnSX.js',
    'nakamotos-disciples/assets/P2wshNetworkFlow-EutsmtyW.js',
    'nakamotos-disciples/assets/ProtocolSystemsLab-p2JTHImk.js',
    'nakamotos-disciples/assets/ProtocolSystemsLab-DrrhvDr7.js',
    'nakamotos-disciples/assets/SegwitV0Laboratory-WMmAO39B.js',
    'nakamotos-disciples/assets/exact-demo-CoALGFae.js',
    'nakamotos-disciples/assets/index-C_YuxLmP.js',
    'nakamotos-disciples/assets/index-DcoQQdgp.css',
    'nakamotos-disciples/assets/index-B0Seuggu.css',
    'nakamotos-disciples/assets/index-BuEFNEWl.js',
    'nakamotos-disciples/assets/model-DXSsuBDH.js',
    'nakamotos-disciples/assets/probability-Dc-K_v0K.js',
    'nakamotos-disciples/assets/probability-BnYTSDyw.js',
    'nakamotos-disciples/assets/segwit-v0-lab-C1mLqn49.js',
  ])],
]);
export function validateSourceTransition({ pinnedRevision, currentRevision, pinnedIsAncestor, changedPaths, currentNativeAdded = [], gitRecipeBookQualified = false }) {
  if (pinnedRevision === currentRevision) return { mode: 'exact', changedPaths: [] };
  if (!pinnedIsAncestor) {
    throw new Error('Canonical Artifact Lab revision mismatch: ' + currentRevision + ' is not a descendant of ' + pinnedRevision);
  }
  const approved = new Set(INTEGRATION_ONLY_PATHS);
  // The only source change permitted for the baseline compile upgrade is the
  // reviewed correction to the source HTML's dangling favicon reference.
  // The published build itself is generated reproducibly by Pages.
  if (gitRecipeBookQualified) approved.add('git-recipe-book/index.html');
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
  if (handoff.regressions?.gitRecipeBook?.url !== '/git-recipe-book/index.html' ||
      handoff.regressions.gitRecipeBook.version !== '1.1.0' ||
      handoff.regressions.gitRecipeBook.assets < 2) {
    throw new Error('V13.5 handoff lacks the verified compiled Git Recipe Book baseline upgrade.');
  }
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
      gitRecipeBookQualified: true,
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
      gitRecipeBookQualified: true,
    });
  }
  if (handoff.release?.commit !== currentV13Revision) {
    throw new Error('V13.5 release revision mismatch: ' + currentV13Revision + ' != ' + handoff.release?.commit);
  }

  const requiredHashes = [
    ['index.html', handoff.rootLauncher?.indexSha256],
    ['git-recipe-book/index.html', handoff.regressions?.gitRecipeBook?.sha256],
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

  // Each new Killer Sudoku release is accepted only after catalog, route, and
  // byte-for-byte asset evidence agree. Never trust a source-path exception alone.
  if (handoff.catalog?.currentNativeAdded?.includes('killer-sudoku-lab')) {
    const catalog = JSON.parse(await readFile(join(v13Dist, 'catalog.json'), 'utf8'));
    const routes = JSON.parse(await readFile(join(v13Dist, 'route-manifest.json'), 'utf8'));
    const route = 'artifacts/killer-sudoku-lab/1.0.0/index.html';
    const item = catalog.items?.find((entry) => entry.id === 'killer-sudoku-lab');
    if (item?.availability !== 'verified' || item.url !== '/' + route ||
        !routes.entries?.some((entry) => entry.id === 'killer-sudoku-lab' && entry.path === route && entry.state === 'staged')) {
      throw new Error('Killer Sudoku Lab is not a verified staged native release.');
    }
    for (const name of ['index.html', 'app.mjs', 'engine.mjs', 'styles.css']) {
      const path = 'artifacts/killer-sudoku-lab/1.0.0/' + name;
      await assertHash(v13Dist, path, assetManifest.files?.[path]?.sha256);
    }
  }

  // A native addition is publishable only if the new qualified handoff
  // contains a complete, hashed, provenance-matching PWA distribution.
  if (handoff.catalog?.currentNativeAdded?.includes('nakamotos-disciples')) {
    const prefix = 'artifacts/nakamotos-disciples/0.2.0-alpha.13/';
    const catalog = JSON.parse(await readFile(join(v13Dist, 'catalog.json'), 'utf8'));
    const routes = JSON.parse(await readFile(join(v13Dist, 'route-manifest.json'), 'utf8'));
    const item = catalog.items?.find((entry) => entry.id === 'nakamotos-disciples');
    if (item?.availability !== 'verified' || item.version !== '0.2.0-alpha.13' ||
        item.url !== '/' + prefix + 'index.html' ||
        !routes.entries?.some((entry) => entry.id === 'nakamotos-disciples' &&
          entry.path === prefix + 'index.html' && entry.state === 'staged')) {
      throw new Error('Nakamotos Disciples alpha.13 is not a verified staged native release.');
    }
    const runtimeFiles = Object.keys(assetManifest.files || {}).filter((path) => path.startsWith(prefix));
    if (runtimeFiles.length < 16 || !runtimeFiles.some((path) => path.startsWith(prefix + 'assets/'))) {
      throw new Error('Nakamotos Disciples runtime asset inventory is incomplete.');
    }
    for (const name of ['index.html', 'icon.svg', 'manifest.webmanifest', 'sw.js',
      'BUILD_PROVENANCE.json', 'SHA256SUMS']) {
      if (!runtimeFiles.includes(prefix + name)) {
        throw new Error('Nakamotos Disciples missing required release asset: ' + name);
      }
    }
    for (const path of runtimeFiles) {
      if (path.endsWith('.map')) throw new Error('Nakamotos Disciples source map unexpectedly published: ' + path);
      await assertHash(v13Dist, path, assetManifest.files[path].sha256);
    }
    const provenance = JSON.parse(await readFile(join(v13Dist, prefix, 'BUILD_PROVENANCE.json'), 'utf8'));
    if (provenance.artifactId !== 'nakamotos-disciples' ||
        provenance.sourceVersion !== '0.2.0-alpha.13' ||
        provenance.sourceRevision !== '3d6f5360efdffa1b247c08dc0b9a6041df56eec7' ||
        provenance.sourceMapsIncluded !== false) {
      throw new Error('Nakamotos Disciples release provenance does not match the qualified app.');
    }
  }

  // A vendored release-candidate is accepted only if the catalog, route,
  // immutable source provenance and SHA-256 inventory all agree.
  if (handoff.catalog?.currentNativeAdded?.includes('vim-tomb-raider')) {
    const prefix = 'artifacts/vim-tomb-raider/1.0.0-rc.6/';
    const catalog = JSON.parse(await readFile(join(v13Dist, 'catalog.json'), 'utf8'));
    const routes = JSON.parse(await readFile(join(v13Dist, 'route-manifest.json'), 'utf8'));
    const item = catalog.items?.find((entry) => entry.id === 'vim-tomb-raider');
    if (item?.availability !== 'verified' || item.version !== '1.0.0-rc.6' ||
        item.url !== '/' + prefix + 'index.html' ||
        !routes.entries?.some((entry) => entry.id === 'vim-tomb-raider' &&
          entry.path === prefix + 'index.html' && entry.state === 'staged')) {
      throw new Error('Vim Tomb Raider rc.5 is not a verified staged native release.');
    }
    const runtimeFiles = Object.keys(assetManifest.files || {}).filter((path) => path.startsWith(prefix));
    const required = ['index.html', 'assets/index-CrgHCnyl.js',
      'assets/index-Bf9ZOCxE.css', 'assets/sprites/explorer-core.png', 'assets/sprites/pixel-adventurer-bonus.png',
      'BUILD_PROVENANCE.json', 'SHA256SUMS'];
    for (const name of required) {
      if (!runtimeFiles.includes(prefix + name)) throw new Error('Vim Tomb Raider missing release asset: ' + name);
    }
    const provenance = JSON.parse(await readFile(join(v13Dist, prefix, 'BUILD_PROVENANCE.json'), 'utf8'));
    if (provenance.artifactId !== 'vim-tomb-raider' ||
        provenance.sourceVersion !== '1.0.0-rc.6' ||
        provenance.sourceTag !== 'v1.0.0-rc.6' ||
        provenance.sourceRevision !== '011396e5e85182ed55fd3cd3c15bd27e0132b16e' ||
        provenance.sourceReleaseArchiveSha256 !== 'c60312197166834c810ea676e4722f8ab2457361cc32aad51f2b881aff458c50' ||
        provenance.sourceMapsIncluded !== false ||
        provenance.vendoredRuntimeFiles !== runtimeFiles.length - 2) {
      throw new Error('Vim Tomb Raider release provenance does not match the qualified source.');
    }
    const html = await readFile(join(v13Dist, prefix, 'index.html'), 'utf8');
    if (html.includes('src/main.tsx') ||
        /(?:src|href)=["']\//u.test(html) ||
        !html.includes('./assets/index-CrgHCnyl.js') ||
        !html.includes('./assets/index-Bf9ZOCxE.css')) {
      throw new Error('Vim Tomb Raider release HTML is not relocatable compiled output.');
    }
    const checksums = await readFile(join(v13Dist, prefix, 'SHA256SUMS'), 'utf8');
    const sums = new Map();
    for (const line of checksums.trim().split(/\r?\n/u)) {
      const match = /^([a-f0-9]{64})  ([^\s]+)$/u.exec(line);
      if (!match || sums.has(match[2]) || !runtimeFiles.includes(prefix + match[2]) ||
          match[2] === 'SHA256SUMS') {
        throw new Error('Vim Tomb Raider release SHA256SUMS has an invalid entry.');
      }
      sums.set(match[2], match[1]);
    }
    if (sums.size !== runtimeFiles.length - 1) {
      throw new Error('Vim Tomb Raider release SHA256SUMS inventory is incomplete.');
    }
    for (const path of runtimeFiles) {
      if (path.endsWith('.map')) throw new Error('Vim Tomb Raider release unexpectedly includes a source map: ' + path);
      const hash = await assertHash(v13Dist, path, assetManifest.files[path].sha256);
      if (path !== prefix + 'SHA256SUMS' && sums.get(path.slice(prefix.length)) !== hash) {
        throw new Error('Vim Tomb Raider SHA256SUMS mismatch for ' + path);
      }
    }
  }


  // Refuse a renamed source-only HTML page or broken script/style dependency.
  const gitRecipeHtml = await readFile(join(v13Dist, 'git-recipe-book/index.html'), 'utf8');
  if (gitRecipeHtml.includes('src/main.tsx') || !gitRecipeHtml.includes('src="./assets/') ||
      !gitRecipeHtml.includes('href="./assets/')) {
    throw new Error('Git Recipe Book release is not compiled HTML.');
  }
  const gitRecipeAssets = Object.keys(assetManifest.files || {}).filter((path) => path.startsWith('git-recipe-book/assets/'));
  if (gitRecipeAssets.length !== handoff.regressions.gitRecipeBook.assets ||
      !gitRecipeAssets.some((path) => path.endsWith('.js')) ||
      !gitRecipeAssets.some((path) => path.endsWith('.css'))) {
    throw new Error('Git Recipe Book stage is missing compiled runtime assets.');
  }
  for (const path of gitRecipeAssets) await assertHash(v13Dist, path, assetManifest.files[path].sha256);

  const sourceFiles = await walkRegularFiles(v13Dist);
  if (!sourceFiles.includes('PUBLICATION_HANDOFF.json')) throw new Error('V13.5 stage inventory omitted PUBLICATION_HANDOFF.json');

  await rm(stageRoot, { recursive: true, force: true });
  await mkdir(dirname(stageRoot), { recursive: true });
  await cp(v13Dist, stageRoot, { recursive: true, dereference: false, errorOnExist: false });
  // Hash every additional byte *before* the integration receipt is finalized.
  const supplementalFiles = [];
  for (const [sourcePath, targetPath] of BEWUSSTSEIN_FILES) {
    const input = join(sourceRoot, sourcePath);
    const output = join(stageRoot, targetPath);
    const info = await lstat(input);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('Invalid Bewusstsein source: ' + sourcePath);
    const bytes = await readFile(input);
    if (targetPath.endsWith('.pdf') && !bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new Error('Bewusstsein PDF is not a valid PDF payload');
    }
    if (targetPath.endsWith('index.html') &&
        (!bytes.includes(Buffer.from('href="./bewusstsein.pdf"')) ||
         !bytes.includes(Buffer.from('href="./lesen.html"')))) {
      throw new Error('Bewusstsein landing page is missing its relative download/read links');
    }
    await mkdir(dirname(output), { recursive: true });
    await cp(input, output, { errorOnExist: true, force: false });
    const hash = await sha256(input);
    if (await sha256(output) !== hash) throw new Error('Bewusstsein publication hash mismatch: ' + targetPath);
    supplementalFiles.push({ path: targetPath, sha256: hash, bytes: info.size });
  }
  const stagedFiles = await walkRegularFiles(stageRoot);
  if (stagedFiles.length !== sourceFiles.length + supplementalFiles.length) {
    throw new Error('Staged V13.5 file count changed during publication copy.');
  }

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
    supplements: {
      bewusstsein: {
        route: '/bewusstsein/',
        pdf: '/bewusstsein/bewusstsein.pdf',
        html: '/bewusstsein/lesen.html',
        files: supplementalFiles,
      },
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
