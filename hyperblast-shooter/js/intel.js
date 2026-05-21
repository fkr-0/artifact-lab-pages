export const INTEL_ENTRIES = Object.freeze([
  {
    id: 'caldera-mile-lead',
    title: 'Caldera Mile Lead',
    worldId: 'neon-drift',
    source: 'COMMAND',
    summary: 'Beacon timing proves the rogue ships were not drifting randomly; something is scheduling patrol windows through the Caldera Mile toll arch.',
  },
  {
    id: 'heat-haze-signal',
    title: 'Heat-Haze Signal',
    worldId: 'ember-belt',
    source: 'DOC',
    summary: 'A clean carrier emerges below the Ember Belt noise floor. It is not Command-band, and it points toward the Verdant Ion Reef.',
  },
  {
    id: 'ancient-lattice-route',
    title: 'Ancient Lattice Route',
    worldId: 'verdant-ion-reef',
    source: 'UNKNOWN',
    summary: 'The reef pulse maps to a route lattice older than the rogue fleet. Viper appears to have used it as a shortcut, or a containment line.',
  },
  {
    id: 'viper-echo-proof',
    title: 'Viper Echo Proof',
    worldId: 'violet-singularity',
    source: 'COMMAND',
    summary: 'The gravity lens confirms Viper is broadcasting through time-slip echo. The timestamp is wrong, but the command signature is real.',
  },
  {
    id: 'relay-warning-fragment',
    title: 'Relay Warning Fragment',
    worldId: 'frozen-relay',
    source: 'DOC',
    summary: 'The Frozen Relay archive contains a warning older than Viper. Someone sealed this route before the rogue fleet ever arrived.',
  },
]);

export function getIntelEntry(intelId) {
  return INTEL_ENTRIES.find((entry) => entry.id === intelId) || null;
}

export function unlockedIntelEntries(questState) {
  const unlocked = new Set(questState?.unlockedIntelIds || []);
  return INTEL_ENTRIES.filter((entry) => unlocked.has(entry.id));
}

export function lockedIntelEntries(questState) {
  const unlocked = new Set(questState?.unlockedIntelIds || []);
  return INTEL_ENTRIES.filter((entry) => !unlocked.has(entry.id));
}

export function intelProgress(questState) {
  return {
    unlocked: unlockedIntelEntries(questState).length,
    total: INTEL_ENTRIES.length,
  };
}
