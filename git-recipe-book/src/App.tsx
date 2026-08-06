import AppHeader from '@/components/git/AppHeader'
import CommandInsightPanel from '@/components/git/CommandInsightPanel'
import GitLessonPanel from '@/components/git/GitLessonPanel'
import GitStateFlow from '@/components/git/GitStateFlow'
import GitTerminal from '@/components/git/GitTerminal'
import LearningCompass from '@/components/git/LearningCompass'
import LearningMission from '@/components/git/LearningMission'
import OnboardingOverlay, { shouldShowOnboarding } from '@/components/git/OnboardingOverlay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToastContainer, useToasts } from '@/components/ui/toast'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useGitStore } from '@/stores/git-store'
import { AnimatePresence } from 'framer-motion'
import { FileText, GitBranch, GitCommitHorizontal, Network, TerminalSquare, X } from 'lucide-react'
import { Suspense, lazy, useCallback, useState } from 'react'

const GitGraph = lazy(() => import('@/components/git/GitGraph'))
const GitFileExplorer = lazy(() => import('@/components/git/GitFileExplorer'))
const GitCommitDetail = lazy(() => import('@/components/git/GitCommitDetail'))
const GitBranchList = lazy(() => import('@/components/git/GitBranchList'))
const GitHelpPanel = lazy(() => import('@/components/git/GitHelpPanel'))
const GraphLegend = lazy(() => import('@/components/git/GraphLegend'))
const StatusIndicator = lazy(() => import('@/components/git/StatusIndicator'))

function PanelFallback({ label }: { label: string }) {
  return <div className="panel-loading">Loading {label}…</div>
}

export default function App() {
  const { sidebarOpen, evidenceOpen, focusMode, activeTab, setSidebarOpen, setEvidenceOpen, setActiveTab } =
    useGitStore()
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding())
  const { toasts, removeToast } = useToasts()

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  useKeyboardShortcuts({
    onToggleHelp: () => {
      const { helpPanelOpen, setHelpPanel } = useGitStore.getState()
      setHelpPanel(!helpPanelOpen)
    },
    onToggleSidebar: () => {
      const { sidebarOpen: open, setSidebarOpen } = useGitStore.getState()
      setSidebarOpen(!open)
    },
    onFocusTerminal: () => {
      document.querySelector<HTMLInputElement>('input[placeholder*="Type a git command"]')?.focus()
    },
    onClearTerminal: () => useGitStore.getState().clearTerminal(),
  })

  const courseVisible = sidebarOpen && !focusMode
  const evidenceVisible = evidenceOpen && !focusMode

  return (
    <div className="git-learning-app">
      <AppHeader />

      <div
        className={`git-learning-shell ${courseVisible ? '' : 'is-sidebar-collapsed'} ${
          evidenceVisible ? '' : 'is-evidence-collapsed'
        } ${focusMode ? 'is-focus-mode' : ''}`}
      >
        {courseVisible && (
          <aside className="curriculum-rail" aria-label="Git curriculum">
            <GitLessonPanel onClose={() => setSidebarOpen(false)} />
          </aside>
        )}

        <main className="learning-workspace">
          <LearningCompass />
          <LearningMission />
          <GitStateFlow />

          <section
            className="learning-graph-card"
            id="repository-map"
            data-workspace-section="graph"
            aria-labelledby="learning-graph-title"
          >
            <header className="learning-card-header">
              <div>
                <p className="learning-kicker">Repository map</p>
                <h2 id="learning-graph-title">See commits as snapshots and branches as pointers</h2>
              </div>
              <div className="learning-card-header__cue">
                <Network />
                <span>Select a commit to inspect its evidence.</span>
              </div>
            </header>
            <div className="learning-graph-viewport">
              <Suspense fallback={<PanelFallback label="the repository graph" />}>
                <GitGraph />
                <GraphLegend />
                <StatusIndicator />
              </Suspense>
            </div>
          </section>

          <div className="practice-evidence-grid" id="learning-practice" data-workspace-section="practice">
            <section className="learning-terminal-card" aria-labelledby="learning-terminal-title">
              <header className="learning-card-header learning-card-header--compact">
                <div>
                  <p className="learning-kicker">Experiment console</p>
                  <h2 id="learning-terminal-title">Run one intentional command</h2>
                </div>
                <TerminalSquare />
              </header>
              <div className="learning-terminal-viewport">
                <GitTerminal />
              </div>
            </section>

            <CommandInsightPanel />
          </div>
        </main>

        {evidenceVisible && (
          <aside className="evidence-drawer" id="repository-evidence" aria-label="Repository evidence">
            <div className="evidence-drawer__intro">
              <button
                type="button"
                className="evidence-drawer__close"
                onClick={() => setEvidenceOpen(false)}
                aria-label="Close evidence drawer"
              >
                <X aria-hidden="true" />
              </button>
              <p className="learning-kicker">Evidence drawer</p>
              <h2>Inspect the object behind the picture</h2>
              <p>Use these details after the graph has given you an orientation.</p>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'graph' | 'files' | 'detail')}
              className="evidence-tabs"
            >
              <TabsList className="evidence-tabs__list">
                <TabsTrigger value="files">
                  <FileText />
                  Files
                </TabsTrigger>
                <TabsTrigger value="detail">
                  <GitCommitHorizontal />
                  Commit
                </TabsTrigger>
                <TabsTrigger value="graph">
                  <GitBranch />
                  Refs
                </TabsTrigger>
              </TabsList>
              <Suspense fallback={<PanelFallback label="repository evidence" />}>
                <TabsContent value="files" className="evidence-tabs__content">
                  <GitFileExplorer />
                </TabsContent>
                <TabsContent value="detail" className="evidence-tabs__content">
                  <GitCommitDetail />
                </TabsContent>
                <TabsContent value="graph" className="evidence-tabs__content">
                  <GitBranchList />
                </TabsContent>
              </Suspense>
            </Tabs>
          </aside>
        )}

        {(courseVisible || evidenceVisible) && (
          <button
            type="button"
            className="mobile-panel-scrim"
            onClick={() => {
              setSidebarOpen(false)
              setEvidenceOpen(false)
            }}
            aria-label="Close open workspace panel"
          />
        )}
      </div>

      <Suspense fallback={null}>
        <GitHelpPanel />
      </Suspense>
      <AnimatePresence>{showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}</AnimatePresence>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
