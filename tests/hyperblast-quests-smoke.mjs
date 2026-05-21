import assert from 'node:assert/strict';
import {
  QUESTS,
  acceptQuest,
  applyPuzzleQuestCompletion,
  createQuestState,
  getQuestForPuzzle,
  mergeQuestState,
  questProgress,
  questsForWorld,
} from '../hyperblast-shooter/js/quests.js';

assert.equal(QUESTS.length, 5, 'each core world should have one seeded side quest');
assert.equal(questsForWorld('verdant-ion-reef').length, 1);
assert.equal(getQuestForPuzzle('verdant-ion-reef-resonance').id, 'map-ion-reef-pulse');

const initial = createQuestState();
assert.equal(initial.questStatusById['trace-drift-beacons'], 'active', 'first quest should be active as onboarding');
assert.equal(initial.questStatusById['map-ion-reef-pulse'], 'available');

const accepted = acceptQuest(initial, 'map-ion-reef-pulse');
assert.equal(accepted.questStatusById['map-ion-reef-pulse'], 'active');
assert.equal(initial.questStatusById['map-ion-reef-pulse'], 'available', 'acceptQuest should be immutable');

const result = applyPuzzleQuestCompletion(accepted, 'verdant-ion-reef-resonance');
assert.equal(result.completedNow, true);
assert.equal(result.quest.id, 'map-ion-reef-pulse');
assert.equal(result.state.questStatusById['map-ion-reef-pulse'], 'complete');
assert.ok(result.state.completedObjectiveIds.includes('quest:map-ion-reef-pulse:puzzle:verdant-ion-reef-resonance'));
assert.ok(result.state.unlockedIntelIds.includes('ancient-lattice-route'));
assert.equal(questProgress(result.state, result.quest).objectiveComplete, true);

const second = applyPuzzleQuestCompletion(result.state, 'verdant-ion-reef-resonance');
assert.equal(second.completedNow, false, 're-solving a completed quest should not grant quest reward again');

const merged = mergeQuestState({ questStatusById: { 'cool-ember-noise': 'active' }, completedObjectiveIds: ['x'], unlockedIntelIds: ['y'] });
assert.equal(merged.questStatusById['cool-ember-noise'], 'active');
assert.equal(merged.questStatusById['trace-drift-beacons'], 'active');
assert.deepEqual(merged.completedObjectiveIds, ['x']);
assert.deepEqual(merged.unlockedIntelIds, ['y']);

console.log('hyperblast quest smoke checks passed');
