import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const architecture = await readFile(new URL('../sprite-fan/architecture.md', import.meta.url), 'utf8');
const todo = await readFile(new URL('../sprite-fan/todo.md', import.meta.url), 'utf8');

assert.match(architecture, /Use `sprite-fan\/src\/` as the canonical editing surface/i);
assert.match(architecture, /generated file remains the stable browser and app-hub URL/i);
assert.match(architecture, /Why the decision changed/i);
assert.match(architecture, /Build contract/i);
assert.match(architecture, /standalone browser-loadable HTML artifact/i);
assert.match(architecture, /pixel-analysis\.js/i);
assert.match(architecture, /frame-operations\.js/i);
assert.match(architecture, /Focused GIF export lives in `src\/gif-core\.js`/i);
assert.match(architecture, /Future GIF work should remain focused import\/export\s+modules/i);
assert.match(todo, /Move editing into `sprite-fan\/src\/`/i);
assert.match(todo, /byte-for-byte source\/output drift contract/i);

console.log('sprite fan architecture decision contract OK');
