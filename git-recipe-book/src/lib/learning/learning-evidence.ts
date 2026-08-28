export type LearningEvidenceKind = 'guided-success' | 'retrieval' | 'transfer' | 'hint'
export type LearningEvidenceOutcome = 'passed' | 'missed' | 'used'

export interface LearningEvidence {
  id: string
  lessonId: string
  stepId: string
  conceptIds: string[]
  kind: LearningEvidenceKind
  outcome: LearningEvidenceOutcome
  timestamp: number
  hintLevel?: number
}

export function evidenceConceptIds(
  stepConcepts: string[] | undefined,
  lessonConcepts: { introduces: string[]; practices: string[]; assesses: string[] } | undefined,
  fallbackStepId: string,
): string[] {
  if (stepConcepts?.length) return [...new Set(stepConcepts)]
  if (lessonConcepts) {
    const concepts = [...lessonConcepts.assesses, ...lessonConcepts.practices, ...lessonConcepts.introduces]
    if (concepts.length) return [...new Set(concepts)]
  }
  return [fallbackStepId]
}
