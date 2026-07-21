import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sprite-fan/src/spec-guide.js', import.meta.url), 'utf8');
const context = vm.createContext({ Date });
context.globalThis = context;
vm.runInContext(source, context, { filename: 'spec-guide.js' });
const core = context.SpriteFanSpecGuide;
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.ok(core, 'spec-guide core should install itself in a classic-script context');

const completeSnapshot = {
  prompt: 'idle animation',
  frameCount: 16,
  exportColumns: 4,
  exportPadding: 0,
  noPadding: true,
  targetColumns: 4,
  targetPageSize: 16,
  stableFrameSize: true,
  anchorsPresent: true,
  issueFrames: 0,
  animationName: 'hero-idle',
  animationFps: 12,
  previewAvailable: true,
};

{
  const guide = core.evaluateSpecGuide(completeSnapshot, { checkedAt: '2026-07-21T00:00:00.000Z' });
  assert.deepEqual(plain(guide.summary), { done: 8, total: 8 });
  assert.equal(guide.checkedAt, '2026-07-21T00:00:00.000Z');
  assert.equal(core.guideSummary(guide), 'Spec: 8/8 done');
  assert.equal(core.guideLines(guide).every((line) => line.startsWith('✓ ')), true);
}

{
  const guide = core.evaluateSpecGuide({
    ...completeSnapshot,
    prompt: ' ',
    issueFrames: 2,
    animationName: '',
  }, { checkedAt: 'fixed' });
  assert.deepEqual(plain(guide.summary), { done: 5, total: 8 });
  const byId = Object.fromEntries(guide.items.map((item) => [item.id, item]));
  assert.equal(byId.prompt.done, false);
  assert.equal(byId.review.done, false);
  assert.equal(byId.animation.done, false);
  assert.match(core.guideLines(guide)[0], /^□ Prompt\/goals captured — /);
}

{
  assert.equal(core.pageSafe(core.normalizeSnapshot({
    frameCount: 20,
    exportColumns: 4,
    targetColumns: 4,
    targetPageSize: 16,
    exportPadding: 1,
    noPadding: false,
  })), false);
  assert.equal(core.pageSafe(core.normalizeSnapshot({
    frameCount: 20,
    exportColumns: 4,
    targetColumns: 4,
    targetPageSize: 16,
    exportPadding: 0,
    noPadding: false,
  })), true);
  assert.equal(core.pageSafe(core.normalizeSnapshot({
    frameCount: 17,
    exportColumns: 4,
  })), false);
}

{
  const empty = core.evaluateSpecGuide({}, { checkedAt: '' });
  assert.deepEqual(plain(empty.summary), { done: 0, total: 8 });
  assert.equal(core.guideSummary({ items: [] }), 'Spec: not checked');
  assert.deepEqual(plain(core.guideLines(null)), []);
}

console.log('sprite fan spec-guide core contract OK');
