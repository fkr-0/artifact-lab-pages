import { exportCanvasDocumentJson, importCanvasDocumentJson } from "@/canvas-core";
import { screenToCanvas } from "@/lib/geometry";
import { fileToDataURL, loadImage, normaliseImageInput } from "@/lib/imageOps";
import {
  createAudioItem,
  createImageItem,
  createLinkItem,
  createTextItem,
  hydrateCanvasStoreDocument,
  snapshotCanvasStoreDocument,
  useCanvasStore,
  useCanvasStoreApi,
} from "@/store/canvas";
import { ActionIcon, Button, Group, SegmentedControl, Text, Tooltip } from "@mantine/core";
import { useRef } from "react";

interface Props {
  onOpenMediaManager: () => void;
  onOpenKeybindings: () => void;
  onOpenGraphPanel: () => void;
}

export function Toolbar({ onOpenMediaManager, onOpenKeybindings, onOpenGraphPanel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const canvasStore = useCanvasStoreApi();
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const past = useCanvasStore((s) => s.past.length);
  const future = useCanvasStore((s) => s.future.length);
  const selection = useCanvasStore((s) => s.selection);
  const duplicateSelection = useCanvasStore((s) => s.duplicateSelection);
  const copySelection = useCanvasStore((s) => s.copySelection);
  const cutSelection = useCanvasStore((s) => s.cutSelection);
  const paste = useCanvasStore((s) => s.paste);
  const clipboard = useCanvasStore((s) => s.clipboard);
  const clipboardHistory = useCanvasStore((s) => s.clipboardHistory);
  const removeItems = useCanvasStore((s) => s.removeItems);
  const selectAll = useCanvasStore((s) => s.selectAll);
  const viewport = useCanvasStore((s) => s.viewport);
  const items = useCanvasStore((s) => s.items);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    const store = canvasStore.getState();
    const centre = screenToCanvas(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      store.viewport,
    );
    let offset = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        if (f.type.startsWith("audio/")) {
          const item = createAudioItem({
            sourceRef: f.name,
            src: await fileToDataURL(f),
            title: f.name,
            x: centre.x + offset,
            y: centre.y + offset,
            label: f.name,
          });
          canvasStore.getState().addItems([item]);
          offset += 24;
          continue;
        }
        if (!f.type.startsWith("image/")) continue;
        const src = await normaliseImageInput(f);
        const { naturalWidth, naturalHeight } = await loadImage(src);
        const item = createImageItem({
          src,
          naturalWidth,
          naturalHeight,
          x: centre.x + offset,
          y: centre.y + offset,
          label: f.name,
        });
        canvasStore.getState().addItems([item]);
        offset += 24;
      } catch (err) {
        console.error(err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canvasCentre = () => {
    const store = canvasStore.getState();
    return screenToCanvas({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, store.viewport);
  };

  const addTextBlock = () => {
    const centre = canvasCentre();
    const item = createTextItem({
      text: "New text block",
      x: centre.x - 120,
      y: centre.y - 48,
      label: "text",
    });
    canvasStore.getState().addItems([item]);
  };

  const addMarkdownBlock = () => {
    const centre = canvasCentre();
    const item = createTextItem({
      text: "# Markdown note\n\n- edit source\n- toggle rendered view",
      x: centre.x - 180,
      y: centre.y - 110,
      width: 360,
      height: 220,
      label: "markdown",
      textKind: "markdown",
      viewMode: "rendered",
    });
    canvasStore.getState().addItems([item]);
  };

  const addLogBlock = () => {
    const centre = canvasCentre();
    const item = createTextItem({
      text: "",
      x: centre.x - 180,
      y: centre.y - 110,
      width: 360,
      height: 220,
      label: "log",
      textKind: "log",
      viewMode: "rendered",
      logEntries: [],
    });
    canvasStore.getState().addItems([item]);
  };

  const addLinkBlock = () => {
    const centre = canvasCentre();
    const url = window.prompt("URL for link card", "https://example.com");
    if (!url) return;
    const item = createLinkItem({ url, x: centre.x - 180, y: centre.y - 100, label: url });
    canvasStore.getState().addItems([item]);
  };

  const exportJsonDocument = () => {
    const blob = new Blob([exportCanvasDocumentJson(snapshotCanvasStoreDocument(canvasStore))], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "canvas-document.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJsonDocument = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const result = importCanvasDocumentJson(await file.text());
    if (!result.ok) {
      window.alert(`Could not import canvas document: ${result.error.message}`);
      return;
    }
    hydrateCanvasStoreDocument(canvasStore, result.document);
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  return (
    <div className="cs-toolbar">
      <span className="cs-toolbar__title">⟁ Canvas Studio</span>

      <input
        ref={documentInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(e) => void importJsonDocument(e.target.files)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleUpload(e.target.files)}
      />

      <Tooltip label="Export current canvas document as JSON">
        <Button size="xs" variant="default" onClick={exportJsonDocument}>
          Export JSON
        </Button>
      </Tooltip>

      <Tooltip label="Import canvas document JSON">
        <Button size="xs" variant="default" onClick={() => documentInputRef.current?.click()}>
          Import JSON
        </Button>
      </Tooltip>

      <Tooltip label="Upload image(s) or audio files">
        <Button size="xs" variant="default" onClick={() => fileInputRef.current?.click()}>
          + Media
        </Button>
      </Tooltip>

      <Tooltip label="Add plaintext block">
        <Button size="xs" variant="default" onClick={addTextBlock}>
          + Text
        </Button>
      </Tooltip>

      <Tooltip label="Add rendered/source markdown block">
        <Button size="xs" variant="default" onClick={addMarkdownBlock}>
          + MD
        </Button>
      </Tooltip>

      <Tooltip label="Add append-only log block">
        <Button size="xs" variant="default" onClick={addLogBlock}>
          + Log
        </Button>
      </Tooltip>

      <Tooltip label="Add link card / iframe preview">
        <Button size="xs" variant="default" onClick={addLinkBlock}>
          + Link
        </Button>
      </Tooltip>

      <Group gap={4}>
        <Tooltip label="Undo (⌘Z)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={undo}
            disabled={past === 0}
            aria-label="Undo"
          >
            ↺
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Redo (⇧⌘Z)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={redo}
            disabled={future === 0}
            aria-label="Redo"
          >
            ↻
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap={4}>
        <Tooltip label="Copy selection (⌘C)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={copySelection}
            disabled={selection.length === 0}
            aria-label="Copy"
          >
            ⧠
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Cut selection (⌘X)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={cutSelection}
            disabled={selection.length === 0}
            aria-label="Cut"
          >
            ✂
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Paste latest internal clipboard (Ctrl+V also accepts OS clipboard images/text)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => paste(null)}
            disabled={clipboard.length === 0}
            aria-label="Paste"
          >
            ⎘
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Clipboard history (Ctrl+Shift+V, then A S D F H J K L)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => window.dispatchEvent(new Event("cs:clipboard-history"))}
            disabled={clipboardHistory.length === 0}
            aria-label="Clipboard history"
          >
            ⧆
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Duplicate (⌘D)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={duplicateSelection}
            disabled={selection.length === 0}
            aria-label="Duplicate"
          >
            ⧉
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete (Del)">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => removeItems(selection)}
            disabled={selection.length === 0}
            aria-label="Delete selected"
          >
            ✕
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Select all (⌘A)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={selectAll}
            disabled={items.length === 0}
            aria-label="Select all"
          >
            ▣
          </ActionIcon>
        </Tooltip>
      </Group>

      <Button size="xs" variant="light" onClick={onOpenMediaManager}>
        Media Manager ({items.length})
      </Button>

      <Tooltip label="Edit graph relations and inspect canvas stats">
        <Button size="xs" variant="default" onClick={onOpenGraphPanel}>
          ⟲ Graph
        </Button>
      </Tooltip>

      <Tooltip label="Configure keybindings & mouse gestures">
        <Button size="xs" variant="default" onClick={onOpenKeybindings}>
          ⌨ Keybindings
        </Button>
      </Tooltip>

      <div className="cs-toolbar__spacer" />

      <SegmentedControl
        size="xs"
        value={`${Math.round(viewport.k * 100)}%`}
        readOnly
        data={[
          { value: `${Math.round(viewport.k * 100)}%`, label: `${Math.round(viewport.k * 100)}%` },
        ]}
      />

      <Group gap={4}>
        <Tooltip label="Zoom out (−)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => window.dispatchEvent(new Event("cs:zoom-out"))}
            aria-label="Zoom out"
          >
            −
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom in (+)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => window.dispatchEvent(new Event("cs:zoom-in"))}
            aria-label="Zoom in"
          >
            +
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom to fit (F)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => window.dispatchEvent(new Event("cs:zoom-fit"))}
            aria-label="Zoom to fit"
          >
            ⤢
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Reset view (⌘0)">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => window.dispatchEvent(new Event("cs:zoom-reset"))}
            aria-label="Zoom reset"
          >
            ⊙
          </ActionIcon>
        </Tooltip>
      </Group>

      <Text size="xs" c="dimmed" style={{ marginLeft: 8 }}>
        {selection.length > 0
          ? `${selection.length} selected`
          : clipboardHistory.length > 0
            ? `${clipboardHistory.length} clips`
            : clipboard.length > 0
              ? `${clipboard.length} clipped`
              : ""}
      </Text>
    </div>
  );
}
