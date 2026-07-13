// ─── Lesson Provider Interface ────────────────────────────────────────────────
//
// Extensible lesson system. Lessons are grouped by category and support
// prerequisites, custom validation, rich help texts, and UX flows.
//

import { IHelpText } from './IHelpProvider';

// ─── Lesson Category ─────────────────────────────────────────────────────────

export type LessonCategory =
  | 'basics'
  | 'branching'
  | 'merging'
  | 'rebasing'
  | 'remotes'
  | 'advanced'
  | string; // extensible

export interface ILessonCategory {
  id: LessonCategory;
  title: string;
  icon: string;
  description: string;
  order: number; // display order
  color?: string; // accent color for this category
}

// ─── Lesson Step ─────────────────────────────────────────────────────────────

export type StepValidationType = 'regex' | 'state-check' | 'custom';

export interface IStepValidation {
  type: StepValidationType;
  /** Regex pattern to match against the raw command */
  pattern?: string;
  /** State predicate: check the git state matches expectations */
  statePredicate?: (state: Record<string, unknown>) => boolean;
  /** Custom validator function */
  customValidator?: (rawCommand: string, state: Record<string, unknown>) => boolean;
}

export interface ILessonToolIntroduction {
  term: string;
  meaning: string;
  usedHere: string;
  beginnerPitfall?: string;
}

export interface ILessonStep {
  id: string;
  title: string;
  description: string;
  hint: string;
  concept: string;
  /** Tool and argument terms learners should understand before typing the command */
  toolIntroductions?: ILessonToolIntroduction[];
  /** What the learner should be able to observe after running the command */
  expectedOutcome?: string;
  /** Low-pressure reflection prompts that reinforce mental models */
  checkpointQuestions?: string[];
  /** Warning shown before commands that can rewrite or discard local state */
  safetyNote?: string;
  /** How to validate this step is completed */
  validation?: IStepValidation;
  /** Help texts associated with this step's command */
  helpTexts?: IHelpText[];
  /** UX flow to trigger when this step becomes active */
  uxFlowId?: string;
  /** Optional setup function called before this step becomes active */
  setup?: (backend: unknown) => void;
  /** Progressive hints that reveal over time */
  progressiveHints?: string[];
  /** The exact command to run (shown as spoiler after delay) */
  exactCommand?: string;
  /** Estimated time in seconds for this step */
  estimatedTime?: number;
}

// ─── Lesson ──────────────────────────────────────────────────────────────────

export interface ILesson {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: LessonCategory;
  /** IDs of lessons that must be completed before this one */
  prerequisites: string[];
  /** Ordered list of steps */
  steps: ILessonStep[];
  /** Initial files for this lesson (overrides defaults) */
  initialFiles?: Record<string, string>;
  /** Remote setup for remote lessons */
  remoteSetup?: IRemoteSetup;
  /** Order within category */
  order: number;
}

export interface IRemoteSetup {
  /** Remote name (usually 'origin') */
  remoteName: string;
  /** Fake URL for the remote */
  url: string;
  /** Pre-populated commits on the remote */
  remoteCommits: Array<{
    message: string;
    files: Record<string, string>;
  }>;
  /** Remote branch name */
  branchName: string;
}

// ─── Lesson Provider ─────────────────────────────────────────────────────────

export interface ILessonProvider {
  /** Get all available lessons */
  getLessons(): ILesson[];

  /** Get lessons by category */
  getLessonsByCategory(category: LessonCategory): ILesson[];

  /** Get a specific lesson by ID */
  getLesson(id: string): ILesson | undefined;

  /** Get all categories */
  getCategories(): ILessonCategory[];

  /** Check if prerequisites for a lesson are met */
  arePrerequisitesMet(lessonId: string, completedLessonIds: Set<string>): boolean;

  /** Validate a step completion */
  validateStep(
    lessonId: string,
    stepIndex: number,
    rawCommand: string,
    gitState: Record<string, unknown>
  ): boolean;
}

// ─── Lesson Registry (for extensibility) ─────────────────────────────────────

export interface ILessonRegistry extends ILessonProvider {
  /** Register a new lesson */
  registerLesson(lesson: ILesson): void;

  /** Register a new category */
  registerCategory(category: ILessonCategory): void;

  /** Remove a lesson by ID */
  unregisterLesson(id: string): void;

  /** Listen for lesson changes */
  onLessonsChange(callback: () => void): () => void;
}
