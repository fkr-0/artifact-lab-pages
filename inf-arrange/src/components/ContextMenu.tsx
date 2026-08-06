import {
  type ImageEffectId,
  applyImageEffect,
  bakeCrop,
  cutImage,
  sliceImage,
} from "@/lib/imageOps";
import { createImageItem, useCanvasStore } from "@/store/canvas";
import type { CutOptions, ImageItem, Point, SliceOptions } from "@/types";
import { Select as MSelect, NumberInput, Slider, Text } from "@mantine/core";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";

interface Props {
  pos: Point | null;
  itemId: string | null;
  onClose: () => void;
}

export function ContextMenu({ pos, itemId, onClose }: Props) {
  const items = useCanvasStore((s) => s.items);
  const selection = useCanvasStore((s) => s.selection);
  const removeItems = useCanvasStore((s) => s.removeItems);
  const duplicateSelection = useCanvasStore((s) => s.duplicateSelection);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const addItems = useCanvasStore((s) => s.addItems);
  const replaceItem = useCanvasStore((s) => s.replaceItem);
  const updateItem = useCanvasStore((s) => s.updateItem);
  const pushHistory = useCanvasStore((s) => s._pushHistory);

  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<"slice" | "cut" | null>(null);
  const [sliceOpts, setSliceOpts] = useState<SliceOptions>({ rows: 2, cols: 2, gutter: 0 });
  const [cutOpts, setCutOpts] = useState<CutOptions>({ orientation: "vertical", at: 0.5 });

  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [pos, onClose]);

  if (!pos) return null;

  const item = itemId ? items.find((it) => it.id === itemId) : null;
  const isImage = item?.type === "image";
  const hasSelection = selection.length > 0;
  const selCount = selection.length;

  // Clamp menu position to viewport.
  const x = Math.min(pos.x, window.innerWidth - 230);
  const y = Math.min(pos.y, window.innerHeight - 360);

  const doSlice = async () => {
    if (!item || item.type !== "image") return;
    const result = await sliceImage(item as ImageItem, sliceOpts, item.x, item.y);
    const newItems = result.map((r) =>
      createImageItem({
        src: r.src,
        naturalWidth: r.naturalWidth,
        naturalHeight: r.naturalHeight,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        label: `${item.label ?? "slice"}`,
      }),
    );
    pushHistory();
    removeItems([item.id]);
    addItems(newItems);
    onClose();
  };

  const doCut = async () => {
    if (!item || item.type !== "image") return;
    const halves = await cutImage(item as ImageItem, cutOpts);
    pushHistory();
    // Replace original with first half, append second half beside it.
    const first = halves[0];
    const second = halves[1];
    const newFirst: ImageItem = {
      ...(item as ImageItem),
      src: first.src,
      naturalWidth: first.naturalWidth,
      naturalHeight: first.naturalHeight,
      width: first.width,
      height: first.height,
      crop: undefined,
    };
    replaceItem(item.id, newFirst);
    if (second) {
      const newSecond: ImageItem = {
        ...(item as ImageItem),
        id: nanoid(),
        src: second.src,
        naturalWidth: second.naturalWidth,
        naturalHeight: second.naturalHeight,
        width: second.width,
        height: second.height,
        x: cutOpts.orientation === "vertical" ? item.x + first.width + 8 : item.x,
        y: cutOpts.orientation === "horizontal" ? item.y + first.height + 8 : item.y,
        crop: undefined,
      };
      addItems([newSecond]);
    }
    onClose();
  };

  const doBakeCrop = async () => {
    if (!item || item.type !== "image") return;
    const out = await bakeCrop(item as ImageItem);
    pushHistory();
    updateItem(item.id, {
      src: out.src,
      naturalWidth: out.naturalWidth,
      naturalHeight: out.naturalHeight,
      crop: undefined,
    } as Partial<ImageItem>);
    onClose();
  };

  const doImageEffect = async (effect: ImageEffectId) => {
    if (!item || item.type !== "image") return;
    const out = await applyImageEffect(item as ImageItem, effect);
    pushHistory();
    updateItem(item.id, {
      src: out.src,
      naturalWidth: out.naturalWidth,
      naturalHeight: out.naturalHeight,
      crop: undefined,
      label: `${item.label ?? "image"} · ${effect}`,
    } as Partial<ImageItem>);
    onClose();
  };

  const requestExternalImageEditor = () => {
    if (!item || item.type !== "image") return;
    window.dispatchEvent(new CustomEvent("cs:image-editor", { detail: { itemId: item.id } }));
    onClose();
  };

  return (
    <div
      ref={ref}
      className="cs-context-menu"
      style={{ left: x, top: y }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="cs-context-menu__label">
        {hasSelection ? `${selCount} selected` : item ? "Item" : "Canvas"}
      </div>

      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          duplicateSelection();
          onClose();
        }}
        aria-disabled={!hasSelection}
      >
        <span style={{ flex: 1 }}>Duplicate</span>
        <kbd style={{ fontSize: 10, color: "#8b8f9a" }}>⌘D</kbd>
      </div>

      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          removeItems(selection.length ? selection : itemId ? [itemId] : []);
          onClose();
        }}
        data-danger="true"
        aria-disabled={!hasSelection && !itemId}
      >
        <span style={{ flex: 1 }}>Delete</span>
        <kbd style={{ fontSize: 10 }}>Del</kbd>
      </div>

      <div className="cs-context-menu__sep" />

      {isImage && (
        <>
          <div className="cs-context-menu__label">Image</div>
          <div
            className="cs-context-menu__item"
            role="menuitem"
            tabIndex={-1}
            aria-haspopup="true"
            aria-expanded={submenu === "slice"}
            onClick={() => setSubmenu(submenu === "slice" ? null : "slice")}
          >
            <span style={{ flex: 1 }}>Slice into grid…</span>
          </div>
          {submenu === "slice" && (
            <div style={{ padding: "4px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              <Text size="xs" c="dimmed">
                Rows × Cols
              </Text>
              <div style={{ display: "flex", gap: 6 }}>
                <NumberInput
                  size="xs"
                  value={sliceOpts.rows}
                  min={1}
                  max={20}
                  onChange={(v) => setSliceOpts((s) => ({ ...s, rows: Number(v) || 1 }))}
                  style={{ width: 70 }}
                />
                <NumberInput
                  size="xs"
                  value={sliceOpts.cols}
                  min={1}
                  max={20}
                  onChange={(v) => setSliceOpts((s) => ({ ...s, cols: Number(v) || 1 }))}
                  style={{ width: 70 }}
                />
              </div>
              <Text size="xs" c="dimmed">
                Gutter (px)
              </Text>
              <Slider
                size="xs"
                value={sliceOpts.gutter}
                min={0}
                max={32}
                onChange={(v) => setSliceOpts((s) => ({ ...s, gutter: v }))}
              />
              <div
                className="cs-context-menu__item"
                onClick={doSlice}
                style={{ marginTop: 4, background: "rgba(77,171,247,0.16)" }}
              >
                Slice →
              </div>
            </div>
          )}

          <div
            className="cs-context-menu__item"
            role="menuitem"
            tabIndex={-1}
            aria-haspopup="true"
            aria-expanded={submenu === "cut"}
            onClick={() => setSubmenu(submenu === "cut" ? null : "cut")}
          >
            <span style={{ flex: 1 }}>Cut in two…</span>
          </div>
          {submenu === "cut" && (
            <div style={{ padding: "4px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              <MSelect
                size="xs"
                value={cutOpts.orientation}
                onChange={(v) =>
                  setCutOpts((s) => ({ ...s, orientation: v as "horizontal" | "vertical" }))
                }
                data={[
                  { value: "vertical", label: "Vertical (left | right)" },
                  { value: "horizontal", label: "Horizontal (top / bottom)" },
                ]}
              />
              <Text size="xs" c="dimmed">
                Position: {Math.round(cutOpts.at * 100)}%
              </Text>
              <Slider
                size="xs"
                value={cutOpts.at * 100}
                min={1}
                max={99}
                onChange={(v) => setCutOpts((s) => ({ ...s, at: v / 100 }))}
              />
              <div
                className="cs-context-menu__item"
                onClick={doCut}
                style={{ marginTop: 4, background: "rgba(77,171,247,0.16)" }}
              >
                Cut →
              </div>
            </div>
          )}

          <div className="cs-context-menu__label">Effects</div>
          {(
            [
              "grayscale",
              "sepia",
              "old-movie",
              "high-contrast",
              "cartoon",
              "cubist",
            ] as ImageEffectId[]
          ).map((effect) => (
            <div
              key={effect}
              className="cs-context-menu__item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => doImageEffect(effect)}
            >
              <span style={{ flex: 1 }}>{effect}</span>
            </div>
          ))}
          <div
            className="cs-context-menu__item"
            role="menuitem"
            tabIndex={-1}
            onClick={requestExternalImageEditor}
          >
            <span style={{ flex: 1 }}>External editor…</span>
          </div>

          {(item as ImageItem).crop && (
            <div
              className="cs-context-menu__item"
              role="menuitem"
              tabIndex={-1}
              onClick={doBakeCrop}
            >
              <span style={{ flex: 1 }}>Bake crop (commit)</span>
            </div>
          )}
          <div className="cs-context-menu__sep" />
        </>
      )}

      <div className="cs-context-menu__label">Arrange</div>
      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          if (itemId) bringToFront(itemId);
          onClose();
        }}
        aria-disabled={!itemId}
      >
        <span style={{ flex: 1 }}>Bring to front</span>
        <kbd style={{ fontSize: 10 }}>]</kbd>
      </div>
      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          if (itemId) bringForward(itemId);
          onClose();
        }}
        aria-disabled={!itemId}
      >
        <span style={{ flex: 1 }}>Bring forward</span>
      </div>
      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          if (itemId) sendBackward(itemId);
          onClose();
        }}
        aria-disabled={!itemId}
      >
        <span style={{ flex: 1 }}>Send backward</span>
      </div>
      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          if (itemId) sendToBack(itemId);
          onClose();
        }}
        aria-disabled={!itemId}
      >
        <span style={{ flex: 1 }}>Send to back</span>
        <kbd style={{ fontSize: 10 }}>[</kbd>
      </div>

      <div className="cs-context-menu__sep" />
      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          window.dispatchEvent(new Event("cs:zoom-fit"));
          onClose();
        }}
      >
        <span style={{ flex: 1 }}>Zoom to fit</span>
        <kbd style={{ fontSize: 10 }}>F</kbd>
      </div>
      <div
        className="cs-context-menu__item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          window.dispatchEvent(new Event("cs:zoom-reset"));
          onClose();
        }}
      >
        <span style={{ flex: 1 }}>Reset view</span>
        <kbd style={{ fontSize: 10 }}>⌘0</kbd>
      </div>
    </div>
  );
}
