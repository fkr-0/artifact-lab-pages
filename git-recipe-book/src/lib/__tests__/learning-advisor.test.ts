import { describe, expect, it } from 'vitest'

import { buildConceptMastery, buildReviewSchedule, recommendNextLearningActions } from '../learning/learning-advisor'
import type { LearningEvidence } from '../learning/learning-evidence'
import { LessonProvider } from '../lessons/lesson-provider'

const lessonProvider = new LessonProvider()
const lessons = lessonProvider.getLessons()

function evidence(
  conceptIds: string[],
  kind: LearningEvidence['kind'],
  outcome: LearningEvidence['outcome'],
  timestamp: string,
  id = `${kind}-${conceptIds.join('-')}`,
): LearningEvidence {
  return {
    id,
    lessonId: 'test-lesson',
    stepId: 'test-step',
    conceptIds,
    kind,
    outcome,
    timestamp: new Date(timestamp).getTime(),
  }
}

describe('learning advisor', () => {
  it('promotes concepts through guided success, retrieval, and transfer while misses trigger review', () => {
    const mastery = buildConceptMastery({
      lessons,
      completedLessonIds: new Set(),
      learningEvidence: [
        evidence(['staging-area'], 'guided-success', 'passed', '2026-06-09T00:00:00Z'),
        evidence(['staging-area'], 'retrieval', 'passed', '2026-06-10T00:00:00Z'),
        evidence(['staging-area'], 'transfer', 'passed', '2026-06-11T00:00:00Z'),
        evidence(['branch'], 'retrieval', 'missed', '2026-06-11T00:00:00Z'),
      ],
    })

    expect(mastery['staging-area']).toMatchObject({ level: 'secure', hintUses: 0 })
    expect(mastery['staging-area'].latestEvidenceAt).toEqual(new Date('2026-06-11T00:00:00Z'))
    expect(mastery.branch.level).toBe('needs-review')
  })

  it('records hint dependence without treating hint use as mastery evidence', () => {
    const mastery = buildConceptMastery({
      lessons,
      completedLessonIds: new Set(),
      learningEvidence: [
        evidence(['selective-staging'], 'hint', 'used', '2026-06-10T00:00:00Z'),
        evidence(['selective-staging'], 'guided-success', 'passed', '2026-06-10T00:01:00Z'),
      ],
    })

    expect(mastery['selective-staging']).toMatchObject({ level: 'guided-success', hintUses: 1 })
  })

  it('schedules retrieved, transferred, and secure concepts from their latest timestamp', () => {
    const schedule = buildReviewSchedule({
      lessons,
      completedLessonIds: new Set(),
      learningEvidence: [
        evidence(['staging-area'], 'retrieval', 'passed', '2026-06-10T00:00:00Z'),
        evidence(['branch'], 'transfer', 'passed', '2026-06-10T00:00:00Z'),
        evidence(['recovery'], 'retrieval', 'passed', '2026-06-10T00:00:00Z'),
        evidence(['recovery'], 'transfer', 'passed', '2026-06-11T00:00:00Z'),
      ],
      now: new Date('2026-06-11T00:00:00Z'),
    })

    expect(schedule['staging-area']).toMatchObject({ intervalDays: 3, dueAt: new Date('2026-06-13T00:00:00Z') })
    expect(schedule.branch).toMatchObject({ intervalDays: 7, dueAt: new Date('2026-06-17T00:00:00Z') })
    expect(schedule.recovery).toMatchObject({
      level: 'secure',
      intervalDays: 14,
      dueAt: new Date('2026-06-25T00:00:00Z'),
    })
  })

  it('schedules immediate review after a missed retrieval', () => {
    const schedule = buildReviewSchedule({
      lessons,
      completedLessonIds: new Set(),
      learningEvidence: [evidence(['remote-tracking'], 'retrieval', 'missed', '2026-06-10T00:00:00Z')],
      now: new Date('2026-06-10T00:00:00Z'),
    })

    expect(schedule['remote-tracking']).toMatchObject({
      level: 'needs-review',
      intervalDays: 0,
      dueAt: new Date('2026-06-10T00:00:00Z'),
    })
  })

  it('prioritizes a due spaced review over newly unlocked lessons', () => {
    const recommendations = recommendNextLearningActions({
      lessons,
      completedLessonIds: new Set(['orientation', 'basics']),
      learningEvidence: [evidence(['staging-area'], 'retrieval', 'missed', '2026-06-10T00:00:00Z')],
      now: new Date('2026-06-10T00:00:00Z'),
    })

    expect(recommendations[0]).toMatchObject({
      type: 'review',
      lessonId: 'spaced-review',
      reason: expect.stringMatching(/staging-area/i),
    })
  })

  it('unlocks the capstone only when gate concepts have transfer-level evidence and direct prerequisites are met', () => {
    const now = '2026-06-10T00:00:00Z'
    const learningEvidence = ['staging-area', 'selective-staging', 'branch', 'recovery', 'remote-tracking'].map(
      (conceptId) => evidence([conceptId], 'transfer', 'passed', now, `transfer-${conceptId}`),
    )
    const recommendations = recommendNextLearningActions({
      lessons,
      completedLessonIds: new Set(['basics', 'git-internals', 'collaboration-capstone', 'advanced']),
      learningEvidence,
      now: new Date(now),
    })

    expect(recommendations[0]).toMatchObject({ type: 'challenge', lessonId: 'challenge-mode' })
  })
})
