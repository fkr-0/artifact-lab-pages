import { describe, it, expect, beforeEach } from 'vitest';
import { GitSimulator } from '../git-simulator';
import { generateId, shortId, now } from '../git-types';

describe('GitSimulator', () => {
  let sim: GitSimulator;

  beforeEach(() => {
    sim = new GitSimulator();
  });

  // ─── init ────────────────────────────────────────────────────────────────

  describe('init', () => {
    it('creates repo with main branch', () => {
      const result = sim.init();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Initialized empty Git repository');

      const state = sim.getState();
      expect(state.initialized).toBe(true);
      expect(state.branches['main']).toBeDefined();
      expect(state.branches['main'].name).toBe('main');
      expect(state.HEAD).toEqual({ type: 'branch', ref: 'main' });
    });

    it('returns error when initializing twice', () => {
      sim.init();
      const result = sim.init();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Already initialized');
    });
  });

  // ─── add ─────────────────────────────────────────────────────────────────

  describe('add', () => {
    beforeEach(() => {
      sim.init();
    });

    it('stages all files with dot', () => {
      const result = sim.add(['.']);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Staged');

      const state = sim.getState();
      const workingCount = Object.keys(state.working).length;
      expect(Object.keys(state.staging).length).toBe(workingCount);
    });

    it('stages specific files', () => {
      const result = sim.add(['README.md']);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Staged 1 file(s)');

      const state = sim.getState();
      expect(state.staging['README.md']).toBeDefined();
    });

    it('returns error for non-existent file', () => {
      const result = sim.add(['nonexistent.txt']);
      expect(result.success).toBe(false);
      expect(result.error).toContain("pathspec 'nonexistent.txt' did not match any files");
    });

    it('returns error when no paths specified', () => {
      const result = sim.add([]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing specified');
    });
  });

  // ─── commit ──────────────────────────────────────────────────────────────

  describe('commit', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
    });

    it('creates commit with message and moves branch', () => {
      const result = sim.commit('Initial commit');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Initial commit');
      expect(result.output).toContain('main');

      const state = sim.getState();
      const commitId = state.branches['main'].commitId;
      expect(commitId).toBeTruthy();
      expect(state.commits[commitId].message).toBe('Initial commit');
      expect(state.staging).toEqual({});
    });

    it('returns error without staging', () => {
      const freshSim = new GitSimulator();
      freshSim.init();
      const result = freshSim.commit('no files');
      expect(result.success).toBe(false);
      expect(result.error).toContain('nothing to commit');
    });

    it('returns error without message', () => {
      const result = sim.commit('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Please provide a commit message');
    });
  });

  // ─── branch ──────────────────────────────────────────────────────────────

  describe('createBranch', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
    });

    it('creates branch at current commit', () => {
      const result = sim.createBranch('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain("Created branch 'feature'");

      const state = sim.getState();
      expect(state.branches['feature']).toBeDefined();
      expect(state.branches['feature'].commitId).toBe(state.branches['main'].commitId);
    });

    it('returns error for existing branch name', () => {
      const result = sim.createBranch('main');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('returns error for empty branch name', () => {
      const result = sim.createBranch('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a valid branch name');
    });
  });

  describe('deleteBranch', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');
    });

    it('removes branch', () => {
      const result = sim.deleteBranch('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain("Deleted branch 'feature'");

      const state = sim.getState();
      expect(state.branches['feature']).toBeUndefined();
    });

    it('returns error when deleting current branch', () => {
      const result = sim.deleteBranch('main');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete');
    });

    it('returns error for non-existent branch', () => {
      const result = sim.deleteBranch('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ─── checkout ────────────────────────────────────────────────────────────

  describe('checkout', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');
    });

    it('switches branches and updates working dir', () => {
      const result = sim.checkout('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain("Switched to branch 'feature'");

      const state = sim.getState();
      expect(state.HEAD).toEqual({ type: 'branch', ref: 'feature' });
    });

    it('enters detached HEAD with commit hash', () => {
      const state = sim.getState();
      const commitId = state.branches['main'].commitId;
      const shortHash = commitId.slice(0, 7);

      const result = sim.checkout(shortHash);
      expect(result.success).toBe(true);
      expect(result.output).toContain('HEAD is now at');

      const newState = sim.getState();
      expect(newState.HEAD.type).toBe('detached');
    });

    it('returns error for non-existent branch/commit', () => {
      const result = sim.checkout('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('did not match');
    });
  });

  // ─── merge ───────────────────────────────────────────────────────────────

  describe('merge', () => {
    it('performs fast-forward merge', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');
      sim.checkout('feature');
      sim.editFile('newfile.txt', 'hello');
      sim.add(['.']);
      sim.commit('feature work');
      sim.checkout('main');

      const result = sim.merge('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Fast-forward');
    });

    it('performs merge commit when branches diverged', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');
      sim.checkout('feature');
      sim.addFile('feature.txt', 'feature content');
      sim.add(['.']);
      sim.commit('feature work');
      sim.checkout('main');
      sim.addFile('main.txt', 'main content');
      sim.add(['.']);
      sim.commit('main work');

      const result = sim.merge('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Merge made by');

      const state = sim.getState();
      const mergeCommitId = state.branches['main'].commitId;
      expect(state.commits[mergeCommitId].parentIds.length).toBe(2);
    });

    it('returns error when merging non-existent branch', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      const result = sim.merge('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns already up to date when same commit', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');

      const result = sim.merge('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Already up to date');
    });
  });

  // ─── rebase ──────────────────────────────────────────────────────────────

  describe('rebase', () => {
    it('replays commits onto target', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');
      sim.checkout('feature');
      sim.addFile('feature.txt', 'content');
      sim.add(['.']);
      sim.commit('feature work');
      sim.checkout('main');
      sim.addFile('main.txt', 'main content');
      sim.add(['.']);
      sim.commit('main work');

      const result = sim.rebase('feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Successfully rebased');
    });

    it('returns error when rebasing onto itself', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      const result = sim.rebase('main');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot rebase a branch onto itself');
    });

    it('returns error for non-existent branch', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      const result = sim.rebase('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ─── log ─────────────────────────────────────────────────────────────────

  describe('log', () => {
    it('shows commit history', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.addFile('new.txt', 'hello');
      sim.add(['.']);
      sim.commit('second');

      const result = sim.log();
      expect(result.success).toBe(true);
      expect(result.output).toContain('second');
      expect(result.output).toContain('first');
    });

    it('returns no commits message when empty', () => {
      sim.init();
      const result = sim.log();
      expect(result.success).toBe(true);
      expect(result.output).toContain('No commits yet');
    });
  });

  // ─── status ──────────────────────────────────────────────────────────────

  describe('status', () => {
    it('shows correct state after init', () => {
      sim.init();
      const result = sim.status();
      expect(result.success).toBe(true);
      expect(result.output).toContain('On branch main');
      expect(result.output).toContain('Untracked files');
    });

    it('shows clean working tree after commit', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      const result = sim.status();
      expect(result.success).toBe(true);
      expect(result.output).toContain('nothing to commit, working tree clean');
    });

    it('shows staged files', () => {
      sim.init();
      sim.add(['.']);
      const result = sim.status();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Changes to be committed');
    });
  });

  // ─── diff ────────────────────────────────────────────────────────────────

  describe('diff', () => {
    it('shows differences', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.editFile('README.md', 'new content');

      const result = sim.diff();
      expect(result.success).toBe(true);
      expect(result.output).toContain('diff --git');
    });

    it('shows no differences when clean', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      const result = sim.diff();
      expect(result.success).toBe(true);
      expect(result.output).toContain('No differences found');
    });
  });

  // ─── tag ─────────────────────────────────────────────────────────────────

  describe('createTag and listTags', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
    });

    it('creates a tag', () => {
      const result = sim.createTag('v1.0');
      expect(result.success).toBe(true);
      expect(result.output).toContain("Created tag 'v1.0'");

      const state = sim.getState();
      expect(state.tags['v1.0']).toBeDefined();
    });

    it('lists tags', () => {
      sim.createTag('v1.0');
      sim.createTag('v2.0');
      const result = sim.listTags();
      expect(result.success).toBe(true);
      expect(result.output).toContain('v1.0');
      expect(result.output).toContain('v2.0');
    });

    it('returns error for duplicate tag', () => {
      sim.createTag('v1.0');
      const result = sim.createTag('v1.0');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('returns no tags when empty', () => {
      const result = sim.listTags();
      expect(result.success).toBe(true);
      expect(result.output).toContain('No tags');
    });
  });

  // ─── stash ───────────────────────────────────────────────────────────────

  describe('stash, stashPop, stashList', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
    });

    it('stashes changes', () => {
      sim.editFile('README.md', 'modified');
      const result = sim.stash();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Saved working directory');

      const state = sim.getState();
      expect(state.stash.length).toBe(1);
    });

    it('pops stashed changes', () => {
      sim.editFile('README.md', 'modified');
      sim.stash();
      const result = sim.stashPop();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Changes restored from stash');

      const state = sim.getState();
      expect(state.stash.length).toBe(0);
    });

    it('lists stash entries', () => {
      sim.editFile('README.md', 'modified');
      sim.stash();
      const result = sim.stashList();
      expect(result.success).toBe(true);
      expect(result.output).toContain('stash@{0}');
    });

    it('returns error popping empty stash', () => {
      const result = sim.stashPop();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No stash entries');
    });

    it('returns no stash entries message when empty', () => {
      const result = sim.stashList();
      expect(result.success).toBe(true);
      expect(result.output).toContain('No stash entries');
    });
  });

  // ─── reset ───────────────────────────────────────────────────────────────

  describe('reset', () => {
    beforeEach(() => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.addFile('new.txt', 'hello');
      sim.add(['.']);
      sim.commit('second');
    });

    it('resets with --hard', () => {
      const state = sim.getState();
      const firstCommitId = Object.values(state.commits).find(
        (c) => c.message === 'first'
      )!.id;

      const result = sim.reset(firstCommitId.slice(0, 7), 'hard');
      expect(result.success).toBe(true);
      expect(result.output).toContain('HEAD is now at');
    });

    it('resets with --soft', () => {
      const state = sim.getState();
      const firstCommitId = Object.values(state.commits).find(
        (c) => c.message === 'first'
      )!.id;

      const result = sim.reset(firstCommitId.slice(0, 7), 'soft');
      expect(result.success).toBe(true);
      // In soft reset, staging should keep changes
      const newState = sim.getState();
      expect(newState.staging).toEqual({});
    });

    it('resets with --mixed (default)', () => {
      const state = sim.getState();
      const firstCommitId = Object.values(state.commits).find(
        (c) => c.message === 'first'
      )!.id;

      const result = sim.reset(firstCommitId.slice(0, 7));
      expect(result.success).toBe(true);
    });

    it('returns error for invalid hash', () => {
      const result = sim.reset('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ambiguous argument');
    });
  });

  // ─── cherryPick ──────────────────────────────────────────────────────────

  describe('cherryPick', () => {
    it('applies commit', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');
      sim.checkout('feature');
      sim.addFile('feature.txt', 'feature content');
      sim.add(['.']);
      sim.commit('feature work');
      sim.checkout('main');

      const state = sim.getState();
      const featureCommitId = Object.values(state.commits).find(
        (c) => c.message === 'feature work'
      )!.id;

      const result = sim.cherryPick(featureCommitId.slice(0, 7));
      expect(result.success).toBe(true);
      expect(result.output).toContain('cherry-picked');
    });

    it('returns error for invalid hash', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      const result = sim.cherryPick('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('bad object');
    });
  });

  // ─── remote ──────────────────────────────────────────────────────────────

  describe('addRemote and listRemotes', () => {
    beforeEach(() => {
      sim.init();
    });

    it('adds a remote', () => {
      const result = sim.addRemote('origin', 'https://github.com/test/repo.git');
      expect(result.success).toBe(true);
      expect(result.output).toContain("Added remote 'origin'");

      const state = sim.getState();
      expect(state.remotes['origin']).toBeDefined();
    });

    it('lists remotes', () => {
      sim.addRemote('origin', 'https://github.com/test/repo.git');
      const result = sim.listRemotes();
      expect(result.success).toBe(true);
      expect(result.output).toContain('origin');
      expect(result.output).toContain('https://github.com/test/repo.git');
    });

    it('returns error for duplicate remote', () => {
      sim.addRemote('origin', 'https://github.com/test/repo.git');
      const result = sim.addRemote('origin', 'https://github.com/test/repo2.git');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('shows no remotes when empty', () => {
      const result = sim.listRemotes();
      expect(result.success).toBe(true);
      expect(result.output).toContain('No remotes configured');
    });
  });

  // ─── fetch ───────────────────────────────────────────────────────────────

  describe('fetch', () => {
    it('imports remote commits and branches', () => {
      sim.init();
      sim.addRemote('origin', 'https://github.com/test/repo.git');

      // Manually add a commit to the remote
      const state = sim.getState();
      const remote = state.remotes['origin'];
      const id = generateId();
      remote.commits[id] = {
        id,
        shortId: shortId(id),
        message: 'Remote commit',
        parentIds: [],
        author: 'Test <test@test>',
        timestamp: now(),
        tree: { 'README.md': 'remote content' },
        branchLabel: 'origin/main',
      };
      remote.branches['main'] = {
        name: 'main',
        commitId: id,
        color: '#06b6d4',
        isRemote: true,
        tracksRemote: 'origin',
      };
      sim.loadState(state);

      const result = sim.fetch('origin');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Imported');
    });

    it('returns error for non-existent remote', () => {
      sim.init();
      const result = sim.fetch('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not a remote');
    });
  });

  // ─── pull ────────────────────────────────────────────────────────────────

  describe('pull', () => {
    it('fetches and merges from remote', () => {
      sim.init();
      sim.addRemote('origin', 'https://github.com/test/repo.git');

      // Manually add a remote commit
      const state = sim.getState();
      const remote = state.remotes['origin'];
      const id = generateId();
      remote.commits[id] = {
        id,
        shortId: shortId(id),
        message: 'Remote commit',
        parentIds: [],
        author: 'Test <test@test>',
        timestamp: now(),
        tree: { 'README.md': 'remote content' },
        branchLabel: 'origin/main',
      };
      remote.branches['main'] = {
        name: 'main',
        commitId: id,
        color: '#06b6d4',
        isRemote: true,
        tracksRemote: 'origin',
      };
      sim.loadState(state);

      const result = sim.pull('origin', 'main');
      expect(result.success).toBe(true);
    });

    it('returns error when no remote configured', () => {
      sim.init();
      const result = sim.pull();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No remote configured');
    });
  });

  // ─── push ────────────────────────────────────────────────────────────────

  describe('push', () => {
    it('sends commits to remote', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.addRemote('origin', 'https://github.com/test/repo.git');

      const result = sim.push('origin', 'main');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Pushed');

      const state = sim.getState();
      expect(state.remotes['origin'].branches['main']).toBeDefined();
    });

    it('returns error when no remote configured', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      const result = sim.push();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No remote configured');
    });
  });

  // ─── file operations ─────────────────────────────────────────────────────

  describe('editFile, addFile, removeFile', () => {
    beforeEach(() => {
      sim.init();
    });

    it('edits a file', () => {
      const result = sim.editFile('README.md', 'new content');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Edited: README.md');

      const state = sim.getState();
      expect(state.working['README.md']).toBe('new content');
    });

    it('adds a file', () => {
      const result = sim.addFile('newfile.txt', 'hello');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Created: newfile.txt');

      const state = sim.getState();
      expect(state.working['newfile.txt']).toBe('hello');
    });

    it('removes a file', () => {
      sim.addFile('temp.txt', 'temp');
      const result = sim.removeFile('temp.txt');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Removed: temp.txt');

      const state = sim.getState();
      expect(state.working['temp.txt']).toBeUndefined();
    });

    it('returns error removing non-existent file', () => {
      const result = sim.removeFile('nonexistent.txt');
      expect(result.success).toBe(false);
      expect(result.error).toContain('did not match any files');
    });
  });

  // ─── execute (command parser & dispatcher) ───────────────────────────────

  describe('execute', () => {
    it('parses and dispatches git init', () => {
      const result = sim.execute('git init');
      expect(result.success).toBe(true);
    });

    it('handles help command', () => {
      const result = sim.execute('help');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Git Recipe Book');
    });

    it('handles clear command', () => {
      const result = sim.execute('clear');
      expect(result.success).toBe(true);
      expect(result.output).toBe('__CLEAR__');
    });

    it('returns error for empty command', () => {
      const result = sim.execute('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty command');
    });

    it('returns error for unknown command', () => {
      const result = sim.execute('git foobar');
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not a git command');
    });

    it('handles commit with -m flag', () => {
      sim.execute('git init');
      sim.execute('git add .');
      const result = sim.execute('git commit -m "Initial commit"');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Initial commit');
    });

    it('handles branch creation via execute', () => {
      sim.execute('git init');
      sim.execute('git add .');
      sim.execute('git commit -m "first"');
      const result = sim.execute('git branch feature');
      expect(result.success).toBe(true);
    });

    it('handles stash subcommands via execute', () => {
      sim.execute('git init');
      sim.execute('git add .');
      sim.execute('git commit -m "first"');
      sim.execute('git edit README.md modified');
      sim.execute('git add .');
      const stashResult = sim.execute('git stash');
      expect(stashResult.success).toBe(true);
    });

    it('handles remote add via execute', () => {
      sim.execute('git init');
      const result = sim.execute('git remote add origin https://github.com/test/repo.git');
      expect(result.success).toBe(true);
    });
  });

  // ─── showHelp ────────────────────────────────────────────────────────────

  describe('showHelp', () => {
    it('returns help text', () => {
      const result = sim.showHelp();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Available Commands');
      expect(result.output).toContain('git init');
      expect(result.output).toContain('git commit');
    });
  });

  // ─── listBranches ────────────────────────────────────────────────────────

  describe('listBranches', () => {
    it('lists branches with current marked', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      sim.createBranch('feature');

      const result = sim.listBranches();
      expect(result.success).toBe(true);
      expect(result.output).toContain('* main');
      expect(result.output).toContain('feature');
    });
  });

  // ─── fullReset ───────────────────────────────────────────────────────────

  describe('fullReset', () => {
    it('resets state completely', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');

      sim.fullReset();
      const state = sim.getState();
      expect(state.initialized).toBe(false);
      expect(Object.keys(state.commits).length).toBe(0);
    });
  });

  // ─── loadState ───────────────────────────────────────────────────────────

  describe('loadState', () => {
    it('loads a provided state', () => {
      sim.init();
      sim.add(['.']);
      sim.commit('first');
      const savedState = sim.getState();

      const sim2 = new GitSimulator();
      sim2.loadState(savedState);
      expect(sim2.getState().initialized).toBe(true);
      expect(Object.keys(sim2.getState().commits).length).toBeGreaterThan(0);
    });
  });
});
