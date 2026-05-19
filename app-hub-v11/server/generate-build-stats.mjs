#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../..');

async function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function getGitCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown commit';
  }
}

async function getBuildDate() {
  return new Date().toISOString();
}

async function getArtifactCount(sourcePath) {
  try {
    const source = JSON.parse(await readFile(sourcePath, 'utf8'));
    return source.items?.length || 0;
  } catch {
    return 0;
  }
}

async function generateBuildStats(options = {}) {
  const sourcePath = options.sourcePath || process.env.SOURCE_PATH || join(rootDir, 'app-hub-v11', 'artifacts.source.json');
  const outputPath = options.outputPath || process.env.OUTPUT_PATH || join(rootDir, 'app-hub-v11', 'data', 'build-stats.json');

  const [commitHash, commitMessage, buildDate, artifactCount] = await Promise.all([
    getGitCommitHash(),
    getGitCommitMessage(),
    getBuildDate(),
    getArtifactCount(sourcePath),
  ]);

  const buildStats = {
    commitHash,
    commitMessage,
    buildDate,
    artifactCount,
    builtAt: new Date().toISOString(),
  };

  await writeFile(outputPath, JSON.stringify(buildStats, null, 2));

  console.log(`Build stats generated: ${JSON.stringify(buildStats)}`);
  return buildStats;
}

// Parse command line arguments
function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--source') parsed.sourcePath = args[++i];
    else if (arg === '--out') parsed.outputPath = args[++i];
  }
  return parsed;
}

// Check if this file is being run directly
const isMain = process.argv[1] && process.argv[1].endsWith('generate-build-stats.mjs');
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  await generateBuildStats(args);
}

export { generateBuildStats };
