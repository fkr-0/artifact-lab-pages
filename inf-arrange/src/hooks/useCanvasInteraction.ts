import {
  applyResize,
  clamp,
  rectFromCorners,
  rectsIntersect,
  screenToCanvas,
} from "@/lib/geometry";
import { loadImage, normaliseImageInput } from "@/lib/imageOps";
import { buttonName, matchMouseBinding, resolveContext } from "@/lib/keybindingMatchers";
import { createImageItem, useCanvasStoreApi } from "@/store/canvas";
import { useKeybindingsStore } from "@/store/keybindings";
import type { CanvasItem, DragMode, Point, ResizeHandle } from "@/types";
import type { ActionId } from "@/types/keybindings";
import { useCallback, useRef } from "react";

interface Args {
  surfaceRef: React.RefObject<HTMLDivElement>;
  onContextMenu: (p: Point, itemId: string | null) => void;
}

interface ActiveDrag {
  action: ActionId;
  mode: DragMode;
  startCanvas: Point;
  /** Pointer screen position at drag start (for pan delta computation). */
  startScreen: Point;
  /** Viewport at drag start (for pan: the base we apply deltas to). */
  startViewport: { x: number; y: number; k: number };
  /** Pre-drag snapshot used both for delta computation and undo restoration. */
  snapshot: Map<string, { x: number; y: number; width: number; height: number }>;
  /** Items that existed at drag start (used to rebuild pre-drag state for undo). */
  preDragItems: CanvasItem[];
  preSelection: string[];
  /** Item ids participating in the drag. */
  ids: string[];
  handle: ResizeHandle | null;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  pointerId: number;
  /** For constrain-axis: the locked axis ('x' | 'y' | null) once determined. */
  lockedAxis: "x" | "y" | null;
  /** For duplicate-drag: the cloned items already inserted. */
  duplicated: boolean;
}

function getItemType(el: Element | null): "image" | "text" | undefined {
  if (!el) return undefined;
  const t = el.getAttribute("data-item-type");
  if (t === "image" || t === "text") return t;
  // Fallback: inspect the data-item-id element's child structure.
  const itemEl = el.closest("[data-item-id]") as HTMLElement | null;
  if (!itemEl) return undefined;
  return itemEl.getAttribute("data-item-type") as "image" | "text" | undefined;
}

export function useCanvasInteraction({ surfaceRef }: Args) {
  const canvasStore = useCanvasStoreApi();
  const dragRef = useRef<ActiveDrag | null>(null);
  const marqueeRafRef = useRef(0);

  const onPointerDownSurface = useCallback(
    (e: React.PointerEvent) => {
      // Determine button name; right button (2) is handled by onContextMenu
      // separately, but we still want to allow right-click bindings.
      const mb = buttonName(e.button);
      if (!mb) return;

      const target = e.target as Element;
      const handleEl = target.closest("[data-handle]") as HTMLElement | null;
      const itemEl = target.closest("[data-item-id]") as HTMLElement | null;
      const itemType = getItemType(target);

      // If a text block is currently being edited and the user clicked
      // outside its contentEditable element, exit edit mode first.
      const editingId = canvasStore.getState().editingId;
      if (editingId) {
        const editingEl = document.querySelector(
          `[data-item-id="${editingId}"] [contenteditable="true"]`,
        );
        if (!editingEl || !editingEl.contains(target)) {
          canvasStore.getState().setEditingId(null);
        }
      }
      const isItem = !!itemEl;
      const ctx = resolveContext(isItem, itemType);

      const store = canvasStore.getState();
      const vp = store.viewport;
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const startCanvas = screenToCanvas({ x: e.clientX - rect.left, y: e.clientY - rect.top }, vp);
      const startScreen = { x: e.clientX, y: e.clientY };

      // Look up the matching mouse binding for "drag" (we set up the drag
      // state regardless — for click actions, we'll fire on pointerup if no
      // movement occurred).
      const bindings = useKeybindingsStore.getState().mouse;
      const dragBinding = matchMouseBinding(bindings, {
        button: mb,
        dragType: "drag",
        context: ctx,
        e,
      });
      const clickBinding = matchMouseBinding(bindings, {
        button: mb,
        dragType: "click",
        context: ctx,
        e,
      });

      // Right-click context menu is handled by the surface's onContextMenu
      // React handler — bail out here so we don't set up a drag.
      if (clickBinding?.action === "context-menu" || dragBinding?.action === "context-menu") {
        return;
      }

      // If a handle is being dragged, force the action to "resize" regardless
      // of binding (handles are dedicated resize UI).
      if (handleEl && itemEl) {
        const handle = handleEl.getAttribute("data-handle") as ResizeHandle;
        const itemId = itemEl.getAttribute("data-item-id")!;
        const items = canvasStore.getState().items;
        // Ensure the item is selected.
        let sel = new Set(store.selection);
        if (!sel.has(itemId)) {
          if (!e.shiftKey) {
            store.setSelection([itemId]);
            sel = new Set([itemId]);
          } else {
            store.addToSelection(itemId);
            sel.add(itemId);
          }
        }
        const snap = new Map<string, { x: number; y: number; width: number; height: number }>();
        for (const id of sel) {
          const it = items.find((x) => x.id === id);
          if (it) snap.set(id, { x: it.x, y: it.y, width: it.width, height: it.height });
        }
        dragRef.current = {
          action: "resize",
          mode: "resize",
          startCanvas,
          startScreen,
          startViewport: { x: vp.x, y: vp.y, k: vp.k },
          snapshot: snap,
          preDragItems: items.map((it) => ({ ...it })),
          preSelection: [...sel],
          ids: [...sel],
          handle,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey || e.metaKey,
          pointerId: e.pointerId,
          lockedAxis: null,
          duplicated: false,
        };
        canvasStore.getState().setDragMode("resize");
        canvasStore.getState().setActiveHandle(handle);
        return;
      }

      // Click-binding actions that should fire EAGERLY on pointerdown because
      // they modify the selection that the drag will operate on:
      //   - toggle-selection: shift+click adds/removes from selection
      //   - select (no shift/ctrl): if the clicked item isn't already selected,
      //     make it the sole selection so the drag operates on it
      //   - clear-selection: only fires when no drag-binding matches (below)
      if (clickBinding && isItem) {
        const itemId = itemEl.getAttribute("data-item-id")!;
        if (clickBinding.action === "toggle-selection") {
          store.toggleInSelection(itemId);
        } else if (
          clickBinding.action === "select" &&
          !e.shiftKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !store.selection.includes(itemId)
        ) {
          store.setSelection([itemId]);
        }
      } else if (clickBinding && !isItem && !dragBinding) {
        // No drag binding and clicked on empty canvas → fire the click action
        // (typically clear-selection).
        if (clickBinding.action === "clear-selection" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          store.clearSelection();
        }
        return;
      }

      // If no drag binding matches, we're done.
      if (!dragBinding) return;

      // For drag actions that require an item but none was clicked, no-op.
      const itemActions: ActionId[] = [
        "move",
        "resize",
        "crop",
        "constrain-axis",
        "duplicate-drag",
      ];
      if (itemActions.includes(dragBinding.action) && !isItem) return;

      const items = canvasStore.getState().items;
      const selectedIds = isItem ? [...new Set([...canvasStore.getState().selection])] : [];

      const snap = new Map<string, { x: number; y: number; width: number; height: number }>();
      for (const id of selectedIds) {
        const it = items.find((x) => x.id === id);
        if (it) snap.set(id, { x: it.x, y: it.y, width: it.width, height: it.height });
      }

      const dragMode: DragMode =
        dragBinding.action === "pan"
          ? "pan"
          : dragBinding.action === "marquee-select"
            ? "marquee"
            : dragBinding.action === "resize"
              ? "resize"
              : dragBinding.action === "crop"
                ? "crop"
                : "move";

      dragRef.current = {
        action: dragBinding.action,
        mode: dragMode,
        startCanvas,
        startScreen,
        startViewport: { x: vp.x, y: vp.y, k: vp.k },
        snapshot: snap,
        preDragItems: items.map((it) => ({ ...it })),
        preSelection: canvasStore.getState().selection,
        ids: selectedIds,
        handle: dragBinding.action === "resize" ? "se" : null,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        pointerId: e.pointerId,
        lockedAxis: null,
        duplicated: false,
      };
      canvasStore.getState().setDragMode(dragMode);
      if (dragBinding.action === "resize") {
        canvasStore.getState().setActiveHandle("se");
      }
    },
    [canvasStore, surfaceRef],
  );

  const onPointerMoveSurface = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const vp = canvasStore.getState().viewport;
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const currentCanvas = screenToCanvas(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        vp,
      );

      // ---- Pan (manual viewport update; sync effect in InfiniteCanvas
      // keeps d3-zoom's __zoom in sync). ----
      if (drag.action === "pan") {
        const dx = e.clientX - drag.startScreen.x;
        const dy = e.clientY - drag.startScreen.y;
        canvasStore.getState().setViewport({
          x: drag.startViewport.x + dx,
          y: drag.startViewport.y + dy,
          k: drag.startViewport.k,
        });
        return;
      }

      // ---- Marquee select ----
      if (drag.action === "marquee-select") {
        if (marqueeRafRef.current) return;
        marqueeRafRef.current = requestAnimationFrame(() => {
          marqueeRafRef.current = 0;
          const r = rectFromCorners(drag.startCanvas, currentCanvas);
          canvasStore.getState().setMarqueeRect(r);
          const items = canvasStore.getState().items;
          const intersected = items
            .filter((it) => rectsIntersect(r, { x: it.x, y: it.y, w: it.width, h: it.height }))
            .map((it) => it.id);
          canvasStore.getState().setSelection(intersected);
        });
        return;
      }

      // ---- Move / Constrain-axis / Duplicate-drag ----
      if (
        drag.action === "move" ||
        drag.action === "constrain-axis" ||
        drag.action === "duplicate-drag"
      ) {
        // Lazy duplicate: on the first move event, clone the selected items
        // and replace the selection with the clones.
        if (drag.action === "duplicate-drag" && !drag.duplicated) {
          const items = canvasStore.getState().items;
          const idSet = new Set(drag.ids);
          const dupes: CanvasItem[] = items
            .filter((it) => idSet.has(it.id))
            .map((it) => ({ ...it, id: nanoidLocal(), x: it.x, y: it.y }));
          canvasStore.getState()._pushHistory();
          canvasStore.setState((s) => ({
            items: [...s.items, ...dupes],
            selection: dupes.map((d) => d.id),
          }));
          // Rebuild snapshot for the clones.
          const newSnap = new Map<
            string,
            { x: number; y: number; width: number; height: number }
          >();
          for (const d of dupes) {
            newSnap.set(d.id, { x: d.x, y: d.y, width: d.width, height: d.height });
          }
          drag.snapshot = newSnap;
          drag.ids = dupes.map((d) => d.id);
          drag.duplicated = true;
        }

        let dx = currentCanvas.x - drag.startCanvas.x;
        let dy = currentCanvas.y - drag.startCanvas.y;

        // Constrain-axis: once the drag exceeds 4 px in either direction,
        // lock to the dominant axis (horizontal or vertical only).
        if (drag.action === "constrain-axis") {
          if (!drag.lockedAxis) {
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
              drag.lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            }
          }
          if (drag.lockedAxis === "x") dy = 0;
          else if (drag.lockedAxis === "y") dx = 0;
        }

        canvasStore.getState().updateItems(drag.ids, (it) => {
          const snap = drag.snapshot.get(it.id);
          if (!snap) return {};
          return { x: snap.x + dx, y: snap.y + dy };
        });
        return;
      }

      // ---- Resize (from ctrl+drag on body; uses SE handle) ----
      if (drag.action === "resize" && drag.handle) {
        const id = drag.ids[0];
        const snap = drag.snapshot.get(id);
        if (!snap) return;
        const dx = currentCanvas.x - drag.startCanvas.x;
        const dy = currentCanvas.y - drag.startCanvas.y;
        const newRect = applyResize(
          { x: snap.x, y: snap.y, w: snap.width, h: snap.height },
          drag.handle,
          dx,
          dy,
          drag.altKey,
        );
        canvasStore.getState().updateItem(id, {
          x: newRect.x,
          y: newRect.y,
          width: newRect.w,
          height: newRect.h,
        });
        return;
      }

      // ---- Crop (image only) ----
      if (drag.action === "crop" && drag.ids[0]) {
        const id = drag.ids[0];
        const snap = drag.snapshot.get(id);
        if (!snap) return;
        const r = rectFromCorners(drag.startCanvas, currentCanvas);
        const cx = clamp(r.x, snap.x, snap.x + snap.width);
        const cy = clamp(r.y, snap.y, snap.y + snap.height);
        const cw = clamp(r.x + r.w, snap.x, snap.x + snap.width) - cx;
        const ch = clamp(r.y + r.h, snap.y, snap.y + snap.height) - cy;
        const item = canvasStore.getState().items.find((it) => it.id === id);
        if (!item) return;
        if (item.type !== "image") {
          canvasStore.getState().updateItem(id, { x: cx, y: cy, width: cw, height: ch });
          return;
        }
        const scaleX = item.naturalWidth / snap.width;
        const scaleY = item.naturalHeight / snap.height;
        const baseCrop = item.crop ?? { x: 0, y: 0, w: item.naturalWidth, h: item.naturalHeight };
        const cropX = baseCrop.x + (cx - snap.x) * scaleX;
        const cropY = baseCrop.y + (cy - snap.y) * scaleY;
        const cropW = cw * scaleX;
        const cropH = ch * scaleY;
        canvasStore.getState().updateItem(id, {
          x: cx,
          y: cy,
          width: cw,
          height: ch,
          crop: { x: cropX, y: cropY, w: cropW, h: cropH },
        });
        return;
      }
    },
    [canvasStore, surfaceRef],
  );

  const onPointerUpSurface = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const vp = canvasStore.getState().viewport;
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const endCanvas = screenToCanvas({ x: e.clientX - rect.left, y: e.clientY - rect.top }, vp);

      const moved =
        Math.abs(endCanvas.x - drag.startCanvas.x) > 0.5 ||
        Math.abs(endCanvas.y - drag.startCanvas.y) > 0.5;

      // For move/resize/crop/constrain/duplicate-drag gestures that actually
      // moved, push pre-drag snapshot to past so a single undo reverts.
      const historyActions: ActionId[] = [
        "move",
        "resize",
        "crop",
        "constrain-axis",
        "duplicate-drag",
      ];
      if (moved && historyActions.includes(drag.action)) {
        const currentItems = canvasStore.getState().items;
        const itemsChanged = drag.preDragItems.some((pre) => {
          const cur = currentItems.find((c) => c.id === pre.id);
          return (
            !cur ||
            cur.x !== pre.x ||
            cur.y !== pre.y ||
            cur.width !== pre.width ||
            cur.height !== pre.height
          );
        });
        if (!itemsChanged) return;
        canvasStore.setState((s) => {
          const past = [
            ...s.past,
            {
              items: drag.preDragItems,
              selection: drag.preSelection,
              relations: s.relations.map((relation) => ({ ...relation })),
            },
          ];
          if (past.length > 80) past.shift();
          return { past, future: [] };
        });
      }

      if (drag.action === "marquee-select") {
        canvasStore.getState().setMarqueeRect(null);
      }

      dragRef.current = null;
      canvasStore.getState().setDragMode("none");
      canvasStore.getState().setActiveHandle(null);
    },
    [canvasStore, surfaceRef],
  );

  // ---- Drag-and-drop file handler ----
  const onDropSurface = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const store = canvasStore.getState();
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const drop = screenToCanvas(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        store.viewport,
      );
      const files: File[] = [];
      if (e.dataTransfer.files) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }
      if (files.length === 0) return;
      let offset = 0;
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        try {
          const src = await normaliseImageInput(f);
          const { naturalWidth, naturalHeight } = await loadImage(src);
          const item = createImageItem({
            src,
            naturalWidth,
            naturalHeight,
            x: drop.x + offset,
            y: drop.y + offset,
            label: f.name,
          });
          canvasStore.getState().addItems([item]);
          offset += 24;
        } catch (err) {
          console.error("drop image failed", err);
        }
      }
    },
    [canvasStore, surfaceRef],
  );

  return {
    onPointerDownSurface,
    onPointerMoveSurface,
    onPointerUpSurface,
    onDropSurface,
  };
}

// Lightweight local id generator (avoids importing nanoid into this hot path).
function nanoidLocal(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
