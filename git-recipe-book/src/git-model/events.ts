import type { GitCommandResult, GitState, HEADRef } from '@/lib/git-types'

export type RepositoryEvent =
  | { type: 'repository-initialized' }
  | { type: 'working-file-changed'; path: string; before: string | null; after: string | null }
  | { type: 'index-entry-updated'; path: string; before: string | null; after: string | null }
  | { type: 'commit-created'; commitId: string; message: string; parentIds: string[] }
  | { type: 'ref-created'; ref: string; target: string; remoteTracking: boolean }
  | { type: 'ref-moved'; ref: string; before: string; after: string; remoteTracking: boolean }
  | { type: 'ref-deleted'; ref: string; before: string; remoteTracking: boolean }
  | { type: 'head-changed'; before: HEADRef; after: HEADRef }
  | { type: 'tag-created'; tag: string; target: string }
  | { type: 'tag-moved'; tag: string; before: string; after: string }
  | { type: 'remote-configured'; remote: string; url: string }
  | { type: 'remote-branch-moved'; remote: string; branch: string; before: string; after: string }
  | { type: 'upstream-configured'; branch: string; remoteRef: string }
  | { type: 'stash-count-changed'; before: number; after: number }
  | { type: 'conflict-started'; operation: 'merge'; paths: string[] }
  | { type: 'conflict-resolved'; operation: 'merge'; paths: string[] }
  | { type: 'operation-aborted'; operation: 'merge' }

function changedEntries(before: Record<string, string>, after: Record<string, string>) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)])
  return [...paths]
    .sort()
    .filter((path) => before[path] !== after[path])
    .map((path) => ({ path, before: before[path] ?? null, after: after[path] ?? null }))
}

function headEqual(left: HEADRef, right: HEADRef): boolean {
  if (left.type !== right.type) return false
  return left.type === 'branch' && right.type === 'branch'
    ? left.ref === right.ref
    : left.type === 'detached' && right.type === 'detached' && left.commitId === right.commitId
}

export function deriveRepositoryEvents(
  before: GitState,
  after: GitState,
  result?: Pick<GitCommandResult, 'success' | 'mutated'>,
): RepositoryEvent[] {
  if (result && !result.success && !result.mutated) return []

  const events: RepositoryEvent[] = []
  if (!before.initialized && after.initialized) events.push({ type: 'repository-initialized' })

  // The teaching simulator seeds its sample files during init. Real `git init`
  // does not create/edit project files, so treat that seeding as scenario setup,
  // not as a learner-visible working-tree effect of the Git command.
  if (before.initialized || !after.initialized) {
    for (const change of changedEntries(before.working, after.working)) {
      events.push({ type: 'working-file-changed', ...change })
    }
  }

  for (const [branch, next] of Object.entries(after.trackingBranches)) {
    const previous = before.trackingBranches[branch]
    if (!previous || previous.remoteBranch !== next.remoteBranch) {
      events.push({ type: 'upstream-configured', branch, remoteRef: next.remoteBranch })
    }
  }
  for (const change of changedEntries(before.staging, after.staging)) {
    events.push({ type: 'index-entry-updated', ...change })
  }

  for (const [commitId, commit] of Object.entries(after.commits)) {
    if (!before.commits[commitId]) {
      events.push({ type: 'commit-created', commitId, message: commit.message, parentIds: [...commit.parentIds] })
    }
  }

  const refs = new Set([...Object.keys(before.branches), ...Object.keys(after.branches)])
  for (const ref of [...refs].sort()) {
    const previous = before.branches[ref]
    const next = after.branches[ref]
    if (!previous && next) {
      events.push({ type: 'ref-created', ref, target: next.commitId, remoteTracking: Boolean(next.isRemote) })
    } else if (previous && !next) {
      events.push({ type: 'ref-deleted', ref, before: previous.commitId, remoteTracking: Boolean(previous.isRemote) })
    } else if (previous && next && previous.commitId !== next.commitId) {
      events.push({
        type: 'ref-moved',
        ref,
        before: previous.commitId,
        after: next.commitId,
        remoteTracking: Boolean(next.isRemote),
      })
    }
  }

  if (!headEqual(before.HEAD, after.HEAD)) events.push({ type: 'head-changed', before: before.HEAD, after: after.HEAD })

  for (const [tag, next] of Object.entries(after.tags)) {
    const previous = before.tags[tag]
    if (!previous) events.push({ type: 'tag-created', tag, target: next.commitId })
    else if (previous.commitId !== next.commitId) {
      events.push({ type: 'tag-moved', tag, before: previous.commitId, after: next.commitId })
    }
  }

  for (const [remote, next] of Object.entries(after.remotes)) {
    const previous = before.remotes[remote]
    if (!previous) events.push({ type: 'remote-configured', remote, url: next.url })
    const branchNames = new Set([...Object.keys(previous?.branches ?? {}), ...Object.keys(next.branches)])
    for (const branch of [...branchNames].sort()) {
      const oldTarget = previous?.branches[branch]?.commitId ?? ''
      const newTarget = next.branches[branch]?.commitId ?? ''
      if (oldTarget !== newTarget) {
        events.push({ type: 'remote-branch-moved', remote, branch, before: oldTarget, after: newTarget })
      }
    }
  }

  if (before.stash.length !== after.stash.length) {
    events.push({ type: 'stash-count-changed', before: before.stash.length, after: after.stash.length })
  }

  if (!before.pendingOperation && after.pendingOperation?.type === 'merge') {
    events.push({ type: 'conflict-started', operation: 'merge', paths: [...after.pendingOperation.conflictPaths] })
  } else if (before.pendingOperation?.type === 'merge' && !after.pendingOperation) {
    const workingStillAtOriginal =
      after.HEAD.type === 'branch' &&
      after.branches[after.HEAD.ref]?.commitId === before.pendingOperation.originalHeadCommitId
    events.push(
      workingStillAtOriginal
        ? { type: 'operation-aborted', operation: 'merge' }
        : { type: 'conflict-resolved', operation: 'merge', paths: [...before.pendingOperation.conflictPaths] },
    )
  }

  return events
}
