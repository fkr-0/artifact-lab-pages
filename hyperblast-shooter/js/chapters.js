import { WORLD_NODES } from './worlds.js';
import { questsForWorld, questProgress } from './quests.js';

export const STORY_CHAPTERS = Object.freeze([
  {
    id: 'chapter-neon-drift',
    worldId: 'neon-drift',
    title: 'Chapter 1: Patrol Anomaly',
    beat: 'First distress route and proof that the rogue ships are coordinated.',
    goal: 'Decode the Caldera Mile beacon pattern.',
  },
  {
    id: 'chapter-ember-belt',
    worldId: 'ember-belt',
    title: 'Chapter 2: Heat-Haze Signal',
    beat: 'The mission slows down long enough to separate a real signal from thermal noise.',
    goal: 'Filter the Unknown burst and unlock the route toward the reef.',
  },
  {
    id: 'chapter-verdant-ion-reef',
    worldId: 'verdant-ion-reef',
    title: 'Chapter 3: Ancient Lattice',
    beat: 'The reef is revealed as an engineered route lattice, not a natural anomaly.',
    goal: 'Map the reef pulse without waking the defense lattice.',
  },
  {
    id: 'chapter-violet-singularity',
    worldId: 'violet-singularity',
    title: 'Chapter 4: Viper Echo',
    beat: 'Gravity lensing confirms Viper is broadcasting through a time-slip echo.',
    goal: 'Align the lens and verify the command signature.',
  },
  {
    id: 'chapter-frozen-relay',
    worldId: 'frozen-relay',
    title: 'Chapter 5: Relay Warning',
    beat: 'The old relay archive implies the deeper threat predates Viper.',
    goal: 'Restore the frozen archive and authenticate the warning fragment.',
  },
]);

export function getChapterForWorld(worldId) {
  return STORY_CHAPTERS.find((chapter) => chapter.worldId === worldId) || STORY_CHAPTERS[0];
}

export function chapterStatus(chapter, worldProgress, questState) {
  const discovered = Boolean(worldProgress?.discoveredWorldIds?.includes(chapter.worldId));
  if (!discovered) return 'locked';
  const worldQuests = questsForWorld(chapter.worldId);
  const complete = worldQuests.length > 0 && worldQuests.every((quest) => questProgress(questState, quest).status === 'complete');
  if (complete) return 'complete';
  if (worldProgress?.currentWorldId === chapter.worldId) return 'current';
  return 'available';
}

export function chapterProgress(worldProgress, questState) {
  const chapters = STORY_CHAPTERS.map((chapter) => ({
    ...chapter,
    status: chapterStatus(chapter, worldProgress, questState),
  }));
  return {
    chapters,
    complete: chapters.filter((chapter) => chapter.status === 'complete').length,
    discovered: chapters.filter((chapter) => chapter.status !== 'locked').length,
    total: chapters.length,
  };
}
