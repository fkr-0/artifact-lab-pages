import assert from 'node:assert/strict';
import { BasicSequencerModule, ArrangerModule, ArpMidiGeneratorModule } from '../src/modules/advanced-sequencer.js';
import { MultiSamplerModule } from '../src/modules/multisampler.js';
import { DubEchoModule, ReverbModule, FlangerModule, PhaserModule, TapeEchoModule, BpmBeatLooperModule } from '../src/modules/effects.js';

const modules = [new BasicSequencerModule(), new ArrangerModule(), new ArpMidiGeneratorModule(), new MultiSamplerModule(), new DubEchoModule(), new ReverbModule(), new FlangerModule(), new PhaserModule(), new TapeEchoModule(), new BpmBeatLooperModule()];
assert.equal(modules.length, 10);
for (const m of modules) {
  assert.ok(m.id);
  assert.ok(m.inputs.length || m.outputs.length);
}
console.log('expanded modules smoke ok');
