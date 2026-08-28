import type { ScenarioDefinition } from './types'

const BASE_README = '# Recipe Book\n\nA small shared cookbook.\n'
const BASE_PASTA = '# Pasta\n\nTomato, garlic, olive oil.\n'
const BASE_SALAD = '# Salad\n\nLeaves, lemon, olive oil.\n'

const BASE_FILES = {
  'README.md': BASE_README,
  'recipes/pasta.md': BASE_PASTA,
  'recipes/salad.md': BASE_SALAD,
}

export const SCENARIOS: ScenarioDefinition[] = [
  { id: 'orientation/empty', initialized: false },
  { id: 'local/default-uninitialized', initialized: false },
  {
    id: 'local/selective-staging',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'edit README.md Documentation-only-change',
      'edit recipes/salad.md Unrelated-salad-change',
    ],
  },
  {
    id: 'branching/base',
    initialized: true,
    files: BASE_FILES,
    setupCommands: ['git add .', 'git commit -m "Base snapshot"'],
  },
  {
    id: 'merge/fast-forward',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'git switch -c feature',
      'edit README.md Feature-ready',
      'git add README.md',
      'git commit -m "Feature commit"',
      'git switch main',
    ],
  },
  {
    id: 'merge/diverged',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'git switch -c feature',
      'edit recipes/pasta.md Feature-pasta-change',
      'git add recipes/pasta.md',
      'git commit -m "Feature pasta"',
      'git switch main',
      'edit README.md Main-documentation-change',
      'git add README.md',
      'git commit -m "Main docs"',
    ],
  },
  {
    id: 'merge/conflict',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'git switch -c feature',
      'edit README.md Feature-README-version',
      'git add README.md',
      'git commit -m "Feature README"',
      'git switch main',
      'edit README.md Main-README-version',
      'git add README.md',
      'git commit -m "Main README"',
    ],
  },
  {
    id: 'rebase/diverged',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'git switch -c feature',
      'edit recipes/pasta.md Feature-pasta',
      'git add recipes/pasta.md',
      'git commit -m "Feature pasta"',
      'git switch main',
      'edit README.md Main-docs',
      'git add README.md',
      'git commit -m "Main docs"',
      'git switch feature',
    ],
  },
  {
    id: 'recovery/unstaged',
    initialized: true,
    files: BASE_FILES,
    setupCommands: ['git add .', 'git commit -m "Base snapshot"', 'edit README.md Accidental-local-edit'],
  },
  {
    id: 'recovery/staged',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'edit README.md Good-change-but-not-for-this-commit',
      'git add README.md',
    ],
  },
  {
    id: 'recovery/bad-commit',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'edit README.md Mistaken-recorded-change',
      'git add README.md',
      'git commit -m "Mistaken change"',
    ],
  },
  {
    id: 'recovery/reset-history',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'edit README.md Second-version',
      'git add README.md',
      'git commit -m "Second snapshot"',
      'edit recipes/salad.md Third-version',
      'git add recipes/salad.md',
      'git commit -m "Third snapshot"',
    ],
  },
  {
    id: 'recovery/stash',
    initialized: true,
    files: BASE_FILES,
    setupCommands: ['git add .', 'git commit -m "Base snapshot"', 'edit README.md Work-in-progress'],
  },
  {
    id: 'remotes/configure',
    initialized: true,
    files: BASE_FILES,
  },
  {
    id: 'remotes/fetch',
    initialized: false,
    remoteSetup: {
      remoteName: 'origin',
      url: 'https://example.test/recipe-book.git',
      branchName: 'main',
      remoteCommits: [
        { message: 'Shared base', files: BASE_FILES },
        {
          message: 'Collaborator adds soup',
          files: { ...BASE_FILES, 'recipes/soup.md': '# Soup\n\nBeans and vegetables.\n' },
        },
      ],
    },
  },
  {
    id: 'remotes/push',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Local base"',
      'git remote add origin https://example.test/recipe-book.git',
    ],
  },
  {
    id: 'remotes/workflow',
    initialized: false,
    remoteSetup: {
      remoteName: 'origin',
      url: 'https://example.test/recipe-book.git',
      branchName: 'main',
      remoteCommits: [{ message: 'Shared base', files: BASE_FILES }],
    },
    setupCommands: [
      'git fetch origin',
      'git merge origin/main',
      'edit README.md Local-collaboration-change',
      'git add README.md',
      'git commit -m "Local collaboration change"',
    ],
  },
  {
    id: 'remotes/rejected-push',
    initialized: false,
    remoteSetup: {
      remoteName: 'origin',
      url: 'https://example.test/recipe-book.git',
      branchName: 'main',
      remoteCommits: [{ message: 'Shared base', files: BASE_FILES }],
    },
    setupCommands: [
      'git fetch origin',
      'git merge origin/main',
      'git push -u origin main',
      'edit README.md Local-work',
      'git add README.md',
      'git commit -m "Local work"',
    ],
    remoteAdvance: [
      {
        remoteName: 'origin',
        branchName: 'main',
        message: 'Collaborator work',
        files: { ...BASE_FILES, 'remote-note.md': '# Collaborator note\n' },
      },
    ],
  },
  {
    id: 'selective-history/base',
    initialized: true,
    files: BASE_FILES,
    setupCommands: ['git add .', 'git commit -m "Release candidate"'],
  },
  {
    id: 'selective-history/cherry-pick',
    initialized: true,
    files: BASE_FILES,
    setupCommands: [
      'git add .',
      'git commit -m "Base snapshot"',
      'git switch -c fix-source',
      'edit recipes/pasta.md Critical-pasta-fix',
      'git add recipes/pasta.md',
      'git commit -m "Critical pasta fix"',
      'git switch main',
    ],
  },
  {
    id: 'challenge/capstone',
    initialized: true,
    files: BASE_FILES,
    setupCommands: ['git add .', 'git commit -m "Base snapshot"', 'edit README.md Capstone-docs-change'],
  },
]

const BY_ID = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]))

export function getScenario(id: string): ScenarioDefinition | undefined {
  return BY_ID.get(id)
}
