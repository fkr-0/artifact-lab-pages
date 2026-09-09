import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { deliverLibraries } from './packages.mjs';
import { renderMarkdownDocument } from './markdown.mjs';
import { pathExists, resolveInside, validateManifest } from './core.mjs';

const execFileAsync = promisify(execFile);
const EXCLUDED_NAMES = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.cache', '.vite', 'test-results', 'playwright-report']);

function excludedByPattern(relativePath, patterns = []) {
  const normalized = relativePath.replaceAll('\\', '/');
  return patterns.some((pattern) => {
    const value = String(pattern).replaceAll('\\', '/');
    if (value.endsWith('/**')) return normalized === value.slice(0, -3) || normalized.startsWith(value.slice(0, -2));
    if (!value.includes('*')) return normalized === value;
    const expression = new RegExp(`^${value.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
    return expression.test(normalized);
  });
}

async function copyTree(source, target, exclude = []) {
  await cp(source, target, {
    recursive: true,
    force: true,
    filter: (path) => {
      const rel = relative(source, path).replaceAll('\\', '/');
      if (!rel) return true;
      if (EXCLUDED_NAMES.has(basename(path))) return false;
      return !excludedByPattern(rel, exclude);
    },
  });
}

async function listFiles(root, current = root, files = []) {
  if (!(await pathExists(current))) return files;
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) await listFiles(root, path, files);
    else if (entry.isFile()) files.push(relative(root, path).replaceAll('\\', '/'));
  }
  return files;
}

async function hashFiles(root) {
  const result = [];
  for (const file of (await listFiles(root)).sort()) {
    if (file === '.artifact-receipt.json') continue;
    const bytes = await readFile(join(root, file));
    result.push({ path: file, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return result;
}

function stageVersion(manifest) {
  return manifest.version || (manifest.status === 'provisional' ? 'provisional' : '0.0.0-dev');
}

async function runCompile(manifest, rootDir) {
  if (!Array.isArray(manifest.build.command) || !manifest.build.command.length) throw new Error(`${manifest.id}: compile command is unavailable`);
  const cwd = resolveInside(rootDir, manifest.build.cwd || manifest.source.path, 'build.cwd');
  const [command, ...args] = manifest.build.command;
  await execFileAsync(command, args, { cwd, stdio: 'inherit', maxBuffer: 32 * 1024 * 1024 });
}

async function materializeSource(manifest, rootDir, stageRoot, options) {
  if (manifest.kind === 'link' || manifest.kind === 'text') return;
  const sourcePath = resolveInside(rootDir, manifest.source.path, 'source.path');
  if (manifest.build.mode === 'compile') {
    if (!options.allowCompile) throw new Error(`${manifest.id}: compile build blocked; pass --allow-compile explicitly`);
    await runCompile(manifest, rootDir);
    const output = manifest.build.output || manifest.release.path;
    if (!output) throw new Error(`${manifest.id}: compile build requires build.output or release.path`);
    const builtPath = resolveInside(sourcePath, output, 'build.output');
    const builtStat = await stat(builtPath);
    if (builtStat.isDirectory()) await copyTree(builtPath, stageRoot, manifest.release.exclude);
    else await cp(builtPath, resolveInside(stageRoot, manifest.release.entrypoint || basename(builtPath)), { force: true });
    return;
  }
  if (manifest.build.mode === 'assemble' && manifest.build.renderer === 'markdown-html') {
    const html = renderMarkdownDocument(await readFile(sourcePath, 'utf8'), { title: manifest.title });
    await writeFile(resolveInside(stageRoot, manifest.release.entrypoint || 'index.html'), html);
    return;
  }

  if (manifest.source.kind === 'file') {
    const target = resolveInside(stageRoot, manifest.release.entrypoint || basename(sourcePath), 'release.entrypoint');
    await mkdir(dirname(target), { recursive: true });
    await cp(sourcePath, target, { force: true });
    return;
  }
  const selected = manifest.release.path ? resolveInside(sourcePath, manifest.release.path, 'release.path') : sourcePath;
  await copyTree(selected, stageRoot, manifest.release.exclude);
}

export async function verifyStage(manifest, stageRoot) {
  const errors = [];
  const expected = new Set(manifest.verify?.expectedFiles || []);
  if (manifest.release.entrypoint) expected.add(manifest.release.entrypoint);
  for (const file of expected) if (!(await pathExists(resolveInside(stageRoot, file, 'expected file')))) errors.push(`Missing expected release file: ${file}`);
  for (const file of await listFiles(stageRoot)) {
    if (!/\.(html?|css|js|mjs)$/i.test(file)) continue;
    const content = await readFile(join(stageRoot, file), 'utf8');
    for (const match of content.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
      const value = match[1];
      if (value.startsWith('../')) errors.push(`${file} contains release-escaping reference: ${value}`);
      if (/app-hub-v1[12]\/lib\//.test(value)) errors.push(`${file} imports a hub-owned library: ${value}`);
    }
    if (/\.(?:js|mjs)$/i.test(file)) {
      for (const match of content.matchAll(/(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']/g)) {
        const value = match[1];
        if (value.startsWith('../')) errors.push(`${file} contains release-escaping module import: ${value}`);
        if (/app-hub-v1[12]\/lib\//.test(value)) errors.push(`${file} imports a hub-owned library: ${value}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export async function buildArtifact(manifest, options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const outDir = resolve(options.outDir || join(rootDir, 'dist/artifacts'));
  const validation = await validateManifest(manifest, { rootDir, checkExistence: true });
  if (!validation.ok) throw new Error(`${manifest.id}: manifest invalid: ${validation.errors.map((entry) => entry.message).join('; ')}`);
  const version = stageVersion(manifest);
  const stageRoot = join(outDir, manifest.id, version);
  await rm(stageRoot, { recursive: true, force: true });
  await mkdir(stageRoot, { recursive: true });
  await materializeSource(manifest, rootDir, stageRoot, options);
  const libraries = await deliverLibraries(manifest, stageRoot, { rootDir, outDir: options.libraryOutDir || join(dirname(outDir), 'libraries') });
  const verification = await verifyStage(manifest, stageRoot);
  if (!verification.ok) throw new Error(`${manifest.id}: release verification failed: ${verification.errors.join('; ')}`);
  const files = await hashFiles(stageRoot);
  const receipt = {
    schemaVersion: 'artifacts.fkr.dev/artifact-receipt-v1',
    id: manifest.id,
    version,
    generatedAt: new Date().toISOString(),
    manifestPath: manifest.__manifestPath || null,
    source: manifest.source,
    build: manifest.build,
    release: manifest.release,
    libraries,
    verification,
    files,
  };
  await writeFile(join(stageRoot, '.artifact-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  return { manifest, version, stageRoot, receipt };
}
