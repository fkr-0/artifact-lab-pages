import assert from 'node:assert/strict';
import { packetAudioTime } from '../src/core/scheduler.js';

const context = { currentTime: 10 };
const future = packetAudioTime(context, { dueAt: Date.now() + 250 }, 0.01);
assert.ok(future > 10.05 && future < 10.5);
assert.equal(packetAudioTime(context, { audioTime: 12 }), 12);
assert.equal(packetAudioTime(context, { at: 11 }), 11);
assert.ok(packetAudioTime(context, { dueAt: Date.now() - 500 }, 0.02) >= 10.02);
console.log('scheduler smoke ok');
