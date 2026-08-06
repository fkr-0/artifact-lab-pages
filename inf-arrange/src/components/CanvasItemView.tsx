import { imageEffectToCss } from "@/lib/imageEffects";
import {
  renderMarkdownToHtml,
  renderPlainTextRoleToHtml,
  sanitizeRichTextHtml,
} from "@/lib/textRender";
import { useCanvasStore } from "@/store/canvas";
import type {
  AudioItem,
  CanvasItem,
  ImageItem,
  LinkItem,
  ResizeHandle,
  TextItem,
  UnknownItem,
} from "@/types";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  item: CanvasItem;
}

const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function handleOffset(h: ResizeHandle): { left?: string; top?: string } {
  switch (h) {
    case "nw":
      return { left: "0%", top: "0%" };
    case "n":
      return { left: "50%", top: "0%" };
    case "ne":
      return { left: "100%", top: "0%" };
    case "e":
      return { left: "100%", top: "50%" };
    case "se":
      return { left: "100%", top: "100%" };
    case "s":
      return { left: "50%", top: "100%" };
    case "sw":
      return { left: "0%", top: "100%" };
    case "w":
      return { left: "0%", top: "50%" };
  }
}

export const CanvasItemView = memo(function CanvasItemView({ item }: Props) {
  const selected = useCanvasStore((s) => s.selection.includes(item.id));
  const hoverId = useCanvasStore((s) => s.hoverId);
  const setHoverId = useCanvasStore((s) => s.setHoverId);
  const setActiveHandle = useCanvasStore((s) => s.setActiveHandle);
  const handleSizeK = useCanvasStore((s) => s.viewport.k);
  const hovered = hoverId === item.id;

  const handleSizeScreen = 9; // CSS pixels we want on screen
  // Inside the canvas-layer (which is scaled by k), we need width = 9/k
  // so the rendered on-screen size is 9px regardless of zoom.
  const handleSizeCanvas = handleSizeScreen / handleSizeK;

  const onPointerMoveHandleDetect = useCallback((e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const hit = handleSizeScreen + 4;
    const nearLeft = localX <= hit;
    const nearRight = localX >= rect.width - hit;
    const nearTop = localY <= hit;
    const nearBottom = localY >= rect.height - hit;
    let cursor = "move";
    if (nearTop && nearLeft) cursor = "nwse-resize";
    else if (nearTop && nearRight) cursor = "nesw-resize";
    else if (nearBottom && nearLeft) cursor = "nesw-resize";
    else if (nearBottom && nearRight) cursor = "nwse-resize";
    else if (nearTop || nearBottom) cursor = "ns-resize";
    else if (nearLeft || nearRight) cursor = "ew-resize";
    (e.currentTarget as HTMLElement).style.cursor = cursor;
  }, []);

  return (
    <div
      className="cs-item"
      data-item-id={item.id}
      data-item-type={item.type}
      data-selected={selected ? "true" : "false"}
      data-hover={hovered ? "true" : "false"}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: item.rotation ? `rotate(${item.rotation}rad)` : undefined,
        zIndex: item.zIndex,
      }}
      onPointerEnter={() => setHoverId(item.id)}
      onPointerLeave={() => setHoverId(null)}
      onPointerMove={onPointerMoveHandleDetect}
    >
      <CanvasItemBody item={item} />

      {selected &&
        HANDLES.map((h) => {
          const off = handleOffset(h);
          return (
            <div
              key={h}
              className="cs-handle"
              data-h={h}
              data-handle={h}
              data-item-id={item.id}
              style={{
                left: off.left,
                top: off.top,
                width: handleSizeCanvas,
                height: handleSizeCanvas,
              }}
              onPointerDown={() => {
                // Let the pointerdown bubble to the surface so the interaction
                // hook can start a resize drag. Just mark the active handle.
                setActiveHandle(h);
              }}
            />
          );
        })}
    </div>
  );
});

function CanvasItemBody({ item }: { item: CanvasItem }) {
  if (item.type === "image") return <ImageBody item={item} />;
  if (item.type === "text") return <TextBody item={item} />;
  if (item.type === "link") return <LinkBody item={item} />;
  if (item.type === "web") return <WebBody item={item} />;
  if (item.type === "audio") return <AudioBody item={item} />;
  return <UnknownBody item={item} />;
}

function LinkBody({ item }: { item: LinkItem }) {
  const updateItem = useCanvasStore((s) => s.updateItem);
  const iframeMode = item.viewMode === "iframe";
  return (
    <div className="cs-link" onPointerDown={(e) => iframeMode && e.stopPropagation()}>
      <div className="cs-link__bar">
        <span>{item.preview?.siteName ?? "Link"}</span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            updateItem(item.id, { viewMode: iframeMode ? "card" : "iframe" } as Partial<LinkItem>);
          }}
        >
          {iframeMode ? "card" : "iframe"}
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
        >
          open
        </a>
      </div>
      {iframeMode ? (
        <iframe
          className="cs-link__iframe"
          title={item.title ?? item.url}
          src={item.url}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      ) : (
        <a
          className="cs-link__card"
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.preventDefault()}
        >
          {item.preview?.image && <img src={item.preview.image} alt="" />}
          <strong>{item.title ?? item.label ?? item.url}</strong>
          {item.description && <p>{item.description}</p>}
          <small>{item.url}</small>
        </a>
      )}
    </div>
  );
}

function WebBody({ item }: { item: Extract<CanvasItem, { type: "web" }> }) {
  return (
    <div className="cs-link">
      <div className="cs-link__bar">
        <span>{item.title ?? "Web"}</span>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
        >
          open
        </a>
      </div>
      {item.previewMode === "iframe" && item.embedAllowed ? (
        <iframe
          className="cs-link__iframe"
          title={item.title ?? item.url}
          src={item.url}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      ) : (
        <a className="cs-link__card" href={item.url} target="_blank" rel="noreferrer">
          <strong>{item.title ?? item.label ?? item.url}</strong>
          {item.description && <p>{item.description}</p>}
          <small>{item.url}</small>
        </a>
      )}
    </div>
  );
}

function formatDuration(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms)) return "--:--";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function AudioBody({ item }: { item: AudioItem }) {
  return (
    <div className="cs-audio" onPointerDown={(e) => e.stopPropagation()}>
      <div className="cs-audio__cover">
        {item.coverRef ? <img src={item.coverRef} alt="" /> : "♪"}
      </div>
      <div className="cs-audio__body">
        <strong>{item.title ?? item.label ?? "Audio"}</strong>
        <span>{[item.artist, item.album].filter(Boolean).join(" · ") || item.sourceRef}</span>
        <small>
          {formatDuration(item.durationMs)} · {item.playbackMode ?? "manual"}
        </small>
        {item.src && <audio controls src={item.src} preload="metadata" />}
      </div>
    </div>
  );
}

function UnknownBody({ item }: { item: UnknownItem }) {
  return (
    <div
      className="cs-unknown"
      title={`Unsupported canvas item type: ${item.originalType}`}
      style={{
        width: "100%",
        height: "100%",
        padding: 10,
        border: "1px dashed rgba(80, 80, 80, 0.45)",
        borderRadius: 8,
        background: "rgba(250, 250, 250, 0.92)",
        color: "#343a40",
        fontSize: 12,
        overflow: "hidden",
      }}
    >
      <strong>{item.label ?? item.originalType}</strong>
      <div style={{ marginTop: 4, opacity: 0.72 }}>Unsupported item preserved losslessly.</div>
      <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", fontSize: 10 }}>
        {JSON.stringify(item.data, null, 2)}
      </pre>
    </div>
  );
}

function ImageBody({ item }: { item: ImageItem }) {
  // Render the image. If crop is set, use background-position to show only the cropped region.
  const objectPosition = "0% 0%";
  const objectFit: React.CSSProperties["objectFit"] = "fill";
  const background = "#000";
  const filter = imageEffectToCss(item.effects);
  const imgStyle: React.CSSProperties = { width: "100%", height: "100%", filter };

  if (item.crop) {
    const sx = item.crop.x / item.naturalWidth;
    const sy = item.crop.y / item.naturalHeight;
    const sw = item.crop.w / item.naturalWidth;
    const sh = item.crop.h / item.naturalHeight;
    // Show only the cropped sub-rectangle of the image, stretched to the item's
    // current width/height. We use background-image + background-position/size
    // because <img> with object-position can't zoom into a sub-rect.
    const bgW = 100 / sw;
    const bgH = 100 / sh;
    const posX = -(sx * bgW);
    const posY = -(sy * bgH);
    return (
      <div
        className="cs-image"
        style={{
          backgroundImage: `url(${item.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${bgW}% ${bgH}%`,
          backgroundPosition: `${posX}% ${posY}%`,
          background,
          filter,
        }}
      />
    );
  }

  return (
    <img
      className="cs-image"
      src={item.src}
      alt={item.label ?? "canvas image"}
      draggable={false}
      style={{ ...imgStyle, objectFit, objectPosition }}
    />
  );
}

function textToRenderedHtml(item: TextItem): string {
  const kind = item.textKind ?? "plaintext";
  if (kind === "markdown") return renderMarkdownToHtml(item.text);
  if (kind === "richtext") return sanitizeRichTextHtml(item.richTextHtml || item.text);
  if (kind === "log") {
    const entries = item.logEntries ?? [];
    return entries
      .map(
        (entry) =>
          `<section><time>${entry.ts}</time><pre>${entry.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></section>`,
      )
      .join("\n");
  }
  return renderPlainTextRoleToHtml(item.text, item.textRole ?? "paragraph");
}

function TextBody({ item }: { item: TextItem }) {
  const updateItem = useCanvasStore((s) => s.updateItem);
  const editingId = useCanvasStore((s) => s.editingId);
  const setEditingId = useCanvasStore((s) => s.setEditingId);
  const editing = editingId === item.id;
  const ref = useRef<HTMLTextAreaElement>(null);
  const kind = item.textKind ?? "plaintext";
  const rendered = item.viewMode === "rendered";
  const html = useMemo(() => textToRenderedHtml(item), [item]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <div
        className="cs-text cs-text--editing"
        style={{ fontSize: item.fontSize, color: item.color, background: item.background }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="cs-text__toolbar">
          <span>{kind}</span>
          <button
            type="button"
            onClick={() =>
              updateItem(item.id, {
                viewMode: rendered ? "source" : "rendered",
              } as Partial<TextItem>)
            }
          >
            {rendered ? "source" : "render"}
          </button>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("cs:text-editor", { detail: { itemId: item.id } }),
              )
            }
          >
            editor
          </button>
          <button type="button" onClick={() => setEditingId(null)}>
            done
          </button>
        </div>
        {kind === "log" ? (
          <LogEditor item={item} />
        ) : (
          <textarea
            ref={ref}
            value={kind === "richtext" ? (item.richTextHtml ?? item.text) : item.text}
            onChange={(e) => {
              const value = e.currentTarget.value;
              updateItem(
                item.id,
                kind === "richtext"
                  ? ({
                      richTextHtml: value,
                      text: value.replace(/<[^>]*>/g, " "),
                    } as Partial<TextItem>)
                  : { text: value },
              );
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`cs-text cs-text--${kind}`}
      style={{
        fontSize: item.fontSize,
        color: item.color,
        background: item.background,
        textAlign: item.align,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditingId(item.id);
      }}
    >
      <div className="cs-text__toolbar" onPointerDown={(e) => e.stopPropagation()}>
        <span>
          {kind}
          {kind === "plaintext" && item.textRole ? `:${item.textRole}` : ""}
        </span>
        {(kind === "markdown" || kind === "richtext" || kind === "log") && (
          <button
            type="button"
            onClick={() =>
              updateItem(item.id, {
                viewMode: rendered ? "source" : "rendered",
              } as Partial<TextItem>)
            }
          >
            {rendered ? "source" : "render"}
          </button>
        )}
      </div>
      {rendered || kind === "plaintext" || kind === "richtext" || kind === "log" ? (
        <div className="cs-text__rendered" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="cs-text__source">{item.text}</pre>
      )}
    </div>
  );
}

function LogEditor({ item }: { item: TextItem }) {
  const updateItem = useCanvasStore((s) => s.updateItem);
  const [draft, setDraft] = useState("");
  const entries = item.logEntries ?? [];
  return (
    <div className="cs-log-editor">
      <div className="cs-log-editor__entries">
        {entries.map((entry) => (
          <section key={entry.id}>
            <time>{entry.ts}</time>
            <pre>{entry.text}</pre>
          </section>
        ))}
      </div>
      <textarea
        value={draft}
        placeholder="Append log entry…"
        onChange={(e) => setDraft(e.currentTarget.value)}
      />
      <button
        type="button"
        disabled={!draft.trim()}
        onClick={() => {
          const nextEntries = [
            ...entries,
            { id: crypto.randomUUID(), ts: new Date().toISOString(), text: draft },
          ];
          updateItem(item.id, {
            logEntries: nextEntries,
            text: nextEntries.map((entry) => `[${entry.ts}]\n${entry.text}`).join("\n\n"),
          } as Partial<TextItem>);
          setDraft("");
        }}
      >
        append
      </button>
    </div>
  );
}
