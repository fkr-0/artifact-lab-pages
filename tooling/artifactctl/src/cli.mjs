#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { buildArtifact } from './build.mjs';
import { collectGitMetadata, generateCatalog, loadReceiptBuilds, writeCatalog } from './catalog.mjs';
import { validateManifest, validateUniqueIds } from './core.mjs';
import { discoverManifests } from './discover.mjs';
import { inventoryRepository } from './inventory.mjs';
import { validateManifestOwnership } from './ownership.mjs';
import { assembleSite } from './site.mjs';

function parseArgs(args) {
  const options = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) options._.push(arg);
    else if (['--all', '--allow-compile', '--include-provisional', '--json'].includes(arg)) options[arg.slice(2)] = true;
    else options[arg.slice(2)] = args[++index];
  }
  return options;
}

async function portfolioVersion(rootDir) {
  try {
    return JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8')).version || null;
  } catch {
    return null;
  }
}

async function writeJson(path, value) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
  return target;
}

function usage() {
  return `artifactctl <command> [options]

Commands:
  inventory                         write ownership report
  discover [--adapter app-hub-v11] emit normalized descriptors
  validate [--adapter app-hub-v11] validate descriptors without building
  build [id|--all]                  stage native artifacts; compile is opt-in
  catalog [--adapter app-hub-v11]   generate V13 catalog
  site [--adapter app-hub-v11]      build native artifacts and V13 site

Options:
  --root <path>                     repository root (default cwd)
  --out <path>                      output path
  --library-out <path>              library release output for artifact builds
  --receipt-root <path>             verified artifact stages used by catalog
  --allow-compile                   execute declared argv compile commands
  --include-provisional             permit provisional entries for selection
`;
}

async function validateAll(manifests, rootDir) {
  const ownership = await inventoryRepository({ rootDir });
  const entries = [];
  for (const manifest of manifests) {
    const structural = await validateManifest(manifest, { rootDir });
    const topology = validateManifestOwnership(manifest, ownership);
    entries.push({
      id: manifest.id,
      path: manifest.__manifestPath || '(adapter)',
      ok: structural.ok && topology.ok,
      errors: [...structural.errors, ...topology.errors],
      warnings: [...structural.warnings, ...topology.warnings],
    });
  }
  const duplicateErrors = validateUniqueIds(manifests);
  return {
    schemaVersion: 'artifacts.fkr.dev/validation-report-v1',
    generatedAt: new Date().toISOString(),
    summary: {
      manifests: manifests.length,
      valid: entries.filter((entry) => entry.ok).length,
      invalid: entries.filter((entry) => !entry.ok).length + (duplicateErrors.length ? 1 : 0),
      warnings: entries.reduce((sum, entry) => sum + entry.warnings.length, 0),
      duplicateIds: duplicateErrors.length,
    },
    duplicateErrors,
    ownership: ownership.summary,
    entries,
  };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const options = parseArgs(rest);
  const rootDir = resolve(options.root || process.cwd());
  const adapter = options.adapter;
  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(usage());
    return;
  }

  if (command === 'inventory') {
    const report = await inventoryRepository({ rootDir });
    const out = options.out || join(rootDir, 'migration/reports/ownership.json');
    await writeJson(out, report);
    console.log(`Inventory: ${report.summary.statusEntries} status entries, ${report.summary.nestedGitRoots} nested Git roots -> ${out}`);
    return;
  }

  const manifests = await discoverManifests({ rootDir, adapter });
  if (command === 'discover') {
    const out = options.out || join(rootDir, 'registry/generated/discovery.json');
    await writeJson(out, { schemaVersion: 'artifacts.fkr.dev/discovery-v1', generatedAt: new Date().toISOString(), count: manifests.length, items: manifests });
    console.log(`Discovered ${manifests.length} manifests -> ${out}`);
    return;
  }
  if (command === 'validate') {
    const report = await validateAll(manifests, rootDir);
    const out = options.out || join(rootDir, 'registry/generated/validation.json');
    await writeJson(out, report);
    console.log(`Validation: ${report.summary.valid} valid, ${report.summary.invalid} invalid, ${report.summary.warnings} warnings -> ${out}`);
    if (report.summary.invalid) process.exitCode = 1;
    return;
  }
  if (command === 'build') {
    const selectedId = options._[0];
    let selected = options.all ? manifests : manifests.filter((manifest) => manifest.id === selectedId);
    if (!options['include-provisional']) selected = selected.filter((manifest) => manifest.status !== 'provisional');
    selected = selected.filter((manifest) => !['link', 'text'].includes(manifest.kind));
    if (!selected.length) throw new Error('No buildable artifacts selected. Use an ID or --all.');
    const results = [];
    for (const manifest of selected) {
      results.push(await buildArtifact(manifest, {
        rootDir,
        outDir: options.out,
        libraryOutDir: options['library-out'],
        allowCompile: options['allow-compile'],
      }));
    }
    console.log(`Built ${results.length} artifact(s): ${results.map((entry) => `${entry.manifest.id}@${entry.version}`).join(', ')}`);
    return;
  }
  if (command === 'catalog') {
    const receiptRoot = options['receipt-root'] || join(rootDir, 'dist/artifacts');
    const builds = await loadReceiptBuilds(manifests, receiptRoot);
    const gitMetadata = await collectGitMetadata(manifests, { rootDir });
    const catalog = generateCatalog(manifests, builds, {
      gitMetadata,
      portfolioVersion: await portfolioVersion(rootDir),
    });
    const out = options.out || join(rootDir, 'registry/generated/catalog.json');
    await writeCatalog(catalog, out);
    console.log(`Catalog: ${catalog.summary.total} entries, ${catalog.summary.verified} verified -> ${out}`);
    return;
  }
  if (command === 'site') {
    const result = await assembleSite(manifests, { rootDir, outDir: options.out, allowCompile: options['allow-compile'] });
    console.log(`Site: ${result.catalog.summary.total} catalog entries, ${result.builds.length} verified builds -> ${result.outDir}`);
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
