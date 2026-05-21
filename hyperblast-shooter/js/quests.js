export const QUESTS = Object.freeze([
  {
    id: 'trace-drift-beacons',
    title: 'Trace the Drift Beacons',
    worldId: 'neon-drift',
    giver: 'COMMAND',
    summary: 'Stabilize the Neon Drift distress route and prove the rogue ships are coordinating.',
    objectiveText: 'Solve Beacon Triangulation in Neon Drift.',
    puzzleId: 'neon-drift-beacon-triangulation',
    reward: { money: 40, unlock: 'caldera-mile-lead' },
  },
  {
    id: 'cool-ember-noise',
    title: 'Cool the Ember Noise',
    worldId: 'ember-belt',
    giver: 'DOC',
    summary: 'Filter thermal interference so Doc can isolate the Unknown signal burst.',
    objectiveText: 'Solve Thermal Noise Filter in Ember Belt.',
    puzzleId: 'ember-belt-thermal-filter',
    reward: { money: 50, unlock: 'heat-haze-signal' },
  },
  {
    id: 'map-ion-reef-pulse',
    title: 'Map the Ion Reef Pulse',
    worldId: 'verdant-ion-reef',
    giver: 'UNKNOWN',
    summary: 'The reef is not natural. Lock its pulse without waking the defense lattice.',
    objectiveText: 'Solve Reef Resonance Lock in Verdant Ion Reef.',
    puzzleId: 'verdant-ion-reef-resonance',
    reward: { money: 65, unlock: 'ancient-lattice-route' },
  },
  {
    id: 'align-violet-lens',
    title: 'Align the Violet Lens',
    worldId: 'violet-singularity',
    giver: 'COMMAND',
    summary: 'Use gravity lensing to verify Viper’s time-slip broadcast.',
    objectiveText: 'Solve Gravity Lens Alignment in Violet Singularity.',
    puzzleId: 'violet-singularity-lens',
    reward: { money: 75, unlock: 'viper-echo-proof' },
  },
  {
    id: 'restore-frozen-archive',
    title: 'Restore the Frozen Archive',
    worldId: 'frozen-relay',
    giver: 'DOC',
    summary: 'Recover the old relay archive and authenticate the warning below the ice.',
    objectiveText: 'Solve Frozen Relay Archive in Frozen Relay.',
    puzzleId: 'frozen-relay-archive',
    reward: { money: 90, unlock: 'relay-warning-fragment' },
  },
]);

export function createQuestState() {
  return {
    questStatusById: Object.fromEntries(QUESTS.map((quest, index) => [quest.id, index === 0 ? 'active' : 'available'])),
    completedObjectiveIds: [],
    unlockedIntelIds: [],
  };
}

export function getQuestForPuzzle(puzzleId) {
  return QUESTS.find((quest) => quest.puzzleId === puzzleId) || null;
}

export function questsForWorld(worldId) {
  return QUESTS.filter((quest) => quest.worldId === worldId);
}

export function acceptQuest(state, questId) {
  const quest = QUESTS.find((item) => item.id === questId);
  if (!quest) return state;
  const status = state.questStatusById?.[questId];
  if (status && status !== 'available') return state;
  return {
    ...state,
    questStatusById: {
      ...state.questStatusById,
      [questId]: 'active',
    },
  };
}

export function applyPuzzleQuestCompletion(state, puzzleId) {
  const quest = getQuestForPuzzle(puzzleId);
  if (!quest) return { state, quest: null, completedNow: false };
  const objectiveId = `quest:${quest.id}:puzzle:${puzzleId}`;
  const completedObjectiveIds = new Set(state.completedObjectiveIds || []);
  const unlockedIntelIds = new Set(state.unlockedIntelIds || []);
  const alreadyComplete = state.questStatusById?.[quest.id] === 'complete';
  completedObjectiveIds.add(objectiveId);
  unlockedIntelIds.add(quest.reward.unlock);
  const nextState = {
    ...state,
    completedObjectiveIds: [...completedObjectiveIds],
    unlockedIntelIds: [...unlockedIntelIds],
    questStatusById: {
      ...state.questStatusById,
      [quest.id]: 'complete',
    },
  };
  return { state: nextState, quest, completedNow: !alreadyComplete };
}

export function questProgress(state, quest) {
  const status = state.questStatusById?.[quest.id] || 'available';
  const objectiveId = `quest:${quest.id}:puzzle:${quest.puzzleId}`;
  return {
    status,
    objectiveComplete: Boolean(state.completedObjectiveIds?.includes(objectiveId)),
    objectiveId,
  };
}

export function mergeQuestState(raw) {
  const base = createQuestState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    questStatusById: { ...base.questStatusById, ...(raw.questStatusById || {}) },
    completedObjectiveIds: Array.isArray(raw.completedObjectiveIds) ? raw.completedObjectiveIds : base.completedObjectiveIds,
    unlockedIntelIds: Array.isArray(raw.unlockedIntelIds) ? raw.unlockedIntelIds : base.unlockedIntelIds,
  };
}
