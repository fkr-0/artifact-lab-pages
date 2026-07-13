// ─── Core Git Types ──────────────────────────────────────────────────────────

export interface FileEntry {
  name: string;
  content: string;
  type: 'file' | 'folder';
  children?: FileEntry[];
}

export type FileTree = Map<string, FileEntry>;

export interface GitCommit {
  id: string;
  shortId: string;
  message: string;
  parentIds: string[];
  author: string;
  timestamp: number;
  tree: Record<string, string>; // filepath → content snapshot
  branchLabel?: string; // which branch was this committed on
}

export interface GitBranch {
  name: string;
  commitId: string;
  color: string;
  /** Is this a remote-tracking branch? (e.g., origin/main) */
  isRemote?: boolean;
  /** The remote this branch tracks (if remote-tracking) */
  tracksRemote?: string;
}

export interface GitTag {
  name: string;
  commitId: string;
  message?: string;
}

export interface StashEntry {
  id: string;
  message: string;
  commitId: string;
  tree: Record<string, string>;
  timestamp: number;
}

export type HEADRef =
  | { type: 'branch'; ref: string }
  | { type: 'detached'; commitId: string };

// ─── Remote Types ────────────────────────────────────────────────────────────

export interface GitRemote {
  name: string;
  url: string;
  /** Branches that exist on this remote */
  branches: Record<string, GitBranch>;
  /** Commits that exist on this remote */
  commits: Record<string, GitCommit>;
}

export interface GitState {
  initialized: boolean;
  commits: Record<string, GitCommit>;
  branches: Record<string, GitBranch>;
  tags: Record<string, GitTag>;
  HEAD: HEADRef;
  staging: Record<string, string>; // filepath → content
  working: Record<string, string>; // filepath → content
  stash: StashEntry[];
  /** Named remotes with their own branches and commits */
  remotes: Record<string, GitRemote>;
  /** Tracking relationships: local branch → { remote, remoteBranch } */
  trackingBranches: Record<string, { remote: string; remoteBranch: string }>;
}

export interface GitCommandResult {
  success: boolean;
  output: string;
  error?: string;
}

// ─── Branch Colors ───────────────────────────────────────────────────────────

export const BRANCH_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
];

export const REMOTE_BRANCH_COLOR = '#06b6d4'; // cyan for remote branches
export const REMOTE_COMMIT_COLOR = '#0e7490'; // darker cyan for remote commits

export function getBranchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _counter = 0;
const HEX = '0123456789abcdef';

export function generateId(): string {
  _counter++;
  let hash = '';
  const base = Date.now().toString(16) + _counter.toString(16) + Math.random().toString(16).slice(2);
  for (let i = 0; i < 40; i++) {
    hash += HEX[(base.charCodeAt(i % base.length) + i) % 16];
  }
  return hash;
}

export function shortId(id: string): string {
  return id.slice(0, 7);
}

export function now(): number {
  return Date.now();
}
