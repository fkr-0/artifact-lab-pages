import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync('sprite-fan/atlas-studio.html', 'utf8');
const req = fs.readFileSync('sprite-fan/reqs/animation.yml', 'utf8');

test('Sprite Fan manifest export covers generation requirement metadata fields', () => {
  for (const required of [
    'max_prompt_grid: 4x4',
    '- grid.columns',
    '- grid.rows',
    '- animations.order',
    '- animations.loop',
    '- animations.anchor',
    '- animations.hitboxes',
    '- animations.hurtboxes',
    '- animations.events',
  ]) {
    assert.match(req, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const exportedField of [
    'generationContract',
    'maxPromptGrid:{columns:4,rows:4,frames:16}',
    'grid:{columns:cols,rows,padding:pad',
    'animations:{[name]:{frames:S.frames.length,fps,frameDurationMs,frameDurationsMs,order,loop,loopCount,anchor:S.anchor',
    'frameDurationMs',
    'frameDurationsMs',
    'loopCount',
    'events:[]',
    'hitboxes:[]',
    'hurtboxes:[]',
  ]) {
    assert.ok(html.includes(exportedField), `atlas-studio manifest export should include ${exportedField}`);
  }
});
