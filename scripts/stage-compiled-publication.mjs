#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildArtifact } from '../tooling/artifactctl/src/build.mjs';
import {
  collectGitMetadata,
  generateCatalog,
  loadReceiptBuilds,
  writeCatalog,
} from '../tooling/artifactctl/src/catalog.mjs';
import { validateManifest } from '../tooling/artifactctl/src/core.mjs';
import { discoverNativeManifests } from '../tooling/artifactctl/src/discover.mjs';

const execFileAsync = promisify(execFile);

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function git(cwd, args) {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout.trim();
}

async function portfolioVersion(rootDir) {
  try {
    return JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8')).version || null;
  } catch {
    return null;
  }
}

async function assertPinnedCheckout(manifest, rootDir, requireParentGitlink) {
  const sourcePath = manifest.source?.path;
  const expectedRevision = manifest.source?.git?.revision;
  if (manifest.source?.kind !== 'project' || manifest.source?.git?.mode !== 'submodule') {
    throw new Error(`${manifest.id}: selective publication compile requires a submodule project source`);
  }
  if (!sourcePath || !expectedRevision || !/^[0-9a-f]{40}$/i.test(expectedRevision)) {
    throw new Error(`${manifest.id}: submodule repository and immutable revision are required`);
  }

  const checkoutRevision = await git(join(rootDir, sourcePath), ['rev-parse', 'HEAD']);
  if (checkoutRevision !== expectedRevision) {
    throw new Error(
      `${manifest.id}: checkout revision ${checkoutRevision} does not match manifest pin ${expectedRevision}`,
    );
  }

  if (!requireParentGitlink) return;
  const parentEntry = await git(rootDir, ['ls-files', '-s', '--', sourcePath]);
  const match = /^160000\s+([0-9a-f]{40})\s+\d+\t/.exec(parentEntry);
  if (!match) throw new Error(`${manifest.id}: parent repository does not record ${sourcePath} as a gitlink`);
  if (match[1] !== expectedRevision) {
    throw new Error(
      `${manifest.id}: parent gitlink ${match[1]} does not match manifest pin ${expectedRevision}`,
    );
  }
}

export async function stageCompiledPublication(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const stageDir = resolve(options.stageDir || join(rootDir, 'dist/site'));
  const ids = [...new Set(options.ids || [])];
  if (!ids.length) throw new Error('At least one compiled artifact id is required');
  if (!(await exists(stageDir))) throw new Error(`Publication stage does not exist: ${stageDir}`);

  const manifests = options.manifests || (await discoverNativeManifests({ rootDir }));
  const manifestsById = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  const selected = ids.map((id) => {
    const manifest = manifestsById.get(id);
    if (!manifest) throw new Error(`Unknown native artifact id: ${id}`);
    return manifest;
  });

  for (const manifest of selected) {
    if (manifest.status === 'provisional') {
      throw new Error(`${manifest.id}: provisional artifacts cannot be selectively published`);
    }
    if (manifest.build?.mode !== 'compile') {
      throw new Error(`${manifest.id}: selective publication is only for compile-mode artifacts`);
    }
    const validation = await validateManifest(manifest, { rootDir, checkExistence: true });
    if (!validation.ok) {
      throw new Error(
        `${manifest.id}: manifest invalid: ${validation.errors.map((entry) => entry.message).join('; ')}`,
      );
    }
    await assertPinnedCheckout(manifest, rootDir, options.requireParentGitlink !== false);
  }

  const artifactRoot = join(stageDir, 'artifacts');
  const existingBuilds = await loadReceiptBuilds(manifests, artifactRoot);
  const compiledBuilds = [];
  const buildArtifactImpl = options.buildArtifactImpl || buildArtifact;
  for (const manifest of selected) {
    compiledBuilds.push(
      await buildArtifactImpl(manifest, {
        rootDir,
        outDir: artifactRoot,
        libraryOutDir: join(stageDir, 'libraries'),
        allowCompile: true,
      }),
    );
  }

  const buildsById = new Map(existingBuilds.map((entry) => [entry.manifest.id, entry]));
  for (const build of compiledBuilds) buildsById.set(build.manifest.id, build);
  const builds = [...buildsById.values()];
  const gitMetadata = await collectGitMetadata(manifests, { rootDir });
  const catalog = generateCatalog(manifests, builds, {
    gitMetadata,
    portfolioVersion: await portfolioVersion(rootDir),
  });
  await writeCatalog(catalog, join(stageDir, 'catalog/catalog.json'));

  const hubDir = join(stageDir, 'hub/v13');
  if (await exists(hubDir)) {
    await mkdir(hubDir, { recursive: true });
    await writeCatalog(catalog, join(hubDir, 'catalog.json'));
  }

  const manifestPath = join(stageDir, 'BUILD_MANIFEST.json');
  if (await exists(manifestPath)) {
    const publicationManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    publicationManifest.catalog = catalog.summary;
    publicationManifest.builds = builds
      .map((entry) => ({
        id: entry.manifest.id,
        version: entry.version,
        files: entry.receipt.files.length,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
    publicationManifest.selectiveCompiles = compiledBuilds.map((entry) => ({
      id: entry.manifest.id,
      version: entry.version,
      revision: entry.manifest.source.git.revision,
    }));
    await writeFile(manifestPath, `${JSON.stringify(publicationManifest, null, 2)}\n`);
  }

  return {
    stageDir,
    catalog,
    builds,
    compiledBuilds,
  };
}

function parseArgs(args) {
  const options = { ids: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') options.rootDir = args[++index];
    else if (arg === '--stage') options.stageDir = args[++index];
    else if (arg === '--id') options.ids.push(args[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await stageCompiledPublication(parseArgs(process.argv.slice(2)));
  console.log(
    `Selective publication: ${result.compiledBuilds.map((entry) => `${entry.manifest.id}@${entry.version}`).join(', ')} -> ${result.stageDir}`,
  );
}
