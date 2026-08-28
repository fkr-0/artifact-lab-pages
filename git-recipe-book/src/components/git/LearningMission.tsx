import { Button } from '@/components/ui/button'
import { type GitStateLayer, classifyGitCommand } from '@/lib/learning/git-learning-model'
import { recommendNextLearningActions } from '@/lib/learning/learning-advisor'
import { lessonProvider, useGitStore } from '@/stores/git-store'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  FlaskConical,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useMemo } from 'react'

const LAYER_CHOICES: Array<{ id: GitStateLayer; label: string }> = [
  { id: 'working', label: 'Working tree' },
  { id: 'staging', label: 'Staging area' },
  { id: 'history', label: 'Commit history' },
  { id: 'refs', label: 'Branches & HEAD' },
  { id: 'remote', label: 'Remote' },
]

const PHASES = ['Model', 'Predict', 'Run', 'Inspect', 'Explain']

export default function LearningMission() {
  const {
    currentLessonId,
    currentStepIndex,
    completedLessons,
    checkpointResults,
    learningEvidence,
    predictedLayers,
    predictionMade,
    pendingReflectionStepId,
    hintLevels,
    loadLesson,
    restartCurrentLesson,
    revealNextHint,
    setPredictedLayers,
    predictNoStateChange,
    completeKnowledgeStep,
  } = useGitStore()

  const lessons = lessonProvider.getLessons()
  const recommendations = useMemo(
    () =>
      recommendNextLearningActions({
        lessons,
        completedLessonIds: completedLessons,
        checkpointResults,
        learningEvidence,
      }),
    [lessons, completedLessons, checkpointResults, learningEvidence],
  )
  const currentLesson = lessonProvider.getLesson(currentLessonId || '')
  const currentStep = currentLesson?.steps[currentStepIndex]

  if (!currentLesson || !currentStep) {
    const next = recommendations[0]
    return (
      <section
        className="learning-mission learning-mission--welcome"
        id="learning-mission"
        data-workspace-section="mission"
        aria-labelledby="learning-mission-title"
      >
        <div className="learning-mission__welcome-icon">
          <Sparkles />
        </div>
        <div className="learning-mission__welcome-copy">
          <p className="learning-kicker">Interactive Git course</p>
          <h2 id="learning-mission-title">Build a mental model, not a command collection</h2>
          <p>
            Every lesson follows the same loop: predict the state change, run a real Git-shaped command, inspect the
            graph and layers, then explain the result in your own words.
          </p>
        </div>
        {next && (
          <Button onClick={() => loadLesson(next.lessonId)} className="learning-mission__start">
            Start with {next.title}
            <ChevronRight className="size-4" />
          </Button>
        )}
      </section>
    )
  }

  const isKnowledgeStep = !currentStep.validation
  const awaitingReflection = pendingReflectionStepId === currentStep.id
  const lessonComplete = completedLessons.has(currentLesson.id)
  const activePhase = isKnowledgeStep ? 0 : awaitingReflection ? 4 : predictionMade ? 2 : 1
  const checkpointQuestion = currentStep.checkpointQuestions?.[0]
  const mode = currentLesson.curriculum?.mode ?? 'guided'
  const modeLabel =
    mode === 'practice'
      ? 'Practice Lab'
      : mode === 'recovery'
        ? 'Recovery Lab'
        : mode === 'challenge'
          ? 'Challenge'
          : 'Guided Lesson'
  const hintKey = `${currentLesson.id}/${currentStep.id}`
  const hintLevel = hintLevels[hintKey] ?? 0
  const visibleHint = hintLevel > 0 ? currentStep.progressiveHints?.[hintLevel - 1] : undefined
  const classifiedCommand = currentStep.exactCommand ? classifyGitCommand(currentStep.exactCommand) : undefined

  const toggleLayer = (layer: GitStateLayer) => {
    const next = predictedLayers.includes(layer)
      ? predictedLayers.filter((candidate) => candidate !== layer)
      : [...predictedLayers, layer]
    setPredictedLayers(next)
  }

  return (
    <section
      className="learning-mission"
      id="learning-mission"
      data-workspace-section="mission"
      aria-labelledby="learning-mission-title"
    >
      <header className="learning-mission__header">
        <div>
          <p className="learning-kicker">
            {currentLesson.icon} {modeLabel} · {currentLesson.title}
          </p>
          <h2 id="learning-mission-title">{currentStep.title}</h2>
        </div>
        <div className="learning-mission__header-actions">
          {(mode === 'practice' || mode === 'recovery' || mode === 'challenge') && (
            <Button type="button" variant="outline" size="sm" onClick={restartCurrentLesson}>
              <RotateCcw /> Reset lab
            </Button>
          )}
          <div className="learning-mission__step-count">
            Step {Math.min(currentStepIndex + 1, currentLesson.steps.length)} of {currentLesson.steps.length}
          </div>
        </div>
      </header>

      <div className="mastery-phase-rail" aria-label="Learning loop progress">
        {PHASES.map((phase, index) => (
          <div
            className={`${index < activePhase ? 'is-done' : ''} ${index === activePhase ? 'is-active' : ''}`}
            key={phase}
          >
            <span>{index < activePhase ? <Check /> : index + 1}</span>
            <strong>{phase}</strong>
          </div>
        ))}
      </div>

      <div className="learning-mission__body">
        <div className="learning-mission__brief">
          <p>{currentStep.description}</p>
          <blockquote>{currentStep.concept}</blockquote>
          {currentStep.expectedOutcome && (
            <div className="learning-outcome">
              <FlaskConical />
              <div>
                <strong>Observe after the action</strong>
                <p>{currentStep.expectedOutcome}</p>
              </div>
            </div>
          )}
          {classifiedCommand?.risk === 'destructive' && (
            <div className="destructive-operation-preview">
              <AlertTriangle />
              <div>
                <strong>Destructive-operation preview</strong>
                <p>
                  This operation can affect{' '}
                  {classifiedCommand.expectedLayers.length > 0
                    ? classifiedCommand.expectedLayers.join(', ')
                    : 'repository state'}
                  . Inspect the current state and predict the exact result before running it.
                </p>
                {currentStep.safetyNote && <small>{currentStep.safetyNote}</small>}
              </div>
            </div>
          )}
        </div>

        {!isKnowledgeStep && !awaitingReflection && (
          <>
            <div className="prediction-workbench">
              <div>
                <strong>Predict before typing</strong>
                <p>
                  Which Git layers will this command change? Select all that apply. Observation commands may change
                  none.
                </p>
              </div>
              <div className="prediction-workbench__choices">
                {LAYER_CHOICES.map((choice) => (
                  <button
                    type="button"
                    key={choice.id}
                    className={predictedLayers.includes(choice.id) ? 'is-selected' : ''}
                    onClick={() => toggleLayer(choice.id)}
                    aria-pressed={predictedLayers.includes(choice.id)}
                  >
                    {choice.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={predictionMade && predictedLayers.length === 0 ? 'is-selected' : ''}
                  onClick={predictNoStateChange}
                  aria-pressed={predictionMade && predictedLayers.length === 0}
                >
                  <Eye /> No state change
                </button>
              </div>
              <p className="prediction-workbench__hint">
                <LockKeyhole /> The answer stays hidden until you run the command.
              </p>
            </div>
            {currentStep.progressiveHints?.length ? (
              <div className="progressive-hint">
                <div>
                  <Lightbulb />
                  <strong>Hint ladder</strong>
                  <span>
                    {hintLevel}/{currentStep.progressiveHints.length}
                  </span>
                </div>
                {visibleHint ? (
                  <p>{visibleHint}</p>
                ) : (
                  <p>Try from the goal first. Reveal help only when it is useful.</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={revealNextHint}
                  disabled={hintLevel >= currentStep.progressiveHints.length}
                >
                  {hintLevel >= currentStep.progressiveHints.length ? 'All hints revealed' : 'Reveal next hint'}
                </Button>
              </div>
            ) : null}
          </>
        )}

        {(isKnowledgeStep || awaitingReflection) && (
          <div className="reflection-checkpoint">
            <CircleHelp />
            <div>
              <strong>{awaitingReflection ? 'Secure the mechanism' : 'Retrieval checkpoint'}</strong>
              <p>
                {currentStep.knowledgeCheck?.question ??
                  checkpointQuestion ??
                  'Can you explain this distinction without reading the lesson text?'}
              </p>
              {currentStep.knowledgeCheck ? (
                <fieldset className="knowledge-check-options">
                  <legend className="sr-only">Retrieval check answers</legend>
                  {currentStep.knowledgeCheck.options.map((option, index) => (
                    <Button
                      key={option}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        completeKnowledgeStep(index === currentStep.knowledgeCheck?.correctOption ? 'passed' : 'missed')
                      }
                    >
                      {option}
                    </Button>
                  ))}
                </fieldset>
              ) : (
                <div className="reflection-checkpoint__actions">
                  <Button size="sm" onClick={() => completeKnowledgeStep('passed')}>
                    I can explain it
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => completeKnowledgeStep('missed')}>
                    Review once more
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {lessonComplete && recommendations[0] && (
          <button
            type="button"
            className="next-learning-action"
            onClick={() => loadLesson(recommendations[0].lessonId)}
          >
            <span>Next recommended practice</span>
            <strong>{recommendations[0].title}</strong>
            <small>{recommendations[0].reason}</small>
            <ChevronRight />
          </button>
        )}
      </div>
    </section>
  )
}
