import { findWorld } from './worlds.js';

export const REPEAT_PATROL_REWARD_RATIO = 0.35;
export const DEFAULT_PATROL_TIER_ID = 'standard';

export const PATROL_TIERS = Object.freeze([
  {
    id: 'recon',
    label: 'Recon',
    killGoalMultiplier: 0.75,
    rewardMultiplier: 0.7,
    description: 'Shorter patrol, lighter payout, useful when you only want a quick sweep.',
  },
  {
    id: 'standard',
    label: 'Standard',
    killGoalMultiplier: 1,
    rewardMultiplier: 1,
    description: 'Baseline patrol contract with the listed world reward.',
  },
  {
    id: 'elite',
    label: 'Elite',
    killGoalMultiplier: 1.35,
    rewardMultiplier: 1.6,
    description: 'Longer patrol pocket with a higher payout for resource runs.',
  },
]);

export const PATROL_CONTRACTS = Object.freeze([
  {
    id: 'patrol-neon-drift',
    worldId: 'neon-drift',
    title: 'Neon Drift Patrol Pocket',
    summary: 'Clear a short rogue scout loop around the Caldera Mile dock.',
    killGoal: 6,
    reward: { money: 70, score: 300 },
  },
  {
    id: 'patrol-ember-belt',
    worldId: 'ember-belt',
    title: 'Ember Belt Heat Sweep',
    summary: 'Hold the thermal gate long enough for Doc to sample clean sensor noise.',
    killGoal: 7,
    reward: { money: 85, score: 380 },
  },
  {
    id: 'patrol-verdant-ion-reef',
    worldId: 'verdant-ion-reef',
    title: 'Ion Reef Defense Pass',
    summary: 'Drive off patrol craft without disturbing the reef lattice.',
    killGoal: 8,
    reward: { money: 100, score: 460 },
  },
  {
    id: 'patrol-violet-singularity',
    worldId: 'violet-singularity',
    title: 'Violet Lens Escort',
    summary: 'Protect the gravity lens array from echo-corrupted interceptors.',
    killGoal: 9,
    reward: { money: 120, score: 540 },
  },
  {
    id: 'patrol-frozen-relay',
    worldId: 'frozen-relay',
    title: 'Frozen Relay Perimeter',
    summary: 'Clear the antenna cathedral perimeter before the archive window closes.',
    killGoal: 10,
    reward: { money: 145, score: 640 },
  },
]);

export function getPatrolContractForWorld(worldId) {
  return PATROL_CONTRACTS.find((contract) => contract.worldId === worldId) || PATROL_CONTRACTS[0];
}

export function getPatrolTier(tierId = DEFAULT_PATROL_TIER_ID) {
  return PATROL_TIERS.find((tier) => tier.id === tierId) || PATROL_TIERS.find((tier) => tier.id === DEFAULT_PATROL_TIER_ID);
}

export function adjustedKillGoal(contract, tierId = DEFAULT_PATROL_TIER_ID) {
  const tier = getPatrolTier(tierId);
  return Math.max(1, Math.round((contract?.killGoal || 1) * tier.killGoalMultiplier));
}

export function scaleReward(reward, multiplier = 1) {
  return {
    money: Math.max(1, Math.round((reward?.money || 0) * multiplier)),
    score: Math.max(1, Math.round((reward?.score || 0) * multiplier)),
  };
}

export function createContractState() {
  return {
    activeContractId: null,
    activeWorldId: null,
    activeTierId: null,
    startedAt: null,
    completedContractIds: [],
  };
}

export function mergeContractState(raw) {
  const base = createContractState();
  if (!raw || typeof raw !== 'object') return base;
  const validContractIds = new Set(PATROL_CONTRACTS.map((contract) => contract.id));
  const validTierIds = new Set(PATROL_TIERS.map((tier) => tier.id));
  const activeContractId = validContractIds.has(raw.activeContractId) ? raw.activeContractId : null;
  const active = activeContractId ? PATROL_CONTRACTS.find((contract) => contract.id === activeContractId) : null;
  return {
    activeContractId,
    activeWorldId: active ? active.worldId : null,
    activeTierId: activeContractId && validTierIds.has(raw.activeTierId) ? raw.activeTierId : null,
    startedAt: activeContractId ? raw.startedAt || null : null,
    completedContractIds: Array.isArray(raw.completedContractIds)
      ? [...new Set(raw.completedContractIds.filter((id) => validContractIds.has(id)))]
      : base.completedContractIds,
  };
}

export function startPatrolContract(worldId, previousState = createContractState(), now = Date.now(), tierId = DEFAULT_PATROL_TIER_ID) {
  const contract = getPatrolContractForWorld(worldId);
  const prior = mergeContractState(previousState);
  return {
    ...prior,
    activeContractId: contract.id,
    activeWorldId: findWorld(worldId).id,
    activeTierId: getPatrolTier(tierId).id,
    startedAt: now,
  };
}

export function cancelActivePatrolContract(contractState) {
  const prior = mergeContractState(contractState);
  return {
    ...prior,
    activeContractId: null,
    activeWorldId: null,
    activeTierId: null,
    startedAt: null,
  };
}

export function isContractActive(contractState) {
  return Boolean(contractState?.activeContractId);
}

export function activeContract(contractState) {
  return contractState?.activeContractId
    ? PATROL_CONTRACTS.find((contract) => contract.id === contractState.activeContractId) || null
    : null;
}

export function activePatrolTier(contractState) {
  return getPatrolTier(contractState?.activeTierId || DEFAULT_PATROL_TIER_ID);
}

export function firstClearPatrolReward(contract, tierId = DEFAULT_PATROL_TIER_ID) {
  return scaleReward(contract?.reward || { money: 0, score: 0 }, getPatrolTier(tierId).rewardMultiplier);
}

export function repeatPatrolReward(contract, tierId = DEFAULT_PATROL_TIER_ID) {
  const firstClear = firstClearPatrolReward(contract, tierId);
  return scaleReward(firstClear, REPEAT_PATROL_REWARD_RATIO);
}

export function rewardForPatrolCompletion(contract, completedNow = true, tierId = DEFAULT_PATROL_TIER_ID) {
  return completedNow ? firstClearPatrolReward(contract, tierId) : repeatPatrolReward(contract, tierId);
}

export function completionKind(completedNow) {
  return completedNow ? 'first-clear' : 'repeat-clear';
}

export function completePatrolContract(contractState) {
  const prior = mergeContractState(contractState);
  const contract = activeContract(prior);
  if (!contract) return { state: prior, contract: null, completedNow: false, reward: { money: 0, score: 0 }, kind: 'none', tier: getPatrolTier() };
  const completed = new Set(prior.completedContractIds || []);
  const completedNow = !completed.has(contract.id);
  completed.add(contract.id);
  const tier = activePatrolTier(prior);
  const reward = rewardForPatrolCompletion(contract, completedNow, tier.id);
  return {
    state: {
      ...prior,
      activeContractId: null,
      activeWorldId: null,
      activeTierId: null,
      startedAt: null,
      completedContractIds: [...completed],
    },
    contract,
    completedNow,
    reward,
    kind: completionKind(completedNow),
    tier,
  };
}

export function contractProgress(kills, contract, tierId = DEFAULT_PATROL_TIER_ID) {
  const killGoal = adjustedKillGoal(contract, tierId);
  const current = Math.max(0, Math.min(killGoal, Number(kills) || 0));
  return {
    current,
    goal: killGoal,
    complete: current >= killGoal,
    label: `${current}/${killGoal}`,
  };
}

export function completedContracts(contractState) {
  const completed = new Set(contractState?.completedContractIds || []);
  return PATROL_CONTRACTS.filter((contract) => completed.has(contract.id));
}

export function isPatrolCompleted(contractState, contractId) {
  return Boolean(contractState?.completedContractIds?.includes(contractId));
}

export function contractRewardSummary(contract, contractState, tierId = DEFAULT_PATROL_TIER_ID) {
  const tier = getPatrolTier(tierId);
  const completed = isPatrolCompleted(contractState, contract.id);
  const nextReward = rewardForPatrolCompletion(contract, !completed, tier.id);
  const firstClearReward = firstClearPatrolReward(contract, tier.id);
  const repeatReward = repeatPatrolReward(contract, tier.id);
  return {
    completed,
    tier,
    killGoal: adjustedKillGoal(contract, tier.id),
    nextReward,
    firstClearReward,
    repeatReward,
    label: completed
      ? `${tier.label} repeat ¤${nextReward.money} · ${nextReward.score} score`
      : `${tier.label} first clear ¤${nextReward.money} · ${nextReward.score} score`,
  };
}

export function contractLogProgress(contractState) {
  return {
    completed: completedContracts(contractState).length,
    total: PATROL_CONTRACTS.length,
  };
}
