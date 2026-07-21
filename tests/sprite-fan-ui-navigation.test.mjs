import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sprite-fan/src/ui-navigation.js', import.meta.url), 'utf8');
const context = vm.createContext({});
context.globalThis = context;
vm.runInContext(source, context, { filename: 'ui-navigation.js' });
const navigation = context.SpriteFanUiNavigation;

assert.ok(navigation, 'UI navigation core should install itself in a classic-script context');

assert.equal(navigation.nextEnabledIndex([true, false, false, true], 0, 1), 3);
assert.equal(navigation.nextEnabledIndex([true, false, false, true], 3, 1), 0);
assert.equal(navigation.nextEnabledIndex([true, false, false, true], 0, -1), 3);
assert.equal(navigation.nextEnabledIndex([false, false], 0, 1), -1);
assert.equal(navigation.nextEnabledIndex([], 0, 1), -1);
assert.throws(() => navigation.nextEnabledIndex([true], 0, 0), /direction/);

assert.deepEqual(
  { ...navigation.tabPresentation('cleanup', 'cleanup') },
  { active: true, ariaSelected: 'true', tabIndex: 0 },
);
assert.deepEqual(
  { ...navigation.tabPresentation('export', 'cleanup') },
  { active: false, ariaSelected: 'false', tabIndex: -1 },
);

assert.deepEqual(
  { ...navigation.trappedFocusDecision({ key: 'Escape', count: 4, currentIndex: 2 }) },
  { action: 'close' },
);
assert.deepEqual(
  { ...navigation.trappedFocusDecision({ key: 'Tab', count: 4, currentIndex: 3 }) },
  { action: 'focus', index: 0 },
);
assert.deepEqual(
  { ...navigation.trappedFocusDecision({ key: 'Tab', shiftKey: true, count: 4, currentIndex: 0 }) },
  { action: 'focus', index: 3 },
);
assert.deepEqual(
  { ...navigation.trappedFocusDecision({ key: 'Tab', count: 4, currentIndex: -1 }) },
  { action: 'focus', index: 0 },
);
assert.deepEqual(
  { ...navigation.trappedFocusDecision({ key: 'Tab', count: 0, currentIndex: -1 }) },
  { action: 'prevent' },
);
assert.deepEqual(
  { ...navigation.trappedFocusDecision({ key: 'Enter', count: 4, currentIndex: 1 }) },
  { action: 'allow' },
);

console.log('sprite fan UI navigation core contract OK');
