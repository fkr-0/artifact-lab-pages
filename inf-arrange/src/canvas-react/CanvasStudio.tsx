import {
  type CanvasCapabilities,
  type CanvasChange,
  type CanvasCommand,
  type CanvasDocument,
  type CanvasItemPlugin,
  type CanvasPluginRegistry,
  createCanvasDocument,
  createCanvasPluginRegistry,
  itemToDocumentItem,
  normalizeCanvasDocument,
  runtimeItemsFromDocument,
} from "@/canvas-core";
import { ClipboardHistoryPalette } from "@/components/ClipboardHistoryPalette";
import { ClipboardInspector } from "@/components/ClipboardInspector";
import { InfiniteCanvas } from "@/components/InfiniteCanvas";
import { Minimap } from "@/components/Minimap";
import {
  type CanvasStore,
  CanvasStoreProvider,
  createCanvasStore,
  dispatchCanvasCommand,
  useCanvasStoreApi,
} from "@/store/canvas";
import type { ImageItem, Point, TextItem } from "@/types";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

export interface CanvasStudioHandle {
  getDocument: () => CanvasDocument;
  setDocument: (document: CanvasDocument) => void;
  getSelection: () => string[];
  setSelection: (ids: string[]) => void;
  zoomToFit: () => void;
  resetView: () => void;
  dispatchCommand: (command: CanvasCommand) => ReturnType<typeof dispatchCanvasCommand>;
}

export interface CanvasStudioProps {
  document?: CanvasDocument;
  defaultDocument?: CanvasDocument;
  mode?: "controlled" | "uncontrolled";
  onDocumentChange?: (document: CanvasDocument, change: CanvasChange) => void;
  onSelectionChange?: (selection: string[]) => void;
  onContextMenu?: (position: Point, itemId: string | null) => void;
  capabilities?: CanvasCapabilities;
  showClipboardInspector?: boolean;
  showMinimap?: boolean;
  enableClipboardHistoryPalette?: boolean;
  store?: CanvasStore;
  plugins?: CanvasPluginRegistry | CanvasItemPlugin[];
  className?: string;
  style?: React.CSSProperties;
}

function resolvePluginRegistry(
  plugins: CanvasStudioProps["plugins"],
): CanvasPluginRegistry | undefined {
  if (!plugins) return undefined;
  return Array.isArray(plugins) ? createCanvasPluginRegistry(plugins) : plugins;
}

function snapshotDocument(store: CanvasStore): CanvasDocument {
  const state = store.getState();
  return createCanvasDocument(state.items, {
    viewport: state.viewport,
    relations: state.relations,
  });
}

function documentContentKey(document: CanvasDocument): string {
  const normalized = normalizeCanvasDocument(document);
  return JSON.stringify({
    schema: normalized.schema,
    version: normalized.version,
    id: normalized.id,
    title: normalized.title,
    viewport: normalized.viewport,
    items: normalized.items,
    relations: normalized.relations,
    metadata: normalized.metadata,
  });
}

function stateContentKey(store: CanvasStore): string {
  const state = store.getState();
  return JSON.stringify({
    viewport: state.viewport,
    items: state.items.map(itemToDocumentItem),
    relations: state.relations,
  });
}

function hydrateDocument(store: CanvasStore, document: CanvasDocument): CanvasDocument {
  const normalized = normalizeCanvasDocument(document);
  store.setState({
    items: runtimeItemsFromDocument(normalized),
    relations: normalized.relations ?? [],
    selection: [],
    viewport: normalized.viewport ?? store.getState().viewport,
    marqueeRect: null,
    dragMode: "none",
  });
  return normalized;
}

export interface CanvasStudioCommandDispatchArgs {
  store: CanvasStore;
  command: CanvasCommand;
  plugins?: CanvasPluginRegistry;
  onDocumentChange?: (document: CanvasDocument, change: CanvasChange) => void;
}

export function dispatchCanvasStudioCommand({
  store,
  command,
  plugins,
  onDocumentChange,
}: CanvasStudioCommandDispatchArgs): ReturnType<typeof dispatchCanvasCommand> {
  const result = dispatchCanvasCommand(store, command, { plugins });
  if (result.ok) {
    onDocumentChange?.(snapshotDocument(store), result.change);
  }
  return result;
}

const CanvasStudioInner = forwardRef<CanvasStudioHandle, CanvasStudioProps>(
  function CanvasStudioInner(
    {
      document,
      defaultDocument,
      mode,
      onDocumentChange,
      onSelectionChange,
      onContextMenu,
      capabilities,
      plugins,
      showClipboardInspector = true,
      showMinimap = true,
      enableClipboardHistoryPalette = true,
      className,
      style,
    },
    ref,
  ) {
    const canvasStore = useCanvasStoreApi();
    const pluginRegistry = useMemo(() => resolvePluginRegistry(plugins), [plugins]);
    const [clipboardHistoryOpen, setClipboardHistoryOpen] = useState(false);
    const resolvedMode = mode ?? (document ? "controlled" : "uncontrolled");
    const hydratedDefaultRef = useRef(false);
    const lastHydratedKeyRef = useRef<string | null>(null);
    const lastEmittedContentKeyRef = useRef<string | null>(null);
    const lastSelectionKeyRef = useRef<string>(canvasStore.getState().selection.join("\u0000"));
    const suppressNextStoreEmitRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getDocument: () => snapshotDocument(canvasStore),
      setDocument: (nextDocument) => {
        suppressNextStoreEmitRef.current = true;
        const normalized = hydrateDocument(canvasStore, nextDocument);
        lastHydratedKeyRef.current = documentContentKey(normalized);
        lastEmittedContentKeyRef.current = stateContentKey(canvasStore);
        onDocumentChange?.(normalized, { type: "snapshot", reason: "imperative-set-document" });
      },
      getSelection: () => [...canvasStore.getState().selection],
      setSelection: (ids) => canvasStore.getState().setSelection(ids),
      zoomToFit: () => canvasStore.getState().zoomToFit(),
      resetView: () => canvasStore.getState().resetView(),
      dispatchCommand: (command) => {
        suppressNextStoreEmitRef.current = true;
        const result = dispatchCanvasStudioCommand({
          store: canvasStore,
          command,
          plugins: pluginRegistry,
          onDocumentChange,
        });
        if (suppressNextStoreEmitRef.current) suppressNextStoreEmitRef.current = false;
        return result;
      },
    }));

    useEffect(() => {
      const nextDocument = resolvedMode === "controlled" ? document : defaultDocument;
      if (!nextDocument) return;
      if (resolvedMode === "uncontrolled" && hydratedDefaultRef.current) return;

      const nextKey = documentContentKey(nextDocument);
      if (lastHydratedKeyRef.current === nextKey) return;

      suppressNextStoreEmitRef.current = true;
      const normalized = hydrateDocument(canvasStore, nextDocument);
      hydratedDefaultRef.current = true;
      lastHydratedKeyRef.current = nextKey;
      lastEmittedContentKeyRef.current = stateContentKey(canvasStore);
      onDocumentChange?.(normalized, { type: "snapshot", reason: "hydrate" });
    }, [canvasStore, defaultDocument, document, onDocumentChange, resolvedMode]);

    useEffect(() => {
      if (!onDocumentChange && !onSelectionChange) return;
      return canvasStore.subscribe((state) => {
        const selectionKey = state.selection.join("\u0000");
        if (selectionKey !== lastSelectionKeyRef.current) {
          lastSelectionKeyRef.current = selectionKey;
          onSelectionChange?.([...state.selection]);
        }

        if (!onDocumentChange) return;
        if (suppressNextStoreEmitRef.current) {
          suppressNextStoreEmitRef.current = false;
          return;
        }

        const contentKey = stateContentKey(canvasStore);
        if (contentKey === lastEmittedContentKeyRef.current) return;
        lastEmittedContentKeyRef.current = contentKey;
        onDocumentChange(snapshotDocument(canvasStore), {
          type: "snapshot",
          reason: "store-change",
        });
      });
    }, [canvasStore, onDocumentChange, onSelectionChange]);

    useEffect(() => {
      if (!enableClipboardHistoryPalette) return;
      const handler = () => setClipboardHistoryOpen(true);
      window.addEventListener("cs:clipboard-history", handler);
      return () => window.removeEventListener("cs:clipboard-history", handler);
    }, [enableClipboardHistoryPalette]);

    useEffect(() => {
      if (!capabilities?.imageEditor) return;
      const handler = async (event: Event) => {
        const itemId = (event as CustomEvent<{ itemId?: string }>).detail?.itemId;
        if (!itemId) return;
        const item = canvasStore.getState().items.find((candidate) => candidate.id === itemId);
        if (!item || item.type !== "image") return;
        const result = await capabilities.imageEditor?.edit({
          itemId,
          src: item.src,
          naturalWidth: item.naturalWidth,
          naturalHeight: item.naturalHeight,
        });
        if (!result) return;
        canvasStore.getState().updateItem(itemId, {
          src: result.src,
          naturalWidth: result.naturalWidth,
          naturalHeight: result.naturalHeight,
          crop: undefined,
          editorRef: "external",
        } as Partial<ImageItem>);
      };
      window.addEventListener("cs:image-editor", handler);
      return () => window.removeEventListener("cs:image-editor", handler);
    }, [canvasStore, capabilities]);

    useEffect(() => {
      if (!capabilities?.textEditor) return;
      const handler = async (event: Event) => {
        const itemId = (event as CustomEvent<{ itemId?: string }>).detail?.itemId;
        if (!itemId) return;
        const item = canvasStore.getState().items.find((candidate) => candidate.id === itemId);
        if (!item || item.type !== "text") return;
        const mode = item.textKind ?? "plaintext";
        const result = await capabilities.textEditor?.edit({
          itemId,
          mode,
          value: mode === "richtext" ? (item.richTextHtml ?? item.text) : item.text,
          html: item.richTextHtml,
        });
        if (!result) return;
        canvasStore.getState().updateItem(itemId, {
          text: result.value,
          richTextHtml: result.html,
          viewMode: result.html ? "rendered" : item.viewMode,
        } as Partial<TextItem>);
      };
      window.addEventListener("cs:text-editor", handler);
      return () => window.removeEventListener("cs:text-editor", handler);
    }, [canvasStore, capabilities]);

    return (
      <div
        className={className}
        style={{ position: "relative", width: "100%", height: "100%", ...style }}
      >
        <InfiniteCanvas onContextMenu={onContextMenu ?? (() => undefined)} />
        {showClipboardInspector && <ClipboardInspector />}
        {showMinimap && <Minimap />}
        {enableClipboardHistoryPalette && (
          <ClipboardHistoryPalette
            opened={clipboardHistoryOpen}
            onClose={() => setClipboardHistoryOpen(false)}
          />
        )}
      </div>
    );
  },
);

export const CanvasStudio = forwardRef<CanvasStudioHandle, CanvasStudioProps>(
  function CanvasStudio(props, ref) {
    const storeRef = useRef<CanvasStore>(props.store ?? createCanvasStore());
    return (
      <CanvasStoreProvider store={storeRef.current}>
        <CanvasStudioInner {...props} ref={ref} />
      </CanvasStoreProvider>
    );
  },
);
