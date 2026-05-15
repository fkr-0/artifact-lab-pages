import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LEGACY_TEXT_TOOL_IDS,
  LEGACY_TOOLS,
  createCalculatorMachine,
  legacyToolById,
} from '../app-hub-v11/lib/legacy-tools.mjs';

const expectedTextTools = [
  'v9-notepad',
  'v10-notepad',
  'v10-shared-pad',
  'v4-console-notes',
  'v8-native-scratchpad',
  'v8-collab-code-editor',
  'v8-collab-pad-lite',
];

assert.deepEqual(
  LEGACY_TEXT_TOOL_IDS,
  expectedTextTools,
  'v11 should expose each legacy text editor lineage as an explicit tool id'
);

assert.equal(legacyToolById('v9-calculator').kind, 'calculator');
assert.equal(legacyToolById('v10-shared-pad').sync, 'broadcast-channel');
assert.equal(legacyToolById('v8-collab-code-editor').href, '../app-hub/collab-editor.html');
assert.equal(legacyToolById('v8-collab-pad-lite').href, '../app-hub/collab-editor-lite.html');
assert.equal(LEGACY_TOOLS.every((tool) => tool.storageKey.startsWith('v11:legacy:')), true);

const calculator = createCalculatorMachine();
for (const key of ['1', '2', '+', '3', '=']) calculator.press(key);
assert.equal(calculator.display, '15');
assert.deepEqual(calculator.history, ['12 + 3 = 15']);
calculator.press('⌫');
assert.equal(calculator.display, '1');
calculator.press('C');
assert.equal(calculator.display, '0');

const divByZero = createCalculatorMachine();
for (const key of ['8', '/', '0', '=']) divByZero.press(key);
assert.equal(divByZero.display, 'ERR');
assert.deepEqual(divByZero.history, ['8 / 0 = ERR']);

const sourceCatalog = JSON.parse(await readFile('app-hub-v11/artifacts.source.json', 'utf8'));
const sourceIds = sourceCatalog.items.map((item) => item.id);
for (const id of [
  'v9-quick-notepad',
  'v9-sci-fi-calculator',
  'v10-local-first-notepad',
  'v10-shared-text-pad',
  'v4-console-notes',
  'v8-native-scratchpad',
  'v8-collab-code-editor',
  'v8-collab-pad-lite',
]) {
  assert.ok(sourceIds.includes(id), `expected ${id} in v11 artifact source catalog`);
}

const legacyHost = await readFile('app-hub-v11/legacy-tools.html', 'utf8');
assert.match(legacyHost, /\.\/lib\/legacy-tools\.mjs/, 'legacy host should use the shared legacy tool module');
assert.match(legacyHost, /data-external-href/, 'legacy host should render external editor launch cards');

assert.ok(LEGACY_TOOLS.some((tool) => tool.id === 'v8-native-scratchpad' && tool.kind === 'notepad'), 'legacy utility host should include a native v8 scratchpad/notepad');
assert.deepEqual(
  ['v4', 'v8', 'v9', 'v10'].filter((lineage) => LEGACY_TOOLS.some((tool) => tool.lineage === lineage && ['notepad', 'shared-pad', 'external-editor'].includes(tool.kind))),
  ['v4', 'v8', 'v9', 'v10'],
  'legacy utility host should cover useful text/editor tools across v4/v8/v9/v10'
);
