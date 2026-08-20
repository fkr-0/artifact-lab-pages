#!/usr/bin/env node
import { cp, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { materializeArtifactBuild } from '../app-hub-v11/server/artifact-build.mjs';
import { discoverManifests } from '../tooling/artifactctl/src/discover.mjs';
import { assembleSite } from '../tooling/artifactctl/src/site.mjs';

export const REQUIRED_PUBLICATION_PATHS = [
  'hub/v13/index.html',
  'hub/v13/app.js',
  'hub/v13/styles.css',
  'hub/v13/vendor/artifact-bridge/bridge.js',
  'hub/v13/catalog.json',
  'catalog/catalog.json',
  'app-hub-v11/index.html',
  'club-ledger/index.html',
  'gif-white-to-transparent/index.html',
  'pdf-forge-nexus/index.html',
  'prompt-gen-nexus/index.html',
  'qr-studio/index.html',
  'sexy-love-chat/index.html',
  'sprite-extractor/index.html',
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyIfPresent(source, target) {
  if (!(await exists(source))) return false;
  await cp(source, target, { recursive: true, force: true });
  return true;
}

export async function buildPublicationSite(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const outDir = resolve(options.outDir || join(rootDir, 'dist/site'));
  const legacySourcePath = resolve(options.legacySourcePath || join(rootDir, 'app-hub-v11/artifacts.source.json'));
  if (outDir === rootDir) throw new Error('Refusing to replace the repository root with a publication stage');

  const scratch = await mkdtemp(join(tmpdir(), 'artifact-lab-publication-'));
  const legacyDir = join(scratch, 'legacy');
  const v13Dir = join(scratch, 'v13');
  const compositeDir = join(scratch, 'composite');

  try {
    const legacy = await materializeArtifactBuild({
      rootDir,
      sourcePath: legacySourcePath,
      outDir: legacyDir,
      runBuilds: options.runBuilds !== false,
    });
    const manifests = await discoverManifests({ rootDir, adapter: 'app-hub-v11' });
    const v13 = await assembleSite(manifests, {
      rootDir,
      outDir: v13Dir,
      allowCompile: options.allowCompile === true,
    });

    await cp(legacyDir, compositeDir, { recursive: true, force: true });
    for (const directory of ['hub', 'catalog', 'artifacts', 'libraries']) {
      await copyIfPresent(join(v13Dir, directory), join(compositeDir, directory));
    }
    // Keep the V13 app's same-directory fallback catalog byte-for-byte aligned
    // with the authoritative generated publication catalog. The source-tree
    // copy is intentionally only a development fallback and may be older.
    await cp(join(v13Dir, 'catalog/catalog.json'), join(compositeDir, 'hub/v13/catalog.json'), { force: true });
    await cp(join(v13Dir, 'index.html'), join(compositeDir, 'index.html'), { force: true });
    await cp(join(legacyDir, 'BUILD_MANIFEST.json'), join(compositeDir, 'BUILD_MANIFEST.v11.json'), { force: true });
    await cp(join(v13Dir, 'BUILD_MANIFEST.json'), join(compositeDir, 'BUILD_MANIFEST.v13.json'), { force: true });

    const missingPaths = [];
    for (const path of REQUIRED_PUBLICATION_PATHS) {
      if (!(await exists(join(compositeDir, path)))) missingPaths.push(path);
    }
    if (missingPaths.length) {
      throw new Error(`Publication stage is incomplete; missing: ${missingPaths.join(', ')}`);
    }

    const rootIndex = await readFile(join(compositeDir, 'index.html'), 'utf8');
    if (!/hub\/v13\/index\.html/.test(rootIndex)) {
      throw new Error('Publication root index does not promote App Hub V13');
    }

    const manifest = {
      schemaVersion: 'artifacts.fkr.dev/publication-site-v1',
      generatedAt: new Date().toISOString(),
      root: relative(rootDir, outDir).startsWith('..') ? '<external-stage>' : (relative(rootDir, outDir) || '.'),
      rootIndex: 'hub/v13/index.html',
      compatibility: {
        hub: 'app-hub-v11',
        source: relative(rootDir, legacySourcePath),
        catalogEntries: legacy.catalog.summary.total,
        includedPaths: legacy.included.length,
      },
      v13: {
        catalog: v13.catalog.summary,
        builds: v13.builds.map((entry) => ({
          id: entry.manifest.id,
          version: entry.version,
          files: entry.receipt.files.length,
        })),
      },
      requiredPaths: REQUIRED_PUBLICATION_PATHS,
      verifiedRequiredPaths: REQUIRED_PUBLICATION_PATHS.length,
    };
    await writeFile(join(compositeDir, 'BUILD_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

    await rm(outDir, { recursive: true, force: true });
    await mkdir(dirname(outDir), { recursive: true });
    await cp(compositeDir, outDir, { recursive: true, force: true });
    return { outDir, legacy, v13, manifest };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') options.rootDir = args[++index];
    else if (arg === '--source') options.legacySourcePath = args[++index];
    else if (arg === '--out') options.outDir = args[++index];
    else if (arg === '--no-build') options.runBuilds = false;
    else if (arg === '--allow-compile') options.allowCompile = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await buildPublicationSite(parseArgs(process.argv.slice(2)));
  console.log(`Publication site: ${result.v13.catalog.summary.total} V13 catalog entries, ${result.v13.builds.length} verified native builds -> ${result.outDir}`);
  console.log(`Legacy compatibility: ${result.legacy.catalog.summary.total} catalog entries, ${result.legacy.included.length} included paths`);
  console.log(`Required publication paths verified: ${result.manifest.verifiedRequiredPaths}`);
}
