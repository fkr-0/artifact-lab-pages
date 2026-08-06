import { boundsOfItems } from "@/lib/clipboard";
import { screenToCanvas } from "@/lib/geometry";
import { type CanvasClipboardEntry, useCanvasStore, useCanvasStoreApi } from "@/store/canvas";
import type { Point } from "@/types";
import { ActionIcon, Badge, Button, Group, Modal, ScrollArea, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const HOT_KEYS = ["a", "s", "d", "f", "h", "j", "k", "l"];

function viewportCentre(viewport: { x: number; y: number; k: number }): Point {
  const surface = document.querySelector(".cs-canvas-surface") as HTMLElement | null;
  const rect = surface?.getBoundingClientRect();
  const screen = rect
    ? { x: rect.width / 2, y: rect.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  return screenToCanvas(screen, viewport);
}

function sourceLabel(source: CanvasClipboardEntry["source"]): string {
  switch (source) {
    case "copy":
      return "Copied";
    case "cut":
      return "Cut";
    case "external":
      return "Imported";
  }
}

function entryMeta(entry: CanvasClipboardEntry): string {
  const bounds = boundsOfItems(entry.items);
  const when = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${sourceLabel(entry.source)} ${when} · ${Math.round(bounds.w)}×${Math.round(bounds.h)}`;
}

function previewFor(entry: CanvasClipboardEntry): { image?: string; text: string } {
  const image = entry.items.find((item) => item.type === "image")?.src;
  const text = entry.items
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join(" ")
    .trim();
  return { image, text: text.slice(0, 160) };
}

export function ClipboardHistoryPalette({ opened, onClose }: Props) {
  const canvasStore = useCanvasStoreApi();
  const history = useCanvasStore((s) => s.clipboardHistory);
  const pasteClipboardEntry = useCanvasStore((s) => s.pasteClipboardEntry);
  const forgetClipboardEntry = useCanvasStore((s) => s.forgetClipboardEntry);
  const clearClipboardHistory = useCanvasStore((s) => s.clearClipboardHistory);
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleEntries = useMemo(() => history.slice(0, HOT_KEYS.length), [history]);

  useEffect(() => {
    if (opened) setActiveIndex(0);
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const consume = () => {
        event.preventDefault();
        event.stopPropagation();
      };
      const key = event.key.toLowerCase();
      const hotIndex = HOT_KEYS.indexOf(key);
      if (hotIndex >= 0 && visibleEntries[hotIndex]) {
        consume();
        paste(visibleEntries[hotIndex].id);
        return;
      }
      if (event.key === "ArrowDown") {
        consume();
        setActiveIndex((index) => Math.min(index + 1, Math.max(visibleEntries.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        consume();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter" && visibleEntries[activeIndex]) {
        consume();
        paste(visibleEntries[activeIndex].id);
        return;
      }
      if (event.key === "Escape") {
        consume();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [activeIndex, onClose, opened, visibleEntries]);

  const paste = (entryId: string) => {
    pasteClipboardEntry(entryId, viewportCentre(canvasStore.getState().viewport));
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={700}>Clipboard history</Text>
          <Badge variant="light">{history.length} clips</Badge>
        </Group>
      }
      size="lg"
      centered
      overlayProps={{ blur: 2, opacity: 0.35 }}
      classNames={{ content: "cs-clip-history-modal" }}
    >
      <Text size="xs" c="dimmed" mb="sm">
        Normal Ctrl+V still pastes the latest clipboard. Ctrl+Shift+V opens this stack; press A S D
        F H J K L for instant paste.
      </Text>

      {visibleEntries.length === 0 ? (
        <div className="cs-clip-history-empty">
          <Text size="sm" fw={600}>
            No Canvas Studio clips yet
          </Text>
          <Text size="xs" c="dimmed">
            Copy or cut canvas items first. Each copy/cut becomes a reusable clip here.
          </Text>
        </div>
      ) : (
        <ScrollArea.Autosize mah={460} type="scroll">
          <div className="cs-clip-history-list">
            {visibleEntries.map((entry, index) => {
              const preview = previewFor(entry);
              const hotKey = HOT_KEYS[index].toUpperCase();
              const active = index === activeIndex;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className="cs-clip-history-entry"
                  data-active={active ? "true" : "false"}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => paste(entry.id)}
                >
                  <span className="cs-clip-history-entry__key">{hotKey}</span>
                  <span className="cs-clip-history-entry__preview">
                    {preview.image ? (
                      <img src={preview.image} alt="clipboard preview" />
                    ) : (
                      <span className="cs-clip-history-entry__text-preview">
                        {preview.text || "Canvas item selection"}
                      </span>
                    )}
                  </span>
                  <span className="cs-clip-history-entry__body">
                    <span className="cs-clip-history-entry__title">{entry.summary}</span>
                    <span className="cs-clip-history-entry__meta">{entryMeta(entry)}</span>
                  </span>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    aria-label="Remove clipboard entry"
                    onClick={(event) => {
                      event.stopPropagation();
                      forgetClipboardEntry(entry.id);
                    }}
                  >
                    ×
                  </ActionIcon>
                </button>
              );
            })}
          </div>
        </ScrollArea.Autosize>
      )}

      <Group justify="space-between" mt="sm">
        <Text size="xs" c="dimmed">
          Newest clips are first. Selecting a history clip also makes it the latest internal clip.
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="default" onClick={onClose}>
            Close
          </Button>
          <Button
            size="xs"
            variant="subtle"
            color="red"
            disabled={history.length === 0}
            onClick={clearClipboardHistory}
          >
            Clear history
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
