import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const execFileAsync = promisify(execFile);

async function command(rootDir, executable, args, options = {}) {
  try {
    const result = await execFileAsync(executable, args, {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: options.maxBuffer || 32 * 1024 * 1024,
    });
    return { ok: true, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { ok: false, stdout: error.stdout || '', stderr: error.stderr || error.message, code: error.code };
  }
}

export function parsePorcelainZ(output) {
  return String(output)
    .split('\0')
    .filter(Boolean)
    .map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3) }));
}

export function parseSubmoduleStatus(output) {
  return String(output)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const marker = line[0];
      const match = /^[ +-U]?([0-9a-f]{40})\s+(\S+)(?:\s+\((.+)\))?/.exec(line);
      return match
        ? { path: match[2], commit: match[1], marker, description: match[3] || '', state: marker === ' ' ? 'recorded' : marker === '+' ? 'pointer-drift' : marker === '-' ? 'missing' : marker === 'U' ? 'conflict' : 'unknown' }
        : { raw: line, state: 'unparsed' };
    });
}

export async function inventoryRepository(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const statusResult = await command(rootDir, 'git', ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const submoduleResult = await command(rootDir, 'git', ['submodule', 'status', '--recursive']);
  const gitlinksResult = await command(rootDir, 'git', ['ls-files', '-s']);
  const nestedResult = await command(rootDir, 'find', [
    '.',
    '(', '-path', './.git', '-o', '-path', './node_modules', '-o', '-path', './dist', '-o', '-path', './build', '-o', '-path', './.artifacts-deploy-stage', '-o', '-path', './.artifacts-test-module-fix', ')', '-prune',
    '-o', '-mindepth', '2', '-name', '.git', '-print', '-prune',
  ]);

  const status = statusResult.ok ? parsePorcelainZ(statusResult.stdout) : [];
  const submodules = submoduleResult.ok ? parseSubmoduleStatus(submoduleResult.stdout) : [];
  const gitlinks = gitlinksResult.ok
    ? gitlinksResult.stdout.split('\n').filter((line) => line.startsWith('160000 ')).map((line) => {
        const match = /^160000\s+([0-9a-f]{40})\s+\d+\t(.+)$/.exec(line);
        return match ? { path: match[2], commit: match[1] } : { raw: line };
      })
    : [];
  const nestedGit = nestedResult.ok
    ? nestedResult.stdout.split('\n').filter(Boolean).map((entry) => entry.replace(/^\.\//, '').replace(/\/\.git$/, ''))
    : [];

  const ownership = [];
  for (const path of nestedGit) {
    const tracked = await command(rootDir, 'git', ['ls-files', '--', path]);
    const submodule = gitlinks.some((entry) => entry.path === path);
    ownership.push({
      path,
      nestedGit: true,
      parentTrackedFiles: tracked.ok ? tracked.stdout.split('\n').filter(Boolean).length : 0,
      declaredSubmodule: submodule,
      classification: submodule ? 'submodule' : tracked.stdout.trim() ? 'parent-tree-plus-nested-git' : 'untracked-nested-git',
    });
  }

  return {
    schemaVersion: 'artifacts.fkr.dev/ownership-report-v1',
    generatedAt: new Date().toISOString(),
    root: '.',
    summary: {
      statusEntries: status.length,
      submodules: submodules.length,
      submodulePointerDrift: submodules.filter((entry) => entry.state === 'pointer-drift').length,
      nestedGitRoots: nestedGit.length,
      ambiguousNestedGitRoots: ownership.filter((entry) => entry.classification === 'parent-tree-plus-nested-git').length,
    },
    status,
    submodules,
    gitlinks,
    ownership,
    diagnostics: [statusResult, submoduleResult, gitlinksResult, nestedResult]
      .filter((entry) => !entry.ok)
      .map((entry) => ({ code: entry.code, stderr: entry.stderr })),
  };
}
