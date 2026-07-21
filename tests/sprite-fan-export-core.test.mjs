import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sprite-fan/src/export-core.js', import.meta.url), 'utf8');
const context = vm.createContext({});
context.globalThis = context;
vm.runInContext(source, context, { filename: 'export-core.js' });
const core = context.SpriteFanExportCore;
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.ok(core, 'export core should install itself in a classic-script context');

assert.equal(core.safeFileStem('../../ hero / idle '), 'hero_idle');
assert.equal(core.safeFileStem('...'), 'sprite');
assert.equal(core.safeFileStem('hero'.repeat(100)).length, 96);

{
  const layout = core.buildSheetLayout({
    frameCount: 20,
    columns: 4,
    padding: 2,
    frameWidth: 8,
    frameHeight: 6,
  });
  assert.deepEqual({ ...layout }, {
    columns: 4,
    rows: 5,
    padding: 2,
    frameWidth: 8,
    frameHeight: 6,
    cellWidth: 12,
    cellHeight: 10,
    sheetWidth: 48,
    sheetHeight: 50,
  });
}

const reviews = [
  {
    index: 0,
    hash: 'aaaa0000',
    pixels: 12,
    soft: 2,
    bbox: { x: 1, y: 1, w: 3, h: 4 },
    strayPixels: 1,
    pinholePixels: 0,
    issues: ['stray 1px'],
  },
  {
    index: 1,
    hash: 'bbbb0000',
    pixels: 10,
    soft: 0,
    bbox: { x: 2, y: 1, w: 2, h: 4 },
    strayPixels: 0,
    pinholePixels: 1,
    issues: ['holes 1px', 'jitter 2.0,0.0'],
  },
];
const frameMeta = [
  { anchor: { x: 3, y: 6 }, label: 'idle-a', notes: '', width: 8, height: 6 },
  { anchor: { x: 3, y: 6 }, label: 'idle-b', notes: 'contact', width: 8, height: 6 },
];

{
  const report = core.buildReviewReport({
    name: ' hero ',
    selectedFrame: 1,
    frameWidth: 8,
    frameHeight: 6,
    columns: 2,
    padding: 1,
    settings: { straySize: 4 },
    batchHistory: Array.from({ length: 12 }, (_, index) => ({ index })),
    frameReviews: reviews,
  });
  assert.equal(report.name, 'hero');
  assert.equal(report.frameCount, 2);
  assert.equal(report.batchHistory.length, 10);
  assert.deepEqual({ ...report.totals }, {
    pixels: 22,
    soft: 2,
    strayPixels: 1,
    pinholePixels: 1,
    jitterFrames: 1,
    issueFrames: 2,
  });
  assert.deepEqual({ ...report.frames[1].sheetRect }, { x: 11, y: 1, w: 8, h: 6 });
}

const contract = {
  id: 'arcade-runtime-4x4',
  label: 'Arcade Runtime portable',
  cols: 4,
  rows: 4,
  pageSize: 16,
  namespace: 'arcade-runtime',
  gridKey: 'atlas_4x4',
};

{
  const plan = core.buildContractPagePlan({ name: '../Hero Idle', contract, frameCount: 20 });
  assert.equal(plan.pageCount, 2);
  assert.equal(plan.manifestFile, 'Hero_Idle_arcade-runtime-4x4_manifest.json');
  assert.deepEqual([...plan.pages.map((page) => page.file)], [
    'Hero_Idle_arcade-runtime-4x4_p01.png',
    'Hero_Idle_arcade-runtime-4x4_p02.png',
  ]);
  assert.deepEqual([...plan.pages.map((page) => page.frameCount)], [16, 4]);
  assert.deepEqual(
    [...core.buildExportFilePlan({ name: '../Hero Idle', contract, frameCount: 20 })],
    [...plan.pages.map((page) => page.file), plan.manifestFile],
  );
}

{
  const manifest = core.buildGenericManifest({
    name: 'hero',
    fps: 10,
    loopCount: 0,
    columns: 2,
    padding: 1,
    frameWidth: 8,
    frameHeight: 6,
    anchor: { x: 3, y: 6 },
    specGuide: { summary: { done: 1, total: 2 } },
    frameMeta,
    frameReviews: reviews,
  });
  assert.equal(manifest.frameDurationMs, undefined);
  assert.equal(manifest.animation.frameDurationMs, 100);
  assert.equal(manifest.animation.loop, true);
  assert.deepEqual(plain(manifest.frames[0].sheetRect), { x: 1, y: 1, w: 8, h: 6 });
  assert.equal(manifest.frames[1].pinholePixels, 1);
  assert.deepEqual(plain(manifest.sheetLayout), plain(manifest.grid));
}

{
  const pagePlan = core.buildContractPagePlan({ name: 'hero', contract, frameCount: reviews.length });
  const manifest = core.buildContractManifest({
    name: 'hero',
    contract,
    fps: 15,
    loopCount: 3,
    frameWidth: 8,
    frameHeight: 6,
    anchor: { x: 3, y: 6 },
    frameMeta,
    frameReviews: reviews,
    pagePlan,
  });
  assert.equal(manifest.target, contract.id);
  assert.equal(manifest.pageCount, 1);
  assert.equal(manifest.animations.hero.loop, false);
  assert.equal(manifest.animations.hero.loopCount, 3);
  assert.equal(manifest.frames[1].hash, 'bbbb0000');
  assert.deepEqual(plain(manifest.pages[0]), {
    pageIndex: 0,
    startFrame: 0,
    frameCount: 2,
    file: 'hero_arcade-runtime-4x4_p01.png',
    columns: 4,
    rows: 4,
  });
}

console.log('sprite fan export core contract OK');
