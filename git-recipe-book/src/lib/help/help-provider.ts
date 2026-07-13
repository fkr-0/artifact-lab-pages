import type { IHelpProvider, IHelpRegistry, IHelpText, IHelpExample, IGlossaryEntry, IConceptExplanation, HelpCategory } from '../interfaces';

// ─── Help Data ───────────────────────────────────────────────────────────────

const HELP_TEXTS: IHelpText[] = [
  {
    id: 'init',
    topic: 'git init',
    title: 'Initialize a Repository',
    shortDescription: 'Create a new Git repository in the current directory.',
    longDescription: 'git init creates a new .git directory that stores all version control metadata. Think of it as opening a new cookbook where every change will be recorded. After init, you have a working directory but no commits yet — files are "untracked".',
    examples: [
      { command: 'git init', description: 'Initialize a new repo', expectedOutput: 'Initialized empty Git repository' },
      { command: 'git init my-project', description: 'Create a new repo in a subdirectory', expectedOutput: 'Initialized empty Git repository in my-project/' },
    ],
    relatedTopics: ['git add', 'git commit', 'working directory'],
    category: 'command',
    commonMistakes: ['Running git init in your home directory (creates a repo everywhere!)', 'Running git init twice in the same directory', 'Forgetting to init before other git commands'],
    proTip: 'If you accidentally init in the wrong directory, just delete the hidden .git folder to undo it.',
  },
  {
    id: 'add',
    topic: 'git add',
    title: 'Stage Files',
    shortDescription: 'Add file changes to the staging area (index).',
    longDescription: 'git add moves changes from your working directory to the staging area. The staging area is like a photo studio — you arrange exactly what you want to capture before taking the snapshot (commit). Use "git add ." to stage everything, or specify individual files.',
    examples: [
      { command: 'git add .', description: 'Stage all changes', expectedOutput: 'Staged N file(s)' },
      { command: 'git add README.md', description: 'Stage a specific file', expectedOutput: 'Staged 1 file(s)' },
      { command: 'git add src/', description: 'Stage all changes in a directory', expectedOutput: 'Staged N file(s)' },
    ],
    relatedTopics: ['git commit', 'git status', 'staging area'],
    category: 'command',
    commonMistakes: ['Adding the wrong files with "git add ."', 'Forgetting to add before committing', 'Not checking "git status" after adding'],
    proTip: 'Use "git add -p" to interactively choose which parts of a file to stage — great for splitting changes into logical commits.',
  },
  {
    id: 'commit',
    topic: 'git commit',
    title: 'Create a Commit',
    shortDescription: 'Record staged changes as a new commit snapshot.',
    longDescription: 'A commit is a permanent snapshot of your staged files. Each commit gets a unique hash ID, records the author and timestamp, and links to its parent commit — forming a chain of history. Think of it as taking a polaroid photo of your recipe collection at this exact moment.',
    examples: [
      { command: 'git commit -m "Add pasta recipe"', description: 'Commit with a message', expectedOutput: '[main abc1234] Add pasta recipe' },
      { command: 'git commit -m "Fix typo in salad recipe"', description: 'Commit a bug fix', expectedOutput: '[main def5678] Fix typo in salad recipe' },
    ],
    relatedTopics: ['git add', 'git log', 'git reset', 'commit'],
    category: 'command',
    commonMistakes: ['Writing vague commit messages like "fix" or "update"', 'Committing too many changes at once', 'Forgetting the -m flag and getting stuck in the editor'],
    proTip: 'Write commit messages in the imperative mood: "Add feature" not "Added feature". This reads naturally in git log.',
  },
  {
    id: 'status',
    topic: 'git status',
    title: 'Show Working Tree Status',
    shortDescription: 'See which files are staged, modified, or untracked.',
    longDescription: 'git status tells you the state of your working directory and staging area. It shows which files are tracked/untracked, which changes are staged for the next commit, and which are not yet staged. It also shows your current branch and whether it\'s ahead/behind a remote.',
    examples: [
      { command: 'git status', description: 'Check current status', expectedOutput: 'On branch main\nnothing to commit, working tree clean' },
      { command: 'git status -s', description: 'Short format status', expectedOutput: 'M README.md\n?? newfile.txt' },
    ],
    relatedTopics: ['git add', 'git diff', 'working directory'],
    category: 'command',
    commonMistakes: ['Not running status before committing', 'Ignoring the "untracked files" section'],
    proTip: 'Run git status frequently! It\'s your best friend for understanding what\'s happening in your repo.',
  },
  {
    id: 'branch',
    topic: 'git branch',
    title: 'List, Create, or Delete Branches',
    shortDescription: 'Manage branches — parallel lines of development.',
    longDescription: 'A branch is a movable pointer to a commit. Creating a branch doesn\'t copy files — it just creates a new label that you can move to independently. The current branch is marked with *. Use -d to delete a branch.',
    examples: [
      { command: 'git branch desserts', description: 'Create a new branch' },
      { command: 'git branch', description: 'List all branches' },
      { command: 'git branch -d desserts', description: 'Delete a branch' },
      { command: 'git branch -r', description: 'List remote branches', expectedOutput: 'origin/main\norigin/feature' },
    ],
    relatedTopics: ['git checkout', 'git merge', 'branch'],
    category: 'command',
    commonMistakes: ['Creating a branch but forgetting to switch to it', 'Deleting a branch with unmerged changes', 'Not naming branches descriptively'],
    proTip: 'Use descriptive branch names like "feature/add-desserts" or "fix/typo-in-salad" to keep your repo organized.',
  },
  {
    id: 'checkout',
    topic: 'git checkout',
    title: 'Switch Branches or Restore Files',
    shortDescription: 'Switch to a different branch or restore working tree files.',
    longDescription: 'git checkout switches your working directory to match a different branch. Your current branch\'s commits are safe — they stay on that branch. You can also checkout a specific commit by hash to enter "detached HEAD" state.',
    examples: [
      { command: 'git checkout desserts', description: 'Switch to the desserts branch' },
      { command: 'git checkout main', description: 'Switch back to main' },
      { command: 'git switch desserts', description: 'Modern alternative to checkout' },
      { command: 'git checkout abc1234', description: 'Checkout a specific commit (detached HEAD)', expectedOutput: 'HEAD is now at abc1234' },
    ],
    relatedTopics: ['git branch', 'git switch', 'HEAD'],
    category: 'command',
    commonMistakes: ['Checking out with uncommitted changes (can cause conflicts)', 'Confusing checkout with reset', 'Forgetting you\'re in detached HEAD mode'],
    proTip: 'Prefer "git switch" for changing branches and "git restore" for undoing file changes — these are the modern, safer alternatives.',
  },
  {
    id: 'switch',
    topic: 'git switch',
    title: 'Switch Branches (Modern)',
    shortDescription: 'Modern alternative to git checkout for switching branches.',
    longDescription: 'git switch is the modern replacement for git checkout when switching branches. It\'s more focused and less confusing — checkout does too many things. Use switch for branches, restore for files.',
    examples: [
      { command: 'git switch desserts', description: 'Switch to the desserts branch' },
      { command: 'git switch -c new-feature', description: 'Create and switch to a new branch', expectedOutput: "Switched to a new branch 'new-feature'" },
    ],
    relatedTopics: ['git checkout', 'git branch', 'git restore'],
    category: 'command',
    commonMistakes: ['Trying to use switch with commit hashes (use checkout for that)', 'Confusing switch with restore'],
    proTip: 'Use "git switch -c" to create and switch in one step — much faster than branch + checkout separately.',
  },
  {
    id: 'merge',
    topic: 'git merge',
    title: 'Merge Branches',
    shortDescription: 'Combine changes from one branch into another.',
    longDescription: 'git merge integrates changes from one branch into your current branch. If the branches diverged, Git creates a "merge commit" with two parents — preserving the full history. If one branch is simply behind the other, Git performs a "fast-forward" — just moving the pointer.',
    examples: [
      { command: 'git merge desserts', description: 'Merge desserts into current branch' },
      { command: 'git merge --no-ff feature', description: 'Force a merge commit even if fast-forward is possible', expectedOutput: 'Merge made by the ort strategy' },
    ],
    relatedTopics: ['git rebase', 'git branch', 'merge commit'],
    category: 'command',
    commonMistakes: ['Merging into the wrong branch (always check your current branch first!)', 'Not resolving conflicts properly', 'Merging too many times creating spaghetti history'],
    proTip: 'Use --no-ff to always create a merge commit. This preserves the branch topology and makes it easier to revert the merge later.',
  },
  {
    id: 'rebase',
    topic: 'git rebase',
    title: 'Rebase Commits',
    shortDescription: 'Replay commits onto a new base for a linear history.',
    longDescription: 'Unlike merge, rebase doesn\'t create a merge commit. It takes your branch\'s commits and "replays" them on top of the target branch, creating new commits with the same changes but new IDs. This results in a clean, linear history — but rewrites history, so never rebase shared branches!',
    examples: [
      { command: 'git rebase main', description: 'Rebase current branch onto main' },
      { command: 'git rebase --continue', description: 'Continue rebase after resolving a conflict' },
    ],
    relatedTopics: ['git merge', 'git log', 'history rewriting'],
    category: 'command',
    commonMistakes: ['Rebasing commits that have already been pushed (rewrites shared history!)', 'Getting confused during conflict resolution in a rebase', 'Not understanding that rebase creates NEW commits with different hashes'],
    proTip: 'The golden rule: Never rebase public/shared branches. Only rebase your own local feature branches.',
  },
  {
    id: 'remote',
    topic: 'git remote',
    title: 'Manage Remotes',
    shortDescription: 'Add, list, or remove remote repositories.',
    longDescription: 'A remote is a bookmark pointing to another copy of the repository — usually on a server like GitHub. "origin" is the default name for the remote you cloned from. You can add multiple remotes for different upstream sources.',
    examples: [
      { command: 'git remote add origin https://github.com/user/repo.git', description: 'Add a remote named origin' },
      { command: 'git remote -v', description: 'List remotes with URLs' },
      { command: 'git remote remove origin', description: 'Remove the origin remote', expectedOutput: '' },
    ],
    relatedTopics: ['git fetch', 'git pull', 'git push', 'remote'],
    category: 'command',
    commonMistakes: ['Using the wrong URL when adding a remote', 'Forgetting to add a remote before trying to push', 'Confusing remote names with branch names'],
    proTip: 'You can have multiple remotes! Use "upstream" for the original project and "origin" for your fork.',
  },
  {
    id: 'remote-remove',
    topic: 'git remote remove',
    title: 'Remove a Remote',
    shortDescription: 'Delete a remote connection from your repository.',
    longDescription: 'Removes the specified remote and all its remote-tracking branches. This doesn\'t affect your local branches or commits — it just removes the bookmark to the other repository.',
    examples: [
      { command: 'git remote remove origin', description: 'Remove the origin remote' },
      { command: 'git remote rm upstream', description: 'Remove the upstream remote (shorthand)' },
    ],
    relatedTopics: ['git remote', 'git remote add'],
    category: 'command',
    commonMistakes: ['Removing a remote when you still need to push to it', 'Confusing remote removal with branch deletion'],
    proTip: 'If you need to change a remote URL, use "git remote set-url" instead of removing and re-adding.',
  },
  {
    id: 'fetch',
    topic: 'git fetch',
    title: 'Fetch from Remote',
    shortDescription: 'Download objects and refs from a remote without merging.',
    longDescription: 'git fetch downloads new commits, branches, and tags from a remote repository, but does NOT change your working directory or local branches. It only updates "remote-tracking branches" (e.g., origin/main). This is safe — you can inspect what changed before merging. Think of it as checking your mailbox: you see what mail arrived, but don\'t open it yet.',
    examples: [
      { command: 'git fetch origin', description: 'Fetch all changes from origin' },
      { command: 'git fetch --all', description: 'Fetch from all remotes' },
    ],
    relatedTopics: ['git pull', 'git merge', 'git remote', 'remote-tracking branch'],
    category: 'command',
    commonMistakes: ['Confusing fetch with pull (fetch doesn\'t change your files!)', 'Forgetting to fetch before checking remote-tracking branches'],
    proTip: 'Run "git fetch" regularly to stay aware of remote changes without risking conflicts in your working directory.',
  },
  {
    id: 'pull',
    topic: 'git pull',
    title: 'Pull from Remote',
    shortDescription: 'Fetch and merge from a remote repository.',
    longDescription: 'git pull = git fetch + git merge. It downloads changes from the remote and immediately merges them into your current branch. If there are conflicts, you\'ll need to resolve them. Pull is convenient but can create unexpected merge commits. For more control, use fetch + merge separately.',
    examples: [
      { command: 'git pull origin main', description: 'Pull and merge from origin/main' },
      { command: 'git pull', description: 'Pull from the default remote/branch' },
      { command: 'git pull --rebase', description: 'Pull with rebase instead of merge' },
    ],
    relatedTopics: ['git fetch', 'git merge', 'git push'],
    category: 'command',
    commonMistakes: ['Pulling with uncommitted changes (can cause conflicts)', 'Always using pull instead of fetch + merge', 'Not resolving merge conflicts after pulling'],
    proTip: 'Use "git pull --rebase" to avoid creating merge commits when pulling. This replays your local commits on top of the remote changes.',
  },
  {
    id: 'push',
    topic: 'git push',
    title: 'Push to Remote',
    shortDescription: 'Upload local commits to a remote repository.',
    longDescription: 'git push sends your local commits to a remote repository, updating the remote branch. If someone else has pushed since you last fetched, Git will reject your push — you need to pull first. Push also sets up "tracking" so future pulls know where to get updates. Think of it as publishing your latest recipes to the shared cookbook.',
    examples: [
      { command: 'git push origin main', description: 'Push main to origin' },
      { command: 'git push', description: 'Push to the tracked remote' },
      { command: 'git push -u origin feature', description: 'Push and set upstream tracking' },
    ],
    relatedTopics: ['git fetch', 'git pull', 'git remote'],
    category: 'command',
    commonMistakes: ['Pushing without pulling first (rejected push)', 'Force pushing to shared branches (overwrites others\' work!)', 'Forgetting the -u flag when pushing a new branch'],
    proTip: 'Always use "git push -u origin branch-name" the first time you push a new branch. This sets up tracking so future pushes/pulls work without arguments.',
  },
  {
    id: 'stash',
    topic: 'git stash',
    title: 'Stash Changes',
    shortDescription: 'Temporarily save uncommitted changes.',
    longDescription: 'git stash saves your modified tracked files and staged changes, then reverts to a clean working directory. Use "git stash pop" to restore them. Great for when you need to switch tasks quickly but aren\'t ready to commit.',
    examples: [
      { command: 'git stash', description: 'Stash current changes' },
      { command: 'git stash pop', description: 'Restore the last stash' },
      { command: 'git stash list', description: 'List all stashes' },
      { command: 'git stash -m "Work in progress on desserts"', description: 'Stash with a description' },
    ],
    relatedTopics: ['git commit', 'git checkout'],
    category: 'command',
    commonMistakes: ['Stashing and forgetting about it (stashes can pile up!)', 'Losing untracked files by not using -u flag', 'Popping a stash that conflicts with current changes'],
    proTip: 'Use "git stash push -m \'description\'" to label your stashes so you can find them later.',
  },
  {
    id: 'tag',
    topic: 'git tag',
    title: 'Create Tags',
    shortDescription: 'Mark important commits with named labels.',
    longDescription: 'Tags are permanent bookmarks pointing to specific commits. Unlike branches, they don\'t move when you make new commits. Commonly used for version numbers (v1.0, v2.1). Use -a for annotated tags with a message.',
    examples: [
      { command: 'git tag v1.0', description: 'Create a lightweight tag' },
      { command: 'git tag', description: 'List all tags' },
      { command: 'git tag -a v2.0 -m "Version 2.0 release"', description: 'Create an annotated tag' },
    ],
    relatedTopics: ['git log', 'git commit'],
    category: 'command',
    commonMistakes: ['Forgetting to push tags (they\'re not included in git push by default)', 'Using inconsistent tag naming conventions'],
    proTip: 'Push tags with "git push --tags" or "git push origin v1.0" to share them with others.',
  },
  {
    id: 'reset',
    topic: 'git reset',
    title: 'Reset HEAD',
    shortDescription: 'Move the branch pointer to a previous commit.',
    longDescription: 'git reset moves the current branch pointer to a previous commit. --soft keeps your changes staged, --mixed (default) unstages them, and --hard discards them entirely. Use with caution — --hard is destructive!',
    examples: [
      { command: 'git reset HEAD~1', description: 'Undo last commit, keep changes unstaged' },
      { command: 'git reset --hard HEAD~1', description: 'Undo last commit, discard changes' },
      { command: 'git reset --soft HEAD~1', description: 'Undo last commit, keep changes staged' },
    ],
    relatedTopics: ['git commit', 'git checkout', 'history rewriting'],
    category: 'command',
    commonMistakes: ['Using --hard when you mean --soft (losing work!)', 'Resetting commits that have already been pushed', 'Confusing reset with revert'],
    proTip: 'Use "git reset --soft HEAD~1" to undo your last commit but keep the changes staged — perfect for fixing a commit message.',
  },
  {
    id: 'cherry-pick',
    topic: 'git cherry-pick',
    title: 'Cherry-Pick Commits',
    shortDescription: 'Apply a specific commit from one branch onto another.',
    longDescription: 'Cherry-pick lets you grab just one commit from anywhere and apply it to your current branch. Like picking one recipe from another cookbook and adding it to yours. The commit gets a new hash since it\'s a new commit with the same changes.',
    examples: [
      { command: 'git cherry-pick abc1234', description: 'Apply commit abc1234 to current branch' },
      { command: 'git cherry-pick abc1234 def5678', description: 'Cherry-pick multiple commits' },
    ],
    relatedTopics: ['git rebase', 'git merge'],
    category: 'command',
    commonMistakes: ['Cherry-picking a merge commit', 'Forgetting that cherry-pick creates a NEW commit with a different hash', 'Cherry-picking out of order (dependencies matter!)'],
    proTip: 'Cherry-pick is great for backporting bug fixes to release branches without merging the entire feature branch.',
  },
  {
    id: 'log-oneline',
    topic: 'git log --oneline',
    title: 'Compact Log View',
    shortDescription: 'Show commit history in a compact one-line format.',
    longDescription: 'The --oneline flag condenses each commit to a single line showing just the short hash and message. Perfect for getting a quick overview of history without the full details.',
    examples: [
      { command: 'git log --oneline', description: 'Show compact log', expectedOutput: 'abc1234 Initial commit\ndef5678 Add feature' },
      { command: 'git log --oneline -5', description: 'Show last 5 commits in compact form' },
      { command: 'git log --oneline --graph', description: 'Show compact log with branch graph' },
    ],
    relatedTopics: ['git log', 'git branch'],
    category: 'command',
    commonMistakes: ['Using --oneline when you need detailed commit info', 'Not combining with --graph for branch visualization'],
    proTip: 'Combine --oneline --graph --all for a beautiful ASCII representation of your entire branch structure.',
  },
  {
    id: 'diff-staged',
    topic: 'git diff --staged',
    title: 'Show Staged Changes',
    shortDescription: 'Show the differences between the staging area and the last commit.',
    longDescription: 'While "git diff" shows unstaged changes (working dir vs staging), "git diff --staged" shows what\'s staged and ready to be committed. Use it to review your changes before committing.',
    examples: [
      { command: 'git diff --staged', description: 'Show all staged changes', expectedOutput: 'diff --git a/README.md b/README.md\n+new line' },
      { command: 'git diff --staged README.md', description: 'Show staged changes for a specific file' },
    ],
    relatedTopics: ['git diff', 'git add', 'git status'],
    category: 'command',
    commonMistakes: ['Confusing git diff with git diff --staged', 'Not reviewing staged changes before committing'],
    proTip: 'Always run "git diff --staged" before committing to make sure you\'re committing exactly what you intend.',
  },
  {
    id: 'branch-r',
    topic: 'git branch -r',
    title: 'List Remote Branches',
    shortDescription: 'Show branches that exist on the remote repository.',
    longDescription: 'Lists all remote-tracking branches. These are local mirrors of branches on the remote, updated when you fetch. They appear as "origin/main", "origin/feature", etc. You can\'t commit directly to these — checkout a local branch instead.',
    examples: [
      { command: 'git branch -r', description: 'List all remote branches', expectedOutput: 'origin/main\norigin/feature' },
      { command: 'git branch -a', description: 'List both local and remote branches' },
    ],
    relatedTopics: ['git branch', 'git fetch', 'git remote'],
    category: 'command',
    commonMistakes: ['Trying to checkout a remote-tracking branch directly (checkout the local version instead)', 'Not fetching before checking remote branches (may show stale info)'],
    proTip: 'Use "git branch -a" to see the complete picture — all local and remote branches together.',
  },
];

const GLOSSARY: IGlossaryEntry[] = [
  { term: 'Repository', shortDefinition: 'A database storing all commits and refs for a project.', longDefinition: 'Contains the .git directory with all version history, branches, tags, and configuration.', seeAlso: ['git init', 'Working Directory'], category: 'glossary' },
  { term: 'Working Directory', shortDefinition: 'The files on your filesystem that you can edit.', longDefinition: 'Also called the "working tree". This is where you make changes to files before staging them.', seeAlso: ['Staging Area', 'git status'], category: 'glossary' },
  { term: 'Working Tree', shortDefinition: 'Another name for the working directory — your local files.', longDefinition: 'The working tree is the set of files you can see and edit. It represents the state of your project at a specific commit (plus any local modifications).', seeAlso: ['Working Directory', 'git status'], category: 'glossary' },
  { term: 'Staging Area', shortDefinition: 'A intermediate zone between working directory and repository.', longDefinition: 'Also called the "index". This is where you arrange changes before committing them. Like a photo studio where you set up the shot.', seeAlso: ['git add', 'git commit'], category: 'glossary' },
  { term: 'Index', shortDefinition: 'Another name for the staging area.', longDefinition: 'The index is a binary file that stores a snapshot of the working tree content. When you "git add", you update the index. When you "git commit", Git creates a tree object from the index.', seeAlso: ['Staging Area', 'git add'], category: 'glossary' },
  { term: 'Commit', shortDefinition: 'A snapshot of your staged changes, with metadata.', longDefinition: 'Each commit has a unique hash, author, timestamp, message, and points to its parent(s). Commits form a directed acyclic graph (DAG).', seeAlso: ['git commit', 'git log'], category: 'glossary' },
  { term: 'Branch', shortDefinition: 'A movable pointer to a commit.', longDefinition: 'Branches are cheap labels. Creating a branch just adds a new pointer — no file copying. The current branch is indicated by HEAD.', seeAlso: ['git branch', 'git checkout', 'HEAD'], category: 'glossary' },
  { term: 'HEAD', shortDefinition: 'A pointer to the current commit your working directory is based on.', longDefinition: 'Usually points to a branch name (which points to a commit). In "detached HEAD" state, it points directly to a commit hash.', seeAlso: ['git checkout', 'Branch', 'Detached HEAD'], category: 'glossary' },
  { term: 'Detached HEAD', shortDefinition: 'When HEAD points directly to a commit instead of a branch.', longDefinition: 'In detached HEAD state, you\'re viewing a specific commit, not a branch. Any new commits you make won\'t belong to any branch and may be lost. It\'s useful for inspecting old code, but you should create a branch if you want to make changes.', seeAlso: ['HEAD', 'git checkout'], category: 'glossary' },
  { term: 'Merge Commit', shortDefinition: 'A commit with two or more parents.', longDefinition: 'Created when merging diverged branches. The merge commit combines the histories of both branches, creating a diamond shape in the git graph.', seeAlso: ['git merge', 'Fast-forward merge'], category: 'glossary' },
  { term: 'Fast-forward', shortDefinition: 'A merge where the branch pointer simply moves forward.', longDefinition: 'Happens when the current branch has no new commits since it diverged. Git just moves the pointer — no merge commit needed.', seeAlso: ['git merge', 'Fast-forward merge'], category: 'glossary' },
  { term: 'Fast-forward merge', shortDefinition: 'A merge that just moves the branch pointer without creating a merge commit.', longDefinition: 'When the target branch is a direct ancestor of the source branch, Git can simply advance the pointer. This produces a clean, linear history. Use --no-ff to force a merge commit even when fast-forward is possible.', seeAlso: ['git merge', 'Fast-forward'], category: 'glossary' },
  { term: 'DAG', shortDefinition: 'Directed Acyclic Graph — the mathematical structure of Git history.', longDefinition: 'Git\'s commit history forms a DAG: each commit points to its parent(s), edges go in one direction (back in time), and there are no cycles. This structure allows efficient traversal and merging.', seeAlso: ['Commit', 'Branch'], category: 'glossary' },
  { term: 'Remote', shortDefinition: 'A bookmark pointing to another copy of the repository.', longDefinition: 'Usually on a server like GitHub. "origin" is the default remote name. Remotes enable collaboration by sharing commits.', seeAlso: ['git remote', 'git fetch', 'git push'], category: 'glossary' },
  { term: 'Remote-tracking Branch', shortDefinition: 'A local ref that mirrors a branch on a remote.', longDefinition: 'Shown as "origin/main". Updated by git fetch. These branches are read-only — you can\'t commit to them directly. They represent the last known state of the remote branch.', seeAlso: ['git fetch', 'git pull', 'Tracking Branch'], category: 'glossary' },
  { term: 'Tracking Branch', shortDefinition: 'A local branch that automatically knows its remote counterpart.', longDefinition: 'When you clone or checkout a remote branch, Git sets up tracking. This allows "git pull" and "git push" without specifying the remote and branch each time. Use -u flag to set up tracking manually.', seeAlso: ['git pull', 'git push', 'Remote-tracking Branch'], category: 'glossary' },
  { term: 'Rebase', shortDefinition: 'Replay commits onto a new base commit.', longDefinition: 'Creates new commits with the same changes but different hashes. Results in linear history but rewrites history. Never rebase commits that have been pushed!', seeAlso: ['git rebase', 'git merge'], category: 'glossary' },
];

const CONCEPTS: IConceptExplanation[] = [
  {
    id: 'three-states',
    title: 'The Three States',
    analogy: 'Think of Git as a kitchen: your Working Directory is the counter where you prep, the Staging Area is the photo studio where you arrange the shot, and the Repository is the photo album where snapshots are permanently stored.',
    technical: 'Git tracks files in three states: modified (changed but not staged), staged (marked for the next commit), and committed (safely stored in the .git database). This three-stage workflow gives you fine-grained control over what goes into each commit.',
    graphEffect: 'Only committed files appear in the graph. Staged and modified files exist only in the terminal status output until committed.',
    pitfalls: ['Forgetting to "git add" before committing', 'Confusing staging with committing', 'Using "git add ." when you only want specific files'],
    relatedConcepts: ['working-directory', 'staging-area', 'repository'],
  },
  {
    id: 'branching-model',
    title: 'Branching Model',
    analogy: 'A branch is like starting a new chapter in your cookbook. You can experiment with new recipes without messing up the main chapter. When you\'re happy, you merge the chapter back in.',
    technical: 'A branch is simply a pointer (41-byte file) to a commit. Creating a branch is O(1) — nearly instant. The branch pointer moves forward with each new commit. Multiple branches share all commits reachable from their common ancestor.',
    graphEffect: 'Branches appear as parallel vertical lanes. When you commit on a branch, only that branch\'s pointer moves. The other branch stays where it was, creating a visible fork in the graph.',
    pitfalls: ['Forgetting which branch you\'re on', 'Creating too many stale branches', 'Not merging branches back regularly'],
    relatedConcepts: ['merge', 'rebase', 'checkout'],
  },
  {
    id: 'merge-vs-rebase',
    title: 'Merge vs Rebase',
    analogy: 'Merge is like weaving two recipe collections together — you keep both histories visible. Rebase is like rewriting your recipes to come after the latest edition — it looks like you wrote them after the other person\'s changes.',
    technical: 'Merge creates a new commit with two parents, preserving the branch topology. Rebase replays commits on top of a new base, creating new commits with the same diffs. Merge preserves exact history; rebase creates a cleaner, linear history.',
    graphEffect: 'Merge creates a diamond shape (two lines converge). Rebase creates a straight line — the original branch commits are replaced by new ones at the tip of the target.',
    pitfalls: ['Never rebase commits that have been pushed and shared', 'Rebase loses the original commit hashes', 'Merge can create confusing "spaghetti" history if overused'],
    relatedConcepts: ['branching-model', 'fast-forward'],
  },
  {
    id: 'remote-workflow',
    title: 'Remote Workflow',
    analogy: 'A remote is like a shared cookbook on the kitchen shelf that everyone can see. You fetch to check what others have added, pull to copy their recipes to your desk, and push to publish your new recipes to the shared shelf.',
    technical: 'Remote operations involve syncing commits between repositories. Fetch updates remote-tracking branches without modifying your working directory. Pull = fetch + merge. Push sends your commits and updates the remote branch. Git rejects pushes if the remote has newer commits.',
    graphEffect: 'Remote-tracking branches (origin/main) appear as separate nodes in the graph, colored differently (cyan). They move only when you fetch or pull. Local branches can be ahead, behind, or diverged from their remote counterpart.',
    pitfalls: ['Pushing without pulling first (rejected push)', 'Confusing fetch and pull', 'Force pushing and losing others\' commits'],
    relatedConcepts: ['three-states', 'tracking-branch', 'merge'],
  },
  {
    id: 'commit-hash',
    title: 'Commit Hashes',
    analogy: 'A commit hash is like a unique serial number stamped on each polaroid photo in your collection. No two photos have the same number, and you can always find a specific photo by its number.',
    technical: 'Each commit is identified by a SHA-1 hash (40 hex characters). This hash is computed from the commit\'s content, parent IDs, author, timestamp, and message. Even a tiny change produces a completely different hash. Short hashes (first 7 chars) are usually unique within a repo.',
    graphEffect: 'Each node in the graph shows the short hash (7 chars). Click a node to see the full commit details. The hash is your way to reference specific commits in commands like checkout, cherry-pick, and reset.',
    pitfalls: ['Using short hashes that are ambiguous (very rare)', 'Confusing commit hash with branch name', 'Expecting hashes to be sequential — they\'re not!'],
    relatedConcepts: ['three-states', 'branching-model'],
  },
  {
    id: 'detached-head',
    title: 'Detached HEAD State',
    analogy: 'Detached HEAD is like browsing a library without checking out a book — you can read any page, but if you start writing notes, they won\'t go into any book unless you create one.',
    technical: 'Normally HEAD points to a branch name, which points to a commit. In detached HEAD, HEAD points directly to a commit hash. Any commits you make will move HEAD but won\'t update any branch pointer. These commits can be lost if you switch away without creating a branch.',
    graphEffect: 'The graph shows "(HEAD detached)" label. If you make commits, they appear as a new chain from that point, but no branch label moves forward with them.',
    pitfalls: ['Making commits in detached HEAD and losing them when switching branches', 'Not understanding why "nothing happened" after committing', 'Panicking when seeing the detached HEAD message'],
    relatedConcepts: ['branching-model', 'commit-hash'],
  },
  {
    id: 'remote-tracking-branch',
    title: 'Remote-Tracking Branches',
    analogy: 'A remote-tracking branch is like a photo of the shared cookbook taken the last time you looked at it. It\'s not the real book — just a snapshot. You update the snapshot by fetching.',
    technical: 'Remote-tracking branches (e.g., origin/main) are read-only local refs that mirror the state of branches on the remote. They\'re updated only by git fetch. You can\'t commit to them directly — you checkout a local branch that tracks them instead.',
    graphEffect: 'Remote-tracking branches appear in the graph with a different color (cyan) and a prefix (origin/). They show where the remote branch was at the time of the last fetch, which may differ from your local branch.',
    pitfalls: ['Trying to commit on a remote-tracking branch directly', 'Thinking the remote-tracking branch is always up-to-date (it\'s only as fresh as your last fetch)', 'Confusing remote-tracking branches with local tracking branches'],
    relatedConcepts: ['remote-workflow', 'branching-model'],
  },
];

// ─── Help Provider Implementation ────────────────────────────────────────────

export class HelpProvider implements IHelpRegistry {
  private helpTexts: Map<string, IHelpText> = new Map();
  private glossary: Map<string, IGlossaryEntry> = new Map();
  private concepts: Map<string, IConceptExplanation> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load built-in data
    for (const ht of HELP_TEXTS) this.helpTexts.set(ht.id, ht);
    for (const g of GLOSSARY) this.glossary.set(g.term.toLowerCase(), g);
    for (const c of CONCEPTS) this.concepts.set(c.id, c);
  }

  getHelp(topic: string): IHelpText | undefined {
    const normalized = topic.toLowerCase().replace(/^git\s+/, '');
    for (const ht of this.helpTexts.values()) {
      if (ht.topic.toLowerCase() === topic.toLowerCase() || ht.topic.toLowerCase() === `git ${normalized}`) {
        return ht;
      }
    }
    return undefined;
  }

  searchHelp(query: string): IHelpText[] {
    const q = query.toLowerCase();
    return Array.from(this.helpTexts.values()).filter(
      (ht) =>
        ht.title.toLowerCase().includes(q) ||
        ht.shortDescription.toLowerCase().includes(q) ||
        ht.topic.toLowerCase().includes(q)
    );
  }

  getHelpByCategory(category: HelpCategory): IHelpText[] {
    return Array.from(this.helpTexts.values()).filter((ht) => ht.category === category);
  }

  getGlossary(): IGlossaryEntry[] {
    return Array.from(this.glossary.values());
  }

  getConcept(id: string): IConceptExplanation | undefined {
    return this.concepts.get(id);
  }

  getAllConcepts(): IConceptExplanation[] {
    return Array.from(this.concepts.values());
  }

  formatHelpText(topic: string): string {
    const help = this.getHelp(topic);
    if (!help) return `No help available for '${topic}'`;

    const lines: string[] = [
      `📖 ${help.title}`,
      '─'.repeat(help.title.length + 3),
      '',
      help.longDescription,
      '',
    ];

    if (help.examples.length > 0) {
      lines.push('📝 Examples:');
      for (const ex of help.examples) {
        lines.push(`  $ ${ex.command}`);
        lines.push(`  ${ex.description}`);
        if (ex.expectedOutput) lines.push(`  → ${ex.expectedOutput}`);
        lines.push('');
      }
    }

    if (help.commonMistakes && help.commonMistakes.length > 0) {
      lines.push('⚠️ Common Mistakes:');
      for (const mistake of help.commonMistakes) {
        lines.push(`  • ${mistake}`);
      }
      lines.push('');
    }

    if (help.proTip) {
      lines.push(`💡 Pro Tip: ${help.proTip}`);
      lines.push('');
    }

    if (help.relatedTopics.length > 0) {
      lines.push(`🔗 Related: ${help.relatedTopics.join(', ')}`);
    }

    return lines.join('\n');
  }

  formatHelpListing(): string {
    const commands = Array.from(this.helpTexts.values())
      .filter((ht) => ht.category === 'command')
      .sort((a, b) => a.topic.localeCompare(b.topic));

    const lines: string[] = ['📖 Git Command Reference', '═'.repeat(30), ''];

    for (const cmd of commands) {
      lines.push(`  ${cmd.topic.padEnd(35)} ${cmd.shortDescription}`);
    }

    return lines.join('\n') + '\n';
  }

  // ─── Registry Methods ─────────────────────────────────────────────────────

  registerHelpText(helpText: IHelpText): void {
    this.helpTexts.set(helpText.id, helpText);
    this.notifyListeners();
  }

  registerGlossaryEntry(entry: IGlossaryEntry): void {
    this.glossary.set(entry.term.toLowerCase(), entry);
  }

  registerConcept(concept: IConceptExplanation): void {
    this.concepts.set(concept.id, concept);
  }

  unregisterHelpText(id: string): void {
    this.helpTexts.delete(id);
    this.notifyListeners();
  }

  private notifyListeners() {
    for (const cb of this.listeners) cb();
  }

  onLessonsChange(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
