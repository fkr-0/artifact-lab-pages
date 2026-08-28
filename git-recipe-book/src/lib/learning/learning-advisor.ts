import type { ILesson, ILessonStep } from '../interfaces'
import type { LearningEvidence } from './learning-evidence'

export type CheckpointResult = 'passed' | 'missed'
export type ConceptMasteryLevel =
  | 'unseen'
  | 'introduced'
  | 'guided-success'
  | 'retrieved'
  | 'transferred'
  | 'needs-review'
  | 'secure'

export interface ConceptMastery {
  conceptId: string
  level: ConceptMasteryLevel
  evidence: string[]
  latestEvidenceAt?: Date
  hintUses: number
}

export interface BuildConceptMasteryInput {
  lessons: ILesson[]
  completedLessonIds: Set<string>
  checkpointResults?: Record<string, CheckpointResult>
  learningEvidence?: LearningEvidence[]
  /** Evaluation time used to decide whether scheduled reviews are due. */
  now?: Date
  /** Compatibility timestamp for legacy checkpoint evidence. */
  practicedAt?: Date
}

export interface ConceptReviewScheduleEntry {
  conceptId: string
  level: ConceptMasteryLevel
  intervalDays: number
  dueAt: Date
  evidence: string[]
}

export type LearningRecommendationType = 'lesson' | 'review' | 'challenge'

export interface LearningRecommendation {
  type: LearningRecommendationType
  lessonId: string
  title: string
  reason: string
  priority: number
}

// Compatibility fallback while the remaining historical lesson IDs migrate to v2.
const STEP_CONCEPTS: Record<string, string[]> = {
  'why-git': ['version-control', 'snapshot'],
  'repo-anatomy': ['repository-anatomy'],
  'three-areas': ['three-areas'],
  'commit-model': ['commit-graph', 'head'],
  'safe-practice-loop': ['safe-practice-loop'],
  'glossary-core': ['git-vocabulary'],
  'danger-map': ['safety-recovery'],
  'review-three-areas': ['three-areas'],
  'challenge-small-feature': ['transfer-practice'],
}

const CHALLENGE_GATE_CONCEPTS = ['staging-area', 'selective-staging', 'branch', 'recovery', 'remote-tracking']

function conceptsForStep(step: ILessonStep, lesson?: ILesson): string[] {
  if (step.concepts?.length) return step.concepts
  if (STEP_CONCEPTS[step.id]) return STEP_CONCEPTS[step.id]
  if (lesson?.curriculum) {
    const concepts = [
      ...lesson.curriculum.concepts.assesses,
      ...lesson.curriculum.concepts.practices,
      ...lesson.curriculum.concepts.introduces,
    ]
    if (concepts.length) return [...new Set(concepts)]
  }

  const normalizedTerms =
    step.toolIntroductions
      ?.map((intro) =>
        intro.term
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      )
      .filter(Boolean) ?? []

  return normalizedTerms.length > 0 ? normalizedTerms : [step.id]
}

function ensureMastery(mastery: Record<string, ConceptMastery>, conceptId: string): ConceptMastery {
  mastery[conceptId] ??= { conceptId, level: 'unseen', evidence: [], hintUses: 0 }
  return mastery[conceptId]
}

function checkpointKey(lesson: ILesson, step: ILessonStep): string {
  return `${lesson.id}/${step.id}`
}

function levelRank(level: ConceptMasteryLevel): number {
  switch (level) {
    case 'unseen':
      return 0
    case 'introduced':
      return 1
    case 'guided-success':
      return 2
    case 'retrieved':
      return 3
    case 'transferred':
      return 4
    case 'secure':
      return 5
    case 'needs-review':
      return -1
  }
}

function promote(entry: ConceptMastery, target: ConceptMasteryLevel): void {
  if (entry.level === 'needs-review' || levelRank(target) > levelRank(entry.level)) entry.level = target
}

export function buildConceptMastery(input: BuildConceptMasteryInput): Record<string, ConceptMastery> {
  const checkpointResults = input.checkpointResults ?? {}
  const mastery: Record<string, ConceptMastery> = {}

  for (const lesson of input.lessons) {
    for (const step of lesson.steps) {
      for (const conceptId of conceptsForStep(step, lesson)) {
        const entry = ensureMastery(mastery, conceptId)
        if (input.completedLessonIds.has(lesson.id) && entry.level === 'unseen') {
          entry.level = 'introduced'
          entry.evidence.push(`completed lesson ${lesson.id}`)
        }
      }
    }
  }

  for (const [key, result] of Object.entries(checkpointResults)) {
    const [lessonId, stepId] = key.split('/')
    const lesson = input.lessons.find((candidate) => candidate.id === lessonId)
    const step = lesson?.steps.find((candidate) => candidate.id === stepId)
    if (!lesson || !step) continue

    for (const conceptId of conceptsForStep(step, lesson)) {
      const entry = ensureMastery(mastery, conceptId)
      if (result === 'passed') {
        // Legacy callers historically interpreted a passed checkpoint as secure.
        entry.level = input.learningEvidence?.length ? 'retrieved' : 'secure'
        entry.evidence.push(`passed checkpoint ${key}`)
      } else {
        entry.level = 'needs-review'
        entry.evidence.push(`missed checkpoint ${key}`)
      }
    }
  }

  const orderedEvidence = [...(input.learningEvidence ?? [])].sort((a, b) => a.timestamp - b.timestamp)
  const evidenceKinds = new Map<string, Set<string>>()
  for (const evidence of orderedEvidence) {
    for (const conceptId of evidence.conceptIds) {
      const entry = ensureMastery(mastery, conceptId)
      entry.latestEvidenceAt = new Date(evidence.timestamp)
      entry.evidence.push(`${evidence.kind} ${evidence.outcome} ${evidence.lessonId}/${evidence.stepId}`)
      if (evidence.kind === 'hint') {
        entry.hintUses += 1
        continue
      }
      const kinds = evidenceKinds.get(conceptId) ?? new Set<string>()
      if (evidence.outcome === 'missed') {
        entry.level = 'needs-review'
        evidenceKinds.set(conceptId, kinds)
        continue
      }
      if (evidence.kind === 'guided-success') promote(entry, 'guided-success')
      if (evidence.kind === 'retrieval') {
        kinds.add('retrieval')
        promote(entry, 'retrieved')
      }
      if (evidence.kind === 'transfer') {
        kinds.add('transfer')
        promote(entry, 'transferred')
      }
      if (kinds.has('retrieval') && kinds.has('transfer')) entry.level = 'secure'
      evidenceKinds.set(conceptId, kinds)
    }
  }

  return mastery
}

function prerequisitesMet(lesson: ILesson, completedLessonIds: Set<string>): boolean {
  return lesson.prerequisites.every((id) => completedLessonIds.has(id))
}

function lessonById(lessons: ILesson[], id: string): ILesson | undefined {
  return lessons.find((lesson) => lesson.id === id)
}

function weakestGateConcept(mastery: Record<string, ConceptMastery>): string | undefined {
  return CHALLENGE_GATE_CONCEPTS.find((conceptId) => {
    const level = mastery[conceptId]?.level ?? 'unseen'
    return level !== 'secure' && level !== 'transferred'
  })
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function successfulCheckpointCount(concept: ConceptMastery): number {
  return concept.evidence.filter((entry) => entry.startsWith('passed checkpoint ')).length
}

function reviewIntervalDays(concept: ConceptMastery): number {
  if (concept.level === 'needs-review') return 0
  if (concept.level === 'secure') return Math.min(30, 14 * 2 ** Math.max(0, successfulCheckpointCount(concept) - 1))
  if (concept.level === 'transferred') return 7
  if (concept.level === 'retrieved') return 3
  if (concept.level === 'guided-success' || concept.level === 'introduced') return 1
  return 0
}

export function buildReviewSchedule(input: BuildConceptMasteryInput): Record<string, ConceptReviewScheduleEntry> {
  const fallbackPracticeTime = input.practicedAt ?? input.now ?? new Date()
  const mastery = buildConceptMastery(input)
  const schedule: Record<string, ConceptReviewScheduleEntry> = {}

  for (const concept of Object.values(mastery)) {
    if (concept.level === 'unseen') continue
    const intervalDays = reviewIntervalDays(concept)
    const practicedAt = concept.latestEvidenceAt ?? fallbackPracticeTime
    schedule[concept.conceptId] = {
      conceptId: concept.conceptId,
      level: concept.level,
      intervalDays,
      dueAt: addDays(practicedAt, intervalDays),
      evidence: concept.evidence,
    }
  }

  return schedule
}

function dueReviewConcept(schedule: Record<string, ConceptReviewScheduleEntry>, now: Date): string | undefined {
  return Object.values(schedule)
    .filter((entry) => entry.dueAt <= now)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime() || a.conceptId.localeCompare(b.conceptId))[0]?.conceptId
}

export function recommendNextLearningActions(input: BuildConceptMasteryInput): LearningRecommendation[] {
  const mastery = buildConceptMastery(input)
  const recommendations: LearningRecommendation[] = []
  const weakGateConcept = weakestGateConcept(mastery)
  const reviewLesson = lessonById(input.lessons, 'spaced-review')
  const now = input.now ?? new Date()
  const dueConcept = dueReviewConcept(buildReviewSchedule(input), now)

  if (dueConcept && reviewLesson && prerequisitesMet(reviewLesson, input.completedLessonIds)) {
    recommendations.push({
      type: 'review',
      lessonId: reviewLesson.id,
      title: reviewLesson.title,
      reason: `Spaced review is due for ${dueConcept}.`,
      priority: 110,
    })
  }

  if (!dueConcept && weakGateConcept && reviewLesson && prerequisitesMet(reviewLesson, input.completedLessonIds)) {
    recommendations.push({
      type: 'review',
      lessonId: reviewLesson.id,
      title: reviewLesson.title,
      reason: `Review ${weakGateConcept} before moving into open-ended challenge work.`,
      priority: 100,
    })
  }

  const challengeLesson = lessonById(input.lessons, 'challenge-mode')
  if (!weakGateConcept && challengeLesson && prerequisitesMet(challengeLesson, input.completedLessonIds)) {
    recommendations.push({
      type: 'challenge',
      lessonId: challengeLesson.id,
      title: challengeLesson.title,
      reason: 'Core concepts have retrieval and transfer evidence suitable for open-ended practice.',
      priority: 90,
    })
  }

  for (const lesson of input.lessons) {
    if (input.completedLessonIds.has(lesson.id)) continue
    if (lesson.id === reviewLesson?.id || lesson.id === challengeLesson?.id) continue
    if (!prerequisitesMet(lesson, input.completedLessonIds)) continue

    recommendations.push({
      type: 'lesson',
      lessonId: lesson.id,
      title: lesson.title,
      reason: `Next unlocked ${lesson.curriculum?.mode === 'practice' ? 'practice lab' : 'lesson'} in ${lesson.category}.`,
      priority: 50 - lesson.order,
    })
  }

  return recommendations.sort((a, b) => b.priority - a.priority || a.lessonId.localeCompare(b.lessonId))
}
