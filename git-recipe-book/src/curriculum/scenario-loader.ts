import type { GitSimulator } from '@/lib/git-simulator'
import type { GitCommit } from '@/lib/git-types'
import { REMOTE_BRANCH_COLOR, generateId, now, shortId } from '@/lib/git-types'
import type { IRemoteSetup } from '@/lib/interfaces'
import type { ScenarioDefinition } from './types'

function populateRemote(backend: GitSimulator, setup: IRemoteSetup): void {
  if (!backend.getState().initialized) backend.init()
  backend.addRemote(setup.remoteName, setup.url)
  const state = backend.getState()
  const remote = state.remotes[setup.remoteName]
  let parentIds: string[] = []
  for (const [index, source] of setup.remoteCommits.entries()) {
    const id = generateId()
    const commit: GitCommit = {
      id,
      shortId: shortId(id),
      message: source.message,
      parentIds,
      author: 'Chef <chef@recipe-book.git>',
      timestamp: now() - (setup.remoteCommits.length - index) * 60_000,
      tree: { ...source.files },
      branchLabel: `${setup.remoteName}/${setup.branchName}`,
    }
    remote.commits[id] = commit
    parentIds = [id]
  }
  remote.branches[setup.branchName] = {
    name: setup.branchName,
    commitId: parentIds[0] ?? '',
    color: REMOTE_BRANCH_COLOR,
    isRemote: true,
    tracksRemote: setup.remoteName,
  }
  backend.loadState(state)
}

export function loadScenario(backend: GitSimulator, scenario: ScenarioDefinition): string[] {
  const failures: string[] = []
  if (scenario.initialized || scenario.files) backend.init()
  if (scenario.files) {
    const state = backend.getState()
    state.working = { ...scenario.files }
    backend.loadState(state)
  }
  if (scenario.remoteSetup) populateRemote(backend, scenario.remoteSetup)

  for (const command of scenario.setupCommands ?? []) {
    const result = backend.execute(command)
    if (!result.success) failures.push(`${command}: ${result.error ?? result.output}`)
  }

  for (const advance of scenario.remoteAdvance ?? []) {
    const state = backend.getState()
    const remote = state.remotes[advance.remoteName]
    const previous = remote?.branches[advance.branchName]?.commitId
    if (!remote || !previous) {
      failures.push(`remote advance ${advance.remoteName}/${advance.branchName}: missing remote branch`)
      continue
    }
    const id = generateId()
    remote.commits[id] = {
      id,
      shortId: shortId(id),
      message: advance.message,
      parentIds: [previous],
      author: 'Collaborator <collaborator@recipe-book.git>',
      timestamp: now(),
      tree: { ...advance.files },
      branchLabel: `${advance.remoteName}/${advance.branchName}`,
    }
    remote.branches[advance.branchName].commitId = id
    backend.loadState(state)
  }
  return failures
}
