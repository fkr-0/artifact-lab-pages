import React from 'react'
import { useGitStore } from '@/stores/git-store'
import { GitBranch, GitCommitHorizontal, AlertCircle, FileText, FilePlus, FileCheck } from 'lucide-react'

export default function StatusIndicator() {
  const { gitState } = useGitStore()
  const { HEAD, branches, staging, working, commits, initialized } = gitState

  if (!initialized) return null

  const currentBranch = HEAD.type === 'branch' ? HEAD.ref : null
  const branchColor = currentBranch ? branches[currentBranch]?.color : undefined
  const stagedCount = Object.keys(staging).length

  // Calculate untracked/modified/staged counts
  const tipCommit = HEAD.type === 'branch'
    ? commits[branches[HEAD.ref]?.commitId || '']
    : commits[HEAD.commitId || '']
  const tipTree = tipCommit?.tree || {}

  const untracked: string[] = []
  const modified: string[] = []
  for (const [fp, content] of Object.entries(working)) {
    if (tipTree[fp] === undefined) {
      untracked.push(fp)
    } else if (tipTree[fp] !== content) {
      modified.push(fp)
    }
  }

  const workingFileCount = Object.keys(working).length
  const tracking = HEAD.type === 'branch' ? gitState.trackingBranches[HEAD.ref] : null

  return (
    <div className='absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 text-[10px] space-y-1.5 shadow-lg'>
      <div className='flex items-center gap-1.5'>
        <GitBranch className='w-3 h-3' style={{ color: branchColor }} />
        <span className='font-mono font-medium'>
          {HEAD.type === 'branch' ? HEAD.ref : `detached: ${HEAD.commitId?.slice(0, 7)}`}
        </span>
      </div>

      {/* File counts with colored dots */}
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-1'>
          <FileText className='w-3 h-3 text-muted-foreground' />
          <span className='text-muted-foreground'>{workingFileCount} files</span>
        </div>
      </div>

      {/* Status dots */}
      {(stagedCount > 0 || modified.length > 0 || untracked.length > 0) && (
        <div className='flex items-center gap-2'>
          {stagedCount > 0 && (
            <div className='flex items-center gap-0.5'>
              <div className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
              <span className='text-emerald-600 dark:text-emerald-400'>{stagedCount} staged</span>
            </div>
          )}
          {modified.length > 0 && (
            <div className='flex items-center gap-0.5'>
              <div className='w-1.5 h-1.5 rounded-full bg-amber-500' />
              <span className='text-amber-600 dark:text-amber-400'>{modified.length} modified</span>
            </div>
          )}
          {untracked.length > 0 && (
            <div className='flex items-center gap-0.5'>
              <div className='w-1.5 h-1.5 rounded-full bg-red-500' />
              <span className='text-red-600 dark:text-red-400'>{untracked.length} untracked</span>
            </div>
          )}
        </div>
      )}

      {/* Tracking info */}
      {tracking && (
        <div className='flex items-center gap-1 text-cyan-600 dark:text-cyan-400'>
          <GitCommitHorizontal className='w-3 h-3' />
          <span>tracking {tracking.remote}/{tracking.remoteBranch?.split('/').pop()}</span>
        </div>
      )}

      <div className='flex items-center gap-1.5 text-muted-foreground'>
        <GitCommitHorizontal className='w-3 h-3' />
        <span>{Object.keys(commits).length} commits</span>
      </div>
    </div>
  )
}
