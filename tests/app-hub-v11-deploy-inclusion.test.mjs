import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageScript = await readFile('artifacts-package', 'utf8');
const deployScript = await readFile('artifacts-deploy', 'utf8');
const bridge = await readFile('bridge.yml', 'utf8');

assert.match(packageScript, /"app-hub-v11"/);
assert.match(deployScript, /--include="app-hub-v11\/"/);
assert.match(deployScript, /--include="app-hub-v11\/\*\*"/);
assert.match(bridge, /compile:app-hub-v11/);
assert.match(bridge, /smoke:app-hub-v11/);
