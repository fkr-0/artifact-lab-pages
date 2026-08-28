import { TEACHING_SIMULATOR_COMMANDS, gitSubcommandFromText } from '@/lib/git-capabilities'
import { CONCEPT_IDS } from './concepts'
import { SCENARIOS } from './scenarios'
import type { LessonDefinitionV2 } from './types'

export function validateCurriculumV2(lessons: LessonDefinitionV2[]): string[] {
  const errors: string[] = []
  const scenarioIds = new Set(SCENARIOS.map((scenario) => scenario.id))
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))

  if (lessonIds.size !== lessons.length) errors.push('lesson ids must be unique')

  for (const lesson of lessons) {
    if (!scenarioIds.has(lesson.scenario)) errors.push(`${lesson.id}: unknown scenario ${lesson.scenario}`)
    for (const concept of [
      ...lesson.concepts.requires,
      ...lesson.concepts.introduces,
      ...lesson.concepts.practices,
      ...lesson.concepts.assesses,
    ]) {
      if (!CONCEPT_IDS.has(concept)) errors.push(`${lesson.id}: unknown concept ${concept}`)
    }
    for (const prerequisite of lesson.prerequisites) {
      if (!lessonIds.has(prerequisite)) errors.push(`${lesson.id}: unknown v2 prerequisite ${prerequisite}`)
    }
    for (const step of lesson.steps) {
      const command = gitSubcommandFromText(`${step.exactCommand ?? ''} ${step.hint}`)
      if (command && !TEACHING_SIMULATOR_COMMANDS.has(command))
        errors.push(`${lesson.id}/${step.id}: unsupported git command ${command}`)
      for (const concept of step.concepts ?? []) {
        if (!CONCEPT_IDS.has(concept)) errors.push(`${lesson.id}/${step.id}: unknown concept ${concept}`)
      }
      if (step.knowledgeCheck) {
        if (step.knowledgeCheck.options.length < 2)
          errors.push(`${lesson.id}/${step.id}: knowledge check needs 2+ options`)
        if (
          step.knowledgeCheck.correctOption < 0 ||
          step.knowledgeCheck.correctOption >= step.knowledgeCheck.options.length
        )
          errors.push(`${lesson.id}/${step.id}: knowledge check correct option is out of range`)
      }
      if (step.assessment && !step.assessment.pattern && !step.assessment.goal?.length) {
        errors.push(`${lesson.id}/${step.id}: assessment requires a pattern or goal`)
      }
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      errors.push(`prerequisite cycle contains ${id}`)
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite)
    visiting.delete(id)
    visited.add(id)
  }
  for (const lesson of lessons) visit(lesson.id)

  return [...new Set(errors)]
}
