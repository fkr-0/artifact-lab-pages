import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { buildArtifact } from './build.mjs';
import { collectGitMetadata, generateCatalog, writeCatalog } from './catalog.mjs';

export async function assembleSite(manifests, options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const outDir = resolve(options.outDir || join(rootDir, 'dist/site'));
  const artifactOutDir = resolve(options.artifactOutDir || join(outDir, 'artifacts'));
  const libraryOutDir = resolve(options.libraryOutDir || join(outDir, 'libraries'));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const buildable = manifests.filter((manifest) =>
    manifest.status !== 'provisional'
    && !['link', 'text'].includes(manifest.kind)
    && (manifest.build?.mode !== 'compile' || options.allowCompile === true));
  const builds = [];
  for (const manifest of buildable) {
    builds.push(await buildArtifact(manifest, {
      rootDir,
      outDir: artifactOutDir,
      libraryOutDir,
      allowCompile: options.allowCompile === true,
    }));
  }

  const hub = builds.find((entry) => entry.manifest.id === 'app-hub-v13');
  if (!hub) throw new Error('app-hub-v13 manifest/build is required for site assembly');
  await cp(hub.stageRoot, join(outDir, 'hub/v13'), { recursive: true, force: true });
  for (const build of builds) {
    const destination = resolve(join(outDir, 'artifacts', build.manifest.id, build.version));
    if (resolve(build.stageRoot) !== destination) {
      await cp(build.stageRoot, destination, { recursive: true, force: true });
    }
  }

  const gitMetadata = await collectGitMetadata(manifests, { rootDir });
  let portfolioVersion = null;
  try {
    portfolioVersion = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8')).version || null;
  } catch {}
  const catalog = generateCatalog(manifests, builds, { gitMetadata, portfolioVersion });
  await writeCatalog(catalog, join(outDir, 'catalog/catalog.json'));
  await writeFile(join(outDir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=hub/v13/index.html"><title>Artifacts Hub V13</title><script>location.replace('hub/v13/index.html')</script></head><body><a href="hub/v13/index.html">Open Artifacts Hub V13</a></body></html>\n`);
  const manifest = {
    schemaVersion: 'artifacts.fkr.dev/site-receipt-v1',
    generatedAt: new Date().toISOString(),
    root: relative(rootDir, outDir).startsWith('..') ? '<external-stage>' : (relative(rootDir, outDir) || '.'),
    catalog: catalog.summary,
    builds: builds.map((entry) => ({ id: entry.manifest.id, version: entry.version, files: entry.receipt.files.length })),
  };
  await writeFile(join(outDir, 'BUILD_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { outDir, catalog, builds, manifest };
}
