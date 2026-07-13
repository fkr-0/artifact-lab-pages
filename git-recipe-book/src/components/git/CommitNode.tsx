import { REMOTE_BRANCH_COLOR } from '@/lib/git-types'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import React, { memo } from 'react'

export interface CommitNodeData {
  shortId: string
  message: string
  author: string
  timestamp: number
  branchLabel?: string
  branchColor: string
  isHead: boolean
  isMerge: boolean
  isRemote: boolean
  tags: string[]
  selected: boolean
  hovered: boolean
  parentCount: number
}

const NODE_R = 13
const MERGE_R = 16

function CommitNodeComponent({ data }: NodeProps) {
  const d = data as unknown as CommitNodeData
  const color = d.isRemote ? REMOTE_BRANCH_COLOR : d.branchColor
  const r = d.isMerge ? MERGE_R : NODE_R

  return (
    <g className={`commit-node ${d.selected ? 'selected' : ''} ${d.hovered ? 'hovered' : ''}`}>
      {/* Selection ring */}
      {d.selected && (
        <circle r={r + 7} fill="none" stroke={color} strokeWidth={2.5} opacity={0.5} className="commit-ring-selected" />
      )}

      {/* Hover ring */}
      {d.hovered && !d.selected && (
        <circle r={r + 5} fill="none" stroke={color} strokeWidth={1.5} opacity={0.35} className="commit-ring-hover" />
      )}

      {/* HEAD glow */}
      {d.isHead && (
        <circle
          r={r + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.4}
          className="commit-head-glow"
        />
      )}

      {/* Main commit circle */}
      <circle
        r={r}
        fill={color}
        stroke={d.selected ? '#fff' : 'rgba(255,255,255,0.85)'}
        strokeWidth={d.selected ? 2.5 : 2}
        className="commit-circle"
      />

      {/* Merge inner circle */}
      {d.isMerge && <circle r={5} fill="rgba(255,255,255,0.75)" className="commit-merge-dot" />}

      {/* Short hash below */}
      <text
        y={r + 16}
        textAnchor="middle"
        fontSize={9}
        fontFamily="monospace"
        fill="currentColor"
        opacity={d.hovered || d.selected ? 0.8 : 0.45}
        className="commit-hash-label"
      >
        {d.shortId}
      </text>

      {/* Branch label - positioned to the right */}
      {d.branchLabel && (
        <foreignObject x={r + 8} y={-11} width={140} height={22} style={{ overflow: 'visible' }}>
          <div
            className="commit-branch-label"
            style={{
              background: color,
              border: d.isRemote ? '1px dashed rgba(255,255,255,0.4)' : 'none',
            }}
          >
            {d.branchLabel}
          </div>
        </foreignObject>
      )}

      {/* HEAD badge - positioned above branch label or standalone */}
      {d.isHead && (
        <foreignObject
          x={d.branchLabel ? r + 8 : r + 8}
          y={d.branchLabel ? -26 : -11}
          width={44}
          height={18}
          style={{ overflow: 'visible' }}
        >
          <div className="commit-head-badge">HEAD</div>
        </foreignObject>
      )}

      {/* Tags - positioned to the left */}
      {d.tags.map((tag, i) => (
        <foreignObject key={tag} x={-r - 70} y={-10 + i * 22} width={62} height={20} style={{ overflow: 'visible' }}>
          <div className="commit-tag-badge">{tag}</div>
        </foreignObject>
      ))}

      {/* Hover tooltip with commit message */}
      {d.hovered && (
        <foreignObject
          x={-160}
          y={r + 26}
          width={320}
          height={48}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div className="commit-tooltip">
            <span className="commit-tooltip-msg">{d.message}</span>
            <span className="commit-tooltip-author">{d.author}</span>
          </div>
        </foreignObject>
      )}

      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </g>
  )
}

export const CommitNode = memo(CommitNodeComponent)
