import { describe, it, expect, beforeEach } from 'vitest';
import { useGitStore } from '../git-store';

describe('GitStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGitStore.getState().resetAll();
  });

  // ─── Initial State ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useGitStore.getState();
      expect(state.gitState.initialized).toBe(false);
      expect(state.selectedCommitId).toBeNull();
      expect(state.terminalLines.length).toBeGreaterThan(0);
      expect(state.commandHistory).toEqual([]);
      expect(state.historyIndex).toBe(-1);
      expect(state.currentLessonId).toBeNull();
      expect(state.currentStepIndex).toBe(0);
      expect(state.sidebarOpen).toBe(true);
      expect(state.helpPanelOpen).toBe(false);
    });
  });

  // ─── executeCommand ──────────────────────────────────────────────────────

  describe('executeCommand', () => {
    it('processes git init', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');

      const newState = useGitStore.getState();
      expect(newState.gitState.initialized).toBe(true);
    });

    it('adds to terminal lines', () => {
      const store = useGitStore.getState();
      const initialLines = store.terminalLines.length;
      store.executeCommand('git init');

      const newState = useGitStore.getState();
      expect(newState.terminalLines.length).toBeGreaterThan(initialLines);
      // Should have input line and output line
      expect(newState.terminalLines.some((l) => l.type === 'input')).toBe(true);
    });

    it('adds to command history', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');

      const newState = useGitStore.getState();
      expect(newState.commandHistory).toContain('git init');
    });
  });

  // ─── navigateHistory ─────────────────────────────────────────────────────

  describe('navigateHistory', () => {
    it('navigates up through history', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');
      store.executeCommand('git status');

      const result = useGitStore.getState().navigateHistory('up');
      expect(result).toBe('git status');
    });

    it('navigates down through history', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');
      store.executeCommand('git status');

      useGitStore.getState().navigateHistory('up');
      useGitStore.getState().navigateHistory('up');
      const result = useGitStore.getState().navigateHistory('down');
      expect(result).toBe('git status');
    });

    it('returns empty string when no history', () => {
      const result = useGitStore.getState().navigateHistory('up');
      expect(result).toBe('');
    });
  });

  // ─── selectCommit ────────────────────────────────────────────────────────

  describe('selectCommit', () => {
    it('sets selectedCommitId', () => {
      useGitStore.getState().selectCommit('abc123');
      expect(useGitStore.getState().selectedCommitId).toBe('abc123');
    });

    it('clears with null', () => {
      useGitStore.getState().selectCommit('abc123');
      useGitStore.getState().selectCommit(null);
      expect(useGitStore.getState().selectedCommitId).toBeNull();
    });
  });

  // ─── resetAll ────────────────────────────────────────────────────────────

  describe('resetAll', () => {
    it('resets to clean state', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');
      store.executeCommand('git add .');

      useGitStore.getState().resetAll();

      const newState = useGitStore.getState();
      expect(newState.gitState.initialized).toBe(false);
      expect(newState.commandHistory).toEqual([]);
      expect(newState.currentLessonId).toBeNull();
      expect(newState.selectedCommitId).toBeNull();
    });
  });

  // ─── loadLesson ──────────────────────────────────────────────────────────

  describe('loadLesson', () => {
    it('sets up lesson state', () => {
      useGitStore.getState().loadLesson('basics');

      const newState = useGitStore.getState();
      expect(newState.currentLessonId).toBe('basics');
      expect(newState.currentStepIndex).toBe(0);
      expect(newState.terminalLines.some((l) => l.type === 'system')).toBe(true);
    });

    it('resets command history on lesson load', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');

      useGitStore.getState().loadLesson('basics');
      expect(useGitStore.getState().commandHistory).toEqual([]);
    });
  });

  // ─── completeCurrentStep ─────────────────────────────────────────────────

  describe('completeCurrentStep', () => {
    it('advances step when lesson is loaded', () => {
      useGitStore.getState().loadLesson('basics');
      expect(useGitStore.getState().currentStepIndex).toBe(0);

      useGitStore.getState().completeCurrentStep();
      expect(useGitStore.getState().currentStepIndex).toBe(1);
    });
  });

  // ─── setHelpPanel ────────────────────────────────────────────────────────

  describe('setHelpPanel', () => {
    it('opens help panel', () => {
      useGitStore.getState().setHelpPanel(true);
      expect(useGitStore.getState().helpPanelOpen).toBe(true);
    });

    it('closes help panel', () => {
      useGitStore.getState().setHelpPanel(true);
      useGitStore.getState().setHelpPanel(false);
      expect(useGitStore.getState().helpPanelOpen).toBe(false);
    });

    it('sets help topic', () => {
      useGitStore.getState().setHelpPanel(true, 'git init');
      expect(useGitStore.getState().helpTopic).toBe('git init');
    });
  });

  // ─── clearTerminal ───────────────────────────────────────────────────────

  describe('clearTerminal', () => {
    it('clears terminal lines', () => {
      const store = useGitStore.getState();
      store.executeCommand('git init');
      expect(useGitStore.getState().terminalLines.length).toBeGreaterThan(0);

      useGitStore.getState().clearTerminal();
      expect(useGitStore.getState().terminalLines).toEqual([]);
    });
  });

  // ─── setSidebarOpen ──────────────────────────────────────────────────────

  describe('setSidebarOpen', () => {
    it('toggles sidebar', () => {
      useGitStore.getState().setSidebarOpen(false);
      expect(useGitStore.getState().sidebarOpen).toBe(false);

      useGitStore.getState().setSidebarOpen(true);
      expect(useGitStore.getState().sidebarOpen).toBe(true);
    });
  });

  // ─── setActiveTab ────────────────────────────────────────────────────────

  describe('setActiveTab', () => {
    it('changes active tab', () => {
      useGitStore.getState().setActiveTab('files');
      expect(useGitStore.getState().activeTab).toBe('files');

      useGitStore.getState().setActiveTab('detail');
      expect(useGitStore.getState().activeTab).toBe('detail');
    });
  });
});
