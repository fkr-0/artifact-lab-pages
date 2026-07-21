import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadClassicModule(path, exportName) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const context = vm.createContext({});
  context.globalThis = context;
  vm.runInContext(source, context, { filename: path });
  return context[exportName];
}

const core = await loadClassicModule('../sprite-fan/src/config-core.js', 'SpriteFanConfigCore');

assert.ok(core, 'config core should install itself in a classic-script context');

{
  const clean = core.cleanConfig(
    {
      frameW: '9000',
      frameH: 'not-a-number',
      gridOx: -12,
      anchor: { x: Infinity, y: -9000 },
      manifestName: 'x'.repeat(200),
      manifestFps: 1000,
      viewMode: 'unknown',
      zoom: 0,
      layout: { leftWidth: 1, rightWidth: 9999, timelineHeight: 2 },
      unknown: 'discard me',
    },
    {
      anchorFallback: { x: 7, y: 8 },
      layoutDefaults: { leftWidth: 272, rightWidth: 256, timelineHeight: 80 },
    },
  );

  assert.equal(clean.frameW, 4096);
  assert.equal(clean.frameH, undefined);
  assert.equal(clean.gridOx, 0);
  assert.deepEqual({ ...clean.anchor }, { x: 7, y: -4096 });
  assert.equal(clean.manifestName.length, 120);
  assert.equal(clean.manifestFps, 120);
  assert.equal(clean.viewMode, undefined);
  assert.equal(clean.zoom, 0.1);
  assert.deepEqual({ ...clean.layout }, { leftWidth: 180, rightWidth: 560, timelineHeight: 48 });
  assert.equal('unknown' in clean, false);
}

{
  const history = Array.from({ length: 14 }, (_, index) => ({
    kind: `batch-${index}`,
    before: { pixels: -1, issueFrames: index },
    after: { pixels: 1e12, issueFrames: index + 1 },
    delta: { issueFrames: 2e6 },
  }));
  const clean = core.cleanBatchHistory(history);
  assert.equal(clean.length, 10);
  assert.equal(clean[0].kind, 'batch-4');
  assert.equal(clean[0].before.pixels, 0);
  assert.equal(clean.at(-1).after.pixels, 1e9);
  assert.equal(clean.at(-1).delta.issueFrames, 1e6);
}

{
  const guide = core.cleanSpecGuide({
    version: 99,
    prompt: '<img src=x onerror=alert(1)>',
    items: Array.from({ length: 70 }, (_, index) => ({
      id: `item-${index}`,
      label: '<b>literal text</b>',
      done: index % 2 === 0,
      action: 'review',
    })),
  });
  assert.equal(guide.version, 10);
  assert.equal(guide.items.length, 64);
  assert.equal(guide.items[0].label, '<b>literal text</b>');
  assert.equal(guide.summary.done, 32);
  assert.equal(guide.summary.total, 64);
}

{
  const meta = core.cleanFrameMeta(
    [{ index: -1, label: 'a', notes: 'b', anchor: { x: '3', y: null } }],
    { x: 12, y: 20 },
  );
  assert.deepEqual(
    { ...meta[0], anchor: { ...meta[0].anchor } },
    { index: 0, label: 'a', notes: 'b', anchor: { x: 3, y: 0 } },
  );
}

console.log('sprite fan config core contract OK');
