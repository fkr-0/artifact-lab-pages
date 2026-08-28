import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LESSONS_V2 } from '@/curriculum'
import { afterEach, describe, expect, it } from 'vitest'
import { GitSimulator } from '../git-simulator'
import { generateId, now, shortId } from '../git-types'

const tempRepos: string[] = []

type NativeResult = { success: boolean; output: string; error: string }

function nativeResult(cwd: string, ...args: string[]): NativeResult {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_EDITOR: 'true',
      GIT_MERGE_AUTOEDIT: 'no',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return {
    success: result.status === 0,
    output: (result.stdout ?? '').trim(),
    error: (result.stderr ?? '').trim(),
  }
}

function native(cwd: string, ...args: string[]): string {
  const result = nativeResult(cwd, ...args)
  if (!result.success) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${result.error || result.output}`)
  }
  return result.output
}

function nativeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'git-recipe-book-native-'))
  tempRepos.push(dir)
  native(dir, 'init', '-b', 'main')
  native(dir, 'config', 'user.email', 'test@example.test')
  native(dir, 'config', 'user.name', 'Recipe Book Test')
  native(dir, 'config', 'advice.detachedHead', 'false')
  return dir
}

function nativeBare(): string {
  const dir = mkdtempSync(join(tmpdir(), 'git-recipe-book-bare-'))
  tempRepos.push(dir)
  native(dir, 'init', '--bare', '--initial-branch=main')
  return dir
}

function nativeClone(remote: string): string {
  const parent = mkdtempSync(join(tmpdir(), 'git-recipe-book-clone-parent-'))
  tempRepos.push(parent)
  const dir = join(parent, 'clone')
  native(parent, 'clone', remote, dir)
  native(dir, 'config', 'user.email', 'collaborator@example.test')
  native(dir, 'config', 'user.name', 'Recipe Book Collaborator')
  return dir
}

function write(cwd: string, path: string, content: string): void {
  writeFileSync(join(cwd, path), content)
}

function read(cwd: string, path: string): string {
  return readFileSync(join(cwd, path), 'utf8')
}

function nativeBase(repo: string): void {
  write(repo, 'README.md', 'base-readme')
  write(repo, 'note.txt', 'base-note')
  native(repo, 'add', '.')
  native(repo, 'commit', '-m', 'Base')
}

function simulatorBase(): GitSimulator {
  const simulator = new GitSimulator()
  expect(simulator.execute('git init').success).toBe(true)
  simulator.execute('edit README.md base-readme')
  simulator.execute('edit note.txt base-note')
  simulator.execute('git add .')
  simulator.execute('git commit -m "Base"')
  return simulator
}

function nativeCommitCount(repo: string): number {
  return Number(native(repo, 'rev-list', '--count', 'HEAD'))
}

function nativeParentCount(repo: string, ref = 'HEAD'): number {
  return native(repo, 'rev-list', '--parents', '-n', '1', ref).split(/\s+/).length - 1
}

function simulatorParentCount(simulator: GitSimulator, branch = 'main'): number {
  const id = simulator.getState().branches[branch].commitId
  return simulator.getState().commits[id].parentIds.length
}

function advanceSimulatorRemote(
  simulator: GitSimulator,
  remoteName: string,
  branchName: string,
  message: string,
  files: Record<string, string>,
): string {
  const state = structuredClone(simulator.getState())
  const remote = state.remotes[remoteName]
  const parentId = remote.branches[branchName].commitId
  const parentTree = remote.commits[parentId]?.tree ?? state.commits[parentId]?.tree ?? {}
  const id = generateId()
  remote.commits[id] = {
    id,
    shortId: shortId(id),
    message,
    parentIds: parentId ? [parentId] : [],
    author: 'Collaborator <collaborator@example.test>',
    timestamp: now(),
    tree: { ...parentTree, ...files },
    branchLabel: `${remoteName}/${branchName}`,
  }
  remote.branches[branchName].commitId = id
  simulator.loadState(state)
  return id
}

function commandContractKey(raw: string): string | null {
  const tokens = raw.trim().split(/\s+/)
  if (tokens[0] !== 'git' || !tokens[1]) return null
  const command = tokens[1]
  switch (command) {
    case 'diff':
      return tokens.includes('--staged') || tokens.includes('--cached') ? 'diff:staged' : 'diff:working'
    case 'switch':
      if (tokens.includes('--track')) return 'switch:track'
      if (tokens.includes('-c')) return 'switch:create'
      return 'switch'
    case 'merge':
      return tokens.includes('--abort') ? 'merge:abort' : 'merge'
    case 'restore':
      return tokens.includes('--staged') ? 'restore:staged' : 'restore:working'
    case 'reset':
      return tokens.includes('--soft') ? 'reset:soft' : tokens.includes('--hard') ? 'reset:hard' : 'reset:mixed'
    case 'stash':
      return tokens[2] === 'list' ? 'stash:list' : tokens[2] === 'pop' ? 'stash:pop' : 'stash:push'
    case 'remote':
      return tokens[2] === 'add' ? 'remote:add' : 'remote:list'
    case 'push':
      return tokens.includes('-u') || tokens.includes('--set-upstream') ? 'push:upstream' : 'push'
    case 'tag':
      return tokens[2] ? 'tag:create' : 'tag:list'
    default:
      return command
  }
}

const CONFORMED_CONTRACT_KEYS = new Set([
  'init',
  'status',
  'add',
  'diff:staged',
  'diff:working',
  'commit',
  'log',
  'show',
  'branch',
  'switch:create',
  'switch:track',
  'switch',
  'merge',
  'merge:abort',
  'rebase',
  'restore:staged',
  'restore:working',
  'revert',
  'reset:soft',
  'reset:mixed',
  'reset:hard',
  'reflog',
  'stash:push',
  'stash:list',
  'stash:pop',
  'remote:add',
  'remote:list',
  'fetch',
  'pull',
  'push:upstream',
  'push',
  'tag:create',
  'tag:list',
  'cherry-pick',
])

afterEach(() => {
  for (const dir of tempRepos.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('native Git differential contract for the assessed teaching subset', () => {
  it('keeps every assessed Git command family covered by the native differential matrix', () => {
    const curriculumKeys = new Set<string>()
    for (const lesson of LESSONS_V2) {
      for (const step of lesson.steps) {
        const commands = [step.exactCommand, ...(step.referenceSolution ?? [])].filter((command): command is string =>
          Boolean(command),
        )
        for (const command of commands) {
          const key = commandContractKey(command)
          if (key) curriculumKeys.add(key)
        }
      }
    }

    expect([...curriculumKeys].sort()).toEqual([...CONFORMED_CONTRACT_KEYS].sort())
  })

  it('matches init, status, selective add, diff, commit, log, and show state relationships', () => {
    const repo = nativeRepo()
    write(repo, 'README.md', 'base-readme')
    write(repo, 'note.txt', 'base-note')
    const simulator = new GitSimulator()
    expect(simulator.execute('git init').success).toBe(true)
    simulator.execute('edit README.md base-readme')
    simulator.execute('edit note.txt base-note')

    expect(native(repo, 'status', '--porcelain').split('\n').filter(Boolean)).toHaveLength(2)
    expect(simulator.execute('git status').output).toContain('Untracked files')

    native(repo, 'add', 'README.md')
    expect(simulator.execute('git add README.md').success).toBe(true)
    expect(native(repo, 'diff', '--cached', '--name-only')).toBe('README.md')
    expect(Object.keys(simulator.getState().staging)).toEqual(['README.md'])
    expect(native(repo, 'diff', '--cached', '--', 'README.md')).not.toBe('')
    expect(simulator.execute('git diff --staged').output).toContain('README.md')

    native(repo, 'commit', '-m', 'Record README')
    expect(simulator.execute('git commit -m "Record README"').success).toBe(true)
    expect(native(repo, 'ls-tree', '-r', '--name-only', 'HEAD')).toBe('README.md')
    const firstSimulatorTip = simulator.getState().branches.main.commitId
    expect(Object.keys(simulator.getState().commits[firstSimulatorTip].tree)).toEqual(['README.md'])

    write(repo, 'README.md', 'second-version')
    simulator.execute('edit README.md second-version')
    expect(native(repo, 'diff', '--name-only')).toBe('README.md')
    expect(simulator.execute('git diff').output).toContain('README.md')

    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Update README')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Update README"')
    expect(nativeCommitCount(repo)).toBe(2)
    expect(Object.keys(simulator.getState().commits)).toHaveLength(2)
    expect(native(repo, 'log', '--format=%s', '-2').split('\n')).toEqual(['Update README', 'Record README'])
    const simulatorLog = simulator.execute('git log').output
    expect(simulatorLog.indexOf('Update README')).toBeLessThan(simulatorLog.indexOf('Record README'))
    expect(native(repo, 'show', '--format=%s', '--name-only', 'HEAD')).toContain('Update README')
    expect(simulator.execute('git show HEAD').output).toContain('Update README')
  })

  it('matches branch creation/listing, switching, lightweight tags, and tag inspection', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    const simulator = simulatorBase()

    native(repo, 'switch', '-c', 'feature')
    simulator.execute('git switch -c feature')
    expect(native(repo, 'branch', '--show-current')).toBe('feature')
    expect(simulator.getState().HEAD).toEqual({ type: 'branch', ref: 'feature' })
    expect(native(repo, 'branch', '--format=%(refname:short)').split('\n').sort()).toEqual(['feature', 'main'])
    expect(simulator.execute('git branch').output).toContain('feature')

    native(repo, 'switch', 'main')
    simulator.execute('git switch main')
    expect(native(repo, 'branch', '--show-current')).toBe('main')
    expect(simulator.getState().HEAD).toEqual({ type: 'branch', ref: 'main' })

    native(repo, 'tag', 'v1.0')
    simulator.execute('git tag v1.0')
    expect(native(repo, 'tag')).toBe('v1.0')
    expect(simulator.execute('git tag').output).toBe('v1.0\n')
    expect(native(repo, 'rev-parse', 'v1.0')).toBe(native(repo, 'rev-parse', 'HEAD'))
    expect(simulator.getState().tags['v1.0'].commitId).toBe(simulator.getState().branches.main.commitId)
    expect(native(repo, 'show', '--format=%s', '--no-patch', 'v1.0')).toBe('Base')
    expect(simulator.execute('git show v1.0').output).toContain('Base')
  })

  it('matches fast-forward and diverged merge topology', () => {
    const fastRepo = nativeRepo()
    nativeBase(fastRepo)
    native(fastRepo, 'switch', '-c', 'feature')
    write(fastRepo, 'README.md', 'feature')
    native(fastRepo, 'add', 'README.md')
    native(fastRepo, 'commit', '-m', 'Feature')
    native(fastRepo, 'switch', 'main')
    native(fastRepo, 'merge', 'feature')
    expect(nativeParentCount(fastRepo)).toBe(1)

    const simulatorFast = simulatorBase()
    simulatorFast.execute('git switch -c feature')
    simulatorFast.execute('edit README.md feature')
    simulatorFast.execute('git add README.md')
    simulatorFast.execute('git commit -m "Feature"')
    simulatorFast.execute('git switch main')
    simulatorFast.execute('git merge feature')
    expect(simulatorParentCount(simulatorFast)).toBe(1)

    const mergeRepo = nativeRepo()
    nativeBase(mergeRepo)
    native(mergeRepo, 'switch', '-c', 'feature')
    write(mergeRepo, 'note.txt', 'feature')
    native(mergeRepo, 'add', 'note.txt')
    native(mergeRepo, 'commit', '-m', 'Feature')
    native(mergeRepo, 'switch', 'main')
    write(mergeRepo, 'README.md', 'main')
    native(mergeRepo, 'add', 'README.md')
    native(mergeRepo, 'commit', '-m', 'Main')
    native(mergeRepo, 'merge', '--no-edit', 'feature')
    expect(nativeParentCount(mergeRepo)).toBe(2)

    const simulatorMerge = simulatorBase()
    simulatorMerge.execute('git switch -c feature')
    simulatorMerge.execute('edit note.txt feature')
    simulatorMerge.execute('git add note.txt')
    simulatorMerge.execute('git commit -m "Feature"')
    simulatorMerge.execute('git switch main')
    simulatorMerge.execute('edit README.md main')
    simulatorMerge.execute('git add README.md')
    simulatorMerge.execute('git commit -m "Main"')
    simulatorMerge.execute('git merge feature')
    expect(simulatorParentCount(simulatorMerge)).toBe(2)
  })

  it('matches conflict detection, merge abort, and resolved two-parent completion', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    native(repo, 'switch', '-c', 'feature')
    write(repo, 'README.md', 'feature-version')
    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Feature README')
    native(repo, 'switch', 'main')
    write(repo, 'README.md', 'main-version')
    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Main README')
    const nativeMainBeforeConflict = native(repo, 'rev-parse', 'HEAD')
    const nativeConflict = nativeResult(repo, 'merge', 'feature')
    expect(nativeConflict.success).toBe(false)
    expect(native(repo, 'diff', '--name-only', '--diff-filter=U')).toBe('README.md')
    expect(native(repo, 'rev-parse', 'HEAD')).toBe(nativeMainBeforeConflict)

    const simulator = simulatorBase()
    simulator.execute('git switch -c feature')
    simulator.execute('edit README.md feature-version')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Feature README"')
    simulator.execute('git switch main')
    simulator.execute('edit README.md main-version')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Main README"')
    const simulatorMainBeforeConflict = simulator.getState().branches.main.commitId
    const simulatorConflict = simulator.execute('git merge feature')
    expect(simulatorConflict.success).toBe(false)
    expect(simulator.getState().pendingOperation?.conflictPaths).toEqual(['README.md'])
    expect(simulator.getState().branches.main.commitId).toBe(simulatorMainBeforeConflict)

    native(repo, 'merge', '--abort')
    simulator.execute('git merge --abort')
    expect(read(repo, 'README.md')).toBe('main-version')
    expect(simulator.getState().working['README.md']).toBe('main-version')
    expect(native(repo, 'status', '--porcelain')).toBe('')
    expect(simulator.getState().pendingOperation).toBeUndefined()

    expect(nativeResult(repo, 'merge', 'feature').success).toBe(false)
    expect(simulator.execute('git merge feature').success).toBe(false)
    write(repo, 'README.md', 'resolved-version')
    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Resolve README conflict')
    simulator.execute('edit README.md resolved-version')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Resolve README conflict"')
    expect(nativeParentCount(repo)).toBe(2)
    expect(simulatorParentCount(simulator)).toBe(2)
    expect(read(repo, 'README.md')).toBe(simulator.getState().working['README.md'])
  })

  it('matches a non-conflicting rebase replay onto unrelated target work', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    native(repo, 'switch', '-c', 'feature')
    write(repo, 'note.txt', 'feature-note')
    native(repo, 'add', 'note.txt')
    native(repo, 'commit', '-m', 'Feature note')
    const nativeOldFeature = native(repo, 'rev-parse', 'HEAD')
    native(repo, 'switch', 'main')
    write(repo, 'README.md', 'main-docs')
    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Main docs')
    const nativeMainTip = native(repo, 'rev-parse', 'HEAD')
    native(repo, 'switch', 'feature')
    native(repo, 'rebase', 'main')
    expect(native(repo, 'rev-parse', 'HEAD')).not.toBe(nativeOldFeature)
    expect(native(repo, 'rev-parse', 'HEAD^')).toBe(nativeMainTip)
    expect(read(repo, 'README.md')).toBe('main-docs')
    expect(read(repo, 'note.txt')).toBe('feature-note')

    const simulator = simulatorBase()
    simulator.execute('git switch -c feature')
    simulator.execute('edit note.txt feature-note')
    simulator.execute('git add note.txt')
    simulator.execute('git commit -m "Feature note"')
    const simulatorOldFeature = simulator.getState().branches.feature.commitId
    simulator.execute('git switch main')
    simulator.execute('edit README.md main-docs')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Main docs"')
    const simulatorMainTip = simulator.getState().branches.main.commitId
    simulator.execute('git switch feature')
    expect(simulator.execute('git rebase main').success).toBe(true)
    const simulatorNewFeature = simulator.getState().branches.feature.commitId
    expect(simulatorNewFeature).not.toBe(simulatorOldFeature)
    expect(simulator.getState().commits[simulatorNewFeature].parentIds).toEqual([simulatorMainTip])
    expect(simulator.getState().working['README.md']).toBe('main-docs')
    expect(simulator.getState().working['note.txt']).toBe('feature-note')
  })

  it('matches working restore, staged restore, revert, and reflog recovery evidence', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    const simulator = simulatorBase()

    write(repo, 'README.md', 'working-only')
    simulator.execute('edit README.md working-only')
    native(repo, 'restore', 'README.md')
    simulator.execute('git restore README.md')
    expect(read(repo, 'README.md')).toBe('base-readme')
    expect(simulator.getState().working['README.md']).toBe('base-readme')

    write(repo, 'README.md', 'staged-change')
    native(repo, 'add', 'README.md')
    simulator.execute('edit README.md staged-change')
    simulator.execute('git add README.md')
    native(repo, 'restore', '--staged', 'README.md')
    simulator.execute('git restore --staged README.md')
    expect(native(repo, 'diff', '--cached', '--name-only')).toBe('')
    expect(simulator.getState().staging['README.md']).toBeUndefined()
    expect(read(repo, 'README.md')).toBe('staged-change')
    expect(simulator.getState().working['README.md']).toBe('staged-change')

    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Bad change')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Bad change"')
    native(repo, 'revert', 'HEAD')
    simulator.execute('git revert HEAD')
    expect(read(repo, 'README.md')).toBe('base-readme')
    expect(simulator.getState().working['README.md']).toBe('base-readme')
    expect(native(repo, 'log', '-1', '--format=%s')).toBe('Revert "Bad change"')
    expect(simulator.execute('git log').output).toContain('Revert "Bad change"')
    expect(native(repo, 'reflog', '-1', '--format=%gs').toLowerCase()).toContain('revert')
    expect(simulator.execute('git reflog').output.toLowerCase()).toContain('revert')
  })

  it('matches soft, mixed, and hard reset layer distinctions', () => {
    for (const mode of ['soft', 'mixed', 'hard'] as const) {
      const repo = nativeRepo()
      nativeBase(repo)
      write(repo, 'README.md', 'second')
      native(repo, 'add', 'README.md')
      native(repo, 'commit', '-m', 'Second')
      native(repo, 'reset', `--${mode}`, 'HEAD~1')
      const nativeCached = native(repo, 'diff', '--cached', '--name-only')
      const nativeWorkingVsHead = native(repo, 'diff', 'HEAD', '--name-only')

      const simulator = simulatorBase()
      simulator.execute('edit README.md second')
      simulator.execute('git add README.md')
      simulator.execute('git commit -m "Second"')
      simulator.execute(`git reset --${mode} HEAD~1`)
      const staged = Object.keys(simulator.getState().staging)
      const workingChanged =
        simulator.getState().working['README.md'] !==
        simulator.getState().commits[simulator.getState().branches.main.commitId].tree['README.md']

      if (mode === 'soft') {
        expect(nativeCached).toContain('README.md')
        expect(staged).toContain('README.md')
      } else {
        expect(nativeCached).toBe('')
        expect(staged).toEqual([])
      }
      expect(nativeWorkingVsHead.includes('README.md')).toBe(mode !== 'hard')
      expect(workingChanged).toBe(mode !== 'hard')
    }
  })

  it('matches stash push/list/pop for a tracked working-tree change', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    const simulator = simulatorBase()
    write(repo, 'README.md', 'work-in-progress')
    simulator.execute('edit README.md work-in-progress')

    native(repo, 'stash', 'push')
    simulator.execute('git stash')
    expect(read(repo, 'README.md')).toBe('base-readme')
    expect(simulator.getState().working['README.md']).toBe('base-readme')
    expect(native(repo, 'stash', 'list')).toContain('stash@{0}')
    expect(simulator.execute('git stash list').output).toContain('stash@{0}')

    native(repo, 'stash', 'pop')
    simulator.execute('git stash pop')
    expect(read(repo, 'README.md')).toBe('work-in-progress')
    expect(simulator.getState().working['README.md']).toBe('work-in-progress')
    expect(native(repo, 'stash', 'list')).toBe('')
    expect(simulator.getState().stash).toHaveLength(0)
  })

  it('matches cherry-pick content, ancestry, and commit-message preservation', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    native(repo, 'switch', '-c', 'fix-source')
    write(repo, 'note.txt', 'selected-fix')
    native(repo, 'add', 'note.txt')
    native(repo, 'commit', '-m', 'Selected fix')
    const nativeSource = native(repo, 'rev-parse', 'HEAD')
    native(repo, 'switch', 'main')
    write(repo, 'README.md', 'local-docs')
    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Local docs')
    const nativeParent = native(repo, 'rev-parse', 'HEAD')
    native(repo, 'cherry-pick', nativeSource)
    expect(native(repo, 'rev-parse', 'HEAD^')).toBe(nativeParent)
    expect(native(repo, 'log', '-1', '--format=%s')).toBe('Selected fix')
    expect(read(repo, 'README.md')).toBe('local-docs')
    expect(read(repo, 'note.txt')).toBe('selected-fix')

    const simulator = simulatorBase()
    simulator.execute('git switch -c fix-source')
    simulator.execute('edit note.txt selected-fix')
    simulator.execute('git add note.txt')
    simulator.execute('git commit -m "Selected fix"')
    const simulatorSource = simulator.getState().branches['fix-source'].commitId
    simulator.execute('git switch main')
    simulator.execute('edit README.md local-docs')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Local docs"')
    const simulatorParent = simulator.getState().branches.main.commitId
    simulator.execute(`git cherry-pick ${simulatorSource}`)
    const simulatorTip = simulator.getState().branches.main.commitId
    expect(simulator.getState().commits[simulatorTip].parentIds).toEqual([simulatorParent])
    expect(simulator.getState().commits[simulatorTip].message).toBe('Selected fix')
    expect(simulator.getState().working['README.md']).toBe('local-docs')
    expect(simulator.getState().working['note.txt']).toBe('selected-fix')
  })

  it('matches remote add/list, push -u, fetch, tracking branch creation, pull, normal push, rejection, and recovery', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    const bare = nativeBare()
    native(repo, 'remote', 'add', 'origin', bare)
    expect(native(repo, 'remote', '-v')).toContain('origin')
    native(repo, 'push', '-u', 'origin', 'main')
    expect(native(repo, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}')).toBe('origin/main')

    const simulator = simulatorBase()
    simulator.execute('git remote add origin https://example.test/repo.git')
    expect(simulator.execute('git remote -v').output).toContain('origin')
    simulator.execute('git push -u origin main')
    expect(simulator.getState().trackingBranches.main?.remoteBranch).toBe('origin/main')

    const collaborator = nativeClone(bare)
    write(collaborator, 'remote.txt', 'collaborator-one')
    native(collaborator, 'add', 'remote.txt')
    native(collaborator, 'commit', '-m', 'Collaborator one')
    native(collaborator, 'push', 'origin', 'main')
    const nativeLocalBeforeFetch = native(repo, 'rev-parse', 'main')
    native(repo, 'fetch', 'origin')
    expect(native(repo, 'rev-parse', 'main')).toBe(nativeLocalBeforeFetch)
    expect(native(repo, 'rev-parse', 'origin/main')).not.toBe(nativeLocalBeforeFetch)

    const simulatorLocalBeforeFetch = simulator.getState().branches.main.commitId
    advanceSimulatorRemote(simulator, 'origin', 'main', 'Collaborator one', { 'remote.txt': 'collaborator-one' })
    simulator.execute('git fetch origin')
    expect(simulator.getState().branches.main.commitId).toBe(simulatorLocalBeforeFetch)
    expect(simulator.getState().branches['origin/main'].commitId).not.toBe(simulatorLocalBeforeFetch)

    native(repo, 'switch', '-c', 'review-remote', '--track', 'origin/main')
    simulator.execute('git switch -c review-remote --track origin/main')
    expect(native(repo, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}')).toBe('origin/main')
    expect(simulator.getState().trackingBranches['review-remote']?.remoteBranch).toBe('origin/main')
    native(repo, 'switch', 'main')
    simulator.execute('git switch main')

    native(repo, 'pull', 'origin', 'main')
    simulator.execute('git pull origin main')
    expect(read(repo, 'remote.txt')).toBe('collaborator-one')
    expect(simulator.getState().working['remote.txt']).toBe('collaborator-one')
    expect(native(repo, 'rev-parse', 'main')).toBe(native(repo, 'rev-parse', 'origin/main'))
    expect(simulator.getState().branches.main.commitId).toBe(simulator.getState().branches['origin/main'].commitId)

    write(repo, 'README.md', 'local-publish')
    native(repo, 'add', 'README.md')
    native(repo, 'commit', '-m', 'Local publish')
    native(repo, 'push', 'origin', 'main')
    simulator.execute('edit README.md local-publish')
    simulator.execute('git add README.md')
    simulator.execute('git commit -m "Local publish"')
    expect(simulator.execute('git push origin main').success).toBe(true)
    expect(native(repo, 'rev-parse', 'main')).toBe(native(repo, 'rev-parse', 'origin/main'))
    expect(simulator.getState().branches.main.commitId).toBe(simulator.getState().branches['origin/main'].commitId)

    native(collaborator, 'pull', '--ff-only', 'origin', 'main')
    write(collaborator, 'collaborator-two.txt', 'remote-two')
    native(collaborator, 'add', 'collaborator-two.txt')
    native(collaborator, 'commit', '-m', 'Collaborator two')
    native(collaborator, 'push', 'origin', 'main')
    write(repo, 'local-two.txt', 'local-two')
    native(repo, 'add', 'local-two.txt')
    native(repo, 'commit', '-m', 'Local two')
    const nativeRejected = nativeResult(repo, 'push', 'origin', 'main')
    expect(nativeRejected.success).toBe(false)
    expect(nativeRejected.error.toLowerCase()).toContain('fetch first')

    advanceSimulatorRemote(simulator, 'origin', 'main', 'Collaborator two', { 'collaborator-two.txt': 'remote-two' })
    simulator.execute('edit local-two.txt local-two')
    simulator.execute('git add local-two.txt')
    simulator.execute('git commit -m "Local two"')
    const simulatorRejected = simulator.execute('git push origin main')
    expect(simulatorRejected.success).toBe(false)
    expect(simulatorRejected.error).toContain('non-fast-forward')

    native(repo, 'fetch', 'origin')
    native(repo, 'merge', '--no-edit', 'origin/main')
    native(repo, 'push', 'origin', 'main')
    simulator.execute('git fetch origin')
    simulator.execute('git merge origin/main')
    simulator.execute('git push origin main')
    expect(native(repo, 'rev-parse', 'main')).toBe(native(repo, 'rev-parse', 'origin/main'))
    expect(simulator.getState().branches.main.commitId).toBe(simulator.getState().branches['origin/main'].commitId)
    expect(read(repo, 'local-two.txt')).toBe('local-two')
    expect(read(repo, 'collaborator-two.txt')).toBe('remote-two')
    expect(simulator.getState().working['local-two.txt']).toBe('local-two')
    expect(simulator.getState().working['collaborator-two.txt']).toBe('remote-two')
  })

  it('keeps direct checkout of a remote-tracking ref detached instead of inventing a local branch', () => {
    const repo = nativeRepo()
    nativeBase(repo)
    const bare = nativeBare()
    native(repo, 'remote', 'add', 'origin', bare)
    native(repo, 'push', 'origin', 'main')
    native(repo, 'fetch', 'origin')
    native(repo, 'checkout', 'origin/main')
    expect(native(repo, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('HEAD')

    const simulator = simulatorBase()
    simulator.execute('git remote add origin https://example.test/repo.git')
    simulator.execute('git push origin main')
    simulator.execute('git fetch origin')
    simulator.execute('git checkout origin/main')
    expect(simulator.getState().HEAD.type).toBe('detached')
  })
})
