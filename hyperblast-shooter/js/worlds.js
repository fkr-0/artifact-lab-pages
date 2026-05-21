export const WORLD_NODES = Object.freeze([
  {
    id: 'neon-drift',
    title: 'Neon Drift Lanes',
    stage: 1,
    themeName: 'Neon Drift',
    objective: 'Trace distress beacons and decode the first rogue formation pattern.',
    safeZone: true,
  },
  {
    id: 'ember-belt',
    title: 'Ember Belt',
    stage: 2,
    themeName: 'Ember Belt',
    objective: 'Tune heat-distorted sensors and locate the source of the first Unknown signal.',
    safeZone: true,
  },
  {
    id: 'verdant-ion-reef',
    title: 'Verdant Ion Reef',
    stage: 3,
    themeName: 'Verdant Ion Reef',
    objective: 'Map ancient ion pulses without waking the reef defense lattice.',
    safeZone: true,
  },
  {
    id: 'violet-singularity',
    title: 'Violet Singularity',
    stage: 4,
    themeName: 'Violet Singularity',
    objective: 'Align gravity lenses and confirm whether Viper is still broadcasting.',
    safeZone: true,
  },
  {
    id: 'frozen-relay',
    title: 'Frozen Relay',
    stage: 5,
    themeName: 'Frozen Relay',
    objective: 'Reconstruct relay archives and decide which warnings to trust.',
    safeZone: true,
  },
]);

export const WORLD_ROUTES = Object.freeze([
  {
    id: 'route-neon-ember',
    from: 'neon-drift',
    to: 'ember-belt',
    unlock: null,
    label: 'Caldera Mile drift corridor',
  },
  {
    id: 'route-ember-reef',
    from: 'ember-belt',
    to: 'verdant-ion-reef',
    unlock: 'heat-haze-signal',
    label: 'Filtered Unknown signal path',
  },
  {
    id: 'route-reef-violet',
    from: 'verdant-ion-reef',
    to: 'violet-singularity',
    unlock: 'ancient-lattice-route',
    label: 'Ancient ion lattice route',
  },
  {
    id: 'route-violet-frozen',
    from: 'violet-singularity',
    to: 'frozen-relay',
    unlock: 'viper-echo-proof',
    label: 'Viper echo relay trace',
  },
]);

const STARTING_WORLD_IDS = Object.freeze(['neon-drift', 'ember-belt']);
const STARTING_ROUTE_IDS = Object.freeze(['route-neon-ember']);

export function createWorldProgress() {
  return {
    currentWorldId: WORLD_NODES[0].id,
    discoveredWorldIds: [...STARTING_WORLD_IDS],
    unlockedRouteIds: [...STARTING_ROUTE_IDS],
    completedObjectiveIds: [],
    activeQuestIds: [],
  };
}

export function findWorld(worldId) {
  return WORLD_NODES.find((world) => world.id === worldId) || WORLD_NODES[0];
}

export function getRouteToWorld(worldId) {
  return WORLD_ROUTES.find((route) => route.to === worldId) || null;
}

export function routeUnlockHint(worldId) {
  const route = getRouteToWorld(worldId);
  if (!route) return 'starting sector';
  return route.unlock ? `requires ${route.unlock}` : route.label;
}

export function canVisitWorld(progress, worldId) {
  return Boolean(progress?.discoveredWorldIds?.includes(worldId));
}

export function mergeWorldProgress(raw) {
  const base = createWorldProgress();
  if (!raw || typeof raw !== 'object') return base;
  return {
    currentWorldId: raw.currentWorldId && findWorld(raw.currentWorldId).id === raw.currentWorldId
      ? raw.currentWorldId
      : base.currentWorldId,
    discoveredWorldIds: Array.isArray(raw.discoveredWorldIds)
      ? [...new Set([...base.discoveredWorldIds, ...raw.discoveredWorldIds])]
      : base.discoveredWorldIds,
    unlockedRouteIds: Array.isArray(raw.unlockedRouteIds)
      ? [...new Set([...base.unlockedRouteIds, ...raw.unlockedRouteIds])]
      : base.unlockedRouteIds,
    completedObjectiveIds: Array.isArray(raw.completedObjectiveIds) ? raw.completedObjectiveIds : base.completedObjectiveIds,
    activeQuestIds: Array.isArray(raw.activeQuestIds) ? raw.activeQuestIds : base.activeQuestIds,
  };
}

export function applyQuestUnlocks(progress, questState) {
  const unlockedIntelIds = new Set(questState?.unlockedIntelIds || []);
  const discoveredWorldIds = new Set(progress?.discoveredWorldIds || []);
  const unlockedRouteIds = new Set(progress?.unlockedRouteIds || []);

  for (const route of WORLD_ROUTES) {
    if (!route.unlock || unlockedIntelIds.has(route.unlock)) {
      unlockedRouteIds.add(route.id);
      discoveredWorldIds.add(route.from);
      discoveredWorldIds.add(route.to);
    }
  }

  return {
    ...mergeWorldProgress(progress),
    discoveredWorldIds: [...discoveredWorldIds],
    unlockedRouteIds: [...unlockedRouteIds],
  };
}

export function visitWorld(progress, worldId) {
  if (!canVisitWorld(progress, worldId)) return { progress, world: findWorld(progress?.currentWorldId), visited: false };
  return {
    progress: {
      ...progress,
      currentWorldId: worldId,
    },
    world: findWorld(worldId),
    visited: true,
  };
}
