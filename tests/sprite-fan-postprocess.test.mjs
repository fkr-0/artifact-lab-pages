import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeFramePixels,
  applyPostprocessPipeline,
  collectPostprocessIssues,
  fillAlphaPinholes,
  findAlphaComponents,
  findTransparentHoles,
  removeStrayPixels,
} from '../sprite-fan/lib/sprite-postprocess.mjs';

function makeImage(width, height, fill = [0, 0, 0, 0]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return { width, height, data };
}

function setPixel(image, x, y, rgba) {
  const i = (y * image.width + x) * 4;
  image.data[i] = rgba[0];
  image.data[i + 1] = rgba[1];
  image.data[i + 2] = rgba[2];
  image.data[i + 3] = rgba[3];
}

function alphaAt(image, x, y) {
  return image.data[(y * image.width + x) * 4 + 3];
}

test('analyzeFramePixels reports bbox, soft alpha and center of mass', () => {
  const image = makeImage(6, 5);
  setPixel(image, 2, 1, [10, 20, 30, 255]);
  setPixel(image, 3, 1, [10, 20, 30, 128]);
  setPixel(image, 3, 3, [10, 20, 30, 255]);

  const metrics = analyzeFramePixels(image);
  assert.equal(metrics.pixels, 3);
  assert.equal(metrics.soft, 1);
  assert.deepEqual(metrics.bbox, { x: 2, y: 1, w: 2, h: 3 });
  assert.ok(metrics.center.x > 2.4 && metrics.center.x < 3.1);
  assert.ok(metrics.center.y > 1.4 && metrics.center.y < 2.4);
});

test('removeStrayPixels removes isolated alpha while preserving main silhouettes', () => {
  const image = makeImage(8, 8);
  for (let y = 2; y <= 4; y += 1) {
    for (let x = 2; x <= 4; x += 1) setPixel(image, x, y, [80, 120, 180, 255]);
  }
  setPixel(image, 7, 7, [255, 0, 0, 255]);

  const cleaned = removeStrayPixels(image, 4);
  assert.equal(alphaAt(cleaned, 7, 7), 0);
  assert.equal(alphaAt(cleaned, 3, 3), 255);
  assert.equal(findAlphaComponents(cleaned).length, 1);
});

test('fillAlphaPinholes fills enclosed transparent islands without filling outside matte', () => {
  const image = makeImage(7, 7);
  for (let y = 1; y <= 5; y += 1) {
    for (let x = 1; x <= 5; x += 1) setPixel(image, x, y, [40, 100, 180, 255]);
  }
  setPixel(image, 3, 3, [0, 0, 0, 0]);

  assert.equal(findTransparentHoles(image, 4).length, 1);
  const filled = fillAlphaPinholes(image, 4);
  assert.equal(alphaAt(filled, 3, 3), 255);
  assert.equal(alphaAt(filled, 0, 0), 0);
});

test('collectPostprocessIssues captures reviewable sprite problems', () => {
  const image = makeImage(9, 9);
  for (let y = 2; y <= 6; y += 1) {
    for (let x = 2; x <= 6; x += 1) setPixel(image, x, y, [100, 100, 100, 255]);
  }
  setPixel(image, 4, 4, [0, 0, 0, 0]);
  setPixel(image, 8, 8, [200, 0, 0, 255]);

  const issues = collectPostprocessIssues(image, { strayMaxSize: 2, holeMaxSize: 2 });
  assert.equal(issues.strayCount, 1);
  assert.equal(issues.strayPixels, 1);
  assert.equal(issues.pinholeCount, 1);
  assert.equal(issues.pinholePixels, 1);
});

test('applyPostprocessPipeline removes strays and fills pinholes in one deterministic pass', () => {
  const image = makeImage(9, 9);
  for (let y = 2; y <= 6; y += 1) {
    for (let x = 2; x <= 6; x += 1) setPixel(image, x, y, [100, 100, 100, 255]);
  }
  setPixel(image, 4, 4, [0, 0, 0, 0]);
  setPixel(image, 8, 8, [200, 0, 0, 255]);

  const cleaned = applyPostprocessPipeline(image, { strayMaxSize: 2, holeMaxSize: 2 });
  assert.equal(alphaAt(cleaned, 4, 4), 255);
  assert.equal(alphaAt(cleaned, 8, 8), 0);
  assert.equal(collectPostprocessIssues(cleaned, { strayMaxSize: 2, holeMaxSize: 2 }).strayCount, 0);
});
