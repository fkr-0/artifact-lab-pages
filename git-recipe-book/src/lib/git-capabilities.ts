export const TEACHING_SIMULATOR_COMMANDS = new Set([
  'init',
  'add',
  'commit',
  'branch',
  'checkout',
  'switch',
  'merge',
  'rebase',
  'log',
  'show',
  'status',
  'diff',
  'tag',
  'stash',
  'reset',
  'restore',
  'revert',
  'reflog',
  'cherry-pick',
  'remote',
  'fetch',
  'pull',
  'push',
])

export function gitSubcommandFromText(text: string): string | undefined {
  // Command examples in the curriculum use the literal CLI spelling `git`.
  // Keeping this case-sensitive avoids treating prose such as “Git metadata”
  // as an attempted `git metadata` command.
  return text.match(/\bgit\s+([a-z-]+)/)?.[1]
}

export function simulatorSupportsGitCommand(text: string): boolean {
  const command = gitSubcommandFromText(text)
  return command ? TEACHING_SIMULATOR_COMMANDS.has(command) : false
}
