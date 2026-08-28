import type { GitState } from '@/lib/git-types'
import type { GoalPredicate } from './types'

function headCommitId(state: GitState): string {
  if (state.HEAD.type === 'detached') return state.HEAD.commitId
  return state.branches[state.HEAD.ref]?.commitId ?? ''
}

function workingClean(state: GitState): boolean {
  const head = state.commits[headCommitId(state)]?.tree ?? {}
  const paths = new Set([...Object.keys(head), ...Object.keys(state.working)])
  return Object.keys(state.staging).length === 0 && [...paths].every((path) => head[path] === state.working[path])
}

export function evaluateGoalPredicate(state: GitState, predicate: GoalPredicate): boolean {
  switch (predicate.type) {
    case 'repository-initialized':
      return state.initialized
    case 'head-branch':
      return state.HEAD.type === 'branch' && state.HEAD.ref === predicate.branch
    case 'branch-exists':
      return Boolean(state.branches[predicate.branch] && !state.branches[predicate.branch].isRemote)
    case 'staged-includes':
      return state.staging[predicate.path] !== undefined
    case 'staged-excludes':
      return state.staging[predicate.path] === undefined
    case 'working-clean':
      return workingClean(state)
    case 'commit-count-at-least':
      return Object.keys(state.commits).length >= predicate.count
    case 'commit-message-exists':
      return Object.values(state.commits).some((commit) => commit.message.includes(predicate.message))
    case 'head-parent-count':
      return (state.commits[headCommitId(state)]?.parentIds.length ?? 0) === predicate.count
    case 'tag-exists':
      return Boolean(state.tags[predicate.tag])
    case 'stash-count':
      return state.stash.length === predicate.count
    case 'remote-exists':
      return Boolean(state.remotes[predicate.remote])
    case 'tracking-configured':
      return state.trackingBranches[predicate.branch]?.remoteBranch === predicate.remoteRef
    case 'remote-tracking-ref-exists':
      return Boolean(state.branches[predicate.ref]?.isRemote)
    case 'remote-branch-matches-local':
      return (
        state.remotes[predicate.remote]?.branches[predicate.remoteBranch]?.commitId ===
        state.branches[predicate.localBranch]?.commitId
      )
    case 'pending-operation':
      return state.pendingOperation?.type === predicate.operation
    case 'no-pending-operation':
      return !state.pendingOperation
  }
}

export function evaluateGoalPredicates(state: GitState, predicates: GoalPredicate[]): boolean {
  return predicates.every((predicate) => evaluateGoalPredicate(state, predicate))
}
