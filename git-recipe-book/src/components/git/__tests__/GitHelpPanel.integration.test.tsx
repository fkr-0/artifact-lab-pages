import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import GitHelpPanel from '../GitHelpPanel';
import { useGitStore } from '@/stores/git-store';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

describe('GitHelpPanel Integration', () => {
  beforeEach(() => {
    useGitStore.getState().resetAll();
    useGitStore.getState().setHelpPanel(true);
  });

  it('help panel opens and closes', async () => {
    const user = userEvent.setup();
    render(<GitHelpPanel />);

    expect(screen.getByText('Git Help & Reference')).toBeInTheDocument();

    // Close the panel
    const closeButton = screen.getByRole('button', { name: '' });
    // The close button is the X button in the header
    const closeButtons = screen.getAllByRole('button');
    // Find the one with X icon
    const xButton = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'));
    if (xButton) {
      await user.click(xButton);
    }

    expect(useGitStore.getState().helpPanelOpen).toBe(false);
  });

  it('search filters help texts', async () => {
    const user = userEvent.setup();
    render(<GitHelpPanel />);

    const searchInput = screen.getByPlaceholderText('Search commands, terms, concepts...');
    await user.type(searchInput, 'init');

    // Should filter to show init-related help
    await waitFor(() => {
      expect(screen.getByText('git init')).toBeInTheDocument();
    });
  });

  it('tab switching works between commands/glossary/concepts', async () => {
    const user = userEvent.setup();
    render(<GitHelpPanel />);

    // Click Glossary tab
    await user.click(screen.getByText('Glossary'));
    // Should show glossary entries
    await waitFor(() => {
      expect(screen.getByText('Repository')).toBeInTheDocument();
    });

    // Click Concepts tab
    await user.click(screen.getByText('Concepts'));
    // Should show concept entries
    await waitFor(() => {
      expect(screen.getByText('The Three States')).toBeInTheDocument();
    });

    // Click Commands tab
    await user.click(screen.getByText('Commands'));
    // Should show command entries
    await waitFor(() => {
      expect(screen.getByText('git init')).toBeInTheDocument();
    });
  });
});
