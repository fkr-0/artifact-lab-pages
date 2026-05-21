import { getSignalPuzzleForWorld, isPuzzleSolved } from './puzzles.js';
import { questProgress, questsForWorld } from './quests.js';
import { WORLD_NODES, WORLD_ROUTES, canVisitWorld, findWorld } from './worlds.js';

export function nextWorldAfter(worldId) {
  const index = WORLD_NODES.findIndex((world) => world.id === worldId);
  return index >= 0 ? WORLD_NODES[index + 1] || null : null;
}

export function nextRouteAfter(worldId) {
  const nextWorld = nextWorldAfter(worldId);
  return nextWorld ? WORLD_ROUTES.find((route) => route.to === nextWorld.id) || null : null;
}

export function currentWorldObjective(worldProgress, questState) {
  const world = findWorld(worldProgress?.currentWorldId);
  const localQuest = questsForWorld(world.id)[0] || null;
  const puzzle = getSignalPuzzleForWorld(world.id);
  const puzzleSolved = isPuzzleSolved(worldProgress, puzzle.id);
  const quest = localQuest ? questProgress(questState, localQuest) : null;
  const nextWorld = nextWorldAfter(world.id);
  const nextRoute = nextRouteAfter(world.id);

  if (localQuest && quest?.status === 'available') {
    return {
      kind: 'accept-quest',
      title: 'Listen locally',
      detail: `Open Local Signals and accept “${localQuest.title}”.`,
      actionLabel: 'Open Local Signals',
      actionTarget: 'local-signals',
    };
  }

  if (localQuest && quest?.status === 'active' && !puzzleSolved) {
    return {
      kind: 'solve-puzzle',
      title: 'Decode local signal',
      detail: `Solve “${puzzle.title}” to complete “${localQuest.title}”.`,
      actionLabel: 'Open Signal Puzzle',
      actionTarget: 'signal-puzzle',
    };
  }

  if (localQuest && quest?.status === 'complete' && nextWorld) {
    const unlocked = canVisitWorld(worldProgress, nextWorld.id);
    return {
      kind: unlocked ? 'travel-next' : 'inspect-route',
      title: unlocked ? 'Route plotted' : 'Route still locked',
      detail: unlocked
        ? `Travel onward to ${nextWorld.title}.`
        : `Inspect Route Intel for ${nextRoute?.unlock || 'the missing route clue'}.`,
      actionLabel: unlocked ? 'Open World Map' : 'Open Route Intel',
      actionTarget: unlocked ? 'world-map' : 'route-intel',
    };
  }

  if (nextWorld && canVisitWorld(worldProgress, nextWorld.id)) {
    return {
      kind: 'travel-next',
      title: 'Next sector available',
      detail: `Travel onward to ${nextWorld.title}.`,
      actionLabel: 'Open World Map',
      actionTarget: 'world-map',
    };
  }

  return {
    kind: 'combat-or-archive',
    title: 'Patrol or review intel',
    detail: 'Launch combat for resources, or review the Intel Archive for story clues.',
    actionLabel: 'Launch Combat',
    actionTarget: 'combat',
  };
}
