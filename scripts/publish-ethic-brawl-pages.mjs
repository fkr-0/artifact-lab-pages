#!/usr/bin/env node
// Artifact Lab owns the publication adapter; the game source remains a pinned submodule.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_FILES = 1200;
const MAX_BYTES = 256 * 1024 * 1024;
export const RELEASE_SCHEMA = 'artifacts.fkr.dev/ethic-brawl-pages-v1';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function git(root, ...args) {
  const { stdout } = await execFileAsync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return stdout.trim();
}
function assert(condition, message) { if (!condition) throw new Error('Ethic Brawl publication: ' + message); }
function assetPath(value, from = 'index.html') {
  if (/^(?:data:|blob:|https?:|#|\/\/)/iu.test(value)) return null;
  assert(!value.startsWith('/') && !value.includes('\\') && !value.includes('?'), 'non-relocatable URL: ' + value);
  const cleaned = posix.normalize(posix.join(posix.dirname(from), value.split('#', 1)[0]));
  assert(cleaned !== '..' && !cleaned.startsWith('../') && !cleaned.startsWith('/'), 'escaping asset URL: ' + value);
  return cleaned;
}
async function filesUnder(root, path = root) {
  const info = await lstat(path);
  assert(!info.isSymbolicLink(), 'symlink in compiled runtime: ' + relative(root, path));
  if (info.isFile()) return [relative(root, path).split(sep).join('/')];
  assert(info.isDirectory(), 'non-regular compiled runtime file: ' + path);
  const files = [];
  for (const entry of await readdir(path)) files.push(...await filesUnder(root, join(path, entry)));
  return files;
}

export async function inspectEthicBrawl({ root = DEFAULT_ROOT, requireDist = true } = {}) {
  const artifactRoot = resolve(root);
  const manifest = await readJson(join(artifactRoot, 'registry/sources.d/ethic-brawl.json'));
  const sourceRoot = join(artifactRoot, 'ethic-brawl');
  const revision = manifest.source?.git?.revision;
  const version = manifest.version;
  assert(manifest.id === 'ethic-brawl' && manifest.source?.kind === 'project' &&
    manifest.source?.path === 'ethic-brawl' && manifest.source?.git?.mode === 'submodule' &&
    manifest.source.git.repository === 'https://github.com/fkr-0/ethic-brawl.git',
  'registry must retain the independent pinned game submodule');
  assert(/^[a-f0-9]{40}$/u.test(revision || ''), 'missing immutable submodule revision');
  assert(/^\d+\.\d+\.\d+$/u.test(version || ''), 'missing game release version');
  assert(manifest.build?.mode === 'compile' && manifest.build?.cwd === 'ethic-brawl' &&
    manifest.build?.output === 'dist' && manifest.release?.path === 'dist' &&
    manifest.release?.entrypoint === 'index.html', 'unexpected compile/release contract');
  const indexEntry = await git(artifactRoot, 'ls-files', '-s', '--', 'ethic-brawl');
  const gitlink = /^160000\s+([a-f0-9]{40})\s+0\tethic-brawl$/u.exec(indexEntry)?.[1];
  assert(gitlink === revision, 'gitlink does not match registry revision');
  let head;
  try { head = await git(sourceRoot, 'rev-parse', 'HEAD'); }
  catch { throw new Error('Ethic Brawl publication: submodule missing or uninitialized'); }
  assert(head === revision, 'checked-out submodule HEAD does not match gitlink');
  assert((await git(sourceRoot, 'status', '--porcelain', '--untracked-files=no')) === '',
    'tracked source is dirty; never publish local sprite edits');
  const sourcePackage = await readJson(join(sourceRoot, 'package.json'));
  assert(sourcePackage.name === 'ethic-brawl' && sourcePackage.version === version,
    'stale registry version relative to committed game package.json');
  const dist = join(sourceRoot, 'dist');
  if (!requireDist) return { artifactRoot, sourceRoot, dist, revision, version, manifest };
  const entry = join(dist, 'index.html');
  const html = await readFile(entry, 'utf8').catch(() => { throw new Error('Ethic Brawl publication: compiled dist/index.html is missing'); });
  assert(!html.includes('src/main.ts') && !html.includes('src="/') &&
    !html.includes('href="/') && !html.includes('poster="/'),
    'compiled HTML contains a Vite development or root-absolute asset reference');
  const references = [...html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/giu)]
    .map((match) => assetPath(match[1])).filter(Boolean);
  const executable = references.filter((name) => /\.(?:js|css)$/iu.test(name));
  assert(executable.some((name) => name.endsWith('.js')) &&
    (executable.some((name) => name.endsWith('.css')) || /<style(?:\\s|>)/iu.test(html)),
    'compiled entrypoint must reference hashed JS and provide inline or external CSS');
  for (const name of executable) {
    assert(/^assets\/[^/]+-[A-Za-z0-9_-]+\.(?:js|css)$/u.test(name), 'non-hashed executable asset: ' + name);
  }
  const compiled = (await filesUnder(dist)).filter((name) => !name.endsWith('.map') && !name.startsWith('.vite/'));
  assert(compiled.includes('index.html') && compiled.length <= MAX_FILES,
    'missing or excessive compiled runtime inventory');
  let bytes = 0;
  const hashes = [];
  for (const name of compiled.sort()) {
    const contents = await readFile(join(dist, name));
    bytes += contents.length;
    assert(bytes <= MAX_BYTES, 'compiled runtime exceeds bounded release size');
    hashes.push({ path: name, bytes: contents.length, sha256: sha256(contents) });
  }
  for (const name of references) {
    assert(hashes.some((entry) => entry.path === name), 'compiled HTML refers to missing asset: ' + name);
  }
  return { artifactRoot, sourceRoot, dist, revision, version, manifest, hashes, bytes };
}

const gameRoute = (version) => 'artifacts/ethic-brawl/' + version + '/index.html';
function qualifyCatalog(catalog, routes, version, revision, count) {
  const entries = catalog.items?.filter((item) => item.id === 'ethic-brawl') || [];
  const source = catalog.items?.find((item) => item.id === 'ethic-brawl-source');
  const paths = routes.entries?.filter((item) => item.id === 'ethic-brawl') || [];
  assert(entries.length === 1 && paths.length === 1,
    'expected one runtime game entry and one baseline route (not a duplicate)');
  assert(source?.url === 'https://github.com/fkr-0/ethic-brawl' && source.availability === 'external',
    'independent source link must remain external');
  const target = '/' + gameRoute(version);
  const item = entries[0];
  const previouslyVerified = item.availability === 'verified';
  const previouslyProvisional = item.availability === 'provisional';
  const previouslyActive = item.status === 'active';
  item.version = version;
  item.availability = 'verified';
  item.status = 'active';
  item.url = target;
  item.git = { ...item.git, revision, basis: 'submodule-pin', path: 'ethic-brawl' };
  item.description = 'Playable, self-contained Ethic Brawl ' + version + ' from the independent pinned game repository.';
  item.receipt = { version, files: count, generatedAt: null };
  item.deployment = { state: 'staged', routePath: gameRoute(version), sourceKind: 'pinned-submodule-compiled', revision };
  Object.assign(paths[0], { url: target, path: gameRoute(version), state: 'staged', sourceKind: 'pinned-submodule-compiled' });
  if (catalog.summary) {
    if (!previouslyVerified) catalog.summary.verified = (catalog.summary.verified || 0) + 1;
    if (previouslyProvisional) catalog.summary.provisional = (catalog.summary.provisional || 0) - 1;
    if (!previouslyActive) catalog.summary.active = (catalog.summary.active || 0) + 1;
  }
  return target;
}
async function record(root, manifest, name) {
  const bytes = await readFile(join(root, name));
  manifest.files[name] = { bytes: bytes.length, sha256: sha256(bytes) };
}
export async function publishEthicBrawl({ root = DEFAULT_ROOT, stageRoot = join(root, '.artifacts-pages-stage') } = {}) {
  const source = await inspectEthicBrawl({ root });
  const stage = resolve(stageRoot);
  const baseReceipt = await readJson(join(stage, 'V13_5_PAGES_INTEGRATION.json'));
  const handoff = await readJson(join(stage, 'PUBLICATION_HANDOFF.json'));
  assert(baseReceipt.deployment?.performed === false && baseReceipt.v13_5?.stagedV12Local === 44 &&
    baseReceipt.v13_5?.missingV12Local === 0 && baseReceipt.v13_5?.catalogItems >= 55 &&
    handoff.schemaVersion === 'artifacts-v13.5/publication-handoff-v1',
  'qualified V13.5 handoff and parity receipt must precede the game overlay');
  const baseManifest = await readJson(join(stage, 'asset-manifest.json'));
  const catalog = await readJson(join(stage, 'catalog.json'));
  const routes = await readJson(join(stage, 'route-manifest.json'));
  const target = 'artifacts/ethic-brawl/' + source.version;
  const destination = join(stage, target);
  try { await stat(destination); throw new Error('Ethic Brawl publication: refusing existing game output: ' + destination); }
  catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const url = qualifyCatalog(catalog, routes, source.version, source.revision, source.hashes.length);
  // Do not re-stage sources or sourcemaps; copy only the independently verified runtime inventory.
  for (const item of source.hashes) {
    const path = join(destination, item.path);
    await mkdir(dirname(path), { recursive: true });
    await cp(join(source.dist, item.path), path, { force: false });
    await record(stage, baseManifest, target + '/' + item.path);
  }
  // Keep the V12 compatibility URL useful without pretending its old dev HTML is runnable.
  const redirect = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta http-equiv="refresh" content="0;url=../' + url.slice(1) +
    '"><title>Ethic Brawl moved</title></head><body><a href="../' + url.slice(1) +
    '">Play Ethic Brawl</a></body></html>\n';
  await mkdir(join(stage, 'ethic-brawl'), { recursive: true });
  await writeFile(join(stage, 'ethic-brawl/index.html'), redirect);
  await writeFile(join(stage, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  await writeFile(join(stage, 'route-manifest.json'), JSON.stringify(routes, null, 2) + '\n');
  for (const name of ['catalog.json', 'route-manifest.json', 'ethic-brawl/index.html']) {
    await record(stage, baseManifest, name);
  }
  await writeFile(join(stage, 'asset-manifest.json'), JSON.stringify(baseManifest, null, 2) + '\n');
  const receipt = {
    schemaVersion: RELEASE_SCHEMA, sourceRepository: source.manifest.source.git.repository,
    sourceRevision: source.revision, version: source.version, route: url,
    compatibilityRoute: '/ethic-brawl/index.html', runtimeFiles: source.hashes,
    runtimeBytes: source.bytes, v13HandoffSha256: sha256(await readFile(join(stage, 'PUBLICATION_HANDOFF.json'))),
    finalAssetManifestSha256: sha256(await readFile(join(stage, 'asset-manifest.json'))),
    deployment: { performed: false },
  };
  await writeFile(join(stage, 'ETHIC_BRAWL_PAGES_RELEASE.json'), JSON.stringify(receipt, null, 2) + '\n');
  await verifyEthicBrawlStage({ root, stageRoot: stage });
  return receipt;
}

export async function verifyEthicBrawlStage({ root = DEFAULT_ROOT, stageRoot = join(root, '.artifacts-pages-stage') } = {}) {
  const stage = resolve(stageRoot);
  const receipt = await readJson(join(stage, 'ETHIC_BRAWL_PAGES_RELEASE.json'));
  const source = await inspectEthicBrawl({ root });
  const catalog = await readJson(join(stage, 'catalog.json'));
  const routes = await readJson(join(stage, 'route-manifest.json'));
  const manifest = await readJson(join(stage, 'asset-manifest.json'));
  assert(receipt.schemaVersion === RELEASE_SCHEMA && receipt.deployment?.performed === false &&
    receipt.sourceRevision === source.revision && receipt.version === source.version &&
    receipt.route === '/' + gameRoute(source.version), 'release provenance mismatch');
  assert(receipt.finalAssetManifestSha256 === sha256(await readFile(join(stage, 'asset-manifest.json'))),
    'final asset-manifest hash mismatch');
  assert(receipt.v13HandoffSha256 === sha256(await readFile(join(stage, 'PUBLICATION_HANDOFF.json'))),
    'V13.5 handoff mutated after qualification');
  const catalogItem = catalog.items?.find((item) => item.id === 'ethic-brawl');
  const catalogRoute = routes.entries?.find((item) => item.id === 'ethic-brawl');
  assert(catalogItem?.url === receipt.route && catalogItem.version === source.version &&
    catalogItem.availability === 'verified' && catalogItem.deployment?.revision === source.revision &&
    catalogRoute?.path === gameRoute(source.version) && catalogRoute?.state === 'staged',
    'catalog or stage route does not identify the qualified runtime');
  assert(receipt.runtimeFiles?.length === source.hashes.length && receipt.runtimeBytes === source.bytes,
    'runtime inventory size mismatch');
  const prefix = 'artifacts/ethic-brawl/' + source.version + '/';
  for (let index = 0; index < source.hashes.length; index += 1) {
    const expected = source.hashes[index];
    const actual = receipt.runtimeFiles[index];
    assert(expected.path === actual?.path && expected.sha256 === actual?.sha256,
      'runtime receipt disagrees with committed-source build: ' + expected.path);
    const name = prefix + expected.path;
    assert(manifest.files?.[name]?.sha256 === expected.sha256, 'asset inventory mismatch: ' + name);
    assert(sha256(await readFile(join(stage, name))) === expected.sha256, 'staged asset modified: ' + name);
  }
  for (const name of ['catalog.json', 'route-manifest.json', 'ethic-brawl/index.html']) {
    assert(manifest.files?.[name]?.sha256 === sha256(await readFile(join(stage, name))),
      'unverified updated stage file: ' + name);
  }
  const redirect = await readFile(join(stage, 'ethic-brawl/index.html'), 'utf8');
  assert(redirect.includes('../' + gameRoute(source.version)), 'legacy route lacks playable redirect');
  return { route: receipt.route, files: source.hashes.length, bytes: source.bytes };
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  const [command, value] = process.argv.slice(2);
  const stageRoot = value ? resolve(value) : undefined;
  try {
    const result = command === 'preflight' ? await inspectEthicBrawl()
      : command === 'publish' ? await publishEthicBrawl({ stageRoot })
      : command === 'verify' ? await verifyEthicBrawlStage({ stageRoot })
      : null;
    assert(result !== null, 'usage: preflight | publish [stageDir] | verify [stageDir]');
    console.log('Ethic Brawl Pages ' + command + ' OK:', JSON.stringify({
      version: result.version, revision: result.revision, route: result.route,
      files: result.files || result.hashes?.length,
    }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
