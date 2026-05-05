import assert from 'node:assert/strict';
import { makeDefaultSequencer, applySeqOp, makeSeqOp, activeEventsForStep, swingOffsetMs } from '../../app-hub/lib/sequencer-core.js';
const seq = makeDefaultSequencer('v2');
applySeqOp(seq, makeSeqOp(seq, 'probability', { trackId:'hat', probability:0 }, 't'));
assert.equal(seq.tracks.find(t=>t.id==='hat').probability, 0);
assert.equal(activeEventsForStep(seq, 0, () => 0.5).some(e => e.id === 'hat'), false);
applySeqOp(seq, makeSeqOp(seq, 'swing', { swing:0.5 }, 't'));
assert.equal(swingOffsetMs(seq, 1, 100), 50);
console.log('sequencer v2 smoke ok');
