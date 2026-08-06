import type { CanvasItem, Point, Rect } from "@/types";
import { nanoid } from "nanoid";

export const CANVAS_CLIPBOARD_MIME = "application/x-canvas-studio-items+json";
const TEXT_MARKER = "CANVAS_STUDIO_CLIPBOARD_V1";
const PAYLOAD_VERSION = 1;

export interface CanvasClipboardPayload {
  app: "canvas-studio";
  version: number;
  ts: number;
  bounds: Rect;
  items: CanvasItem[];
}

export interface ClipboardWriteResult {
  ok: boolean;
  mode: "custom-mime" | "text-fallback" | "internal-only";
  reason?: string;
}

function cloneItem(item: CanvasItem): CanvasItem {
  if (item.type === "image") {
    return {
      ...item,
      crop: item.crop ? { ...item.crop } : undefined,
    };
  }
  return { ...item };
}

export function cloneItems(items: CanvasItem[]): CanvasItem[] {
  return items.map(cloneItem);
}

export function boundsOfItems(items: CanvasItem[]): Rect {
  if (items.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function buildCanvasClipboardPayload(items: CanvasItem[]): CanvasClipboardPayload {
  const cloned = cloneItems(items);
  return {
    app: "canvas-studio",
    version: PAYLOAD_VERSION,
    ts: Date.now(),
    bounds: boundsOfItems(cloned),
    items: cloned,
  };
}

export function summarizeCanvasPayload(payload: CanvasClipboardPayload): string {
  const counts = new Map<string, number>();
  for (const item of payload.items) counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  const labelForType = (type: string, count: number) =>
    type === "image"
      ? `image${count === 1 ? "" : "s"}`
      : type === "text"
        ? `text block${count === 1 ? "" : "s"}`
        : `${type} item${count === 1 ? "" : "s"}`;
  const parts = [...counts.entries()].map(
    ([type, count]) => `${count} ${labelForType(type, count)}`,
  );
  return parts.length > 0
    ? `Canvas Studio selection: ${parts.join(", ")}`
    : "Canvas Studio selection";
}

export function serializeCanvasClipboard(payload: CanvasClipboardPayload): string {
  return `${TEXT_MARKER}\n${JSON.stringify(payload)}`;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isCanvasItemLike(v: unknown): v is CanvasItem {
  if (!v || typeof v !== "object") return false;
  const item = v as Partial<CanvasItem>;
  if (!["image", "text", "link", "web", "audio", "unknown"].includes(String(item.type)))
    return false;
  return (
    typeof item.id === "string" &&
    isFiniteNumber(item.x) &&
    isFiniteNumber(item.y) &&
    isFiniteNumber(item.width) &&
    isFiniteNumber(item.height) &&
    isFiniteNumber(item.rotation) &&
    isFiniteNumber(item.zIndex)
  );
}

export function parseCanvasClipboard(
  text: string | undefined | null,
): CanvasClipboardPayload | null {
  if (!text) return null;
  const trimmed = text.trim();
  const markerIndex = trimmed.indexOf(TEXT_MARKER);
  const rawJson =
    markerIndex >= 0
      ? trimmed.slice(markerIndex + TEXT_MARKER.length).trim()
      : trimmed.startsWith("{")
        ? trimmed
        : "";
  if (!rawJson) return null;
  try {
    const payload = JSON.parse(rawJson) as CanvasClipboardPayload;
    if (payload.app !== "canvas-studio") return null;
    if (!Array.isArray(payload.items) || payload.items.length === 0) return null;
    if (!payload.items.every(isCanvasItemLike)) return null;
    return {
      app: "canvas-studio",
      version: payload.version || PAYLOAD_VERSION,
      ts: isFiniteNumber(payload.ts) ? payload.ts : Date.now(),
      bounds: boundsOfItems(payload.items),
      items: cloneItems(payload.items),
    };
  } catch {
    return null;
  }
}

export function readCanvasPayloadFromTransfer(data: DataTransfer): CanvasClipboardPayload | null {
  const custom = data.getData(CANVAS_CLIPBOARD_MIME);
  const fromCustom = parseCanvasClipboard(custom);
  if (fromCustom) return fromCustom;
  return parseCanvasClipboard(data.getData("text/plain"));
}

export function makePastedItems(
  sourceItems: CanvasItem[],
  targetCentre: Point | null,
  zIndexStart: number,
  fallbackOffset = 24,
): CanvasItem[] {
  const source = cloneItems(sourceItems);
  const bounds = boundsOfItems(source);
  const dx = targetCentre ? targetCentre.x - (bounds.x + bounds.w / 2) : fallbackOffset;
  const dy = targetCentre ? targetCentre.y - (bounds.y + bounds.h / 2) : fallbackOffset;
  return source.map((item, index) => ({
    ...item,
    id: nanoid(),
    x: item.x + dx,
    y: item.y + dy,
    zIndex: zIndexStart + index,
  })) as CanvasItem[];
}

export async function writeCanvasClipboard(
  payload: CanvasClipboardPayload,
): Promise<ClipboardWriteResult> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return { ok: false, mode: "internal-only", reason: "navigator.clipboard unavailable" };
  }

  const serialized = serializeCanvasClipboard(payload);
  const summary = summarizeCanvasPayload(payload);

  // Prefer a structured web clipboard entry. Some browsers reject arbitrary MIME
  // types, so this path intentionally falls back to marked text/plain below.
  if ("write" in navigator.clipboard && typeof ClipboardItem !== "undefined") {
    try {
      const item = new ClipboardItem({
        [CANVAS_CLIPBOARD_MIME]: new Blob([serialized], { type: CANVAS_CLIPBOARD_MIME }),
        "text/plain": new Blob([`${summary}\n\n${serialized}`], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return { ok: true, mode: "custom-mime" };
    } catch {
      // Fall through to writeText; this is expected in Firefox/Safari and in
      // contexts where custom MIME clipboard writes are not permitted.
    }
  }

  try {
    await navigator.clipboard.writeText(`${summary}\n\n${serialized}`);
    return { ok: true, mode: "text-fallback" };
  } catch (err) {
    return {
      ok: false,
      mode: "internal-only",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
