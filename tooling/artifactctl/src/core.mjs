import { access, readFile, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export const SCHEMA_VERSION = 'artifacts.fkr.dev/v1';
export const PRODUCT_KINDS = new Set(['application', 'document', 'download', 'link', 'text', 'legacy']);
export const SOURCE_KINDS = new Set(['file', 'directory', 'project', 'external', 'inline']);
export const GIT_MODES = new Set(['root', 'submodule', 'external', 'none']);
export const BUILD_MODES = new Set(['none', 'assemble', 'compile', 'external']);
export const RELEASE_KINDS = new Set(['file', 'directory', 'download', 'external', 'inline']);
export const LAUNCH_MODES = new Set(['inline', 'floating', 'fullscreen', 'newWindow', 'download', 'none']);

export function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value)) return false;
  const normalized = value.replaceAll('\\', '/');
  return !normalized.split('/').some((part) => part === '..') && !normalized.startsWith('/');
}

export function resolveInside(root, child, field = 'path') {
  if (!isSafeRelativePath(child)) throw new Error(`${field} must be a contained relative path: ${child}`);
  const rootPath = resolve(root);
  const target = resolve(rootPath, child);
  const rel = relative(rootPath, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${field} escapes root: ${child}`);
  }
  return target;
}

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function validateManifest(manifest, options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const checkExistence = options.checkExistence !== false;
  const errors = [];
  const warnings = [];
  const addError = (code, message) => errors.push({ code, message });
  const addWarning = (code, message) => warnings.push({ code, message });

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, errors: [{ code: 'manifest.shape', message: 'Manifest must be an object.' }], warnings };
  }
  if (manifest.schemaVersion !== SCHEMA_VERSION) addError('manifest.schema-version', `Expected ${SCHEMA_VERSION}.`);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(manifest.id || '')) addError('manifest.id', 'ID must be a stable lowercase slug.');
  if (typeof manifest.title !== 'string' || !manifest.title.trim()) addError('manifest.title', 'Title is required.');
  if (!PRODUCT_KINDS.has(manifest.kind)) addError('manifest.kind', `Unsupported product kind: ${manifest.kind}`);
  if (!SOURCE_KINDS.has(manifest.source?.kind)) addError('source.kind', `Unsupported source kind: ${manifest.source?.kind}`);
  if (!GIT_MODES.has(manifest.source?.git?.mode)) addError('source.git.mode', `Unsupported Git mode: ${manifest.source?.git?.mode}`);
  if (!BUILD_MODES.has(manifest.build?.mode)) addError('build.mode', `Unsupported build mode: ${manifest.build?.mode}`);
  if (!RELEASE_KINDS.has(manifest.release?.kind)) addError('release.kind', `Unsupported release kind: ${manifest.release?.kind}`);

  for (const [field, value] of [
    ['source.path', manifest.source?.path],
    ['source.entrypoint', manifest.source?.entrypoint],
    ['build.cwd', manifest.build?.cwd],
    ['build.output', manifest.build?.output],
    ['release.path', manifest.release?.path],
    ['release.entrypoint', manifest.release?.entrypoint],
  ]) {
    if (value !== undefined && !isSafeRelativePath(value)) addError('path.containment', `${field} is not a contained relative path: ${value}`);
  }

  if (manifest.kind === 'link') {
    if (manifest.source?.kind !== 'external' || manifest.build?.mode !== 'external' || manifest.release?.kind !== 'external') {
      addError('combination.link', 'Links require external source/build/release contracts.');
    }
    const url = manifest.source?.url || manifest.release?.url;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && !(options.allowHttp && parsed.protocol === 'http:')) {
        addError('link.protocol', 'External links require HTTPS.');
      }
    } catch {
      addError('link.url', 'External link URL is invalid.');
    }
  }

  if (manifest.kind === 'text') {
    if (manifest.source?.kind !== 'inline' || manifest.build?.mode !== 'none' || manifest.release?.kind !== 'inline') {
      addError('combination.text', 'Text items require inline source, no build, and inline release.');
    }
    if (typeof manifest.source?.text !== 'string' || !manifest.source.text.trim()) addError('text.content', 'Inline text content is required.');
    if (/<\s*script\b|on\w+\s*=|javascript:/i.test(manifest.source?.text || '')) addError('text.executable', 'Inline text cannot contain executable HTML.');
  }

  if (manifest.source?.kind === 'external' && manifest.source?.git?.mode !== 'none') {
    addError('source.external-git', 'External links use Git mode none. External project checkouts use source.kind project and Git mode external.');
  }
  if (manifest.source?.kind === 'inline' && manifest.source?.git?.mode !== 'none') addError('source.inline-git', 'Inline text uses Git mode none.');
  if (['file', 'directory'].includes(manifest.source?.kind) && manifest.source?.git?.mode !== 'root') {
    addError('source.root-ownership', 'File and directory sources are root-owned; use project for submodule/external ownership.');
  }
  if (manifest.source?.kind === 'project' && !['root', 'submodule', 'external'].includes(manifest.source?.git?.mode)) {
    addError('source.project-git', 'Project sources require root, submodule, or external Git ownership.');
  }

  if (manifest.build?.mode === 'compile') {
    if (!Array.isArray(manifest.build.command) || manifest.build.command.length === 0) {
      if (manifest.status === 'provisional' && manifest.build.provisionalShellCommand) {
        addWarning('build.provisional-shell', 'Provisional V11 shell command must be converted to argv before activation.');
      } else {
        addError('build.command', 'Compile builds require a non-empty argv command array.');
      }
    }
  } else if (manifest.build?.command) {
    addError('build.unexpected-command', 'Only compile builds may declare a command.');
  }
  if (manifest.build?.mode === 'assemble' && !manifest.build.renderer) addError('build.renderer', 'Assembly builds require a renderer.');
  if (manifest.build?.renderer === 'markdown-html' && manifest.kind !== 'document') addError('build.markdown-product', 'markdown-html is only valid for document artifacts.');

  const modes = manifest.launch?.modes || [];
  for (const mode of modes) if (!LAUNCH_MODES.has(mode)) addError('launch.mode', `Unsupported launch mode: ${mode}`);
  if (manifest.launch?.default && modes.length && !modes.includes(manifest.launch.default)) addError('launch.default', 'Default launch mode must appear in launch.modes.');
  if (['link', 'text'].includes(manifest.kind) && modes.some((mode) => ['inline', 'floating', 'fullscreen'].includes(mode))) {
    addWarning('launch.catalog-only', `${manifest.kind} items should not claim application panel modes.`);
  }

  for (const library of manifest.libraries || []) {
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(library.name || '')) addError('library.name', `Invalid library name: ${library.name}`);
    if (!library.version) addError('library.version', `Library ${library.name || '(unknown)'} requires a version.`);
    if (!['inline', 'vendor', 'bundle'].includes(library.delivery)) addError('library.delivery', `Invalid delivery mode for ${library.name}.`);
    if (library.target !== undefined && !isSafeRelativePath(library.target)) addError('library.target', `Library target escapes release root: ${library.target}`);
    if (library.delivery === 'inline' && manifest.release?.kind !== 'file') addError('library.inline-release', 'Inline libraries require a file release.');
    if (library.delivery === 'bundle' && manifest.build?.mode !== 'compile') addError('library.bundle-build', 'Bundle delivery requires a compile build.');
  }

  if (checkExistence && ['file', 'directory', 'project'].includes(manifest.source?.kind) && manifest.source?.path && isSafeRelativePath(manifest.source.path)) {
    const sourcePath = resolveInside(rootDir, manifest.source.path, 'source.path');
    if (!(await pathExists(sourcePath))) {
      const severity = manifest.required === false || manifest.status === 'provisional' ? addWarning : addError;
      severity('source.missing', `Source path does not exist: ${manifest.source.path}`);
    } else {
      const sourceStat = await stat(sourcePath);
      if (manifest.source.kind === 'file' && !sourceStat.isFile()) addError('source.not-file', `${manifest.source.path} is not a file.`);
      if (['directory', 'project'].includes(manifest.source.kind) && !sourceStat.isDirectory()) addError('source.not-directory', `${manifest.source.path} is not a directory.`);
      if (manifest.source.entrypoint) {
        const entryRoot = manifest.source.kind === 'file' ? rootDir : sourcePath;
        const entryPath = resolveInside(entryRoot, manifest.source.entrypoint, 'source.entrypoint');
        if (!(await pathExists(entryPath))) addError('source.entrypoint-missing', `Source entrypoint does not exist: ${manifest.source.entrypoint}`);
      }
    }
  }

  if (manifest.status === 'active' && warnings.some((entry) => entry.code.startsWith('build.provisional'))) {
    addError('status.provisional-build', 'An active artifact cannot retain provisional build metadata.');
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateUniqueIds(manifests) {
  const seen = new Map();
  const errors = [];
  for (const manifest of manifests) {
    if (seen.has(manifest.id)) errors.push({ code: 'manifest.duplicate-id', message: `Duplicate artifact ID: ${manifest.id}`, paths: [seen.get(manifest.id), manifest.__manifestPath].filter(Boolean) });
    else seen.set(manifest.id, manifest.__manifestPath || '(adapter)');
  }
  return errors;
}
