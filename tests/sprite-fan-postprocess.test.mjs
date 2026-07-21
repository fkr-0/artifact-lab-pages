import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const [analysisSource, operationsSource] = await Promise.all([
  readFile(new URL('../sprite-fan/src/pixel-analysis.js', import.meta.url), 'utf8'),
  readFile(new URL('../sprite-fan/src/frame-operations.js', import.meta.url), 'utf8'),
]);
const context = vm.createContext({ Uint8Array, Uint8ClampedArray });
context.globalThis = context;
vm.runInContext(analysisSource, context, { filename: 'pixel-analysis.js' });
vm.runInContext(operationsSource, context, { filename: 'frame-operations.js' });
const analysis = context.SpriteFanPixelAnalysis;
const operations = context.SpriteFanFrameOperations;
const plain = (value) => JSON.parse(JSON.stringify(value));

function makeImage(width, height, fill = [0, 0, 0, 0]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(fill, i);
  return { width, height, data };
}

function setPixel(image, x, y, rgba) {
  image.data.set(rgba, (y * image.width + x) * 4);
}

function pixelAt(image, x, y) {
  return Array.from(image.data.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4));
}

function alphaAt(image, x, y) {
  return image.data[(y * image.width + x) * 4 + 3];
}

test('production analysis core reports bbox, soft alpha, center, and stable hash', () => {
  const image = makeImage(6, 5);
  setPixel(image, 2, 1, [10, 20, 30, 255]);
  setPixel(image, 3, 1, [10, 20, 30, 128]);
  setPixel(image, 3, 3, [10, 20, 30, 255]);

  const metrics = analysis.analyzeFramePixels(image);
  assert.equal(metrics.pixels, 3);
  assert.equal(metrics.soft, 1);
  assert.deepEqual(plain(metrics.bbox), { x: 2, y: 1, w: 2, h: 3 });
  assert.ok(metrics.center.x > 2.4 && metrics.center.x < 3.1);
  assert.ok(metrics.center.y > 1.4 && metrics.center.y < 2.4);
  assert.equal(analysis.hashImageData(image), analysis.hashImageData(image));
});

test('component analysis makes connectivity explicit', () => {
  const image = makeImage(3, 3);
  setPixel(image, 0, 0, [255, 255, 255, 255]);
  setPixel(image, 1, 1, [255, 255, 255, 255]);

  assert.equal(analysis.findAlphaComponents(image, 0, 4).length, 2);
  assert.equal(analysis.findAlphaComponents(image, 0, 8).length, 1);
});

test('removeStrayPixels is immutable and preserves the main silhouette', () => {
  const image = makeImage(8, 8);
  for (let y = 2; y <= 4; y += 1) {
    for (let x = 2; x <= 4; x += 1) setPixel(image, x, y, [80, 120, 180, 255]);
  }
  setPixel(image, 7, 7, [255, 0, 0, 255]);

  const cleaned = operations.removeStrayPixels(image, 4);
  assert.equal(alphaAt(cleaned, 7, 7), 0);
  assert.equal(alphaAt(cleaned, 3, 3), 255);
  assert.equal(alphaAt(image, 7, 7), 255, 'source pixels must not be mutated');
  assert.equal(analysis.findAlphaComponents(cleaned).length, 1);
});

test('multi-pixel pinholes use one deterministic boundary color without mutating source', () => {
  const image = makeImage(8, 6);
  for (let y = 1; y <= 4; y += 1) {
    for (let x = 1; x <= 6; x += 1) setPixel(image, x, y, [40, 100, 180, 255]);
  }
  setPixel(image, 3, 2, [0, 0, 0, 0]);
  setPixel(image, 4, 2, [0, 0, 0, 0]);
  setPixel(image, 2, 2, [100, 100, 100, 255]);
  setPixel(image, 5, 2, [200, 100, 100, 255]);

  assert.equal(analysis.findTransparentHoles(image, 2).length, 1);
  const filled = operations.fillAlphaPinholes(image, 2);
  assert.deepEqual(pixelAt(filled, 3, 2), pixelAt(filled, 4, 2));
  assert.equal(alphaAt(filled, 3, 2), 255);
  assert.equal(alphaAt(image, 3, 2), 0);
  assert.equal(alphaAt(filled, 0, 0), 0);
});

test('sequence review reports jitter relative to one selected reference', () => {
  const first = makeImage(7, 5);
  const second = makeImage(7, 5);
  setPixel(first, 2, 2, [255, 255, 255, 255]);
  setPixel(second, 5, 2, [255, 255, 255, 255]);

  const reviews = analysis.analyzeFrameSequence(
    [{ imgData: first }, { imgData: second }],
    { jitterThreshold: 1, referenceIndex: 0, strayMaxSize: 1, holeMaxSize: 1 },
  );
  assert.deepEqual(plain(reviews[0].centerDelta), { x: 0, y: 0 });
  assert.deepEqual(plain(reviews[1].centerDelta), { x: 3, y: 0 });
  assert.match(reviews[1].issues.join(' '), /jitter 3\.0,0\.0/);
});

test('cleanup pipeline composes repair and morphology in deterministic order', () => {
  const image = makeImage(9, 9);
  for (let y = 2; y <= 6; y += 1) {
    for (let x = 2; x <= 6; x += 1) setPixel(image, x, y, [100, 100, 100, 255]);
  }
  setPixel(image, 4, 4, [0, 0, 0, 0]);
  setPixel(image, 8, 8, [200, 0, 0, 255]);

  const cleaned = operations.applyPostprocessPipeline(image, {
    strayMaxSize: 2,
    holeMaxSize: 2,
    erodeRadius: 0,
    dilateRadius: 0,
  });
  assert.equal(alphaAt(cleaned, 4, 4), 255);
  assert.equal(alphaAt(cleaned, 8, 8), 0);
  assert.equal(analysis.collectPostprocessIssues(cleaned, { strayMaxSize: 2, holeMaxSize: 2 }).strayCount, 0);
});

test('morphology preserves dimensions and copies nearest source color', () => {
  const image = makeImage(5, 5);
  setPixel(image, 2, 2, [10, 80, 200, 255]);

  const dilated = operations.dilateAlpha(image, 1);
  assert.equal(dilated.width, 5);
  assert.equal(dilated.height, 5);
  assert.deepEqual(pixelAt(dilated, 2, 1), [10, 80, 200, 255]);
  const eroded = operations.erodeAlpha(dilated, 1);
  assert.equal(alphaAt(eroded, 2, 2), 255);
  assert.equal(alphaAt(image, 2, 1), 0);
});

test('frame alignment supports non-destructive anchor and pixel modes', () => {
  const first = makeImage(8, 6);
  const second = makeImage(8, 6);
  setPixel(first, 2, 2, [255, 255, 255, 255]);
  setPixel(second, 5, 3, [255, 255, 255, 255]);
  const frames = [
    { imgData: first, anchor: { x: 4, y: 6 }, label: 'a' },
    { imgData: second, anchor: { x: 4, y: 6 }, label: 'b' },
  ];

  const anchorResult = operations.alignFrameSequence(frames, { threshold: 1, shiftPixels: false });
  assert.equal(anchorResult.changedCount, 1);
  assert.equal(anchorResult.mode, 'anchors');
  assert.deepEqual(plain(anchorResult.plan[1]), { index: 1, reference: false, dx: -3, dy: -1, apply: true });
  assert.deepEqual(plain(anchorResult.frames[1].anchor), { x: 1, y: 5 });
  assert.deepEqual(frames[1].anchor, { x: 4, y: 6 }, 'source anchors must not be mutated');

  const pixelResult = operations.alignFrameSequence(frames, { threshold: 1, shiftPixels: true });
  assert.equal(alphaAt(pixelResult.frames[1].imgData, 2, 2), 255);
  assert.equal(alphaAt(frames[1].imgData, 5, 3), 255, 'source pixels must not be mutated');
});

test('analysis rejects malformed RGBA payloads early', () => {
  assert.throws(
    () => analysis.analyzeFramePixels({ width: 2, height: 2, data: new Uint8ClampedArray(4) }),
    /expected 16/,
  );
});
