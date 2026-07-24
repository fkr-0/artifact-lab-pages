#!/usr/bin/env node

/**
 * Git-based Artifact Ordering Build Script
 *
 * Uses git commit history as the automatic source of truth for artifact
 * freshness. Filesystem mtimes are intentionally NOT used: generated files,
 * local rebuilds, and CI materialization would otherwise make everything look
 * like it changed "today".
 *
 * Usage:
 *   node build-artifacts-order.js
 *   node build-artifacts-order.js --source .artifacts.source.ci.json --out .artifacts.source.ci.json
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ARTIFACTS_SOURCE = path.join(__dirname, 'artifacts.source.json');
const REPO_ROOT = path.resolve(__dirname, '..');

function gitLastCommitTimestamp(paths) {
  const candidates = unique((Array.isArray(paths) ? paths : [paths]).filter(Boolean));
  for (const filePath of candidates) {
    try {
      const output = execFileSync(
        'git',
        ['log', '-1', '--format=%ct', '--', filePath],
        { encoding: 'utf8', cwd: REPO_ROOT }
      ).trim();
      const timestamp = Number.parseInt(output, 10);
      if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;
    } catch {
      // Try next candidate. No filesystem fallback by design.
    }
  }
  return 0;
}

/**
 * Backwards-compatible export used by tests/importers.
 * @param {string|string[]} filePath
 * @returns {number} Unix timestamp from git commit history, or 0.
 */
function getGitLastModified(filePath) {
  return gitLastCommitTimestamp(filePath);
}

function cleanRelativeHref(value) {
  if (!value || /^https?:\/\//.test(value) || value.startsWith('#')) return null;
  const clean = String(value).split(/[?#]/)[0];
  if (!clean) return null;
  if (clean.startsWith('../')) return clean.slice(3);
  if (clean.startsWith('./')) return path.join('app-hub-v11', clean.slice(2));
  return path.join('app-hub-v11', clean);
}

function topLevelPath(filePath) {
  if (!filePath) return null;
  const parts = path.normalize(filePath).split(path.sep).filter(Boolean);
  return parts[0] || null;
}

function artifactGitPathCandidates(artifact) {
  const candidates = [];

  if (artifact.deploy?.build?.cwd) candidates.push(artifact.deploy.build.cwd);
  if (artifact.deploy?.includePath) candidates.push(artifact.deploy.includePath);
  if (artifact.source) candidates.push(cleanRelativeHref(artifact.source) || artifact.source);

  const hrefPath = cleanRelativeHref(artifact.href || artifact.hubHref || artifact.id);
  if (hrefPath) {
    candidates.push(hrefPath);
    const top = topLevelPath(hrefPath);
    if (top && !hrefPath.startsWith('app-hub-v11/')) candidates.push(top);
  }

  return unique(candidates.map((candidate) => path.normalize(candidate).replaceAll('\\', '/')));
}

/**
 * Extract primary artifact path from artifact metadata.
 * @param {object} artifact
 * @returns {string|null}
 */
function getArtifactPath(artifact) {
  return artifactGitPathCandidates(artifact)[0] || null;
}

function manualTimestamp(artifact) {
  const raw = artifact.changedAt || artifact.modifiedAt || artifact.updatedAt || artifact.lastChanged || artifact.generatedAt || artifact.createdAt || '';
  const parsed = raw ? Date.parse(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoOrNull(timestampMs) {
  return timestampMs ? new Date(timestampMs).toISOString() : null;
}

function buildArtifactsOrder(options = {}) {
  const sourcePath = path.resolve(options.sourcePath || DEFAULT_ARTIFACTS_SOURCE);
  const outputPath = path.resolve(options.outputPath || sourcePath);
  console.log('🔨 Building git-based artifact order for v11...');

  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  const artifacts = sourceData.items || sourceData.artifacts || [];

  console.log(`📦 Processing ${artifacts.length} artifacts...`);

  const enrichedArtifacts = artifacts.map((artifact) => {
    const gitPaths = artifactGitPathCandidates(artifact);
    const gitTimestampSeconds = gitLastCommitTimestamp(gitPaths);
    const gitTimestampMs = gitTimestampSeconds * 1000;
    const fallbackTimestampMs = manualTimestamp(artifact);
    const sortTimestampMs = gitTimestampMs || fallbackTimestampMs;
    const changedAt = gitTimestampMs ? isoOrNull(gitTimestampMs) : (artifact.changedAt || artifact.modifiedAt || artifact.updatedAt || artifact.lastChanged || null);

    return {
      ...artifact,
      _gitPath: gitPaths[0] || null,
      _gitPaths: gitPaths,
      _gitTimestamp: gitTimestampSeconds,
      _sortTimestamp: sortTimestampMs,
      changedAt,
      modifiedAt: changedAt,
    };
  });

  const sortedArtifacts = enrichedArtifacts.sort((a, b) => {
    return b._sortTimestamp - a._sortTimestamp || String(a.title || a.id).localeCompare(String(b.title || b.id));
  });

  console.log('\n📊 Artifact order by git commit time:');
  sortedArtifacts.forEach((artifact, index) => {
    const date = artifact._gitTimestamp
      ? new Date(artifact._gitTimestamp * 1000).toISOString().split('T')[0]
      : 'manual/unknown';
    console.log(`  ${index + 1}. ${artifact.title} (${date})`);
  });

  const outputData = {
    ...sourceData,
    items: sortedArtifacts.map(({
      _gitPath,
      _gitPaths,
      _gitTimestamp,
      _sortTimestamp,
      ...cleanArtifact
    }) => cleanArtifact),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(outputData, null, 2)}\n`);
  console.log(`\n✅ Ordered ${outputPath} with ${sortedArtifacts.length} artifacts`);

  return outputData;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--source') parsed.sourcePath = args[++i];
    else if (arg === '--out') parsed.outputPath = args[++i];
  }
  return parsed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    buildArtifactsOrder(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

export { buildArtifactsOrder, getGitLastModified, getArtifactPath, artifactGitPathCandidates };
