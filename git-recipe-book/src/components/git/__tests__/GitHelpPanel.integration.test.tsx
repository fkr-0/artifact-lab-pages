import { useGitStore } from '@/stores/git-store'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GitHelpPanel from '../GitHelpPanel'

vi.mock('framer-motion', async () => {
  const React = await import('react')
  const motionElement =
    (tag: 'div' | 'button' | 'dialog') =>
    ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
      React.createElement(tag, props, children)

  return {
    motion: {
      div: motionElement('div'),
      button: motionElement('button'),
      dialog: motionElement('dialog'),
    },
    AnimatePresence: ({ children }: PropsWithChildren) => children,
  }
})

describe('GitHelpPanel Integration', () => {
  beforeEach(() => {
    useGitStore.getState().resetAll()
    useGitStore.getState().setHelpPanel(true)
  })

  it('help panel opens and closes', async () => {
    const user = userEvent.setup()
    render(<GitHelpPanel />)

    expect(screen.getByRole('heading', { name: 'Git Help & Reference' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close Git help and reference' }))

    expect(useGitStore.getState().helpPanelOpen).toBe(false)
  })

  it('search filters help texts', async () => {
    const user = userEvent.setup()
    render(<GitHelpPanel />)
    const dialog = screen.getByRole('dialog')

    await user.type(within(dialog).getByPlaceholderText('Search commands, terms, concepts...'), 'init')

    await waitFor(() => {
      expect(within(dialog).getAllByText('git init', { exact: true }).length).toBeGreaterThan(0)
    })
  })

  it('tab switching works between commands/glossary/concepts', async () => {
    const user = userEvent.setup()
    render(<GitHelpPanel />)
    const dialog = screen.getByRole('dialog')

    await user.click(within(dialog).getByRole('button', { name: 'Glossary' }))
    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { name: /^Repository$/ })).toBeInTheDocument()
    })

    await user.click(within(dialog).getByRole('button', { name: 'Concepts' }))
    await waitFor(() => {
      expect(within(dialog).getByText('The Three States', { exact: true })).toBeInTheDocument()
    })

    await user.click(within(dialog).getByRole('button', { name: 'Commands' }))
    await waitFor(() => {
      expect(within(dialog).getAllByText('git init', { exact: true }).length).toBeGreaterThan(0)
    })
  })
})
