import assert from 'node:assert/strict';
import {
  INTEL_ENTRIES,
  getIntelEntry,
  intelProgress,
  lockedIntelEntries,
  unlockedIntelEntries,
} from '../hyperblast-shooter/js/intel.js';

assert.equal(INTEL_ENTRIES.length, 5, 'each narrative route clue should have an archive entry');
assert.equal(getIntelEntry('heat-haze-signal').title, 'Heat-Haze Signal');
assert.equal(getIntelEntry('missing'), null);

const empty = { unlockedIntelIds: [] };
assert.deepEqual(intelProgress(empty), { unlocked: 0, total: 5 });
assert.equal(unlockedIntelEntries(empty).length, 0);
assert.equal(lockedIntelEntries(empty).length, 5);

const partial = { unlockedIntelIds: ['heat-haze-signal', 'ancient-lattice-route'] };
assert.deepEqual(intelProgress(partial), { unlocked: 2, total: 5 });
assert.deepEqual(unlockedIntelEntries(partial).map((entry) => entry.id), ['heat-haze-signal', 'ancient-lattice-route']);
assert.equal(lockedIntelEntries(partial).some((entry) => entry.id === 'viper-echo-proof'), true);

console.log('hyperblast intel archive smoke checks passed');
