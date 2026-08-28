import type { GitState } from '@/lib/git-types'
import type { ILesson } from '@/lib/interfaces/ILessonProvider'
import { evaluateGoalPredicates } from './goals'
import type { LessonDefinitionV2 } from './types'

export function adaptLessonV2(definition: LessonDefinitionV2): ILesson {
  return {
    id: definition.id,
    title: definition.title,
    icon: definition.icon,
    description: definition.description,
    category: definition.category,
    prerequisites: definition.prerequisites,
    order: definition.order,
    remoteSetup: definition.remoteSetup,
    curriculum: {
      version: 2,
      objective: definition.objective,
      scenarioId: definition.scenario,
      mode: definition.mode ?? 'guided',
      concepts: definition.concepts,
      phases: definition.phases,
    },
    steps: definition.steps.map((step) => ({
      ...step,
      validation: step.assessment
        ? step.assessment.goal?.length
          ? {
              type: 'custom' as const,
              customValidator: (rawCommand: string, rawState: Record<string, unknown>) => {
                const patternMatches = step.assessment?.pattern
                  ? new RegExp(step.assessment.pattern, 'i').test(rawCommand.trim())
                  : true
                return (
                  patternMatches && evaluateGoalPredicates(rawState as unknown as GitState, step.assessment?.goal ?? [])
                )
              },
            }
          : { type: 'regex' as const, pattern: step.assessment.pattern }
        : undefined,
      requiresPrediction: step.assessment?.requiresPrediction ?? Boolean(step.assessment),
      expectedResult: step.assessment?.expectedResult ?? 'success',
    })),
  }
}
