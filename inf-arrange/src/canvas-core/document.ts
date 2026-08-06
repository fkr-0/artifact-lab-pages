import type {
  AudioItem,
  CanvasItem,
  ImageItem,
  LinkItem,
  Rect,
  TextItem,
  UnknownItem,
  Viewport,
} from "@/types";
import { migrateCanvasDocumentRecord } from "./migrations";

export const CANVAS_DOCUMENT_SCHEMA = "canvas-studio-document" as const;
export const CANVAS_DOCUMENT_VERSION = 1;

export interface CanvasDocumentFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
}

export interface CanvasDocumentItem<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: string;
  frame: CanvasDocumentFrame;
  label?: string;
  accent?: string;
  data: TData;
  metadata?: Record<string, unknown>;
}

export interface CanvasRelation {
  id: string;
  type?: string;
  sourceId: string;
  targetId: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface CanvasDocument {
  schema: typeof CANVAS_DOCUMENT_SCHEMA;
  version: number;
  id?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  viewport?: Viewport;
  items: CanvasDocumentItem[];
  relations?: CanvasRelation[];
  metadata?: Record<string, unknown>;
}

export interface CanvasDocumentSnapshotOptions {
  id?: string;
  title?: string;
  viewport?: Viewport;
  relations?: CanvasRelation[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasDocumentValidationResult {
  ok: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function recordOrEmpty(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

type OptionalDisplayFields = { label?: string; accent?: string };
type RuntimeCommonFields = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  label?: string;
  accent?: string;
};

function withDisplayFields<T>(target: T, source: OptionalDisplayFields): T & OptionalDisplayFields {
  const enriched = target as T & OptionalDisplayFields;
  if (source.label) enriched.label = source.label;
  if (source.accent) enriched.accent = source.accent;
  return enriched;
}

function withMetadata<T>(
  target: T,
  metadata: Record<string, unknown> | undefined,
): T & { metadata?: Record<string, unknown> } {
  const enriched = target as T & { metadata?: Record<string, unknown> };
  if (metadata) enriched.metadata = metadata;
  return enriched;
}

function frameFromItem(item: CanvasItem): CanvasDocumentFrame {
  return {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    zIndex: item.zIndex,
  };
}

export function itemToDocumentItem(item: CanvasItem): CanvasDocumentItem {
  if (item.type === "image") {
    return withDisplayFields(
      {
        id: item.id,
        type: "image",
        frame: frameFromItem(item),
        data: {
          src: item.src,
          naturalWidth: item.naturalWidth,
          naturalHeight: item.naturalHeight,
          crop: item.crop,
          effects: item.effects,
          editorRef: item.editorRef,
        },
      },
      item,
    );
  }

  if (item.type === "link") {
    return withDisplayFields(
      {
        id: item.id,
        type: "link",
        frame: frameFromItem(item),
        data: {
          url: item.url,
          title: item.title,
          description: item.description,
          preview: item.preview,
          viewMode: item.viewMode,
        },
      },
      item,
    );
  }

  if (item.type === "web") {
    return withDisplayFields(
      {
        id: item.id,
        type: "web",
        frame: frameFromItem(item),
        data: {
          url: item.url,
          title: item.title,
          description: item.description,
          previewMode: item.previewMode,
          embedAllowed: item.embedAllowed,
        },
      },
      item,
    );
  }

  if (item.type === "audio") {
    return withDisplayFields(
      {
        id: item.id,
        type: "audio",
        frame: frameFromItem(item),
        data: {
          title: item.title,
          artist: item.artist,
          album: item.album,
          durationMs: item.durationMs,
          sourceRef: item.sourceRef,
          coverRef: item.coverRef,
          waveformRef: item.waveformRef,
          src: item.src,
          playbackMode: item.playbackMode,
        },
      },
      item,
    );
  }

  if (item.type === "text") {
    return withDisplayFields(
      {
        id: item.id,
        type: "text",
        frame: frameFromItem(item),
        data: {
          text: item.text,
          fontSize: item.fontSize,
          color: item.color,
          background: item.background,
          align: item.align,
          textKind: item.textKind,
          textRole: item.textRole,
          viewMode: item.viewMode,
          richTextHtml: item.richTextHtml,
          logEntries: item.logEntries,
        },
      },
      item,
    );
  }

  return withMetadata(
    withDisplayFields(
      {
        id: item.id,
        type: item.originalType,
        frame: frameFromItem(item),
        data: item.data,
      },
      item,
    ),
    item.metadata,
  );
}

function commonRuntimeFields(item: CanvasDocumentItem): RuntimeCommonFields {
  return withDisplayFields(
    {
      id: item.id,
      x: numberOr(item.frame.x, 0),
      y: numberOr(item.frame.y, 0),
      width: Math.max(1, numberOr(item.frame.width, 240)),
      height: Math.max(1, numberOr(item.frame.height, 96)),
      rotation: numberOr(item.frame.rotation, 0),
      zIndex: numberOr(item.frame.zIndex, 0),
    },
    item,
  );
}

export function documentItemToRuntimeItem(item: CanvasDocumentItem): CanvasItem | null {
  const data = recordOrEmpty(item.data);
  const common = commonRuntimeFields(item);

  if (item.type === "image") {
    const src = stringOrUndefined(data.src);
    if (!src) return null;
    return {
      id: common.id,
      type: "image",
      x: common.x,
      y: common.y,
      width: common.width,
      height: common.height,
      rotation: common.rotation,
      zIndex: common.zIndex,
      label: common.label,
      accent: common.accent,
      src,
      naturalWidth: numberOr(data.naturalWidth, common.width),
      naturalHeight: numberOr(data.naturalHeight, common.height),
      crop: isRecord(data.crop)
        ? {
            x: numberOr(data.crop.x, 0),
            y: numberOr(data.crop.y, 0),
            w: numberOr(data.crop.w, common.width),
            h: numberOr(data.crop.h, common.height),
          }
        : undefined,
      effects: Array.isArray(data.effects) ? (data.effects as ImageItem["effects"]) : undefined,
      editorRef: typeof data.editorRef === "string" ? data.editorRef : undefined,
    } satisfies ImageItem;
  }

  if (item.type === "link") {
    const url = stringOrUndefined(data.url);
    if (!url) return null;
    return {
      id: common.id,
      type: "link",
      x: common.x,
      y: common.y,
      width: common.width,
      height: common.height,
      rotation: common.rotation,
      zIndex: common.zIndex,
      label: common.label,
      accent: common.accent,
      url,
      title: stringOrUndefined(data.title),
      description: stringOrUndefined(data.description),
      preview: isRecord(data.preview) ? data.preview : undefined,
      viewMode: data.viewMode === "iframe" ? "iframe" : "card",
    } satisfies LinkItem;
  }

  if (item.type === "web") {
    const url = stringOrUndefined(data.url);
    if (!url) return null;
    return {
      id: common.id,
      type: "web",
      x: common.x,
      y: common.y,
      width: common.width,
      height: common.height,
      rotation: common.rotation,
      zIndex: common.zIndex,
      label: common.label,
      accent: common.accent,
      url,
      title: stringOrUndefined(data.title),
      description: stringOrUndefined(data.description),
      previewMode: data.previewMode === "iframe" ? "iframe" : "card",
      embedAllowed: data.embedAllowed === true,
    };
  }

  if (item.type === "audio") {
    const sourceRef = stringOrUndefined(data.sourceRef) ?? stringOrUndefined(data.src);
    if (!sourceRef) return null;
    return {
      id: common.id,
      type: "audio",
      x: common.x,
      y: common.y,
      width: common.width,
      height: common.height,
      rotation: common.rotation,
      zIndex: common.zIndex,
      label: common.label,
      accent: common.accent,
      title: stringOrUndefined(data.title),
      artist: stringOrUndefined(data.artist),
      album: stringOrUndefined(data.album),
      durationMs: numberOr(data.durationMs, 0) || undefined,
      sourceRef,
      coverRef: stringOrUndefined(data.coverRef),
      waveformRef: stringOrUndefined(data.waveformRef),
      src: stringOrUndefined(data.src),
      playbackMode: data.playbackMode === "sequence" ? "sequence" : "manual",
    } satisfies AudioItem;
  }

  if (item.type === "text") {
    const textItem: TextItem = {
      id: common.id,
      type: "text",
      x: common.x,
      y: common.y,
      width: common.width,
      height: common.height,
      rotation: common.rotation,
      zIndex: common.zIndex,
      label: common.label,
      accent: common.accent,
      text: typeof data.text === "string" ? data.text : "",
      fontSize: numberOr(data.fontSize, 16),
      color: typeof data.color === "string" ? data.color : "#1a1a1a",
      background: typeof data.background === "string" ? data.background : "#fff8d6",
      align: data.align === "center" || data.align === "right" ? data.align : "left",
    };
    if (
      data.textKind === "markdown" ||
      data.textKind === "richtext" ||
      data.textKind === "log" ||
      data.textKind === "plaintext"
    ) {
      textItem.textKind = data.textKind;
    }
    if (
      typeof data.textRole === "string" &&
      ["h1", "h2", "h3", "h4", "h5", "h6", "paragraph", "li", "ul", "pre", "code"].includes(
        data.textRole,
      )
    ) {
      textItem.textRole = data.textRole as TextItem["textRole"];
    }
    if (data.viewMode === "rendered" || data.viewMode === "source")
      textItem.viewMode = data.viewMode;
    if (typeof data.richTextHtml === "string") textItem.richTextHtml = data.richTextHtml;
    if (Array.isArray(data.logEntries))
      textItem.logEntries = data.logEntries as TextItem["logEntries"];
    return textItem;
  }

  return withMetadata(
    {
      ...common,
      type: "unknown",
      originalType: item.type,
      data,
    } satisfies UnknownItem,
    item.metadata,
  );
}

export function createCanvasDocument(
  items: CanvasItem[],
  options: CanvasDocumentSnapshotOptions = {},
): CanvasDocument {
  const now = new Date().toISOString();
  return {
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: CANVAS_DOCUMENT_VERSION,
    id: options.id,
    title: options.title,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    viewport: options.viewport,
    items: items.map(itemToDocumentItem),
    relations: options.relations,
    metadata: options.metadata,
  };
}

export function runtimeItemsFromDocument(document: CanvasDocument): CanvasItem[] {
  return document.items.flatMap((item) => {
    const runtime = documentItemToRuntimeItem(item);
    return runtime ? [runtime] : [];
  });
}

export function normalizeCanvasDocument(input: unknown): CanvasDocument {
  if (!isRecord(input)) {
    return { schema: CANVAS_DOCUMENT_SCHEMA, version: CANVAS_DOCUMENT_VERSION, items: [] };
  }
  const migratedInput = migrateCanvasDocumentRecord(input, CANVAS_DOCUMENT_VERSION);
  const rawItems = Array.isArray(migratedInput.items) ? migratedInput.items : [];
  const items = rawItems.flatMap((raw): CanvasDocumentItem[] => {
    if (!isRecord(raw) || !isRecord(raw.frame)) return [];
    const id = stringOrUndefined(raw.id);
    const type = stringOrUndefined(raw.type);
    if (!id || !type) return [];
    return [
      withMetadata(
        withDisplayFields(
          {
            id,
            type,
            frame: {
              x: numberOr(raw.frame.x, 0),
              y: numberOr(raw.frame.y, 0),
              width: Math.max(1, numberOr(raw.frame.width, 240)),
              height: Math.max(1, numberOr(raw.frame.height, 96)),
              rotation: numberOr(raw.frame.rotation, 0),
              zIndex: numberOr(raw.frame.zIndex, 0),
            },
            data: recordOrEmpty(raw.data),
          },
          {
            label: stringOrUndefined(raw.label),
            accent: stringOrUndefined(raw.accent),
          },
        ),
        isRecord(raw.metadata) ? raw.metadata : undefined,
      ),
    ];
  });
  return {
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: numberOr(migratedInput.version, CANVAS_DOCUMENT_VERSION),
    id: stringOrUndefined(migratedInput.id),
    title: stringOrUndefined(migratedInput.title),
    createdAt: stringOrUndefined(migratedInput.createdAt),
    updatedAt: stringOrUndefined(migratedInput.updatedAt),
    viewport: isRecord(migratedInput.viewport)
      ? {
          x: numberOr(migratedInput.viewport.x, 0),
          y: numberOr(migratedInput.viewport.y, 0),
          k: Math.max(0.01, numberOr(migratedInput.viewport.k, 1)),
        }
      : undefined,
    items,
    relations: Array.isArray(migratedInput.relations)
      ? (migratedInput.relations as CanvasRelation[])
      : undefined,
    metadata: isRecord(migratedInput.metadata) ? migratedInput.metadata : undefined,
  };
}

export function validateCanvasDocument(input: unknown): CanvasDocumentValidationResult {
  const errors: string[] = [];
  if (!isRecord(input)) errors.push("document must be an object");
  else {
    if (input.schema !== CANVAS_DOCUMENT_SCHEMA)
      errors.push(`schema must be ${CANVAS_DOCUMENT_SCHEMA}`);
    if (!Array.isArray(input.items)) errors.push("items must be an array");
  }
  return { ok: errors.length === 0, errors };
}

export function serializeCanvasDocument(document: CanvasDocument): string {
  return JSON.stringify(normalizeCanvasDocument(document), null, 2);
}

export function parseCanvasDocument(json: string): CanvasDocument {
  return normalizeCanvasDocument(JSON.parse(json));
}

export function boundsOfDocumentItems(items: CanvasDocumentItem[]): Rect {
  if (items.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    minX = Math.min(minX, item.frame.x);
    minY = Math.min(minY, item.frame.y);
    maxX = Math.max(maxX, item.frame.x + item.frame.width);
    maxY = Math.max(maxY, item.frame.y + item.frame.height);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
