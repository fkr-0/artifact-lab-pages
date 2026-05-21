import assert from 'node:assert/strict';
import { landmarkIds, renderDockLandmark } from '../hyperblast-shooter/js/landmarks.js';
import { WORLD_NODES } from '../hyperblast-shooter/js/worlds.js';

assert.deepEqual(
  landmarkIds().sort(),
  WORLD_NODES.map((world) => world.id).sort(),
  'every world should have a procedural dock landmark renderer'
);

for (const world of WORLD_NODES) {
  const svg = renderDockLandmark(world.id);
  assert.match(svg, /<svg class="dock-landmark-svg"/);
  assert.match(svg, new RegExp(`data-landmark-world="${world.id}"`));
  assert.match(svg, /role="img"/);
  assert.match(svg, /procedural dock landmark/);
}

assert.match(renderDockLandmark('missing-world'), /data-landmark-world="neon-drift"/, 'missing world should fall back to Neon Drift art');

console.log('hyperblast landmark smoke checks passed');
