import { loadImage, normaliseImageInput } from "@/lib/imageOps";
import { createImageItem, useCanvasStore } from "@/store/canvas";
import type { AudioItem, CanvasItem, ImageItem, LinkItem, TextItem } from "@/types";
import {
  Badge,
  Box,
  Button,
  Group,
  Image as MImage,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useRef, useState } from "react";

function itemLabel(item: CanvasItem): string {
  if (item.label) return item.label;
  if (item.type === "text") return item.text.slice(0, 40);
  if (item.type === "link") return item.title ?? item.url;
  if (item.type === "web") return item.title ?? item.url;
  if (item.type === "audio") return item.title ?? item.sourceRef;
  if (item.type === "unknown") return item.originalType;
  return `image-${item.id.slice(0, 6)}`;
}

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function MediaManager({ opened, onClose }: Props) {
  const items = useCanvasStore((s) => s.items);
  const selection = useCanvasStore((s) => s.selection);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const removeItems = useCanvasStore((s) => s.removeItems);
  const replaceItem = useCanvasStore((s) => s.replaceItem);
  const addItems = useCanvasStore((s) => s.addItems);
  const toggleInSelection = useCanvasStore((s) => s.toggleInSelection);
  const pushHistory = useCanvasStore((s) => s._pushHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const handleFilePick = async (files: FileList | null) => {
    if (!files) return;
    const list: CanvasItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      try {
        const src = await normaliseImageInput(f);
        const { naturalWidth, naturalHeight } = await loadImage(src);
        if (replaceId) {
          const original = items.find((it) => it.id === replaceId);
          if (original) {
            const replacement: ImageItem = {
              ...(original as ImageItem),
              type: "image",
              src,
              naturalWidth,
              naturalHeight,
              crop: undefined,
              // Preserve width, recompute height for aspect.
              height: (original.width * naturalHeight) / naturalWidth || original.height,
            };
            pushHistory();
            replaceItem(replaceId, replacement);
          }
          setReplaceId(null);
        } else {
          list.push(
            createImageItem({
              src,
              naturalWidth,
              naturalHeight,
              x: 100 + i * 24,
              y: 100 + i * 24,
              label: f.name,
            }),
          );
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (list.length > 0) addItems(list);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = items.filter((it) => {
    if (!filter.trim()) return true;
    const label = itemLabel(it);
    return label.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600}>Media Manager</Text>
          <Badge size="sm" variant="light" color="blue">
            {items.length} items
          </Badge>
        </Group>
      }
      size="lg"
      centered
      styles={{
        body: { padding: 0 },
      }}
    >
      <Box p="sm" style={{ borderBottom: "1px solid var(--cs-border)" }}>
        <Group gap="sm">
          <TextInput
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            size="sm"
            style={{ flex: 1 }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFilePick(e.target.files)}
          />
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setReplaceId(null);
              fileInputRef.current?.click();
            }}
          >
            + Upload
          </Button>
        </Group>
      </Box>

      <Box p="sm">
        {filtered.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No items yet. Paste an image, drop a file, or use + Upload.
          </Text>
        ) : (
          <Stack gap={4} className="cs-mm-list">
            {filtered.map((it) => {
              const selected = selection.includes(it.id);
              const label = itemLabel(it);
              return (
                <div
                  key={it.id}
                  className="cs-mm-row"
                  data-selected={selected ? "true" : "false"}
                  onClick={(e) => {
                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                      toggleInSelection(it.id);
                    } else {
                      setSelection([it.id]);
                    }
                  }}
                >
                  <div className="cs-mm-thumb">
                    {it.type === "image" ? (
                      <MImage
                        src={(it as ImageItem).src}
                        fit="cover"
                        height={72}
                        width={72}
                        radius="sm"
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: it.type === "text" ? (it as TextItem).background : "#edf2ff",
                          color: it.type === "text" ? (it as TextItem).color : "#1c3faa",
                          fontSize: 9,
                          padding: 6,
                          overflow: "hidden",
                          lineHeight: 1.2,
                        }}
                      >
                        {it.type === "text"
                          ? (it as TextItem).text.slice(0, 80)
                          : it.type === "audio"
                            ? `♪ ${(it as AudioItem).title ?? (it as AudioItem).sourceRef}`
                            : it.type === "link"
                              ? (it as LinkItem).url
                              : itemLabel(it)}
                      </div>
                    )}
                  </div>
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs">
                      <Text size="sm" fw={500} truncate>
                        {label || "(unnamed)"}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={it.type === "image" ? "cyan" : "grape"}
                      >
                        {it.type}
                      </Badge>
                      {selected && (
                        <Badge size="xs" variant="filled" color="blue">
                          selected
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {Math.round(it.width)} × {Math.round(it.height)} px · x:{Math.round(it.x)} y:
                      {Math.round(it.y)} · z:{it.zIndex}
                    </Text>
                  </Stack>
                  <Group gap={4}>
                    <Tooltip label="Replace image (keeps position/size)">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplaceId(it.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        Replace
                      </Button>
                    </Tooltip>
                    <Tooltip label="Select only this">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelection([it.id]);
                        }}
                      >
                        Focus
                      </Button>
                    </Tooltip>
                    <Tooltip label="Remove from canvas">
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItems([it.id]);
                        }}
                      >
                        Remove
                      </Button>
                    </Tooltip>
                  </Group>
                </div>
              );
            })}
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
