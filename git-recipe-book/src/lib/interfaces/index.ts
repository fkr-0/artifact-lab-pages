// ─── Interface Exports ────────────────────────────────────────────────────────

export type { IGitBackend, BackendType, IBackendFactory } from './IGitBackend';
export type {
  ILessonProvider,
  ILessonRegistry,
  ILesson,
  ILessonStep,
  ILessonToolIntroduction,
  ILessonCategory,
  LessonCategory,
  IRemoteSetup,
  IStepValidation,
  StepValidationType,
} from './ILessonProvider';
export type {
  IHelpProvider,
  IHelpRegistry,
  IHelpText,
  IHelpExample,
  IGlossaryEntry,
  IConceptExplanation,
  HelpCategory,
} from './IHelpProvider';
export type {
  IUXRegistry,
  IUXFlow,
  IUXStep,
  IUXAction,
  UXActionType,
  IComponentOverride,
  ComponentSlot,
  UXTrigger,
} from './IUXRegistry';
