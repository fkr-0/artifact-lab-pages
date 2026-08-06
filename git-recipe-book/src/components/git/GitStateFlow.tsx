import { type GitStateLayer, summarizeGitState } from '@/lib/learning/git-learning-model'
import { useGitStore } from '@/stores/git-store'
import { ArrowRight, Cloud, Files, GitBranch, GitCommitHorizontal, Layers3 } from 'lucide-react'
import type { ComponentType } from 'react'

interface LayerDefinition {
  id: GitStateLayer
  label: string
  shortLabel: string
  description: string
  icon: ComponentType<{ className?: string }>
}

const LAYERS: LayerDefinition[] = [
  {
    id: 'working',
    label: 'Working tree',
    shortLabel: 'Edit',
    description: 'Files you can currently see and change.',
    icon: Files,
  },
  {
    id: 'staging',
    label: 'Staging area',
    shortLabel: 'Select',
    description: 'The exact content chosen for the next commit.',
    icon: Layers3,
  },
  {
    id: 'history',
    label: 'Commit history',
    shortLabel: 'Record',
    description: 'Immutable snapshots connected through parent links.',
    icon: GitCommitHorizontal,
  },
  {
    id: 'refs',
    label: 'Branches & HEAD',
    shortLabel: 'Point',
    description: 'Movable names and the location you are working from.',
    icon: GitBranch,
  },
  {
    id: 'remote',
    label: 'Remote repository',
    shortLabel: 'Share',
    description: 'Another repository copy with independently moving refs.',
    icon: Cloud,
  },
]

function layerValue(layer: GitStateLayer, summary: ReturnType<typeof summarizeGitState>): string {
  switch (layer) {
    case 'working':
      return summary.workingCount === 0 ? 'clean' : `${summary.workingCount} changed`
    case 'staging':
      return summary.stagedCount === 0 ? 'empty' : `${summary.stagedCount} selected`
    case 'history':
      return `${summary.commitCount} commit${summary.commitCount === 1 ? '' : 's'}`
    case 'refs':
      return summary.initialized ? `HEAD → ${summary.headLabel}` : 'not initialized'
    case 'remote':
      return `${summary.remoteCount} configured`
  }
}

export default function GitStateFlow() {
  const { gitState, predictedLayers, lastCommandInsight } = useGitStore()
  const summary = summarizeGitState(gitState)
  const changedLayers = new Set(lastCommandInsight?.actualLayers ?? [])
  const predicted = new Set(predictedLayers)

  return (
    <section
      className="git-state-flow"
      id="git-state-model"
      data-workspace-section="model"
      aria-labelledby="git-state-flow-title"
    >
      <div className="git-state-flow__heading">
        <div>
          <p className="learning-kicker">The durable mental model</p>
          <h2 id="git-state-flow-title">Follow content and pointers through Git</h2>
        </div>
        <p>Commands do not perform magic. They read or move information between these five layers.</p>
      </div>

      <div className="git-state-flow__rail custom-scrollbar">
        {LAYERS.map((layer, index) => {
          const Icon = layer.icon
          const changed = changedLayers.has(layer.id)
          const isPredicted = predicted.has(layer.id)
          return (
            <div className="git-state-flow__segment" key={layer.id}>
              <article
                className={`git-state-layer ${changed ? 'is-changed' : ''} ${isPredicted ? 'is-predicted' : ''}`}
                data-layer={layer.id}
              >
                <div className="git-state-layer__topline">
                  <span className="git-state-layer__verb">{layer.shortLabel}</span>
                  {changed && <span className="git-state-layer__change">changed</span>}
                  {!changed && isPredicted && <span className="git-state-layer__prediction">prediction</span>}
                </div>
                <Icon className="git-state-layer__icon" />
                <h3>{layer.label}</h3>
                <strong>{layerValue(layer.id, summary)}</strong>
                <p>{layer.description}</p>
              </article>
              {index < LAYERS.length - 1 && <ArrowRight className="git-state-flow__arrow" aria-hidden="true" />}
            </div>
          )
        })}
      </div>
    </section>
  )
}
