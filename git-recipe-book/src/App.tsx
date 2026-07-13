import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  FileText,
  GitBranch,
  GitCommitHorizontal,
} from 'lucide-react'
import { useGitStore, lessonProvider } from '@/stores/git-store'
import AppHeader from '@/components/git/AppHeader'
import GitGraph from '@/components/git/GitGraph'
import GitTerminal from '@/components/git/GitTerminal'
import GitLessonPanel from '@/components/git/GitLessonPanel'
import GitFileExplorer from '@/components/git/GitFileExplorer'
import GitCommitDetail from '@/components/git/GitCommitDetail'
import GitBranchList from '@/components/git/GitBranchList'
import GitHelpPanel from '@/components/git/GitHelpPanel'
import GraphLegend from '@/components/git/GraphLegend'
import StatusIndicator from '@/components/git/StatusIndicator'
import OnboardingOverlay, { shouldShowOnboarding } from '@/components/git/OnboardingOverlay'
import { ToastContainer, useToasts, showToast } from '@/components/ui/toast'
import Confetti from '@/components/ui/confetti'
import { useKeyboardShortcuts, SHORTCUT_HELP } from '@/hooks/use-keyboard-shortcuts'

export default function App() {
  const {
    sidebarOpen,
    setSidebarOpen,
    gitState,
    selectedCommitId,
    activeTab,
    setActiveTab,
    currentLessonId,
    currentStepIndex,
    completedLessons,
  } = useGitStore()

  const commitCount = Object.keys(gitState.commits).length
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding())
  const [showConfetti, setShowConfetti] = useState(false)
  const { toasts, addToast, removeToast } = useToasts()

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleHelp: () => {
      const { helpPanelOpen } = useGitStore.getState()
      useGitStore.getState().setHelpPanel(!helpPanelOpen)
    },
    onToggleSidebar: () => {
      useGitStore.getState().setSidebarOpen(!useGitStore.getState().sidebarOpen)
    },
    onFocusTerminal: () => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Type a git command"]'
      )
      input?.focus()
    },
    onClearTerminal: () => {
      useGitStore.getState().clearTerminal()
    },
  })

  return (
    <div className='h-screen w-screen flex flex-col bg-background overflow-hidden'>
      {/* Top Bar */}
      <AppHeader />

      {/* Main Content */}
      <div className='flex-1 min-h-0'>
        <ResizablePanelGroup direction='horizontal'>
          {/* Sidebar - Lessons */}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className='h-full overflow-hidden shrink-0'
              >
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <GitLessonPanel />
                </ResizablePanel>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center - Graph + Terminal */}
          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction='vertical'>
              {/* Graph Area */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className='h-full relative'>
                  <GitGraph />
                  {/* Floating legend */}
                  {commitCount > 0 && <GraphLegend />}
                  {/* Status indicator */}
                  <StatusIndicator />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Terminal */}
              <ResizablePanel
                defaultSize={40}
                minSize={20}
                collapsible
              >
                <div className='h-full p-2'>
                  <GitTerminal />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Details */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'graph' | 'files' | 'detail')}
            >
              <TabsList className='w-full justify-start rounded-none border-b border-border bg-card px-2 h-9'>
                <TabsTrigger
                  value='files'
                  className='text-xs'
                >
                  <FileText className='w-3 h-3 mr-1' />
                  Files
                </TabsTrigger>
                <TabsTrigger
                  value='detail'
                  className='text-xs'
                >
                  <GitCommitHorizontal className='w-3 h-3 mr-1' />
                  Commit
                </TabsTrigger>
                <TabsTrigger
                  value='graph'
                  className='text-xs'
                >
                  <GitBranch className='w-3 h-3 mr-1' />
                  Branches
                </TabsTrigger>
              </TabsList>
              <TabsContent value='files' className='flex-1 min-h-0 m-0'>
                <GitFileExplorer />
              </TabsContent>
              <TabsContent value='detail' className='flex-1 min-h-0 m-0'>
                <GitCommitDetail />
              </TabsContent>
              <TabsContent value='graph' className='flex-1 min-h-0 m-0'>
                <GitBranchList />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Help Panel */}
      <GitHelpPanel />

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingOverlay onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Confetti */}
      <Confetti active={showConfetti} />
    </div>
  )
}
