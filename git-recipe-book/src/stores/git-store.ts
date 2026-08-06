import { IsoGitBackend } from '@/lib/backends/isomorphic-git-backend'
import { GitSimulator } from '@/lib/git-simulator'
import type { GitCommandResult, GitCommit, GitState } from '@/lib/git-types'
import { REMOTE_BRANCH_COLOR, generateId, now, shortId } from '@/lib/git-types'
import { HelpProvider } from '@/lib/help/help-provider'
import type { IGitBackend } from '@/lib/interfaces'
import { type CommandLearningInsight, type GitStateLayer, buildCommandInsight } from '@/lib/learning/git-learning-model'
import type { CheckpointResult } from '@/lib/learning/learning-advisor'
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
  loadLesson: (lessonId: string) => void
  setHelpPanel: (open: boolean, topic?: string | null) => void
  switchBackend: (type: 'simulator' | 'isomorphic-git') => void
}

const createBackend = (type: 'simulator' | 'isomorphic-git'): IGitBackend => {
  if (type === 'isomorphic-git') {
    return new IsoGitBackend() as IGitBackend
  }
  return new GitSimulator()
}

const defaultBackend = new GitSimulator()

// Load persisted lesson progress from localStorage
const LESSON_PROGRESS_KEY = 'git-recipe-book-lesson-progress'
const CHECKPOINT_RESULTS_KEY = 'git-recipe-book-checkpoint-results'

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
  gitState: defaultBackend.getState(),
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
  sidebarOpen: sidebarOpenByDefault(),
  evidenceOpen: false,
  focusMode: false,
  activeTab: 'graph',
  helpPanelOpen: false,
  helpTopic: null,

  executeCommand: (raw: string) => {
    const state = get()
    const beforeState = structuredClone(state.backend.getState())
    const result = state.backend.execute(raw)

    state.addTerminalLine('input', `$ ${raw}`)

    const newHistory = [...state.commandHistory, raw]
    const historyIndex = -1

    if (result.output === '__CLEAR__') {
      set({
        terminalLines: [],
        commandHistory: newHistory,
        historyIndex,
        gitState: state.backend.getState(),
        predictedLayers: [],
        predictionMade: false,
        lastPrediction: state.predictedLayers,
        lastPredictionMade: state.predictionMade,
        lastCommandInsight: buildCommandInsight(raw, beforeState, state.backend.getState(), result),
      })
      return result
    }

    if (result.success) {
      if (result.output) {
        state.addTerminalLine('output', result.output)
      }
    } else {
      state.addTerminalLine('error', result.error || 'Unknown error')
    }

    const newGitState = state.backend.getState()
    const insight = buildCommandInsight(raw, beforeState, newGitState, result)

    // Check lesson progress using the lesson provider
    const lessonCompleted = checkLessonProgress(raw, state)

    set({
      gitState: newGitState,
      commandHistory: newHistory,
      historyIndex,
      lastCommandInsight: insight,
      lastPrediction: state.predictedLayers,
      lastPredictionMade: state.predictionMade,
      predictedLayers: [],
      predictionMade: false,
    })

    if (lessonCompleted) {
      const lesson = lessonProvider.getLesson(state.currentLessonId || '')
      const step = lesson?.steps[state.currentStepIndex]
      if (step) {
        set({ pendingReflectionStepId: step.id })
        get().addTerminalLine(
          'system',
          `🔎 Experiment complete. Inspect what changed, then explain the result to secure “${step.title}”.`,
        )
      }
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
    set({ checkpointResults })

    if (result === 'passed') {
      set({ pendingReflectionStepId: null })
      get().completeCurrentStep()
    } else {
      get().addTerminalLine('system', '↩ Review the evidence once more, then try the explanation checkpoint again.')
    }
  },

  setPredictedLayers: (layers) => set({ predictedLayers: layers, predictionMade: true }),

  predictNoStateChange: () => set({ predictedLayers: [], predictionMade: true }),

  selectCommit: (id) => {
    const shouldOpenEvidence = id !== null && typeof window !== 'undefined' && window.innerWidth >= 1320
    set({
      selectedCommitId: id,
      ...(id ? { activeTab: 'detail' as const } : {}),
      ...(shouldOpenEvidence ? { evidenceOpen: true, focusMode: false } : {}),
    })
  },

  syncState: () => set({ gitState: get().backend.getState() }),

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
      const newProgress = { ...state.lessonProgress, [lesson.id]: lesson.steps.length }
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
      const newProgress = { ...state.lessonProgress, [lesson.id]: nextIndex }
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
      gitState: newBackend.getState(),
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
    })
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LESSON_PROGRESS_KEY)
      localStorage.removeItem(CHECKPOINT_RESULTS_KEY)
    }
  },
  loadLesson: (lessonId) => {
    const lesson = lessonProvider.getLesson(lessonId)
    if (!lesson) return
    const stateProgress = get().lessonProgress[lessonId] ?? 0

    const newBackend = new GitSimulator()

    // If the lesson has initial files, we need to init with those
    if (lesson.initialFiles) {
      newBackend.init()
      // Override the working directory
      const backendState = newBackend.getState()
      backendState.working = { ...lesson.initialFiles }
      newBackend.loadState(backendState)
    }

    // If the lesson has remote setup, configure it
    if (lesson.remoteSetup) {
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
      gitState: newBackend.getState(),
      selectedCommitId: null,
      terminalLines: [
        {
          type: 'system',
          text: `📚 Starting lesson: "${lesson.title}"\n${lesson.description}\n\n💡 Hint: ${lesson.steps[0]?.hint || 'Follow the steps!'}`,
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
    })
  },

  setHelpPanel: (open, topic) => set({ helpPanelOpen: open, helpTopic: topic ?? null }),

  switchBackend: (type) => {
    const newBackend = createBackend(type)
    set({
      backend: newBackend,
      gitState: newBackend.getState(),
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
