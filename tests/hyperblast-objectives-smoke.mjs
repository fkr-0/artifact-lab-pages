import assert from 'node:assert/strict';
import { currentWorldObjective } from '../hyperblast-shooter/js/objectives.js';
import { acceptQuest, applyPuzzleQuestCompletion, createQuestState } from '../hyperblast-shooter/js/quests.js';
import { applyQuestUnlocks, createWorldProgress, visitWorld } from '../hyperblast-shooter/js/worlds.js';

let worldProgress = createWorldProgress();
let questState = createQuestState();

assert.equal(currentWorldObjective(worldProgress, questState).kind, 'solve-puzzle', 'first quest starts active and should guide to puzzle');

worldProgress = visitWorld(worldProgress, 'ember-belt').progress;
assert.equal(currentWorldObjective(worldProgress, questState).kind, 'accept-quest', 'available local quest should guide to Local Signals');

questState = acceptQuest(questState, 'cool-ember-noise');
assert.equal(currentWorldObjective(worldProgress, questState).kind, 'solve-puzzle');
assert.equal(currentWorldObjective(worldProgress, questState).actionTarget, 'signal-puzzle');

questState = applyPuzzleQuestCompletion(questState, 'ember-belt-thermal-filter').state;
worldProgress = applyQuestUnlocks(worldProgress, questState);
const afterQuest = currentWorldObjective(worldProgress, questState);
assert.equal(afterQuest.kind, 'travel-next');
assert.equal(afterQuest.actionTarget, 'world-map');
assert.match(afterQuest.detail, /Verdant Ion Reef/);

console.log('hyperblast objective helper smoke checks passed');
