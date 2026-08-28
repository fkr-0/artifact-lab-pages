import { describe, expect, it } from 'vitest'
import { GitSimulator } from '../git-simulator'
import { buildCommandInsight } from '../learning/git-learning-model'

describe('semantic repository events', () => {
  it('observes an index content change even when the staged file count stays constant', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    backend.execute('git add README.md')
    backend.execute('edit README.md changed-again')
    const before = structuredClone(backend.getState())
    const result = backend.execute('git add README.md')
    const insight = buildCommandInsight('git add README.md', before, backend.getState(), result)

    expect(insight.before.stagedCount).toBe(insight.after.stagedCount)
    expect(insight.actualLayers).toContain('staging')
    expect(insight.advancedDelta).toContain('Index entry README.md changed.')
  })

  it('observes a branch ref move even when the branch count stays constant', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    backend.execute('git add .')
    backend.execute('git commit -m "first"')
    backend.execute('edit README.md second')
    backend.execute('git add README.md')
    const before = structuredClone(backend.getState())
    const result = backend.execute('git commit -m "second"')
    const insight = buildCommandInsight('git commit -m "second"', before, backend.getState(), result)

    expect(insight.before.branchCount).toBe(insight.after.branchCount)
    expect(insight.actualLayers).toContain('refs')
    expect(insight.advancedDelta.some((event) => /Ref main moved/.test(event))).toBe(true)
  })

  it('supports git show as a state-neutral inspection command', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    backend.execute('git add .')
    backend.execute('git commit -m "first"')
    backend.execute('git tag v1.0')
    const before = structuredClone(backend.getState())
    const result = backend.execute('git show v1.0')
    const insight = buildCommandInsight('git show v1.0', before, backend.getState(), result)

    expect(result.success).toBe(true)
    expect(result.output).toContain('first')
    expect(insight.actualLayers).toEqual([])
    expect(insight.risk).toBe('observe')
  })

  it('only establishes upstream tracking when push uses -u', () => {
    const plain = new GitSimulator()
    plain.execute('git init')
    plain.execute('git add .')
    plain.execute('git commit -m "first"')
    plain.execute('git remote add origin https://example.test/repo.git')
    expect(plain.execute('git push origin main').success).toBe(true)
    expect(plain.getState().trackingBranches.main).toBeUndefined()

    const explicit = new GitSimulator()
    explicit.execute('git init')
    explicit.execute('git add .')
    explicit.execute('git commit -m "first"')
    explicit.execute('git remote add origin https://example.test/repo.git')
    expect(explicit.execute('git push -u origin main').success).toBe(true)
    expect(explicit.getState().trackingBranches.main).toEqual({ remote: 'origin', remoteBranch: 'origin/main' })
  })

  it('keeps remote-tracking checkout detached until tracking is requested explicitly', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    backend.execute('git add .')
    backend.execute('git commit -m "first"')
    backend.execute('git remote add origin https://example.test/repo.git')
    backend.execute('git push origin main')

    const detached = backend.execute('git checkout origin/main')
    expect(detached.success).toBe(true)
    expect(backend.getState().HEAD.type).toBe('detached')
    expect(backend.getState().trackingBranches.main).toBeUndefined()

    const tracked = backend.execute('git switch -c upstream-main --track origin/main')
    expect(tracked.success).toBe(true)
    expect(backend.getState().HEAD).toEqual({ type: 'branch', ref: 'upstream-main' })
    expect(backend.getState().trackingBranches['upstream-main']).toEqual({
      remote: 'origin',
      remoteBranch: 'origin/main',
    })
  })

  it('separates working-tree diff from staged diff', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    backend.execute('git add .')
    backend.execute('git commit -m "first"')
    backend.execute('edit README.md second')
    backend.execute('git add README.md')

    expect(backend.execute('git diff').output).toContain('No differences found')
    expect(backend.execute('git diff --staged').output).toContain('diff --git a/README.md b/README.md')
  })
})
