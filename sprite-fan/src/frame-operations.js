(function installSpriteFanFrameOperations(root) {
  'use strict';

  const analysis = root.SpriteFanPixelAnalysis;
  if (!analysis) throw new Error('SpriteFanPixelAnalysis must load before frame-operations.js');
  const { assertImageDataLike, findAlphaComponents, findTransparentHoles, analyzeFramePixels } = analysis;
  const DIRS_4 = Object.freeze([[1, 0], [-1, 0], [0, 1], [0, -1]]);

  function createImageDataLike(width, height, data) {
    const payload = data ? new Uint8ClampedArray(data) : new Uint8ClampedArray(width * height * 4);
    if (typeof root.ImageData === 'function') {
      try {
        return new root.ImageData(payload, width, height);
      } catch (_error) {
        // Plain image-data objects keep the pure module usable in Node tests.
      }
    }
    return { width, height, data: payload };
  }

  function cloneImageDataLike(imageData) {
    const { width, height, data } = assertImageDataLike(imageData);
    return createImageDataLike(width, height, data);
  }

  function removeStrayPixels(imageData, maxSize = 4) {
    const out = cloneImageDataLike(imageData);
    const limit = Math.max(0, Math.round(Number(maxSize) || 0));
    if (limit === 0) return out;
    for (const component of findAlphaComponents(out, 0, 4)) {
      if (component.count >= limit) continue;
      for (const pixel of component.pixels) out.data.fill(0, pixel * 4, pixel * 4 + 4);
    }
    return out;
  }

  function fillAlphaPinholes(imageData, maxSize = 4) {
    const source = cloneImageDataLike(imageData);
    const out = cloneImageDataLike(imageData);
    const { width, height } = source;
    for (const hole of findTransparentHoles(source, maxSize)) {
      const holeSet = new Set(hole.pixels);
      const boundary = new Set();
      for (const pixel of hole.pixels) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        for (const [dx, dy] of DIRS_4) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const neighbour = ny * width + nx;
          if (!holeSet.has(neighbour) && source.data[neighbour * 4 + 3] > 0) boundary.add(neighbour);
        }
      }
      if (!boundary.size) continue;
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      for (const pixel of boundary) {
        const offset = pixel * 4;
        red += source.data[offset];
        green += source.data[offset + 1];
        blue += source.data[offset + 2];
        alpha += source.data[offset + 3];
      }
      const rgba = [red, green, blue, alpha].map((value) => Math.round(value / boundary.size));
      for (const pixel of hole.pixels) {
        const offset = pixel * 4;
        out.data[offset] = rgba[0];
        out.data[offset + 1] = rgba[1];
        out.data[offset + 2] = rgba[2];
        out.data[offset + 3] = rgba[3] || 255;
      }
    }
    return out;
  }

  function shiftImageData(imageData, dx, dy) {
    const { width, height, data } = assertImageDataLike(imageData);
    const shiftX = Math.round(Number(dx) || 0);
    const shiftY = Math.round(Number(dy) || 0);
    const out = createImageDataLike(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const targetX = x + shiftX;
        const targetY = y + shiftY;
        if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) continue;
        const sourceOffset = (y * width + x) * 4;
        const targetOffset = (targetY * width + targetX) * 4;
        out.data.set(data.subarray(sourceOffset, sourceOffset + 4), targetOffset);
      }
    }
    return out;
  }

  function erodeAlpha(imageData, radius = 1) {
    const { width, height, data } = assertImageDataLike(imageData);
    const r = Math.max(0, Math.round(Number(radius) || 0));
    if (r === 0) return cloneImageDataLike(imageData);
    const out = createImageDataLike(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        let minAlpha = 255;
        for (let dy = -r; dy <= r && minAlpha > 0; dy += 1) {
          for (let dx = -r; dx <= r; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              minAlpha = 0;
              break;
            }
            minAlpha = Math.min(minAlpha, data[(ny * width + nx) * 4 + 3]);
          }
        }
        if (minAlpha > 0) out.data.set(data.subarray(offset, offset + 3), offset);
        out.data[offset + 3] = minAlpha;
      }
    }
    return out;
  }

  function dilateAlpha(imageData, radius = 1) {
    const { width, height, data } = assertImageDataLike(imageData);
    const r = Math.max(0, Math.round(Number(radius) || 0));
    if (r === 0) return cloneImageDataLike(imageData);
    const out = createImageDataLike(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const targetOffset = (y * width + x) * 4;
        let bestAlpha = 0;
        let bestDistance = Infinity;
        let bestOffset = -1;
        for (let dy = -r; dy <= r; dy += 1) {
          for (let dx = -r; dx <= r; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const sourceOffset = (ny * width + nx) * 4;
            const alpha = data[sourceOffset + 3];
            const distance = dx * dx + dy * dy;
            if (alpha > bestAlpha || (alpha === bestAlpha && alpha > 0 && distance < bestDistance)) {
              bestAlpha = alpha;
              bestDistance = distance;
              bestOffset = sourceOffset;
            }
          }
        }
        if (bestOffset >= 0) out.data.set(data.subarray(bestOffset, bestOffset + 3), targetOffset);
        out.data[targetOffset + 3] = bestAlpha;
      }
    }
    return out;
  }

  function normalizeOutline(imageData, radius = 1) {
    const source = cloneImageDataLike(imageData);
    const r = Math.max(0, Math.round(Number(radius) || 0));
    if (r === 0) return source;
    const opened = dilateAlpha(erodeAlpha(source, 1), Math.max(1, r));
    for (let offset = 0; offset < source.data.length; offset += 4) {
      if (source.data[offset + 3] > 0 && opened.data[offset + 3] === 0) {
        source.data[offset + 3] = Math.min(source.data[offset + 3], 64);
      } else if (opened.data[offset + 3] > 0 && source.data[offset + 3] === 0) {
        source.data.set(opened.data.subarray(offset, offset + 4), offset);
      }
    }
    return source;
  }

  function softenEdges(imageData, radius = 1) {
    const source = cloneImageDataLike(imageData);
    const out = cloneImageDataLike(imageData);
    const { width, height } = source;
    const rawRadius = Math.max(0, Number(radius) || 0);
    if (rawRadius === 0) return out;
    const r = Math.ceil(rawRadius);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (source.data[offset + 3] === 0) continue;
        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 0;
        let totalWeight = 0;
        for (let dy = -r; dy <= r; dy += 1) {
          for (let dx = -r; dx <= r; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > rawRadius) continue;
            const weight = 1 - distance / (rawRadius + 1);
            const sourceOffset = (ny * width + nx) * 4;
            red += source.data[sourceOffset] * weight;
            green += source.data[sourceOffset + 1] * weight;
            blue += source.data[sourceOffset + 2] * weight;
            alpha += source.data[sourceOffset + 3] * weight;
            totalWeight += weight;
          }
        }
        if (totalWeight > 0) {
          out.data[offset] = Math.round(red / totalWeight);
          out.data[offset + 1] = Math.round(green / totalWeight);
          out.data[offset + 2] = Math.round(blue / totalWeight);
          out.data[offset + 3] = Math.round(alpha / totalWeight);
        }
      }
    }
    return out;
  }

  function forceLowAlphaTransparent(imageData, threshold = 8) {
    const out = cloneImageDataLike(imageData);
    const limit = Math.max(0, Math.min(255, Math.round(Number(threshold) || 0)));
    for (let offset = 3; offset < out.data.length; offset += 4) {
      if (out.data[offset] < limit) out.data.fill(0, offset - 3, offset + 1);
    }
    return out;
  }

  function applyPostprocessPipeline(imageData, options = {}) {
    const strayMaxSize = options.strayMaxSize ?? 4;
    const holeMaxSize = options.holeMaxSize ?? strayMaxSize;
    let out = cloneImageDataLike(imageData);
    if (options.removeStray !== false) out = removeStrayPixels(out, strayMaxSize);
    if (options.fillPinholes !== false) out = fillAlphaPinholes(out, holeMaxSize);
    if ((Number(options.outlineRadius) || 0) > 0) out = normalizeOutline(out, options.outlineRadius);
    if ((Number(options.softenRadius) || 0) > 0) out = softenEdges(out, options.softenRadius);
    if ((Number(options.erodeRadius) || 0) > 0) out = erodeAlpha(out, options.erodeRadius);
    if ((Number(options.dilateRadius) || 0) > 0) out = dilateAlpha(out, options.dilateRadius);
    if (options.forceTransparent) out = forceLowAlphaTransparent(out, options.transparentThreshold ?? 8);
    return out;
  }

  function planFrameAlignment(frames, options = {}) {
    if (!Array.isArray(frames)) throw new TypeError('frames must be an array');
    if (frames.length === 0) return [];
    const referenceIndex = Math.max(0, Math.min(frames.length - 1, Math.round(Number(options.referenceIndex) || 0)));
    const threshold = Math.max(0, Number(options.threshold) || 0);
    const metrics = frames.map((frame) => analyzeFramePixels(frame?.imgData || frame));
    const reference = metrics[referenceIndex];
    return metrics.map((metric, index) => {
      const dx = Math.round(reference.center.x - metric.center.x);
      const dy = Math.round(reference.center.y - metric.center.y);
      return {
        index,
        reference: index === referenceIndex,
        dx,
        dy,
        apply: index !== referenceIndex && (Math.abs(dx) > threshold || Math.abs(dy) > threshold),
      };
    });
  }

  function alignFrameSequence(frames, options = {}) {
    const plan = planFrameAlignment(frames, options);
    const shiftPixels = Boolean(options.shiftPixels);
    const alignedFrames = frames.map((frame, index) => {
      const adjustment = plan[index];
      const sourceImage = frame?.imgData || frame;
      const clone = frame?.imgData
        ? { ...frame, anchor: frame.anchor ? { ...frame.anchor } : frame.anchor, imgData: cloneImageDataLike(sourceImage) }
        : cloneImageDataLike(sourceImage);
      if (!adjustment.apply) return clone;
      if (frame?.imgData) {
        if (shiftPixels) clone.imgData = shiftImageData(sourceImage, adjustment.dx, adjustment.dy);
        else if (clone.anchor) {
          clone.anchor.x += adjustment.dx;
          clone.anchor.y += adjustment.dy;
        }
      } else if (shiftPixels) {
        return shiftImageData(sourceImage, adjustment.dx, adjustment.dy);
      }
      return clone;
    });
    return {
      frames: alignedFrames,
      plan,
      changedCount: plan.filter((entry) => entry.apply).length,
      mode: shiftPixels ? 'pixels' : 'anchors',
    };
  }

  root.SpriteFanFrameOperations = Object.freeze({
    createImageDataLike,
    cloneImageDataLike,
    removeStrayPixels,
    fillAlphaPinholes,
    shiftImageData,
    erodeAlpha,
    dilateAlpha,
    normalizeOutline,
    softenEdges,
    forceLowAlphaTransparent,
    applyPostprocessPipeline,
    planFrameAlignment,
    alignFrameSequence,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
