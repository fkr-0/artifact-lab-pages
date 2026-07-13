// ─── Git Backend Interface ───────────────────────────────────────────────────
//
// All git operations go through this interface. This allows swapping between:
//  - GitSimulator (in-memory, for learning)
//  - IsoGitBackend (isomorphic-git, for real repos in browser)
//  - Any future backend (e.g., server-side git via API)
//

import { GitState, GitCommandResult, GitRemote } from '../git-types';

export interface IGitBackend {
  /** Unique identifier for this backend type */
  readonly backendType: 'simulator' | 'isomorphic-git' | string;

  /** Whether this backend supports real git operations */
  readonly isRealGit: boolean;

  /** Get the current full git state for rendering */
  getState(): GitState;

  /** Execute a raw command string (main entry point for terminal) */
  execute(raw: string): GitCommandResult;

  /** Reset to a clean state */
  fullReset(): void;

  /** Load a pre-built state (for lessons or importing) */
  loadState(s: GitState): void;

  // ─── Individual operations (for programmatic use) ──────────────────────────

  init(): GitCommandResult;
  add(paths: string[]): GitCommandResult;
  commit(message: string): GitCommandResult;
  createBranch(name: string): GitCommandResult;
  deleteBranch(name: string): GitCommandResult;
  listBranches(): GitCommandResult;
  checkout(target: string): GitCommandResult;
  merge(branchName: string): GitCommandResult;
  rebase(targetBranch: string): GitCommandResult;
  log(count?: number): GitCommandResult;
  status(): GitCommandResult;
  diff(): GitCommandResult;
  createTag(name: string, message?: string): GitCommandResult;
  listTags(): GitCommandResult;
  stash(message?: string): GitCommandResult;
  stashPop(): GitCommandResult;
  stashList(): GitCommandResult;
  reset(target: string, mode?: 'soft' | 'mixed' | 'hard'): GitCommandResult;
  cherryPick(commitHash: string): GitCommandResult;

  // ─── Remote operations ────────────────────────────────────────────────────

  /** Add a named remote */
  addRemote(name: string, url: string): GitCommandResult;

  /** List remotes */
  listRemotes(): GitCommandResult;

  /** Fetch from a remote (updates remote-tracking branches) */
  fetch(remoteName: string): GitCommandResult;

  /** Pull = fetch + merge from remote tracking branch */
  pull(remoteName?: string, branchName?: string): GitCommandResult;

  /** Push local branch to remote */
  push(remoteName?: string, branchName?: string): GitCommandResult;

  // ─── File operations ──────────────────────────────────────────────────────

  editFile(path: string, content: string): GitCommandResult;
  addFile(path: string, content: string): GitCommandResult;
  removeFile(path: string): GitCommandResult;

  // ─── Help ─────────────────────────────────────────────────────────────────

  showHelp(): GitCommandResult;
}

// ─── Backend Factory ─────────────────────────────────────────────────────────

export type BackendType = 'simulator' | 'isomorphic-git';

export interface IBackendFactory {
  create(type: BackendType, options?: Record<string, unknown>): IGitBackend;
}
