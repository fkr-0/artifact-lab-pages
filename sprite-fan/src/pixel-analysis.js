(function installSpriteFanPixelAnalysis(root) {
  'use strict';

  const DIRS_4 = Object.freeze([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  const DIRS_8 = Object.freeze([...DIRS_4, [1, 1], [-1, -1], [1, -1], [-1, 1]]);

  function assertImageDataLike(imageData, label = 'imageData') {
    if (!imageData || !Number.isInteger(imageData.width) || !Number.isInteger(imageData.height)) {
      throw new TypeError(`${label} must expose integer width and height`);
    }
    if (imageData.width <= 0 || imageData.height <= 0) {
      throw new RangeError(`${label} width and height must be positive`);
    }
    const expected = imageData.width * imageData.height * 4;
    if (!imageData.data || typeof imageData.data.length !== 'number' || imageData.data.length !== expected) {
      throw new RangeError(`${label} RGBA payload has ${imageData.data?.length ?? 0} bytes, expected ${expected}`);
    }
    return imageData;
  }

  function rgbaIndex(width, x, y) {
    return (y * width + x) * 4;
  }

  function analyzeFramePixels(imageData) {
    if (!imageData) return null;
    const { width, height, data } = assertImageDataLike(imageData);
    let pixels = 0;
    let soft = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let weightedX = 0;
    let weightedY = 0;
    let alphaTotal = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[rgbaIndex(width, x, y) + 3];
        if (alpha === 0) continue;
        pixels += 1;
        if (alpha < 255) soft += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        weightedX += x * alpha;
        weightedY += y * alpha;
        alphaTotal += alpha;
      }
    }

    return {
      pixels,
      soft,
      bbox: pixels ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null,
      center: alphaTotal
        ? { x: weightedX / alphaTotal, y: weightedY / alphaTotal }
        : { x: width / 2, y: height / 2 },
    };
  }

  function findAlphaComponents(imageData, alphaThreshold = 0, connectivity = 4) {
    const { width, height, data } = assertImageDataLike(imageData);
    const threshold = Math.max(0, Math.min(255, Math.round(Number(alphaThreshold) || 0)));
    const dirs = connectivity === 8 ? DIRS_8 : DIRS_4;
    const visited = new Uint8Array(width * height);
    const components = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || data[start * 4 + 3] <= threshold) continue;
        const pixels = [];
        const stack = [[x, y]];
        let minX = x;
        let minY = y;
        let maxX = x;
        let maxY = y;
        visited[start] = 1;

        while (stack.length) {
          const [cx, cy] = stack.pop();
          const cell = cy * width + cx;
          pixels.push(cell);
          minX = Math.min(minX, cx);
          minY = Math.min(minY, cy);
          maxX = Math.max(maxX, cx);
          maxY = Math.max(maxY, cy);
          for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const next = ny * width + nx;
            if (visited[next] || data[next * 4 + 3] <= threshold) continue;
            visited[next] = 1;
            stack.push([nx, ny]);
          }
        }

        components.push({
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          count: pixels.length,
          pixels,
        });
      }
    }
    return components;
  }

  function findTransparentHoles(imageData, maxSize = 4) {
    const { width, height, data } = assertImageDataLike(imageData);
    const limit = Math.max(0, Math.round(Number(maxSize) || 0));
    if (limit === 0) return [];
    const visited = new Uint8Array(width * height);
    const holes = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || data[start * 4 + 3] > 0) continue;
        const pixels = [];
        const stack = [[x, y]];
        let touchesEdge = false;
        visited[start] = 1;
        while (stack.length) {
          const [cx, cy] = stack.pop();
          const cell = cy * width + cx;
          pixels.push(cell);
          if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) touchesEdge = true;
          for (const [dx, dy] of DIRS_4) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const next = ny * width + nx;
            if (visited[next] || data[next * 4 + 3] > 0) continue;
            visited[next] = 1;
            stack.push([nx, ny]);
          }
        }
        if (!touchesEdge && pixels.length <= limit) holes.push({ pixels, count: pixels.length });
      }
    }
    return holes;
  }

  function hashImageData(imageData) {
    const { data } = assertImageDataLike(imageData);
    let hash = 2166136261 >>> 0;
    for (let index = 0; index < data.length; index += 1) {
      hash ^= data[index];
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function collectPostprocessIssues(imageData, options = {}) {
    const strayMaxSize = Math.max(0, Math.round(Number(options.strayMaxSize ?? 4)));
    const holeMaxSize = Math.max(0, Math.round(Number(options.holeMaxSize ?? strayMaxSize)));
    const alphaThreshold = Math.max(0, Math.min(255, Math.round(Number(options.alphaThreshold ?? 0))));
    const components = findAlphaComponents(imageData, alphaThreshold, 4);
    const stray = components.filter((component) => component.count < strayMaxSize);
    const holes = findTransparentHoles(imageData, holeMaxSize);
    return {
      ...analyzeFramePixels(imageData),
      hash: hashImageData(imageData),
      componentCount: components.length,
      strayCount: stray.length,
      strayPixels: stray.reduce((sum, component) => sum + component.count, 0),
      pinholeCount: holes.length,
      pinholePixels: holes.reduce((sum, hole) => sum + hole.count, 0),
    };
  }

  function analyzeFrameSequence(frames, options = {}) {
    if (!Array.isArray(frames)) throw new TypeError('frames must be an array');
    if (frames.length === 0) return [];
    const referenceIndex = Math.max(0, Math.min(frames.length - 1, Math.round(Number(options.referenceIndex) || 0)));
    const jitterThreshold = Math.max(0, Number(options.jitterThreshold) || 0);
    const metrics = frames.map((frame, index) => {
      const imageData = frame?.imgData || frame;
      const review = collectPostprocessIssues(imageData, options);
      return { index, frame, ...review };
    });
    const reference = metrics[referenceIndex];
    return metrics.map((metric) => {
      const centerDelta = {
        x: metric.center.x - reference.center.x,
        y: metric.center.y - reference.center.y,
      };
      const issues = [];
      if (metric.strayCount) issues.push(`stray ${metric.strayPixels}px`);
      if (metric.pinholeCount) issues.push(`holes ${metric.pinholePixels}px`);
      if (Math.abs(centerDelta.x) > jitterThreshold || Math.abs(centerDelta.y) > jitterThreshold) {
        issues.push(`jitter ${centerDelta.x.toFixed(1)},${centerDelta.y.toFixed(1)}`);
      }
      return { ...metric, centerDelta, issues };
    });
  }

  root.SpriteFanPixelAnalysis = Object.freeze({
    assertImageDataLike,
    rgbaIndex,
    analyzeFramePixels,
    findAlphaComponents,
    findTransparentHoles,
    hashImageData,
    collectPostprocessIssues,
    analyzeFrameSequence,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
