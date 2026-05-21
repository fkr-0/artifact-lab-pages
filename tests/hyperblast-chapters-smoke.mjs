import assert from 'node:assert/strict';
import { STORY_CHAPTERS, chapterProgress, chapterStatus, getChapterForWorld } from '../hyperblast-shooter/js/chapters.js';
import { createQuestState, applyPuzzleQuestCompletion } from '../hyperblast-shooter/js/quests.js';
import { applyQuestUnlocks, createWorldProgress, visitWorld } from '../hyperblast-shooter/js/worlds.js';

assert.equal(STORY_CHAPTERS.length, 5, 'story should expose five core chapter beats');
assert.equal(getChapterForWorld('verdant-ion-reef').title, 'Chapter 3: Ancient Lattice');

const questState = createQuestState();
const worldProgress = createWorldProgress();
const neon = getChapterForWorld('neon-drift');
const ember = getChapterForWorld('ember-belt');
const reef = getChapterForWorld('verdant-ion-reef');

assert.equal(chapterStatus(neon, worldProgress, questState), 'current');
assert.equal(chapterStatus(ember, worldProgress, questState), 'available');
assert.equal(chapterStatus(reef, worldProgress, questState), 'locked');

const afterEmberQuest = applyPuzzleQuestCompletion(questState, 'ember-belt-thermal-filter').state;
const unlockedWorldProgress = applyQuestUnlocks(worldProgress, afterEmberQuest);
assert.equal(chapterStatus(reef, unlockedWorldProgress, afterEmberQuest), 'available');
assert.equal(chapterStatus(ember, visitWorld(unlockedWorldProgress, 'ember-belt').progress, afterEmberQuest), 'complete');

const progress = chapterProgress(unlockedWorldProgress, afterEmberQuest);
assert.equal(progress.total, 5);
assert.equal(progress.discovered, 3);
assert.equal(progress.complete, 1);

console.log('hyperblast chapter smoke checks passed');
