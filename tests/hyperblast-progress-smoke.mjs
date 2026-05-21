import assert from 'node:assert/strict';
import {
  PROGRESS_SCHEMA_VERSION,
  createProgressSave,
  createProgressSettings,
  formatSaveTime,
  progressMeta,
  summarizeProgress,
} from '../hyperblast-shooter/js/progress.js';
import { createQuestState, applyPuzzleQuestCompletion } from '../hyperblast-shooter/js/quests.js';
import { applyQuestUnlocks, createWorldProgress } from '../hyperblast-shooter/js/worlds.js';

const questState = applyPuzzleQuestCompletion(createQuestState(), 'ember-belt-thermal-filter').state;
const worldProgress = applyQuestUnlocks(createWorldProgress(), questState);
const savedAt = '2026-05-20T01:00:00.000Z';
const save = createProgressSave({ worldProgress, questState, settings: { selectedPatrolTierId: 'elite' }, savedAt });

assert.equal(save.meta.schemaVersion, PROGRESS_SCHEMA_VERSION);
assert.equal(save.meta.savedAt, savedAt);
assert.equal(save.worldProgress.unlockedRouteIds.includes('route-ember-reef'), true);
assert.deepEqual(save.settings, { selectedPatrolTierId: 'elite' });
assert.deepEqual(createProgressSettings(), { selectedPatrolTierId: 'standard' });
assert.deepEqual(progressMeta(save), { schemaVersion: PROGRESS_SCHEMA_VERSION, savedAt });
assert.deepEqual(progressMeta({}), { schemaVersion: 1, savedAt: null });

const summary = summarizeProgress({ worldProgress, questState, routeTotal: 4, intelTotal: 5, chapterTotal: 5 });
assert.equal(summary.unlockedRoutes, 2);
assert.equal(summary.routeTotal, 4);
assert.equal(summary.discoveredWorlds, 3);
assert.equal(summary.decodedIntel, 1);
assert.equal(summary.completedQuests, 1);
assert.equal(summary.chapterTotal, 5);
assert.equal(formatSaveTime(null), 'not saved yet');
assert.equal(formatSaveTime('not-a-date'), 'unknown save time');
assert.notEqual(formatSaveTime(savedAt), 'unknown save time');

console.log('hyperblast progress smoke checks passed');
