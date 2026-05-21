import assert from 'node:assert/strict';
import {
  DEFAULT_PATROL_TIER_ID,
  PATROL_CONTRACTS,
  PATROL_TIERS,
  REPEAT_PATROL_REWARD_RATIO,
  activeContract,
  activePatrolTier,
  adjustedKillGoal,
  cancelActivePatrolContract,
  completePatrolContract,
  completedContracts,
  completionKind,
  contractLogProgress,
  contractProgress,
  contractRewardSummary,
  createContractState,
  firstClearPatrolReward,
  getPatrolContractForWorld,
  getPatrolTier,
  isContractActive,
  mergeContractState,
  repeatPatrolReward,
  rewardForPatrolCompletion,
  startPatrolContract,
} from '../hyperblast-shooter/js/contracts.js';

assert.equal(PATROL_CONTRACTS.length, 5, 'each world should have one patrol combat pocket');
assert.deepEqual(PATROL_TIERS.map((tier) => tier.id), ['recon', 'standard', 'elite']);
assert.equal(DEFAULT_PATROL_TIER_ID, 'standard');
assert.equal(REPEAT_PATROL_REWARD_RATIO, 0.35);
assert.equal(getPatrolContractForWorld('ember-belt').title, 'Ember Belt Heat Sweep');
assert.equal(getPatrolContractForWorld('missing-world').worldId, 'neon-drift');
assert.equal(getPatrolTier('bad-tier').id, 'standard');

const empty = createContractState();
assert.equal(isContractActive(empty), false);
assert.equal(activeContract(empty), null);
assert.deepEqual(contractLogProgress(empty), { completed: 0, total: 5 });

const neon = getPatrolContractForWorld('neon-drift');
assert.equal(adjustedKillGoal(neon, 'recon'), 5);
assert.equal(adjustedKillGoal(neon, 'standard'), 6);
assert.equal(adjustedKillGoal(neon, 'elite'), 8);
assert.deepEqual(firstClearPatrolReward(neon, 'recon'), { money: 49, score: 210 });
assert.deepEqual(firstClearPatrolReward(neon, 'elite'), { money: 112, score: 480 });

const started = startPatrolContract('verdant-ion-reef', empty, 1234, 'elite');
assert.equal(isContractActive(started), true);
assert.equal(started.activeWorldId, 'verdant-ion-reef');
assert.equal(started.activeTierId, 'elite');
assert.equal(activePatrolTier(started).id, 'elite');
assert.equal(activeContract(started).id, 'patrol-verdant-ion-reef');
assert.equal(started.startedAt, 1234);

assert.deepEqual(contractProgress(0, activeContract(started), 'elite'), { current: 0, goal: 11, complete: false, label: '0/11' });
assert.deepEqual(contractProgress(99, activeContract(started), 'elite'), { current: 11, goal: 11, complete: true, label: '11/11' });

const contract = activeContract(started);
assert.deepEqual(rewardForPatrolCompletion(contract, true, 'standard'), contract.reward);
assert.deepEqual(rewardForPatrolCompletion(contract, true, 'elite'), { money: 160, score: 736 });
assert.deepEqual(repeatPatrolReward(contract, 'standard'), { money: 35, score: 161 });
assert.deepEqual(rewardForPatrolCompletion(contract, false, 'standard'), { money: 35, score: 161 });
assert.deepEqual(rewardForPatrolCompletion(contract, false, 'elite'), { money: 56, score: 258 });
assert.equal(completionKind(true), 'first-clear');
assert.equal(completionKind(false), 'repeat-clear');

const completed = completePatrolContract(started);
assert.equal(completed.completedNow, true);
assert.equal(completed.kind, 'first-clear');
assert.equal(completed.tier.id, 'elite');
assert.deepEqual(completed.reward, { money: 160, score: 736 });
assert.equal(completed.contract.id, 'patrol-verdant-ion-reef');
assert.equal(isContractActive(completed.state), false);
assert.deepEqual(completed.state.completedContractIds, ['patrol-verdant-ion-reef']);
assert.deepEqual(completedContracts(completed.state).map((item) => item.id), ['patrol-verdant-ion-reef']);
assert.deepEqual(contractLogProgress(completed.state), { completed: 1, total: 5 });
assert.equal(contractRewardSummary(contract, completed.state).completed, true);
assert.deepEqual(contractRewardSummary(contract, completed.state).nextReward, { money: 35, score: 161 });
assert.match(contractRewardSummary(contract, completed.state).label, /^Standard repeat/);
assert.match(contractRewardSummary(contract, completed.state, 'elite').label, /^Elite repeat/);

const replay = completePatrolContract(startPatrolContract('verdant-ion-reef', completed.state, 4321, 'standard'));
assert.equal(replay.completedNow, false);
assert.equal(replay.kind, 'repeat-clear');
assert.deepEqual(replay.reward, { money: 35, score: 161 }, 'repeat patrols should pay the reduced repeat reward');
assert.deepEqual(replay.state.completedContractIds, ['patrol-verdant-ion-reef']);

const restarted = startPatrolContract('ember-belt', completed.state, 4567);
assert.equal(restarted.activeContractId, 'patrol-ember-belt');
assert.equal(restarted.activeTierId, 'standard');
assert.deepEqual(restarted.completedContractIds, ['patrol-verdant-ion-reef'], 'starting another patrol should preserve completed patrol history');
const cancelled = cancelActivePatrolContract(restarted);
assert.equal(cancelled.activeContractId, null);
assert.equal(cancelled.activeTierId, null);
assert.deepEqual(cancelled.completedContractIds, ['patrol-verdant-ion-reef'], 'canceling active patrol should preserve completed patrol history');

const merged = mergeContractState({ activeContractId: 'patrol-neon-drift', activeTierId: 'elite', completedContractIds: ['patrol-ember-belt', 'bad-id', 'patrol-ember-belt'], startedAt: 99 });
assert.equal(merged.activeContractId, 'patrol-neon-drift');
assert.equal(merged.activeTierId, 'elite');
assert.equal(merged.activeWorldId, 'neon-drift');
assert.deepEqual(merged.completedContractIds, ['patrol-ember-belt']);

console.log('hyperblast patrol contract smoke checks passed');
