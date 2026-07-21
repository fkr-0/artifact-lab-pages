import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync('sprite-fan/atlas-studio.html', 'utf8');
const exportCore = fs.readFileSync('sprite-fan/src/export-core.js', 'utf8');
const studio = fs.readFileSync('sprite-fan/src/studio.js', 'utf8');
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
    'maxPromptGrid: { columns: 4, rows: 4, frames: 16 }',
    'animations: { [normalizedName]: sharedAnimation }',
    'frameDurationMs',
    'frameDurationsMs',
    'loopCount',
    'events: []',
    'hitboxes: []',
    'hurtboxes: []',
  ]) {
    assert.ok(exportCore.includes(exportedField), `export core should own ${exportedField}`);
  }

  assert.ok(studio.includes('buildGenericManifest({'), 'studio should delegate generic manifests');
  assert.ok(html.includes('SpriteFanExportCore'), 'standalone build should include the export core');
});
