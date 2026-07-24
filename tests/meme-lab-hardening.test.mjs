import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../meme-lab/meme-lab.html', import.meta.url), 'utf8');

assert.match(html, /<main class="workspace">/);
assert.match(html, /prefers-reduced-motion:\s*reduce/);
assert.match(html, /function downloadBlob\(/);
assert.match(html, /function validateTemplateObject\(/);
assert.match(html, /No supported image files found\./);
assert.match(html, /Template layers must be an array\./);
assert.match(html, /Template files must use the \.json extension\./);

console.log('meme lab hardening contract OK');
