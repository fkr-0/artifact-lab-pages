import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = JSON.parse(fs.readFileSync('app-hub-v11/artifacts.source.json', 'utf8'));
const compiled = JSON.parse(fs.readFileSync('app-hub-v11/data/artifact-collection.json', 'utf8'));

test('v11 hub exposes Sprite Fan Atlas Studio and deploys its directory', () => {
  assert.ok(source.deploy.includeDirs.includes('sprite-fan'), 'sprite-fan directory must be deployed with v11 hub');

  const sourceItem = source.items.find((item) => item.id === 'sprite-fan-atlas-studio');
  assert.ok(sourceItem, 'source catalog should contain Sprite Fan Atlas Studio');
  assert.equal(sourceItem.href, '../sprite-fan/atlas-studio.html');
  assert.equal(sourceItem.kind, 'html-path');
  assert.ok(sourceItem.tags.includes('sprite'));
  assert.ok(sourceItem.tags.includes('postprocessing'));

  const compiledItem = compiled.items.find((item) => item.id === 'sprite-fan-atlas-studio');
  assert.ok(compiledItem, 'compiled catalog should contain Sprite Fan Atlas Studio');
  assert.equal(compiledItem.href, '../sprite-fan/atlas-studio.html');
  assert.deepEqual(compiledItem.launch.modes, ['inline', 'floating', 'fullscreen', 'newWindow']);
});
