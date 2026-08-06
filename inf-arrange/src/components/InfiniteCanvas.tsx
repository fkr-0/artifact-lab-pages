import { select } from "d3-selection";
import { type ZoomBehavior, zoom, zoomIdentity } from "d3-zoom";
import { useEffect, useMemo, useRef } from "react";
import "d3-transition";
import { CanvasItemView } from "@/components/CanvasItemView";
import { MarqueeOverlay } from "@/components/MarqueeOverlay";
import { RelationOverlay } from "@/components/RelationOverlay";
import { useCanvasInteraction } from "@/hooks/useCanvasInteraction";
import { useGlobalPaste } from "@/hooks/useGlobalPaste";
import { useShortcuts } from "@/hooks/useShortcuts";
import { clamp } from "@/lib/geometry";
import { useCanvasStore, useCanvasStoreApi } from "@/store/canvas";
import type { Point } from "@/types";

interface Props {
  onContextMenu: (p: Point, itemId: string | null) => void;
}

export function InfiniteCanvas({ onContextMenu }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const relationLayerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const canvasStore = useCanvasStoreApi();
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const items = useCanvasStore((s) => s.items);
  const relations = useCanvasStore((s) => s.relations);
  const zoomToFit = useCanvasStore((s) => s.zoomToFit);
  const resetView = useCanvasStore((s) => s.resetView);
  const dragMode = useCanvasStore((s) => s.dragMode);

  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const smoothZoomTargetRef = useRef(viewport);
  const smoothZoomFrameRef = useRef<number | null>(null);

  // Build the d3-zoom behaviour once. Mount-only — we deliberately read
  // `viewport` once at init (via canvasStore.getState() inside the effect)
  // so the deps array intentionally only contains setViewport. The separate
  // useEffect below keeps d3-zoom's __zoom in sync on subsequent viewport
  // changes.
  useEffect(() => {
    if (!surfaceRef.current) return;
    const sel = select(surfaceRef.current);

    const behavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.05, 16])
      // d3-zoom handles WHEEL only. All mouse-button gestures (left, middle,
      // right) are handled by our interaction hook, which looks up the
      // matching binding from the keybindings store. This lets the user
      // rebind middle-drag, shift+drag, etc. freely.
      .filter((event) => {
        // Wheel zoom is handled by a small requestAnimationFrame smoother below.
        // d3-zoom remains the source for programmatic animated transforms.
        if (event.type === "wheel") return false;
        return false;
      })
      .on("zoom", (event) => {
        const t = event.transform;
        setViewport({ x: t.x, y: t.y, k: t.k });
      });

    sel.call(behavior);
    sel.on("dblclick.zoom", null); // disable d3's dblclick-to-zoom
    // Initialise d3-zoom's internal __zoom to match the store. Without this,
    // the first wheel event after a programmatic viewport change (zoomToFit,
    // resetView, etc.) would compute from a stale __zoom and jump.
    const vp = canvasStore.getState().viewport;
    sel.property("__zoom", zoomIdentity.translate(vp.x, vp.y).scale(vp.k));
    zoomBehaviorRef.current = behavior;

    return () => {
      sel.on(".zoom", null);
    };
  }, [canvasStore, setViewport]);

  // Whenever the viewport changes from OUTSIDE d3-zoom (e.g. zoomToFit /
  // resetView store actions, or undo/redo of a viewport change), we must
  // sync d3-zoom's internal __zoom to match — otherwise the next wheel event
  // jumps because d3-zoom computes from stale state.
  useEffect(() => {
    if (smoothZoomFrameRef.current === null) {
      smoothZoomTargetRef.current = viewport;
    }
    if (!surfaceRef.current || !zoomBehaviorRef.current) return;
    const el = surfaceRef.current;
    const current = select(el).property("__zoom") as
      | { x: number; y: number; k: number }
      | undefined;
    if (
      current &&
      Math.abs(current.x - viewport.x) < 0.01 &&
      Math.abs(current.y - viewport.y) < 0.01 &&
      Math.abs(current.k - viewport.k) < 0.0001
    ) {
      return; // already in sync
    }
    select(el).property("__zoom", zoomIdentity.translate(viewport.x, viewport.y).scale(viewport.k));
  }, [viewport]);

  // Smooth cursor-anchored wheel zoom. d3's default wheel handler is very direct
  // and can feel jumpy with high-resolution trackpads; this keeps Ctrl+V-style
  // canvas work predictable while making scroll in/out feel more inertial.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const stopAnimation = () => {
      if (smoothZoomFrameRef.current !== null) {
        window.cancelAnimationFrame(smoothZoomFrameRef.current);
        smoothZoomFrameRef.current = null;
      }
    };

    const animate = () => {
      const current = canvasStore.getState().viewport;
      const target = smoothZoomTargetRef.current;
      const alpha = 0.28;
      const next = {
        x: current.x + (target.x - current.x) * alpha,
        y: current.y + (target.y - current.y) * alpha,
        k: current.k + (target.k - current.k) * alpha,
      };
      const done =
        Math.abs(next.x - target.x) < 0.08 &&
        Math.abs(next.y - target.y) < 0.08 &&
        Math.abs(next.k - target.k) < 0.0004;
      if (done) {
        setViewport(target);
        smoothZoomFrameRef.current = null;
        return;
      }
      setViewport(next);
      smoothZoomFrameRef.current = window.requestAnimationFrame(animate);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const focus = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const base =
        smoothZoomFrameRef.current === null
          ? canvasStore.getState().viewport
          : smoothZoomTargetRef.current;
      const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? rect.height : 1;
      const delta = event.deltaY * unit;
      const factor = clamp(Math.exp(-delta * 0.00115), 0.72, 1.38);
      const k = clamp(base.k * factor, 0.05, 16);
      if (k === base.k) return;
      smoothZoomTargetRef.current = {
        x: focus.x - ((focus.x - base.x) * k) / base.k,
        y: focus.y - ((focus.y - base.y) * k) / base.k,
        k,
      };
      if (smoothZoomFrameRef.current === null) {
        smoothZoomFrameRef.current = window.requestAnimationFrame(animate);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      stopAnimation();
    };
  }, [canvasStore, setViewport]);

  // Apply viewport transform to the grid and item layer.
  useEffect(() => {
    const { x, y, k } = viewport;
    if (gridRef.current) {
      // The grid uses an inset of -2000px so we can just scale/translate it.
      // We translate by (x, y) and scale by k.
      gridRef.current.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    }
    if (relationLayerRef.current) {
      relationLayerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    }
    if (layerRef.current) {
      layerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    }
  }, [viewport]);

  // Expose zoom helpers via store-friendly imperative calls.
  // (We don't need to store them — the toolbar can use viewport directly.)
  useEffect(() => {
    const onZoomIn = () => {
      if (!surfaceRef.current || !zoomBehaviorRef.current) return;
      const el = surfaceRef.current;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      select(el).transition().duration(160).call(zoomBehaviorRef.current.scaleBy, 1.25, [cx, cy]);
    };
    const onZoomOut = () => {
      if (!surfaceRef.current || !zoomBehaviorRef.current) return;
      const el = surfaceRef.current;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      select(el).transition().duration(160).call(zoomBehaviorRef.current.scaleBy, 0.8, [cx, cy]);
    };
    const onZoomReset = () => {
      if (!surfaceRef.current || !zoomBehaviorRef.current) return;
      select(surfaceRef.current)
        .transition()
        .duration(160)
        .call(zoomBehaviorRef.current.transform, zoomIdentity);
    };
    const onZoomFit = () => {
      zoomToFit();
      if (!surfaceRef.current || !zoomBehaviorRef.current) return;
      const vp = canvasStore.getState().viewport;
      const t = zoomIdentity.translate(vp.x, vp.y).scale(vp.k);
      select(surfaceRef.current)
        .transition()
        .duration(220)
        .call(zoomBehaviorRef.current.transform, t);
    };
    window.addEventListener("cs:zoom-in", onZoomIn as EventListener);
    window.addEventListener("cs:zoom-out", onZoomOut as EventListener);
    window.addEventListener("cs:zoom-reset", onZoomReset as EventListener);
    window.addEventListener("cs:zoom-fit", onZoomFit as EventListener);
    return () => {
      window.removeEventListener("cs:zoom-in", onZoomIn as EventListener);
      window.removeEventListener("cs:zoom-out", onZoomOut as EventListener);
      window.removeEventListener("cs:zoom-reset", onZoomReset as EventListener);
      window.removeEventListener("cs:zoom-fit", onZoomFit as EventListener);
    };
  }, [canvasStore, zoomToFit]);

  // Keep resetView synced with d3-zoom state.
  useEffect(() => {
    resetView; // noop-ref to satisfy deps
  }, [resetView]);

  // Init interaction (mouse down on surface, marquee, item drag etc.).
  const { onPointerDownSurface, onPointerMoveSurface, onPointerUpSurface, onDropSurface } =
    useCanvasInteraction({ surfaceRef, onContextMenu });

  // Init shortcuts + global paste.
  useShortcuts();
  useGlobalPaste();

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.zIndex - b.zIndex), [items]);

  const surfaceDragAttr =
    dragMode === "pan" ? "pan" : dragMode === "marquee" ? "marquee" : undefined;

  return (
    <div
      ref={surfaceRef}
      className="cs-canvas-surface"
      data-drag={surfaceDragAttr}
      role="application"
      aria-roledescription="infinite canvas"
      aria-label="Canvas studio - infinite canvas for arranging images and text"
      onPointerDown={onPointerDownSurface}
      onPointerMove={onPointerMoveSurface}
      onPointerUp={onPointerUpSurface}
      // Prevent the browser's middle-click auto-scroll cursor.
      onMouseDown={(e) => {
        if (e.button === 1) e.preventDefault();
      }}
      onDrop={onDropSurface}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        // Determine if an item was clicked.
        const el = e.target as Element;
        const itemEl = el.closest("[data-item-id]");
        onContextMenu(screen, itemEl ? itemEl.getAttribute("data-item-id") : null);
      }}
    >
      <div ref={gridRef} className="cs-canvas-grid" />
      <div ref={relationLayerRef} className="cs-canvas-relation-layer">
        <RelationOverlay items={items} relations={relations} />
      </div>
      <div ref={layerRef} className="cs-canvas-layer">
        {sortedItems.map((it) => (
          <CanvasItemView key={it.id} item={it} />
        ))}
      </div>

      <MarqueeOverlay />

      {/* Origin crosshair */}
      <OriginMarker viewport={viewport} />
    </div>
  );
}

function OriginMarker({ viewport }: { viewport: { x: number; y: number; k: number } }) {
  // Renders a small crosshair at canvas (0, 0) so users see where they are.
  const screenX = viewport.x;
  const screenY = viewport.y;
  if (
    screenX < -20 ||
    screenX > window.innerWidth + 20 ||
    screenY < -20 ||
    screenY > window.innerHeight + 20
  ) {
    return null;
  }
  return (
    <svg
      style={{
        position: "absolute",
        left: screenX - 12,
        top: screenY - 12,
        width: 24,
        height: 24,
        pointerEvents: "none",
        opacity: 0.45,
      }}
    >
      <line x1="12" y1="0" x2="12" y2="24" stroke="#4dabf7" strokeWidth="1" />
      <line x1="0" y1="12" x2="24" y2="12" stroke="#4dabf7" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill="#4dabf7" />
    </svg>
  );
}
