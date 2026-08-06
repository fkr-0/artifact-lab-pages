export type ItemType = "image" | "text" | "link" | "web" | "audio" | "unknown";

export type TextKind = "plaintext" | "markdown" | "richtext" | "log";
export type PlainTextRole =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "paragraph"
  | "li"
  | "ul"
  | "pre"
  | "code";
export type TextViewMode = "source" | "rendered";

export interface LogEntry {
  id: string;
  ts: string;
  text: string;
  author?: string;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  /** Optional name shown in the media manager. */
  label?: string;
  /** Optional user-tint colour for the frame / accent. */
  accent?: string;
}

export type ImageEffect =
  | "none"
  | "bw"
  | "sepia"
  | "old-movie"
  | "high-contrast"
  | "soft-blur"
  | "posterize"
  | "cartoon"
  | "cubist";

export interface ImageEffectStep {
  id?: string;
  kind: ImageEffect;
  amount?: number;
}

export interface ImageItem extends BaseItem {
  type: "image";
  /** Data URL (or any value usable as <img src>). */
  src: string;
  /** Natural pixel size of the underlying image. */
  naturalWidth: number;
  naturalHeight: number;
  /** Crop rectangle expressed in source pixels (0..naturalWidth/Height). */
  crop?: { x: number; y: number; w: number; h: number };
  /** Non-destructive visual effects pipeline. */
  effects?: ImageEffectStep[];
  /** External editor/provider that last touched the image. */
  editorRef?: string;
}

export interface TextItem extends BaseItem {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  background: string;
  align: "left" | "center" | "right";
  /** Text capability branch. Plaintext remains the backward-compatible default. */
  textKind?: TextKind;
  /** Semantic plaintext block role for document-like layouts. */
  textRole?: PlainTextRole;
  /** Source/render toggle for markdown/log/richtext-capable blocks. */
  viewMode?: TextViewMode;
  /** Sanitized/host-provided rich-text HTML. Plain text remains canonical fallback. */
  richTextHtml?: string;
  /** Append-only log entries. `text` is a flattened cached rendering for search/export. */
  logEntries?: LogEntry[];
}

export interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface LinkItem extends BaseItem {
  type: "link";
  url: string;
  title?: string;
  description?: string;
  preview?: LinkPreview;
  /** Preview mode is intentionally local and conservative: iframe may be blocked by target CSP. */
  viewMode?: "card" | "iframe";
}

export interface AudioItem extends BaseItem {
  type: "audio";
  title?: string;
  artist?: string;
  album?: string;
  durationMs?: number;
  sourceRef: string;
  coverRef?: string;
  waveformRef?: string;
  /** Runtime-resolved source URL, data URL, or object URL usable by <audio>. */
  src?: string;
  playbackMode?: "manual" | "sequence";
}

export interface WebItem extends BaseItem {
  type: "web";
  url: string;
  title?: string;
  description?: string;
  previewMode: "card" | "iframe";
  embedAllowed?: boolean;
}

export interface UnknownItem extends BaseItem {
  type: "unknown";
  /** Original document/plugin type, e.g. "audio", "video", "markdown". */
  originalType: string;
  /** Lossless item payload retained until a plugin can render/edit it. */
  data: Record<string, unknown>;
  /** Lossless item metadata retained until a plugin can render/edit it. */
  metadata?: Record<string, unknown>;
}

export type CanvasItem = ImageItem | TextItem | LinkItem | WebItem | AudioItem | UnknownItem;

export interface Viewport {
  x: number;
  y: number;
  k: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Tool = "select" | "text";

/** Drag-mode is derived from modifiers + drag origin (item vs. empty space). */
export type DragMode = "none" | "move" | "resize" | "crop" | "marquee" | "pan";

export interface DragState {
  mode: DragMode;
  /** Pointer position in canvas coordinates at drag start. */
  startCanvas: Point;
  /** Pointer position in canvas coordinates (updated during drag). */
  currentCanvas: Point;
  /** Item ids participating in the drag. */
  itemIds: string[];
  /** For resize / crop: which handle / corner is being dragged. */
  handle?: ResizeHandle;
  /** Snapshot of items at drag start, used to compute deltas. */
  snapshot: Record<string, { x: number; y: number; width: number; height: number }>;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface SliceOptions {
  rows: number;
  cols: number;
  gutter: number;
}

export interface CutOptions {
  /** Orientation of the cut. */
  orientation: "horizontal" | "vertical";
  /** Position of the cut as a fraction (0..1) along the relevant axis. */
  at: number;
}
