import { describe, expect, it } from 'vitest'
import { GitSimulator } from '../git-simulator'
import { buildCommandInsight, classifyGitCommand, summarizeGitState } from '../learning/git-learning-model'

describe('Git learning model', () => {
  it('classifies observation and destructive commands by intent and risk', () => {
    expect(classifyGitCommand('git status')).toMatchObject({
      verb: 'status',
      risk: 'observe',
      expectedLayers: [],
    })
    expect(classifyGitCommand('git reset --hard HEAD~1')).toMatchObject({
      verb: 'reset',
      risk: 'destructive',
      expectedLayers: ['working', 'staging', 'refs'],
    })
  })

  it('summarizes the five learner-facing Git layers', () => {
    const backend = new GitSimulator()
    expect(summarizeGitState(backend.getState())).toMatchObject({
      initialized: false,
      workingCount: 0,
      stagedCount: 0,
      commitCount: 0,
      headLabel: 'main',
    })
  })

  it('explains staging as a selection-layer change', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    backend.execute('edit recipe.md Add salt')
    const before = structuredClone(backend.getState())
    const result = backend.execute('git add .')
    const after = backend.getState()

    const insight = buildCommandInsight('git add .', before, after, result)
    expect(insight.actualLayers).toContain('staging')
    expect(insight.after.stagedCount).toBeGreaterThan(0)
    expect(insight.explanation).toMatch(/staging/i)
  })

  it('keeps observation commands state-neutral', () => {
    const backend = new GitSimulator()
    backend.execute('git init')
    const before = structuredClone(backend.getState())
    const result = backend.execute('git status')
    const after = backend.getState()

    const insight = buildCommandInsight('git status', before, after, result)
    expect(insight.actualLayers).toEqual([])
    expect(insight.explanation).toMatch(/observation command/i)
  })

  it('treats a rejected command as prerequisite evidence', () => {
    const backend = new GitSimulator()
    const before = structuredClone(backend.getState())
    const result = backend.execute('git commit -m "too soon"')
    const after = backend.getState()

    const insight = buildCommandInsight('git commit -m "too soon"', before, after, result)
    expect(insight.success).toBe(false)
    expect(insight.actualLayers).toEqual([])
    expect(insight.explanation).toMatch(/rejected/i)
  })
})
