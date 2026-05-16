#!/usr/bin/env node
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { compileArtifactCollectionFile } from './artifact-catalog.mjs';

const DEFAULT_EXCLUDES = new Set([
  '.git',
  'node_modules',
  '.vite',
  'coverage',
  '.cache',
  '.parcel-cache',
  '.turbo',
  '.next',
]);

const DEFAULT_INCLUDE_FILES = [
  'ARTIFACTS_TOC.md',
  'SERVER_GUIDE.md',
  'SETUP_ALIASES.sh',
  'artifacts-serve',
  'artifacts-server.sh',
  'artifacts-package',
  'artifacts-deploy',
  'bridge.yml',
];

export async function materializeArtifactBuild(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const sourcePath = resolve(options.sourcePath || join(rootDir, 'app-hub-v11', 'artifacts.source.json'));
  const outDir = resolve(options.outDir || join(rootDir, '.artifacts-build-stage'));
  const runBuilds = options.runBuilds !== false;
  const clean = options.clean !== false;
  const catalogOutDir = join(outDir, 'app-hub-v11', 'data');

  if (clean) await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const source = JSON.parse(await readFile(sourcePath, 'utf8'));
  const built = [];
  const included = [];
  const skipped = [];

  for (const item of source.items || []) {
    if (item.kind === 'external-link') {
      skipped.push({ id: item.id, reason: 'external-link' });
      continue;
    }
    if (item.deploy?.include === false) {
      skipped.push({ id: item.id, reason: 'deploy.include=false' });
      continue;
    }
    if (item.deploy?.build) {
      await runBuild(item, { rootDir, runBuilds });
      built.push({ id: item.id, cwd: item.deploy.build.cwd, command: item.deploy.build.command });
    }
    const include = deploymentIncludeForItem(item);
    if (!include) continue;
    await copyIntoStage({ rootDir, outDir, sourcePath: include.sourcePath, targetPath: include.targetPath });
    pushUnique(included, { id: item.id, path: include.targetPath });
  }

  for (const file of source.deploy?.includeFiles || DEFAULT_INCLUDE_FILES) {
    if (await exists(join(rootDir, file))) {
      await copyIntoStage({ rootDir, outDir, sourcePath: file, targetPath: file });
      pushUnique(included, { id: 'deploy:file', path: file });
    }
  }
  for (const dir of source.deploy?.includeDirs || ['app-hub-v11']) {
    if (await exists(join(rootDir, dir))) {
      await copyIntoStage({ rootDir, outDir, sourcePath: dir, targetPath: dir });
      pushUnique(included, { id: 'deploy:dir', path: dir });
    }
  }

  const rootIndex = source.deploy?.rootIndex?.source || 'app-hub-v11/index.html';
  await writeRootRedirectIndex({ outDir, target: rootIndex });
  pushUnique(included, { id: 'deploy:root-index', path: 'index.html' });

  const catalog = await compileArtifactCollectionFile(sourcePath, { rootDir, outDir: catalogOutDir });
  const manifest = { generatedAt: new Date().toISOString(), sourcePath: relative(rootDir, sourcePath), rootIndex, built, included, skipped, catalog: { total: catalog.summary.total } };
  await writeFile(join(outDir, 'BUILD_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  return { outDir, catalog, built, included, skipped, manifest };
}

function deploymentIncludeForItem(item) {
  if (item.deploy?.includePath) {
    return { sourcePath: item.deploy.includePath, targetPath: item.deploy.targetPath || item.deploy.includePath };
  }
  const href = item.href || item.hubHref || item.source;
  if (!href || /^https?:\/\//.test(href) || href.startsWith('#')) return null;
  const cleanHref = href.split('?')[0].split('#')[0];
  if (cleanHref.startsWith('..' + '/') || cleanHref.startsWith('../')) {
    const local = normalize(cleanHref.replace(/^\.\.\//, ''));
    return { sourcePath: topLevelDeployPath(local), targetPath: topLevelDeployPath(local) };
  }
  return null;
}

function topLevelDeployPath(path) {
  const parts = normalize(path).split(sep).filter(Boolean);
  if (parts.length === 0) return path;
  if (parts.length === 1) return parts[0];
  return parts[0];
}


async function writeRootRedirectIndex({ outDir, target }) {
  const safeTarget = String(target || 'app-hub-v11/index.html').replace(/["'<>]/g, '');
  await writeFile(join(outDir, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="refresh" content="0; url=${safeTarget}" />
  <title>NEXUS App Hub v11</title>
  <script>location.replace(${JSON.stringify(safeTarget)});</script>
</head>
<body><p>Loading <a href="${safeTarget}">NEXUS App Hub v11</a>…</p></body>
</html>
`);
}

async function runBuild(item, { rootDir, runBuilds }) {
  const build = item.deploy.build;
  if (!build?.command) return;
  const cwd = resolveInside(rootDir, build.cwd || '.');
  if (!runBuilds) return;
  await new Promise((resolvePromise, reject) => {
    const child = spawn(build.command, { cwd, shell: true, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${item.id}: build failed with exit code ${code}`));
    });
  });
}

async function copyIntoStage({ rootDir, outDir, sourcePath, targetPath }) {
  const from = resolveInside(rootDir, sourcePath);
  const to = resolveInside(outDir, targetPath);
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true, filter: (src) => !DEFAULT_EXCLUDES.has(src.split(sep).pop()) });
}

function resolveInside(root, child) {
  const resolved = resolve(root, child);
  const rel = relative(root, resolved);
  if (rel.startsWith('..') || rel === '..' || resolve(root) === resolved) return resolved;
  return resolved;
}

function pushUnique(list, value) {
  if (!list.some((entry) => entry.path === value.path && entry.id === value.id)) list.push(value);
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const result = await materializeArtifactBuild({
    rootDir: args.rootDir || process.cwd(),
    sourcePath: args.sourcePath,
    outDir: args.outDir,
    runBuilds: !args.noBuild,
    clean: !args.noClean,
  });
  console.log(`Materialized ${result.catalog.summary.total} artifacts to ${result.outDir}`);
  console.log(`Built: ${result.built.map((entry) => entry.id).join(', ') || 'none'}`);
  console.log(`Included: ${result.included.length}`);
  console.log(`Skipped: ${result.skipped.length}`);
}

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--root') parsed.rootDir = args[++i];
    else if (arg === '--source') parsed.sourcePath = args[++i];
    else if (arg === '--out') parsed.outDir = args[++i];
    else if (arg === '--no-build') parsed.noBuild = true;
    else if (arg === '--no-clean') parsed.noClean = true;
  }
  return parsed;
}
