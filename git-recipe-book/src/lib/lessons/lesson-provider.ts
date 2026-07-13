import type {
  ILessonProvider,
  ILessonRegistry,
  ILesson,
  ILessonStep,
  ILessonToolIntroduction,
  ILessonCategory,
  LessonCategory,
  IRemoteSetup,
} from '../interfaces';


// ─── Beginner Pedagogy Enrichment ────────────────────────────────────────────

type CommandPedagogy = {
  meaning: string;
  usedHere: string;
  pitfall?: string;
  outcome: string;
  checkpoint: string;
  safetyNote?: string;
};

const GIT_TOOL_INTRO: ILessonToolIntroduction = {
  term: 'git',
  meaning: 'Runs the Git version-control tool: the program that records, compares, and shares project history.',
  usedHere: 'Git is the first word in every command because it selects the tool before you choose an action.',
  beginnerPitfall: 'Git only acts inside the repository you are currently in, so the current folder matters.',
};

const COMMAND_PEDAGOGY: Record<string, CommandPedagogy> = {
  init: {
    meaning: 'Creates a new repository database in the current folder.',
    usedHere: 'Use it once at the start of a project so Git can begin tracking history.',
    pitfall: 'Run it in the project folder, not in your home directory by accident.',
    outcome: 'Creates the hidden .git directory. The visible files do not change yet, but Git now has a place to store history.',
    checkpoint: 'Can you point to which folder became the repository?',
  },
  status: {
    meaning: 'Shows the current state of the working tree and staging area.',
    usedHere: 'Use it before and after each important command to orient yourself.',
    outcome: 'Prints whether files are untracked, modified, staged, clean, ahead, or behind.',
    checkpoint: 'Which files are waiting on the counter, and which files are already staged?',
  },
  add: {
    meaning: 'Copies chosen changes into the staging area for the next commit.',
    usedHere: 'Use it to decide what belongs in the next snapshot.',
    pitfall: 'git add . stages everything under the current folder; use file names when you need a smaller snapshot.',
    outcome: 'Selected changes move from working-directory changes into the staged set shown by git status.',
    checkpoint: 'Did you stage exactly the recipe changes you want in the next snapshot?',
  },
  commit: {
    meaning: 'Records the staged changes as a named snapshot in history.',
    usedHere: 'Use it after staging to create a recoverable point with a message.',
    pitfall: 'Commit only records staged changes, not every file you edited.',
    outcome: 'Creates a new commit with a message, hash, parent link, author, and timestamp.',
    checkpoint: 'Does the message explain the reason for this snapshot?',
  },
  log: {
    meaning: 'Lists commits so you can read project history.',
    usedHere: 'Use it to inspect what happened before and where branches point.',
    outcome: 'Displays commit hashes, authors, dates, and messages in newest-first order.',
    checkpoint: 'Which commit is the newest, and what changed there?',
  },
  branch: {
    meaning: 'Creates or lists movable names that point to commits.',
    usedHere: 'Use branches to keep a line of work separate from main.',
    outcome: 'Creates a branch name or lists branch names; no file copy is made.',
    checkpoint: 'Which branch name points at the work you want to continue?',
  },
  checkout: {
    meaning: 'Moves HEAD to another branch or commit and updates your working files.',
    usedHere: 'Use it to switch the visible project state to another line of work.',
    pitfall: 'Uncommitted changes can block or travel with a checkout; check status first.',
    outcome: 'HEAD points somewhere else and the working directory changes to match.',
    checkpoint: 'Which branch is HEAD attached to now?',
  },
  switch: {
    meaning: 'Switches branches with a command focused on branch movement.',
    usedHere: 'Use it as the modern clearer alternative to checkout for branch switching.',
    pitfall: 'Uncommitted changes can still block switching; check status first.',
    outcome: 'HEAD points to the selected branch and files update to that branch.',
    checkpoint: 'What branch name is active after the switch?',
  },
  merge: {
    meaning: 'Combines another branch into the current branch.',
    usedHere: 'Use it when you want to integrate completed work while preserving both histories.',
    pitfall: 'Merge into the branch that should receive the changes, usually main.',
    outcome: 'Moves the current branch forward or creates a merge commit when histories diverged.',
    checkpoint: 'Which two lines of history did you join?',
  },
  rebase: {
    meaning: 'Replays commits onto a different base commit.',
    usedHere: 'Use it to make a feature branch read as if it started from the latest main.',
    pitfall: 'Rebase rewrites commit IDs; avoid rebasing shared public commits unless your team agrees.',
    outcome: 'Creates replacement commits with new hashes on top of the target branch.',
    checkpoint: 'Which commits were replayed, and what is their new base?',
    safetyNote: 'Rebase rewrites history. Practice here first; on real projects, do not rebase commits other people already pulled unless coordinated.',
  },
  remote: {
    meaning: 'Manages named links to other repository copies.',
    usedHere: 'Use it to connect your local repository to a shared server location.',
    outcome: 'Adds or lists remote names such as origin and their URLs.',
    checkpoint: 'What does the remote name point to?',
  },
  fetch: {
    meaning: 'Downloads remote commits and branch positions without touching your working files.',
    usedHere: 'Use it before integrating so you can inspect what changed remotely.',
    outcome: 'Updates remote-tracking names like origin/main while your local branch stays put.',
    checkpoint: 'What changed on origin/main, and what stayed untouched locally?',
  },
  pull: {
    meaning: 'Downloads and integrates remote changes into the current branch.',
    usedHere: 'Use it when you are ready to bring remote work into your local branch.',
    pitfall: 'Pull is fetch plus integration; fetch first when you want a safer preview.',
    outcome: 'Your current branch receives remote commits through merge or configured rebase.',
    checkpoint: 'Did your branch become up to date, or did Git ask for conflict resolution?',
  },
  push: {
    meaning: 'Uploads your local commits to a remote branch.',
    usedHere: 'Use it to share your recorded work with collaborators or another machine.',
    pitfall: 'Git can reject a push if the remote has commits you do not have yet.',
    outcome: 'The remote branch moves forward to include your commits.',
    checkpoint: 'Which local commits did you publish?',
  },
  stash: {
    meaning: 'Temporarily shelves uncommitted changes outside the working tree.',
    usedHere: 'Use it when you need a clean workspace before switching tasks.',
    pitfall: 'Stashed work is easy to forget; list and reapply it deliberately.',
    outcome: 'Working files become clean while a stash entry stores the previous edits.',
    checkpoint: 'What did you put away, and when will you bring it back?',
  },
  tag: {
    meaning: 'Creates a stable name for one specific commit.',
    usedHere: 'Use it to mark releases or important milestones.',
    outcome: 'Adds a tag name that continues pointing at the same commit.',
    checkpoint: 'Which commit deserves this permanent label?',
  },
  reset: {
    meaning: 'Moves the current branch pointer and optionally changes staged or working files.',
    usedHere: 'Use it to undo local history during controlled practice.',
    pitfall: '--hard discards local file changes that are not saved elsewhere.',
    outcome: 'The branch pointer moves; with --hard, files are overwritten to match the target commit.',
    checkpoint: 'What history or file state did you intentionally discard?',
    safetyNote: 'reset --hard can destroy uncommitted work. In real repositories, run git status and consider a backup branch before using it.',
  },
  'cherry-pick': {
    meaning: 'Copies the change introduced by one commit onto your current branch.',
    usedHere: 'Use it when you need one specific fix without merging an entire branch.',
    pitfall: 'Cherry-picking duplicates a change as a new commit; it is not the same commit object.',
    outcome: 'Creates a new commit on the current branch with the selected change.',
    checkpoint: 'Why do you need only this commit instead of the whole branch?',
  },
};

function commandFromStep(step: ILessonStep): string | undefined {
  const text = `${step.exactCommand ?? ''} ${step.hint}`.toLowerCase();
  const match = text.match(/git\s+([a-z-]+)/);
  return match?.[1];
}

function enrichStepForBeginners(step: ILessonStep): ILessonStep {
  if (step.toolIntroductions?.length && step.expectedOutcome && step.checkpointQuestions?.length) {
    return step;
  }

  const command = commandFromStep(step);
  const pedagogy = command ? COMMAND_PEDAGOGY[command] : undefined;
  if (!command || !pedagogy) return step;

  return {
    ...step,
    toolIntroductions: step.toolIntroductions ?? [
      GIT_TOOL_INTRO,
      {
        term: command,
        meaning: pedagogy.meaning,
        usedHere: pedagogy.usedHere,
        beginnerPitfall: pedagogy.pitfall,
      },
    ],
    expectedOutcome: step.expectedOutcome ?? pedagogy.outcome,
    checkpointQuestions: step.checkpointQuestions ?? [pedagogy.checkpoint],
    safetyNote: step.safetyNote ?? pedagogy.safetyNote,
  };
}

function enrichLessonForBeginners(lesson: ILesson): ILesson {
  return {
    ...lesson,
    steps: lesson.steps.map(enrichStepForBeginners),
  };
}

// ─── Lesson Categories ───────────────────────────────────────────────────────

const CATEGORIES: ILessonCategory[] = [
  { id: 'basics', title: 'Basics', icon: '🌱', description: 'The fundamentals of Git', order: 0, color: '#10b981' },
  { id: 'branching', title: 'Branching', icon: '🌿', description: 'Working with branches', order: 1, color: '#f59e0b' },
  { id: 'merging', title: 'Merging & Rebasing', icon: '🔀', description: 'Combining and reorganizing history', order: 2, color: '#8b5cf6' },
  { id: 'remotes', title: 'Remotes', icon: '☁️', description: 'Working with remote repositories', order: 3, color: '#06b6d4' },
  { id: 'advanced', title: 'Advanced', icon: '🚀', description: 'Stash, reset, cherry-pick, and more', order: 4, color: '#ef4444' },
];

// ─── Lesson Data ─────────────────────────────────────────────────────────────

const LESSONS_DATA: ILesson[] = [

  // ─── ORIENTATION ─────────────────────────────────────────────────────────
  {
    id: 'orientation',
    title: 'Git Orientation',
    icon: '🧭',
    description: 'Start with the problem Git solves and the mental model used throughout the book',
    category: 'basics',
    prerequisites: [],
    order: -10,
    steps: [
      {
        id: 'why-git',
        title: 'Why Git Exists',
        description: 'Git helps you record meaningful snapshots, compare versions, recover from mistakes, and share work without emailing file copies around.',
        hint: 'Read this orientation card first; no command needed yet.',
        concept: 'Version control is a memory system for a project. You decide what moments are worth remembering.',
        toolIntroductions: [
          {
            term: 'version control',
            meaning: 'A system for recording project history and comparing changes over time.',
            usedHere: 'This book teaches Git as a version-control tool, not as magic terminal text.',
          },
          {
            term: 'snapshot',
            meaning: 'A recorded project state that you can inspect or return to later.',
            usedHere: 'Commits are Git snapshots with messages and parent links.',
          },
        ],
        expectedOutcome: 'You know the human reason for Git before learning any command syntax.',
        checkpointQuestions: ['What would go wrong if every project version was a copied folder named final-final-2?'],
      },
      {
        id: 'repo-anatomy',
        title: 'Repository Anatomy',
        description: 'A repository contains your visible project files plus a hidden .git database that stores history and branch metadata.',
        hint: 'Inspect the concept; the first real command will create this structure later.',
        concept: 'Visible files are the meal you are cooking. The .git directory is the recipe notebook and timeline behind it.',
        toolIntroductions: [
          {
            term: 'repository',
            meaning: 'A project folder where Git stores history.',
            usedHere: 'All later commands act on the repository you are currently inside.',
          },
          {
            term: '.git',
            meaning: 'The hidden directory where Git stores commits, branches, index data, and configuration.',
            usedHere: 'git init creates it; deleting it removes Git history from that folder.',
          },
        ],
        expectedOutcome: 'You can distinguish project files from Git metadata before creating a repository.',
        checkpointQuestions: ['Which part should you edit by hand: project files or .git metadata?'],
      },
      {
        id: 'three-areas',
        title: 'Working Tree, Staging Area, Commit',
        description: 'Git beginners need three places: files you are editing, changes selected for the next snapshot, and snapshots already recorded.',
        hint: 'Read the three-area model before using add or commit.',
        concept: 'Working tree → staging area → commit is the central beginner loop.',
        toolIntroductions: [
          {
            term: 'working tree',
            meaning: 'The files currently visible and editable in your project folder.',
            usedHere: 'This is where your unsaved-to-history work starts.',
          },
          {
            term: 'staging area',
            meaning: 'The set of changes selected for the next commit.',
            usedHere: 'git add moves chosen changes here before git commit records them.',
          },
        ],
        expectedOutcome: 'You know why Git has a staging step instead of committing every edit automatically.',
        checkpointQuestions: ['Why might you stage only one file even if three files changed?'],
      },
      {
        id: 'commit-model',
        title: 'Commits Are Linked Snapshots',
        description: 'A commit stores a snapshot, a message, metadata, and a parent link to the previous commit.',
        hint: 'Understand the graph model before using git log.',
        concept: 'History is a graph of linked commits. Branches are movable names pointing into that graph.',
        toolIntroductions: [
          {
            term: 'commit hash',
            meaning: 'A unique identifier for one commit.',
            usedHere: 'Later commands can point to exact commits by hash or relative names like HEAD~1.',
          },
          {
            term: 'HEAD',
            meaning: 'Git’s name for where you currently are in history.',
            usedHere: 'Switching branches moves HEAD to another branch or commit.',
          },
        ],
        expectedOutcome: 'You can read the graph as named pointers and linked snapshots, not as a mysterious list.',
        checkpointQuestions: ['What moves when you make a new commit on a branch?'],
      },
      {
        id: 'safe-practice-loop',
        title: 'Safe Practice Loop',
        description: 'Use status before and after commands, prefer small commits, and treat destructive commands as deliberate recovery tools.',
        hint: 'Carry this loop into every later lesson: orient → act → verify → reflect.',
        concept: 'Expert Git use is not memorizing commands; it is repeatedly checking state before changing it.',
        toolIntroductions: [
          {
            term: 'orient',
            meaning: 'Check where you are and what changed before acting.',
            usedHere: 'git status and the graph are your orientation tools.',
          },
          {
            term: 'verify',
            meaning: 'Confirm the command changed exactly what you intended.',
            usedHere: 'Every later command has an expected outcome and checkpoint.',
          },
        ],
        expectedOutcome: 'You have a low-pressure strategy for learning without guessing.',
        checkpointQuestions: ['What should you check before using commands that rewrite or discard local state?'],
      },
    ],
  },

  // ─── GLOSSARY AND PRACTICE PHASES ─────────────────────────────────────────
  {
    id: 'git-glossary',
    title: 'Git Glossary',
    icon: '📚',
    description: 'Plain-language definitions for the words used across the book',
    category: 'basics',
    prerequisites: ['orientation'],
    order: -9,
    steps: [
      {
        id: 'glossary-core',
        title: 'Core Vocabulary',
        description: 'Repository, working tree, staging area, commit, branch, HEAD, remote, fetch, merge, rebase, and reset are introduced before they become commands.',
        hint: 'Use this as a reference panel when a later command contains an unfamiliar word.',
        concept: 'A glossary lowers entry barrier by making the language explicit instead of assuming prior terminal or Git knowledge.',
        toolIntroductions: [
          { term: 'repository', meaning: 'A Git-tracked project folder.', usedHere: 'The place every command operates on.' },
          { term: 'branch', meaning: 'A movable name pointing to a commit.', usedHere: 'Lets one line of work move independently.' },
          { term: 'remote', meaning: 'A named link to another repository copy.', usedHere: 'Lets local and shared history communicate.' },
        ],
        expectedOutcome: 'Learners can pause and decode Git vocabulary without leaving the artifact.',
        checkpointQuestions: ['Which glossary term names your current position in history?'],
      },
    ],
  },
  {
    id: 'safety-recovery',
    title: 'Safety & Recovery',
    icon: '🛟',
    description: 'Learn how to recognize commands that rewrite history or discard local file state',
    category: 'advanced',
    prerequisites: ['basics'],
    order: -1,
    steps: [
      {
        id: 'danger-map',
        title: 'Danger Map',
        description: 'Some commands are safe to inspect, while others rewrite commit IDs or discard uncommitted work.',
        hint: 'Practice classifying commands before using reset or rebase.',
        concept: 'Safety in Git comes from knowing which layer changes: working tree, staging area, branch pointer, or remote branch.',
        toolIntroductions: [
          { term: 'inspect commands', meaning: 'Commands like status, log, branch, and remote -v mainly read state.', usedHere: 'Use them freely to orient yourself.' },
          { term: 'destructive commands', meaning: 'Commands that can discard files or rewrite history.', usedHere: 'Use reset --hard and rebase only with a clear plan.' },
        ],
        expectedOutcome: 'Learners can identify high-risk commands before executing them.',
        checkpointQuestions: ['Which commands should you run before a destructive command?'],
        safetyNote: 'Always orient with status/log and consider a backup branch before commands that discard work or rewrite shared history.',
      },
    ],
  },
  {
    id: 'spaced-review',
    title: 'Spaced Review',
    icon: '🔁',
    description: 'Short retrieval practice for concepts that should stick',
    category: 'advanced',
    prerequisites: ['basics', 'branches', 'remotes-intro'],
    order: 10,
    steps: [
      {
        id: 'review-three-areas',
        title: 'Recall the Three Areas',
        description: 'Retrieve the working tree → staging area → commit model without looking at command hints first.',
        hint: 'Answer from memory, then check your model with git status in later practice.',
        concept: 'Spaced retrieval is stronger than rereading because it asks you to reconstruct the model.',
        toolIntroductions: [
          { term: 'retrieval practice', meaning: 'Remembering before rereading.', usedHere: 'Used here to stabilize Git mental models.' },
          { term: 'spacing', meaning: 'Reviewing after delay instead of immediately repeating.', usedHere: 'Used here to revisit core concepts after later lessons.' },
        ],
        expectedOutcome: 'Learners rehearse concepts across time instead of only following command recipes.',
        checkpointQuestions: ['What changes when you run add, and what changes when you run commit?'],
      },
    ],
  },
  {
    id: 'challenge-mode',
    title: 'Challenge Mode',
    icon: '🎯',
    description: 'A low-pressure capstone where learners choose commands from goals rather than exact hints',
    category: 'advanced',
    prerequisites: ['basics', 'branches', 'merging', 'remotes-workflow'],
    order: 11,
    steps: [
      {
        id: 'challenge-small-feature',
        title: 'Ship a Small Feature',
        description: 'Given a goal, orient yourself, create or switch to a branch, stage focused changes, commit, inspect history, and prepare to share.',
        hint: 'No exact command first: use the safe practice loop and request progressive hints only when blocked.',
        concept: 'Challenge mode transfers skill from command copying to goal-directed Git use.',
        toolIntroductions: [
          { term: 'goal-directed practice', meaning: 'Choosing commands based on intent instead of copying exact text.', usedHere: 'This is the transition from tutorial to usable skill.' },
          { term: 'self-check', meaning: 'Verifying your own state after each action.', usedHere: 'Use status, branch, and log to confirm progress.' },
        ],
        expectedOutcome: 'Learners can map an everyday development goal to a safe Git sequence.',
        checkpointQuestions: ['Which command did you choose because of the goal, not because a hint told you?'],
      },
    ],
  },
  // ─── BASICS ──────────────────────────────────────────────────────────────
  {
    id: 'basics',
    title: 'Git Basics',
    icon: '🌱',
    description: 'Learn the fundamentals: init, add, commit, and status',
    category: 'basics',
    prerequisites: [],
    order: 0,
    steps: [
      {
        id: 'init',
        title: 'Initialize a Repository',
        description: 'Every Git project starts with `git init`. This creates a new repository in your current directory.',
        hint: 'Type: git init',
        concept: 'A repository is like a cookbook that remembers every change you make to your recipes.',
        validation: { type: 'regex', pattern: '^git\\s+init$' },
        progressiveHints: [
          'Think about how to start a new Git project...',
          'The command to initialize is two words: git + init',
          'Type exactly: git init',
        ],
        exactCommand: 'git init',
        estimatedTime: 30,
      },
      {
        id: 'status1',
        title: 'Check Status',
        description: 'See what files are in your working directory and whether they are tracked, staged, or untracked.',
        hint: 'Type: git status',
        concept: 'The working directory is your kitchen counter — where you prepare and modify recipes before recording them.',
        validation: { type: 'regex', pattern: '^git\\s+status$' },
        progressiveHints: [
          'How do you check the current state of your repo?',
          'The status command tells you about tracked, staged, and untracked files',
          'Type exactly: git status',
        ],
        exactCommand: 'git status',
        estimatedTime: 20,
      },
      {
        id: 'add1',
        title: 'Stage Your Files',
        description: 'Use `git add .` to stage all changes. Staging is like putting recipes on a tray, ready to be photographed.',
        hint: 'Type: git add .',
        concept: 'The staging area (index) is like a photo studio — you arrange exactly what you want to capture before taking the snapshot.',
        validation: { type: 'regex', pattern: '^git\\s+add\\s+\\.$' },
        progressiveHints: [
          'You need to select files before committing them...',
          'Use "git add" followed by the files to stage',
          'Type exactly: git add .',
        ],
        exactCommand: 'git add .',
        estimatedTime: 25,
      },
      {
        id: 'commit1',
        title: 'Create Your First Commit',
        description: 'A commit is a snapshot of your staged changes. It\'s like taking a photo of your recipe collection at this moment.',
        hint: 'Type: git commit -m "Initial commit"',
        concept: 'A commit permanently records the state of your staged files. Each commit gets a unique hash ID and links to its parent, forming a chain.',
        validation: { type: 'regex', pattern: '^git\\s+commit\\s+-m\\s+".+"$' },
        progressiveHints: [
          'Now that files are staged, how do you save a snapshot?',
          'Use git commit with the -m flag for a message',
          'Type exactly: git commit -m "Initial commit"',
        ],
        exactCommand: 'git commit -m "Initial commit"',
        estimatedTime: 30,
      },
      {
        id: 'log1',
        title: 'View History',
        description: 'See the history of commits in your repository.',
        hint: 'Type: git log',
        concept: 'Git log shows the commit chain — each commit points to its parent, creating a timeline of your project\'s history.',
        validation: { type: 'regex', pattern: '^git\\s+log$' },
        progressiveHints: [
          'How do you view the history of your commits?',
          'The log command shows all commits',
          'Type exactly: git log',
        ],
        exactCommand: 'git log',
        estimatedTime: 20,
      },
    ],
  },

  // ─── BRANCHING ───────────────────────────────────────────────────────────
  {
    id: 'branches',
    title: 'Branching',
    icon: '🌿',
    description: 'Create and switch between branches to work on different features',
    category: 'branching',
    prerequisites: ['basics'],
    order: 0,
    steps: [
      {
        id: 'branch-create',
        title: 'Create a Branch',
        description: 'Branches let you diverge from the main line of development. Think of it as starting a new chapter in your cookbook.',
        hint: 'Type: git branch desserts',
        concept: 'A branch is just a movable pointer to a commit. Creating a branch doesn\'t copy files — it just creates a new label.',
        validation: { type: 'regex', pattern: '^git\\s+branch\\s+\\S+$' },
      },
      {
        id: 'branch-list',
        title: 'List Branches',
        description: 'See all branches in your repository.',
        hint: 'Type: git branch',
        concept: 'The asterisk (*) shows which branch you\'re currently on. HEAD points to your current branch.',
        validation: { type: 'regex', pattern: '^git\\s+branch$' },
      },
      {
        id: 'checkout',
        title: 'Switch Branches',
        description: 'Move to a different branch to work on it.',
        hint: 'Type: git checkout desserts',
        concept: 'When you checkout a branch, Git updates your working directory to match the commit that branch points to. HEAD now points to this branch.',
        validation: { type: 'regex', pattern: '^git\\s+(checkout|switch)\\s+\\S+$' },
      },
      {
        id: 'commit-branch',
        title: 'Commit on a Branch',
        description: 'Make changes and commit them on the new branch. This is where the branch diverges from main.',
        hint: 'Add and commit on the new branch',
        concept: 'When you commit on a branch, only that branch pointer moves forward. The main branch stays where it was.',
        validation: { type: 'regex', pattern: '^git\\s+commit\\s+-m\\s+".+"$' },
      },
      {
        id: 'checkout-main',
        title: 'Switch Back to Main',
        description: 'Return to the main branch. Notice how your working directory changes back.',
        hint: 'Type: git checkout main',
        concept: 'Switching branches restores the working directory to that branch\'s state. Your branch\'s commits are safe even when you switch away.',
        validation: { type: 'regex', pattern: '^git\\s+(checkout|switch)\\s+main$' },
      },
    ],
  },

  // ─── MERGING ─────────────────────────────────────────────────────────────
  {
    id: 'merging',
    title: 'Merging',
    icon: '🔀',
    description: 'Combine branches back together with merge',
    category: 'merging',
    prerequisites: ['branches'],
    order: 0,
    steps: [
      {
        id: 'merge-branch',
        title: 'Merge a Branch',
        description: 'Bring the changes from another branch into your current branch.',
        hint: 'Type: git merge desserts',
        concept: 'A merge creates a new "merge commit" with two parents — one from each branch. This preserves the full history of both lines.',
        validation: { type: 'regex', pattern: '^git\\s+merge\\s+\\S+$' },
      },
      {
        id: 'merge-log',
        title: 'View Merge History',
        description: 'After a merge, the log shows both branches\' histories combined.',
        hint: 'Type: git log',
        concept: 'Merge commits have two parent IDs. This is what creates the diamond shape in the git graph — both branches converge.',
        validation: { type: 'regex', pattern: '^git\\s+log$' },
      },
    ],
  },
  {
    id: 'rebase',
    title: 'Rebasing',
    icon: '♻️',
    description: 'Replay commits onto a new base for a cleaner history',
    category: 'merging',
    prerequisites: ['branches'],
    order: 1,
    steps: [
      {
        id: 'rebase-start',
        title: 'Create a Feature Branch',
        description: 'First, create a branch and make some commits on both it and main.',
        hint: 'Create a branch and switch to it',
        concept: 'Before rebasing, you need commits on a branch that has diverged from its base.',
        validation: { type: 'regex', pattern: '^git\\s+(checkout|switch)\\s+\\S+$' },
      },
      {
        id: 'rebase-exec',
        title: 'Rebase onto Main',
        description: 'Rebase replays your branch\'s commits on top of the latest main, creating a linear history.',
        hint: 'Type: git rebase main',
        concept: 'Unlike merge, rebase doesn\'t create a merge commit. It "replays" your commits on top of the target, creating new commits with the same changes but new IDs.',
        validation: { type: 'regex', pattern: '^git\\s+rebase\\s+main$' },
      },
    ],
  },

  // ─── REMOTES ─────────────────────────────────────────────────────────────
  {
    id: 'remotes-intro',
    title: 'Remote Repositories',
    icon: '☁️',
    description: 'Learn how to connect to remote repositories and sync your work',
    category: 'remotes',
    prerequisites: ['basics'],
    order: 0,
    initialFiles: {
      'README.md': `# 🍳 The Recipe Book\n\nA collaborative collection of delicious recipes.\n`,
      'recipes/pasta.md': `# Spaghetti Carbonara\n\nClassic Roman pasta.\n\n## Ingredients\n- 400g spaghetti\n- 200g guanciale\n- 4 egg yolks\n`,
    },
    remoteSetup: {
      remoteName: 'origin',
      url: 'https://github.com/chef/recipe-book.git',
      branchName: 'main',
      remoteCommits: [
        {
          message: 'Initial recipe collection',
          files: {
            'README.md': `# 🍳 The Recipe Book\n\nA collaborative collection of delicious recipes.\n`,
            'recipes/pasta.md': `# Spaghetti Carbonara\n\nClassic Roman pasta.\n\n## Ingredients\n- 400g spaghetti\n- 200g guanciale\n- 4 egg yolks\n`,
          },
        },
        {
          message: 'Add dessert section',
          files: {
            'README.md': `# 🍳 The Recipe Book\n\nA collaborative collection of delicious recipes.\nNow with desserts!\n`,
            'recipes/pasta.md': `# Spaghetti Carbonara\n\nClassic Roman pasta.\n\n## Ingredients\n- 400g spaghetti\n- 200g guanciale\n- 4 egg yolks\n`,
            'recipes/tiramisu.md': `# Tiramisu\n\nA classic Italian dessert.\n\n## Ingredients\n- 500g mascarpone\n- 6 egg yolks\n- Coffee\n- Ladyfinger biscuits\n- Cocoa powder\n`,
          },
        },
      ],
    },
    steps: [
      {
        id: 'remote-init',
        title: 'Initialize Your Local Repo',
        description: 'Start by creating your local repository. You\'ll then connect it to a remote.',
        hint: 'Type: git init',
        concept: 'Your local repo is your personal workspace. A remote is a shared space where collaborators exchange their work — like a community cookbook shelf.',
        validation: { type: 'regex', pattern: '^git\\s+init$' },
      },
      {
        id: 'remote-add',
        title: 'Add a Remote',
        description: 'Connect your local repo to a remote repository using `git remote add`.',
        hint: 'Type: git remote add origin https://github.com/chef/recipe-book.git',
        concept: 'A remote is a bookmark pointing to another copy of the repository — usually on GitHub, GitLab, or a server. "origin" is the conventional name for the primary remote.',
        validation: { type: 'regex', pattern: '^git\\s+remote\\s+add\\s+\\S+\\s+\\S+' },
      },
      {
        id: 'remote-list',
        title: 'Verify Your Remote',
        description: 'List the remotes you\'ve configured.',
        hint: 'Type: git remote -v',
        concept: 'The -v flag shows the URL for each remote. You can have multiple remotes — e.g., "origin" for your fork and "upstream" for the original project.',
        validation: { type: 'regex', pattern: '^git\\s+remote(\\s+-v|\\s+--verbose)?$' },
      },
      {
        id: 'remote-fetch',
        title: 'Fetch from Remote',
        description: 'Download the remote\'s commits and branches without changing your working directory.',
        hint: 'Type: git fetch origin',
        concept: 'Fetch is like checking your mailbox — you see what arrived but don\'t open it yet. It updates remote-tracking branches (origin/main) but leaves your local branches and working directory untouched. This is safe!',
        validation: { type: 'regex', pattern: '^git\\s+fetch\\s+\\S+' },
      },
      {
        id: 'remote-checkout-track',
        title: 'Checkout the Remote Branch',
        description: 'Create a local branch that tracks the remote branch.',
        hint: 'Type: git checkout origin/main',
        concept: 'When you checkout a remote-tracking branch, Git creates a local branch that "tracks" it. This means future pulls and pushes know exactly where to sync.',
        validation: { type: 'regex', pattern: '^git\\s+(checkout|switch)\\s+\\S+/\\S+' },
      },
    ],
  },
  {
    id: 'remotes-pull',
    title: 'Pulling Changes',
    icon: '⬇️',
    description: 'Fetch and merge remote changes into your local branch',
    category: 'remotes',
    prerequisites: ['remotes-intro'],
    order: 1,
    remoteSetup: {
      remoteName: 'origin',
      url: 'https://github.com/chef/recipe-book.git',
      branchName: 'main',
      remoteCommits: [
        {
          message: 'Add salad recipe',
          files: {
            'README.md': `# 🍳 The Recipe Book\n\nWith salads now!\n`,
            'recipes/salad.md': `# Caesar Salad\n\nThe original.\n`,
          },
        },
        {
          message: 'Update README',
          files: {
            'README.md': `# 🍳 The Recipe Book\n\nWith salads and more!\n`,
            'recipes/salad.md': `# Caesar Salad\n\nThe original.\n`,
          },
        },
      ],
    },
    steps: [
      {
        id: 'pull-fetch',
        title: 'Fetch New Changes',
        description: 'First, download what\'s new on the remote.',
        hint: 'Type: git fetch origin',
        concept: 'Always fetch before pull to see what\'s coming. This gives you a chance to inspect the changes before they affect your work.',
        validation: { type: 'regex', pattern: '^git\\s+fetch\\s+\\S+' },
      },
      {
        id: 'pull-exec',
        title: 'Pull and Merge',
        description: 'Pull = fetch + merge. This brings remote changes into your local branch.',
        hint: 'Type: git pull origin main',
        concept: 'git pull downloads changes from the remote and merges them into your current branch. If there are no conflicts, it\'s seamless. If there are, you\'ll need to resolve them. For more control, use fetch + merge separately.',
        validation: { type: 'regex', pattern: '^git\\s+pull\\s+\\S+\\s+\\S+' },
      },
      {
        id: 'pull-status',
        title: 'Check the Result',
        description: 'After pulling, check your status and log to see what changed.',
        hint: 'Type: git status',
        concept: 'After a pull, git status shows if your branch is up to date with the remote. The tracking relationship means Git can tell you if you\'re ahead, behind, or diverged.',
        validation: { type: 'regex', pattern: '^git\\s+status$' },
      },
    ],
  },
  {
    id: 'remotes-push',
    title: 'Pushing Changes',
    icon: '⬆️',
    description: 'Upload your local commits to a remote repository',
    category: 'remotes',
    prerequisites: ['remotes-intro'],
    order: 2,
    steps: [
      {
        id: 'push-add-remote',
        title: 'Set Up a Remote',
        description: 'Add a remote to push to.',
        hint: 'Type: git remote add origin https://github.com/chef/recipe-book.git',
        concept: 'You need a remote configured before you can push. The remote URL tells Git where to send your commits.',
        validation: { type: 'regex', pattern: '^git\\s+remote\\s+add\\s+\\S+\\s+\\S+' },
      },
      {
        id: 'push-commit',
        title: 'Make a Commit to Push',
        description: 'Create a commit that you\'ll push to the remote.',
        hint: 'Stage and commit your changes',
        concept: 'You can only push commits that exist locally. Make sure you\'ve committed everything you want to share.',
        validation: { type: 'regex', pattern: '^git\\s+commit\\s+-m\\s+".+"$' },
      },
      {
        id: 'push-exec',
        title: 'Push to Remote',
        description: 'Upload your commits to the remote repository.',
        hint: 'Type: git push origin main',
        concept: 'Push sends your local commits to the remote, updating the remote branch. It also sets up tracking so future pushes/pulls are simpler. If the remote has newer commits, Git will reject your push — you need to pull first.',
        validation: { type: 'regex', pattern: '^git\\s+push\\s+\\S+\\s+\\S+' },
      },
      {
        id: 'push-verify',
        title: 'Verify the Push',
        description: 'Check your status to see the tracking relationship.',
        hint: 'Type: git status',
        concept: 'After pushing, your branch should be "up to date" with the remote. The graph shows both your local and remote-tracking branch at the same commit.',
        validation: { type: 'regex', pattern: '^git\\s+status$' },
      },
    ],
  },
  {
    id: 'remotes-workflow',
    title: 'Remote Workflow',
    icon: '🔄',
    description: 'Practice the full fetch-pull-push cycle with collaboration scenarios',
    category: 'remotes',
    prerequisites: ['remotes-pull', 'remotes-push'],
    order: 3,
    remoteSetup: {
      remoteName: 'origin',
      url: 'https://github.com/chef/recipe-book.git',
      branchName: 'main',
      remoteCommits: [
        {
          message: 'Shared: Add soup recipe',
          files: {
            'README.md': `# 🍳 The Recipe Book\n\nNow with soups!\n`,
            'recipes/soup.md': `# Minestrone\n\nA hearty Italian vegetable soup.\n`,
          },
        },
      ],
    },
    steps: [
      {
        id: 'workflow-fetch',
        title: 'Fetch Remote Changes',
        description: 'A collaborator has pushed new changes. Fetch to see them.',
        hint: 'Type: git fetch origin',
        concept: 'In a real workflow, someone else may have pushed to the remote while you were working. Fetch regularly to stay aware of their changes.',
        validation: { type: 'regex', pattern: '^git\\s+fetch\\s+\\S+' },
      },
      {
        id: 'workflow-merge-remote',
        title: 'Merge Remote Changes',
        description: 'Integrate the remote changes with your local work.',
        hint: 'Type: git merge origin/main',
        concept: 'After fetching, you can merge the remote-tracking branch into your local branch. This is what git pull does automatically — but doing it step by step gives you more control.',
        validation: { type: 'regex', pattern: '^git\\s+merge\\s+\\S+/\\S+' },
      },
      {
        id: 'workflow-push-final',
        title: 'Push Your Merged Work',
        description: 'Now push your up-to-date branch to the remote.',
        hint: 'Type: git push origin main',
        concept: 'After merging remote changes, your local branch includes both your work and theirs. Pushing updates the remote so others can see the integrated result. This is the collaboration loop: fetch → merge → push.',
        validation: { type: 'regex', pattern: '^git\\s+push\\s+\\S+\\s+\\S+' },
      },
    ],
  },


  {
    id: 'tags-guided',
    title: 'Guided Tags',
    icon: '🏷️',
    description: 'Mark important commits with stable names and inspect those labels safely',
    category: 'advanced',
    prerequisites: ['basics'],
    order: -0.8,
    steps: [
      {
        id: 'tag-orient',
        title: 'Orient Before Tagging',
        description: 'A tag should point at a commit worth naming, so first inspect the current commit history.',
        hint: 'Type: git log',
        concept: 'Tags are stable labels for commits. Branches move as work continues; tags are intended to stay attached to one important commit.',
        validation: { type: 'regex', pattern: '^git\\s+log$' },
        toolIntroductions: [
          {
            term: 'tag',
            meaning: 'A stable name attached to a specific commit, often used for releases such as v1.0.0.',
            usedHere: 'You will use a tag to mark the recipe-book state you want to remember.',
            beginnerPitfall: 'A tag does not collect future commits; it keeps pointing to the commit you tagged.',
          },
          {
            term: 'git log',
            meaning: 'Shows commits so you can choose the right target before labeling it.',
            usedHere: 'You inspect history before creating the tag.',
          },
        ],
        expectedOutcome: 'You can identify the current HEAD commit as the candidate for the new tag.',
        checkpointQuestions: ['Why should you inspect history before assigning a release label?'],
      },
      {
        id: 'tag-create',
        title: 'Create a Lightweight Tag',
        description: 'Create a simple tag name for the current commit.',
        hint: 'Type: git tag v1.0',
        exactCommand: 'git tag v1.0',
        concept: 'A lightweight tag is a direct label on a commit. It is useful for local practice and simple milestones.',
        validation: { type: 'regex', pattern: '^git\\s+tag\\s+\\S+$' },
        toolIntroductions: [
          {
            term: 'tag',
            meaning: 'Creates or manages names that point to commits.',
            usedHere: 'git tag v1.0 attaches the name v1.0 to the current commit.',
            beginnerPitfall: 'Use clear version names; renaming published tags is disruptive for collaborators.',
          },
          {
            term: 'v1.0',
            meaning: 'A conventional version-style tag name.',
            usedHere: 'It marks this practice repository state as a first milestone.',
          },
        ],
        expectedOutcome: 'The tag list now contains v1.0 pointing at the current commit.',
        checkpointQuestions: ['What is the difference between a branch moving forward and a tag staying fixed?'],
      },
      {
        id: 'tag-list',
        title: 'List Tags',
        description: 'List tag names to confirm the label exists.',
        hint: 'Type: git tag',
        concept: 'Listing tags is a safe inspection command. It shows the stable labels available in the repository.',
        validation: { type: 'regex', pattern: '^git\\s+tag$' },
        expectedOutcome: 'Git prints the tag names, including v1.0.',
        checkpointQuestions: ['Which tag name did you just create?'],
      },
      {
        id: 'tag-show',
        title: 'Inspect a Tag',
        description: 'Show the commit that a tag points to.',
        hint: 'Type: git show v1.0',
        concept: 'git show lets you inspect the commit behind a tag so the label is connected to actual history.',
        validation: { type: 'regex', pattern: '^git\\s+show\\s+\\S+$' },
        toolIntroductions: [
          {
            term: 'show',
            meaning: 'Displays details for a commit-ish object such as a commit, branch, or tag.',
            usedHere: 'git show v1.0 reveals what the tag names.',
          },
          {
            term: 'v1.0',
            meaning: 'The tag name you created.',
            usedHere: 'It selects the tagged commit for inspection.',
          },
        ],
        expectedOutcome: 'Git displays the commit details for the tagged milestone.',
        checkpointQuestions: ['How can you prove a tag points at the intended commit?'],
      },
    ],
  },
  {
    id: 'cherry-pick-guided',
    title: 'Guided Cherry-Pick',
    icon: '🍒',
    description: 'Copy one selected commit from another line of work onto the current branch',
    category: 'advanced',
    prerequisites: ['branches', 'merging'],
    order: -0.7,
    steps: [
      {
        id: 'cherry-pick-orient',
        title: 'Orient on the Receiving Branch',
        description: 'Cherry-pick applies a commit onto the branch you are currently on, so start by checking where HEAD is.',
        hint: 'Type: git branch',
        concept: 'Cherry-pick is not a merge. It copies one commit\'s change onto the current branch as a new commit.',
        validation: { type: 'regex', pattern: '^git\\s+branch$' },
        toolIntroductions: [
          {
            term: 'current branch',
            meaning: 'The branch HEAD is attached to right now.',
            usedHere: 'This branch will receive the copied change.',
            beginnerPitfall: 'Cherry-picking while on the wrong branch puts the copied commit in the wrong place.',
          },
          {
            term: 'cherry-pick',
            meaning: 'Copies the change introduced by one commit and records it as a new commit on the current branch.',
            usedHere: 'You will use it to take exactly one useful recipe change without merging the whole branch.',
          },
        ],
        expectedOutcome: 'You know which branch will receive the selected commit.',
        checkpointQuestions: ['Why is the current branch important before cherry-picking?'],
      },
      {
        id: 'cherry-pick-find-commit',
        title: 'Find the Commit to Copy',
        description: 'Inspect history and choose the specific commit hash you want to replay.',
        hint: 'Type: git log',
        concept: 'Cherry-pick needs a commit identifier. The hash is the precise address of the change you want.',
        validation: { type: 'regex', pattern: '^git\\s+log$' },
        toolIntroductions: [
          {
            term: 'commit hash',
            meaning: 'A unique ID for one commit.',
            usedHere: 'The hash tells cherry-pick exactly which change to copy.',
          },
          {
            term: 'source commit',
            meaning: 'The commit whose change you want to copy.',
            usedHere: 'Only this commit is copied; surrounding branch history is not merged.',
          },
        ],
        expectedOutcome: 'You can identify a commit hash to use with git cherry-pick.',
        checkpointQuestions: ['Why is cherry-pick more selective than merge?'],
      },
      {
        id: 'cherry-pick-apply',
        title: 'Apply the Selected Commit',
        description: 'Copy the selected commit onto the current branch.',
        hint: 'Type: git cherry-pick <commit-hash>',
        exactCommand: 'git cherry-pick <commit-hash>',
        concept: 'Git replays the patch from the selected commit. The result is a new commit with a different hash on your current branch.',
        validation: { type: 'regex', pattern: '^git\\s+cherry-pick\\s+\\S+$' },
        safetyNote: 'Cherry-pick duplicates a change onto the current branch and may stop for conflicts if the copied patch overlaps local work.',
        toolIntroductions: [
          {
            term: 'cherry-pick',
            meaning: 'Applies the change from one commit to the current branch.',
            usedHere: 'It records a new commit that contains the selected recipe change.',
            beginnerPitfall: 'The new commit has a different hash, so it is a duplicate change, not the same commit object.',
          },
          {
            term: '<commit-hash>',
            meaning: 'Placeholder for the source commit ID you found in the log.',
            usedHere: 'Replace it with the actual hash in real Git use.',
          },
        ],
        expectedOutcome: 'A new commit appears on the current branch containing the selected change.',
        checkpointQuestions: ['How is this different from merging the entire source branch?'],
      },
      {
        id: 'cherry-pick-verify',
        title: 'Verify the Copied Change',
        description: 'Check status and history to confirm the branch is clean and the copied change landed.',
        hint: 'Type: git status',
        concept: 'Verification matters after cherry-pick because conflicts or partial changes should be resolved before continuing.',
        validation: { type: 'regex', pattern: '^git\\s+status$' },
        expectedOutcome: 'Status is clean or clearly reports conflict work to finish; history shows the new copied commit.',
        checkpointQuestions: ['What would you inspect if cherry-pick stopped because of a conflict?'],
      },
    ],
  },

  // ─── ADVANCED ────────────────────────────────────────────────────────────
  {
    id: 'advanced',
    title: 'Advanced',
    icon: '🚀',
    description: 'Cherry-pick, stash, reset, and tags',
    category: 'advanced',
    prerequisites: ['basics'],
    order: 0,
    steps: [
      {
        id: 'stash',
        title: 'Stash Your Changes',
        description: 'Save your uncommitted work temporarily and restore a clean working directory.',
        hint: 'Type: git stash',
        concept: 'Stash is like putting your current work in a drawer. You can pop it back later. Great for when you need to switch tasks quickly.',
        validation: { type: 'regex', pattern: '^git\\s+stash$' },
      },
      {
        id: 'tag',
        title: 'Create a Tag',
        description: 'Mark an important commit with a named tag, like version numbers.',
        hint: 'Type: git tag v1.0',
        concept: 'Tags are permanent bookmarks pointing to specific commits. Unlike branches, they don\'t move when you make new commits.',
        validation: { type: 'regex', pattern: '^git\\s+tag\\s+\\S+$' },
      },
      {
        id: 'reset',
        title: 'Reset to a Previous Commit',
        description: 'Move the branch pointer backwards, undoing commits.',
        hint: 'Type: git reset --hard HEAD~1',
        concept: 'Reset moves the branch pointer to a previous commit. --hard also changes your working directory. Use with caution!',
        validation: { type: 'regex', pattern: '^git\\s+reset' },
      },
      {
        id: 'cherry-pick',
        title: 'Cherry-Pick a Commit',
        description: 'Apply a specific commit from one branch onto another.',
        hint: 'Type: git cherry-pick <commit-hash>',
        concept: 'Cherry-pick lets you grab just one commit from anywhere and apply it to your current branch — like picking one recipe from another cookbook.',
        validation: { type: 'regex', pattern: '^git\\s+cherry-pick\\s+\\S+$' },
      },
    ],
  },
];

// ─── Lesson Provider Implementation ──────────────────────────────────────────

export class LessonProvider implements ILessonRegistry {
  private lessons: Map<string, ILesson> = new Map();
  private categories: Map<string, ILessonCategory> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    for (const l of LESSONS_DATA) this.lessons.set(l.id, enrichLessonForBeginners(l));
    for (const c of CATEGORIES) this.categories.set(c.id, c);
  }

  getLessons(): ILesson[] {
    return Array.from(this.lessons.values()).sort((a, b) => {
      const catA = this.categories.get(a.category);
      const catB = this.categories.get(b.category);
      const catOrder = (catA?.order ?? 99) - (catB?.order ?? 99);
      if (catOrder !== 0) return catOrder;
      return a.order - b.order;
    });
  }

  getLessonsByCategory(category: LessonCategory): ILesson[] {
    return this.getLessons().filter((l) => l.category === category);
  }

  getLesson(id: string): ILesson | undefined {
    return this.lessons.get(id);
  }

  getCategories(): ILessonCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  arePrerequisitesMet(lessonId: string, completedLessonIds: Set<string>): boolean {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) return true;
    return lesson.prerequisites.every((p) => completedLessonIds.has(p));
  }

  validateStep(
    lessonId: string,
    stepIndex: number,
    rawCommand: string,
    gitState: Record<string, unknown>
  ): boolean {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) return false;
    const step = lesson.steps[stepIndex];
    if (!step) return false;

    const validation = step.validation;
    if (!validation) return false;

    const normalized = rawCommand.trim().toLowerCase();

    switch (validation.type) {
      case 'regex': {
        if (!validation.pattern) return false;
        try {
          const regex = new RegExp(validation.pattern.toLowerCase());
          return regex.test(normalized);
        } catch {
          return normalized.includes(validation.pattern!.toLowerCase());
        }
      }
      case 'state-check': {
        if (!validation.statePredicate) return false;
        return validation.statePredicate(gitState);
      }
      case 'custom': {
        if (!validation.customValidator) return false;
        return validation.customValidator(rawCommand, gitState);
      }
      default:
        return false;
    }
  }

  // ─── Registry Methods ─────────────────────────────────────────────────────

  registerLesson(lesson: ILesson): void {
    this.lessons.set(lesson.id, enrichLessonForBeginners(lesson));
    this.notifyListeners();
  }

  registerCategory(category: ILessonCategory): void {
    this.categories.set(category.id, category);
    this.notifyListeners();
  }

  unregisterLesson(id: string): void {
    this.lessons.delete(id);
    this.notifyListeners();
  }

  onLessonsChange(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    for (const cb of this.listeners) cb();
  }
}
