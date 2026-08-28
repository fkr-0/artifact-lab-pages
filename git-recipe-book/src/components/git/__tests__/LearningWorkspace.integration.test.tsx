import { ThemeProvider } from '@/hooks/use-theme'
import { useGitStore } from '@/stores/git-store'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import AppHeader from '../AppHeader'
import CommandInsightPanel from '../CommandInsightPanel'
import GitStateFlow from '../GitStateFlow'
import LearningCompass from '../LearningCompass'
import LearningMission from '../LearningMission'

describe('Learning workspace', () => {
  beforeEach(() => {
    useGitStore.getState().resetAll()
    useGitStore.getState().setFocusMode(false)
    useGitStore.getState().setSidebarOpen(true)
    useGitStore.getState().setEvidenceOpen(false)
  })

  it('keeps the appearance picker open until a theme is chosen and applies both theme families', async () => {
    const user = userEvent.setup()
    localStorage.removeItem('theme')
    localStorage.removeItem('git-recipe-book-theme')
    render(
      <ThemeProvider>
        <AppHeader />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Choose appearance theme' }))
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    await user.click(screen.getByRole('button', { name: /V11 Cyberpunk/i }))

    expect(document.body).toHaveAttribute('data-theme', 'v11-cyberpunk')
    expect(localStorage.getItem('theme')).toBe('v11-cyberpunk')

    await user.click(screen.getByRole('button', { name: 'Choose appearance theme' }))
    await user.click(screen.getByRole('button', { name: 'V11 Cyberpunk' }))
    await user.click(screen.getByRole('button', { name: /Professional dark theme/i }))

    expect(document.body).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('switches deliberately between course, evidence, and focus layouts', async () => {
    const user = userEvent.setup()
    render(<LearningCompass />)

    const course = screen.getByRole('button', { name: 'Course map' })
    const evidence = screen.getByRole('button', { name: 'Evidence drawer' })
    const focus = screen.getByRole('button', { name: 'Focus canvas' })

    expect(course).toHaveAttribute('aria-pressed', 'true')
    expect(evidence).toHaveAttribute('aria-pressed', 'false')

    await user.click(focus)
    expect(useGitStore.getState().focusMode).toBe(true)
    expect(course).toHaveAttribute('aria-pressed', 'false')

    await user.click(evidence)
    expect(useGitStore.getState().focusMode).toBe(false)
    expect(useGitStore.getState().evidenceOpen).toBe(true)
    expect(evidence).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens with a mental-model-first course invitation', () => {
    render(<LearningMission />)

    expect(screen.getByText(/Build a mental model, not a command collection/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start with Git Orientation/i })).toBeInTheDocument()
  })

  it('allows knowledge steps to complete through retrieval practice', async () => {
    const user = userEvent.setup()
    useGitStore.getState().loadLesson('orientation')
    render(<LearningMission />)

    expect(screen.getByText('Retrieval checkpoint')).toBeInTheDocument()
    const answers = screen.getByRole('group', { name: 'Retrieval check answers' })
    await user.click(answers.querySelector('button') as HTMLButtonElement)

    expect(useGitStore.getState().currentStepIndex).toBe(1)
    expect(useGitStore.getState().checkpointResults['orientation/why-git']).toBe('passed')
    expect(useGitStore.getState().learningEvidence.some((entry) => entry.kind === 'retrieval')).toBe(true)
  })

  it('pauses a valid command for evidence-based reflection', async () => {
    const user = userEvent.setup()
    useGitStore.getState().loadLesson('basics')
    useGitStore.getState().setPredictedLayers(['refs'])
    useGitStore.getState().executeCommand('git init')
    render(<LearningMission />)

    expect(useGitStore.getState().currentStepIndex).toBe(0)
    expect(screen.getByText('Secure the mechanism')).toBeInTheDocument()
    const answers = screen.getByRole('group', { name: 'Retrieval check answers' })
    await user.click(answers.querySelector('button') as HTMLButtonElement)

    expect(useGitStore.getState().currentStepIndex).toBe(1)
    expect(useGitStore.getState().pendingReflectionStepId).toBeNull()
  })

  it('reveals hints progressively and records hint dependence as learning evidence', async () => {
    const user = userEvent.setup()
    useGitStore.getState().loadLesson('basics')
    render(<LearningMission />)

    expect(screen.getByText('Hint ladder')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /reveal next hint/i }))
    expect(screen.getByText('1/3')).toBeInTheDocument()
    const learningEvidence = useGitStore.getState().learningEvidence
    expect(learningEvidence[learningEvidence.length - 1]).toMatchObject({ kind: 'hint', hintLevel: 1 })
  })

  it('labels recovery labs and exposes an explicit scenario reset separate from Git recovery commands', async () => {
    const user = userEvent.setup()
    useGitStore.getState().loadLesson('recovery-restore')
    render(<LearningMission />)

    expect(screen.getByText(/Recovery Lab · Recovery Lab: Working Tree & Index/)).toBeInTheDocument()
    const before = useGitStore.getState().gitState.working['README.md']
    act(() => {
      useGitStore.getState().backend.execute('edit README.md extra-lab-change')
      useGitStore.getState().syncState()
    })
    expect(useGitStore.getState().gitState.working['README.md']).not.toBe(before)
    await user.click(screen.getByRole('button', { name: /reset lab/i }))
    expect(useGitStore.getState().gitState.working['README.md']).toBe(before)
  })

  it('visualizes the five Git layers and highlights changed evidence', () => {
    useGitStore.getState().executeCommand('git init')
    render(<GitStateFlow />)

    expect(screen.getByText('Working tree')).toBeInTheDocument()
    expect(screen.getByText('Staging area')).toBeInTheDocument()
    expect(screen.getByText('Commit history')).toBeInTheDocument()
    expect(screen.getByText('Branches & HEAD')).toBeInTheDocument()
    expect(screen.getByText('Remote repository')).toBeInTheDocument()
    expect(document.querySelectorAll('.git-state-layer.is-changed').length).toBeGreaterThan(0)
  })

  it('contextually emphasizes the layer targeted by the current lesson mechanism', () => {
    useGitStore.getState().loadLesson('basics')
    render(<GitStateFlow />)

    const refsLayer = document.querySelector('.git-state-layer[data-layer="refs"]')
    expect(refsLayer).toHaveClass('is-contextual')
    expect(refsLayer).toHaveTextContent('lesson focus')
  })

  it('compares a prediction with actual command evidence', () => {
    useGitStore.getState().setPredictedLayers(['refs'])
    useGitStore.getState().executeCommand('git init')
    render(<CommandInsightPanel />)

    expect(screen.getByText('Create the repository memory')).toBeInTheDocument()
    expect(screen.getByText(/Predicted: branches & HEAD/i)).toBeInTheDocument()
    expect(screen.getByText(/Actual:/i)).toBeInTheDocument()
  })
})
