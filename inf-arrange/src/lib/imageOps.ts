import type { CutOptions, ImageItem, Rect, SliceOptions } from "@/types";

/**
 * Loads an image from a src (data URL / URL) into an HTMLImageElement,
 * resolving with natural dimensions once decoded.
 */
export function loadImage(src: string): Promise<{
  img: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for non-data URLs — for data: URLs setting
    // crossOrigin can cause some browsers to refuse to load the image,
    // and it's unnecessary anyway (data URLs are same-origin by definition).
    if (!/^data:/i.test(src)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      resolve({
        img,
        naturalWidth: img.naturalWidth || img.width,
        naturalHeight: img.naturalHeight || img.height,
      });
    };
    img.onerror = (e) => reject(new Error(`Failed to load image: ${String(e)}`));
    img.src = src;
  });
}

/**
 * Reads a File (from input or drop) into a data URL.
 */
export function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Accepts any of: a real image File/Blob, a data URL string, a raw base64 string,
 * or a plain URL. Returns a usable src string.
 */
export async function normaliseImageInput(input: File | Blob | string): Promise<string> {
  if (input instanceof Blob) return fileToDataURL(input);
  if (typeof input !== "string") throw new Error("Unsupported image input");
  const trimmed = input.trim();
  // Already a data URL.
  if (/^data:/.test(trimmed)) return trimmed;
  // Raw base64 — wrap as PNG data URL. Detect by charset.
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 32) {
    return `data:image/png;base64,${trimmed.replace(/\s/g, "")}`;
  }
  // Looks like a URL.
  return trimmed;
}

/**
 * Draws a region of an image (in source pixel coords) to a new canvas and
 * returns its data URL — at intrinsic 1:1 resolution.
 */
export function extractRegion(
  img: HTMLImageElement,
  region: Rect,
): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(region.w));
  const h = Math.max(1, Math.round(region.h));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, w, h);
  return { dataUrl: canvas.toDataURL("image/png"), width: w, height: h };
}

/**
 * Slices an image into a grid of `rows × cols` cells with optional gutter
 * between them. Returns one ImageItem-shaped payload per cell, with positions
 * laid out starting at (originX, originY) in canvas coordinates.
 */
export async function sliceImage(
  source: ImageItem,
  opts: SliceOptions,
  originX: number,
  originY: number,
): Promise<
  Array<{
    src: string;
    naturalWidth: number;
    naturalHeight: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>
> {
  const { img } = await loadImage(source.src);
  const crop = source.crop ?? {
    x: 0,
    y: 0,
    w: source.naturalWidth,
    h: source.naturalHeight,
  };

  const cellW = crop.w / opts.cols;
  const cellH = crop.h / opts.rows;
  const out: Array<{
    src: string;
    naturalWidth: number;
    naturalHeight: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  const displayW = source.width;
  const displayH = source.height;
  const dispCellW = displayW / opts.cols;
  const dispCellH = displayH / opts.rows;

  for (let r = 0; r < opts.rows; r++) {
    for (let c = 0; c < opts.cols; c++) {
      const region: Rect = {
        x: crop.x + c * cellW,
        y: crop.y + r * cellH,
        w: cellW - opts.gutter,
        h: cellH - opts.gutter,
      };
      const { dataUrl, width, height } = extractRegion(img, region);
      out.push({
        src: dataUrl,
        naturalWidth: width,
        naturalHeight: height,
        x: originX + c * dispCellW,
        y: originY + r * dispCellH,
        width: dispCellW - opts.gutter * (displayW / crop.w),
        height: dispCellH - opts.gutter * (displayH / crop.h),
      });
    }
  }
  return out;
}

/**
 * Cuts an image along a single line producing two halves. The first half
 * replaces the original; the second is appended next to it.
 */
export async function cutImage(
  source: ImageItem,
  opts: CutOptions,
): Promise<
  Array<{
    src: string;
    naturalWidth: number;
    naturalHeight: number;
    width: number;
    height: number;
    crop?: Rect;
  }>
> {
  const { img } = await loadImage(source.src);
  const crop = source.crop ?? {
    x: 0,
    y: 0,
    w: source.naturalWidth,
    h: source.naturalHeight,
  };

  if (opts.orientation === "horizontal") {
    const splitY = crop.y + crop.h * opts.at;
    const top = extractRegion(img, { x: crop.x, y: crop.y, w: crop.w, h: splitY - crop.y });
    const bottom = extractRegion(img, {
      x: crop.x,
      y: splitY,
      w: crop.w,
      h: crop.y + crop.h - splitY,
    });
    const topH = source.height * opts.at;
    const bottomH = source.height - topH;
    return [
      {
        src: top.dataUrl,
        naturalWidth: top.width,
        naturalHeight: top.height,
        width: source.width,
        height: topH,
      },
      {
        src: bottom.dataUrl,
        naturalWidth: bottom.width,
        naturalHeight: bottom.height,
        width: source.width,
        height: bottomH,
      },
    ];
  }
  const splitX = crop.x + crop.w * opts.at;
  const left = extractRegion(img, { x: crop.x, y: crop.y, w: splitX - crop.x, h: crop.h });
  const right = extractRegion(img, {
    x: splitX,
    y: crop.y,
    w: crop.x + crop.w - splitX,
    h: crop.h,
  });
  const leftW = source.width * opts.at;
  const rightW = source.width - leftW;
  return [
    {
      src: left.dataUrl,
      naturalWidth: left.width,
      naturalHeight: left.height,
      width: leftW,
      height: source.height,
    },
    {
      src: right.dataUrl,
      naturalWidth: right.width,
      naturalHeight: right.height,
      width: rightW,
      height: source.height,
    },
  ];
}

/**
 * Bakes the current crop rectangle into a new image, returning a fresh src
 * and clearing the crop. Useful when the user wants to commit a crop.
 */
export async function bakeCrop(source: ImageItem): Promise<{
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
}> {
  if (!source.crop) {
    return {
      src: source.src,
      naturalWidth: source.naturalWidth,
      naturalHeight: source.naturalHeight,
      width: source.width,
      height: source.height,
    };
  }
  const { img } = await loadImage(source.src);
  const { dataUrl, width, height } = extractRegion(img, source.crop);
  return {
    src: dataUrl,
    naturalWidth: width,
    naturalHeight: height,
    width: source.width,
    height: source.height,
  };
}

/**
 * Resamples an image to a new display size. We don't actually resample the
 * source — we just rely on the browser's image scaling. The natural dimensions
 * stay the same; only the *displayed* width/height change. This keeps pixel
 * data lossless until a crop/slice is committed.
 */
export function resizeImageMetadata(
  newWidth: number,
  newHeight: number,
): { width: number; height: number } {
  return { width: Math.max(8, newWidth), height: Math.max(8, newHeight) };
}

/**
 * Reads a File or clipboard item as an image data URL.
 */
export async function readImageFromClipboard(item: ClipboardItem): Promise<string | null> {
  const imageType = item.types.find((t) => t.startsWith("image/"));
  if (!imageType) return null;
  const blob = await item.getType(imageType);
  return fileToDataURL(blob);
}

export type ImageEffectId =
  | "grayscale"
  | "sepia"
  | "old-movie"
  | "high-contrast"
  | "cartoon"
  | "cubist";

function posterizeChannel(v: number, levels: number): number {
  const step = 255 / Math.max(1, levels - 1);
  return Math.round(Math.round(v / step) * step);
}

export async function applyImageEffect(
  source: ImageItem,
  effect: ImageEffectId,
): Promise<{
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}> {
  const { img } = await loadImage(source.src);
  const crop = source.crop ?? { x: 0, y: 0, w: source.naturalWidth, h: source.naturalHeight };
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.w));
  canvas.height = Math.max(1, Math.round(crop.h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const avg = 0.299 * r + 0.587 * g + 0.114 * b;
    if (effect === "grayscale") {
      px[i] = px[i + 1] = px[i + 2] = avg;
    } else if (effect === "sepia" || effect === "old-movie") {
      px[i] = Math.min(255, avg * 1.18 + 28);
      px[i + 1] = Math.min(255, avg * 1.02 + 12);
      px[i + 2] = Math.max(0, avg * 0.78 - 8);
      if (effect === "old-movie") {
        const noise = ((i * 17) % 23) - 11;
        px[i] = Math.max(0, Math.min(255, px[i] + noise));
        px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + noise));
        px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + noise));
      }
    } else if (effect === "high-contrast") {
      px[i] = r > 128 ? 245 : 18;
      px[i + 1] = g > 128 ? 245 : 18;
      px[i + 2] = b > 128 ? 245 : 18;
    } else if (effect === "cartoon") {
      px[i] = posterizeChannel(r, 5);
      px[i + 1] = posterizeChannel(g, 5);
      px[i + 2] = posterizeChannel(b, 5);
    } else if (effect === "cubist") {
      px[i] = posterizeChannel(r, 4);
      px[i + 1] = posterizeChannel(g, 4);
      px[i + 2] = posterizeChannel(b, 4);
      if ((i / 4) % 19 < 1) {
        px[i] = Math.max(0, px[i] - 45);
        px[i + 1] = Math.max(0, px[i + 1] - 45);
        px[i + 2] = Math.max(0, px[i + 2] - 45);
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  return {
    src: canvas.toDataURL("image/png"),
    naturalWidth: canvas.width,
    naturalHeight: canvas.height,
  };
}
