import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../sprite-fan/atlas-studio.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

assert.deepEqual(duplicateIds, [], 'atlas-studio should not have duplicate DOM ids');

for (const expected of [
  'cleanAlpha',
  'extractDualAlpha',
  'findComponents',
  'mergeNearby',
  'repackSheet',
  'removeStrayPixels',
  'fillAlphaPinholes',
  'analyzeFramePixels',
  'window.__spriteFanTest',
]) {
  assert.match(html, new RegExp(expected.replace('.', '\\.')), `atlas-studio should expose ${expected}`);
}

for (const expectedId of [
  'btn-clean-run',
  'btn-dual-extract',
  'btn-detect',
  'btn-repack',
  'btn-export-png',
  'btn-cleanup-all',
  'review-metrics',
  'btn-auto-fit',
]) {
  assert.ok(ids.includes(expectedId), `atlas-studio should include #${expectedId}`);
}

const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? '';
assert.doesNotMatch(script, /TODO:|FIXME:/, 'atlas-studio script should not ship local TODO/FIXME markers');

console.log('sprite fan atlas contract OK');
