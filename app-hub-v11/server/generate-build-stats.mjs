#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../..');
const execFileAsync = promisify(execFile);

async function git(args, fallback = null) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    const value = String(stdout || '').trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

function normalizeCommit(value) {
  const commit = String(value || '').trim();
  return /^[0-9a-f]{7,40}$/i.test(commit) ? commit : null;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
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

async function getGitDir(baseDir = rootDir) {
  const dotGitPath = join(baseDir, '.git');
  try {
    const dotGit = String(await readFile(dotGitPath, 'utf8')).trim();
    const match = dotGit.match(/^gitdir:\s*(.+)$/i);
    if (match) return resolve(baseDir, match[1].trim());
  } catch {
    // Not a gitfile; fall through to the conventional .git directory.
  }
  return dotGitPath;
}

async function readGitRef(gitDir, refPath) {
  const refFile = join(gitDir, ...refPath.split('/'));
  try {
    return String(await readFile(refFile, 'utf8')).trim();
  } catch {
    // Fall through to packed-refs.
  }
  try {
    const packedRefs = String(await readFile(join(gitDir, 'packed-refs'), 'utf8'));
    for (const line of packedRefs.split('\n')) {
      if (!line || line.startsWith('#') || line.startsWith('^')) continue;
      const [hash, packedRef] = line.trim().split(' ');
      if (packedRef === refPath) return hash;
    }
  } catch {
    // Packed refs are optional.
  }
  return null;
}

async function resolveCommitMetadata(gitDir, commitHash, refPath = null) {
  const objectPath = join(gitDir, 'objects', commitHash.slice(0, 2), commitHash.slice(2));
  try {
    const compressed = await readFile(objectPath);
    const raw = inflateSync(compressed).toString('utf8');
    const nulIndex = raw.indexOf('\0');
    const body = nulIndex >= 0 ? raw.slice(nulIndex + 1) : raw;
    const [headers, message = ''] = body.split('\n\n');
    const committerLine = headers.split('\n').find((line) => line.startsWith('committer '));
    const match = committerLine?.match(/^committer\s+.+\s+(\d+)\s+[+-]\d{4}$/);
    return {
      commitMessage: message.trim() || 'unknown commit',
      commitDate: match ? new Date(Number(match[1]) * 1000).toISOString() : 'unknown',
      branch: refPath ? refPath.replace(/^refs\/heads\//, '') : 'detached',
    };
  } catch {
    return {
      commitMessage: 'unknown commit',
      commitDate: 'unknown',
      branch: refPath ? refPath.replace(/^refs\/heads\//, '') : 'detached',
    };
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
  const requestedCommit = normalizeCommit(options.commitHash || process.env.ARTIFACTS_SOURCE_COMMIT);
  const gitDir = await getGitDir(rootDir);
  const headText = String(await readFile(join(gitDir, 'HEAD'), 'utf8')).trim();
  const refPath = headText.startsWith('ref: ') ? headText.slice(5).trim() : null;
  const filesystemCommit = normalizeCommit(refPath ? await readGitRef(gitDir, refPath) : headText);
  const commitHash = await git(
    ['rev-parse', requestedCommit || 'HEAD'],
    requestedCommit || filesystemCommit || 'unknown'
  );
  const commitShort = await git(['rev-parse', '--short=12', commitHash], commitHash.slice(0, 12));
  const filesystemMetadata = normalizeCommit(commitHash)
    ? await resolveCommitMetadata(gitDir, commitHash, refPath)
    : { commitMessage: 'unknown commit', commitDate: 'unknown', branch: 'detached' };
  const commitMessage = await git(['show', '-s', '--format=%s', commitHash], filesystemMetadata.commitMessage);
  const commitDate = await git(['show', '-s', '--format=%cI', commitHash], filesystemMetadata.commitDate);
  const branch = await git(['branch', '--show-current'], filesystemMetadata.branch);
  const detectedDirty = Boolean(await git(['status', '--porcelain'], ''));
  const dirty = normalizeBoolean(
    options.dirty ?? process.env.ARTIFACTS_SOURCE_DIRTY,
    detectedDirty
  );

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
    else if (arg === '--commit') parsed.commitHash = args[++i];
    else if (arg === '--dirty') parsed.dirty = args[++i];
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
