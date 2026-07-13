import React, { useState, useEffect, useCallback } from 'react';
import { useGitStore, lessonProvider } from '@/stores/git-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Lightbulb,
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { recommendNextLearningActions } from '@/lib/learning/learning-advisor';

// ─── Progressive Hint Component ──────────────────────────────────────────────

function ProgressiveHintDisplay({ step, isActive }: { step: { progressiveHints?: string[]; exactCommand?: string; hint: string }; isActive: boolean }) {
  const [hintLevel, setHintLevel] = useState(0);
  const [showExactCommand, setShowExactCommand] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setHintLevel(0);
      setShowExactCommand(false);
      return;
    }

    setHintLevel(0);
    setShowExactCommand(false);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Reveal description after 5s (level 1)
    timers.push(setTimeout(() => setHintLevel(1), 5000));
    // Reveal progressive hint after 15s (level 2)
    timers.push(setTimeout(() => setHintLevel(2), 15000));
    // Reveal exact command after 30s (level 3)
    timers.push(setTimeout(() => setHintLevel(3), 30000));

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="space-y-1.5">
      {/* Standard hint */}
      <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded">
        <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
        <span className="text-amber-700 dark:text-amber-400">{step.hint}</span>
      </div>

      {/* Progressive hints */}
      {hintLevel >= 2 && step.progressiveHints && step.progressiveHints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-1 pl-1"
        >
          {step.progressiveHints.map((hint, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-start gap-1">
              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{hint}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Exact command (spoiler) */}
      {hintLevel >= 3 && step.exactCommand && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="relative group mt-1"
        >
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Command:</span>
            <div className="relative">
              <span
                className={`font-mono text-primary transition-all ${
                  showExactCommand ? '' : 'blur-sm select-none'
                }`}
              >
                {step.exactCommand}
              </span>
              {!showExactCommand && (
                <button
                  type="button"
                  className="absolute inset-0 flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowExactCommand(true)}
                >
                  <EyeOff className="w-3 h-3" />
                  <span className="text-[10px]">hover to reveal</span>
                </button>
              )}
            </div>
            {showExactCommand && (
              <button
                type="button"
                onClick={() => setShowExactCommand(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Hint timer indicator */}
      {hintLevel < 3 && (
        <div className="flex items-center gap-1 mt-1">
          <div className="flex gap-0.5">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`w-1 h-1 rounded-full transition-colors ${
                  hintLevel >= level ? 'bg-amber-400' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">
            More hints coming...
          </span>
        </div>
      )}
    </div>
  );
}


type LessonToolIntroductionView = {
  term: string;
  meaning: string;
  usedHere: string;
  beginnerPitfall?: string;
};

type LessonStepView = {
  id: string;
  title: string;
  description: string;
  hint: string;
  concept: string;
  progressiveHints?: string[];
  exactCommand?: string;
  estimatedTime?: number;
  toolIntroductions?: LessonToolIntroductionView[];
  expectedOutcome?: string;
  checkpointQuestions?: string[];
  safetyNote?: string;
};

function PedagogyPrimer({ step }: { step: LessonStepView }) {
  const hasPrimer =
    step.toolIntroductions?.length ||
    step.expectedOutcome ||
    step.checkpointQuestions?.length ||
    step.safetyNote;

  if (!hasPrimer) return null;

  return (
    <div className="mt-1.5 space-y-1.5 rounded-md border border-sky-200 bg-sky-50/80 p-2 text-[11px] text-sky-950 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100">
      {step.toolIntroductions && step.toolIntroductions.length > 0 && (
        <div>
          <div className="font-semibold uppercase tracking-wide">Before this command</div>
          <dl className="mt-1 space-y-1">
            {step.toolIntroductions.map((intro) => (
              <div key={intro.term}>
                <dt className="font-mono font-semibold">{intro.term}</dt>
                <dd>{intro.meaning}</dd>
                <dd className="text-muted-foreground">Here: {intro.usedHere}</dd>
                {intro.beginnerPitfall && (
                  <dd className="text-amber-700 dark:text-amber-300">Watch out: {intro.beginnerPitfall}</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      )}
      {step.safetyNote && (
        <div className="rounded bg-amber-100/80 p-1.5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Safety note: {step.safetyNote}
        </div>
      )}
      {step.expectedOutcome && (
        <div>
          <span className="font-semibold">Expected outcome:</span> {step.expectedOutcome}
        </div>
      )}
      {step.checkpointQuestions && step.checkpointQuestions.length > 0 && (
        <div>
          <span className="font-semibold">Checkpoint:</span> {step.checkpointQuestions[0]}
        </div>
      )}
    </div>
  );
}

// ─── Step Completion Animation ───────────────────────────────────────────────

function StepItem({
  step,
  isCompleted,
  isCurrent,
  justCompleted,
}: {
  step: LessonStepView;
  isCompleted: boolean;
  isCurrent: boolean;
  justCompleted: boolean;
}) {
  return (
    <motion.div
      layout
      className={`flex items-start gap-2 p-2 rounded-md text-xs transition-colors ${
        isCurrent
          ? 'bg-primary/10 border border-primary/20'
          : isCompleted
          ? justCompleted
            ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-300 dark:ring-emerald-700'
            : 'bg-emerald-50 dark:bg-emerald-950/20'
          : 'bg-muted/30'
      }`}
      animate={justCompleted ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className="mt-0.5">
        {isCompleted ? (
          <motion.div
            initial={justCompleted ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </motion.div>
        ) : isCurrent ? (
          <Play className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`font-medium ${
            isCurrent
              ? 'text-primary'
              : isCompleted
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-muted-foreground'
          }`}
        >
          {step.title}
        </div>
        {(isCurrent || isCompleted) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        )}
        {isCurrent && <PedagogyPrimer step={step} />}
        {isCurrent && (
          <ProgressiveHintDisplay step={step} isActive={isCurrent} />
        )}
        {isCurrent && step.concept && (
          <div className="mt-1.5 text-[11px] text-muted-foreground italic border-l-2 border-primary/30 pl-2">
            {step.concept}
          </div>
        )}
        {isCurrent && step.estimatedTime && (
          <div className="mt-1 text-[9px] text-muted-foreground">
            ⏱ ~{step.estimatedTime}s estimated
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GitLessonPanel() {
  const {
    currentLessonId,
    currentStepIndex,
    completedSteps,
    completedLessons,
    loadLesson,
    resetAll,
    setSidebarOpen,
  } = useGitStore();

  const [justCompletedStepId, setJustCompletedStepId] = useState<string | null>(null);

  const categories = lessonProvider.getCategories();
  const currentLesson = lessonProvider.getLesson(currentLessonId || '');
  const recommendation = recommendNextLearningActions({
    lessons: lessonProvider.getLessons(),
    completedLessonIds: completedLessons,
  })[0];

  // Find the category of the current lesson for default accordion value
  const defaultCategory = currentLesson?.category || categories[0]?.id || 'basics';

  // Track just-completed steps for animation
  useEffect(() => {
    if (currentLesson && completedSteps.size > 0) {
      const currentStep = currentLesson.steps[currentStepIndex];
      if (currentStep && completedSteps.has(currentStep.id)) {
        setJustCompletedStepId(currentStep.id);
        const timer = setTimeout(() => setJustCompletedStepId(null), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [completedSteps, currentStepIndex, currentLesson]);

  // Show toast on lesson completion
  useEffect(() => {
    if (currentLesson && completedLessons.has(currentLesson.id)) {
      showToast({
        message: `🎉 Lesson "${currentLesson.title}" completed!`,
        type: 'celebration',
        duration: 4000,
      });
    }
  }, [completedLessons, currentLesson]);

  const handleLoadLesson = useCallback((lessonId: string) => {
    loadLesson(lessonId);
    // Auto-open sidebar if closed
    if (!useGitStore.getState().sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [loadLesson, setSidebarOpen]);

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Git Lessons</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Learn Git step by step with the Recipe Book
        </p>
        {recommendation && (
          <button
            type="button"
            onClick={() => handleLoadLesson(recommendation.lessonId)}
            className="mt-3 w-full rounded-md border border-primary/20 bg-primary/5 p-2 text-left text-xs hover:bg-primary/10"
          >
            <div className="font-semibold text-primary">Recommended next</div>
            <div className="font-medium">{recommendation.title}</div>
            <div className="text-muted-foreground">{recommendation.reason}</div>
          </button>
        )}
      </div>

      {/* Lesson List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <Accordion
            type="single"
            collapsible
            defaultValue={defaultCategory}
          >
            {categories.map((category) => {
              const lessons = lessonProvider.getLessonsByCategory(category.id);
              if (lessons.length === 0) return null;

              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border rounded-lg mb-2 overflow-hidden"
                >
                  <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{category.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full ml-auto shrink-0"
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-2">
                      {lessons.map((lesson) => {
                        const isActive = currentLessonId === lesson.id;
                        const prerequisitesMet = lessonProvider.arePrerequisitesMet(
                          lesson.id,
                          completedLessons
                        );
                        const lessonCompleted = completedLessons.has(lesson.id);
                        const completedCount = lesson.steps.filter((s) =>
                          completedSteps.has(s.id)
                        ).length;
                        const isLocked = !prerequisitesMet;

                        return (
                          <div
                            key={lesson.id}
                            className={`border rounded-md overflow-hidden transition-colors ${
                              isActive
                                ? 'border-primary/30 bg-primary/5'
                                : isLocked
                                ? 'border-muted/50 bg-muted/20 opacity-60'
                                : 'border-border hover:border-primary/20'
                            }`}
                          >
                            {/* Lesson Header */}
                            <div className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{lesson.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">
                                    {lesson.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {completedCount}/{lesson.steps.length} steps
                                  </div>
                                </div>
                                {isLocked ? (
                                  <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                ) : lessonCompleted ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-emerald-100 text-emerald-700 shrink-0"
                                  >
                                    Done
                                  </Badge>
                                ) : null}
                              </div>

                              {/* Progress bar */}
                              <div className="mt-1.5">
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${(completedCount / lesson.steps.length) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                              {isLocked && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  Complete prerequisites first
                                </p>
                              )}
                            </div>

                            {/* Steps (only show when active or completed and not locked) */}
                            {isActive && !isLocked && (
                              <div className="px-3 pb-2 space-y-1.5">
                                {lesson.steps.map((step, idx) => (
                                  <StepItem
                                    key={step.id}
                                    step={step}
                                    isCompleted={completedSteps.has(step.id)}
                                    isCurrent={isActive && idx === currentStepIndex}
                                    justCompleted={justCompletedStepId === step.id}
                                  />
                                ))}

                                {/* Start / Restart Button */}
                                <Button
                                  size="sm"
                                  className="w-full text-xs"
                                  variant={isActive ? 'outline' : 'default'}
                                  onClick={() => handleLoadLesson(lesson.id)}
                                >
                                  {isActive ? (
                                    <>
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Restart Lesson
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3 mr-1" />
                                      Start Lesson
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}

                            {/* Start button for non-active, non-locked lessons */}
                            {!isActive && !isLocked && (
                              <div className="px-3 pb-2">
                                <Button
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() => handleLoadLesson(lesson.id)}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Start Lesson
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-3 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={resetAll}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset Repository
        </Button>
      </div>
    </div>
  );
}
