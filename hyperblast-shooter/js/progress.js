export const PROGRESS_STORAGE_KEY = 'hyperblast-shooter-progress-v1';
export const PROGRESS_SCHEMA_VERSION = 3;

export function createProgressSettings(raw = {}) {
  return {
    selectedPatrolTierId: raw?.selectedPatrolTierId || 'standard',
  };
}

export function createProgressSave({ worldProgress, questState, contractState, settings, savedAt = new Date().toISOString() }) {
  return {
    meta: {
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      savedAt,
    },
    worldProgress,
    questState,
    contractState,
    settings: createProgressSettings(settings),
  };
}

export function progressMeta(raw) {
  return {
    schemaVersion: Number(raw?.meta?.schemaVersion) || 1,
    savedAt: raw?.meta?.savedAt || null,
  };
}

export function summarizeProgress({ worldProgress, questState, routeTotal = 0, intelTotal = 0, chapterTotal = 0 } = {}) {
  const unlockedRoutes = worldProgress?.unlockedRouteIds?.length || 0;
  const discoveredWorlds = worldProgress?.discoveredWorldIds?.length || 0;
  const decodedIntel = questState?.unlockedIntelIds?.length || 0;
  const completedQuests = Object.values(questState?.questStatusById || {}).filter((status) => status === 'complete').length;
  return {
    unlockedRoutes,
    routeTotal,
    discoveredWorlds,
    decodedIntel,
    intelTotal,
    completedQuests,
    chapterTotal,
  };
}

export function formatSaveTime(savedAt) {
  if (!savedAt) return 'not saved yet';
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'unknown save time';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
