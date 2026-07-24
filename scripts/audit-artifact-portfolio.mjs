#!/usr/bin/env node

import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const INDEPENDENT_PROJECT_ROOTS = new Set([
  'badger-sprawl-runner',
  'bathroom-disaster',
  'bathroom-emergency-guide',
  'ethic-brawl',
  'git-recipe-book',
  'hyperblast-shooter',
  'inf-arrange',
  'v11-peer-daw',
]);

const ALLOWED_KINDS = new Set(['html-path', 'external-link', 'info']);
const ALLOWED_LAUNCH_MODES = new Set(['inline', 'floating', 'fullscreen', 'newWindow']);
const PLACEHOLDER_HOSTS = new Set(['example.com', 'www.example.com', 'example.org', 'www.example.org']);

function issue(severity, code, message, context = {}) {
  return { severity, code, message, ...context };
}

function normalizedLocalHref(href = '') {
  return String(href).split('#', 1)[0].split('?', 1)[0].trim();
}

function isExternalHref(href = '') {
  return /^https?:\/\//i.test(String(href));
}

function firstPathSegment(rootDir, targetPath) {
  const rel = relative(rootDir, targetPath);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..') return '';
  return rel.split(sep)[0];
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function inspectHtml(html, artifact, relativePath) {
  const issues = [];
  const context = { artifactId: artifact.id, path: relativePath };
  const staticHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  if (!/^\s*<!doctype html>/i.test(html)) {
    issues.push(issue('error', 'html.doctype', 'Document is missing an HTML5 doctype.', context));
  }
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
    issues.push(issue('error', 'html.language', 'Document is missing a non-empty html[lang] declaration.', context));
  }
  if (!/<meta\b[^>]*\bname=["']viewport["'][^>]*>/i.test(html)) {
    issues.push(issue('error', 'html.viewport', 'Document is missing a viewport meta tag.', context));
  }
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    issues.push(issue('error', 'html.title', 'Document is missing a non-empty title.', context));
  }

  const ids = [...staticHtml.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((id) => !/[${}]/.test(id));
  for (const id of duplicateValues(ids)) {
    issues.push(issue('error', 'html.duplicate-id', `Duplicate DOM id: ${id}`, { ...context, domId: id }));
  }

  if (!/<main\b|\brole=["']main["']/i.test(staticHtml)) {
    issues.push(issue('warning', 'a11y.main-landmark', 'Document has no main landmark.', context));
  }
  if (/(?:animation\s*:|@keyframes|transition\s*:)/i.test(html) && !/prefers-reduced-motion/i.test(html)) {
    issues.push(issue('warning', 'a11y.reduced-motion', 'Animated UI has no prefers-reduced-motion fallback.', context));
  }

  const unsafeBlankTargets = [...staticHtml.matchAll(/<a\b(?=[^>]*\btarget=["']_blank["'])(?![^>]*\brel=["'][^"']*(?:noopener|noreferrer))[^>]*>/gi)];
  if (unsafeBlankTargets.length > 0) {
    issues.push(issue('warning', 'security.blank-target', `${unsafeBlankTargets.length} target=_blank link(s) lack rel=noopener or noreferrer.`, context));
  }

  const inlineHandlers = [...staticHtml.matchAll(/\son[a-z][a-z0-9_-]*\s*=/gi)].length;
  if (inlineHandlers > 0) {
    issues.push(issue('warning', 'architecture.inline-handlers', `${inlineHandlers} inline event handler(s) impede CSP hardening and modular testing.`, context));
  }

  return issues;
}

export async function auditArtifactPortfolio(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const sourcePath = resolve(rootDir, options.sourcePath || 'app-hub-v11/artifacts.source.json');
  const source = JSON.parse(await readFile(sourcePath, 'utf8'));
  const items = Array.isArray(source.items) ? source.items : [];
  const issues = [];
  const inspected = [];
  const skippedIndependent = [];

  if (!source.collection?.id || !source.collection?.title) {
    issues.push(issue('error', 'catalog.collection', 'Catalog collection requires id and title.', { path: relative(rootDir, sourcePath) }));
  }

  const duplicateIds = duplicateValues(items.map((item) => item?.id).filter(Boolean));
  for (const id of duplicateIds) {
    issues.push(issue('error', 'catalog.duplicate-id', `Duplicate artifact id: ${id}`, { artifactId: id }));
  }

  for (const item of items) {
    const context = { artifactId: item?.id || '(missing-id)' };
    if (!item?.id || !item?.title) {
      issues.push(issue('error', 'catalog.identity', 'Artifact requires id and title.', context));
      continue;
    }
    if (!ALLOWED_KINDS.has(item.kind)) {
      issues.push(issue('error', 'catalog.kind', `Unsupported artifact kind: ${item.kind}`, context));
    }
    if (!Array.isArray(item.tags) || item.tags.length === 0) {
      issues.push(issue('warning', 'catalog.tags', 'Artifact has no discoverability tags.', context));
    }

    const modes = item.launch?.modes;
    if (!Array.isArray(modes) || modes.length === 0) {
      issues.push(issue('error', 'catalog.launch-modes', 'Artifact requires at least one launch mode.', context));
    } else {
      for (const mode of modes) {
        if (!ALLOWED_LAUNCH_MODES.has(mode)) {
          issues.push(issue('error', 'catalog.launch-mode', `Unsupported launch mode: ${mode}`, context));
        }
      }
      if (item.launch?.defaultAction && !modes.includes(item.launch.defaultAction)) {
        issues.push(issue('error', 'catalog.default-action', `Default action ${item.launch.defaultAction} is not present in launch.modes.`, context));
      }
    }

    const actions = Array.isArray(item.launch?.actions) ? item.launch.actions : [];
    for (const actionId of duplicateValues(actions.map((action) => action?.id).filter(Boolean))) {
      issues.push(issue('error', 'catalog.duplicate-action', `Duplicate launch action id: ${actionId}`, { ...context, actionId }));
    }
    for (const action of actions) {
      if (!action?.id || !action?.mode) {
        issues.push(issue('error', 'catalog.action-shape', 'Launch actions require id and mode.', context));
      } else if (!modes?.includes(action.mode)) {
        issues.push(issue('error', 'catalog.action-mode', `Action ${action.id} uses undeclared mode ${action.mode}.`, context));
      }
    }

    if (item.kind === 'external-link') {
      try {
        const external = new URL(item.href);
        if (!['http:', 'https:'].includes(external.protocol)) throw new Error('unsupported protocol');
        if (PLACEHOLDER_HOSTS.has(external.hostname)) {
          issues.push(issue('error', 'catalog.placeholder-link', `Placeholder external URL is not a deployable artifact: ${item.href}`, context));
        }
      } catch {
        issues.push(issue('error', 'catalog.external-link', `Invalid external URL: ${item.href || '(missing)'}`, context));
      }
      continue;
    }

    if (!item.href) {
      if (item.kind !== 'info') issues.push(issue('error', 'catalog.href', 'Local artifact requires an href.', context));
      continue;
    }
    if (isExternalHref(item.href) || /^(?:javascript|data):/i.test(item.href)) {
      issues.push(issue('error', 'catalog.local-href', `Local artifact has an unsafe or mismatched href: ${item.href}`, context));
      continue;
    }

    const cleanHref = normalizedLocalHref(item.href);
    const targetUrl = new URL(cleanHref || '.', pathToFileURL(resolve(rootDir, 'app-hub-v11/index.html')));
    const targetPath = fileURLToPath(targetUrl);
    const relPath = relative(rootDir, targetPath);
    const projectRoot = firstPathSegment(rootDir, targetPath);

    if (INDEPENDENT_PROJECT_ROOTS.has(projectRoot)) {
      skippedIndependent.push({ id: item.id, path: relPath, reason: 'independent-project' });
      if (!await pathExists(targetPath)) {
        issues.push(issue('warning', 'integration.built-target', `Independent project launch target is not present until its build/deploy step runs: ${relPath}`, { ...context, path: relPath }));
      }
      continue;
    }

    if (!await pathExists(targetPath)) {
      issues.push(issue('error', 'artifact.missing-target', `Artifact launch target does not exist: ${relPath}`, { ...context, path: relPath }));
      continue;
    }

    if (!/\.html?$/i.test(targetPath)) {
      inspected.push({ id: item.id, path: relPath, kind: 'non-html' });
      continue;
    }

    const html = await readFile(targetPath, 'utf8');
    inspected.push({ id: item.id, path: relPath, kind: 'html' });
    issues.push(...inspectHtml(html, item, relPath));
  }

  const errors = issues.filter((entry) => entry.severity === 'error');
  const warnings = issues.filter((entry) => entry.severity === 'warning');
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: relative(rootDir, sourcePath),
    summary: {
      catalogItems: items.length,
      uniqueArtifactIds: new Set(items.map((item) => item?.id).filter(Boolean)).size,
      inspectedArtifacts: inspected.length,
      skippedIndependentProjects: skippedIndependent.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    inspected,
    skippedIndependent,
    issues,
  };
}

function formatTextReport(report) {
  const lines = [
    'Artifact portfolio audit',
    `catalog: ${report.summary.catalogItems} entries / ${report.summary.uniqueArtifactIds} unique ids`,
    `inspected: ${report.summary.inspectedArtifacts} embedded artifacts`,
    `independent integrations: ${report.summary.skippedIndependentProjects}`,
    `result: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s)`,
  ];
  for (const entry of report.issues) {
    const location = [entry.artifactId, entry.path].filter(Boolean).join(' · ');
    lines.push(`${entry.severity.toUpperCase()} ${entry.code}${location ? ` [${location}]` : ''}: ${entry.message}`);
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const jsonIndex = args.indexOf('--json');
  const jsonPath = jsonIndex >= 0 ? args[jsonIndex + 1] : '';
  const failOnWarning = args.includes('--fail-on-warning');
  const report = await auditArtifactPortfolio();
  process.stdout.write(formatTextReport(report));
  if (jsonPath) {
    await writeFile(resolve(jsonPath), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (report.summary.errors > 0 || (failOnWarning && report.summary.warnings > 0)) {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
