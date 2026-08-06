import {
  type ClipboardInspection,
  getClipboardInspection,
  subscribeClipboardInspection,
} from "@/hooks/useGlobalPaste";
import { useCanvasStore } from "@/store/canvas";
import { ActionIcon, Badge, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";

/**
 * Floating panel that shows what was last seen on the clipboard. Useful both
 * as a debugging aid ("why didn't my paste work?") and as a feature — users
 * can see exactly what types of content the app detected.
 */
export function ClipboardInspector() {
  const [open, setOpen] = useState(true);
  const [insp, setInsp] = useState<ClipboardInspection | null>(getClipboardInspection());
  const internalClipboard = useCanvasStore((s) => s.clipboard);
  const clipboardHistory = useCanvasStore((s) => s.clipboardHistory);
  const clipboardStatus = useCanvasStore((s) => s.clipboardStatus);
  const clipboardUpdatedAt = useCanvasStore((s) => s.clipboardUpdatedAt);

  useEffect(() => {
    return subscribeClipboardInspection(setInsp);
  }, []);

  return (
    <div className="cs-clipboard-panel">
      <div className="cs-clipboard-panel__header" onClick={() => setOpen((v) => !v)}>
        <Text size="xs" fw={600} style={{ flex: 1, letterSpacing: "0.04em" }}>
          CLIPBOARD
        </Text>
        {insp?.insertedCount !== undefined && (
          <Badge size="xs" variant="light" color={insp.insertedCount > 0 ? "green" : "gray"} mr={6}>
            +{insp.insertedCount}
          </Badge>
        )}
        {insp && (
          <Badge size="xs" variant="light" color="blue" mr={6}>
            {new Date(insp.ts).toLocaleTimeString()}
          </Badge>
        )}
        <ActionIcon
          size="xs"
          variant="subtle"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {open ? "−" : "+"}
        </ActionIcon>
      </div>

      {open && (
        <div className="cs-clipboard-panel__body">
          <Group gap={6} mb={6}>
            <Badge size="xs" variant="dot" color={internalClipboard.length > 0 ? "blue" : "gray"}>
              internal {internalClipboard.length}
            </Badge>
            <Badge
              size="xs"
              variant="dot"
              color={clipboardHistory.length > 0 ? "grape" : "gray"}
              style={{ cursor: clipboardHistory.length > 0 ? "pointer" : "default" }}
              onClick={() => {
                if (clipboardHistory.length > 0)
                  window.dispatchEvent(new Event("cs:clipboard-history"));
              }}
            >
              history {clipboardHistory.length}
            </Badge>
            {clipboardUpdatedAt && (
              <Badge size="xs" variant="light" color="gray">
                {new Date(clipboardUpdatedAt).toLocaleTimeString()}
              </Badge>
            )}
          </Group>

          <Text size="xs" c="dimmed" mb={6}>
            {clipboardStatus}
          </Text>

          {!insp && (
            <Text size="xs" c="dimmed">
              Nothing pasted yet. Press <kbd>Ctrl/⌘+V</kbd> to paste the latest clip, image, text,
              base64, or data URL. Press <kbd>Ctrl/⌘+Shift+V</kbd> for the Canvas Studio clipboard
              history with A S D F H J K L fast select.
            </Text>
          )}
          {insp && (
            <>
              <Text size="xs" fw={500} mb={4}>
                {insp.summary}
              </Text>
              {insp.note && (
                <Text size="xs" c="dimmed" mb={4}>
                  {insp.note}
                </Text>
              )}
              {insp.imagePreviews.length > 0 && (
                <div className="cs-clipboard-panel__previews">
                  {insp.imagePreviews.slice(0, 4).map((src, i) => (
                    <img key={`${src.length}-${src.slice(0, 128)}`} src={src} alt={`clip-${i}`} />
                  ))}
                </div>
              )}
              {insp.textSnippet && (
                <div className="cs-clipboard-panel__snippet">{insp.textSnippet}</div>
              )}
              {insp.types.length > 0 && (
                <div className="cs-clipboard-panel__types">
                  {insp.types.map((t) => (
                    <Badge key={t} size="xs" variant="dot" color="gray">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
