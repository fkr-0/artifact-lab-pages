import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const source = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));
const catalog = JSON.parse(await readFile('app-hub-v11/data/artifact-collection.json', 'utf8'));

const sourceItem = source.items.find((item) => item.id === 'clausewitz-on-war-interactive');
assert.ok(sourceItem, 'Clausewitz interactive artifact should be registered in app-hub-v11/artifacts.source.json');
assert.equal(sourceItem.title, 'Clausewitz: On War Interactive Atlas');
assert.equal(sourceItem.kind, 'html-path');
assert.equal(sourceItem.href, '../clausewitz-on-war-interactive/index.html');
assert.deepEqual(sourceItem.operations, ['validate', 'index']);
assert.ok(sourceItem.tags.includes('education'));
assert.ok(sourceItem.tags.includes('strategy'));
assert.ok(sourceItem.tags.includes('history'));
assert.ok(sourceItem.tags.includes('interactive'));
assert.equal(sourceItem.launch.defaultAction, 'inline');

const catalogItem = catalog.items.find((item) => item.id === 'clausewitz-on-war-interactive');
assert.ok(catalogItem, 'compiled artifact collection should include Clausewitz interactive artifact');
assert.equal(catalogItem.href, '../clausewitz-on-war-interactive/index.html');
assert.equal(catalogItem.launch.defaultAction, 'inline');

const htmlPath = 'clausewitz-on-war-interactive/index.html';
await stat(htmlPath);
const html = await readFile(htmlPath, 'utf8');
assert.match(html, /<!doctype html>/i);
assert.match(html, /Clausewitz: On War Interactive Atlas/);
assert.match(html, /data-book-id="book-1"/);
assert.match(html, /data-book-id="book-8"/);
assert.match(html, /id="frictionLab"/);
assert.match(html, /id="scenarioLab"/);
assert.match(html, /id="conceptMap"/);
assert.match(html, /No external libraries/);
assert.doesNotMatch(html, /https?:\/\//, 'artifact should stay self-contained with no external runtime URLs');
