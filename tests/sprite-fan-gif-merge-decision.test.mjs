import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const todo = await readFile(new URL('../sprite-fan/todo.md', import.meta.url), 'utf8');
const studio = await readFile(new URL('../sprite-fan/atlas-studio.html', import.meta.url), 'utf8');
const gifV1 = await readFile(new URL('../spc/sprite-gif-creator.html', import.meta.url), 'utf8');
const gifV2 = await readFile(new URL('../spc/sprite-gif-creator-v2.html', import.meta.url), 'utf8');

assert.match(todo, /GIF creator merge decision/i);
assert.match(todo, /do not copy the whole UI/i);
assert.match(todo, /focused GIF import\/export modules/i);
assert.match(todo, /frame timing/i);
assert.match(todo, /transparent GIF/i);

for (const feature of ['downloadGifBtn', 'frameDelay', 'trimTransparent', 'downloadSheetBtn']) {
  assert.ok(gifV1.includes(feature) || gifV2.includes(feature), `GIF creator should expose ${feature}`);
}

assert.ok(studio.includes('btn-export-png'), 'studio should keep PNG sheet export as the canonical current export path');
assert.ok(studio.includes('frameMeta'), 'studio should preserve review metadata before GIF work is merged');

console.log('sprite fan GIF merge decision contract OK');
