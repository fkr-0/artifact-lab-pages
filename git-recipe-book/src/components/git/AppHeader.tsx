import React from 'react'
import { useGitStore, lessonProvider } from '@/stores/git-store'
import { Button } from '@/components/ui/button'
import ThemeSwitcher from '@/components/ui/theme-switcher'
import {
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Sparkles,
  HelpCircle,
  GitBranch,
  GitCommitHorizontal,
  Globe,
} from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { motion } from 'framer-motion'

export default function AppHeader() {
  const {
    sidebarOpen,
    setSidebarOpen,
    gitState,
    currentLessonId,
    currentStepIndex,
    resetAll,
    setHelpPanel,
  } = useGitStore()
  const { theme, setTheme } = useTheme()
  const [showThemeSwitcher, setShowThemeSwitcher] = React.useState(false)

  const commitCount = Object.keys(gitState.commits).length
  const branchCount = Object.keys(gitState.branches).length
  const remoteCount = Object.keys(gitState.remotes).length

  // Current lesson progress
  const currentLesson = lessonProvider.getLesson(currentLessonId || '')
  const currentStep = currentLesson?.steps[currentStepIndex]

  return (
    <header className='h-12 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0'>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <PanelLeftClose className='w-4 h-4' />
          ) : (
            <PanelLeftOpen className='w-4 h-4' />
          )}
        </Button>
        <div className='flex items-center gap-2'>
          <span className='text-xl'>🍳</span>
          <h1 className='font-bold text-sm tracking-tight'>
            Git Recipe Book
          </h1>
          <span className='text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
            Learn Git Visually
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className='flex items-center gap-3 text-xs text-muted-foreground'>
        {gitState.initialized && (
          <>
            <div className='flex items-center gap-1'>
              <GitCommitHorizontal className='w-3.5 h-3.5' />
              <span>{commitCount} commits</span>
            </div>
            <div className='flex items-center gap-1'>
              <GitBranch className='w-3.5 h-3.5' />
              <span>{branchCount} branches</span>
            </div>
            {remoteCount > 0 && (
              <div className='flex items-center gap-1'>
                <Globe className='w-3.5 h-3.5 text-cyan-500' />
                <span>{remoteCount} remote{remoteCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {gitState.HEAD.type === 'branch' && (
              <div className='flex items-center gap-1'>
                <span className='font-mono text-primary font-medium'>
                  {gitState.HEAD.ref}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className='flex items-center gap-1'>
        {/* Current step hint */}
        {currentStep && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className='hidden lg:flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[11px] font-medium mr-2'
          >
            <Sparkles className='w-3 h-3' />
            <span className='max-w-48 truncate'>{currentStep.hint}</span>
          </motion.div>
        )}
        {/* Help button */}
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={() =>
            setHelpPanel(true, currentStep?.validation?.pattern ? 'command' : null)
          }
          title='Help'
        >
          <HelpCircle className='w-4 h-4' />
        </Button>

        {/* Theme switcher */}
        <div className="relative">
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0'
            onClick={() => setShowThemeSwitcher(!showThemeSwitcher)}
            title='Theme'
          >
            <Sparkles className='w-4 h-4' />
          </Button>
          {showThemeSwitcher && (
            <div className="absolute top-full right-0 mt-1 z-50">
              <ThemeSwitcher
                currentTheme={theme}
                onThemeChange={(newTheme) => {
                  setTheme(newTheme as 'light' | 'dark')
                  setShowThemeSwitcher(false)
                }}
                variant="dropdown"
              />
            </div>
          )}
        </div>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={resetAll}
          title='Reset'
        >
          <RotateCcw className='w-4 h-4' />
        </Button>
      </div>
    </header>
  )
}
