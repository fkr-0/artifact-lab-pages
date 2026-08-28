import { getScenario, loadScenario } from '@/curriculum'
import type { RepositoryEvent } from '@/git-model/events'
import { IsoGitBackend } from '@/lib/backends/isomorphic-git-backend'
import { GitSimulator } from '@/lib/git-simulator'
import type { GitCommandResult, GitCommit, GitState } from '@/lib/git-types'
import { REMOTE_BRANCH_COLOR, generateId, now, shortId } from '@/lib/git-types'
import { HelpProvider } from '@/lib/help/help-provider'
import type { IGitBackend } from '@/lib/interfaces'
import { type CommandLearningInsight, type GitStateLayer, buildCommandInsight } from '@/lib/learning/git-learning-model'
import type { CheckpointResult } from '@/lib/learning/learning-advisor'
import { type LearningEvidence, evidenceConceptIds } from '@/lib/learning/learning-evidence'
import { LessonProvider } from '@/lib/lessons/lesson-provider'
import { UXRegistry } from '@/lib/ux-registry'
import { create } from 'zustand'

// ─── Providers (singleton instances) ─────────────────────────────────────────

export const lessonProvider = new LessonProvider()
export const helpProvider = new HelpProvider()
export const uxRegistry = new UXRegistry()

// ─── Terminal History Entry ──────────────────────────────────────────────────

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system'
  text: string
  timestamp: number
}

function loadLearningEvidence(): LearningEvidence[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LEARNING_EVIDENCE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLearningEvidence(evidence: LearningEvidence[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LEARNING_EVIDENCE_KEY, JSON.stringify(evidence.slice(-1000)))
  } catch {
    // Ignore storage errors
  }
}

export interface LessonAttempt {
  lessonId: string
  stepId: string
  command: string
  timestamp: number
  success: boolean
  progressed: boolean
  prediction: GitStateLayer[]
  events: RepositoryEvent[]
  blockedReason?: 'prediction-required' | 'command-failed' | 'validation-failed'
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface GitStore {
  // Core backend
  backend: IGitBackend
  gitState: GitState
  selectedCommitId: string | null

  // Terminal
  terminalLines: TerminalLine[]
  commandHistory: string[]
  historyIndex: number

  // Lessons
  currentLessonId: string | null
  currentStepIndex: number
  completedSteps: Set<string>
  completedLessons: Set<string>
  /** Persisted lesson progress (step counts per lesson) */
  lessonProgress: Record<string, number>
  /** Retrieval-practice evidence used by the adaptive learning advisor */
  checkpointResults: Record<string, CheckpointResult>
  /** Learner prediction made before the next command */
  predictedLayers: GitStateLayer[]
  /** Whether the learner deliberately committed a prediction, including “no change” */
  predictionMade: boolean
  /** Prediction attached to the latest command evidence */
  lastPrediction: GitStateLayer[]
  /** Whether the latest command had an explicit learner prediction */
  lastPredictionMade: boolean
  /** Causal evidence generated from the most recently executed command */
  lastCommandInsight: CommandLearningInsight | null
  /** A valid command has produced evidence, but the learner has not reflected yet */
  pendingReflectionStepId: string | null
  /** Immutable evidence of assessed command attempts, including failures and blocked executions. */
  lessonAttempts: LessonAttempt[]
  /** Timestamped concept evidence used for mastery, review, transfer, and hint-aware recommendations. */
  learningEvidence: LearningEvidence[]
  /** Per-step progressive hint reveal level for the current browser session. */
  hintLevels: Record<string, number>

  // UI
  sidebarOpen: boolean
  evidenceOpen: boolean
  focusMode: boolean
  activeTab: 'graph' | 'files' | 'detail'
  helpPanelOpen: boolean
  helpTopic: string | null

  // Actions
  executeCommand: (raw: string) => GitCommandResult
  selectCommit: (id: string | null) => void
  syncState: () => void
  addTerminalLine: (type: TerminalLine['type'], text: string) => void
  clearTerminal: () => void
  navigateHistory: (direction: 'up' | 'down') => string
  setCurrentLesson: (lessonId: string) => void
  completeCurrentStep: () => void
  completeKnowledgeStep: (result: CheckpointResult) => void
  setPredictedLayers: (layers: GitStateLayer[]) => void
  predictNoStateChange: () => void
  setSidebarOpen: (open: boolean) => void
  setEvidenceOpen: (open: boolean) => void
  setFocusMode: (open: boolean) => void
  setActiveTab: (tab: 'graph' | 'files' | 'detail') => void
  resetAll: () => void
  loadLesson: (lessonId: string, options?: { restart?: boolean }) => void
  restartCurrentLesson: () => void
  revealNextHint: () => void
  setHelpPanel: (open: boolean, topic?: string | null) => void
  switchBackend: (type: 'simulator' | 'isomorphic-git') => void
}

const createBackend = (type: 'simulator' | 'isomorphic-git'): IGitBackend => {
  if (type === 'isomorphic-git') {
    return new IsoGitBackend() as IGitBackend
  }
  return new GitSimulator()
}

/**
 * Backends are deliberately mutable state machines. UI state is not: publish
 * immutable snapshots so React memoization can reliably observe nested Git
 * entity movement such as new commits and moved refs.
 */
const backendSnapshot = (backend: IGitBackend): GitState => structuredClone(backend.getState())

const defaultBackend = new GitSimulator()

// Load persisted lesson progress from localStorage
const LESSON_PROGRESS_KEY = 'git-recipe-book-lesson-progress'
const CHECKPOINT_RESULTS_KEY = 'git-recipe-book-checkpoint-results'
const LEARNING_EVIDENCE_KEY = 'git-recipe-book-learning-evidence-v2'

function loadLessonProgress(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(LESSON_PROGRESS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function loadCheckpointResults(): Record<string, CheckpointResult> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(CHECKPOINT_RESULTS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveCheckpointResults(results: Record<string, CheckpointResult>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHECKPOINT_RESULTS_KEY, JSON.stringify(results))
  } catch {
    // Ignore storage errors
  }
}

function completedLessonsFromProgress(progress: Record<string, number>): Set<string> {
  return new Set(
    lessonProvider
      .getLessons()
      .filter((lesson) => (progress[lesson.id] ?? 0) >= lesson.steps.length)
      .map((lesson) => lesson.id),
  )
}

const persistedLessonProgress = loadLessonProgress()

function sidebarOpenByDefault(): boolean {
  if (typeof window === 'undefined') return true
  return window.innerWidth >= 992
}

function saveLessonProgress(progress: Record<string, number>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Ignore storage errors
  }
}

export const useGitStore = create<GitStore>((set, get) => ({
  backend: defaultBackend,
  gitState: backendSnapshot(defaultBackend),
  selectedCommitId: null,
  terminalLines: [
    {
      type: 'system',
      text: '🍳 Welcome to Git Recipe Book! Type "help" to see available commands, or start a lesson from the sidebar.',
      timestamp: Date.now(),
    },
  ],
  commandHistory: [],
  historyIndex: -1,
  currentLessonId: null,
  currentStepIndex: 0,
  completedSteps: new Set<string>(),
  completedLessons: completedLessonsFromProgress(persistedLessonProgress),
  lessonProgress: persistedLessonProgress,
  checkpointResults: loadCheckpointResults(),
  predictedLayers: [],
  predictionMade: false,
  lastPrediction: [],
  lastPredictionMade: false,
  lastCommandInsight: null,
  pendingReflectionStepId: null,
  lessonAttempts: [],
  learningEvidence: loadLearningEvidence(),
  hintLevels: {},
  sidebarOpen: sidebarOpenByDefault(),
  evidenceOpen: false,
  focusMode: false,
  activeTab: 'graph',
  helpPanelOpen: false,
  helpTopic: null,

  executeCommand: (raw: string) => {
    const state = get()
    const beforeState = structuredClone(state.backend.getState())
    const lesson = lessonProvider.getLesson(state.currentLessonId || '')
    const step = lesson?.steps[state.currentStepIndex]
    const assessed = Boolean(lesson && step?.validation)
    const newHistory = [...state.commandHistory, raw]
    const historyIndex = -1

    // Assessed lesson actions are real experiments: prediction is a prerequisite,
    // not a decorative prompt. Block before touching the backend.
    if (assessed && step?.requiresPrediction && !state.predictionMade && lesson) {
      const result: GitCommandResult = {
        success: false,
        output: '',
        error: 'Prediction required before this assessed lesson action.',
        events: [],
      }
      state.addTerminalLine('input', `$ ${raw}`)
      state.addTerminalLine('error', result.error || 'Prediction required before this assessed lesson action.')
      state.addTerminalLine('system', '🧠 Commit a prediction in the mission panel, then run the experiment again.')
      const insight = buildCommandInsight(raw, beforeState, beforeState, result)
      const attempt: LessonAttempt = {
        lessonId: lesson.id,
        stepId: step.id,
        command: raw,
        timestamp: Date.now(),
        success: false,
        progressed: false,
        prediction: [],
        events: [],
        blockedReason: 'prediction-required',
      }
      set({
        commandHistory: newHistory,
        historyIndex,
        lastCommandInsight: insight,
        lastPrediction: [],
        lastPredictionMade: false,
        lessonAttempts: [...state.lessonAttempts, attempt],
      })
      return result
    }

    const result = state.backend.execute(raw)
    state.addTerminalLine('input', `$ ${raw}`)

    if (result.output === '__CLEAR__') {
      set({
        terminalLines: [],
        commandHistory: newHistory,
        historyIndex,
        gitState: backendSnapshot(state.backend),
        predictedLayers: [],
        predictionMade: false,
        lastPrediction: state.predictedLayers,
        lastPredictionMade: state.predictionMade,
        lastCommandInsight: buildCommandInsight(raw, beforeState, state.backend.getState(), result),
      })
      return result
    }

    if (result.success) {
      if (result.output) state.addTerminalLine('output', result.output)
    } else {
      state.addTerminalLine('error', result.error || 'Unknown error')
    }

    const newGitState = state.backend.getState()
    const insight = buildCommandInsight(raw, beforeState, newGitState, result)
    const expectedResult = step?.expectedResult ?? 'success'
    const resultMatchesExpectation =
      expectedResult === 'either' || (expectedResult === 'success' ? result.success : !result.success)
    const lessonCompleted = resultMatchesExpectation && checkLessonProgress(raw, state)
    const attempts = [...state.lessonAttempts]
    let learningEvidence = state.learningEvidence

    if (assessed && lesson && step) {
      attempts.push({
        lessonId: lesson.id,
        stepId: step.id,
        command: raw,
        timestamp: Date.now(),
        success: result.success,
        progressed: lessonCompleted,
        prediction: [...state.predictedLayers],
        events: [...(result.events ?? [])],
        blockedReason: lessonCompleted ? undefined : resultMatchesExpectation ? 'validation-failed' : 'command-failed',
      })
      if (lessonCompleted) {
        const mode = lesson.curriculum?.mode ?? 'guided'
        const evidence: LearningEvidence = {
          id: `${Date.now()}-${lesson.id}-${step.id}-${state.lessonAttempts.length}`,
          lessonId: lesson.id,
          stepId: step.id,
          conceptIds: evidenceConceptIds(step.concepts, lesson.curriculum?.concepts, step.id),
          kind: mode === 'guided' ? 'guided-success' : 'transfer',
          outcome: 'passed',
          timestamp: Date.now(),
        }
        learningEvidence = [...learningEvidence, evidence]
        saveLearningEvidence(learningEvidence)
      }
    }

    set({
      gitState: structuredClone(newGitState),
      commandHistory: newHistory,
      historyIndex,
      lastCommandInsight: insight,
      lastPrediction: state.predictedLayers,
      lastPredictionMade: state.predictionMade,
      predictedLayers: [],
      predictionMade: false,
      lessonAttempts: attempts,
      learningEvidence,
    })

    if (lessonCompleted && step) {
      set({ pendingReflectionStepId: step.id })
      get().addTerminalLine(
        'system',
        `🔎 Experiment complete. Inspect what changed, then explain the result to secure “${step.title}”.`,
      )
    } else if (assessed && !result.success) {
      get().addTerminalLine(
        'system',
        '🧪 Attempt recorded as evidence. The lesson did not advance; inspect the error and retry.',
      )
    }
    return result
  },

  completeKnowledgeStep: (result) => {
    const state = get()
    const lesson = lessonProvider.getLesson(state.currentLessonId || '')
    const step = lesson?.steps[state.currentStepIndex]
    if (!lesson || !step) return

    const key = `${lesson.id}/${step.id}`
    const checkpointResults = { ...state.checkpointResults, [key]: result }
    saveCheckpointResults(checkpointResults)
    const evidence: LearningEvidence = {
      id: `${Date.now()}-${lesson.id}-${step.id}-retrieval`,
      lessonId: lesson.id,
      stepId: step.id,
      conceptIds: evidenceConceptIds(step.concepts, lesson.curriculum?.concepts, step.id),
      kind: 'retrieval',
      outcome: result === 'passed' ? 'passed' : 'missed',
      timestamp: Date.now(),
    }
    const learningEvidence = [...state.learningEvidence, evidence]
    saveLearningEvidence(learningEvidence)
    set({ checkpointResults, learningEvidence })

    if (result === 'passed') {
      set({ pendingReflectionStepId: null })
      get().completeCurrentStep()
    } else {
      get().addTerminalLine('system', '↩ Review the evidence once more, then try the explanation checkpoint again.')
    }
  },

  setPredictedLayers: (layers) => set({ predictedLayers: layers, predictionMade: true }),

  predictNoStateChange: () => set({ predictedLayers: [], predictionMade: true }),

  revealNextHint: () => {
    const state = get()
    const lesson = lessonProvider.getLesson(state.currentLessonId || '')
    const step = lesson?.steps[state.currentStepIndex]
    if (!lesson || !step || !step.progressiveHints?.length) return
    const key = `${lesson.id}/${step.id}`
    const currentLevel = state.hintLevels[key] ?? 0
    const nextLevel = Math.min(step.progressiveHints.length, currentLevel + 1)
    if (nextLevel === currentLevel) return
    const evidence: LearningEvidence = {
      id: `${Date.now()}-${lesson.id}-${step.id}-hint-${nextLevel}`,
      lessonId: lesson.id,
      stepId: step.id,
      conceptIds: evidenceConceptIds(step.concepts, lesson.curriculum?.concepts, step.id),
      kind: 'hint',
      outcome: 'used',
      timestamp: Date.now(),
      hintLevel: nextLevel,
    }
    const learningEvidence = [...state.learningEvidence, evidence]
    saveLearningEvidence(learningEvidence)
    set({ hintLevels: { ...state.hintLevels, [key]: nextLevel }, learningEvidence })
  },

  selectCommit: (id) => {
    const shouldOpenEvidence = id !== null && typeof window !== 'undefined' && window.innerWidth >= 1320
    set({
      selectedCommitId: id,
      ...(id ? { activeTab: 'detail' as const } : {}),
      ...(shouldOpenEvidence ? { evidenceOpen: true, focusMode: false } : {}),
    })
  },

  syncState: () => set({ gitState: backendSnapshot(get().backend) }),

  addTerminalLine: (type, text) =>
    set((state) => ({
      terminalLines: [...state.terminalLines, { type, text, timestamp: Date.now() }],
    })),

  clearTerminal: () => set({ terminalLines: [] }),

  navigateHistory: (direction) => {
    const state = get()
    const history = state.commandHistory
    if (history.length === 0) return ''

    let newIndex = state.historyIndex
    if (direction === 'up') {
      newIndex = Math.min(newIndex + 1, history.length - 1)
    } else {
      newIndex = Math.max(newIndex - 1, -1)
    }

    set({ historyIndex: newIndex })
    return newIndex === -1 ? '' : history[history.length - 1 - newIndex]
  },

  setCurrentLesson: (lessonId) => set({ currentLessonId: lessonId, currentStepIndex: 0 }),

  completeCurrentStep: () => {
    const state = get()
    const lesson = lessonProvider.getLesson(state.currentLessonId || '')
    if (!lesson) return

    const step = lesson.steps[state.currentStepIndex]
    if (!step) return

    const newCompleted = new Set(state.completedSteps)
    newCompleted.add(step.id)

    const nextIndex = state.currentStepIndex + 1
    if (nextIndex >= lesson.steps.length) {
      state.addTerminalLine('system', `🎉 Lesson "${lesson.title}" completed! Great job!`)
      const newCompletedLessons = new Set(state.completedLessons)
      newCompletedLessons.add(lesson.id)
      const newProgress = {
        ...state.lessonProgress,
        [lesson.id]: Math.max(state.lessonProgress[lesson.id] ?? 0, lesson.steps.length),
      }
      saveLessonProgress(newProgress)
      set({
        completedSteps: newCompleted,
        completedLessons: newCompletedLessons,
        currentStepIndex: lesson.steps.length - 1,
        lessonProgress: newProgress,
      })
    } else {
      const nextStep = lesson.steps[nextIndex]
      state.addTerminalLine('system', `✅ Step complete! Next: ${nextStep.title} — ${nextStep.hint}`)
      const newProgress = {
        ...state.lessonProgress,
        [lesson.id]: Math.max(state.lessonProgress[lesson.id] ?? 0, nextIndex),
      }
      saveLessonProgress(newProgress)
      set({
        completedSteps: newCompleted,
        currentStepIndex: nextIndex,
        lessonProgress: newProgress,
      })
    }
  },

  setSidebarOpen: (open) =>
    set((state) => ({
      sidebarOpen: open,
      focusMode: open ? false : state.focusMode,
      evidenceOpen: open && typeof window !== 'undefined' && window.innerWidth < 992 ? false : state.evidenceOpen,
    })),
  setEvidenceOpen: (open) =>
    set((state) => ({
      evidenceOpen: open,
      focusMode: open ? false : state.focusMode,
      sidebarOpen: open && typeof window !== 'undefined' && window.innerWidth < 992 ? false : state.sidebarOpen,
    })),
  setFocusMode: (open) => set({ focusMode: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  resetAll: () => {
    const newBackend = new GitSimulator()
    set({
      backend: newBackend,
      gitState: backendSnapshot(newBackend),
      selectedCommitId: null,
      terminalLines: [
        {
          type: 'system',
          text: '🔄 Repository reset! Type "git init" to start fresh.',
          timestamp: Date.now(),
        },
      ],
      commandHistory: [],
      historyIndex: -1,
      currentLessonId: null,
      currentStepIndex: 0,
      completedSteps: new Set<string>(),
      completedLessons: new Set<string>(),
      lessonProgress: {},
      checkpointResults: {},
      predictedLayers: [],
      predictionMade: false,
      lastPrediction: [],
      lastPredictionMade: false,
      lastCommandInsight: null,
      pendingReflectionStepId: null,
      lessonAttempts: [],
      learningEvidence: [],
      hintLevels: {},
    })
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LESSON_PROGRESS_KEY)
      localStorage.removeItem(CHECKPOINT_RESULTS_KEY)
      localStorage.removeItem(LEARNING_EVIDENCE_KEY)
    }
  },
  loadLesson: (lessonId, options) => {
    const lesson = lessonProvider.getLesson(lessonId)
    if (!lesson) return
    const persistedProgress = get().lessonProgress[lessonId] ?? 0
    const stateProgress = options?.restart ? 0 : persistedProgress

    const newBackend = new GitSimulator()
    const scenario = lesson.curriculum ? getScenario(lesson.curriculum.scenarioId) : undefined

    const scenarioFailures = scenario ? loadScenario(newBackend, scenario) : []

    // Legacy lessons continue through the compatibility fields during migration.
    if (!scenario && lesson.initialFiles) {
      newBackend.init()
      // Override the working directory
      const backendState = newBackend.getState()
      backendState.working = { ...lesson.initialFiles }
      newBackend.loadState(backendState)
    }

    // Legacy remote fixtures remain supported until their lessons migrate to scenarios.
    if (!scenario?.remoteSetup && lesson.remoteSetup) {
      const backendState = newBackend.getState()
      if (!backendState.initialized) {
        newBackend.init()
      }

      // Add the remote
      newBackend.addRemote(lesson.remoteSetup.remoteName, lesson.remoteSetup.url)

      // Populate remote with commits
      const remoteState = newBackend.getState()
      const remote = remoteState.remotes[lesson.remoteSetup.remoteName]

      let parentIds: string[] = []
      for (const rc of lesson.remoteSetup.remoteCommits) {
        const id = generateId()
        const commit: GitCommit = {
          id,
          shortId: shortId(id),
          message: rc.message,
          parentIds,
          author: 'Chef <chef@recipe-book.git>',
          timestamp:
            now() - (lesson.remoteSetup.remoteCommits.length - lesson.remoteSetup.remoteCommits.indexOf(rc)) * 60000,
          tree: rc.files,
          branchLabel: `${lesson.remoteSetup.remoteName}/${lesson.remoteSetup.branchName}`,
        }
        remote.commits[id] = commit
        parentIds = [id]
      }

      // Set the remote branch to point to the last commit
      const lastRemoteCommitId = parentIds[0]
      remote.branches[lesson.remoteSetup.branchName] = {
        name: lesson.remoteSetup.branchName,
        commitId: lastRemoteCommitId,
        color: REMOTE_BRANCH_COLOR,
        isRemote: true,
        tracksRemote: lesson.remoteSetup.remoteName,
      }

      newBackend.loadState(remoteState)
    }

    set({
      backend: newBackend,
      gitState: backendSnapshot(newBackend),
      selectedCommitId: null,
      terminalLines: [
        {
          type: 'system',
          text: `📚 Starting lesson: "${lesson.title}"\n${lesson.description}\n\n💡 Hint: ${lesson.steps[0]?.hint || 'Follow the steps!'}${scenarioFailures.length ? `\n\n⚠ Scenario setup issue: ${scenarioFailures.join('; ')}` : ''}`,
          timestamp: Date.now(),
        },
      ],
      commandHistory: [],
      historyIndex: -1,
      currentLessonId: lessonId,
      currentStepIndex: Math.min(stateProgress, Math.max(lesson.steps.length - 1, 0)),
      completedSteps: new Set(lesson.steps.slice(0, stateProgress).map((step) => step.id)),
      predictedLayers: [],
      predictionMade: false,
      lastPrediction: [],
      lastPredictionMade: false,
      lastCommandInsight: null,
      pendingReflectionStepId: null,
      lessonAttempts: [],
      hintLevels: {},
    })
  },

  restartCurrentLesson: () => {
    const lessonId = get().currentLessonId
    if (lessonId) get().loadLesson(lessonId, { restart: true })
  },

  setHelpPanel: (open, topic) => set({ helpPanelOpen: open, helpTopic: topic ?? null }),

  switchBackend: (type) => {
    const newBackend = createBackend(type)
    set({
      backend: newBackend,
      gitState: backendSnapshot(newBackend),
      selectedCommitId: null,
    })
    get().addTerminalLine('system', `Switched to ${type} backend`)
  },
}))

// ─── Lesson Progress Check ───────────────────────────────────────────────────

function checkLessonProgress(rawCommand: string, state: GitStore): boolean {
  const lessonId = state.currentLessonId
  if (!lessonId) return false
  const lesson = lessonProvider.getLesson(lessonId)
  if (!lesson) return false

  const step = lesson.steps[state.currentStepIndex]
  if (!step) return false

  return lessonProvider.validateStep(
    lessonId,
    state.currentStepIndex,
    rawCommand,
    state.backend.getState() as unknown as Record<string, unknown>,
  )
}
