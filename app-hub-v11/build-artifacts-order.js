#!/usr/bin/env node

/**
 * Git-based Artifact Ordering Build Script
 *
 * This script analyzes git commit history to determine artifact modification times,
 * then updates artifacts.source.json with automatically ordered artifacts based on
 * their last-changed timestamp from git.
 *
 * Usage: node build-artifacts-order.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ARTIFACTS_SOURCE = path.join(__dirname, 'artifacts.source.json');
const DEFAULT_ARTIFACTS_OUTPUT = path.join(__dirname, 'artifacts.json');
const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Get the last modification time for a file from git history
 * Falls back to filesystem mtime for files not in git
 * @param {string} filePath - Relative path to the file
 * @returns {number} Unix timestamp of last modification
 */
function getGitLastModified(filePath) {
  try {
    const output = execSync(
      `git log -1 --format="%ct" -- "${filePath}"`,
      { encoding: 'utf-8', cwd: REPO_ROOT }
    ).trim();
    if (output) {
      return parseInt(output, 10);
    }
  } catch (error) {
    // File not in git history, fall back to filesystem
  }

  // Fallback: use filesystem modification time
  try {
    const fullPath = path.join(REPO_ROOT, filePath);
    const stats = fs.statSync(fullPath);
    return Math.floor(stats.mtimeMs / 1000);
  } catch (error) {
    return 0; // File doesn't exist
  }
}

/**
 * Extract file path from artifact href/id
 * @param {object} artifact - Artifact object from manifest
 * @returns {string} Resolved file path relative to git root
 */
function getArtifactPath(artifact) {
  const href = artifact.href || artifact.id;
  if (!href) return null;

  // Skip external URLs
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return null;
  }

  // Remove query parameters and hash fragments
  const cleanHref = href.split(/[?#]/)[0];

  // Convert href to relative path from git root
  // Handles both "../artifact.html" and "artifact.html" patterns
  if (cleanHref.startsWith('../')) {
    // Remove the "../" to get path from git root
    return cleanHref.substring(3);
  } else if (cleanHref.startsWith('./')) {
    return path.join('app-hub-v11', cleanHref.substring(2));
  } else {
    // Assume it's relative to app-hub-v11
    return path.join('app-hub-v11', cleanHref);
  }
}

/**
 * Main build function
 */
function buildArtifactsOrder(options = {}) {
  const sourcePath = path.resolve(options.sourcePath || DEFAULT_ARTIFACTS_SOURCE);
  const outputPath = path.resolve(options.outputPath || DEFAULT_ARTIFACTS_OUTPUT);
  console.log('🔨 Building git-based artifact order for v11...');

  // Read source manifest
  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  const artifacts = sourceData.items || sourceData.artifacts || [];

  console.log(`📦 Processing ${artifacts.length} artifacts...`);

  // Enrich artifacts with git timestamps
  const enrichedArtifacts = artifacts.map(artifact => {
    const artifactPath = getArtifactPath(artifact);
    const gitTimestamp = artifactPath ? getGitLastModified(artifactPath) : 0;

    return {
      ...artifact,
      _gitPath: artifactPath,
      _gitTimestamp: gitTimestamp,
      changedAt: gitTimestamp ? new Date(gitTimestamp * 1000).toISOString() : (artifact.changedAt || artifact.modifiedAt || artifact.updatedAt || artifact.lastChanged || null),
      modifiedAt: gitTimestamp ? new Date(gitTimestamp * 1000).toISOString() : (artifact.modifiedAt || artifact.updatedAt || artifact.changedAt || artifact.lastChanged || null)
    };
  });

  // Sort by timestamp (newest first), with stable title/id fallback.
  const sortedArtifacts = enrichedArtifacts.sort((a, b) => {
    return b._gitTimestamp - a._gitTimestamp || String(a.title || a.id).localeCompare(String(b.title || b.id));
  });

  // Log artifacts with git timestamps
  console.log('\n📊 Artifact order by git modification time:');
  sortedArtifacts.forEach((artifact, index) => {
    const date = artifact._gitTimestamp
      ? new Date(artifact._gitTimestamp * 1000).toISOString().split('T')[0]
      : 'unknown';
    console.log(`  ${index + 1}. ${artifact.title} (${date})`);
  });

  // Build output manifest
  const outputData = {
    ...sourceData,
    builtAt: new Date().toISOString(),
    buildType: 'git-ordered',
    artifactCount: sortedArtifacts.length,
    items: sortedArtifacts.map(({
      _gitPath,
      _gitTimestamp,
      ...cleanArtifact
    }) => cleanArtifact)
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n✅ Built ${outputPath} with ${sortedArtifacts.length} artifacts`);

  return outputData;
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

// Run build
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    buildArtifactsOrder(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

export { buildArtifactsOrder, getGitLastModified, getArtifactPath };
