import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

let releaseRoot = 'v11-peer-daw/dist';
try {
  const prepared = JSON.parse(await readFile('hub-v13.5/.generated/prepared.json', 'utf8'));
  releaseRoot = prepared['v11-peer-daw']?.outputRoot || releaseRoot;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const html = await readFile(join(releaseRoot, 'index.html'), 'utf8');

assert.doesNotMatch(html, /(?:src|href)="\/assets\//, 'built V11 DAW must use relative asset URLs so it works under /v11-peer-daw/');
assert.match(html, /(?:src|href)="\.\/assets\//, 'built V11 DAW should reference its local ./assets directory');

const staticRuntimeFiles = [
  'vendor/peernet/peernet-shared-core.js',
  'vendor/peernet/peernet-user-manager.js',
  'vendor/peernet/peernet-session-manager.js',
  'vendor/peernet/peernet-storage-manager.js',
  'docs/ARCHITECTURE.md',
];

for (const file of staticRuntimeFiles) {
  await stat(join(releaseRoot, file));
}

console.log('v11 peer daw deploy asset contract OK');
