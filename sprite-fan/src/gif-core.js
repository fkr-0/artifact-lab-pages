(function installSpriteFanGifCore(root) {
  'use strict';

  function pushAscii(output, value) {
    for (let index = 0; index < value.length; index += 1) {
      output.push(value.charCodeAt(index));
    }
  }

  function pushUint16(output, value) {
    output.push(value & 255, (value >> 8) & 255);
  }

  function writeSubBlocks(output, bytes) {
    let offset = 0;
    while (offset < bytes.length) {
      const count = Math.min(255, bytes.length - offset);
      output.push(count);
      for (let index = 0; index < count; index += 1) output.push(bytes[offset + index]);
      offset += count;
    }
    output.push(0);
  }

  function packFixedWidthCodes(codes, codeWidth) {
    let current = 0;
    let bitCount = 0;
    const output = [];
    for (const code of codes) {
      current |= code << bitCount;
      bitCount += codeWidth;
      while (bitCount >= 8) {
        output.push(current & 255);
        current >>>= 8;
        bitCount -= 8;
      }
    }
    if (bitCount > 0) output.push(current & 255);
    return Uint8Array.from(output);
  }

  function lzwEncodeFlatIndices(indices, minimumCodeSize = 8) {
    const minSize = Math.max(2, Math.min(8, Math.round(Number(minimumCodeSize) || 8)));
    const clearCode = 1 << minSize;
    const endCode = clearCode + 1;
    const codeWidth = minSize + 1;
    // Clearing before the decoder reaches the next code width keeps this tiny
    // literal-only encoder valid for frames of any size.
    const literalsPerClear = (1 << codeWidth) - clearCode - 2;
    const codes = [];
    let offset = 0;
    do {
      codes.push(clearCode);
      const end = Math.min(indices.length, offset + literalsPerClear);
      for (; offset < end; offset += 1) codes.push(Number(indices[offset]) & (clearCode - 1));
    } while (offset < indices.length);
    codes.push(endCode);
    return packFixedWidthCodes(codes, codeWidth);
  }

  function normalizeFrame(frame, index) {
    const source = frame?.imgData || frame;
    const width = Math.round(Number(source?.width));
    const height = Math.round(Number(source?.height));
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new RangeError(`GIF frame ${index} has invalid dimensions`);
    }
    const data = source?.data;
    if (!data || typeof data.length !== 'number' || data.length !== width * height * 4) {
      throw new RangeError(`GIF frame ${index} has an invalid RGBA payload`);
    }
    return { width, height, data };
  }

  function quantizeChannel(value) {
    return Math.max(0, Math.min(255, Math.round(Number(value) / 51) * 51));
  }

  function collectPalette(frames) {
    const colors = new Map();
    let hasTransparency = false;
    for (const frame of frames) {
      for (let offset = 0; offset < frame.data.length; offset += 4) {
        if (frame.data[offset + 3] < 128) {
          hasTransparency = true;
          continue;
        }
        const color = [
          quantizeChannel(frame.data[offset]),
          quantizeChannel(frame.data[offset + 1]),
          quantizeChannel(frame.data[offset + 2]),
        ];
        const key = color.join(',');
        if (!colors.has(key) && colors.size < 255) colors.set(key, color);
      }
    }
    const palette = [[0, 0, 0], ...colors.values()];
    while (palette.length < 256) palette.push([0, 0, 0]);
    return { palette, hasTransparency };
  }

  function frameIndices(frame, colorToIndex) {
    const indices = new Uint8Array(frame.width * frame.height);
    let target = 0;
    for (let offset = 0; offset < frame.data.length; offset += 4) {
      if (frame.data[offset + 3] < 128) {
        indices[target] = 0;
      } else {
        const key = [
          quantizeChannel(frame.data[offset]),
          quantizeChannel(frame.data[offset + 1]),
          quantizeChannel(frame.data[offset + 2]),
        ].join(',');
        indices[target] = colorToIndex.get(key) || 1;
      }
      target += 1;
    }
    return indices;
  }

  function encodeGifBytes({ frames, fps = 12, loopCount = 0 }) {
    if (!Array.isArray(frames) || frames.length === 0) {
      throw new TypeError('GIF export requires at least one frame');
    }
    const normalizedFrames = frames.map(normalizeFrame);
    const { width, height } = normalizedFrames[0];
    if (!normalizedFrames.every((frame) => frame.width === width && frame.height === height)) {
      throw new RangeError('GIF export requires stable frame size');
    }
    const normalizedFps = Number(fps);
    if (!Number.isFinite(normalizedFps) || normalizedFps <= 0 || normalizedFps > 120) {
      throw new RangeError('GIF FPS must be between 1 and 120');
    }
    const normalizedLoopCount = Math.round(Number(loopCount));
    if (!Number.isFinite(normalizedLoopCount) || normalizedLoopCount < 0 || normalizedLoopCount > 65535) {
      throw new RangeError('GIF loop count must be between 0 and 65535');
    }

    const delayCentiseconds = Math.max(1, Math.round(100 / normalizedFps));
    const { palette } = collectPalette(normalizedFrames);
    const colorToIndex = new Map();
    palette.forEach((color, index) => {
      if (index > 0 && !colorToIndex.has(color.join(','))) colorToIndex.set(color.join(','), index);
    });

    const output = [];
    pushAscii(output, 'GIF89a');
    pushUint16(output, width);
    pushUint16(output, height);
    output.push(0xF7, 0, 0);
    palette.forEach(([red, green, blue]) => output.push(red, green, blue));

    output.push(0x21, 0xFF, 11);
    pushAscii(output, 'NETSCAPE2.0');
    output.push(3, 1);
    pushUint16(output, normalizedLoopCount);
    output.push(0);

    for (const frame of normalizedFrames) {
      let transparent = false;
      for (let offset = 3; offset < frame.data.length; offset += 4) {
        if (frame.data[offset] < 128) {
          transparent = true;
          break;
        }
      }
      output.push(0x21, 0xF9, 4, transparent ? 0x09 : 0x08);
      pushUint16(output, delayCentiseconds);
      output.push(0, 0);
      output.push(0x2C);
      pushUint16(output, 0);
      pushUint16(output, 0);
      pushUint16(output, width);
      pushUint16(output, height);
      output.push(0);
      output.push(8);
      writeSubBlocks(output, lzwEncodeFlatIndices(frameIndices(frame, colorToIndex), 8));
    }
    output.push(0x3B);
    return Uint8Array.from(output);
  }

  root.SpriteFanGifCore = Object.freeze({
    packFixedWidthCodes,
    lzwEncodeFlatIndices,
    quantizeChannel,
    collectPalette,
    encodeGifBytes,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
