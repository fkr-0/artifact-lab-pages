import {
  Background,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import React, { useMemo, useCallback, useState } from 'react'
import '@xyflow/react/dist/style.css'
import { REMOTE_BRANCH_COLOR } from '@/lib/git-types'
import type { GitBranch, GitCommit, GitRemote, HEADRef } from '@/lib/git-types'
import { useGitStore } from '@/stores/git-store'
import { CommitNode } from './CommitNode'

const nodeTypes = { commitNode: CommitNode }

// ─── Layout algorithm ────────────────────────────────────────────────────────

interface LayoutResult {
  nodes: Node[]
  edges: Edge[]
}

interface BranchInfo {
  name: string
  commitId: string
  color: string
  isRemote?: boolean
  tracksRemote?: string
}

const H_SPACING = 120
const V_SPACING = 100
const BASE_X = 400

function layoutGitGraph(
  commits: Record<string, GitCommit>,
  branches: Record<string, GitBranch>,
  tags: Record<string, { name: string; commitId: string }>,
  remotes: Record<string, GitRemote>,
  HEAD: HEADRef,
  selectedCommitId: string | null,
  hoveredCommitId: string | null,
): LayoutResult {
  // Merge local and remote commits into a single map
  const allCommits: Record<string, GitCommit> = { ...commits }
  for (const remote of Object.values(remotes)) {
    for (const [id, commit] of Object.entries(remote.commits)) {
      if (!allCommits[id]) {
        allCommits[id] = commit
      }
    }
  }

  // Merge local and remote branches into a unified list
  const allBranches: Record<string, BranchInfo> = {}
  for (const [name, branch] of Object.entries(branches)) {
    allBranches[name] = {
      name,
      commitId: branch.commitId,
      color: branch.color,
      isRemote: branch.isRemote,
      tracksRemote: branch.tracksRemote,
    }
  }
  for (const [remoteName, remote] of Object.entries(remotes)) {
    for (const [branchName, branch] of Object.entries(remote.branches)) {
      const trackingName = `${remoteName}/${branchName}`
      allBranches[trackingName] = {
        name: trackingName,
        commitId: branch.commitId,
        color: REMOTE_BRANCH_COLOR,
        isRemote: true,
        tracksRemote: remoteName,
      }
    }
  }

  const commitList = Object.values(allCommits)
  if (commitList.length === 0) return { nodes: [], edges: [] }

  // Separate local and remote branches for lane assignment
  const localBranchNames = Object.keys(allBranches).filter((name) => !allBranches[name].isRemote)
  const remoteBranchNames = Object.keys(allBranches).filter((name) => allBranches[name].isRemote)

  // Remote branches get lanes starting from 0 (left side)
  // Local branches get lanes after remote branches
  const branchLanes: Record<string, number> = {}
  const remoteLaneOffset = remoteBranchNames.length

  remoteBranchNames.forEach((name, i) => {
    branchLanes[name] = i
  })
  localBranchNames.forEach((name, i) => {
    branchLanes[name] = remoteLaneOffset + i
  })

  // Determine which branch each commit "belongs to" for lane assignment
  const commitBranch: Record<string, string> = {}
  for (const [name, branch] of Object.entries(allBranches)) {
    if (branch.commitId) {
      commitBranch[branch.commitId] = name
    }
  }

  // Walk backwards to assign branches
  const assigned: Set<string> = new Set()
  for (const [name, branch] of Object.entries(allBranches)) {
    if (!branch.commitId) continue
    let currentId: string | undefined = branch.commitId
    while (currentId && !assigned.has(currentId)) {
      if (!commitBranch[currentId]) {
        commitBranch[currentId] = name
      }
      assigned.add(currentId)
      const cmt: GitCommit | undefined = allCommits[currentId]
      if (cmt?.parentIds.length) {
        currentId = cmt.parentIds[0]
      } else {
        break
      }
    }
  }

  // Compute depths (topological order)
  const depths: Record<string, number> = {}
  const computeDepth = (id: string): number => {
    if (depths[id] !== undefined) return depths[id]
    const commit = allCommits[id]
    if (!commit || commit.parentIds.length === 0) {
      depths[id] = 0
      return 0
    }
    depths[id] = 0
    const parentDepths = commit.parentIds.map((pid) => computeDepth(pid))
    depths[id] = Math.max(...parentDepths) + 1
    return depths[id]
  }
  for (const commit of commitList) {
    computeDepth(commit.id)
  }

  // Lane assignment with branch awareness
  const commitLanes: Record<string, number> = {}
  const usedLanesAtDepth: Record<number, Set<number>> = {}

  const sortedCommits = [...commitList].sort((a, b) => {
    const da = depths[a.id] || 0
    const db = depths[b.id] || 0
    if (da !== db) return da - db
    const la = branchLanes[commitBranch[a.id]] || 0
    const lb = branchLanes[commitBranch[b.id]] || 0
    return la - lb
  })

  for (const commit of sortedCommits) {
    const depth = depths[commit.id]
    const branch = commitBranch[commit.id] || 'main'
    const preferredLane = branchLanes[branch] ?? 0

    if (!usedLanesAtDepth[depth]) usedLanesAtDepth[depth] = new Set()

    let lane = preferredLane
    if (usedLanesAtDepth[depth].has(lane)) {
      lane = 0
      while (usedLanesAtDepth[depth].has(lane)) lane++
    }

    commitLanes[commit.id] = lane
    usedLanesAtDepth[depth].add(lane)
  }

  // Determine HEAD commit
  let headCommitId = ''
  if (HEAD.type === 'branch') {
    headCommitId = allBranches[HEAD.ref]?.commitId || ''
  } else if (HEAD.type === 'detached') {
    headCommitId = HEAD.commitId || ''
  }

  // Get commit tags
  const commitTags: Record<string, string[]> = {}
  for (const [, tag] of Object.entries(tags)) {
    if (!commitTags[tag.commitId]) commitTags[tag.commitId] = []
    commitTags[tag.commitId].push(tag.name)
  }

  // Determine branch labels per commit (only tip commits get labels)
  const commitBranchLabels: Record<string, string> = {}
  for (const [name, branch] of Object.entries(allBranches)) {
    if (branch.commitId) {
      commitBranchLabels[branch.commitId] = name
    }
  }

  // Determine which commits are "remote" commits
  const remoteCommitIds = new Set<string>()
  for (const remote of Object.values(remotes)) {
    for (const id of Object.keys(remote.commits)) {
      remoteCommitIds.add(id)
    }
  }

  // Build nodes
  const nodes: Node[] = sortedCommits.map((commit) => {
    const depth = depths[commit.id] || 0
    const lane = commitLanes[commit.id] || 0
    const branch = commitBranch[commit.id] || 'main'
    const branchInfo = allBranches[branch]
    const branchColor = branchInfo?.color || '#6b7280'
    const isRemoteBranch = branchInfo?.isRemote === true
    const isRemoteCommit = remoteCommitIds.has(commit.id)

    return {
      id: commit.id,
      type: 'commitNode',
      position: {
        x: BASE_X + lane * H_SPACING,
        y: depth * V_SPACING,
      },
      data: {
        shortId: commit.shortId,
        message: commit.message,
        author: commit.author,
        timestamp: commit.timestamp,
        branchLabel: commitBranchLabels[commit.id],
        branchColor,
        isHead: commit.id === headCommitId,
        isMerge: commit.parentIds.length > 1,
        isRemote: isRemoteBranch || isRemoteCommit,
        tags: commitTags[commit.id] || [],
        selected: commit.id === selectedCommitId,
        hovered: commit.id === hoveredCommitId,
        parentCount: commit.parentIds.length,
      },
    }
  })

  // Build edges
  const edges: Edge[] = []
  for (const commit of commitList) {
    for (const parentId of commit.parentIds) {
      if (!allCommits[parentId]) continue

      const parentBranch = commitBranch[parentId] || 'main'
      const parentColor = allBranches[parentBranch]?.color || '#6b7280'
      const currentBranch = commitBranch[commit.id] || 'main'
      const currentColor = allBranches[currentBranch]?.color || '#6b7280'

      const isMergeEdge = commit.parentIds.indexOf(parentId) > 0
      const isRemoteEdge = allBranches[parentBranch]?.isRemote || allBranches[currentBranch]?.isRemote

      edges.push({
        id: `${parentId}-${commit.id}`,
        source: parentId,
        target: commit.id,
        type: 'smoothstep',
        animated: isMergeEdge,
        style: {
          stroke: isMergeEdge ? currentColor : parentColor,
          strokeWidth: isMergeEdge ? 2.5 : 2,
          strokeDasharray: isRemoteEdge ? '6 4' : undefined,
          opacity: isRemoteEdge ? 0.65 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: isMergeEdge ? currentColor : parentColor,
        },
      })
    }
  }

  return { nodes, edges }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GitGraph() {
  const { gitState, selectedCommitId, selectCommit } = useGitStore()
  const { commits, branches, tags, remotes, HEAD } = gitState
  const [hoveredCommitId, setHoveredCommitId] = useState<string | null>(null)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutGitGraph(commits, branches, tags, remotes, HEAD, selectedCommitId, hoveredCommitId),
    [commits, branches, tags, remotes, HEAD, selectedCommitId, hoveredCommitId],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  React.useEffect(() => {
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutNodes, layoutEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectCommit(node.id)
    },
    [selectCommit],
  )

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredCommitId(node.id)
  }, [])

  const onNodeMouseLeave = useCallback(() => {
    setHoveredCommitId(null)
  }, [])

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (Object.keys(commits).length === 0 && Object.keys(remotes).length === 0) {
    const isInitialized = gitState.initialized
    const hasStaged = Object.keys(gitState.staging).length > 0
    const hasWorkingFiles = Object.keys(gitState.working).length > 0

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-8 max-w-md px-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              role="img"
              aria-label="Git graph"
            >
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M13 6h3a2 2 0 0 1 2 2v7" />
              <line x1="6" y1="9" x2="6" y2="21" />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight">Your graph starts here</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each commit becomes a node. Branches become lanes. Run commands in the terminal below to build your
              history.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-2 text-left">
            {[
              {
                step: '1',
                cmd: 'git init',
                desc: 'Initialize a repository',
                active: !isInitialized,
                done: isInitialized,
              },
              {
                step: '2',
                cmd: 'git add .',
                desc: 'Stage your files',
                active: isInitialized && !hasStaged && hasWorkingFiles,
                done: hasStaged,
              },
              {
                step: '3',
                cmd: 'git commit -m "msg"',
                desc: 'Create your first commit',
                active: hasStaged,
                done: false,
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  item.done
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : item.active
                      ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-border/50 opacity-40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    item.done
                      ? 'bg-emerald-500 text-white'
                      : item.active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.done ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      role="img"
                      aria-label="Done"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    item.step
                  )}
                </div>
                <div className="text-left min-w-0">
                  <code
                    className={`text-xs font-mono ${
                      item.active ? 'text-primary' : item.done ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  >
                    {item.cmd}
                  </code>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Graph ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="var(--border)" gap={24} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button:hover]:!bg-accent"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as Record<string, unknown>
            return (data?.branchColor as string) || '#6b7280'
          }}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-card !border-border"
        />
      </ReactFlow>
    </div>
  )
}
