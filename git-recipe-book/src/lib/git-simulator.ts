import {
  GitState,
  GitCommit,
  GitBranch,
  GitTag,
  StashEntry,
  HEADRef,
  GitCommandResult,
  GitRemote,
  generateId,
  shortId,
  now,
  getBranchColor,
  REMOTE_BRANCH_COLOR,
  REMOTE_COMMIT_COLOR,
} from './git-types';
import type { IGitBackend } from './interfaces';

// ─── Default initial repo files (Recipe Book) ───────────────────────────────

const INITIAL_FILES: Record<string, string> = {
  'README.md': `# 🍳 The Recipe Book\n\nA collaborative collection of delicious recipes from around the world.\nEach recipe lives in the recipes/ folder. Happy cooking!\n`,
  'recipes/pasta.md': `# Spaghetti Carbonara\n\nA classic Roman pasta dish - creamy without cream!\n\n## Ingredients\n- 400g spaghetti\n- 200g guanciale\n- 4 egg yolks\n- 100g pecorino romano\n- Black pepper\n\n## Instructions\n1. Cook spaghetti al dente\n2. Crisp guanciale in a pan\n3. Mix yolks with cheese and pepper\n4. Toss hot pasta with guanciale\n5. Add egg mixture off heat\n`,
  'recipes/salad.md': `# Caesar Salad\n\nThe original, not the creamy kind.\n\n## Ingredients\n- 1 romaine lettuce\n- 2 anchovy fillets\n- 1 egg yolk\n- 2 cloves garlic\n- Lemon juice\n- Olive oil\n- Parmesan shavings\n\n## Instructions\n1. Wash and chop romaine\n2. Mash anchovies with garlic\n3. Whisk yolk with lemon and oil\n4. Toss lettuce with dressing\n5. Top with parmesan\n`,
};

// ─── Simulator Class ─────────────────────────────────────────────────────────

export class GitSimulator implements IGitBackend {
  readonly backendType = 'simulator' as const;
  readonly isRealGit = false;

  private state: GitState;

  constructor() {
    this.state = createEmptyState();
  }

  getState(): GitState {
    return this.state;
  }

  loadState(s: GitState) {
    this.state = JSON.parse(JSON.stringify(s));
  }

  fullReset() {
    this.state = createEmptyState();
  }

  // ─── git init ────────────────────────────────────────────────────────────

  init(): GitCommandResult {
    if (this.state.initialized) {
      return { success: false, output: '', error: 'Already initialized!' };
    }
    this.state.initialized = true;
    this.state.branches['main'] = {
      name: 'main',
      commitId: '',
      color: getBranchColor(0),
    };
    this.state.HEAD = { type: 'branch', ref: 'main' };
    this.state.working = { ...INITIAL_FILES };
    return { success: true, output: 'Initialized empty Git repository (recipe-book)\n' };
  }

  // ─── git add ─────────────────────────────────────────────────────────────

  add(paths: string[]): GitCommandResult {
    this.requireInit();
    if (paths.length === 0) {
      return { success: false, output: '', error: 'Nothing specified, nothing added.' };
    }
    if (paths[0] === '.') {
      this.state.staging = {};
      for (const [fp, content] of Object.entries(this.state.working)) {
        this.state.staging[fp] = content;
      }
      return { success: true, output: `Staged ${Object.keys(this.state.working).length} file(s)\n` };
    }
    let count = 0;
    for (const p of paths) {
      if (this.state.working[p] !== undefined) {
        this.state.staging[p] = this.state.working[p];
        count++;
      } else {
        return { success: false, output: '', error: `fatal: pathspec '${p}' did not match any files` };
      }
    }
    return { success: true, output: `Staged ${count} file(s)\n` };
  }

  // ─── git commit ──────────────────────────────────────────────────────────

  commit(message: string): GitCommandResult {
    this.requireInit();
    if (!message) {
      return { success: false, output: '', error: 'Please provide a commit message: git commit -m "message"' };
    }
    const stagedFiles = Object.keys(this.state.staging);
    if (stagedFiles.length === 0) {
      return { success: false, output: '', error: 'nothing to commit, working tree clean' };
    }

    const branchName = this.getCurrentBranch();
    const parentIds: string[] = [];

    if (this.state.branches[branchName]?.commitId) {
      parentIds.push(this.state.branches[branchName].commitId);
    }

    const id = generateId();
    const commit: GitCommit = {
      id,
      shortId: shortId(id),
      message,
      parentIds,
      author: 'You <you@recipe-book>',
      timestamp: now(),
      tree: { ...this.state.staging },
      branchLabel: branchName,
    };

    this.state.commits[id] = commit;
    this.state.branches[branchName].commitId = id;
    this.state.staging = {};

    const fileCount = Object.keys(commit.tree).length;
    return {
      success: true,
      output: `[${branchName} ${commit.shortId}] ${message}\n ${fileCount} file(s) changed\n`,
    };
  }

  // ─── git branch ──────────────────────────────────────────────────────────

  createBranch(name: string): GitCommandResult {
    this.requireInit();
    if (!name) {
      return { success: false, output: '', error: 'fatal: not a valid branch name' };
    }
    if (this.state.branches[name]) {
      return { success: false, output: '', error: `fatal: A branch named '${name}' already exists.` };
    }
    const currentBranch = this.getCurrentBranch();
    const currentCommitId = this.state.branches[currentBranch]?.commitId || '';
    const colorIdx = Object.keys(this.state.branches).filter(b => !this.state.branches[b].isRemote).length;
    this.state.branches[name] = {
      name,
      commitId: currentCommitId,
      color: getBranchColor(colorIdx),
    };
    return { success: true, output: `Created branch '${name}' (based on '${currentBranch}')\n` };
  }

  deleteBranch(name: string): GitCommandResult {
    this.requireInit();
    if (!this.state.branches[name]) {
      return { success: false, output: '', error: `branch '${name}' not found.` };
    }
    if (name === this.getCurrentBranch()) {
      return { success: false, output: '', error: `Cannot delete branch '${name}' checked out` };
    }
    if (this.state.branches[name].isRemote) {
      return { success: false, output: '', error: `Cannot delete remote-tracking branch '${name}' directly` };
    }
    delete this.state.branches[name];
    return { success: true, output: `Deleted branch '${name}'\n` };
  }

  listBranches(): GitCommandResult {
    this.requireInit();
    const current = this.getCurrentBranch();
    const localBranches = Object.keys(this.state.branches)
      .filter(b => !this.state.branches[b].isRemote)
      .sort()
      .map((b) => (b === current ? `* ${b}` : `  ${b}`));
    const remoteBranches = Object.keys(this.state.branches)
      .filter(b => this.state.branches[b].isRemote)
      .sort()
      .map((b) => `  remotes/${b}`);

    const lines = [...localBranches];
    if (remoteBranches.length > 0) {
      lines.push('');
      lines.push('Remote branches:');
      lines.push(...remoteBranches);
    }
    return { success: true, output: lines.join('\n') + '\n' };
  }

  // ─── git checkout / switch ───────────────────────────────────────────────

  checkout(target: string): GitCommandResult {
    this.requireInit();

    // Handle remote-tracking branch checkout (create local branch from remote)
    const remoteTrackingPrefix = Object.keys(this.state.remotes)
      .find(r => target.startsWith(`${r}/`));
    if (remoteTrackingPrefix) {
      const remoteBranchName = target.slice(remoteTrackingPrefix.length + 1);
      const remoteBranch = this.state.branches[target];
      if (remoteBranch?.isRemote && remoteBranch.commitId) {
        // Create local branch tracking the remote branch
        const localBranchName = remoteBranchName;
        if (this.state.branches[localBranchName] && !this.state.branches[localBranchName].isRemote) {
          // Local branch already exists, just switch
          this.state.HEAD = { type: 'branch', ref: localBranchName };
          const commitId = this.state.branches[localBranchName].commitId;
          if (commitId && this.state.commits[commitId]) {
            this.state.working = { ...this.state.commits[commitId].tree };
          }
          this.state.staging = {};
          return { success: true, output: `Switched to branch '${localBranchName}'\n` };
        }
        // Create new local branch from remote
        const colorIdx = Object.keys(this.state.branches).filter(b => !this.state.branches[b].isRemote).length;
        this.state.branches[localBranchName] = {
          name: localBranchName,
          commitId: remoteBranch.commitId,
          color: getBranchColor(colorIdx),
        };
        this.state.trackingBranches[localBranchName] = {
          remote: remoteTrackingPrefix,
          remoteBranch: target,
        };
        this.state.HEAD = { type: 'branch', ref: localBranchName };
        this.state.working = { ...this.state.commits[remoteBranch.commitId].tree };
        this.state.staging = {};
        return {
          success: true,
          output: `Branch '${localBranchName}' set up to track remote branch '${target}'.\nSwitched to a new branch '${localBranchName}'\n`,
        };
      }
    }

    if (this.state.branches[target] && !this.state.branches[target].isRemote) {
      this.state.HEAD = { type: 'branch', ref: target };
      const commitId = this.state.branches[target].commitId;
      if (commitId && this.state.commits[commitId]) {
        this.state.working = { ...this.state.commits[commitId].tree };
      }
      this.state.staging = {};
      return { success: true, output: `Switched to branch '${target}'\n` };
    }

    // Try as commit hash
    const commit = this.findCommit(target);
    if (commit) {
      this.state.HEAD = { type: 'detached', commitId: commit.id };
      this.state.working = { ...commit.tree };
      this.state.staging = {};
      return { success: true, output: `HEAD is now at ${commit.shortId} ${commit.message}\n` };
    }

    return { success: false, output: '', error: `error: pathspec '${target}' did not match any branch or commit` };
  }

  // ─── git merge ───────────────────────────────────────────────────────────

  merge(branchName: string): GitCommandResult {
    this.requireInit();
    // Support merging remote-tracking branches
    const branch = this.state.branches[branchName];
    if (!branch) {
      return { success: false, output: '', error: `merge: branch '${branchName}' not found` };
    }
    const currentBranch = this.getCurrentBranch();
    if (currentBranch === branchName) {
      return { success: false, output: '', error: 'Cannot merge a branch into itself.' };
    }

    const ourCommitId = this.state.branches[currentBranch]?.commitId || '';
    const theirCommitId = branch.commitId;

    if (!theirCommitId) {
      return { success: false, output: '', error: `branch '${branchName}' has no commits yet` };
    }

    if (ourCommitId === theirCommitId) {
      return { success: true, output: 'Already up to date.\n' };
    }

    if (!ourCommitId) {
      this.state.branches[currentBranch].commitId = theirCommitId;
      this.state.working = { ...this.state.commits[theirCommitId].tree };
      return { success: true, output: `Fast-forward\n ${branchName} -> ${currentBranch}\n` };
    }

    const isAncestor = this.isAncestor(ourCommitId, theirCommitId);
    if (isAncestor) {
      this.state.branches[currentBranch].commitId = theirCommitId;
      this.state.working = { ...this.state.commits[theirCommitId].tree };
      return { success: true, output: `Fast-forward\n ${branchName} -> ${currentBranch}\n` };
    }

    const mergedTree = { ...this.state.commits[ourCommitId].tree };
    for (const [fp, content] of Object.entries(this.state.commits[theirCommitId].tree)) {
      if (mergedTree[fp] === undefined) {
        mergedTree[fp] = content;
      }
    }

    const id = generateId();
    const mergeCommit: GitCommit = {
      id,
      shortId: shortId(id),
      message: `Merge branch '${branchName}' into ${currentBranch}`,
      parentIds: [ourCommitId, theirCommitId],
      author: 'You <you@recipe-book>',
      timestamp: now(),
      tree: mergedTree,
      branchLabel: currentBranch,
    };

    this.state.commits[id] = mergeCommit;
    this.state.branches[currentBranch].commitId = id;
    this.state.working = { ...mergedTree };
    this.state.staging = {};

    return {
      success: true,
      output: `Merge made by the 'ort' strategy.\n Merged '${branchName}' into ${currentBranch}\n`,
    };
  }

  // ─── git rebase ──────────────────────────────────────────────────────────

  rebase(targetBranch: string): GitCommandResult {
    this.requireInit();
    const branch = this.state.branches[targetBranch];
    if (!branch) {
      return { success: false, output: '', error: `rebase: branch '${targetBranch}' not found` };
    }
    const currentBranch = this.getCurrentBranch();
    if (currentBranch === targetBranch) {
      return { success: false, output: '', error: 'Cannot rebase a branch onto itself.' };
    }

    const baseCommitId = branch.commitId;
    if (!baseCommitId) {
      return { success: false, output: '', error: `branch '${targetBranch}' has no commits` };
    }

    const currentCommitId = this.state.branches[currentBranch]?.commitId || '';
    if (!currentCommitId) {
      return { success: false, output: '', error: 'Current branch has no commits to rebase.' };
    }

    const targetAncestors = this.getAncestors(baseCommitId);
    const currentCommits = this.getCommitChain(currentCommitId);
    const uniqueCommits = currentCommits.filter((c) => !targetAncestors.has(c.id));

    if (uniqueCommits.length === 0) {
      this.state.branches[currentBranch].commitId = baseCommitId;
      this.state.working = { ...this.state.commits[baseCommitId].tree };
      return { success: true, output: 'Already up to date.\n' };
    }

    let parentId = baseCommitId;
    for (const oldCommit of uniqueCommits.reverse()) {
      const id = generateId();
      const newTree = { ...this.state.commits[parentId].tree };
      for (const [fp, content] of Object.entries(oldCommit.tree)) {
        newTree[fp] = content;
      }
      const newCommit: GitCommit = {
        id,
        shortId: shortId(id),
        message: oldCommit.message,
        parentIds: [parentId],
        author: oldCommit.author,
        timestamp: now(),
        tree: newTree,
        branchLabel: currentBranch,
      };
      this.state.commits[id] = newCommit;
      parentId = id;
    }

    this.state.branches[currentBranch].commitId = parentId;
    this.state.working = { ...this.state.commits[parentId].tree };
    this.state.staging = {};

    return {
      success: true,
      output: `Successfully rebased ${currentBranch} onto ${targetBranch}\n ${uniqueCommits.length} commit(s) replayed\n`,
    };
  }

  // ─── git log ─────────────────────────────────────────────────────────────

  log(count?: number): GitCommandResult {
    this.requireInit();
    const currentBranch = this.getCurrentBranch();
    const startId = this.state.HEAD.type === 'branch'
      ? this.state.branches[currentBranch]?.commitId
      : this.state.HEAD.commitId;

    if (!startId) {
      return { success: true, output: 'No commits yet\n' };
    }

    const visited = new Set<string>();
    const result: string[] = [];
    const queue = [startId];
    let logCount = 0;
    const max = count || 50;

    while (queue.length > 0 && logCount < max) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const commit = this.state.commits[id];
      if (!commit) continue;

      const branchLabels = Object.entries(this.state.branches)
        .filter(([, b]) => b.commitId === id)
        .map(([name]) => name);

      const tagLabels = Object.entries(this.state.tags)
        .filter(([, t]) => t.commitId === id)
        .map(([name]) => name);

      const refs = [
        ...branchLabels.map((b) => `(${b})`),
        ...tagLabels.map((t) => `tag: ${t}`),
        id === startId && this.state.HEAD.type === 'detached' ? '(HEAD detached)' : '',
      ].filter(Boolean);

      result.push(
        `commit ${commit.shortId}${refs.length ? ' ' + refs.join(', ') : ''}\n` +
        `Author: ${commit.author}\n` +
        `Date:   ${new Date(commit.timestamp).toLocaleString()}\n\n` +
        `    ${commit.message}\n`
      );

      logCount++;
      for (const pid of commit.parentIds) {
        queue.push(pid);
      }
    }

    return { success: true, output: result.join('\n') };
  }

  // ─── git status ──────────────────────────────────────────────────────────

  status(): GitCommandResult {
    this.requireInit();
    const branch = this.state.HEAD.type === 'branch' ? this.state.HEAD.ref : `HEAD detached at ${shortId(this.state.HEAD.commitId)}`;
    const lines = [`On branch ${branch}`];

    // Show tracking info
    if (this.state.HEAD.type === 'branch') {
      const tracking = this.state.trackingBranches[this.state.HEAD.ref];
      if (tracking) {
        const localCommit = this.state.branches[this.state.HEAD.ref]?.commitId;
        const remoteCommit = this.state.branches[tracking.remoteBranch]?.commitId;
        if (localCommit && remoteCommit) {
          if (localCommit === remoteCommit) {
            lines.push(`Your branch is up to date with '${tracking.remoteBranch}'.`);
          } else if (this.isAncestor(remoteCommit, localCommit)) {
            const ahead = this.countAhead(localCommit, remoteCommit);
            lines.push(`Your branch is ahead of '${tracking.remoteBranch}' by ${ahead} commit(s).`);
          } else {
            lines.push(`Your branch and '${tracking.remoteBranch}' have diverged.`);
          }
        }
      }
    }

    const staged = Object.keys(this.state.staging);
    if (staged.length > 0) {
      lines.push('\nChanges to be committed:');
      for (const f of staged) {
        lines.push(`  new file:   ${f}`);
      }
    }

    const tipCommit = this.getTipCommit();
    const tipTree = tipCommit?.tree || {};
    const unstaged: string[] = [];
    const untracked: string[] = [];
    for (const [fp, content] of Object.entries(this.state.working)) {
      if (tipTree[fp] === undefined) {
        untracked.push(fp);
      } else if (tipTree[fp] !== content) {
        unstaged.push(fp);
      }
    }
    const deleted = Object.keys(tipTree).filter((fp) => this.state.working[fp] === undefined);

    if (unstaged.length > 0 || deleted.length > 0) {
      lines.push('\nChanges not staged for commit:');
      for (const f of unstaged) lines.push(`  modified:   ${f}`);
      for (const f of deleted) lines.push(`  deleted:    ${f}`);
    }
    if (untracked.length > 0) {
      lines.push('\nUntracked files:');
      for (const f of untracked) lines.push(`  ${f}`);
    }

    if (staged.length === 0 && unstaged.length === 0 && untracked.length === 0 && deleted.length === 0) {
      lines.push('nothing to commit, working tree clean');
    }

    return { success: true, output: lines.join('\n') + '\n' };
  }

  // ─── git diff ────────────────────────────────────────────────────────────

  diff(): GitCommandResult {
    this.requireInit();
    const tipCommit = this.getTipCommit();
    const tipTree = tipCommit?.tree || {};
    const lines: string[] = [];

    for (const [fp, content] of Object.entries(this.state.working)) {
      if (tipTree[fp] !== content) {
        lines.push(`diff --git a/${fp} b/${fp}`);
        lines.push(`--- a/${fp}`);
        lines.push(`+++ b/${fp}`);
        const oldLines = (tipTree[fp] || '').split('\n');
        const newLines = content.split('\n');
        for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
          if (oldLines[i] !== newLines[i]) {
            if (oldLines[i] !== undefined) lines.push(`- ${oldLines[i]}`);
            if (newLines[i] !== undefined) lines.push(`+ ${newLines[i]}`);
          }
        }
        lines.push('');
      }
    }

    if (lines.length === 0) {
      return { success: true, output: 'No differences found.\n' };
    }
    return { success: true, output: lines.join('\n') };
  }

  // ─── git tag ─────────────────────────────────────────────────────────────

  createTag(name: string, message?: string): GitCommandResult {
    this.requireInit();
    if (this.state.tags[name]) {
      return { success: false, output: '', error: `fatal: tag '${name}' already exists` };
    }
    const commitId = this.getTipCommitId();
    if (!commitId) {
      return { success: false, output: '', error: 'fatal: no commits yet' };
    }
    this.state.tags[name] = { name, commitId, message };
    return { success: true, output: `Created tag '${name}'\n` };
  }

  listTags(): GitCommandResult {
    this.requireInit();
    const tags = Object.keys(this.state.tags).sort();
    if (tags.length === 0) return { success: true, output: 'No tags\n' };
    return { success: true, output: tags.join('\n') + '\n' };
  }

  // ─── git stash ───────────────────────────────────────────────────────────

  stash(message?: string): GitCommandResult {
    this.requireInit();
    const tipCommit = this.getTipCommit();
    if (!tipCommit) {
      return { success: false, output: '', error: 'You do not have any commits yet' };
    }

    const entry: StashEntry = {
      id: generateId(),
      message: message || 'WIP on ' + this.getCurrentBranch(),
      commitId: tipCommit.id,
      tree: { ...this.state.working },
      timestamp: now(),
    };
    this.state.stash.push(entry);
    this.state.working = { ...tipCommit.tree };
    this.state.staging = {};
    return { success: true, output: `Saved working directory and index state ${entry.message}\n` };
  }

  stashPop(): GitCommandResult {
    this.requireInit();
    if (this.state.stash.length === 0) {
      return { success: false, output: '', error: 'No stash entries found.' };
    }
    const entry = this.state.stash.pop()!;
    this.state.working = { ...entry.tree };
    return { success: true, output: `On branch ${this.getCurrentBranch()}\nChanges restored from stash\n` };
  }

  stashList(): GitCommandResult {
    this.requireInit();
    if (this.state.stash.length === 0) {
      return { success: true, output: 'No stash entries\n' };
    }
    const lines = this.state.stash.map(
      (e, i) => `stash@{${i}}: ${e.message}`
    );
    return { success: true, output: lines.join('\n') + '\n' };
  }

  // ─── git reset ───────────────────────────────────────────────────────────

  reset(target: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed'): GitCommandResult {
    this.requireInit();
    const commit = this.findCommit(target);
    if (!commit) {
      return { success: false, output: '', error: `fatal: ambiguous argument '${target}'` };
    }

    const branch = this.getCurrentBranch();
    if (this.state.branches[branch]) {
      this.state.branches[branch].commitId = commit.id;
    }

    if (mode === 'hard') {
      this.state.working = { ...commit.tree };
      this.state.staging = {};
    } else if (mode === 'mixed') {
      this.state.staging = {};
      this.state.working = { ...commit.tree };
    }

    if (this.state.HEAD.type === 'detached') {
      this.state.HEAD = { type: 'detached', commitId: commit.id };
    }

    return { success: true, output: `HEAD is now at ${commit.shortId} ${commit.message}\n` };
  }

  // ─── git cherry-pick ─────────────────────────────────────────────────────

  cherryPick(commitHash: string): GitCommandResult {
    this.requireInit();
    const commit = this.findCommit(commitHash);
    if (!commit) {
      return { success: false, output: '', error: `fatal: bad object ${commitHash}` };
    }

    const branch = this.getCurrentBranch();
    const parentId = this.state.branches[branch]?.commitId || '';

    const id = generateId();
    const newTree = parentId ? { ...this.state.commits[parentId].tree } : {};
    for (const [fp, content] of Object.entries(commit.tree)) {
      newTree[fp] = content;
    }

    const newCommit: GitCommit = {
      id,
      shortId: shortId(id),
      message: `${commit.message} (cherry-picked from ${commit.shortId})`,
      parentIds: parentId ? [parentId] : [],
      author: commit.author,
      timestamp: now(),
      tree: newTree,
      branchLabel: branch,
    };

    this.state.commits[id] = newCommit;
    this.state.branches[branch].commitId = id;
    this.state.working = { ...newTree };
    this.state.staging = {};

    return {
      success: true,
      output: `[${branch} ${newCommit.shortId}] ${newCommit.message}\n`,
    };
  }

  // ─── git remote ──────────────────────────────────────────────────────────

  addRemote(name: string, url: string): GitCommandResult {
    this.requireInit();
    if (this.state.remotes[name]) {
      return { success: false, output: '', error: `remote '${name}' already exists` };
    }
    this.state.remotes[name] = {
      name,
      url,
      branches: {},
      commits: {},
    };
    return { success: true, output: `Added remote '${name}' (${url})\n` };
  }

  listRemotes(): GitCommandResult {
    this.requireInit();
    const remotes = Object.values(this.state.remotes);
    if (remotes.length === 0) {
      return { success: true, output: 'No remotes configured\n' };
    }
    const lines = remotes.map((r) => `${r.name}\t${r.url}`);
    return { success: true, output: lines.join('\n') + '\n' };
  }

  // ─── git fetch ───────────────────────────────────────────────────────────

  fetch(remoteName: string): GitCommandResult {
    this.requireInit();
    const remote = this.state.remotes[remoteName];
    if (!remote) {
      return { success: false, output: '', error: `fatal: '${remoteName}' is not a remote` };
    }

    // Import remote commits and branches into local state
    let importedCommits = 0;
    let importedBranches = 0;

    for (const [id, commit] of Object.entries(remote.commits)) {
      this.state.commits[id] = commit;
      importedCommits++;
    }

    for (const [branchName, branch] of Object.entries(remote.branches)) {
      const trackingBranchName = `${remoteName}/${branchName}`;
      this.state.branches[trackingBranchName] = {
        ...branch,
        name: trackingBranchName,
        isRemote: true,
        tracksRemote: remoteName,
        color: REMOTE_BRANCH_COLOR,
      };
      importedBranches++;
    }

    return {
      success: true,
      output: `From ${remote.url}\n * [new branch]  ${Object.keys(remote.branches).join(', ')} -> ${remoteName}/*\n Imported ${importedCommits} commit(s), ${importedBranches} branch(es)\n`,
    };
  }

  // ─── git pull ────────────────────────────────────────────────────────────

  pull(remoteName?: string, branchName?: string): GitCommandResult {
    this.requireInit();
    const remote = remoteName ? this.state.remotes[remoteName] : Object.values(this.state.remotes)[0];
    if (!remote) {
      return { success: false, output: '', error: 'fatal: No remote configured. Use git remote add first.' };
    }

    // First, fetch
    const fetchResult = this.fetch(remote.name);
    if (!fetchResult.success) return fetchResult;

    // Then, merge the remote-tracking branch
    const currentBranch = this.getCurrentBranch();
    const remoteBranchName = branchName || currentBranch;
    const trackingBranchRef = `${remote.name}/${remoteBranchName}`;

    const trackingBranch = this.state.branches[trackingBranchRef];
    if (!trackingBranch) {
      return { success: false, output: '', error: `fatal: couldn't find remote ref ${trackingBranchRef}` };
    }

    // Set up tracking
    this.state.trackingBranches[currentBranch] = {
      remote: remote.name,
      remoteBranch: trackingBranchRef,
    };

    // Merge
    const mergeResult = this.merge(trackingBranchRef);
    if (!mergeResult.success) {
      return { success: true, output: fetchResult.output + mergeResult.output };
    }

    return {
      success: true,
      output: `From ${remote.url}\n${mergeResult.output}`,
    };
  }

  // ─── git push ────────────────────────────────────────────────────────────

  push(remoteName?: string, branchName?: string): GitCommandResult {
    this.requireInit();
    const remote = remoteName ? this.state.remotes[remoteName] : Object.values(this.state.remotes)[0];
    if (!remote) {
      return { success: false, output: '', error: 'fatal: No remote configured. Use git remote add first.' };
    }

    const currentBranch = this.getCurrentBranch();
    const branchToPush = branchName || currentBranch;
    const localBranch = this.state.branches[branchToPush];

    if (!localBranch || localBranch.isRemote) {
      return { success: false, output: '', error: `fatal: '${branchToPush}' is not a local branch` };
    }

    const localCommitId = localBranch.commitId;
    if (!localCommitId) {
      return { success: false, output: '', error: `fatal: branch '${branchToPush}' has no commits` };
    }

    // Push commits to remote
    const commitsToPush = this.getCommitChain(localCommitId);
    let pushedCount = 0;
    for (const commit of commitsToPush) {
      if (!remote.commits[commit.id]) {
        remote.commits[commit.id] = { ...commit };
        pushedCount++;
      }
    }

    // Update remote branch
    remote.branches[branchToPush] = {
      name: branchToPush,
      commitId: localCommitId,
      color: REMOTE_BRANCH_COLOR,
      isRemote: true,
      tracksRemote: remote.name,
    };

    // Update the tracking branch locally
    const trackingBranchRef = `${remote.name}/${branchToPush}`;
    this.state.branches[trackingBranchRef] = {
      name: trackingBranchRef,
      commitId: localCommitId,
      color: REMOTE_BRANCH_COLOR,
      isRemote: true,
      tracksRemote: remote.name,
    };

    // Set up tracking
    this.state.trackingBranches[branchToPush] = {
      remote: remote.name,
      remoteBranch: trackingBranchRef,
    };

    return {
      success: true,
      output: `To ${remote.url}\n * [new branch]  ${branchToPush} -> ${branchToPush}\n Pushed ${pushedCount} commit(s) to ${remote.name}/${branchToPush}\n`,
    };
  }

  // ─── File operations ─────────────────────────────────────────────────────

  editFile(path: string, content: string): GitCommandResult {
    this.requireInit();
    this.state.working[path] = content;
    return { success: true, output: `Edited: ${path}\n` };
  }

  addFile(path: string, content: string): GitCommandResult {
    this.requireInit();
    this.state.working[path] = content;
    return { success: true, output: `Created: ${path}\n` };
  }

  removeFile(path: string): GitCommandResult {
    this.requireInit();
    if (this.state.working[path] === undefined) {
      return { success: false, output: '', error: `fatal: pathspec '${path}' did not match any files` };
    }
    delete this.state.working[path];
    return { success: true, output: `Removed: ${path}\n` };
  }

  // ─── Command Parser & Dispatcher ─────────────────────────────────────────

  execute(raw: string): GitCommandResult {
    const trimmed = raw.trim();
    if (!trimmed) return { success: false, output: '', error: 'Empty command' };

    if (trimmed === 'help') return this.showHelp();
    if (trimmed === 'clear') return { success: true, output: '__CLEAR__' };

    const parts = this.parseCommand(trimmed);
    if (!parts) {
      return { success: false, output: '', error: `Unknown command: ${trimmed}` };
    }

    const { command, args, flags } = parts;

    try {
      switch (command) {
        case 'init': return this.init();
        case 'add': return this.add(args.length ? args : ['.']);
        case 'commit': {
          const msg = flags.m || flags.message || args.join(' ');
          return this.commit(msg);
        }
        case 'branch': {
          if (flags.r || flags.remotes) {
            // List remote branches
            const remoteBranches = Object.keys(this.state.branches)
              .filter(b => this.state.branches[b].isRemote);
            if (remoteBranches.length === 0) return { success: true, output: 'No remote branches\n' };
            return { success: true, output: remoteBranches.map(b => `  ${b}`).join('\n') + '\n' };
          }
          if (args.length === 0) return this.listBranches();
          if (flags.d) return this.deleteBranch(flags.d);
          return this.createBranch(args[0]);
        }
        case 'checkout':
        case 'switch': return this.checkout(args[0]);
        case 'merge': return this.merge(args[0]);
        case 'rebase': return this.rebase(args[0]);
        case 'log': return this.log(flags.n ? parseInt(flags.n) : undefined);
        case 'status': return this.status();
        case 'diff': return this.diff();
        case 'tag': {
          if (args.length === 0) return this.listTags();
          return this.createTag(args[0], flags.m);
        }
        case 'stash': {
          if (args[0] === 'pop') return this.stashPop();
          if (args[0] === 'list') return this.stashList();
          return this.stash(flags.m);
        }
        case 'reset': {
          const mode = flags.hard ? 'hard' : flags.soft ? 'soft' : 'mixed';
          return this.reset(args[0] || '', mode);
        }
        case 'cherry-pick': return this.cherryPick(args[0]);
        case 'remote': {
          if (args[0] === 'add') return this.addRemote(args[1], args[2] || '');
          if (args[0] === '-v' || args[0] === 'verbose' || args.length === 0) return this.listRemotes();
          return { success: false, output: '', error: `remote: unknown subcommand '${args[0]}'` };
        }
        case 'fetch': return this.fetch(args[0] || 'origin');
        case 'pull': return this.pull(args[0], args[1]);
        case 'push': return this.push(args[0], args[1]);
        case 'touch': return this.addFile(args[0], '');
        case 'edit': {
          const fp = args[0];
          const content = args.slice(1).join(' ');
          return this.editFile(fp, content || '');
        }
        default:
          return { success: false, output: '', error: `git: '${command}' is not a git command.` };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return { success: false, output: '', error: msg };
    }
  }

  // ─── Help ────────────────────────────────────────────────────────────────

  showHelp(): GitCommandResult {
    return {
      success: true,
      output: [
        '🍳 Git Recipe Book — Available Commands',
        '═══════════════════════════════════════════',
        '',
        '  SETUP',
        '  git init                              Initialize repository',
        '  git status                            Show working tree status',
        '',
        '  SNAPSHOTTING',
        '  git add <file|.>                      Stage files',
        '  git commit -m "msg"                  Create a commit',
        '  git diff                              Show unstaged changes',
        '  git stash                             Stash changes',
        '  git stash pop                         Restore stashed changes',
        '',
        '  BRANCHING & MERGING',
        '  git branch [name]                     List or create branches',
        '  git branch -d <name>                  Delete a branch',
        '  git checkout <branch|hash>            Switch branches',
        '  git merge <branch>                    Merge branch into current',
        '  git rebase <branch>                   Rebase current onto branch',
        '',
        '  REMOTES',
        '  git remote add <name> <url>           Add a remote',
        '  git remote -v                         List remotes',
        '  git fetch <remote>                    Fetch from remote',
        '  git pull [<remote> [<branch>]]        Pull = fetch + merge',
        '  git push [<remote> [<branch>]]        Push to remote',
        '',
        '  INSPECTION',
        '  git log                               Show commit history',
        '  git tag [name]                        List or create tags',
        '',
        '  ADVANCED',
        '  git reset [--hard|--soft] <hash>      Reset HEAD',
        '  git cherry-pick <hash>                Apply a specific commit',
        '',
        '  OTHER',
        '  touch <file>                          Create a new file',
        '  edit <file> <content>                 Edit a file',
        '  help                                  Show this help',
        '  clear                                 Clear terminal',
      ].join('\n') + '\n',
    };
  }

  // ─── Internal Helpers ────────────────────────────────────────────────────

  private requireInit() {
    if (!this.state.initialized) {
      throw new Error('Not a git repository. Run `git init` first.');
    }
  }

  private getCurrentBranch(): string {
    if (this.state.HEAD.type === 'branch') return this.state.HEAD.ref;
    return '(detached)';
  }

  private getTipCommit(): GitCommit | null {
    const id = this.getTipCommitId();
    return id ? this.state.commits[id] || null : null;
  }

  private getTipCommitId(): string {
    if (this.state.HEAD.type === 'detached') return this.state.HEAD.commitId;
    return this.state.branches[this.state.HEAD.ref]?.commitId || '';
  }

  private findCommit(hash: string): GitCommit | null {
    if (this.state.commits[hash]) return this.state.commits[hash];
    for (const [id, commit] of Object.entries(this.state.commits)) {
      if (id.startsWith(hash) || commit.shortId === hash) return commit;
    }
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
      const commit = this.state.commits[id];
      if (commit) {
        queue.push(...commit.parentIds);
      }
    }
    return false;
  }

  private getAncestors(commitId: string): Set<string> {
    const ancestors = new Set<string>();
    const queue = [commitId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (ancestors.has(id)) continue;
      ancestors.add(id);
      const commit = this.state.commits[id];
      if (commit) queue.push(...commit.parentIds);
    }
    return ancestors;
  }

  private getCommitChain(commitId: string): GitCommit[] {
    const result: GitCommit[] = [];
    const visited = new Set<string>();
    const queue = [commitId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const commit = this.state.commits[id];
      if (!commit) continue;
      result.push(commit);
      queue.push(...commit.parentIds);
    }
    return result;
  }

  private countAhead(aheadId: string, behindId: string): number {
    const behindAncestors = this.getAncestors(behindId);
    const aheadChain = this.getCommitChain(aheadId);
    return aheadChain.filter(c => !behindAncestors.has(c.id)).length;
  }

  private parseCommand(raw: string): { command: string; args: string[]; flags: Record<string, string> } | null {
    let input = raw.trim();
    if (input.startsWith('git ')) {
      input = input.slice(4).trim();
    }

    const tokens = this.tokenize(input);
    if (tokens.length === 0) return null;

    const command = tokens[0];
    const args: string[] = [];
    const flags: Record<string, string> = {};

    let i = 1;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token.startsWith('-')) {
        const flagPart = token.replace(/^-+/, '');
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
          if (flagPart === 'm' || flagPart === 'message' || flagPart === 'n' || flagPart === 'd' || flagPart === 'r') {
            flags[flagPart] = tokens[i + 1];
            i += 2;
            continue;
          }
          if (flagPart === 'hard' || flagPart === 'soft' || flagPart === 'v' || flagPart === 'verbose' || flagPart === 'remotes') {
            flags[flagPart] = 'true';
            i++;
            continue;
          }
        }
        flags[flagPart] = 'true';
        i++;
      } else {
        args.push(token);
        i++;
      }
    }

    if (flags.m && flags.m === 'true' && args.length > 0) {
      flags.m = args.join(' ');
      args.length = 0;
    }

    return { command, args, flags };
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (const ch of input) {
      if (inQuote) {
        if (ch === quoteChar) {
          inQuote = false;
        } else {
          current += ch;
        }
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === ' ' || ch === '\t') {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);

    return tokens;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

function createEmptyState(): GitState {
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
