import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ILesson } from '@/lib/interfaces/ILessonProvider'
import { recommendNextLearningActions } from '@/lib/learning/learning-advisor'
import { lessonProvider, useGitStore } from '@/stores/git-store'
import { CheckCircle2, ChevronRight, Circle, LockKeyhole, PlayCircle, RotateCcw, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'

function lessonStatus(
  lesson: ILesson,
  currentLessonId: string | null,
  completedLessons: Set<string>,
  lessonProgress: Record<string, number>,
): 'mastered' | 'active' | 'available' | 'locked' {
  if (completedLessons.has(lesson.id)) return 'mastered'
  if (currentLessonId === lesson.id) return 'active'
  if (!lessonProvider.arePrerequisitesMet(lesson.id, completedLessons)) return 'locked'
  if ((lessonProgress[lesson.id] ?? 0) > 0) return 'active'
  return 'available'
}

function LessonCard({ lesson }: { lesson: ILesson }) {
  const { currentLessonId, completedLessons, lessonProgress, loadLesson } = useGitStore()
  const status = lessonStatus(lesson, currentLessonId, completedLessons, lessonProgress)
  const progress = Math.min(lessonProgress[lesson.id] ?? 0, lesson.steps.length)
  const progressPercent = lesson.steps.length > 0 ? (progress / lesson.steps.length) * 100 : 0
  const locked = status === 'locked'
  const estimatedMinutes = Math.max(
    3,
    Math.round(lesson.steps.reduce((total, step) => total + (step.estimatedTime ?? 60), 0) / 60),
  )
  const mode = lesson.curriculum?.mode ?? 'guided'
  const modeLabel =
    mode === 'practice'
      ? 'practice lab'
      : mode === 'recovery'
        ? 'recovery lab'
        : mode === 'challenge'
          ? 'capstone'
          : 'guided lesson'

  return (
    <article className={`course-lesson-card course-lesson-card--${status}`}>
      <div className="course-lesson-card__icon" aria-hidden="true">
        {lesson.icon}
      </div>
      <div className="course-lesson-card__content">
        <div className="course-lesson-card__topline">
          <h4>{lesson.title}</h4>
          {status === 'mastered' && <CheckCircle2 />}
          {status === 'active' && <PlayCircle />}
          {status === 'locked' && <LockKeyhole />}
          {status === 'available' && <Circle />}
        </div>
        <p>{lesson.description}</p>
        <div className="course-lesson-card__meta">
          <span>{estimatedMinutes} min</span>
          <span>{modeLabel}</span>
          <span>
            {progress}/{lesson.steps.length} steps
          </span>
        </div>
        {(status === 'active' || status === 'mastered') && (
          <div className="course-progressbar" aria-hidden="true">
            <span style={{ width: `${status === 'mastered' ? 100 : progressPercent}%` }} />
          </div>
        )}
        <Button
          size="sm"
          variant={status === 'active' ? 'default' : 'outline'}
          disabled={locked}
          onClick={() => loadLesson(lesson.id)}
        >
          {status === 'mastered' ? (
            <RotateCcw />
          ) : status === 'active' ? (
            <PlayCircle />
          ) : status === 'locked' ? (
            <LockKeyhole />
          ) : (
            <PlayCircle />
          )}
          {status === 'mastered'
            ? 'Practice again'
            : status === 'active'
              ? 'Continue lesson'
              : status === 'locked'
                ? 'Prerequisite locked'
                : 'Start lesson'}
        </Button>
      </div>
    </article>
  )
}

export default function GitLessonPanel({ onClose }: { onClose?: () => void }) {
  const { currentLessonId, completedLessons, lessonProgress, checkpointResults, learningEvidence, loadLesson } =
    useGitStore()
  const [showFullCourse, setShowFullCourse] = useState(false)
  const lessons = lessonProvider.getLessons()
  const categories = lessonProvider.getCategories()
  const completedCount = completedLessons.size
  const completionPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0
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
  const recommended = recommendations[0]
  const focusedLessons = useMemo(() => {
    const ids = new Set<string>()
    if (currentLessonId) ids.add(currentLessonId)
    for (const recommendation of recommendations.slice(0, 2)) ids.add(recommendation.lessonId)
    const firstLocked = lessons.find(
      (lesson) => !completedLessons.has(lesson.id) && !lessonProvider.arePrerequisitesMet(lesson.id, completedLessons),
    )
    if (firstLocked) ids.add(firstLocked.id)
    return lessons.filter((lesson) => ids.has(lesson.id))
  }, [lessons, recommendations, currentLessonId, completedLessons])

  return (
    <div className="course-map">
      <header className="course-map__header">
        {onClose && (
          <button type="button" className="course-map__close" onClick={onClose} aria-label="Close course map">
            <X aria-hidden="true" />
          </button>
        )}
        <div className="course-map__title">
          <div className="course-map__mark">
            <Sparkles />
          </div>
          <div>
            <p className="learning-kicker">Course map</p>
            <h2>Git Lessons</h2>
          </div>
        </div>
        <p>Build proficiency through repeated prediction, action, inspection, and explanation.</p>
        <div className="course-map__progress">
          <div>
            <span>Course progress</span>
            <strong>
              {completedCount}/{lessons.length}
            </strong>
          </div>
          <div className="course-progressbar course-progressbar--course" aria-hidden="true">
            <span style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </header>

      {recommended && (
        <button type="button" className="course-recommendation" onClick={() => loadLesson(recommended.lessonId)}>
          <span>Recommended next</span>
          <strong>{recommended.title}</strong>
          <small>{recommended.reason}</small>
          <ChevronRight />
        </button>
      )}

      <div className="course-map__reveal-controls">
        <Button type="button" size="sm" variant="outline" onClick={() => setShowFullCourse((value) => !value)}>
          {showFullCourse ? 'Show current path' : 'Show full course'}
        </Button>
        <span>
          {showFullCourse
            ? 'All stages and prerequisites are visible.'
            : 'Only now, next, and one later stage are shown.'}
        </span>
      </div>

      <ScrollArea className="course-map__scroll">
        <div className="course-map__categories">
          {!showFullCourse && (
            <section className="course-category course-category--focus">
              <header>
                <div>
                  <span aria-hidden="true">🧭</span>
                  <h3>Current learning path</h3>
                </div>
                <Badge variant="secondary">Now → next → later</Badge>
              </header>
              <p>Finish the mechanism in front of you before expanding the whole map.</p>
              <div className="course-category__lessons">
                {focusedLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </section>
          )}
          {showFullCourse &&
            categories.map((category) => {
              const categoryLessons = lessons.filter((lesson) => lesson.category === category.id)
              if (categoryLessons.length === 0) return null
              const categoryCompleted = categoryLessons.filter((lesson) => completedLessons.has(lesson.id)).length
              return (
                <section className="course-category" key={category.id}>
                  <header>
                    <div>
                      <span aria-hidden="true">{category.icon}</span>
                      <h3>{category.title}</h3>
                    </div>
                    <Badge variant="secondary">
                      {categoryCompleted}/{categoryLessons.length}
                    </Badge>
                  </header>
                  <p>{category.description}</p>
                  <div className="course-category__lessons">
                    {categoryLessons.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </section>
              )
            })}
        </div>
      </ScrollArea>

      <footer className="course-map__footer">
        <strong>{currentLessonId ? 'Learning mode active' : 'Choose one next action'}</strong>
        <p>
          Progress and checkpoint evidence stay in this browser. Replaying a mastered lesson is practice, not failure.
        </p>
      </footer>
    </div>
  )
}
