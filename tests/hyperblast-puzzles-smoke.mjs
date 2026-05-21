import assert from 'node:assert/strict';
import {
  SIGNAL_PUZZLES,
  evaluateSignalPuzzle,
  getSignalPuzzleForWorld,
  isPuzzleSolved,
  markPuzzleSolved,
} from '../hyperblast-shooter/js/puzzles.js';
import { createWorldProgress } from '../hyperblast-shooter/js/worlds.js';

assert.equal(SIGNAL_PUZZLES.length, 5, 'each core world should have a signal puzzle seed');
assert.equal(getSignalPuzzleForWorld('neon-drift').id, 'neon-drift-beacon-triangulation');

const puzzle = getSignalPuzzleForWorld('frozen-relay');
assert.equal(evaluateSignalPuzzle({ frequency: 189, phase: 73, glyph: 'relay' }, puzzle).solved, true, 'matching target should solve regardless of glyph case');
const near = evaluateSignalPuzzle({ frequency: 188, phase: 74, glyph: 'RELAY' }, puzzle);
assert.equal(near.solved, true, 'one-step tuning tolerance should count as locked');
const bad = evaluateSignalPuzzle({ frequency: 100, phase: 1, glyph: 'NOPE' }, puzzle);
assert.equal(bad.solved, false);
assert.equal(bad.glyphSolved, false);

const progress = createWorldProgress();
assert.equal(isPuzzleSolved(progress, puzzle.id), false);
const nextProgress = markPuzzleSolved(progress, puzzle.id);
assert.equal(isPuzzleSolved(nextProgress, puzzle.id), true);
assert.equal(isPuzzleSolved(progress, puzzle.id), false, 'markPuzzleSolved should be immutable');

console.log('hyperblast signal puzzle smoke checks passed');
