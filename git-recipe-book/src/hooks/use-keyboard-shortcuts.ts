import { useEffect, useCallback } from 'react';
import { useGitStore } from '@/stores/git-store';

interface KeyboardShortcuts {
  onToggleHelp?: () => void;
  onToggleSidebar?: () => void;
  onFocusTerminal?: () => void;
  onClearTerminal?: () => void;
}

export function useKeyboardShortcuts(shortcuts?: KeyboardShortcuts) {
  const { setHelpPanel, setSidebarOpen, sidebarOpen, clearTerminal } = useGitStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except specific combos)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Ctrl+/ — Toggle help panel
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (shortcuts?.onToggleHelp) {
          shortcuts.onToggleHelp();
        } else {
          const { helpPanelOpen } = useGitStore.getState();
          setHelpPanel(!helpPanelOpen);
        }
        return;
      }

      // Ctrl+b — Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        if (shortcuts?.onToggleSidebar) {
          shortcuts.onToggleSidebar();
        } else {
          setSidebarOpen(!useGitStore.getState().sidebarOpen);
        }
        return;
      }

      // Ctrl+l — Focus terminal (works even in inputs)
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (shortcuts?.onFocusTerminal) {
          shortcuts.onFocusTerminal();
        } else {
          const input = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Type a git command"]'
          );
          input?.focus();
        }
        return;
      }

      // Ctrl+k — Clear terminal (works even in inputs)
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (shortcuts?.onClearTerminal) {
          shortcuts.onClearTerminal();
        } else {
          clearTerminal();
        }
        return;
      }
    },
    [setHelpPanel, setSidebarOpen, clearTerminal, shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUT_HELP = [
  { keys: 'Ctrl+/', description: 'Toggle help panel' },
  { keys: 'Ctrl+b', description: 'Toggle sidebar' },
  { keys: 'Ctrl+l', description: 'Focus terminal' },
  { keys: 'Ctrl+k', description: 'Clear terminal' },
];
