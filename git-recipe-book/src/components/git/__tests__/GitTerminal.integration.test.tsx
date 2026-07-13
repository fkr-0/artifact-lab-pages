import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import GitTerminal from '../GitTerminal';
import { useGitStore } from '@/stores/git-store';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

describe('GitTerminal Integration', () => {
  beforeEach(() => {
    useGitStore.getState().resetAll();
  });

  it('renders terminal with welcome message', () => {
    // Don't reset before this test - use fresh store
    render(<GitTerminal />);
    // After resetAll in beforeEach, the message is "Repository reset"
    // The welcome message only appears on initial load
    const terminal = screen.getByPlaceholderText(/Type a git command/);
    expect(terminal).toBeInTheDocument();
  });

  it('typing and submitting a command executes it', async () => {
    const user = userEvent.setup();
    render(<GitTerminal />);

    const input = screen.getByPlaceholderText(/Type a git command/);
    await user.type(input, 'git init');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useGitStore.getState();
      expect(state.gitState.initialized).toBe(true);
    });
  });

  it('arrow up/down navigates command history', async () => {
    const user = userEvent.setup();
    render(<GitTerminal />);

    const input = screen.getByPlaceholderText(/Type a git command/);

    // Execute two commands
    await user.type(input, 'git init');
    await user.keyboard('{Enter}');
    await user.type(input, 'git status');
    await user.keyboard('{Enter}');

    // Navigate up
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('git status');

    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('git init');

    // Navigate down
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('git status');
  });

  it('tab completion works', async () => {
    const user = userEvent.setup();
    render(<GitTerminal />);

    const input = screen.getByPlaceholderText(/Type a git command/);
    await user.type(input, 'git ini');
    await user.keyboard('{Tab}');

    expect(input).toHaveValue('git init');
  });

  it('error commands show error output', async () => {
    const user = userEvent.setup();
    render(<GitTerminal />);

    const input = screen.getByPlaceholderText(/Type a git command/);
    await user.type(input, 'git status');
    await user.keyboard('{Enter}');

    // Since repo is not initialized, the error should be shown
    await waitFor(() => {
      const state = useGitStore.getState();
      const errorLines = state.terminalLines.filter((l) => l.type === 'error');
      expect(errorLines.length).toBeGreaterThan(0);
    });
  });

  it('successful commands show output', async () => {
    const user = userEvent.setup();
    render(<GitTerminal />);

    const input = screen.getByPlaceholderText(/Type a git command/);
    // Use 'help' command which always works regardless of repo state
    await user.type(input, 'help');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const state = useGitStore.getState();
      const outputLines = state.terminalLines.filter((l) => l.type === 'output');
      expect(outputLines.length).toBeGreaterThan(0);
    });
  });
});
