import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGitStore } from '@/stores/git-store';
import { motion, AnimatePresence } from 'framer-motion';
import { lessonProvider } from '@/stores/git-store';

export default function GitTerminal() {
  const { terminalLines, executeCommand, navigateHistory, gitState, currentLessonId, currentStepIndex } = useGitStore();
  const [input, setInput] = useState('');
  const [showCompletions, setShowCompletions] = useState(false);
  const [completions, setCompletions] = useState<string[]>([]);
  const [completionIndex, setCompletionIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [lastExitCode, setLastExitCode] = useState<'success' | 'error' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Blinking cursor animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Get current branch name for prompt
  const branchName = gitState.HEAD.type === 'branch' ? gitState.HEAD.ref : 'detached';

  // Get current lesson hint for contextual hinting
  const currentLesson = lessonProvider.getLesson(currentLessonId || '');
  const currentStep = currentLesson?.steps[currentStepIndex];

  const getCompletions = useCallback(
    (text: string): string[] => {
      const allCompletions = [
        'git init', 'git add .', 'git commit -m ""', 'git status', 'git log',
        'git log --oneline', 'git branch ', 'git checkout ', 'git switch ',
        'git merge ', 'git rebase ', 'git stash', 'git stash pop', 'git stash list',
        'git tag ', 'git diff', 'git diff --staged', 'git reset --hard HEAD~1',
        'git reset --soft HEAD~1', 'git cherry-pick ', 'git remote add ',
        'git remote -v', 'git remote remove ', 'git branch -r',
        'git fetch ', 'git pull ', 'git push ',
        'help', 'clear',
      ];

      const remoteNames = Object.keys(gitState.remotes);
      const branchNames = Object.keys(gitState.branches).filter(b => !gitState.branches[b].isRemote);

      for (const remote of remoteNames) {
        allCompletions.push(`git fetch ${remote}`);
        allCompletions.push(`git pull ${remote}`);
        allCompletions.push(`git push ${remote}`);
      }

      for (const remote of remoteNames) {
        for (const branch of branchNames) {
          allCompletions.push(`git push ${remote} ${branch}`);
          allCompletions.push(`git pull ${remote} ${branch}`);
        }
      }

      return allCompletions.filter((c) => c.startsWith(text) && c !== text);
    },
    [gitState]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      // Execute command and track exit code
      const state = useGitStore.getState();
      const result = state.backend.execute(input.trim());
      executeCommand(input.trim());
      setLastExitCode(result.success ? 'success' : 'error');

      // Clear completions
      setShowCompletions(false);
      setInput('');
    },
    [input, executeCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = navigateHistory('up');
        setInput(prev);
        setShowCompletions(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = navigateHistory('down');
        setInput(next);
        setShowCompletions(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (showCompletions && completions.length > 0) {
          // Select current completion
          setInput(completions[completionIndex]);
          setShowCompletions(false);
        } else {
          // Show completion dropdown
          const matches = getCompletions(input);
          if (matches.length > 0) {
            setCompletions(matches);
            setCompletionIndex(0);
            setShowCompletions(true);
            if (matches.length === 1) {
              setInput(matches[0]);
              setShowCompletions(false);
            }
          }
        }
      } else if (e.key === 'Escape') {
        setShowCompletions(false);
      } else if (e.key === 'c' && e.ctrlKey) {
        // Ctrl+C - cancel current input
        e.preventDefault();
        setInput('');
        setShowCompletions(false);
        useGitStore.getState().addTerminalLine('input', `$ ${input}^C`);
      } else {
        setShowCompletions(false);
      }
    },
    [input, navigateHistory, gitState, showCompletions, completions, completionIndex, getCompletions]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInput(value);
      setLastExitCode(null);

      // Update completions as user types
      if (value.length > 0) {
        const matches = getCompletions(value);
        setCompletions(matches);
        setCompletionIndex(0);
      } else {
        setShowCompletions(false);
      }
    },
    [getCompletions]
  );

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="h-full flex flex-col bg-[#1a1b26] rounded-lg overflow-hidden border border-[#2a2b3d] shadow-lg"
      onClick={focusInput}
    >
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#16171f] border-b border-[#2a2b3d]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-xs text-[#565f89] font-mono ml-2">git-terminal — recipe-book</span>
        {lastExitCode && (
          <span className={`ml-auto text-xs font-mono ${lastExitCode === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {lastExitCode === 'success' ? '✓' : '✗'}
          </span>
        )}
      </div>

      {/* Terminal Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1 custom-scrollbar">
        <AnimatePresence initial={false}>
          {terminalLines.map((line, i) => (
            <motion.div
              key={`${line.timestamp}-${i}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`whitespace-pre-wrap break-words ${
                line.type === 'input'
                  ? 'text-[#7aa2f7] font-semibold'
                  : line.type === 'error'
                  ? 'text-[#f7768e]'
                  : line.type === 'system'
                  ? 'text-[#9ece6a] italic'
                  : 'text-[#a9b1d6]'
              }`}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Contextual hint for lesson */}
        {currentStep && terminalLines.length > 0 && terminalLines[terminalLines.length - 1]?.type === 'error' && (
          <div className="text-[#565f89] text-xs mt-1">
            💡 Hint: {currentStep.hint}
          </div>
        )}
      </div>

      {/* Input Line */}
      <form onSubmit={handleSubmit} className="relative">
        {/* Completion dropdown */}
        <AnimatePresence>
          {showCompletions && completions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 right-0 bg-[#16171f] border border-[#2a2b3d] rounded-t-lg max-h-32 overflow-y-auto z-10"
            >
              {completions.map((comp, i) => (
                <div
                  key={comp}
                  className={`px-3 py-1 text-xs font-mono cursor-pointer ${
                    i === completionIndex ? 'bg-[#2a2b3d] text-[#7aa2f7]' : 'text-[#a9b1d6]'
                  }`}
                  onMouseEnter={() => setCompletionIndex(i)}
                  onClick={() => {
                    setInput(comp);
                    setShowCompletions(false);
                  }}
                >
                  {comp}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#2a2b3d] bg-[#16171f]">
          <span className="text-[#bb9af7] font-bold text-sm">
            ({branchName}) $
          </span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none text-[#c0caf5] font-mono text-sm placeholder-[#565f89]"
              placeholder="Type a git command... (Tab to autocomplete)"
              autoComplete="off"
              spellCheck={false}
            />
            {/* Blinking cursor */}
            {input === '' && cursorVisible && (
              <div className="absolute top-0 left-0 w-2 h-full bg-[#c0caf5] opacity-70 pointer-events-none" />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
