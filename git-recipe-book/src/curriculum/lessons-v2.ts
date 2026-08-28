import { BRANCHING_LESSONS } from './lessons/branching'
import { CORE_LESSONS } from './lessons/core'
import { RECOVERY_LESSONS } from './lessons/recovery'
import { REMOTE_LESSONS } from './lessons/remotes'
import { REVIEW_LESSONS } from './lessons/review'
import { SELECTIVE_HISTORY_LESSONS } from './lessons/selective-history'
import type { LessonDefinitionV2 } from './types'

/**
 * Curriculum v2 is intentionally split by conceptual dependency rather than by
 * simulator implementation. The legacy LessonProvider consumes this through an
 * adapter until the remaining engine facade can be retired.
 */
export const LESSONS_V2: LessonDefinitionV2[] = [
  ...CORE_LESSONS,
  ...BRANCHING_LESSONS,
  ...RECOVERY_LESSONS,
  ...REMOTE_LESSONS,
  ...SELECTIVE_HISTORY_LESSONS,
  ...REVIEW_LESSONS,
]
