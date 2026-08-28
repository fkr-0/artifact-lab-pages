import type { ILessonStep, IRemoteSetup, LessonCategory } from '@/lib/interfaces/ILessonProvider'

export type LessonPhase = 'model' | 'predict' | 'act' | 'inspect' | 'explain' | 'retrieve' | 'transfer'
export type LessonMode = 'guided' | 'practice' | 'recovery' | 'challenge'

export interface LessonConceptLinks {
  requires: string[]
  introduces: string[]
  practices: string[]
  assesses: string[]
}

export interface DeclarativeCommandAssessment {
  pattern?: string
  requiresPrediction?: boolean
  expectedResult?: 'success' | 'failure' | 'either'
  goal?: GoalPredicate[]
}

export type LessonStepV2 = Omit<ILessonStep, 'validation' | 'setup'> & {
  assessment?: DeclarativeCommandAssessment
  concepts?: string[]
  knowledgeCheck?: KnowledgeCheck
  /** Hidden reference path used by contract tests; practice goals may still accept other valid sequences. */
  referenceSolution?: string[]
}

export interface LessonDefinitionV2 {
  /** Optional in source declarations because the v2 adapter/runtime assigns the wire version explicitly. */
  schemaVersion?: 2
  id: string
  title: string
  icon: string
  description: string
  objective: string
  category: LessonCategory
  prerequisites: string[]
  order: number
  scenario: string
  mode?: LessonMode
  concepts: LessonConceptLinks
  phases: LessonPhase[]
  steps: LessonStepV2[]
  remoteSetup?: IRemoteSetup
}

export interface ConceptDefinition {
  id: string
  title: string
  depth: 'A' | 'B' | 'C'
  description: string
}

export interface ScenarioDefinition {
  id: string
  initialized: boolean
  files?: Record<string, string>
  /** Silent simulator commands that deterministically construct the learning fixture. */
  setupCommands?: string[]
  remoteSetup?: IRemoteSetup
  /** Remote-only commits applied after local setup to model collaborator movement and rejected pushes. */
  remoteAdvance?: Array<{
    remoteName: string
    branchName: string
    message: string
    files: Record<string, string>
  }>
}

export interface KnowledgeCheck {
  question: string
  options: string[]
  correctOption: number
  explanation: string
}

export type GoalPredicate =
  | { type: 'repository-initialized' }
  | { type: 'head-branch'; branch: string }
  | { type: 'branch-exists'; branch: string }
  | { type: 'staged-includes'; path: string }
  | { type: 'staged-excludes'; path: string }
  | { type: 'working-clean' }
  | { type: 'commit-count-at-least'; count: number }
  | { type: 'commit-message-exists'; message: string }
  | { type: 'head-parent-count'; count: number }
  | { type: 'tag-exists'; tag: string }
  | { type: 'stash-count'; count: number }
  | { type: 'remote-exists'; remote: string }
  | { type: 'tracking-configured'; branch: string; remoteRef: string }
  | { type: 'remote-tracking-ref-exists'; ref: string }
  | { type: 'remote-branch-matches-local'; remote: string; remoteBranch: string; localBranch: string }
  | { type: 'pending-operation'; operation: 'merge' }
  | { type: 'no-pending-operation' }
