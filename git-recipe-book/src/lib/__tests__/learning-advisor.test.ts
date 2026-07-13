import { describe, expect, it } from 'vitest';

import {
  buildConceptMastery,
  buildReviewSchedule,
  recommendNextLearningActions,
} from '../learning/learning-advisor';
import { LessonProvider } from '../lessons/lesson-provider';

const lessonProvider = new LessonProvider();

describe('learning advisor', () => {
  it('builds concept mastery from completed lessons and checkpoint results', () => {
    const mastery = buildConceptMastery({
      lessons: lessonProvider.getLessons(),
      completedLessonIds: new Set(['orientation']),
      checkpointResults: {
        'orientation/three-areas': 'missed',
        'orientation/repo-anatomy': 'passed',
      },
    });

    expect(mastery['repository-anatomy'].level).toBe('secure');
    expect(mastery['three-areas'].level).toBe('needs-review');
    expect(mastery['three-areas'].evidence).toContain('missed checkpoint orientation/three-areas');
  });

  it('schedules concept reviews with increasing intervals after successful checkpoints', () => {
    const schedule = buildReviewSchedule({
      lessons: lessonProvider.getLessons(),
      completedLessonIds: new Set(['orientation']),
      checkpointResults: {
        'orientation/three-areas': 'passed',
        'orientation/repo-anatomy': 'passed',
      },
      now: new Date('2026-06-10T00:00:00Z'),
    });

    expect(schedule['three-areas']).toMatchObject({
      conceptId: 'three-areas',
      intervalDays: 3,
      dueAt: new Date('2026-06-13T00:00:00Z'),
    });
    expect(schedule['repository-anatomy']).toMatchObject({
      intervalDays: 3,
    });
  });

  it('schedules immediate review after missed checkpoints', () => {
    const schedule = buildReviewSchedule({
      lessons: lessonProvider.getLessons(),
      completedLessonIds: new Set(['orientation']),
      checkpointResults: {
        'orientation/three-areas': 'missed',
      },
      now: new Date('2026-06-10T00:00:00Z'),
    });

    expect(schedule['three-areas']).toMatchObject({
      level: 'needs-review',
      intervalDays: 0,
      dueAt: new Date('2026-06-10T00:00:00Z'),
    });
  });

  it('prioritizes due spaced review over challenge recommendations', () => {
    const recommendations = recommendNextLearningActions({
      lessons: lessonProvider.getLessons(),
      completedLessonIds: new Set(['orientation', 'basics', 'branches', 'merging', 'remotes-workflow']),
      checkpointResults: {
        'orientation/three-areas': 'passed',
        'orientation/repo-anatomy': 'passed',
      },
      now: new Date('2026-06-14T00:00:00Z'),
      practicedAt: new Date('2026-06-10T00:00:00Z'),
    });

    expect(recommendations[0]).toMatchObject({
      type: 'review',
      lessonId: 'spaced-review',
      reason: expect.stringMatching(/due/i),
    });
  });

  it('recommends review before new challenge work when prerequisite concepts are weak', () => {
    const recommendations = recommendNextLearningActions({
      lessons: lessonProvider.getLessons(),
      completedLessonIds: new Set(['orientation', 'basics', 'branches', 'merging', 'remotes-workflow']),
      checkpointResults: {
        'orientation/three-areas': 'missed',
      },
    });

    expect(recommendations[0]).toMatchObject({
      type: 'review',
      lessonId: 'spaced-review',
      reason: expect.stringMatching(/three-areas/i),
    });
  });

  it('unlocks challenge recommendations once core concepts are secure and reviews are not due', () => {
    const recommendations = recommendNextLearningActions({
      lessons: lessonProvider.getLessons(),
      completedLessonIds: new Set(['orientation', 'basics', 'branches', 'merging', 'remotes-workflow', 'spaced-review']),
      checkpointResults: {
        'orientation/three-areas': 'passed',
        'orientation/repo-anatomy': 'passed',
      },
      now: new Date('2026-06-11T00:00:00Z'),
    });

    expect(recommendations[0]).toMatchObject({
      type: 'challenge',
      lessonId: 'challenge-mode',
    });
  });
});
