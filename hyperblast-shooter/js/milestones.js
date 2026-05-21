import { chapterProgress } from './chapters.js';
import { intelProgress } from './intel.js';

export const MILESTONES = Object.freeze([
  {
    id: 'first-dock',
    title: 'Safe Dock Found',
    description: 'Reach any explorable world dock.',
    test: ({ worldProgress }) => Boolean(worldProgress?.currentWorldId),
  },
  {
    id: 'first-shortcut',
    title: 'Shortcut Cartographer',
    description: 'Plot a second route beyond the starting corridor.',
    test: ({ worldProgress }) => (worldProgress?.unlockedRouteIds?.length || 0) >= 2,
  },
  {
    id: 'first-intel',
    title: 'Signal Archivist',
    description: 'Decode the first readable Intel Archive entry.',
    test: ({ questState }) => intelProgress(questState).unlocked >= 1,
  },
  {
    id: 'first-chapter',
    title: 'Chapter Closed',
    description: 'Complete the first story chapter beat.',
    test: ({ worldProgress, questState }) => chapterProgress(worldProgress, questState).complete >= 1,
  },
  {
    id: 'reef-access',
    title: 'Reef Route Open',
    description: 'Discover the path to Verdant Ion Reef.',
    test: ({ worldProgress }) => Boolean(worldProgress?.discoveredWorldIds?.includes('verdant-ion-reef')),
  },
  {
    id: 'relay-bound',
    title: 'Relay Bound',
    description: 'Open the route toward Frozen Relay.',
    test: ({ worldProgress }) => Boolean(worldProgress?.discoveredWorldIds?.includes('frozen-relay')),
  },
  {
    id: 'archive-complete',
    title: 'Archive Complete',
    description: 'Decode every major Intel Archive entry.',
    test: ({ questState }) => {
      const progress = intelProgress(questState);
      return progress.total > 0 && progress.unlocked === progress.total;
    },
  },
]);

export function unlockedMilestones(worldProgress, questState) {
  return MILESTONES.filter((milestone) => milestone.test({ worldProgress, questState }));
}

export function lockedMilestones(worldProgress, questState) {
  const unlocked = new Set(unlockedMilestones(worldProgress, questState).map((milestone) => milestone.id));
  return MILESTONES.filter((milestone) => !unlocked.has(milestone.id));
}

export function milestoneProgress(worldProgress, questState) {
  const unlocked = unlockedMilestones(worldProgress, questState);
  return {
    unlocked: unlocked.length,
    total: MILESTONES.length,
    unlockedIds: unlocked.map((milestone) => milestone.id),
  };
}
