import { useGitStore } from '@/stores/git-store'
import { ChevronDown, ChevronUp } from 'lucide-react'
import React, { useState } from 'react'

export default function GraphLegend() {
  const [expanded, setExpanded] = useState(false)
  const { gitState } = useGitStore()
  const hasMerges = Object.values(gitState.commits).some((c) => c.parentIds.length > 1)
  const hasRemotes = Object.keys(gitState.remotes).length > 0
  const hasTags = Object.keys(gitState.tags).length > 0

  return (
    <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Compact header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full cursor-pointer"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Graph legend"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>Graph key</span>
        {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {/* Expanded legend */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50">
          {/* Commit */}
          <div className="flex items-center gap-2.5 pt-2">
            <svg width="12" height="12" viewBox="0 0 24 24" role="img" aria-label="Commit">
              <circle cx="12" cy="12" r="8" fill="#10b981" stroke="#fff" strokeWidth="2" />
            </svg>
            <span className="text-[10px] text-muted-foreground">Commit</span>
          </div>

          {/* HEAD */}
          <div className="flex items-center gap-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" role="img" aria-label="HEAD">
              <circle cx="12" cy="12" r="8" fill="#10b981" stroke="#fff" strokeWidth="2" />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.6"
              />
            </svg>
            <span className="text-[10px] text-muted-foreground">
              HEAD <span className="text-[9px] opacity-60">(current)</span>
            </span>
          </div>

          {/* Merge */}
          {hasMerges && (
            <div className="flex items-center gap-2.5">
              <svg width="12" height="12" viewBox="0 0 24 24" role="img" aria-label="Merge commit">
                <circle cx="12" cy="12" r="8" fill="#10b981" stroke="#fff" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.75)" />
              </svg>
              <span className="text-[10px] text-muted-foreground">Merge commit</span>
            </div>
          )}

          {/* Remote */}
          {hasRemotes && (
            <div className="flex items-center gap-2.5">
              <svg width="12" height="12" viewBox="0 0 24 24" role="img" aria-label="Remote commit">
                <circle cx="12" cy="12" r="8" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 2" />
              </svg>
              <span className="text-[10px] text-muted-foreground">Remote commit</span>
            </div>
          )}

          {/* Merge edge */}
          {hasMerges && (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-0 border-t-2 border-dashed" style={{ borderColor: '#6b7280' }} />
              <span className="text-[10px] text-muted-foreground">Merge edge</span>
            </div>
          )}

          {/* Tag */}
          {hasTags && (
            <div className="flex items-center gap-2.5">
              <div
                className="px-1.5 py-0.5 rounded text-[8px] font-semibold text-white"
                style={{ background: '#8b5cf6' }}
              >
                v1.0
              </div>
              <span className="text-[10px] text-muted-foreground">Tag</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
