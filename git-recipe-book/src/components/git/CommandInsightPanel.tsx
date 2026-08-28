import type { GitStateLayer } from '@/lib/learning/git-learning-model'
import { useGitStore } from '@/stores/git-store'
import { AlertTriangle, Check, Eye, Lightbulb, X } from 'lucide-react'

const LAYER_LABELS: Record<GitStateLayer, string> = {
  working: 'working tree',
  staging: 'staging area',
  history: 'commit history',
  refs: 'branches & HEAD',
  remote: 'remote repository',
}

function setsMatch(left: GitStateLayer[], right: GitStateLayer[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((item) => rightSet.has(item))
}

export default function CommandInsightPanel() {
  const { lastCommandInsight, lastPrediction, lastPredictionMade } = useGitStore()

  if (!lastCommandInsight) {
    return (
      <section className="command-insight command-insight--empty" aria-labelledby="command-insight-title">
        <div className="command-insight__empty-icon">
          <Eye />
        </div>
        <div>
          <p className="learning-kicker">Evidence notebook</p>
          <h2 id="command-insight-title">Run one command, then inspect the delta</h2>
          <p>This panel will explain what changed, what stayed stable, and which Git layer the command touched.</p>
        </div>
      </section>
    )
  }

  const predictionMatch = lastPredictionMade && setsMatch(lastPrediction, lastCommandInsight.actualLayers)
  const changed = lastCommandInsight.changes.filter((change) => change.changed)

  return (
    <section className="command-insight" aria-labelledby="command-insight-title">
      <header className="command-insight__header">
        <div>
          <p className="learning-kicker">Latest command evidence</p>
          <h2 id="command-insight-title">{lastCommandInsight.title}</h2>
          <code>{lastCommandInsight.command}</code>
        </div>
        <span className={`command-risk command-risk--${lastCommandInsight.risk}`}>
          {lastCommandInsight.risk.replace('-', ' ')}
        </span>
      </header>

      <p className="command-insight__intent">{lastCommandInsight.intent}</p>

      {lastPredictionMade && (
        <div className={`prediction-result ${predictionMatch ? 'is-match' : 'is-learning'}`}>
          {predictionMatch ? <Check /> : <Lightbulb />}
          <div>
            <strong>
              {predictionMatch ? 'Your prediction matched the evidence.' : 'Useful mismatch: update the model.'}
            </strong>
            <p>
              Predicted:{' '}
              {lastPrediction.length > 0
                ? lastPrediction.map((layer) => LAYER_LABELS[layer]).join(', ')
                : 'no repository layer change'}
              . Actual:{' '}
              {lastCommandInsight.actualLayers.length > 0
                ? lastCommandInsight.actualLayers.map((layer) => LAYER_LABELS[layer]).join(', ')
                : 'no repository layer changed'}
              .
            </p>
          </div>
        </div>
      )}

      <div className="command-insight__summary">
        {lastCommandInsight.success ? <Check /> : <X />}
        <p>{lastCommandInsight.explanation}</p>
      </div>

      <div className="command-delta-grid">
        {(changed.length > 0 ? changed : lastCommandInsight.changes).map((change) => (
          <article className={change.changed ? 'is-changed' : ''} key={change.layer}>
            <span>{LAYER_LABELS[change.layer]}</span>
            <div>
              <code>{change.before}</code>
              <span aria-hidden="true">→</span>
              <code>{change.after}</code>
            </div>
            <p>{change.explanation}</p>
          </article>
        ))}
      </div>

      {lastCommandInsight.advancedDelta.length > 0 && (
        <div className="command-event-timeline" aria-label="Semantic event timeline">
          <div>
            <strong>What actually moved</strong>
            <span>{lastCommandInsight.advancedDelta.length} semantic event(s)</span>
          </div>
          <ol>
            {lastCommandInsight.advancedDelta.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </ol>
        </div>
      )}

      {lastCommandInsight.safetyNote && (
        <div className="command-safety-note">
          <AlertTriangle />
          <p>{lastCommandInsight.safetyNote}</p>
        </div>
      )}
    </section>
  )
}
