import {
  type CanvasChange,
  type CanvasCommand,
  type CanvasDocumentItem,
  type CanvasPluginRegistry,
  type CanvasRelation,
  boundsOfDocumentItems,
  createCanvasDocument,
  documentItemToRuntimeItem,
  itemToDocumentItem,
  normalizeCanvasDocument,
  runtimeItemsFromDocument,
} from "@/canvas-core";
import {
  type CanvasClipboardPayload,
  buildCanvasClipboardPayload,
  cloneItems,
  makePastedItems,
  summarizeCanvasPayload,
  writeCanvasClipboard,
} from "@/lib/clipboard";
import { clamp } from "@/lib/geometry";
import type {
  AudioItem,
  CanvasItem,
  DragMode,
  ImageItem,
  LinkItem,
  Point,
  Rect,
  ResizeHandle,
  TextItem,
  Viewport,
} from "@/types";
import { nanoid } from "nanoid";
import { type ReactNode, createContext, createElement, useContext, useRef } from "react";
import { useStore } from "zustand";
import { type StateCreator, type StoreApi, createStore } from "zustand/vanilla";

const MAX_HISTORY = 80;
const MAX_CLIPBOARD_HISTORY = 24;

interface HistorySnapshot {
  items: CanvasItem[];
  selection: string[];
  relations: CanvasRelation[];
}

export type CanvasClipboardSource = "copy" | "cut" | "external";

export interface CanvasClipboardEntry {
  id: string;
  ts: number;
  summary: string;
  source: CanvasClipboardSource;
  items: CanvasItem[];
}

export interface CanvasState {
  items: CanvasItem[];
  relations: CanvasRelation[];
  selection: string[];
  viewport: Viewport;
  dragMode: DragMode;
  marqueeRect: Rect | null;
  /** Hovered item id (for cursor / highlight). */
  hoverId: string | null;
  /** Active resize handle for cursor feedback. */
  activeHandle: ResizeHandle | null;
  /** Internal fallback clipboard of canvas items (for cut/copy/paste). */
  clipboard: CanvasItem[];
  /** Stack of Canvas Studio clipboard entries for fast history paste. */
  clipboardHistory: CanvasClipboardEntry[];
  /** Human-readable status of the last clipboard write/read. */
  clipboardStatus: string;
  /** Timestamp for last internal clipboard update. */
  clipboardUpdatedAt: number | null;
  /** History stacks. */
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  /** When set, the text block with this id enters inline-editing mode. */
  editingId: string | null;

  // Mutations
  addItems: (items: CanvasItem[]) => void;
  updateItem: (id: string, patch: Partial<CanvasItem>) => void;
  updateItems: (ids: string[], patchFn: (it: CanvasItem) => Partial<CanvasItem>) => void;
  removeItems: (ids: string[]) => void;
  replaceItem: (id: string, withItem: CanvasItem) => void;
  setRelations: (relations: CanvasRelation[]) => void;
  addRelation: (relation: CanvasRelation) => void;
  removeRelation: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Selection
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleInSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Viewport
  setViewport: (vp: Viewport) => void;
  zoomBy: (factor: number, centre: Point) => void;
  zoomToFit: () => void;
  resetView: () => void;

  // Drag / marquee (transient, not in history)
  setDragMode: (m: DragMode) => void;
  setMarqueeRect: (r: Rect | null) => void;
  setHoverId: (id: string | null) => void;
  setActiveHandle: (h: ResizeHandle | null) => void;

  // Clipboard
  copySelection: () => void;
  cutSelection: () => void;
  paste: (targetCentre?: Point | null) => number;
  pasteItems: (items: CanvasItem[], targetCentre?: Point | null, status?: string) => number;
  pasteClipboardEntry: (entryId: string, targetCentre?: Point | null) => number;
  addClipboardHistoryEntry: (
    items: CanvasItem[],
    source: CanvasClipboardSource,
    status?: string,
  ) => CanvasClipboardEntry | null;
  forgetClipboardEntry: (entryId: string) => void;
  clearClipboardHistory: () => void;
  duplicateSelection: () => void;

  // History
  commit: () => void;
  undo: () => void;
  redo: () => void;

  // Text editing
  setEditingId: (id: string | null) => void;

  // Internal
  _pushHistory: () => void;
  _replaceState: (snap: HistorySnapshot) => void;
}

function nextZ(items: CanvasItem[]): number {
  return items.reduce((m, it) => Math.max(m, it.zIndex), 0) + 1;
}

function makeClipboardEntry(
  payload: CanvasClipboardPayload,
  source: CanvasClipboardSource,
): CanvasClipboardEntry {
  return {
    id: nanoid(),
    ts: payload.ts || Date.now(),
    summary: summarizeCanvasPayload(payload),
    source,
    items: cloneItems(payload.items),
  };
}

function appendClipboardEntry(
  entries: CanvasClipboardEntry[],
  entry: CanvasClipboardEntry,
): CanvasClipboardEntry[] {
  return [entry, ...entries].slice(0, MAX_CLIPBOARD_HISTORY);
}

function clipboardWriteSuffix(ok: boolean, mode: string): string {
  if (!ok) return "internally only";
  return mode === "custom-mime" ? "and system clipboard" : "and system clipboard text fallback";
}

const createCanvasState: StateCreator<CanvasState> = (set, get) => ({
  items: [],
  relations: [],
  selection: [],
  viewport: { x: 0, y: 0, k: 1 },
  dragMode: "none",
  marqueeRect: null,
  hoverId: null,
  activeHandle: null,
  clipboard: [],
  clipboardHistory: [],
  clipboardStatus: "Internal clipboard empty",
  clipboardUpdatedAt: null,
  past: [],
  future: [],
  editingId: null,

  addItems: (items) => {
    get()._pushHistory();
    set((s) => ({
      items: [
        ...s.items,
        ...items.map((it) => ({ ...it, zIndex: nextZ(s.items) + (it.zIndex || 0) })),
      ],
      selection: items.map((it) => it.id),
    }));
  },

  updateItem: (id, patch) => {
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? ({ ...it, ...patch } as CanvasItem) : it)),
    }));
  },

  updateItems: (ids, patchFn) => {
    const idSet = new Set(ids);
    set((s) => ({
      items: s.items.map((it) =>
        idSet.has(it.id) ? ({ ...it, ...patchFn(it) } as CanvasItem) : it,
      ),
    }));
  },

  removeItems: (ids) => {
    if (ids.length === 0) return;
    get()._pushHistory();
    const idSet = new Set(ids);
    set((s) => ({
      items: s.items.filter((it) => !idSet.has(it.id)),
      relations: s.relations.filter(
        (relation) => !idSet.has(relation.sourceId) && !idSet.has(relation.targetId),
      ),
      selection: s.selection.filter((id) => !idSet.has(id)),
    }));
  },

  replaceItem: (id, withItem) => {
    get()._pushHistory();
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? withItem : it)),
    }));
  },

  setRelations: (relations) => {
    get()._pushHistory();
    set({ relations: relations.map((relation) => ({ ...relation })) });
  },

  addRelation: (relation) => {
    get()._pushHistory();
    set((s) => ({ relations: [...s.relations, { ...relation }] }));
  },

  removeRelation: (id) => {
    get()._pushHistory();
    set((s) => ({ relations: s.relations.filter((relation) => relation.id !== id) }));
  },

  bringForward: (id) => {
    get()._pushHistory();
    set((s) => {
      const target = s.items.find((it) => it.id === id);
      if (!target) return {};
      const z = target.zIndex;
      const above = s.items.filter((it) => it.zIndex > z).sort((a, b) => a.zIndex - b.zIndex)[0];
      if (!above) return {};
      return {
        items: s.items.map((it) =>
          it.id === id
            ? { ...it, zIndex: above.zIndex }
            : it.id === above.id
              ? { ...it, zIndex: z }
              : it,
        ),
      };
    });
  },

  sendBackward: (id) => {
    get()._pushHistory();
    set((s) => {
      const target = s.items.find((it) => it.id === id);
      if (!target) return {};
      const z = target.zIndex;
      const below = s.items.filter((it) => it.zIndex < z).sort((a, b) => b.zIndex - a.zIndex)[0];
      if (!below) return {};
      return {
        items: s.items.map((it) =>
          it.id === id
            ? { ...it, zIndex: below.zIndex }
            : it.id === below.id
              ? { ...it, zIndex: z }
              : it,
        ),
      };
    });
  },

  bringToFront: (id) => {
    get()._pushHistory();
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, zIndex: nextZ(s.items) } : it)),
    }));
  },

  sendToBack: (id) => {
    get()._pushHistory();
    set((s) => {
      const minZ = s.items.reduce((m, it) => Math.min(m, it.zIndex), 0);
      return {
        items: s.items.map((it) => (it.id === id ? { ...it, zIndex: minZ - 1 } : it)),
      };
    });
  },

  setSelection: (ids) => set({ selection: ids }),
  addToSelection: (id) =>
    set((s) => (s.selection.includes(id) ? {} : { selection: [...s.selection, id] })),
  removeFromSelection: (id) => set((s) => ({ selection: s.selection.filter((x) => x !== id) })),
  toggleInSelection: (id) =>
    set((s) => ({
      selection: s.selection.includes(id)
        ? s.selection.filter((x) => x !== id)
        : [...s.selection, id],
    })),
  clearSelection: () => set({ selection: [] }),
  selectAll: () => set((s) => ({ selection: s.items.map((it) => it.id) })),

  setViewport: (vp) => set({ viewport: vp }),

  zoomBy: (factor, centre) => {
    set((s) => {
      const newK = clamp(s.viewport.k * factor, 0.05, 16);
      if (newK === s.viewport.k) return {};
      // Keep `centre` fixed on screen.
      const k0 = s.viewport.k;
      const k1 = newK;
      const newX = centre.x - ((centre.x - s.viewport.x) * k1) / k0;
      const newY = centre.y - ((centre.y - s.viewport.y) * k1) / k0;
      return { viewport: { x: newX, y: newY, k: k1 } };
    });
  },

  zoomToFit: () => {
    set((s) => {
      if (s.items.length === 0) {
        return { viewport: { x: 0, y: 0, k: 1 } };
      }
      const {
        x: minX,
        y: minY,
        w,
        h,
      } = boundsOfDocumentItems(
        s.items.map((it) => ({
          ...it,
          type: it.type,
          data: {},
          frame: { x: it.x, y: it.y, width: it.width, height: it.height },
        })),
      );
      const pad = 80;
      const wp = w + pad * 2;
      const hp = h + pad * 2;
      const cx = minX + w / 2;
      const cy = minY + h / 2;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const k = clamp(Math.min(vw / wp, vh / hp), 0.05, 4);
      return { viewport: { x: vw / 2 - cx * k, y: vh / 2 - cy * k, k } };
    });
  },

  resetView: () => set({ viewport: { x: 0, y: 0, k: 1 } }),

  setDragMode: (m) => set({ dragMode: m }),
  setMarqueeRect: (r) => set({ marqueeRect: r }),
  setHoverId: (id) => set({ hoverId: id }),
  setActiveHandle: (h) => set({ activeHandle: h }),

  copySelection: () => {
    const { items, selection } = get();
    const idSet = new Set(selection);
    const clipped = cloneItems(items.filter((it) => idSet.has(it.id)));
    if (clipped.length === 0) return;
    const payload = buildCanvasClipboardPayload(clipped);
    const entry = makeClipboardEntry(payload, "copy");
    set((s) => ({
      clipboard: clipped,
      clipboardHistory: appendClipboardEntry(s.clipboardHistory, entry),
      clipboardStatus: `${entry.summary} copied internally`,
      clipboardUpdatedAt: payload.ts,
    }));
    void writeCanvasClipboard(payload)
      .then((result) => {
        set({
          clipboardStatus: `${entry.summary} copied ${clipboardWriteSuffix(result.ok, result.mode)}`,
        });
      })
      .catch(console.error);
  },

  cutSelection: () => {
    const { items, selection } = get();
    if (selection.length === 0) return;
    get()._pushHistory();
    const idSet = new Set(selection);
    const clipped = cloneItems(items.filter((it) => idSet.has(it.id)));
    const payload = buildCanvasClipboardPayload(clipped);
    const entry = makeClipboardEntry(payload, "cut");
    set((s) => ({
      clipboard: clipped,
      clipboardHistory: appendClipboardEntry(s.clipboardHistory, entry),
      clipboardStatus: `${entry.summary} cut internally`,
      clipboardUpdatedAt: payload.ts,
      items: s.items.filter((it) => !idSet.has(it.id)),
      relations: s.relations.filter(
        (relation) => !idSet.has(relation.sourceId) && !idSet.has(relation.targetId),
      ),
      selection: [],
    }));
    void writeCanvasClipboard(payload)
      .then((result) => {
        set({
          clipboardStatus: `${entry.summary} cut ${clipboardWriteSuffix(result.ok, result.mode)}`,
        });
      })
      .catch(console.error);
  },

  paste: (targetCentre = null) => {
    const { clipboard } = get();
    if (clipboard.length === 0) return 0;
    return get().pasteItems(clipboard, targetCentre, "Pasted from latest internal clipboard");
  },

  pasteItems: (items, targetCentre = null, status = "Pasted canvas clipboard") => {
    if (items.length === 0) return 0;
    get()._pushHistory();
    const newItems = makePastedItems(items, targetCentre, nextZ(get().items));
    set((s) => ({
      items: [...s.items, ...newItems],
      selection: newItems.map((it) => it.id),
      clipboardStatus: `${status} (${newItems.length} item${newItems.length === 1 ? "" : "s"})`,
      clipboardUpdatedAt: Date.now(),
    }));
    return newItems.length;
  },

  pasteClipboardEntry: (entryId, targetCentre = null) => {
    const entry = get().clipboardHistory.find((candidate) => candidate.id === entryId);
    if (!entry) return 0;
    set({
      clipboard: cloneItems(entry.items),
      clipboardStatus: `${entry.summary} selected from clipboard history`,
      clipboardUpdatedAt: Date.now(),
    });
    return get().pasteItems(entry.items, targetCentre, `Pasted ${entry.summary} from history`);
  },

  addClipboardHistoryEntry: (items, source, status) => {
    if (items.length === 0) return null;
    const payload = buildCanvasClipboardPayload(items);
    const entry = makeClipboardEntry(payload, source);
    set((s) => ({
      clipboard: cloneItems(payload.items),
      clipboardHistory: appendClipboardEntry(s.clipboardHistory, entry),
      clipboardStatus: status ?? `${entry.summary} added to clipboard history`,
      clipboardUpdatedAt: payload.ts,
    }));
    return entry;
  },

  forgetClipboardEntry: (entryId) => {
    set((s) => ({ clipboardHistory: s.clipboardHistory.filter((entry) => entry.id !== entryId) }));
  },

  clearClipboardHistory: () => {
    set({ clipboardHistory: [], clipboardStatus: "Clipboard history cleared" });
  },

  duplicateSelection: () => {
    const { items, selection } = get();
    if (selection.length === 0) return;
    get()._pushHistory();
    const idSet = new Set(selection);
    const dupes: CanvasItem[] = items
      .filter((it) => idSet.has(it.id))
      .map((it) => {
        if (it.type === "image") {
          return {
            ...it,
            id: nanoid(),
            x: it.x + 16,
            y: it.y + 16,
            crop: it.crop ? { ...it.crop } : undefined,
            effects: it.effects ? [...it.effects] : undefined,
          } as CanvasItem;
        }
        if (it.type === "text") {
          return {
            ...it,
            id: nanoid(),
            x: it.x + 16,
            y: it.y + 16,
            logEntries: it.logEntries ? [...it.logEntries] : undefined,
          } as CanvasItem;
        }
        return { ...it, id: nanoid(), x: it.x + 16, y: it.y + 16 } as CanvasItem;
      });
    set((s) => ({
      items: [...s.items, ...dupes.map((it, i) => ({ ...it, zIndex: nextZ(s.items) + i }))],
      selection: dupes.map((it) => it.id),
    }));
  },

  commit: () => {
    // No-op: history is pushed on action start, not on commit. Kept for
    // ergonomic call-sites that want to ensure a snapshot.
  },

  undo: () => {
    set((s) => {
      if (s.past.length === 0) return {};
      const prev = s.past[s.past.length - 1];
      const current: HistorySnapshot = {
        items: s.items,
        selection: s.selection,
        relations: s.relations,
      };
      return {
        past: s.past.slice(0, -1),
        future: [current, ...s.future],
        items: prev.items,
        selection: prev.selection,
        relations: prev.relations,
      };
    });
  },

  redo: () => {
    set((s) => {
      if (s.future.length === 0) return {};
      const next = s.future[0];
      const current: HistorySnapshot = {
        items: s.items,
        selection: s.selection,
        relations: s.relations,
      };
      return {
        past: [...s.past, current],
        future: s.future.slice(1),
        items: next.items,
        selection: next.selection,
        relations: next.relations,
      };
    });
  },

  _pushHistory: () => {
    set((s) => {
      const snap: HistorySnapshot = {
        items: s.items.map((it) => ({ ...it })),
        selection: [...s.selection],
        relations: s.relations.map((relation) => ({ ...relation })),
      };
      const past = [...s.past, snap];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, future: [] };
    });
  },

  _replaceState: (snap) =>
    set({ items: snap.items, selection: snap.selection, relations: snap.relations }),

  setEditingId: (id) => set({ editingId: id }),
});

export type CanvasStore = StoreApi<CanvasState>;

export function createCanvasStore(): CanvasStore {
  return createStore<CanvasState>(createCanvasState);
}

const defaultCanvasStore = createCanvasStore();
const CanvasStoreContext = createContext<CanvasStore | null>(null);

export interface CanvasStoreProviderProps {
  store?: CanvasStore;
  children: ReactNode;
}

export function CanvasStoreProvider({ store, children }: CanvasStoreProviderProps) {
  const fallbackStoreRef = useRef<CanvasStore | null>(null);
  if (!fallbackStoreRef.current) fallbackStoreRef.current = createCanvasStore();
  return createElement(
    CanvasStoreContext.Provider,
    { value: store ?? fallbackStoreRef.current },
    children,
  );
}

export function useCanvasStoreApi(): CanvasStore {
  return useContext(CanvasStoreContext) ?? defaultCanvasStore;
}

type CanvasStoreHook = {
  <T>(selector: (state: CanvasState) => T): T;
  getState: CanvasStore["getState"];
  setState: CanvasStore["setState"];
  subscribe: CanvasStore["subscribe"];
};

export const useCanvasStore = ((selector) =>
  useStore(useCanvasStoreApi(), selector)) as CanvasStoreHook;
useCanvasStore.getState = defaultCanvasStore.getState;
useCanvasStore.setState = defaultCanvasStore.setState;
useCanvasStore.subscribe = defaultCanvasStore.subscribe;

export type CanvasCommandDispatchResult =
  | { ok: true; command: CanvasCommand; change: CanvasChange }
  | { ok: false; reason: "unsupported-item" | "host-owned-command" | "not-found" };

function changeForCanvasCommand(command: CanvasCommand): CanvasChange {
  switch (command.type) {
    case "item.add":
      return {
        type: "command",
        action: "add",
        subject: "item",
        command,
        itemIds: [command.item.id],
      };
    case "item.update":
      return {
        type: "command",
        action: "update",
        subject: "item",
        command,
        itemIds: [command.id],
      };
    case "item.remove":
      return {
        type: "command",
        action: "remove",
        subject: "item",
        command,
        itemIds: command.ids,
      };
    case "relation.add":
      return {
        type: "command",
        action: "add",
        subject: "relation",
        command,
        relationIds: [command.relation.id],
      };
    case "relation.remove":
      return {
        type: "command",
        action: "remove",
        subject: "relation",
        command,
        relationIds: [command.id],
      };
    case "selection.set":
      return {
        type: "command",
        action: "set",
        subject: "selection",
        command,
        selection: command.ids,
      };
    default:
      return {
        type: "command",
        action: "delegate",
        subject: "plugin",
        command,
      };
  }
}

function handledCanvasCommand(command: CanvasCommand): CanvasCommandDispatchResult {
  return { ok: true, command, change: changeForCanvasCommand(command) };
}

function runtimePatchFromDocumentPatch(
  existing: CanvasItem,
  patch: Partial<CanvasDocumentItem>,
): CanvasItem | null {
  const documentItem = {
    ...itemToDocumentItem(existing),
    ...patch,
    frame: { ...itemToDocumentItem(existing).frame, ...patch.frame },
    data: { ...itemToDocumentItem(existing).data, ...patch.data },
  };
  return documentItemToRuntimeItem(documentItem);
}

export interface CanvasCommandDispatchOptions {
  plugins?: CanvasPluginRegistry;
}

function dispatchPluginCommand(
  store: CanvasStore,
  command: CanvasCommand,
  plugins?: CanvasPluginRegistry,
): CanvasCommandDispatchResult | null {
  if (!plugins) return null;
  const state = store.getState();
  const handled = plugins.dispatchCommand(command, {
    document: snapshotCanvasStoreDocument(store),
    selection: [...state.selection],
  });
  return handled ? handledCanvasCommand(command) : null;
}

export function dispatchCanvasCommand(
  store: CanvasStore,
  command: CanvasCommand,
  options: CanvasCommandDispatchOptions = {},
): CanvasCommandDispatchResult {
  switch (command.type) {
    case "item.add": {
      const runtimeItem = documentItemToRuntimeItem(command.item);
      if (!runtimeItem) return { ok: false, reason: "unsupported-item" };
      store.getState().addItems([runtimeItem]);
      return handledCanvasCommand(command);
    }
    case "item.update": {
      const existing = store.getState().items.find((item) => item.id === command.id);
      if (!existing) return { ok: false, reason: "not-found" };
      const runtimeItem = runtimePatchFromDocumentPatch(existing, command.patch);
      if (!runtimeItem) return { ok: false, reason: "unsupported-item" };
      store.getState().replaceItem(command.id, runtimeItem);
      return handledCanvasCommand(command);
    }
    case "item.remove":
      store.getState().removeItems(command.ids);
      return handledCanvasCommand(command);
    case "relation.add":
      store.getState().addRelation(command.relation);
      return handledCanvasCommand(command);
    case "relation.remove":
      store.getState().removeRelation(command.id);
      return handledCanvasCommand(command);
    case "selection.set":
      store.getState().setSelection(command.ids);
      return handledCanvasCommand(command);
    case "document.load":
    case "document.save":
    case "media.play-item":
    case "media.play-sequence":
    case "custom":
      return (
        dispatchPluginCommand(store, command, options.plugins) ?? {
          ok: false,
          reason: "host-owned-command",
        }
      );
  }
}

export function snapshotCanvasStoreDocument(store: CanvasStore) {
  const state = store.getState();
  return createCanvasDocument(state.items, {
    viewport: state.viewport,
    relations: state.relations,
  });
}

export function hydrateCanvasStoreDocument(store: CanvasStore, document: unknown): void {
  const normalized = normalizeCanvasDocument(document);
  store.setState({
    items: runtimeItemsFromDocument(normalized),
    relations: normalized.relations ?? [],
    selection: [],
    viewport: normalized.viewport ?? store.getState().viewport,
    marqueeRect: null,
    dragMode: "none",
  });
}

// ---------- Factory helpers ----------

export function createImageItem(
  partial: Partial<ImageItem> & {
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  },
): ImageItem {
  const naturalW = partial.naturalWidth;
  const naturalH = partial.naturalHeight;
  const aspect = naturalW / naturalH || 1;
  const width = partial.width ?? Math.min(400, naturalW);
  const height = partial.height ?? width / aspect;
  return {
    id: partial.id ?? nanoid(),
    type: "image",
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    width,
    height,
    rotation: partial.rotation ?? 0,
    zIndex: partial.zIndex ?? 0,
    label: partial.label,
    accent: partial.accent,
    src: partial.src,
    naturalWidth: naturalW,
    naturalHeight: naturalH,
    crop: partial.crop,
  };
}

export function createAudioItem({
  sourceRef,
  src,
  title,
  artist,
  album,
  durationMs,
  x,
  y,
  width = 360,
  height = 126,
  label,
}: {
  sourceRef: string;
  src?: string;
  title?: string;
  artist?: string;
  album?: string;
  durationMs?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
}): AudioItem {
  return {
    id: nanoid(),
    type: "audio",
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 0,
    label: label ?? title ?? sourceRef,
    sourceRef,
    src,
    title,
    artist,
    album,
    durationMs,
    playbackMode: "manual",
  };
}

export function createLinkItem({
  url,
  title,
  description,
  x,
  y,
  width = 360,
  height = 220,
  label,
}: {
  url: string;
  title?: string;
  description?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
}): LinkItem {
  return {
    id: nanoid(),
    type: "link",
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 0,
    label: label ?? title ?? url,
    url,
    title,
    description,
    viewMode: "card",
  };
}

export function createTextItem(
  partial: Partial<TextItem> & {
    text?: string;
  },
): TextItem {
  return {
    id: partial.id ?? nanoid(),
    type: "text",
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    width: partial.width ?? 240,
    height: partial.height ?? 96,
    rotation: partial.rotation ?? 0,
    zIndex: partial.zIndex ?? 0,
    label: partial.label,
    accent: partial.accent,
    text: partial.text ?? "Double-click to edit text",
    fontSize: partial.fontSize ?? 16,
    color: partial.color ?? "#1a1a1a",
    background: partial.background ?? "#fff8d6",
    align: partial.align ?? "left",
    textKind: partial.textKind ?? "plaintext",
    textRole: partial.textRole ?? "paragraph",
    viewMode: partial.viewMode ?? "source",
    richTextHtml: partial.richTextHtml,
    logEntries: partial.logEntries,
  };
}
