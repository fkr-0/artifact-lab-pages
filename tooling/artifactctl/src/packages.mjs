import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathExists, readJson, resolveInside } from './core.mjs';

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

export async function resolveLibrary(library, options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const descriptorPath = resolveInside(rootDir, `packages/${library.name}/package.release.json`, 'library descriptor');
  if (!(await pathExists(descriptorPath))) throw new Error(`Library descriptor missing: ${library.name}`);
  const descriptor = await readJson(descriptorPath);
  if (descriptor.name !== library.name || descriptor.version !== library.version) {
    throw new Error(`Library version mismatch for ${library.name}: requested ${library.version}, found ${descriptor.version}`);
  }
  return { descriptor, descriptorPath, packageRoot: dirname(descriptorPath) };
}

export async function buildLibraryRelease(library, options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const outDir = resolve(options.outDir || join(rootDir, 'dist/libraries'));
  const { descriptor, packageRoot } = await resolveLibrary(library, { rootDir });
  const releaseRoot = join(outDir, descriptor.name, descriptor.version);
  await rm(releaseRoot, { recursive: true, force: true });
  await mkdir(releaseRoot, { recursive: true });
  const files = [];
  for (const file of descriptor.files || []) {
    const source = resolveInside(packageRoot, file, `library ${descriptor.name} file`);
    const target = resolveInside(releaseRoot, file, `library ${descriptor.name} target`);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { force: true });
    files.push({ path: file, sha256: await sha256(target) });
  }
  const receipt = {
    schemaVersion: 'artifacts.fkr.dev/library-receipt-v1',
    name: descriptor.name,
    version: descriptor.version,
    generatedAt: new Date().toISOString(),
    source: relative(rootDir, packageRoot),
    files,
  };
  await writeFile(join(releaseRoot, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  return { releaseRoot, descriptor, receipt };
}

export async function deliverLibraries(manifest, stageRoot, options = {}) {
  const delivered = [];
  for (const library of manifest.libraries || []) {
    if (library.delivery === 'bundle') {
      delivered.push({ ...library, state: 'project-bundled' });
      continue;
    }
    const built = await buildLibraryRelease(library, options);
    if (library.delivery === 'vendor') {
      const target = resolveInside(stageRoot, library.target || `vendor/${library.name}`, `library target ${library.name}`);
      await mkdir(target, { recursive: true });
      for (const file of built.descriptor.files || []) {
        const source = resolveInside(built.releaseRoot, file, `library source ${library.name}`);
        const destination = resolveInside(target, file, `library target file ${library.name}`);
        await mkdir(dirname(destination), { recursive: true });
        await cp(source, destination, { force: true });
      }
      await writeFile(join(target, 'receipt.json'), `${JSON.stringify(built.receipt, null, 2)}\n`);
      delivered.push({ ...library, state: 'vendored', files: built.receipt.files });
      continue;
    }
    if (library.delivery === 'inline') {
      const entrypoint = manifest.release.entrypoint || basename(manifest.source.path || 'index.html');
      const htmlPath = resolveInside(stageRoot, entrypoint, 'inline library entrypoint');
      let html = await readFile(htmlPath, 'utf8');
      for (const file of built.descriptor.files || []) {
        const content = await readFile(resolveInside(built.releaseRoot, file), 'utf8');
        if (file.endsWith('.css')) html = html.replace('</head>', `<style data-artifact-library="${library.name}@${library.version}">\n${content}\n</style>\n</head>`);
        else if (file.endsWith('.js') || file.endsWith('.mjs')) html = html.replace('</body>', `<script type="module" data-artifact-library="${library.name}@${library.version}">\n${content.replaceAll('</script>', '<\\/script>')}\n</script>\n</body>`);
        else throw new Error(`Inline delivery supports CSS/JS only: ${file}`);
      }
      await writeFile(htmlPath, html);
      delivered.push({ ...library, state: 'inlined', files: built.receipt.files });
    }
  }
  return delivered;
}
