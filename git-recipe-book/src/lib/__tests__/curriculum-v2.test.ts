import { LESSONS_V2, getScenario, loadScenario, validateCurriculumV2 } from '@/curriculum'
import { describe, expect, it } from 'vitest'
import { TEACHING_SIMULATOR_COMMANDS, gitSubcommandFromText } from '../git-capabilities'
import { GitSimulator } from '../git-simulator'
import { LessonProvider } from '../lessons/lesson-provider'

describe('curriculum v2 contract', () => {
  it('validates the complete curriculum-v2 graph', () => {
    expect(validateCurriculumV2(LESSONS_V2)).toEqual([])
  })

  it('exposes every curriculum lesson through the compatibility provider as v2 metadata', () => {
    const provider = new LessonProvider()
    for (const declaration of LESSONS_V2) {
      expect(provider.getLesson(declaration.id)?.curriculum).toMatchObject({
        version: 2,
        scenarioId: declaration.scenario,
        mode: declaration.mode ?? 'guided',
      })
    }
  })

  it('keeps every bundled lesson command inside the simulator support matrix', () => {
    const provider = new LessonProvider()
    const unsupported: string[] = []

    for (const lesson of provider.getLessons()) {
      for (const step of lesson.steps) {
        const command = gitSubcommandFromText(`${step.exactCommand ?? ''} ${step.hint}`)
        if (command && !TEACHING_SIMULATOR_COMMANDS.has(command)) unsupported.push(`${lesson.id}/${step.id}:${command}`)
      }
    }

    expect(unsupported).toEqual([])
  })

  it('rejects prerequisite cycles before lessons reach the runtime', () => {
    const broken = LESSONS_V2.map((lesson) => ({
      ...lesson,
      prerequisites: lesson.id === 'orientation' ? ['basics'] : [...lesson.prerequisites],
    }))
    expect(validateCurriculumV2(broken)).toContain('prerequisite cycle contains orientation')
  })

  it('constructs every declared scenario without hidden setup failures', () => {
    const failures: string[] = []
    for (const lesson of LESSONS_V2) {
      const scenario = getScenario(lesson.scenario)
      if (!scenario) {
        failures.push(`${lesson.id}: missing ${lesson.scenario}`)
        continue
      }
      const backend = new GitSimulator()
      for (const failure of loadScenario(backend, scenario)) failures.push(`${lesson.id}: ${failure}`)
    }
    expect(failures).toEqual([])
  })

  it('gives command practice explicit outcomes, retrieval checks, and progressive hints', () => {
    for (const lesson of LESSONS_V2) {
      expect(lesson.objective.length, lesson.id).toBeGreaterThan(12)
      for (const step of lesson.steps) {
        expect(step.expectedOutcome, `${lesson.id}/${step.id}`).toBeTruthy()
        expect(step.knowledgeCheck, `${lesson.id}/${step.id}`).toBeDefined()
        if (step.assessment) {
          expect(step.checkpointQuestions?.length ?? 0, `${lesson.id}/${step.id}`).toBeGreaterThan(0)
          expect(step.progressiveHints?.length ?? 0, `${lesson.id}/${step.id}`).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('can complete every assessed step through its declared reference path', () => {
    const provider = new LessonProvider()
    const failures: string[] = []

    for (const lesson of LESSONS_V2) {
      const scenario = getScenario(lesson.scenario)
      if (!scenario) continue
      const backend = new GitSimulator()
      const setupFailures = loadScenario(backend, scenario)
      if (setupFailures.length) {
        failures.push(`${lesson.id}: setup ${setupFailures.join('; ')}`)
        continue
      }

      for (const [stepIndex, step] of lesson.steps.entries()) {
        if (!step.assessment) continue
        const commands = step.referenceSolution ?? (step.exactCommand ? [step.exactCommand] : [])
        if (commands.length === 0) {
          failures.push(`${lesson.id}/${step.id}: no reference solution`)
          continue
        }
        let lastCommand = ''
        let lastResult: ReturnType<GitSimulator['execute']> | undefined
        for (const command of commands) {
          lastCommand = command
          lastResult = backend.execute(command)
        }
        const expectedResult = step.assessment.expectedResult ?? 'success'
        if (expectedResult === 'success' && !lastResult?.success) {
          failures.push(`${lesson.id}/${step.id}: reference command failed: ${lastResult?.error}`)
          continue
        }
        if (expectedResult === 'failure' && lastResult?.success) {
          failures.push(`${lesson.id}/${step.id}: expected Git to reject/stop the reference command`)
          continue
        }
        const valid = provider.validateStep(
          lesson.id,
          stepIndex,
          lastCommand,
          backend.getState() as unknown as Record<string, unknown>,
        )
        if (!valid) failures.push(`${lesson.id}/${step.id}: reference state did not satisfy the assessment`)
      }
    }

    expect(failures).toEqual([])
  })
})
