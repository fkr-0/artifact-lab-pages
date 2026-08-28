import { describe, expect, it } from 'vitest'
import { GitSimulator } from '../git-simulator'
import { generateId, now, shortId } from '../git-types'

function createBaseRepository(): GitSimulator {
  const backend = new GitSimulator()
  expect(backend.execute('git init').success).toBe(true)
  expect(backend.execute('git add .').success).toBe(true)
  expect(backend.execute('git commit -m "Base snapshot"').success).toBe(true)
  return backend
}

describe('remaining-roadmap Git semantics', () => {
  it('distinguishes working diff, staged diff, and selective staging', () => {
    const backend = createBaseRepository()
    backend.execute('edit README.md docs-change')
    backend.execute('edit recipes/salad.md unrelated-change')

    expect(backend.execute('git diff').output).toContain('README.md')
    expect(backend.execute('git diff').output).toContain('recipes/salad.md')
    expect(backend.execute('git add README.md').success).toBe(true)
    expect(backend.execute('git diff --staged').output).toContain('README.md')
    expect(backend.execute('git diff --staged').output).not.toContain('recipes/salad.md')
    expect(backend.execute('git diff').output).not.toContain('README.md')
    expect(backend.execute('git diff').output).toContain('recipes/salad.md')
  })

  it('models fast-forward and true two-parent merge as different outcomes', () => {
    const fastForward = createBaseRepository()
    const beforeCount = Object.keys(fastForward.getState().commits).length
    fastForward.execute('git switch -c feature')
    fastForward.execute('edit README.md feature')
    fastForward.execute('git add README.md')
    fastForward.execute('git commit -m "Feature"')
    const featureTip = fastForward.getState().branches.feature.commitId
    fastForward.execute('git switch main')
    expect(fastForward.execute('git merge feature').output).toContain('Fast-forward')
    expect(fastForward.getState().branches.main.commitId).toBe(featureTip)
    expect(Object.keys(fastForward.getState().commits).length).toBe(beforeCount + 1)

    const diverged = createBaseRepository()
    diverged.execute('git switch -c feature')
    diverged.execute('edit recipes/pasta.md feature-pasta')
    diverged.execute('git add recipes/pasta.md')
    diverged.execute('git commit -m "Feature pasta"')
    diverged.execute('git switch main')
    diverged.execute('edit README.md main-readme')
    diverged.execute('git add README.md')
    diverged.execute('git commit -m "Main docs"')
    const merged = diverged.execute('git merge feature')
    expect(merged.success).toBe(true)
    const mergeCommit = diverged.getState().commits[diverged.getState().branches.main.commitId]
    expect(mergeCommit.parentIds).toHaveLength(2)
  })

  it('models merge conflict, abort, and explicit resolution', () => {
    const backend = createBaseRepository()
    backend.execute('git switch -c feature')
    backend.execute('edit README.md feature-version')
    backend.execute('git add README.md')
    backend.execute('git commit -m "Feature README"')
    backend.execute('git switch main')
    backend.execute('edit README.md main-version')
    backend.execute('git add README.md')
    backend.execute('git commit -m "Main README"')

    const conflict = backend.execute('git merge feature')
    expect(conflict.success).toBe(false)
    expect(conflict.mutated).toBe(true)
    expect(conflict.error).toContain('CONFLICT')
    expect(backend.getState().pendingOperation?.conflictPaths).toEqual(['README.md'])
    expect(backend.getState().working['README.md']).toContain('<<<<<<< HEAD')
    expect(conflict.events?.some((event) => event.type === 'conflict-started')).toBe(true)

    const aborted = backend.execute('git merge --abort')
    expect(aborted.success).toBe(true)
    expect(backend.getState().pendingOperation).toBeUndefined()
    expect(backend.getState().working['README.md']).toBe('main-version')

    backend.execute('git merge feature')
    backend.execute('edit README.md resolved-version')
    backend.execute('git add README.md')
    const resolved = backend.execute('git commit -m "Resolve README conflict"')
    expect(resolved.success).toBe(true)
    const mergeCommit = backend.getState().commits[backend.getState().branches.main.commitId]
    expect(mergeCommit.parentIds).toHaveLength(2)
    expect(backend.getState().pendingOperation).toBeUndefined()
    expect(resolved.events?.some((event) => event.type === 'conflict-resolved')).toBe(true)
  })

  it('restores working content and unstages without rewriting history', () => {
    const backend = createBaseRepository()
    const original = backend.getState().working['README.md']
    backend.execute('edit README.md changed')
    expect(backend.execute('git restore README.md').success).toBe(true)
    expect(backend.getState().working['README.md']).toBe(original)

    backend.execute('edit README.md staged-change')
    backend.execute('git add README.md')
    expect(backend.getState().staging['README.md']).toBe('staged-change')
    expect(backend.execute('git restore --staged README.md').success).toBe(true)
    expect(backend.getState().staging['README.md']).toBeUndefined()
    expect(backend.getState().working['README.md']).toBe('staged-change')
  })

  it('implements soft, mixed, and hard reset as distinct layer changes', () => {
    const soft = createBaseRepository()
    const baseId = soft.getState().branches.main.commitId
    soft.execute('edit README.md second')
    soft.execute('git add README.md')
    soft.execute('git commit -m "Second"')
    expect(soft.execute('git reset --soft HEAD~1').success).toBe(true)
    expect(soft.getState().branches.main.commitId).toBe(baseId)
    expect(soft.getState().working['README.md']).toBe('second')
    expect(soft.getState().staging['README.md']).toBe('second')

    const mixed = createBaseRepository()
    const mixedBase = mixed.getState().branches.main.commitId
    mixed.execute('edit README.md second')
    mixed.execute('git add README.md')
    mixed.execute('git commit -m "Second"')
    expect(mixed.execute('git reset HEAD~1').success).toBe(true)
    expect(mixed.getState().branches.main.commitId).toBe(mixedBase)
    expect(mixed.getState().working['README.md']).toBe('second')
    expect(mixed.getState().staging).toEqual({})

    const hard = createBaseRepository()
    const original = hard.getState().working['README.md']
    const hardBase = hard.getState().branches.main.commitId
    hard.execute('edit README.md second')
    hard.execute('git add README.md')
    hard.execute('git commit -m "Second"')
    expect(hard.execute('git reset --hard HEAD~1').success).toBe(true)
    expect(hard.getState().branches.main.commitId).toBe(hardBase)
    expect(hard.getState().working['README.md']).toBe(original)
    expect(hard.getState().staging).toEqual({})
  })

  it('revert records an inverse commit while reflog preserves pointer movement evidence', () => {
    const backend = createBaseRepository()
    const original = backend.getState().working['README.md']
    backend.execute('edit README.md bad-change')
    backend.execute('git add README.md')
    backend.execute('git commit -m "Bad change"')
    const countBefore = Object.keys(backend.getState().commits).length

    const reverted = backend.execute('git revert HEAD')
    expect(reverted.success).toBe(true)
    expect(Object.keys(backend.getState().commits)).toHaveLength(countBefore + 1)
    expect(backend.getState().working['README.md']).toBe(original)
    expect(backend.execute('git reflog').output).toContain('revert HEAD')
  })

  it('rejects a non-fast-forward push and does not silently create upstream tracking', () => {
    const backend = createBaseRepository()
    backend.execute('git remote add origin https://example.test/repo.git')
    expect(backend.execute('git push -u origin main').success).toBe(true)
    const baseRemoteTip = backend.getState().remotes.origin.branches.main.commitId

    backend.execute('edit README.md local-work')
    backend.execute('git add README.md')
    backend.execute('git commit -m "Local work"')

    const state = backend.getState()
    const remoteId = generateId()
    state.remotes.origin.commits[remoteId] = {
      id: remoteId,
      shortId: shortId(remoteId),
      message: 'Collaborator work',
      parentIds: [baseRemoteTip],
      author: 'Collaborator <c@example.test>',
      timestamp: now(),
      tree: { ...state.remotes.origin.commits[baseRemoteTip].tree, 'remote.txt': 'new' },
      branchLabel: 'origin/main',
    }
    state.remotes.origin.branches.main.commitId = remoteId
    backend.loadState(state)

    const rejected = backend.execute('git push origin main')
    expect(rejected.success).toBe(false)
    expect(rejected.error).toContain('non-fast-forward')
    expect(backend.getState().remotes.origin.branches.main.commitId).toBe(remoteId)
  })

  it('rebase replays only the source change and preserves unrelated target-branch work', () => {
    const backend = createBaseRepository()
    backend.execute('git switch -c feature')
    backend.execute('edit recipes/pasta.md feature-pasta')
    backend.execute('git add recipes/pasta.md')
    backend.execute('git commit -m "Feature pasta"')
    const oldFeatureTip = backend.getState().branches.feature.commitId
    backend.execute('git switch main')
    backend.execute('edit README.md main-docs')
    backend.execute('git add README.md')
    backend.execute('git commit -m "Main docs"')
    backend.execute('git switch feature')

    expect(backend.execute('git rebase main').success).toBe(true)
    const state = backend.getState()
    const newFeatureTip = state.branches.feature.commitId
    expect(newFeatureTip).not.toBe(oldFeatureTip)
    expect(state.working['README.md']).toBe('main-docs')
    expect(state.working['recipes/pasta.md']).toBe('feature-pasta')
  })

  it('cherry-pick replays only the selected commit delta onto the receiving branch', () => {
    const backend = createBaseRepository()
    backend.execute('git switch -c fix-source')
    backend.execute('edit recipes/pasta.md selected-fix')
    backend.execute('git add recipes/pasta.md')
    backend.execute('git commit -m "Selected fix"')
    backend.execute('git switch main')
    backend.execute('edit README.md local-docs')
    backend.execute('git add README.md')
    backend.execute('git commit -m "Local docs"')

    expect(backend.execute('git cherry-pick fix-source').success).toBe(true)
    expect(backend.getState().working['README.md']).toBe('local-docs')
    expect(backend.getState().working['recipes/pasta.md']).toBe('selected-fix')
  })

  it('fetch and pull do not silently invent upstream configuration', () => {
    const backend = createBaseRepository()
    backend.execute('git remote add origin https://example.test/repo.git')
    backend.execute('git push origin main')
    expect(backend.getState().trackingBranches.main).toBeUndefined()
    expect(backend.execute('git fetch origin').success).toBe(true)
    expect(backend.getState().trackingBranches.main).toBeUndefined()
    expect(backend.execute('git pull origin main').success).toBe(true)
    expect(backend.getState().trackingBranches.main).toBeUndefined()
  })
})
