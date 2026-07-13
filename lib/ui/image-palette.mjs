const DEFAULT_FALLBACK = Object.freeze([
  '#00ffff',
  '#ff00ff',
  '#00ff88',
  '#0a0a12',
  '#f7fbff',
]);

export function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => clampChannel(value).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function normalizeHex(value = '#000000') {
  const clean = String(value).trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return `#${clean.split('').map((char) => char + char).join('')}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean}`.toLowerCase();
  return '#000000';
}

export function hexToRgb(value = '#000000') {
  const hex = normalizeHex(value).slice(1);
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
}

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function saturation(hex) {
  const channels = hexToRgb(hex).map((value) => value / 255);
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  return max === 0 ? 0 : (max - min) / max;
}

export function colorDistance(a, b) {
  const aa = hexToRgb(a);
  const bb = hexToRgb(b);
  return Math.hypot(aa[0] - bb[0], aa[1] - bb[1], aa[2] - bb[2]);
}

export function extractPaletteFromPixels(
  pixels,
  {
    maxColors = 10,
    alphaThreshold = 40,
    quantization = 24,
    minDistance = 42,
  } = {},
) {
  const data = pixels?.data || pixels || [];
  const buckets = new Map();
  const step = Math.max(4, Number(quantization) || 24);

  for (let index = 0; index < data.length; index += 4) {
    const alpha = Number(data[index + 3] ?? 255);
    if (alpha < alphaThreshold) continue;
    const quantized = [data[index], data[index + 1], data[index + 2]].map((channel) =>
      Math.min(255, Math.round(channel / step) * step),
    );
    const color = rgbToHex(...quantized);
    const chromaWeight = 0.72 + saturation(color) * 0.48;
    const visibilityWeight = alpha / 255;
    buckets.set(color, (buckets.get(color) || 0) + chromaWeight * visibilityWeight);
  }

  const candidates = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);
  const selected = [];
  for (const color of candidates) {
    if (selected.every((existing) => colorDistance(existing, color) >= minDistance)) {
      selected.push(color);
    }
    if (selected.length >= maxColors) break;
  }
  return selected;
}

export async function derivePaletteFromImage(
  file,
  {
    canvas = null,
    size = 112,
    createImageBitmapFn = globalThis.createImageBitmap,
    ...extractOptions
  } = {},
) {
  if (!file) return [];
  if (typeof createImageBitmapFn !== 'function') {
    throw new Error('Image palette extraction requires createImageBitmap support.');
  }
  const bitmap = await createImageBitmapFn(file);
  const target = canvas || globalThis.document?.createElement?.('canvas');
  if (!target) {
    bitmap.close?.();
    throw new Error('Image palette extraction requires a canvas.');
  }
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  target.width = Math.max(1, Math.round(bitmap.width * scale));
  target.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = target.getContext('2d', { willReadFrequently: true });
  if (!context) {
    bitmap.close?.();
    throw new Error('Could not create a 2D canvas context.');
  }
  context.clearRect(0, 0, target.width, target.height);
  context.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close?.();
  return extractPaletteFromPixels(
    context.getImageData(0, 0, target.width, target.height),
    extractOptions,
  );
}

function vividnessScore(color) {
  const lightnessBalance = 1 - Math.abs(relativeLuminance(color) - 0.42);
  return saturation(color) * 1.25 + lightnessBalance * 0.35;
}

export function pickTastefulRoles(colors = [], fallback = DEFAULT_FALLBACK) {
  const unique = [...new Set([...colors, ...fallback].map(normalizeHex))];
  const byLight = [...unique].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  const vivid = [...unique].sort((a, b) => vividnessScore(b) - vividnessScore(a));
  const primary = vivid[0] || DEFAULT_FALLBACK[0];
  const secondary =
    vivid.find((color) => color !== primary && colorDistance(color, primary) > 72) ||
    vivid[1] ||
    DEFAULT_FALLBACK[1];
  const accent =
    vivid.find(
      (color) =>
        color !== primary &&
        color !== secondary &&
        colorDistance(color, primary) > 58 &&
        colorDistance(color, secondary) > 58,
    ) ||
    vivid[2] ||
    DEFAULT_FALLBACK[2];

  return {
    primary,
    secondary,
    accent,
    'dark-font': byLight[0] || DEFAULT_FALLBACK[3],
    'light-font': byLight.at(-1) || DEFAULT_FALLBACK[4],
  };
}

export function evaluateRolePalette(roles = {}) {
  const normalized = {
    primary: normalizeHex(roles.primary || DEFAULT_FALLBACK[0]),
    secondary: normalizeHex(roles.secondary || DEFAULT_FALLBACK[1]),
    accent: normalizeHex(roles.accent || DEFAULT_FALLBACK[2]),
    'dark-font': normalizeHex(roles['dark-font'] || DEFAULT_FALLBACK[3]),
    'light-font': normalizeHex(roles['light-font'] || DEFAULT_FALLBACK[4]),
  };
  const metrics = {
    lightOnDark: contrastRatio(normalized['light-font'], normalized['dark-font']),
    primaryOnDark: contrastRatio(normalized.primary, normalized['dark-font']),
    secondaryOnDark: contrastRatio(normalized.secondary, normalized['dark-font']),
    accentOnDark: contrastRatio(normalized.accent, normalized['dark-font']),
    roleSeparation: Math.min(
      colorDistance(normalized.primary, normalized.secondary),
      colorDistance(normalized.primary, normalized.accent),
      colorDistance(normalized.secondary, normalized.accent),
    ),
  };
  const warnings = [];
  if (metrics.lightOnDark < 4.5) warnings.push('Body text contrast is below WCAG AA.');
  if (metrics.primaryOnDark < 3) warnings.push('Primary color may be difficult to read on the dark role.');
  if (metrics.roleSeparation < 44) warnings.push('Primary, secondary, and accent roles are visually similar.');
  return {
    roles: normalized,
    metrics,
    warnings,
    ok: warnings.length === 0,
  };
}

export function rolePaletteCss(roles = {}) {
  const normalized = evaluateRolePalette(roles).roles;
  return `:root {\n  --generated-primary: ${normalized.primary};\n  --generated-secondary: ${normalized.secondary};\n  --generated-accent: ${normalized.accent};\n  --generated-dark-font: ${normalized['dark-font']};\n  --generated-light-font: ${normalized['light-font']};\n}`;
}

export const fallbackPalette = DEFAULT_FALLBACK;
