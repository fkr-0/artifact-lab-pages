import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const architecture = await readFile(new URL('../sprite-fan/architecture.md', import.meta.url), 'utf8');
const todo = await readFile(new URL('../sprite-fan/todo.md', import.meta.url), 'utf8');

assert.match(architecture, /Keep `atlas-studio\.html` as the canonical integrated artifact/i);
assert.match(architecture, /Do \*\*not\*\* split/i);
assert.match(architecture, /Split criteria/i);
assert.match(architecture, /compile step must/i);
assert.match(architecture, /single standalone HTML artifact/i);
assert.match(architecture, /GIF features should be added later as focused import\/export modules/i);
assert.match(todo, /Do not split immediately/i);
assert.match(todo, /Re-evaluate split after tests exist/i);

console.log('sprite fan architecture decision contract OK');
