import assert from 'node:assert/strict';
import {
  LOCAL_SIGNALS,
  getSignal,
  signalLinesForState,
  signalStatus,
  signalsForWorld,
} from '../hyperblast-shooter/js/signals.js';
import { acceptQuest, applyPuzzleQuestCompletion, createQuestState } from '../hyperblast-shooter/js/quests.js';

assert.equal(LOCAL_SIGNALS.length, 5, 'each core world should have one local signal conversation seed');
assert.equal(signalsForWorld('verdant-ion-reef')[0].id, 'reef-whisper');
assert.equal(getSignal('reef-whisper').speaker, 'UNKNOWN');

const signal = getSignal('reef-whisper');
const initial = createQuestState();
assert.equal(signalStatus(signal, initial), 'available');
assert.match(signalLinesForState(signal, initial).join(' '), /reef is a lock/i);

const accepted = acceptQuest(initial, signal.questId);
assert.equal(signalStatus(signal, accepted), 'active');
assert.match(signalLinesForState(signal, accepted).join(' '), /Match it/i);

const completed = applyPuzzleQuestCompletion(accepted, 'verdant-ion-reef-resonance').state;
assert.equal(signalStatus(signal, completed), 'complete');
assert.match(signalLinesForState(signal, completed).join(' '), /Ancient energy/i);

console.log('hyperblast local signal smoke checks passed');
