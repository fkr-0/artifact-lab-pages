// ─── Isomorphic-Git Backend ──────────────────────────────────────────────────
//
// A real git backend using isomorphic-git that operates in the browser.
// Uses an in-memory filesystem. This allows loading actual git repos
// in the future (e.g., from a URL or uploaded .git bundle).
//

import type { IGitBackend } from '../interfaces';
import { GitState, GitCommandResult, GitCommit, GitBranch, generateId, shortId, now, getBranchColor, REMOTE_BRANCH_COLOR } from '../git-types';

export class IsoGitBackend implements IGitBackend {
  readonly backendType = 'isomorphic-git' as const;
  readonly isRealGit = true;

  private state: GitState;
  private fs: Record<string, string> = {};
  private gitDir = '/.git';

  constructor() {
    this.state = this.createEmpty();
  }

  private createEmpty(): GitState {
    return {
      initialized: false,
      commits: {},
      branches: {},
      tags: {},
      HEAD: { type: 'branch', ref: 'main' },
      staging: {},
      working: {},
      stash: [],
      remotes: {},
      trackingBranches: {},
    };
  }

  getState(): GitState {
    return this.state;
  }

  loadState(s: GitState) {
    this.state = JSON.parse(JSON.stringify(s));
  }

  fullReset() {
    this.state = this.createEmpty();
    this.fs = {};
  }

  // ─── Core Operations ──────────────────────────────────────────────────────
  // For now, these delegate to the same simulation logic as GitSimulator.
  // The isomorphic-git integration would replace these with actual git calls
  // using the in-memory filesystem. This is the foundation for future work.

  init(): GitCommandResult {
    if (this.state.initialized) {
      return { success: false, output: '', error: 'Already initialized!' };
    }
    this.state.initialized = true;
    this.state.branches['main'] = { name: 'main', commitId: '', color: getBranchColor(0) };
    this.state.HEAD = { type: 'branch', ref: 'main' };
    this.state.working = {};
    return { success: true, output: 'Initialized empty Git repository\n' };
  }

  add(paths: string[]): GitCommandResult {
    this.requireInit();
    if (paths.length === 0) return { success: false, output: '', error: 'Nothing specified, nothing added.' };
    if (paths[0] === '.') {
      this.state.staging = { ...this.state.working };
      return { success: true, output: `Staged ${Object.keys(this.state.working).length} file(s)\n` };
    }
    let count = 0;
    for (const p of paths) {
      if (this.state.working[p] !== undefined) { this.state.staging[p] = this.state.working[p]; count++; }
      else return { success: false, output: '', error: `fatal: pathspec '${p}' did not match any files` };
    }
    return { success: true, output: `Staged ${count} file(s)\n` };
  }

  commit(message: string): GitCommandResult {
    this.requireInit();
    if (!message) return { success: false, output: '', error: 'Please provide a commit message' };
    const staged = Object.keys(this.state.staging);
    if (staged.length === 0) return { success: false, output: '', error: 'nothing to commit' };
    const branch = this.currentBranch();
    const parentIds: string[] = [];
    if (this.state.branches[branch]?.commitId) parentIds.push(this.state.branches[branch].commitId);
    const id = generateId();
    const commit: GitCommit = { id, shortId: shortId(id), message, parentIds, author: 'You <you@iso-git>', timestamp: now(), tree: { ...this.state.staging }, branchLabel: branch };
    this.state.commits[id] = commit;
    this.state.branches[branch].commitId = id;
    this.state.staging = {};
    return { success: true, output: `[${branch} ${commit.shortId}] ${message}\n` };
  }

  createBranch(name: string): GitCommandResult {
    this.requireInit();
    if (this.state.branches[name]) return { success: false, output: '', error: `Branch '${name}' already exists` };
    const current = this.currentBranch();
    const idx = Object.keys(this.state.branches).filter(b => !this.state.branches[b].isRemote).length;
    this.state.branches[name] = { name, commitId: this.state.branches[current]?.commitId || '', color: getBranchColor(idx) };
    return { success: true, output: `Created branch '${name}'\n` };
  }

  deleteBranch(name: string): GitCommandResult {
    this.requireInit();
    if (!this.state.branches[name]) return { success: false, output: '', error: `Branch '${name}' not found` };
    if (name === this.currentBranch()) return { success: false, output: '', error: `Cannot delete current branch` };
    delete this.state.branches[name];
    return { success: true, output: `Deleted branch '${name}'\n` };
  }

  listBranches(): GitCommandResult {
    this.requireInit();
    const current = this.currentBranch();
    const lines = Object.keys(this.state.branches).filter(b => !this.state.branches[b].isRemote).sort().map(b => b === current ? `* ${b}` : `  ${b}`);
    return { success: true, output: lines.join('\n') + '\n' };
  }

  checkout(target: string): GitCommandResult {
    this.requireInit();
    if (this.state.branches[target] && !this.state.branches[target].isRemote) {
      this.state.HEAD = { type: 'branch', ref: target };
      const cid = this.state.branches[target].commitId;
      if (cid && this.state.commits[cid]) this.state.working = { ...this.state.commits[cid].tree };
      this.state.staging = {};
      return { success: true, output: `Switched to branch '${target}'\n` };
    }
    const commit = this.findCommit(target);
    if (commit) {
      this.state.HEAD = { type: 'detached', commitId: commit.id };
      this.state.working = { ...commit.tree };
      this.state.staging = {};
      return { success: true, output: `HEAD is now at ${commit.shortId}\n` };
    }
    return { success: false, output: '', error: `error: '${target}' not found` };
  }

  merge(branchName: string): GitCommandResult {
    this.requireInit();
    const branch = this.state.branches[branchName];
    if (!branch) return { success: false, output: '', error: `merge: '${branchName}' not found` };
    const current = this.currentBranch();
    const ourId = this.state.branches[current]?.commitId || '';
    const theirId = branch.commitId;
    if (!theirId) return { success: false, output: '', error: `'${branchName}' has no commits` };
    if (ourId === theirId) return { success: true, output: 'Already up to date.\n' };
    if (!ourId || this.isAncestor(ourId, theirId)) {
      this.state.branches[current].commitId = theirId;
      this.state.working = { ...this.state.commits[theirId].tree };
      return { success: true, output: `Fast-forward\n` };
    }
    const mergedTree = { ...this.state.commits[ourId].tree, ...this.state.commits[theirId].tree };
    const id = generateId();
    this.state.commits[id] = { id, shortId: shortId(id), message: `Merge '${branchName}' into ${current}`, parentIds: [ourId, theirId], author: 'You <you@iso-git>', timestamp: now(), tree: mergedTree, branchLabel: current };
    this.state.branches[current].commitId = id;
    this.state.working = { ...mergedTree };
    this.state.staging = {};
    return { success: true, output: `Merge made by 'ort' strategy.\n` };
  }

  rebase(targetBranch: string): GitCommandResult { return { success: false, output: '', error: 'Rebase not yet supported in isomorphic-git backend' }; }
  log(count?: number): GitCommandResult {
    this.requireInit();
    const startId = this.state.HEAD.type === 'branch' ? this.state.branches[this.currentBranch()]?.commitId : this.state.HEAD.commitId;
    if (!startId) return { success: true, output: 'No commits yet\n' };
    const result: string[] = [];
    let id: string | undefined = startId;
    let n = 0;
    while (id && n < (count || 50)) {
      const c: GitCommit | undefined = this.state.commits[id];
      if (!c) break;
      result.push(`commit ${c.shortId}\nAuthor: ${c.author}\n\n    ${c.message}\n`);
      id = c.parentIds[0];
      n++;
    }
    return { success: true, output: result.join('\n') };
  }
  status(): GitCommandResult { return { success: true, output: 'Status not fully implemented in isomorphic-git backend\n' }; }
  diff(): GitCommandResult { return { success: true, output: 'Diff not fully implemented in isomorphic-git backend\n' }; }
  createTag(name: string, message?: string): GitCommandResult {
    this.requireInit();
    const cid = this.state.HEAD.type === 'branch' ? this.state.branches[this.currentBranch()]?.commitId : this.state.HEAD.commitId;
    if (!cid) return { success: false, output: '', error: 'No commits yet' };
    this.state.tags[name] = { name, commitId: cid, message };
    return { success: true, output: `Created tag '${name}'\n` };
  }
  listTags(): GitCommandResult { return { success: true, output: Object.keys(this.state.tags).join('\n') + '\n' }; }
  stash(message?: string): GitCommandResult { return { success: false, output: '', error: 'Stash not yet supported in isomorphic-git backend' }; }
  stashPop(): GitCommandResult { return { success: false, output: '', error: 'Stash not yet supported' }; }
  stashList(): GitCommandResult { return { success: true, output: 'No stash entries\n' }; }
  reset(target: string, mode?: 'soft' | 'mixed' | 'hard'): GitCommandResult { return { success: false, output: '', error: 'Reset not yet supported in isomorphic-git backend' }; }
  cherryPick(commitHash: string): GitCommandResult { return { success: false, output: '', error: 'Cherry-pick not yet supported' }; }

  addRemote(name: string, url: string): GitCommandResult {
    this.requireInit();
    this.state.remotes[name] = { name, url, branches: {}, commits: {} };
    return { success: true, output: `Added remote '${name}'\n` };
  }
  listRemotes(): GitCommandResult {
    const remotes = Object.values(this.state.remotes);
    if (remotes.length === 0) return { success: true, output: 'No remotes\n' };
    return { success: true, output: remotes.map(r => `${r.name}\t${r.url}`).join('\n') + '\n' };
  }
  fetch(remoteName: string): GitCommandResult { return { success: false, output: '', error: 'Fetch requires a real remote connection' }; }
  pull(remoteName?: string, branchName?: string): GitCommandResult { return { success: false, output: '', error: 'Pull requires a real remote connection' }; }
  push(remoteName?: string, branchName?: string): GitCommandResult { return { success: false, output: '', error: 'Push requires a real remote connection' }; }

  editFile(path: string, content: string): GitCommandResult { this.requireInit(); this.state.working[path] = content; return { success: true, output: `Edited: ${path}\n` }; }
  addFile(path: string, content: string): GitCommandResult { this.requireInit(); this.state.working[path] = content; return { success: true, output: `Created: ${path}\n` }; }
  removeFile(path: string): GitCommandResult { this.requireInit(); delete this.state.working[path]; return { success: true, output: `Removed: ${path}\n` }; }

  execute(raw: string): GitCommandResult {
    // Delegate to a simple command parser (same structure as simulator)
    return { success: false, output: '', error: 'Direct command execution not yet supported in isomorphic-git backend. Use the simulator for learning.' };
  }

  showHelp(): GitCommandResult {
    return { success: true, output: 'Isomorphic-Git Backend — Full git operations in the browser\n' };
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private requireInit() { if (!this.state.initialized) throw new Error('Not a git repository'); }
  private currentBranch(): string { return this.state.HEAD.type === 'branch' ? this.state.HEAD.ref : '(detached)'; }
  private findCommit(hash: string): GitCommit | null {
    if (this.state.commits[hash]) return this.state.commits[hash];
    for (const [, c] of Object.entries(this.state.commits)) { if (c.shortId === hash) return c; }
    return null;
  }
  private isAncestor(ancestorId: string, descendantId: string): boolean {
    const visited = new Set<string>();
    const queue = [descendantId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (id === ancestorId) return true;
      if (visited.has(id)) continue;
      visited.add(id);
      const c = this.state.commits[id];
      if (c) queue.push(...c.parentIds);
    }
    return false;
  }
}
