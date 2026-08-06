import { readCanvasPayloadFromTransfer, summarizeCanvasPayload } from "@/lib/clipboard";
import { clamp, screenToCanvas } from "@/lib/geometry";
import {
  fileToDataURL,
  loadImage,
  normaliseImageInput,
  readImageFromClipboard,
} from "@/lib/imageOps";
import {
  type CanvasStore,
  createAudioItem,
  createImageItem,
  createLinkItem,
  createTextItem,
  useCanvasStoreApi,
} from "@/store/canvas";
import type { CanvasItem, Point } from "@/types";
import { useEffect, useRef } from "react";

/**
 * Describes what was on the clipboard for the inspector panel. Stored in a
 * separate pub/sub helper so the UI can render it without re-rendering on
 * every canvas state change.
 */
export interface ClipboardInspection {
  /** When the inspection was captured (epoch ms). */
  ts: number;
  /** Best-effort textual summary of what was on the clipboard. */
  summary: string;
  /** Up to a few preview thumbnails (data URLs) for images. */
  imagePreviews: string[];
  /** The text content, if any (truncated). */
  textSnippet: string;
  /** Raw list of MIME types found on the clipboard. */
  types: string[];
  /** Whether the paste actually inserted something into the canvas. */
  insertedCount?: number;
  /** Diagnostic note for permissions / fallbacks. */
  note?: string;
}

let lastInspection: ClipboardInspection | null = null;
const listeners = new Set<(v: ClipboardInspection | null) => void>();

export function getClipboardInspection(): ClipboardInspection | null {
  return lastInspection;
}

export function subscribeClipboardInspection(
  cb: (v: ClipboardInspection | null) => void,
): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function setInspection(v: ClipboardInspection | null) {
  lastInspection = v;
  for (const l of listeners) l(v);
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  );
}

function clipboardTypes(cd: DataTransfer): string[] {
  const types: string[] = [];
  for (let i = 0; i < cd.types.length; i++) types.push(cd.types[i]);
  return types;
}

function clipboardFiles(cd: DataTransfer): Array<{ blob: Blob; kind: string; name?: string }> {
  const fileBlobs: Array<{ blob: Blob; kind: string; name?: string }> = [];
  for (let i = 0; i < cd.items.length; i++) {
    const it = cd.items[i];
    if (it.kind === "file") {
      const f = it.getAsFile();
      if (f) fileBlobs.push({ blob: f, kind: it.type, name: f.name });
    }
  }
  // Some browsers also expose .files (older path).
  if (cd.files && cd.files.length > 0) {
    for (let i = 0; i < cd.files.length; i++) {
      const f = cd.files[i];
      if (!fileBlobs.some((b) => b.blob === f)) {
        fileBlobs.push({ blob: f, kind: f.type, name: f.name });
      }
    }
  }
  return fileBlobs;
}

function pasteTarget(
  canvasStore: CanvasStore,
  lastPointer: React.MutableRefObject<{ x: number; y: number; ts: number }>,
): Point {
  const surface = document.querySelector(".cs-canvas-surface") as HTMLElement | null;
  const rect = surface?.getBoundingClientRect();
  const recentPointer = Date.now() - lastPointer.current.ts < 8000;
  const screen = rect
    ? {
        x: recentPointer ? clamp(lastPointer.current.x - rect.left, 0, rect.width) : rect.width / 2,
        y: recentPointer
          ? clamp(lastPointer.current.y - rect.top, 0, rect.height)
          : rect.height / 2,
      }
    : {
        x: recentPointer ? lastPointer.current.x : window.innerWidth / 2,
        y: recentPointer ? lastPointer.current.y : window.innerHeight / 2,
      };
  return screenToCanvas(screen, canvasStore.getState().viewport);
}

async function pasteImageSources(
  canvasStore: CanvasStore,
  sources: Array<{ src: string; label: string }>,
  target: Point,
): Promise<{ count: number; previews: string[] }> {
  const previews: string[] = [];
  let offset = 0;
  let count = 0;
  const items = [];
  for (const { src, label } of sources) {
    try {
      const { naturalWidth, naturalHeight } = await loadImage(src);
      previews.push(src);
      items.push(
        createImageItem({
          src,
          naturalWidth,
          naturalHeight,
          x: target.x + offset,
          y: target.y + offset,
          label,
        }),
      );
      offset += 24;
      count += 1;
    } catch (err) {
      console.error("[paste] image decode failed", err);
    }
  }
  if (items.length > 0) canvasStore.getState().addItems(items);
  return { count, previews };
}

export function useGlobalPaste() {
  const canvasStore = useCanvasStoreApi();
  const lastPointer = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, ts: 0 });

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY, ts: Date.now() };
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const cd = e.clipboardData;
      if (!cd) {
        setInspection({
          ts: Date.now(),
          summary: "No clipboardData available",
          imagePreviews: [],
          textSnippet: "",
          types: [],
          note: "Browser did not expose clipboardData on the paste event.",
        });
        return;
      }

      const types = clipboardTypes(cd);
      const target = pasteTarget(canvasStore, lastPointer);

      // ---- Canvas Studio payload handling ----
      // This makes copy/cut robust across windows or page reloads when the
      // browser allows structured or text fallback clipboard writes.
      const payload = readCanvasPayloadFromTransfer(cd);
      if (payload) {
        e.preventDefault();
        const store = canvasStore.getState();
        const count = store.pasteItems(payload.items, target, "Pasted Canvas Studio clipboard");
        const latestHistory = canvasStore.getState().clipboardHistory[0];
        if (!latestHistory || latestHistory.ts !== payload.ts) {
          canvasStore
            .getState()
            .addClipboardHistoryEntry(
              payload.items,
              "external",
              "Imported Canvas Studio clipboard",
            );
        }
        setInspection({
          ts: Date.now(),
          summary: summarizeCanvasPayload(payload),
          imagePreviews: payload.items
            .filter((item) => item.type === "image")
            .slice(0, 4)
            .map((item) => item.src),
          textSnippet: payload.items
            .filter((item) => item.type === "text")
            .map((item) => item.text)
            .join("\n---\n")
            .slice(0, 600),
          types,
          insertedCount: count,
        });
        return;
      }

      // ---- Image/audio handling from clipboardData.items/files ----
      const audioBlobs = clipboardFiles(cd).filter((b) => b.blob.type.startsWith("audio/"));
      if (audioBlobs.length > 0) {
        e.preventDefault();
        const audioItems = await Promise.all(
          audioBlobs.map(async ({ blob, name }, index) =>
            createAudioItem({
              sourceRef: name || `clipboard-audio-${index}`,
              src: await fileToDataURL(blob),
              title: name || "Pasted audio",
              x: target.x + index * 24,
              y: target.y + index * 24,
            }),
          ),
        );
        canvasStore.getState().addItems(audioItems);
        setInspection({
          ts: Date.now(),
          summary: `${audioItems.length} audio item${audioItems.length === 1 ? "" : "s"} pasted`,
          imagePreviews: [],
          textSnippet: audioItems.map((item) => item.label ?? item.sourceRef).join("\n"),
          types,
          insertedCount: audioItems.length,
        });
        return;
      }

      const imageBlobs = clipboardFiles(cd).filter((b) => b.blob.type.startsWith("image/"));
      if (imageBlobs.length > 0) {
        e.preventDefault();
        const sources = await Promise.all(
          imageBlobs.map(async ({ blob, name }) => ({
            src: await normaliseImageInput(blob),
            label: name || "pasted-image",
          })),
        );
        const { count, previews } = await pasteImageSources(canvasStore, sources, target);
        setInspection({
          ts: Date.now(),
          summary: `${count} image${count === 1 ? "" : "s"} pasted`,
          imagePreviews: previews,
          textSnippet: cd.getData("text/plain").slice(0, 200),
          types,
          insertedCount: count,
        });
        return;
      }

      const text = cd.getData("text/plain") ?? "";
      const html = cd.getData("text/html") ?? "";

      // ---- Text data URL / raw base64 image handling ----
      if (text && text.trim().length > 0) {
        if (/^data:image\//i.test(text.trim())) {
          e.preventDefault();
          const { count, previews } = await pasteImageSources(
            canvasStore,
            [{ src: text.trim(), label: "pasted-data-url" }],
            target,
          );
          setInspection({
            ts: Date.now(),
            summary: count > 0 ? "Image from data URL" : "Data URL did not decode as image",
            imagePreviews: previews,
            textSnippet: `${text.slice(0, 80)}…`,
            types,
            insertedCount: count,
          });
          return;
        }

        if (/^[A-Za-z0-9+/=\s]+$/.test(text) && text.length > 128) {
          const dataUrl = `data:image/png;base64,${text.replace(/\s/g, "")}`;
          const { count, previews } = await pasteImageSources(
            canvasStore,
            [{ src: dataUrl, label: "pasted-base64" }],
            target,
          );
          if (count > 0) {
            e.preventDefault();
            setInspection({
              ts: Date.now(),
              summary: "Image from raw base64",
              imagePreviews: previews,
              textSnippet: `${text.slice(0, 80)}…`,
              types,
              insertedCount: count,
            });
            return;
          }
        }

        // ---- Plain text handling ----
        e.preventDefault();
        const trimmed = text.length > 600 ? `${text.slice(0, 600)}…` : text;
        const maybeUrl = text.trim();
        const isSingleUrl = /^https?:\/\/\S+$/i.test(maybeUrl);
        const item = isSingleUrl
          ? createLinkItem({
              url: maybeUrl,
              x: target.x - 180,
              y: target.y - 90,
              label: maybeUrl,
            })
          : createTextItem({
              text: trimmed,
              x: target.x - 120,
              y: target.y - 48,
              label: html ? "pasted-fragment" : "pasted-text",
              textKind: html ? "richtext" : "plaintext",
              richTextHtml: html || undefined,
              viewMode: html ? "rendered" : "source",
            });
        canvasStore.getState().addItems([item]);
        setInspection({
          ts: Date.now(),
          summary: isSingleUrl ? "Link card" : `Text block (${text.length} chars)`,
          imagePreviews: [],
          textSnippet: trimmed,
          types,
          insertedCount: 1,
        });
        return;
      }

      // ---- Async Clipboard API image fallback ----
      // Keep this late so it does not steal regular text paste or custom canvas
      // payloads. It helps browsers that hide screenshot images from
      // clipboardData.items but expose them through navigator.clipboard.read().
      if (navigator.clipboard && "read" in navigator.clipboard) {
        try {
          const asyncItems = await navigator.clipboard.read();
          const sources: Array<{ src: string; label: string }> = [];
          for (const item of asyncItems) {
            const src = await readImageFromClipboard(item);
            if (src) sources.push({ src, label: "clipboard-image" });
          }
          if (sources.length > 0) {
            e.preventDefault();
            const { count, previews } = await pasteImageSources(canvasStore, sources, target);
            setInspection({
              ts: Date.now(),
              summary: `${count} image${count === 1 ? "" : "s"} pasted via async clipboard`,
              imagePreviews: previews,
              textSnippet: "",
              types,
              insertedCount: count,
            });
            return;
          }
        } catch (err) {
          console.warn("[paste] navigator.clipboard.read() failed", err);
        }
      }

      // ---- Internal fallback clipboard ----
      const internalCount = canvasStore.getState().paste(target);
      if (internalCount > 0) {
        e.preventDefault();
        setInspection({
          ts: Date.now(),
          summary: "Pasted from internal Canvas Studio clipboard",
          imagePreviews: canvasStore
            .getState()
            .selection.map((id) => canvasStore.getState().items.find((item) => item.id === id))
            .filter((item): item is CanvasItem => !!item)
            .filter((item) => item.type === "image")
            .slice(0, 4)
            .map((item) => item.src),
          textSnippet: "",
          types,
          insertedCount: internalCount,
          note: "No usable OS clipboard payload was exposed; used in-memory fallback.",
        });
        return;
      }

      // ---- Nothing useful on clipboard ----
      setInspection({
        ts: Date.now(),
        summary: "Clipboard had no pasteable content",
        imagePreviews: [],
        textSnippet: html ? `(html fragment, ${html.length} chars)` : "",
        types,
      });
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [canvasStore]);
}
