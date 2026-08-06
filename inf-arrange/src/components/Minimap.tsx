import { boundsOfItems } from "@/lib/clipboard";
import { clamp, screenToCanvas } from "@/lib/geometry";
import { useCanvasStore } from "@/store/canvas";
import type { CanvasItem, Point, Rect, Viewport } from "@/types";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MINI_W = 220;
const MINI_H = 150;
const PAD = 10;

function surfaceSize(): { w: number; h: number } {
  const surface = document.querySelector(".cs-canvas-surface") as HTMLElement | null;
  const rect = surface?.getBoundingClientRect();
  return { w: rect?.width ?? window.innerWidth, h: rect?.height ?? window.innerHeight };
}

function visibleCanvasRect(viewport: Viewport): Rect {
  const { w, h } = surfaceSize();
  const topLeft = screenToCanvas({ x: 0, y: 0 }, viewport);
  const bottomRight = screenToCanvas({ x: w, y: h }, viewport);
  return {
    x: topLeft.x,
    y: topLeft.y,
    w: bottomRight.x - topLeft.x,
    h: bottomRight.y - topLeft.y,
  };
}

function unionRects(a: Rect, b: Rect): Rect {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.w, b.x + b.w);
  const maxY = Math.max(a.y + a.h, b.y + b.h);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function paddedBounds(items: CanvasItem[], viewport: Viewport): Rect {
  const itemBounds =
    items.length > 0 ? boundsOfItems(items) : { x: -500, y: -350, w: 1000, h: 700 };
  const visible = visibleCanvasRect(viewport);
  const merged = unionRects(itemBounds, visible);
  const pad = Math.max(180, Math.max(merged.w, merged.h) * 0.08);
  return {
    x: merged.x - pad,
    y: merged.y - pad,
    w: Math.max(1, merged.w + pad * 2),
    h: Math.max(1, merged.h + pad * 2),
  };
}

function miniProject(bounds: Rect) {
  const scale = Math.min((MINI_W - PAD * 2) / bounds.w, (MINI_H - PAD * 2) / bounds.h);
  const ox = PAD + (MINI_W - PAD * 2 - bounds.w * scale) / 2;
  const oy = PAD + (MINI_H - PAD * 2 - bounds.h * scale) / 2;
  const toMini = (p: Point): Point => ({
    x: ox + (p.x - bounds.x) * scale,
    y: oy + (p.y - bounds.y) * scale,
  });
  const toCanvas = (p: Point): Point => ({
    x: bounds.x + (p.x - ox) / scale,
    y: bounds.y + (p.y - oy) / scale,
  });
  const rectToMini = (r: Rect): Rect => {
    const p = toMini({ x: r.x, y: r.y });
    return { x: p.x, y: p.y, w: r.w * scale, h: r.h * scale };
  };
  return { scale, toCanvas, rectToMini };
}

export function Minimap() {
  const items = useCanvasStore((s) => s.items);
  const selection = useCanvasStore((s) => s.selection);
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const zoomToFit = useCanvasStore((s) => s.zoomToFit);
  const [collapsed, setCollapsed] = useState(false);
  const [, bump] = useState(0);
  const dragging = useRef(false);

  useEffect(() => {
    const onResize = () => bump((v) => v + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const model = useMemo(() => {
    const bounds = paddedBounds(items, viewport);
    const projection = miniProject(bounds);
    const visible = projection.rectToMini(visibleCanvasRect(viewport));
    const itemRects = items.map((item) => ({
      id: item.id,
      type: item.type,
      selected: selection.includes(item.id),
      rect: projection.rectToMini({ x: item.x, y: item.y, w: item.width, h: item.height }),
    }));
    return { bounds, projection, visible, itemRects };
  }, [items, selection, viewport]);

  const recenterFromPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const miniPoint = {
        x: clamp(event.clientX - rect.left, 0, MINI_W),
        y: clamp(event.clientY - rect.top, 0, MINI_H),
      };
      const canvasPoint = model.projection.toCanvas(miniPoint);
      const { w, h } = surfaceSize();
      setViewport({
        x: w / 2 - canvasPoint.x * viewport.k,
        y: h / 2 - canvasPoint.y * viewport.k,
        k: viewport.k,
      });
    },
    [model.projection, setViewport, viewport.k],
  );

  return (
    <div className="cs-minimap" data-collapsed={collapsed ? "true" : "false"}>
      <div className="cs-minimap__header">
        <span>Map</span>
        <span className="cs-minimap__meta">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
        <Tooltip label="Zoom to fit">
          <ActionIcon size="xs" variant="subtle" onClick={zoomToFit}>
            ⤢
          </ActionIcon>
        </Tooltip>
        <Tooltip label={collapsed ? "Show minimap" : "Collapse minimap"}>
          <ActionIcon size="xs" variant="subtle" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? "+" : "−"}
          </ActionIcon>
        </Tooltip>
      </div>
      {!collapsed && (
        <svg
          className="cs-minimap__svg"
          width={MINI_W}
          height={MINI_H}
          viewBox={`0 0 ${MINI_W} ${MINI_H}`}
          role="img"
          aria-label="Canvas minimap overview"
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            recenterFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (dragging.current) recenterFromPointer(event);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          <rect x={0} y={0} width={MINI_W} height={MINI_H} rx={8} className="cs-minimap__bg" />
          {model.itemRects.map(({ id, rect, selected, type }) => (
            <rect
              key={id}
              x={rect.x}
              y={rect.y}
              width={Math.max(2, rect.w)}
              height={Math.max(2, rect.h)}
              rx={type === "text" ? 2 : 1}
              className="cs-minimap__item"
              data-selected={selected ? "true" : "false"}
            />
          ))}
          <rect
            x={model.visible.x}
            y={model.visible.y}
            width={Math.max(4, model.visible.w)}
            height={Math.max(4, model.visible.h)}
            rx={3}
            className="cs-minimap__viewport"
          />
        </svg>
      )}
    </div>
  );
}
