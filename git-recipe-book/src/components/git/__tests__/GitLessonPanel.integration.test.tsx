import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import GitLessonPanel from '../GitLessonPanel';
import { useGitStore } from '@/stores/git-store';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

describe('GitLessonPanel Integration', () => {
  beforeEach(() => {
    useGitStore.getState().resetAll();
  });

  it('renders lesson categories', () => {
    render(<GitLessonPanel />);
    expect(screen.getByText('Git Lessons')).toBeInTheDocument();
    expect(screen.getByText('Basics')).toBeInTheDocument();
  });

  it('clicking a lesson loads it', async () => {
    const user = userEvent.setup();
    render(<GitLessonPanel />);

    // Find and click the "Start Lesson" button for the basics lesson
    const startButtons = screen.getAllByText('Start Lesson');
    await user.click(startButtons[0]);

    const state = useGitStore.getState();
    expect(state.currentLessonId).toBeTruthy();
  });

  it('lesson steps show progress', async () => {
    const user = userEvent.setup();
    render(<GitLessonPanel />);

    // Start the basics lesson
    const startButtons = screen.getAllByText('Start Lesson');
    await user.click(startButtons[0]);

    // Should show step titles
    await waitFor(() => {
      expect(screen.getByText('Why Git Exists')).toBeInTheDocument();
    });
  });

  it('restart button works', async () => {
    const user = userEvent.setup();
    render(<GitLessonPanel />);

    // Start the basics lesson
    const startButtons = screen.getAllByText('Start Lesson');
    await user.click(startButtons[0]);

    // Should show restart button after lesson is loaded
    await waitFor(() => {
      expect(screen.getByText('Restart Lesson')).toBeInTheDocument();
    });

    // Click restart
    await user.click(screen.getByText('Restart Lesson'));

    const state = useGitStore.getState();
    expect(state.currentStepIndex).toBe(0);
  });


  it('shows an adaptive next-step recommendation', async () => {
    render(<GitLessonPanel />);

    expect(await screen.findByText(/Recommended next/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Git Orientation/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Next unlocked lesson/i)).toBeInTheDocument();
  });

  it('renders beginner tool explanations before the active command hint', async () => {
    const user = userEvent.setup();
    render(<GitLessonPanel />);

    const startButtons = screen.getAllByText('Start Lesson');
    await user.click(startButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Before this command')).toBeInTheDocument();
      expect(screen.getByText(/A system for recording project history/i)).toBeInTheDocument();
      expect(screen.getByText(/You know the human reason for Git/i)).toBeInTheDocument();
    });
  });

});
