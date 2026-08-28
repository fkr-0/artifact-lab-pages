import { useGitStore } from '@/stores/git-store'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import GitLessonPanel from '../GitLessonPanel'

describe('GitLessonPanel Integration', () => {
  beforeEach(() => {
    useGitStore.getState().resetAll()
  })

  it('renders a progressive course path and can reveal the complete curriculum', async () => {
    const user = userEvent.setup()
    render(<GitLessonPanel />)

    expect(screen.getByText('Git Lessons')).toBeInTheDocument()
    expect(screen.getByText('Course progress')).toBeInTheDocument()
    expect(screen.getByText('Current learning path')).toBeInTheDocument()
    expect(screen.getByText(/^0\/\d+$/)).toBeInTheDocument()
    expect(screen.queryByText('Selective History & Mastery')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show full course/i }))
    expect(screen.getByText('Basics')).toBeInTheDocument()
    expect(screen.getByText('Recovery')).toBeInTheDocument()
    expect(screen.getByText('Selective History & Mastery')).toBeInTheDocument()
  })

  it('starts the first available lesson from its course card', async () => {
    const user = userEvent.setup()
    render(<GitLessonPanel />)

    await user.click(screen.getAllByRole('button', { name: /start lesson/i })[0])

    expect(useGitStore.getState().currentLessonId).toBe('orientation')
    expect(screen.getByRole('button', { name: /continue lesson/i })).toBeInTheDocument()
  })

  it('shows persisted step progress without duplicating lesson prose', async () => {
    const user = userEvent.setup()
    render(<GitLessonPanel />)

    await user.click(screen.getAllByRole('button', { name: /start lesson/i })[0])
    act(() => {
      useGitStore.getState().completeKnowledgeStep('passed')
    })

    await waitFor(() => expect(screen.getByText('1/5 steps')).toBeInTheDocument())
    expect(screen.queryByText('Before this command')).not.toBeInTheDocument()
  })

  it('keeps prerequisite lessons technically locked', () => {
    render(<GitLessonPanel />)

    const lockedButtons = screen.getAllByRole('button', { name: /prerequisite locked/i })
    expect(lockedButtons.length).toBeGreaterThan(0)
    expect(lockedButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)
  })

  it('shows an adaptive next-step recommendation', () => {
    render(<GitLessonPanel />)

    expect(screen.getByText(/Recommended next/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Git Orientation/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Next unlocked lesson/i)).toBeInTheDocument()
  })

  it('turns a mastered lesson into deliberate replay practice', async () => {
    const user = userEvent.setup()
    render(<GitLessonPanel />)
    await user.click(screen.getAllByRole('button', { name: /start lesson/i })[0])

    act(() => {
      useGitStore.getState().completeKnowledgeStep('passed')
      useGitStore.getState().completeKnowledgeStep('passed')
      useGitStore.getState().completeKnowledgeStep('passed')
      useGitStore.getState().completeKnowledgeStep('passed')
      useGitStore.getState().completeKnowledgeStep('passed')
    })

    expect(useGitStore.getState().completedLessons.has('orientation')).toBe(true)
    await waitFor(() => expect(screen.getByRole('button', { name: /practice again/i })).toBeInTheDocument())
  })
})
