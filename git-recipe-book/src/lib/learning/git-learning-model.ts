import type { GitCommandResult, GitState } from '../git-types'

export type GitStateLayer = 'working' | 'staging' | 'history' | 'refs' | 'remote'

export type CommandRisk = 'observe' | 'safe-change' | 'history-change' | 'destructive'

export interface GitStateSummary {
  initialized: boolean
  workingCount: number
  stagedCount: number
  commitCount: number
  branchCount: number
  remoteCount: number
  tagCount: number
  stashCount: number
  headLabel: string
  headCommitId: string | null
  clean: boolean
}

export interface CommandClassification {
  command: string
  verb: string
  title: string
  intent: string
  risk: CommandRisk
  expectedLayers: GitStateLayer[]
  safetyNote?: string
}

export interface GitLayerChange {
  layer: GitStateLayer
  changed: boolean
  before: string
  after: string
  explanation: string
}

export interface CommandLearningInsight extends CommandClassification {
  success: boolean
  output: string
  before: GitStateSummary
  after: GitStateSummary
  actualLayers: GitStateLayer[]
  changes: GitLayerChange[]
  explanation: string
}

const LAYER_ORDER: GitStateLayer[] = ['working', 'staging', 'history', 'refs', 'remote']

const CLASSIFICATIONS: Record<string, Omit<CommandClassification, 'command' | 'verb'>> = {
  init: {
    title: 'Create the repository memory',
    intent: 'Create Git metadata and the first branch pointer without changing project files.',
    risk: 'safe-change',
    expectedLayers: ['history', 'refs'],
  },
  status: {
    title: 'Orient without changing anything',
    intent: 'Compare the working tree, staging area, and current commit.',
    risk: 'observe',
    expectedLayers: [],
  },
  diff: {
    title: 'Inspect a difference',
    intent: 'Read changes without moving them between Git layers.',
    risk: 'observe',
    expectedLayers: [],
  },
  log: {
    title: 'Read recorded history',
    intent: 'Inspect commits and their parent relationships.',
    risk: 'observe',
    expectedLayers: [],
  },
  add: {
    title: 'Select the next snapshot',
    intent: 'Copy chosen working-tree content into the staging area.',
    risk: 'safe-change',
    expectedLayers: ['staging'],
  },
  commit: {
    title: 'Record a linked snapshot',
    intent: 'Turn the staged selection into a commit and advance the current branch.',
    risk: 'history-change',
    expectedLayers: ['staging', 'history', 'refs'],
  },
  branch: {
    title: 'Create or inspect a movable pointer',
    intent: 'Work with branch names that point at commits.',
    risk: 'safe-change',
    expectedLayers: ['refs'],
  },
  checkout: {
    title: 'Move to another point in history',
    intent: 'Move HEAD and update visible files to match the selected branch or commit.',
    risk: 'history-change',
    expectedLayers: ['working', 'refs'],
    safetyNote: 'Check git status first. Uncommitted changes can block or travel with the checkout.',
  },
  switch: {
    title: 'Switch the active branch',
    intent: 'Move HEAD to another branch and update the working tree.',
    risk: 'history-change',
    expectedLayers: ['working', 'refs'],
    safetyNote: 'Check git status before switching so unfinished work is not carried unexpectedly.',
  },
  merge: {
    title: 'Join two lines of history',
    intent: 'Integrate another branch into the current branch.',
    risk: 'history-change',
    expectedLayers: ['working', 'history', 'refs'],
    safetyNote: 'The current branch receives the merge. Orient on the graph before running it.',
  },
  rebase: {
    title: 'Replay commits onto a new base',
    intent: 'Create replacement commits so one line of work begins at another commit.',
    risk: 'destructive',
    expectedLayers: ['working', 'history', 'refs'],
    safetyNote: 'Rebase rewrites commit IDs. Avoid rebasing shared commits unless collaborators agree.',
  },
  reset: {
    title: 'Move a branch pointer backward',
    intent: 'Change where the current branch points and optionally replace staged or working content.',
    risk: 'destructive',
    expectedLayers: ['working', 'staging', 'refs'],
    safetyNote: 'reset --hard discards uncommitted work. Create a backup branch before real destructive recovery.',
  },
  'cherry-pick': {
    title: 'Copy one change onto this branch',
    intent: 'Replay one selected commit as a new commit on the current branch.',
    risk: 'history-change',
    expectedLayers: ['working', 'history', 'refs'],
  },
  stash: {
    title: 'Temporarily shelve unfinished work',
    intent: 'Move uncommitted changes out of the working tree into a stash entry.',
    risk: 'safe-change',
    expectedLayers: ['working', 'history'],
  },
  tag: {
    title: 'Attach a stable name to a commit',
    intent: 'Create or inspect a tag that continues pointing to one commit.',
    risk: 'safe-change',
    expectedLayers: ['refs'],
  },
  remote: {
    title: 'Configure another repository copy',
    intent: 'Create or inspect named remote connections.',
    risk: 'safe-change',
    expectedLayers: ['remote'],
  },
  fetch: {
    title: 'Update remote knowledge safely',
    intent: 'Download remote commits and update remote-tracking pointers without changing local files.',
    risk: 'safe-change',
    expectedLayers: ['refs', 'remote'],
  },
  pull: {
    title: 'Download and integrate remote work',
    intent: 'Fetch remote history and integrate it into the current branch.',
    risk: 'history-change',
    expectedLayers: ['working', 'history', 'refs', 'remote'],
  },
  push: {
    title: 'Publish local commits',
    intent: 'Move a remote branch forward to include local history.',
    risk: 'history-change',
    expectedLayers: ['remote'],
  },
  edit: {
    title: 'Change a visible project file',
    intent: 'Modify the working tree without staging or recording the edit.',
    risk: 'safe-change',
    expectedLayers: ['working'],
  },
  help: {
    title: 'Inspect available commands',
    intent: 'Read help without changing repository state.',
    risk: 'observe',
    expectedLayers: [],
  },
}

function headCommitId(state: GitState): string | null {
  if (state.HEAD.type === 'detached') return state.HEAD.commitId || null
  return state.branches[state.HEAD.ref]?.commitId || null
}

function workingDiffCount(state: GitState): number {
  const tip = state.commits[headCommitId(state) || '']?.tree ?? {}
  const paths = new Set([...Object.keys(tip), ...Object.keys(state.working)])
  let count = 0
  for (const path of paths) {
    if (tip[path] !== state.working[path]) count += 1
  }
  return count
}

export function summarizeGitState(state: GitState): GitStateSummary {
  const currentHead = headCommitId(state)
  return {
    initialized: state.initialized,
    workingCount: workingDiffCount(state),
    stagedCount: Object.keys(state.staging).length,
    commitCount: Object.keys(state.commits).length,
    branchCount: Object.values(state.branches).filter((branch) => !branch.isRemote).length,
    remoteCount: Object.keys(state.remotes).length,
    tagCount: Object.keys(state.tags).length,
    stashCount: state.stash.length,
    headLabel: state.HEAD.type === 'branch' ? state.HEAD.ref : `detached ${state.HEAD.commitId?.slice(0, 7) ?? ''}`,
    headCommitId: currentHead,
    clean: workingDiffCount(state) === 0 && Object.keys(state.staging).length === 0,
  }
}

function commandVerb(raw: string): string {
  const tokens = raw.trim().toLowerCase().split(/\s+/)
  if (tokens[0] === 'git') return tokens[1] ?? 'git'
  return tokens[0] ?? ''
}

export function classifyGitCommand(raw: string): CommandClassification {
  const verb = commandVerb(raw)
  const known = CLASSIFICATIONS[verb]
  if (known) return { command: raw.trim(), verb, ...known }

  return {
    command: raw.trim(),
    verb,
    title: 'Run a repository operation',
    intent: 'Observe how this command changes the simulated repository.',
    risk: 'safe-change',
    expectedLayers: [],
  }
}

function layerValue(layer: GitStateLayer, summary: GitStateSummary): string {
  switch (layer) {
    case 'working':
      return summary.workingCount === 0 ? 'clean' : `${summary.workingCount} changed`
    case 'staging':
      return summary.stagedCount === 0 ? 'empty' : `${summary.stagedCount} staged`
    case 'history':
      return `${summary.commitCount} commit${summary.commitCount === 1 ? '' : 's'}`
    case 'refs':
      return `${summary.headLabel} · ${summary.branchCount} branch${summary.branchCount === 1 ? '' : 'es'} · ${summary.tagCount} tag${summary.tagCount === 1 ? '' : 's'}`
    case 'remote':
      return `${summary.remoteCount} remote${summary.remoteCount === 1 ? '' : 's'}`
  }
}

function layerChanged(layer: GitStateLayer, before: GitStateSummary, after: GitStateSummary): boolean {
  switch (layer) {
    case 'working':
      return before.workingCount !== after.workingCount
    case 'staging':
      return before.stagedCount !== after.stagedCount
    case 'history':
      return before.commitCount !== after.commitCount || before.stashCount !== after.stashCount
    case 'refs':
      return (
        before.headLabel !== after.headLabel ||
        before.headCommitId !== after.headCommitId ||
        before.branchCount !== after.branchCount ||
        before.tagCount !== after.tagCount ||
        before.initialized !== after.initialized
      )
    case 'remote':
      return before.remoteCount !== after.remoteCount
  }
}

function layerExplanation(layer: GitStateLayer, before: GitStateSummary, after: GitStateSummary): string {
  const beforeValue = layerValue(layer, before)
  const afterValue = layerValue(layer, after)
  if (beforeValue === afterValue) return `The ${layer} layer stayed at ${afterValue}.`
  return `The ${layer} layer moved from ${beforeValue} to ${afterValue}.`
}

export function buildCommandInsight(
  raw: string,
  beforeState: GitState,
  afterState: GitState,
  result: GitCommandResult,
): CommandLearningInsight {
  const classification = classifyGitCommand(raw)
  const before = summarizeGitState(beforeState)
  const after = summarizeGitState(afterState)
  const changes = LAYER_ORDER.map((layer) => ({
    layer,
    changed: layerChanged(layer, before, after),
    before: layerValue(layer, before),
    after: layerValue(layer, after),
    explanation: layerExplanation(layer, before, after),
  }))
  const actualLayers = changes.filter((change) => change.changed).map((change) => change.layer)

  let explanation: string
  if (!result.success) {
    explanation =
      'Git rejected the operation, so the repository state did not advance. Use the error as evidence about the command prerequisite.'
  } else if (actualLayers.length === 0) {
    explanation =
      classification.risk === 'observe'
        ? 'This was an observation command: it revealed repository state without changing a Git layer.'
        : 'The command succeeded, but the summarized layer counts did not change. Inspect the detailed output for a pointer or content change that preserves counts.'
  } else {
    explanation = `The command changed ${actualLayers.join(', ')}. Compare that evidence with the layer you expected before running it.`
  }

  return {
    ...classification,
    success: result.success,
    output: result.output || result.error || '',
    before,
    after,
    actualLayers,
    changes,
    explanation,
  }
}
