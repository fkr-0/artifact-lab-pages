import assert from 'node:assert/strict';
import {
  MILESTONES,
  lockedMilestones,
  milestoneProgress,
  unlockedMilestones,
} from '../hyperblast-shooter/js/milestones.js';
import { applyPuzzleQuestCompletion, createQuestState } from '../hyperblast-shooter/js/quests.js';
import { applyQuestUnlocks, createWorldProgress } from '../hyperblast-shooter/js/worlds.js';

assert.equal(MILESTONES.length, 7, 'milestone list should stay compact and HUD-friendly');

let questState = createQuestState();
let worldProgress = createWorldProgress();
let progress = milestoneProgress(worldProgress, questState);
assert.equal(progress.unlocked, 1, 'initial dock milestone should be unlocked');
assert.deepEqual(progress.unlockedIds, ['first-dock']);
assert.equal(lockedMilestones(worldProgress, questState).some((milestone) => milestone.id === 'first-shortcut'), true);

questState = applyPuzzleQuestCompletion(questState, 'ember-belt-thermal-filter').state;
worldProgress = applyQuestUnlocks(worldProgress, questState);
progress = milestoneProgress(worldProgress, questState);
assert.equal(progress.unlockedIds.includes('first-shortcut'), true);
assert.equal(progress.unlockedIds.includes('first-intel'), true);
assert.equal(progress.unlockedIds.includes('first-chapter'), true);
assert.equal(progress.unlockedIds.includes('reef-access'), true);
assert.equal(unlockedMilestones(worldProgress, questState).length, progress.unlocked);

questState = applyPuzzleQuestCompletion(questState, 'verdant-ion-reef-resonance').state;
questState = applyPuzzleQuestCompletion(questState, 'violet-singularity-lens').state;
worldProgress = applyQuestUnlocks(worldProgress, questState);
assert.equal(milestoneProgress(worldProgress, questState).unlockedIds.includes('relay-bound'), true);

console.log('hyperblast milestones smoke checks passed');
