import { useGitStore } from '@/stores/git-store'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
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
    await user.click(screen.getByRole('button', { name: /I can explain it/i }))

    expect(useGitStore.getState().currentStepIndex).toBe(1)
    expect(useGitStore.getState().checkpointResults['orientation/why-git']).toBe('passed')
  })

  it('pauses a valid command for evidence-based reflection', async () => {
    const user = userEvent.setup()
    useGitStore.getState().loadLesson('basics')
    useGitStore.getState().setPredictedLayers(['refs'])
    useGitStore.getState().executeCommand('git init')
    render(<LearningMission />)

    expect(useGitStore.getState().currentStepIndex).toBe(0)
    expect(screen.getByText('Secure the mechanism')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /I can explain it/i }))

    expect(useGitStore.getState().currentStepIndex).toBe(1)
    expect(useGitStore.getState().pendingReflectionStepId).toBeNull()
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

  it('compares a prediction with actual command evidence', () => {
    useGitStore.getState().setPredictedLayers(['refs'])
    useGitStore.getState().executeCommand('git init')
    render(<CommandInsightPanel />)

    expect(screen.getByText('Create the repository memory')).toBeInTheDocument()
    expect(screen.getByText(/Predicted: branches & HEAD/i)).toBeInTheDocument()
    expect(screen.getByText(/Actual:/i)).toBeInTheDocument()
  })
})
