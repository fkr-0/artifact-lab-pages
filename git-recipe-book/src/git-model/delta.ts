import type { GitStateLayer } from '@/lib/learning/git-learning-model'
import type { RepositoryEvent } from './events'

export interface SemanticDeltaLine {
  layer: GitStateLayer
  summary: string
}

function short(value: string): string {
  return value ? value.slice(0, 7) : '∅'
}

export function eventLayer(event: RepositoryEvent): GitStateLayer {
  switch (event.type) {
    case 'working-file-changed':
      return 'working'
    case 'index-entry-updated':
      return 'staging'
    case 'commit-created':
    case 'stash-count-changed':
      return 'history'
    case 'remote-configured':
    case 'remote-branch-moved':
      return 'remote'
    case 'conflict-started':
    case 'conflict-resolved':
    case 'operation-aborted':
      return 'working'
    default:
      return 'refs'
  }
}

export function describeRepositoryEvent(event: RepositoryEvent): string {
  switch (event.type) {
    case 'repository-initialized':
      return 'Repository metadata was initialized.'
    case 'working-file-changed':
      return `Working file ${event.path} changed.`
    case 'index-entry-updated':
      return `Index entry ${event.path} changed.`
    case 'commit-created':
      return `Commit ${short(event.commitId)} created (${event.parentIds.length} parent${event.parentIds.length === 1 ? '' : 's'}).`
    case 'ref-created':
      return `${event.remoteTracking ? 'Remote-tracking ref' : 'Ref'} ${event.ref} created at ${short(event.target)}.`
    case 'ref-moved':
      return `${event.remoteTracking ? 'Remote-tracking ref' : 'Ref'} ${event.ref} moved ${short(event.before)} → ${short(event.after)}.`
    case 'ref-deleted':
      return `Ref ${event.ref} was deleted from ${short(event.before)}.`
    case 'head-changed':
      return `HEAD changed from ${event.before.type === 'branch' ? event.before.ref : short(event.before.commitId)} to ${event.after.type === 'branch' ? event.after.ref : short(event.after.commitId)}.`
    case 'tag-created':
      return `Tag ${event.tag} now names commit ${short(event.target)}.`
    case 'tag-moved':
      return `Tag ${event.tag} moved ${short(event.before)} → ${short(event.after)}.`
    case 'remote-configured':
      return `Remote ${event.remote} was configured.`
    case 'remote-branch-moved':
      return `Remote ${event.remote}/${event.branch} moved ${short(event.before)} → ${short(event.after)}.`
    case 'upstream-configured':
      return `Local branch ${event.branch} now tracks ${event.remoteRef}.`
    case 'stash-count-changed':
      return `Stash entries changed ${event.before} → ${event.after}.`
    case 'conflict-started':
      return `Merge paused with conflicts in ${event.paths.join(', ')}.`
    case 'conflict-resolved':
      return `Merge conflict state was resolved for ${event.paths.join(', ')}.`
    case 'operation-aborted':
      return 'Merge was aborted and the pre-merge state restored.'
  }
}

export function projectBeginnerDelta(events: RepositoryEvent[]): SemanticDeltaLine[] {
  const byLayer = new Map<GitStateLayer, string[]>()
  for (const event of events) {
    const layer = eventLayer(event)
    const summaries = byLayer.get(layer) ?? []
    summaries.push(describeRepositoryEvent(event))
    byLayer.set(layer, summaries)
  }
  return [...byLayer.entries()].map(([layer, summaries]) => ({ layer, summary: summaries.join(' ') }))
}

export function projectAdvancedDelta(events: RepositoryEvent[]): string[] {
  return events.map(describeRepositoryEvent)
}
