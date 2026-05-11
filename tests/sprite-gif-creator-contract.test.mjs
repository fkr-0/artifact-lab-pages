import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

await assert.rejects(
  () => stat('sprite_gif_creator.html'),
  /ENOENT/,
  'root duplicate sprite_gif_creator.html should be removed; spc/sprite-gif-creator.html is canonical'
);

const html = await readFile('spc/sprite-gif-creator.html', 'utf8');
assert.match(html, /<title>Sprite GIF Creator<\/title>/, 'canonical GIF creator should have title');
assert.equal(
  (html.match(/function drawGridModeOverlay\s*\(/g) || []).length,
  1,
  'canonical GIF creator should not redeclare drawGridModeOverlay'
);
assert.match(html, /id="appendGridSlices"[^>]*checked/, 'GIF creator should append multiple grid slices by default');
assert.match(html, /id="gridBatchName"/, 'GIF creator should allow naming each source grid batch');
assert.match(html, /id="clearFramesBtn"/, 'GIF creator should allow clearing accumulated GIF frames');
assert.match(html, /state\.batches/, 'GIF creator should track multiple source grid batches');
assert.match(html, /appendFramesFromGrid/, 'GIF creator should append frames from multiple grid extracts');
assert.match(html, /batchId/, 'GIF creator should keep batch metadata per frame');

const catalog = await readFile('app-hub-v11/artifacts.source.json', 'utf8');
assert.match(catalog, /"href": "\.\.\/spc\/sprite-gif-creator\.html"/, 'v11 should launch the canonical featureful GIF creator');
assert.doesNotMatch(catalog, /sprite_gif_creator\.html/, 'v11 should not reference the removed duplicate GIF creator');

console.log('sprite gif creator contract OK');
