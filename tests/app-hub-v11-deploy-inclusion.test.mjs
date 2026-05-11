import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageScript = await readFile('artifacts-package', 'utf8');
const deployScript = await readFile('artifacts-deploy', 'utf8');
const bridge = await readFile('bridge.yml', 'utf8');
const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));

assert.match(packageScript, /artifact-build\.mjs/);
assert.match(packageScript, /app-hub-v11\/artifacts\.source\.json/);
assert.match(deployScript, /\.artifacts-deploy-stage/);
assert.match(deployScript, /artifact-build\.mjs/);
assert.match(deployScript, /rsync -avz --checksum --delete/);
assert.equal(source.deploy.rootIndex.source, 'app-hub-v11/index.html');
assert.ok(source.deploy.includeDirs.includes('app-hub-v11'));
assert.ok(source.items.some((item) => item.id === 'ethic-brawl' && item.deploy?.build && item.deploy?.includePath === 'brawl/ethic-brawl/dist'));
assert.ok(source.items.some((item) => item.id === 'v11-peer-daw' && item.deploy?.build && item.deploy?.includePath === 'v11-peer-daw/dist'));
assert.match(bridge, /compile:app-hub-v11/);
assert.match(bridge, /smoke:app-hub-v11/);
