#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { discoverNativeManifests } from '../tooling/artifactctl/src/discover.mjs';
import { assembleSite } from '../tooling/artifactctl/src/site.mjs';

export const REQUIRED_PUBLICATION_PATHS = [
  'hub/v13/index.html',
  'hub/v13/app.js',
  'hub/v13/catalog.js',
  'hub/v13/collection.js',
  'hub/v13/contracts.js',
  'hub/v13/arcade-tools.js',
  'hub/v13/peer-boundary.js',
  'hub/v13/peer-lobby.js',
  'hub/v13/search.js',
  'hub/v13/state.js',
  'hub/v13/styles.css',
  'hub/v13/view.js',
  'catalog/catalog.json',
];

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

export async function buildPublicationSite(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const outDir = resolve(options.outDir || join(rootDir, 'dist/site'));
  if (outDir === rootDir) throw new Error('Refusing to replace the repository root with a publication stage');

  const manifests = options.manifests || await discoverNativeManifests({ rootDir });
  const site = await assembleSite(manifests, {
    rootDir,
    outDir,
    allowCompile: options.allowCompile === true,
  });

  const missingPaths = [];
  for (const path of REQUIRED_PUBLICATION_PATHS) {
    if (!(await exists(join(outDir, path)))) missingPaths.push(path);
  }
  if (missingPaths.length) throw new Error(`Publication stage is incomplete; missing: ${missingPaths.join(', ')}`);

  const rootIndex = await readFile(join(outDir, 'index.html'), 'utf8');
  if (!/hub\/v13\/index\.html/.test(rootIndex)) throw new Error('Publication root index does not promote V13Hub');

  const manifest = {
    schemaVersion: 'artifacts.fkr.dev/publication-site-v2',
    generatedAt: site.manifest.generatedAt,
    root: relative(rootDir, outDir).startsWith('..') ? '<external-stage>' : (relative(rootDir, outDir) || '.'),
    rootIndex: 'hub/v13/index.html',
    catalog: site.catalog.summary,
    builds: site.manifest.builds,
    compatibility: {
      legacyHubBundled: false,
      reason: 'V13 publication now consumes native manifests directly; deleted V11 hub source is not restored as an implicit build dependency.',
    },
    requiredPaths: REQUIRED_PUBLICATION_PATHS,
    verifiedRequiredPaths: REQUIRED_PUBLICATION_PATHS.length,
  };
  await writeFile(join(outDir, 'BUILD_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { ...site, manifest };
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') options.rootDir = args[++index];
    else if (arg === '--out') options.outDir = args[++index];
    else if (arg === '--allow-compile') options.allowCompile = true;
    else if (arg === '--no-build') continue;
    else if (arg === '--source') index += 1;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await buildPublicationSite(parseArgs(process.argv.slice(2)));
  console.log(`Publication site: ${result.catalog.summary.total} native catalog entries, ${result.builds.length} staged releases -> ${result.outDir}`);
  console.log(`V13Hub required paths verified: ${result.manifest.verifiedRequiredPaths}`);
}
