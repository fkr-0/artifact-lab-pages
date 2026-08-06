import { lessonProvider, useGitStore } from '@/stores/git-store'
import {
  BookOpenCheck,
  BrainCircuit,
  ChevronRight,
  Focus,
  GitFork,
  Network,
  PanelRightOpen,
  TerminalSquare,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type WorkspaceSection = 'mission' | 'model' | 'graph' | 'practice'

const SECTIONS: Array<{
  id: WorkspaceSection
  label: string
  icon: typeof BrainCircuit
}> = [
  { id: 'mission', label: 'Mission', icon: BrainCircuit },
  { id: 'model', label: 'State model', icon: GitFork },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'practice', label: 'Practice', icon: TerminalSquare },
]

function scrollToSection(section: WorkspaceSection) {
  document.querySelector<HTMLElement>(`[data-workspace-section="${section}"]`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export default function LearningCompass() {
  const {
    currentLessonId,
    currentStepIndex,
    predictionMade,
    pendingReflectionStepId,
    sidebarOpen,
    evidenceOpen,
    focusMode,
    setSidebarOpen,
    setEvidenceOpen,
    setFocusMode,
  } = useGitStore()
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('mission')

  const currentLesson = lessonProvider.getLesson(currentLessonId || '')
  const currentStep = currentLesson?.steps[currentStepIndex]

  const attention = useMemo(() => {
    if (!currentLesson || !currentStep) {
      return {
        eyebrow: 'Start here',
        title: 'Choose one lesson from the course map',
        action: 'course' as const,
        actionLabel: 'Open course map',
      }
    }

    if (!currentStep.validation) {
      return {
        eyebrow: `${currentLesson.title} · Step ${currentStepIndex + 1}`,
        title: 'Secure the concept with the retrieval checkpoint',
        action: 'mission' as const,
        actionLabel: 'Go to checkpoint',
      }
    }

    if (pendingReflectionStepId === currentStep.id) {
      return {
        eyebrow: `${currentLesson.title} · Evidence ready`,
        title: 'Inspect the command delta, then explain the mechanism',
        action: 'practice' as const,
        actionLabel: 'Review evidence',
      }
    }

    if (predictionMade) {
      return {
        eyebrow: `${currentLesson.title} · Prediction committed`,
        title: 'Run the experiment without changing your prediction',
        action: 'practice' as const,
        actionLabel: 'Go to console',
      }
    }

    return {
      eyebrow: `${currentLesson.title} · Step ${currentStepIndex + 1}`,
      title: 'Model the change and commit a prediction first',
      action: 'mission' as const,
      actionLabel: 'Go to mission',
    }
  }, [currentLesson, currentStep, currentStepIndex, pendingReflectionStepId, predictionMade])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-section]'))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]
        const section = visible?.target.getAttribute('data-workspace-section') as WorkspaceSection | null
        if (section) setActiveSection(section)
      },
      { rootMargin: '-128px 0px -58% 0px', threshold: [0.05, 0.25, 0.55] },
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const followAttention = () => {
    if (attention.action === 'course') {
      setSidebarOpen(true)
      return
    }
    scrollToSection(attention.action)
  }

  return (
    <nav className="learning-compass" aria-label="Learning workspace navigation">
      <div className="learning-compass__attention" aria-live="polite">
        <div>
          <span>{attention.eyebrow}</span>
          <strong>{attention.title}</strong>
        </div>
        <button type="button" onClick={followAttention}>
          {attention.actionLabel}
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="learning-compass__sections" aria-label="Jump within the workspace">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <button
              type="button"
              key={section.id}
              className={activeSection === section.id ? 'is-active' : ''}
              aria-label={`Jump to ${section.label}`}
              aria-current={activeSection === section.id ? 'location' : undefined}
              onClick={() => scrollToSection(section.id)}
            >
              <Icon aria-hidden="true" />
              <span>{section.label}</span>
            </button>
          )
        })}
      </div>

      <div className="learning-compass__panels" aria-label="Workspace panels">
        <button
          type="button"
          className={sidebarOpen && !focusMode ? 'is-active' : ''}
          aria-label="Course map"
          aria-pressed={sidebarOpen && !focusMode}
          onClick={() => setSidebarOpen(!(sidebarOpen && !focusMode))}
        >
          <BookOpenCheck aria-hidden="true" />
          <span>Course</span>
        </button>
        <button
          type="button"
          className={evidenceOpen && !focusMode ? 'is-active' : ''}
          aria-label="Evidence drawer"
          aria-pressed={evidenceOpen && !focusMode}
          onClick={() => setEvidenceOpen(!(evidenceOpen && !focusMode))}
        >
          <PanelRightOpen aria-hidden="true" />
          <span>Evidence</span>
        </button>
        <button
          type="button"
          className={focusMode ? 'is-active' : ''}
          aria-label="Focus canvas"
          aria-pressed={focusMode}
          onClick={() => setFocusMode(!focusMode)}
        >
          <Focus aria-hidden="true" />
          <span>Focus</span>
        </button>
      </div>
    </nav>
  )
}
