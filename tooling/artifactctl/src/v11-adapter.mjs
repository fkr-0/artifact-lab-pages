import { readFile } from 'node:fs/promises';
import { basename, posix, resolve } from 'node:path';
import { readJson } from './core.mjs';

function cleanHref(value = '') {
  return String(value).split('#', 1)[0].split('?', 1)[0];
}

function hubRelativePath(value) {
  return posix.normalize(posix.join('app-hub-v11', cleanHref(value)));
}

function parseSubmodulePaths(text) {
  const paths = new Set();
  for (const match of text.matchAll(/^\s*path\s*=\s*(.+)$/gm)) paths.add(match[1].trim());
  return paths;
}

function launchFor(item, kind) {
  const original = item.launch || {};
  const modes = Array.isArray(original.modes) ? [...original.modes] : [];
  if (kind === 'link') return { default: 'newWindow', modes: ['newWindow'], sandbox: 'none' };
  if (kind === 'text') return { default: 'none', modes: ['none'], sandbox: 'none' };
  return {
    default: original.defaultAction || modes[0] || 'inline',
    modes: modes.length ? modes : ['inline', 'newWindow'],
    sandbox: 'strict',
  };
}

function productKind(item, sourcePath) {
  if (item.kind === 'external-link') return 'link';
  if (item.kind === 'info' && (item.rawHref || /\.md$/i.test(sourcePath || ''))) return 'document';
  if (item.kind === 'info' && !item.href) return 'text';
  if (/legacy-tools\.html|app-hub\/v\d|portal\.html/i.test(sourcePath || '') || /\blegacy\b/.test((item.tags || []).join(' '))) return 'legacy';
  if ((item.tags || []).includes('download') || /\.(apk|zip|tgz|tar\.gz)$/i.test(sourcePath || '')) return 'download';
  return 'application';
}

function classifyLocalSource(item, submodules) {
  if (item.deploy?.build) {
    const path = item.deploy.build.cwd;
    return {
      source: { kind: 'project', path, git: { mode: submodules.has(path) ? 'submodule' : 'root' } },
      build: {
        mode: 'compile',
        cwd: path,
        output: item.deploy.build.dist,
        provisionalShellCommand: item.deploy.build.command,
      },
      release: {
        kind: 'directory',
        entrypoint: basename(cleanHref(item.href || 'index.html')),
        path: item.deploy.build.dist,
        offline: false,
      },
    };
  }

  const rawPath = item.rawHref ? hubRelativePath(item.rawHref) : hubRelativePath(item.href || item.source || '');
  const sourcePath = rawPath.replace(/^\.\//, '');
  if (/\.md$/i.test(sourcePath)) {
    return {
      source: { kind: 'file', path: sourcePath, git: { mode: 'root' } },
      build: { mode: 'assemble', renderer: 'markdown-html' },
      release: { kind: 'file', entrypoint: 'index.html', offline: true },
    };
  }
  const explicitPath = item.deploy?.includePath;
  if (explicitPath) {
    const fileLike = /\.[a-z0-9]+$/i.test(explicitPath);
    return {
      source: fileLike
        ? { kind: 'file', path: explicitPath, git: { mode: 'root' } }
        : { kind: 'directory', path: explicitPath, entrypoint: basename(cleanHref(item.href || 'index.html')), git: { mode: 'root' } },
      build: { mode: 'none' },
      release: { kind: item.tags?.includes('download') ? 'download' : fileLike ? 'file' : 'directory', entrypoint: basename(cleanHref(item.href || explicitPath)), offline: false },
    };
  }
  const segments = sourcePath.split('/').filter(Boolean);
  if (segments.length === 1) {
    return {
      source: { kind: 'file', path: sourcePath, git: { mode: 'root' } },
      build: { mode: 'none' },
      release: { kind: 'file', entrypoint: basename(sourcePath), offline: false },
    };
  }
  const root = segments[0];
  const entrypoint = segments.slice(1).join('/');
  const isSubmodule = submodules.has(root);
  return {
    source: { kind: isSubmodule ? 'project' : 'directory', path: root, entrypoint, git: { mode: isSubmodule ? 'submodule' : 'root' } },
    build: { mode: 'none' },
    release: { kind: 'directory', entrypoint, offline: false },
  };
}

export async function adaptV11Catalog(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const sourcePath = resolve(rootDir, options.sourcePath || 'app-hub-v11/artifacts.source.json');
  const source = await readJson(sourcePath);
  let gitmodules = '';
  try { gitmodules = await readFile(resolve(rootDir, '.gitmodules'), 'utf8'); } catch {}
  const submodules = parseSubmodulePaths(gitmodules);
  return (source.items || []).map((item) => {
    if (item.kind === 'external-link') {
      const manifest = {
        schemaVersion: 'artifacts.fkr.dev/v1',
        id: item.id,
        title: item.title,
        description: item.description || item.note || '',
        kind: 'link',
        status: 'provisional',
        required: false,
        tags: item.tags || [],
        source: { kind: 'external', url: item.href, git: { mode: 'none' } },
        build: { mode: 'external' },
        release: { kind: 'external', url: item.href },
        launch: launchFor(item, 'link'),
        legacy: { adapter: 'app-hub-v11', href: item.href, changedAt: item.changedAt, modifiedAt: item.modifiedAt },
      };
      return manifest;
    }
    if (item.kind === 'info' && !item.href) {
      return {
        schemaVersion: 'artifacts.fkr.dev/v1',
        id: item.id,
        title: item.title,
        description: item.description || '',
        kind: 'text',
        status: 'provisional',
        required: false,
        tags: item.tags || [],
        source: { kind: 'inline', text: item.note || item.description || item.title, format: 'plain', git: { mode: 'none' } },
        build: { mode: 'none' },
        release: { kind: 'inline' },
        launch: launchFor(item, 'text'),
        legacy: { adapter: 'app-hub-v11', changedAt: item.changedAt, modifiedAt: item.modifiedAt },
      };
    }
    const classification = classifyLocalSource(item, submodules);
    const pathForKind = classification.source.path || item.href;
    const kind = productKind(item, pathForKind);
    return {
      schemaVersion: 'artifacts.fkr.dev/v1',
      id: item.id,
      title: item.title,
      description: item.description || item.note || '',
      kind,
      status: 'provisional',
      required: false,
      tags: item.tags || [],
      ...classification,
      launch: launchFor(item, kind),
      verify: { static: true, standaloneSmoke: kind !== 'legacy' },
      legacy: {
        adapter: 'app-hub-v11',
        href: item.href,
        rawHref: item.rawHref,
        operations: item.operations || [],
        changedAt: item.changedAt,
        modifiedAt: item.modifiedAt,
      },
    };
  });
}
