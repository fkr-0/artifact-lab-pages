import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));
const compiled = JSON.parse(await readFile('app-hub-v11/data/artifact-collection.json', 'utf8'));

const sourceItem = source.items.find((item) => item.id === 'club-ledger');
assert.ok(sourceItem, 'club-ledger should be listed in the v11 hub source manifest');
assert.equal(sourceItem.title, 'Club Ledger');
assert.equal(sourceItem.kind, 'html-path');
assert.equal(sourceItem.href, '../club-ledger.html');
assert.equal(sourceItem.launch?.defaultAction, 'inline');
assert.ok(sourceItem.launch?.modes?.includes('inline'), 'club-ledger should be launchable inline from the hub');
assert.ok(sourceItem.launch?.modes?.includes('newWindow'), 'club-ledger should be launchable as a separate artifact window');
assert.ok(sourceItem.tags?.includes('finance'), 'club-ledger should be discoverable as a finance tool');
assert.ok(sourceItem.tags?.includes('local-first'), 'club-ledger should expose its local-first data model in search tags');
await stat('club-ledger.html');

const compiledItem = compiled.items.find((item) => item.id === 'club-ledger');
assert.ok(compiledItem, 'compiled v11 artifact collection should include club-ledger');
assert.equal(compiledItem.href, '../club-ledger.html');
assert.equal(compiledItem.deploy?.include, true, 'club-ledger should be included by the deployment materializer');
assert.equal(compiled.summary?.byTag?.finance > 0, true, 'compiled collection summary should retain finance tagging');
