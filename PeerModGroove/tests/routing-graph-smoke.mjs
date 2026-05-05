import assert from 'node:assert/strict';
import { RoutingGraph } from '../src/core/routing-graph.js';
import { AudioGraphSync } from '../src/core/audio-graph-sync.js';
import { PatchCanvas } from '../src/ui/patch-canvas.js';

const graph = new RoutingGraph();
graph.addNode('a', { title: 'A' });
graph.addNode('b', { title: 'B' });
graph.connect('a', 'b');
graph.setChain('a', ['fx']);
assert.equal(graph.serialize().edges.length, 1);
assert.equal(graph.serialize().chains.length, 1);
let connected = false;
const modules = new Map([
  ['a', { connectAudio() { connected = true; }, disconnectAudio() {} }],
  ['b', { input: {}, connectAudio() {}, disconnectAudio() {} }]
]);
new AudioGraphSync({ modules, destination: {} }).apply(graph);
assert.equal(connected, true);
assert.equal(typeof PatchCanvas, 'function');
console.log('routing graph smoke ok');
