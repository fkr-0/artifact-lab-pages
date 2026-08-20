import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, posix, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathExists } from './core.mjs';

const execFileAsync = promisify(execFile);

function sourceUrl(manifest) {
  const source = manifest.source || {};
  if (!source.path) return null;
  if (source.kind === 'file') return `/${source.path.replace(/^\/+/, '')}`;
  if (!['directory', 'project'].includes(source.kind)) return null;
  if (manifest.build?.mode === 'compile') return null;
  const entrypoint = source.entrypoint || manifest.release?.entrypoint;
  if (!entrypoint) return null;
  return `/${posix.join(source.path, entrypoint).replace(/^\/+/, '')}`;
}

function releaseUrl(manifest, receipt) {
  if (manifest.kind === 'link') return manifest.release.url || manifest.source.url;
  if (manifest.kind === 'text') return null;
  if (receipt) {
    const entrypoint = manifest.release.entrypoint || receipt.files?.[0]?.path || '';
    return `/artifacts/${manifest.id}/${receipt.version}/${entrypoint}`;
  }
  if (manifest.legacy?.href) return `/${String(manifest.legacy.href).replace(/^\.\.\//, '')}`;
  return sourceUrl(manifest);
}

async function git(rootDir, args) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout.trim();
  } catch {
    return '';
  }
}

function parseCommitRecord(value) {
  if (!value) return null;
  const [revision, changedAt] = value.split('\t');
  if (!revision || !changedAt || Number.isNaN(Date.parse(changedAt))) return null;
  return { revision, changedAt: new Date(changedAt).toISOString() };
}

async function submodulePinMetadata(manifest, rootDir) {
  const sourcePath = manifest.source?.path;
  if (manifest.source?.git?.mode !== 'submodule' || !sourcePath) return null;
  const entry = await git(rootDir, ['ls-files', '-s', '--', sourcePath]);
  const match = /^160000\s+([0-9a-f]{40})\s+\d+\t/.exec(entry);
  if (!match) return null;
  const revision = match[1];
  const changedAt = await git(rootDir, ['-C', sourcePath, 'show', '-s', '--format=%cI', revision]);
  if (!changedAt || Number.isNaN(Date.parse(changedAt))) return null;
  return {
    changedAt: new Date(changedAt).toISOString(),
    revision,
    basis: 'submodule-pin',
    path: sourcePath,
  };
}

async function rootPathMetadata(path, rootDir, basis, ignorePaths = []) {
  if (!path) return null;
  const pathspecs = [path, ...ignorePaths.map((ignored) => `:(exclude)${ignored}`)];
  const record = parseCommitRecord(await git(rootDir, ['log', '-1', '--format=%H%x09%cI', '--', ...pathspecs]));
  return record ? { ...record, basis, path } : null;
}

export async function collectGitMetadata(manifests, options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const metadata = new Map();
  for (const manifest of manifests) {
    let record = await submodulePinMetadata(manifest, rootDir);
    const sourcePath = manifest.source?.path;
    const ignoredSourcePaths = (manifest.source?.git?.ignorePaths || []).map((ignored) => posix.join(sourcePath || '', ignored));
    if (!record) record = await rootPathMetadata(sourcePath, rootDir, 'source', ignoredSourcePaths);
    if (!record) {
      const legacyDate = manifest.legacy?.changedAt || manifest.legacy?.modifiedAt;
      if (legacyDate && !Number.isNaN(Date.parse(legacyDate))) {
        record = {
          changedAt: new Date(legacyDate).toISOString(),
          revision: null,
          basis: 'legacy',
          path: manifest.legacy?.href || null,
        };
      }
    }
    if (!record) record = await rootPathMetadata(manifest.__manifestPath, rootDir, 'manifest');
    metadata.set(manifest.id, record || {
      changedAt: null,
      revision: null,
      basis: 'unknown',
      path: manifest.source?.path || manifest.__manifestPath || null,
    });
  }
  return metadata;
}

export async function loadReceiptBuilds(manifests, receiptRoot) {
  if (!receiptRoot) return [];
  const root = resolve(receiptRoot);
  const builds = [];
  for (const manifest of manifests) {
    const version = manifest.version || (manifest.status === 'provisional' ? 'provisional' : '0.0.0-dev');
    const path = join(root, manifest.id, version, '.artifact-receipt.json');
    if (!(await pathExists(path))) continue;
    const receipt = JSON.parse(await readFile(path, 'utf8'));
    if (receipt.id !== manifest.id || receipt.version !== version || receipt.verification?.ok !== true) continue;
    builds.push({ manifest, version, stageRoot: dirname(path), receipt });
  }
  return builds;
}

export function generateCatalog(manifests, builds = [], options = {}) {
  const receipts = new Map(builds.map((entry) => [entry.manifest.id, entry.receipt]));
  const gitMetadata = options.gitMetadata || new Map();
  const items = manifests.map((manifest) => {
    const receipt = receipts.get(manifest.id);
    const url = releaseUrl(manifest, receipt);
    const gitInfo = gitMetadata.get(manifest.id) || {
      changedAt: null,
      revision: null,
      basis: 'unknown',
      path: manifest.source?.path || null,
    };
    return {
      id: manifest.id,
      version: manifest.version || null,
      title: manifest.title,
      description: manifest.description || '',
      kind: manifest.kind,
      status: manifest.status || 'experimental',
      required: manifest.required !== false,
      tags: manifest.tags || [],
      sourceKind: manifest.source.kind,
      gitMode: manifest.source.git.mode,
      buildMode: manifest.build.mode,
      releaseKind: manifest.release.kind,
      availability: receipt ? 'verified' : manifest.kind === 'link' ? 'external' : manifest.kind === 'text' ? 'inline' : manifest.status === 'provisional' ? 'provisional' : 'source-only',
      url,
      text: manifest.kind === 'text' ? manifest.source.text : undefined,
      launch: manifest.launch || { default: url ? 'newWindow' : 'none', modes: url ? ['newWindow'] : ['none'] },
      git: gitInfo,
      changedAt: gitInfo.changedAt,
      receipt: receipt ? { version: receipt.version, files: receipt.files.length, generatedAt: receipt.generatedAt } : null,
    };
  });
  items.sort((a, b) => {
    const byDate = (Date.parse(b.changedAt || '') || 0) - (Date.parse(a.changedAt || '') || 0);
    return byDate || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  });
  const generatedAt = new Date().toISOString();
  return {
    schemaVersion: 'artifacts.fkr.dev/catalog-v1',
    generatedAt,
    build: {
      portfolioVersion: options.portfolioVersion || null,
      ordering: 'git-last-committed-change-desc',
      generator: 'artifactctl',
    },
    summary: {
      total: items.length,
      verified: items.filter((item) => item.availability === 'verified').length,
      provisional: items.filter((item) => item.availability === 'provisional').length,
      external: items.filter((item) => item.availability === 'external').length,
      inline: items.filter((item) => item.availability === 'inline').length,
      sourceOnly: items.filter((item) => item.availability === 'source-only').length,
      active: items.filter((item) => item.status === 'active').length,
      dated: items.filter((item) => item.changedAt).length,
    },
    items,
  };
}

export async function writeCatalog(catalog, path) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(catalog, null, 2)}\n`);
  return target;
}
