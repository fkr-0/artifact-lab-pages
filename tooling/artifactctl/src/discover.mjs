import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathExists, readJson } from './core.mjs';
import { adaptV11Catalog } from './v11-adapter.mjs';

const SKIP_DIRS = new Set([
  '.git',
  '.worktrees',
  '.wsbridge',
  '.ws-bridge',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'generated',
  '.cache',
  '.vite',
  'test-results',
  'playwright-report',
]);

function shouldSkipDirectory(name) {
  return SKIP_DIRS.has(name) || name.startsWith('.artifacts-');
}

async function findNamedFiles(root, name, results = []) {
  if (!(await pathExists(root))) return results;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name === name && entry.isFile()) results.push(join(root, entry.name));
    if (entry.isDirectory() && !shouldSkipDirectory(entry.name)) {
      await findNamedFiles(join(root, entry.name), name, results);
    }
  }
  return results;
}

export async function discoverNativeManifests(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const paths = [];
  const sidecars = resolve(rootDir, 'registry/sources.d');
  if (await pathExists(sidecars)) {
    for (const entry of await readdir(sidecars, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.json')) paths.push(join(sidecars, entry.name));
    }
  }
  paths.push(...await findNamedFiles(rootDir, 'artifact.json'));
  const manifests = [];
  for (const path of [...new Set(paths)].sort()) {
    const manifest = await readJson(path);
    manifests.push({ ...manifest, __manifestPath: relative(rootDir, path) });
  }
  return manifests;
}

export async function discoverManifests(options = {}) {
  const native = await discoverNativeManifests(options);
  if (options.adapter === 'app-hub-v11') {
    const adapted = await adaptV11Catalog(options);
    const adaptedById = new Map(adapted.map((item) => [item.id, item]));
    const nativeWithLegacyMetadata = native.map((item) => {
      const compatible = adaptedById.get(item.id);
      if (item.legacy || !compatible?.legacy) return item;
      return { ...item, legacy: compatible.legacy };
    });
    const nativeIds = new Set(nativeWithLegacyMetadata.map((item) => item.id));
    return [...nativeWithLegacyMetadata, ...adapted.filter((item) => !nativeIds.has(item.id))];
  }
  return native;
}
