import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ChevronRight, Eye, FlaskConical, GitBranch, Layers3 } from 'lucide-react'
import { useState } from 'react'

interface OnboardingOverlayProps {
  onComplete: () => void
}

const STEPS = [
  {
    eyebrow: 'First principle',
    title: 'Git is a set of connected states',
    description:
      'Files move from working tree to staging area to commit history. Branches and HEAD are pointers into that history; remotes are other repository copies.',
    visual: 'layers',
  },
  {
    eyebrow: 'Learning loop',
    title: 'Predict before every meaningful command',
    description:
      'Choose which layer you expect to change. A wrong prediction is useful evidence: it reveals exactly where your mental model needs repair.',
    visual: 'loop',
  },
  {
    eyebrow: 'Proficiency',
    title: 'Explain the graph, not just the command',
    description:
      'Run one operation, inspect the state delta and commit graph, then explain why it happened. Lessons advance only after that reflection.',
    visual: 'mastery',
  },
] as const

function StepVisual({ kind }: { kind: (typeof STEPS)[number]['visual'] }) {
  if (kind === 'layers') {
    return (
      <div className="onboarding-layers" aria-label="Working tree to staging to history to branches and remote">
        {['Working', 'Staging', 'History', 'HEAD', 'Remote'].map((label, index) => (
          <div key={label}>
            <span>{label}</span>
            {index < 4 && <ArrowRight aria-hidden="true" />}
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'loop') {
    return (
      <div className="onboarding-loop">
        <span>
          <Layers3 />
          Model
        </span>
        <ArrowRight />
        <span>
          <FlaskConical />
          Predict
        </span>
        <ArrowRight />
        <span>
          <GitBranch />
          Run
        </span>
        <ArrowRight />
        <span>
          <Eye />
          Inspect
        </span>
      </div>
    )
  }

  return (
    <div className="onboarding-mastery">
      <Check />
      <div>
        <strong>Command evidence secured</strong>
        <p>You can explain what moved and why.</p>
      </div>
    </div>
  )
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const currentStep = STEPS[step]

  const finish = (mode: 'complete' | 'skip') => {
    if (dontShowAgain) {
      localStorage.setItem('git-recipe-book-onboarding-done', 'permanent')
    } else if (mode === 'skip') {
      localStorage.setItem('git-recipe-book-onboarding-done', 'session')
    }
    onComplete()
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish('complete')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="onboarding-shell">
      <button
        type="button"
        className="onboarding-backdrop"
        onClick={() => finish('skip')}
        aria-label="Close introduction"
      />

      <AnimatePresence mode="wait">
        <motion.dialog
          open
          key={step}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="onboarding-card"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          aria-describedby="onboarding-description"
        >
          <div className="onboarding-progress" aria-label={`Introduction step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <span key={item.title} className={index <= step ? 'is-active' : ''} />
            ))}
          </div>

          <p className="learning-kicker">{currentStep.eyebrow}</p>
          <h2 id="onboarding-title">{currentStep.title}</h2>
          <p id="onboarding-description">{currentStep.description}</p>
          <StepVisual kind={currentStep.visual} />

          <footer className="onboarding-actions">
            <label>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(event) => setDontShowAgain(event.target.checked)}
              />
              Do not show this introduction again
            </label>
            <div>
              <Button variant="ghost" size="sm" onClick={() => finish('skip')}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {step < STEPS.length - 1 ? 'Next principle' : 'Start learning'}
                <ChevronRight />
              </Button>
            </div>
          </footer>
        </motion.dialog>
      </AnimatePresence>
    </motion.div>
  )
}

export function shouldShowOnboarding(): boolean {
  const value = localStorage.getItem('git-recipe-book-onboarding-done')
  return value !== 'session' && value !== 'permanent'
}
