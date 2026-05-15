import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('app-hub-v11/index.html', 'utf8');

for (const needle of [
  'const HUB_BASE =',
  "document.baseURI.includes('app-hub-v11/')",
  "import(hubUrl('lib/event-log.js'))",
  "import(hubUrl('lib/resizable-panels.js'))",
  "import(hubUrl('lib/storage.js'))",
  "import(hubUrl('lib/themes.js'))",
  "import(hubUrl('lib/sound.js'))",
  "import(hubUrl('lib/network.js'))",
  "import(hubUrl('lib/profile.js'))",
  'href="lib/v9-shell.css"'
]) {
  assert.ok(html.includes(needle), `missing deploy-safe marker: ${needle}`);
}
assert.ok(!html.includes("from './lib/"), 'v11 should not statically import ./lib modules when root-promoted');
assert.ok(!html.includes('href="app-hub-v11/app-hub-v11/'), 'v11 should not double-prefix app-hub-v11 assets');

console.log('app-hub v11 root-safe imports contract OK');
