import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageScript = await readFile('artifacts-package', 'utf8');
const deployScript = await readFile('artifacts-deploy', 'utf8');
const bridge = await readFile('bridge.yml', 'utf8');
const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));
const nakamotosIndex = await readFile('nakamotos-disciples/index.html', 'utf8');
const nakamotosManifest = JSON.parse(await readFile('nakamotos-disciples/manifest.webmanifest', 'utf8'));
const nakamotosProvenance = JSON.parse(await readFile('nakamotos-disciples/BUILD_PROVENANCE.json', 'utf8'));
const nakamotosChecksums = await readFile('nakamotos-disciples/SHA256SUMS', 'utf8');

assert.match(packageScript, /artifact-build\.mjs/);
assert.match(packageScript, /app-hub-v11\/artifacts\.source\.json/);
assert.match(deployScript, /\.artifacts-deploy-stage/);
assert.match(deployScript, /artifact-build\.mjs/);
assert.match(deployScript, /rsync -avz --checksum --delete/);
assert.equal(source.deploy.rootIndex.source, 'app-hub-v11/index.html');
assert.ok(source.deploy.includeDirs.includes('app-hub-v11'));
assert.ok(source.items.some((item) => item.id === 'ethic-brawl' && item.deploy?.build && item.deploy?.includePath === 'ethic-brawl/dist'));
assert.ok(source.items.some((item) => item.id === 'v11-peer-daw' && item.deploy?.build && item.deploy?.includePath === 'v11-peer-daw/dist'));
const nakamotos = source.items.find((item) => item.id === 'nakamotos-disciples');
assert.ok(nakamotos, "Nakamoto's Disciples should be present in the artifact catalog");
assert.equal(nakamotos.href, '../nakamotos-disciples/index.html');
assert.equal(nakamotos.deploy?.includePath, 'nakamotos-disciples');
assert.equal(nakamotos.deploy?.targetPath, 'nakamotos-disciples');
assert.doesNotMatch(nakamotosIndex, /(?:src|href)="\//, 'vendored assets must remain subpath-relative');
assert.equal(nakamotosManifest.start_url, '.');
assert.equal(nakamotosManifest.scope, '.');
assert.equal(nakamotosProvenance.sourceRevision, '9cea0b75f7d50bf9efd2f0420a07f985a4e36d4a');
assert.equal(nakamotosProvenance.sourceVersion, '0.2.0-alpha.8');
assert.match(nakamotosChecksums, /\.\/index\.html$/m);
assert.match(nakamotosChecksums, /\.\/sw\.js$/m);
assert.match(bridge, /compile:app-hub-v11/);
assert.match(bridge, /smoke:app-hub-v11/);

assert.ok(source.deploy.includeFiles.includes('bdg.gif'), 'bdg.gif should be deployed for the v11 badger runner');
