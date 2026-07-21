import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sprite-fan/src/gif-core.js', import.meta.url), 'utf8');
const context = vm.createContext({ Uint8Array });
context.globalThis = context;
vm.runInContext(source, context, { filename: 'gif-core.js' });
const core = context.SpriteFanGifCore;

assert.ok(core, 'GIF core should install itself in a classic-script context');

function unpackFixedWidth(bytes, width) {
  const codes = [];
  let current = 0;
  let bitCount = 0;
  for (const byte of bytes) {
    current |= byte << bitCount;
    bitCount += 8;
    while (bitCount >= width) {
      codes.push(current & ((1 << width) - 1));
      current >>>= width;
      bitCount -= width;
    }
  }
  return codes;
}

function frame(width, height, rgba) {
  const data = new Uint8Array(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) data.set(rgba, offset);
  return { width, height, data };
}

{
  const indices = Uint8Array.from({ length: 600 }, (_, index) => index % 3);
  const codes = unpackFixedWidth(core.lzwEncodeFlatIndices(indices, 8), 9);
  const clearPositions = codes
    .map((code, index) => (code === 256 ? index : -1))
    .filter((index) => index >= 0);
  assert.deepEqual(clearPositions, [0, 255, 510]);
  assert.equal(codes.at(-1), 257);
  assert.equal(codes.filter((code) => code < 256).length, 600);
}

{
  const transparent = frame(20, 20, [60, 120, 240, 0]);
  const opaque = frame(20, 20, [240, 120, 60, 255]);
  const bytes = core.encodeGifBytes({ frames: [transparent, opaque], fps: 10, loopCount: 4 });
  assert.equal(String.fromCharCode(...bytes.slice(0, 6)), 'GIF89a');
  assert.equal(bytes[6] | (bytes[7] << 8), 20);
  assert.equal(bytes[8] | (bytes[9] << 8), 20);
  assert.equal(bytes.at(-1), 0x3B);
  assert.ok(bytes.length > 800, 'long frames should produce complete image payloads');
  const netscape = Array.from(bytes).findIndex((value, index) => (
    value === 0x4E && String.fromCharCode(...bytes.slice(index, index + 11)) === 'NETSCAPE2.0'
  ));
  assert.ok(netscape > 0);
  assert.equal(bytes[netscape + 13] | (bytes[netscape + 14] << 8), 4);
}

assert.throws(
  () => core.encodeGifBytes({ frames: [] }),
  /at least one frame/,
);
assert.throws(
  () => core.encodeGifBytes({ frames: [frame(2, 2, [0, 0, 0, 255]), frame(3, 2, [0, 0, 0, 255])] }),
  /stable frame size/,
);
assert.throws(
  () => core.encodeGifBytes({ frames: [frame(2, 2, [0, 0, 0, 255])], fps: 0 }),
  /FPS/,
);
assert.throws(
  () => core.encodeGifBytes({ frames: [frame(2, 2, [0, 0, 0, 255])], loopCount: 70000 }),
  /loop count/,
);

console.log('sprite fan GIF core contract OK');
