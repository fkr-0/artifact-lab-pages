import { describe, it, expect, beforeEach } from 'vitest';
import { LessonProvider } from '../lessons/lesson-provider';
import type { ILesson, ILessonCategory } from '../interfaces';

describe('LessonProvider', () => {
  let provider: LessonProvider;

  beforeEach(() => {
    provider = new LessonProvider();
  });

  // ─── getLessons ──────────────────────────────────────────────────────────

  describe('getLessons', () => {
    it('returns all lessons sorted', () => {
      const lessons = provider.getLessons();
      expect(lessons.length).toBeGreaterThan(0);

      // Verify sorting by category order then lesson order
      for (let i = 1; i < lessons.length; i++) {
        const prev = lessons[i - 1];
        const curr = lessons[i];
        const prevCat = provider.getCategories().find((c) => c.id === prev.category);
        const currCat = provider.getCategories().find((c) => c.id === curr.category);
        if (prevCat && currCat && prevCat.order === currCat.order) {
          expect(prev.order).toBeLessThanOrEqual(curr.order);
        }
      }
    });
  });

  // ─── getLessonsByCategory ────────────────────────────────────────────────

  describe('getLessonsByCategory', () => {
    it('filters lessons by category', () => {
      const basicsLessons = provider.getLessonsByCategory('basics');
      expect(basicsLessons.length).toBeGreaterThan(0);
      expect(basicsLessons.every((l) => l.category === 'basics')).toBe(true);
    });

    it('returns empty array for unknown category', () => {
      const lessons = provider.getLessonsByCategory('nonexistent');
      expect(lessons).toEqual([]);
    });
  });

  // ─── getLesson ───────────────────────────────────────────────────────────

  describe('getLesson', () => {
    it('returns specific lesson', () => {
      const lesson = provider.getLesson('basics');
      expect(lesson).toBeDefined();
      expect(lesson!.id).toBe('basics');
      expect(lesson!.title).toBe('Git Basics');
    });

    it('returns undefined for non-existent lesson', () => {
      const lesson = provider.getLesson('nonexistent');
      expect(lesson).toBeUndefined();
    });
  });

  // ─── getCategories ───────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('returns sorted categories', () => {
      const categories = provider.getCategories();
      expect(categories.length).toBeGreaterThan(0);

      for (let i = 1; i < categories.length; i++) {
        expect(categories[i - 1].order).toBeLessThanOrEqual(categories[i].order);
      }
    });
  });

  // ─── arePrerequisitesMet ─────────────────────────────────────────────────

  describe('arePrerequisitesMet', () => {
    it('returns true when no prerequisites', () => {
      expect(provider.arePrerequisitesMet('basics', new Set())).toBe(true);
    });

    it('returns false when prerequisites not met', () => {
      // 'branches' lesson requires 'basics' to be completed
      expect(provider.arePrerequisitesMet('branches', new Set())).toBe(false);
    });

    it('returns true when prerequisites are met', () => {
      expect(provider.arePrerequisitesMet('branches', new Set(['basics']))).toBe(true);
    });

    it('returns true for unknown lesson', () => {
      expect(provider.arePrerequisitesMet('nonexistent', new Set())).toBe(true);
    });
  });

  // ─── validateStep ────────────────────────────────────────────────────────

  describe('validateStep', () => {
    it('validates with regex pattern', () => {
      const result = provider.validateStep('basics', 0, 'git init', {});
      expect(result).toBe(true);
    });

    it('fails regex validation with wrong command', () => {
      const result = provider.validateStep('basics', 0, 'git status', {});
      expect(result).toBe(false);
    });

    it('validates with state-check type', () => {
      // Create a custom lesson with state-check validation
      provider.registerLesson({
        id: 'test-state',
        title: 'State Test',
        icon: '🧪',
        description: 'Test state validation',
        category: 'basics',
        prerequisites: [],
        order: 99,
        steps: [
          {
            id: 'state-step',
            title: 'Check state',
            description: 'desc',
            hint: 'hint',
            concept: 'concept',
            validation: {
              type: 'state-check',
              statePredicate: (state: Record<string, unknown>) => state.initialized === true,
            },
          },
        ],
      });

      const result = provider.validateStep('test-state', 0, 'any', { initialized: true });
      expect(result).toBe(true);

      const result2 = provider.validateStep('test-state', 0, 'any', { initialized: false });
      expect(result2).toBe(false);
    });

    it('validates with custom validator', () => {
      provider.registerLesson({
        id: 'test-custom',
        title: 'Custom Test',
        icon: '🧪',
        description: 'Test custom validation',
        category: 'basics',
        prerequisites: [],
        order: 99,
        steps: [
          {
            id: 'custom-step',
            title: 'Custom check',
            description: 'desc',
            hint: 'hint',
            concept: 'concept',
            validation: {
              type: 'custom',
              customValidator: (cmd: string, _state: Record<string, unknown>) => cmd.includes('magic'),
            },
          },
        ],
      });

      expect(provider.validateStep('test-custom', 0, 'magic command', {})).toBe(true);
      expect(provider.validateStep('test-custom', 0, 'other command', {})).toBe(false);
    });

    it('returns false for non-existent lesson', () => {
      expect(provider.validateStep('nonexistent', 0, 'git init', {})).toBe(false);
    });

    it('returns false for non-existent step', () => {
      expect(provider.validateStep('basics', 999, 'git init', {})).toBe(false);
    });
  });


  // ─── Pedagogic Contract ──────────────────────────────────────────────────

  describe('pedagogic contract', () => {
    it('explains Git and the subcommand before the first command is used', () => {
      const lesson = provider.getLesson('basics');
      expect(lesson).toBeDefined();
      const firstStep = lesson!.steps[0] as any;

      expect(firstStep.toolIntroductions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ term: 'git' }),
          expect.objectContaining({ term: 'init' }),
        ])
      );
      expect(firstStep.expectedOutcome).toContain('.git');
      expect(firstStep.checkpointQuestions.length).toBeGreaterThan(0);
    });



    it('provides a low-entry beginner path before the first command-heavy lesson', () => {
      const lessons = provider.getLessons();
      const firstLesson = lessons[0];

      expect(firstLesson.id).toBe('orientation');
      expect(firstLesson.title).toMatch(/orientation/i);
      expect(firstLesson.prerequisites).toEqual([]);
      expect(firstLesson.steps.map((step) => step.id)).toEqual([
        'why-git',
        'repo-anatomy',
        'three-areas',
        'commit-model',
        'safe-practice-loop',
      ]);
    });

    it('includes glossary, review, challenge, and safety-focused learning phases', () => {
      expect(provider.getLesson('git-glossary')).toBeDefined();
      expect(provider.getLesson('spaced-review')).toBeDefined();
      expect(provider.getLesson('challenge-mode')).toBeDefined();
      expect(provider.getLesson('safety-recovery')).toBeDefined();
    });



    it('has dedicated guided tutorial lessons for cherry-pick and tags', () => {
      const cherryPick = provider.getLesson('cherry-pick-guided');
      const tags = provider.getLesson('tags-guided');

      expect(cherryPick).toBeDefined();
      expect(tags).toBeDefined();

      expect(cherryPick!.steps.map((step) => step.id)).toEqual([
        'cherry-pick-orient',
        'cherry-pick-find-commit',
        'cherry-pick-apply',
        'cherry-pick-verify',
      ]);
      expect(tags!.steps.map((step) => step.id)).toEqual([
        'tag-orient',
        'tag-create',
        'tag-list',
        'tag-show',
      ]);

      expect(cherryPick!.steps.find((step) => step.id === 'cherry-pick-apply')!.safetyNote).toMatch(/duplicate|conflict|current branch/i);
      expect(tags!.steps.find((step) => step.id === 'tag-create')!.toolIntroductions).toEqual(
        expect.arrayContaining([expect.objectContaining({ term: 'tag' })])
      );
    });

    it('marks dangerous history or file-state commands with safety notes', () => {
      const dangerousStepIds = new Set(['rebase-exec', 'reset']);
      const dangerousSteps = provider
        .getLessons()
        .flatMap((lesson) => lesson.steps.map((step) => ({ lesson, step: step as any })))
        .filter(({ step }) => dangerousStepIds.has(step.id));

      expect(dangerousSteps.length).toBe(dangerousStepIds.size);
      for (const { lesson, step } of dangerousSteps) {
        expect(step.safetyNote, `${lesson.id}/${step.id} needs a safety note`).toMatch(/rewrite|discard|destroy|backup|shared|uncommitted/i);
      }
    });




    it('includes guided cherry-pick and tag lessons with beginner-safe commands', () => {
      const cherryPick = provider.getLesson('cherry-pick-guided');
      const tags = provider.getLesson('tags-guided');

      expect(cherryPick).toBeDefined();
      expect(cherryPick!.title).toMatch(/cherry-pick/i);
      expect(cherryPick!.prerequisites).toEqual(expect.arrayContaining(['branches', 'merging']));
      expect(cherryPick!.steps.map((step) => step.id)).toEqual([
        'cherry-pick-orient',
        'cherry-pick-find-commit',
        'cherry-pick-apply',
        'cherry-pick-verify',
      ]);
      expect(cherryPick!.steps[2]).toMatchObject({
        exactCommand: expect.stringMatching(/^git cherry-pick /),
        safetyNote: expect.stringMatching(/duplicate|conflict|current branch/i),
      });

      expect(tags).toBeDefined();
      expect(tags!.title).toMatch(/tag/i);
      expect(tags!.prerequisites).toEqual(expect.arrayContaining(['basics']));
      expect(tags!.steps.map((step) => step.id)).toEqual([
        'tag-orient',
        'tag-create',
        'tag-list',
        'tag-show',
      ]);
      expect(tags!.steps[1]).toMatchObject({
        exactCommand: expect.stringMatching(/^git tag /),
        expectedOutcome: expect.stringMatching(/v1\.0|tag list/i),
      });
    });

    it('keeps every bundled command step beginner-safe with tool explanations and outcomes', () => {
      const commandSteps = provider
        .getLessons()
        .flatMap((lesson) => lesson.steps.map((step) => ({ lesson, step: step as any })))
        .filter(({ step }) => /git\s+/.test(`${step.hint} ${step.exactCommand ?? ''}`));

      expect(commandSteps.length).toBeGreaterThan(0);

      for (const { lesson, step } of commandSteps) {
        expect(step.toolIntroductions?.length, `${lesson.id}/${step.id} should explain its tools`).toBeGreaterThanOrEqual(2);
        expect(step.expectedOutcome, `${lesson.id}/${step.id} should describe visible outcome`).toBeTruthy();
        expect(step.checkpointQuestions?.length, `${lesson.id}/${step.id} should include a reflection checkpoint`).toBeGreaterThan(0);
      }
    });
  });

  // ─── registerLesson ──────────────────────────────────────────────────────

  describe('registerLesson', () => {
    it('adds a lesson', () => {
      const newLesson: ILesson = {
        id: 'custom-lesson',
        title: 'Custom Lesson',
        icon: '⭐',
        description: 'A custom lesson',
        category: 'basics',
        prerequisites: [],
        order: 99,
        steps: [
          {
            id: 'custom-step-1',
            title: 'Step 1',
            description: 'Do something',
            hint: 'hint text',
            concept: 'concept text',
            validation: { type: 'regex', pattern: '^git\\s+init$' },
          },
        ],
      };

      provider.registerLesson(newLesson);
      expect(provider.getLesson('custom-lesson')).toBeDefined();
      expect(provider.getLesson('custom-lesson')!.title).toBe('Custom Lesson');
    });
  });

  // ─── registerCategory ────────────────────────────────────────────────────

  describe('registerCategory', () => {
    it('adds a category', () => {
      const newCategory: ILessonCategory = {
        id: 'custom-cat',
        title: 'Custom Category',
        icon: '🎯',
        description: 'Custom category',
        order: 99,
      };

      provider.registerCategory(newCategory);
      const categories = provider.getCategories();
      expect(categories.find((c) => c.id === 'custom-cat')).toBeDefined();
    });
  });

  // ─── unregisterLesson ────────────────────────────────────────────────────

  describe('unregisterLesson', () => {
    it('removes a lesson', () => {
      provider.unregisterLesson('basics');
      expect(provider.getLesson('basics')).toBeUndefined();
    });
  });

  // ─── onLessonsChange ─────────────────────────────────────────────────────

  describe('onLessonsChange', () => {
    it('notifies listeners', () => {
      let notified = false;
      const unsub = provider.onLessonsChange(() => {
        notified = true;
      });

      provider.registerLesson({
        id: 'notify-test',
        title: 'Notify Test',
        icon: '🔔',
        description: 'Test',
        category: 'basics',
        prerequisites: [],
        order: 99,
        steps: [],
      });

      expect(notified).toBe(true);
      unsub();
    });

    it('unsubscribes correctly', () => {
      let count = 0;
      const unsub = provider.onLessonsChange(() => {
        count++;
      });

      unsub();
      provider.unregisterLesson('basics');
      expect(count).toBe(0);
    });
  });
});
