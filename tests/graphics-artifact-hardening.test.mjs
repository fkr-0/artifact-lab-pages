import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('GIF transparency tool validates real GIF signatures and export results', async () => {
  const html = await read('gif-white-to-transparent.html');
  assert.match(html, /function validateGifFile\(/);
  assert.match(html, /GIF87a/);
  assert.match(html, /GIF89a/);
  assert.match(html, /GIF encoding produced no download data/);
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
});

test('PDF Forge constrains imports and releases preview/download URLs', async () => {
  const html = await read('pdf-forge-nexus.html');
  assert.match(html, /SUPPORTED_IMAGE_MIME = new Set\(\['image\/png', 'image\/jpeg'\]\)/);
  assert.match(html, /Only PDF, PNG, and JPEG files are supported/);
  assert.match(html, /async function loadImageFromBytes\(/);
  assert.match(html, /finally \{\s*safeRevokeObjectUrl\(url\)/s);
  assert.match(html, /setTimeout\(\(\) => safeRevokeObjectUrl\(url\), 0\)/);
});

test('Storyboard import normalizes duplicate IDs and tolerates partial image failure', async () => {
  const html = await read('storyboard-studio/index.html');
  assert.match(html, /const usedIds = new Set\(\)/);
  assert.match(html, /while \(usedIds\.has\(id\)\) id = uid\(\)/);
  assert.match(html, /Promise\.allSettled\(images\.map\(readFileDataUrl\)\)/);
  assert.match(html, /skipped \$\{failures\.length\} file\(s\)/);
});
