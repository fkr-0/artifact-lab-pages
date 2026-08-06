import type { Point, Rect, ResizeHandle, Viewport } from "@/types";

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectFromCorners(p1: Point, p2: Point): Rect {
  return {
    x: Math.min(p1.x, p2.x),
    y: Math.min(p1.y, p2.y),
    w: Math.abs(p2.x - p1.x),
    h: Math.abs(p2.y - p1.y),
  };
}

export function rectContains(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function pointInRect(p: Point, r: Rect): boolean {
  return rectContains(r, p);
}

/** Convert a screen-space point to canvas-space using the current viewport. */
export function screenToCanvas(p: Point, vp: Viewport): Point {
  return {
    x: (p.x - vp.x) / vp.k,
    y: (p.y - vp.y) / vp.k,
  };
}

/** Inverse of `screenToCanvas`. */
export function canvasToScreen(p: Point, vp: Viewport): Point {
  return {
    x: p.x * vp.k + vp.x,
    y: p.y * vp.k + vp.y,
  };
}

export function getHandleAtPoint(
  itemRect: Rect,
  p: Point,
  handleSize: number,
): ResizeHandle | null {
  const { x, y, w, h } = itemRect;
  const hs = handleSize;
  const handles: Array<[ResizeHandle, Point]> = [
    ["nw", { x, y }],
    ["n", { x: x + w / 2, y }],
    ["ne", { x: x + w, y }],
    ["e", { x: x + w, y: y + h / 2 }],
    ["se", { x: x + w, y: y + h }],
    ["s", { x: x + w / 2, y: y + h }],
    ["sw", { x, y: y + h }],
    ["w", { x, y: y + h / 2 }],
  ];
  for (const [h, hp] of handles) {
    if (Math.abs(p.x - hp.x) <= hs && Math.abs(p.y - hp.y) <= hs) return h;
  }
  return null;
}

/**
 * Applies a resize handle drag to a rectangle, returning the new rect.
 * `anchor` is the corner opposite the dragged handle when alt is held (centre-
 * out resize), otherwise the dragged corner's opposite is used naturally.
 */
export function applyResize(
  original: Rect,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  altKey: boolean,
): Rect {
  let { x, y, w, h } = original;

  // For each handle, move the appropriate edges.
  const setLeft = (v: number) => {
    const newW = original.x + original.w - v;
    if (newW > 4) {
      x = v;
      w = newW;
    }
  };
  const setRight = (v: number) => {
    const newW = v - original.x;
    if (newW > 4) w = newW;
  };
  const setTop = (v: number) => {
    const newH = original.y + original.h - v;
    if (newH > 4) {
      y = v;
      h = newH;
    }
  };
  const setBottom = (v: number) => {
    const newH = v - original.y;
    if (newH > 4) h = newH;
  };

  switch (handle) {
    case "nw":
      setLeft(original.x + dx);
      setTop(original.y + dy);
      break;
    case "n":
      setTop(original.y + dy);
      break;
    case "ne":
      setRight(original.x + original.w + dx);
      setTop(original.y + dy);
      break;
    case "e":
      setRight(original.x + original.w + dx);
      break;
    case "se":
      setRight(original.x + original.w + dx);
      setBottom(original.y + original.h + dy);
      break;
    case "s":
      setBottom(original.y + original.h + dy);
      break;
    case "sw":
      setLeft(original.x + dx);
      setBottom(original.y + original.h + dy);
      break;
    case "w":
      setLeft(original.x + dx);
      break;
  }

  // Alt = centre-out resize: mirror the change about the original centre.
  if (altKey) {
    const cx = original.x + original.w / 2;
    const cy = original.y + original.h / 2;
    x = cx - w / 2;
    y = cy - h / 2;
  }

  return { x, y, w, h };
}

export function areClose(a: number, b: number, eps = 0.001): boolean {
  return Math.abs(a - b) < eps;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
