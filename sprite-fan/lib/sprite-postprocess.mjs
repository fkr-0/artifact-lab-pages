export function cloneImageDataLike(imageData) {
  return {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data),
  };
}

export function rgbaIndex(width, x, y) {
  return (y * width + x) * 4;
}

export function analyzeFramePixels(imageData) {
  if (!imageData) return null;
  const { width, height, data } = imageData;
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
    bbox: pixels
      ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
      : null,
    center: alphaTotal
      ? { x: weightedX / alphaTotal, y: weightedY / alphaTotal }
      : { x: width / 2, y: height / 2 },
  };
}

export function findAlphaComponents(imageData, alphaThreshold = 0, connectivity = 4) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const components = [];
  const dirs4 = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const dirs8 = [
    ...dirs4,
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];
  const dirs = connectivity === 8 ? dirs8 : dirs4;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (visited[start] || data[start * 4 + 3] <= alphaThreshold) continue;

      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      const pixels = [];
      const stack = [[x, y]];
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
          if (visited[next] || data[next * 4 + 3] <= alphaThreshold) continue;
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

export function removeStrayPixels(imageData, maxSize = 4) {
  const out = cloneImageDataLike(imageData);
  const components = findAlphaComponents(out, 0, 4);
  for (const component of components) {
    if (component.count >= maxSize) continue;
    for (const pixel of component.pixels) {
      const i = pixel * 4;
      out.data[i] = 0;
      out.data[i + 1] = 0;
      out.data[i + 2] = 0;
      out.data[i + 3] = 0;
    }
  }
  return out;
}

export function findTransparentHoles(imageData, maxSize = 4) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const holes = [];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

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

        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (visited[next] || data[next * 4 + 3] > 0) continue;
          visited[next] = 1;
          stack.push([nx, ny]);
        }
      }

      if (!touchesEdge && pixels.length <= maxSize) {
        holes.push({ pixels, count: pixels.length });
      }
    }
  }

  return holes;
}

export function fillAlphaPinholes(imageData, maxSize = 4) {
  const out = cloneImageDataLike(imageData);
  const holes = findTransparentHoles(out, maxSize);
  const { width, height, data } = out;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (const hole of holes) {
    for (const pixel of hole.pixels) {
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const i = rgbaIndex(width, nx, ny);
        if (data[i + 3] === 0) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        a += data[i + 3];
        n += 1;
      }

      if (n > 0) {
        const i = pixel * 4;
        data[i] = Math.round(r / n);
        data[i + 1] = Math.round(g / n);
        data[i + 2] = Math.round(b / n);
        data[i + 3] = Math.round(a / n) || 255;
      }
    }
  }

  return out;
}

export function collectPostprocessIssues(imageData, options = {}) {
  const strayMaxSize = options.strayMaxSize ?? 4;
  const holeMaxSize = options.holeMaxSize ?? strayMaxSize;
  const alphaThreshold = options.alphaThreshold ?? 0;
  const components = findAlphaComponents(imageData, alphaThreshold, 4);
  const stray = components.filter((component) => component.count < strayMaxSize);
  const holes = findTransparentHoles(imageData, holeMaxSize);
  const metrics = analyzeFramePixels(imageData);

  return {
    ...metrics,
    componentCount: components.length,
    strayCount: stray.length,
    strayPixels: stray.reduce((sum, component) => sum + component.count, 0),
    pinholeCount: holes.length,
    pinholePixels: holes.reduce((sum, hole) => sum + hole.count, 0),
  };
}

export function applyPostprocessPipeline(imageData, options = {}) {
  const strayMaxSize = options.strayMaxSize ?? 4;
  const holeMaxSize = options.holeMaxSize ?? strayMaxSize;
  let out = cloneImageDataLike(imageData);
  if (options.removeStray !== false) out = removeStrayPixels(out, strayMaxSize);
  if (options.fillPinholes !== false) out = fillAlphaPinholes(out, holeMaxSize);
  return out;
}
