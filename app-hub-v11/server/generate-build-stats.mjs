#!/usr/bin/env node
import { execSync } from 'child_process';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../..');

function git(command, fallback = 'unknown') {
  try {
    return execSync(command, { cwd: rootDir, encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

async function getVersion(packagePath) {
  try {
    const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
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
  const packagePath = options.packagePath || process.env.PACKAGE_PATH || join(rootDir, 'package.json');

  const [artifactCount, version] = await Promise.all([
    getArtifactCount(sourcePath),
    getVersion(packagePath),
  ]);
  const builtAt = new Date().toISOString();
  const commitHash = git('git rev-parse HEAD');
  const commitShort = git('git rev-parse --short=12 HEAD');
  const commitMessage = git('git log -1 --pretty=%s', 'unknown commit');
  const commitDate = git('git log -1 --pretty=%cI');
  const branch = git('git branch --show-current', 'detached');
  const dirty = Boolean(git('git status --porcelain', ''));

  const buildStats = {
    schemaVersion: 2,
    version,
    commitHash,
    commitShort,
    commitMessage,
    commitDate,
    branch,
    dirty,
    buildDate: builtAt,
    artifactCount,
    builtAt,
  };

  await mkdir(dirname(outputPath), { recursive: true });
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
    else if (arg === '--package') parsed.packagePath = args[++i];
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
