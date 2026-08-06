import {
  CANVAS_DOCUMENT_SCHEMA,
  CANVAS_DOCUMENT_VERSION,
  type CanvasDocument,
  createCanvasDocument,
  runtimeItemsFromDocument,
} from "../../src/canvas-core";
import type { CanvasItem } from "../../src/types";
import { assertDeepEqual, assertEqual } from "./assertions";

export function testTextCapabilitiesRoundTripThroughCanvasDocument(): void {
  const items: CanvasItem[] = [
    {
      id: "md-1",
      type: "text",
      x: 0,
      y: 0,
      width: 320,
      height: 220,
      rotation: 0,
      zIndex: 1,
      text: "# Hello",
      fontSize: 16,
      color: "#111",
      background: "#fff",
      align: "left",
      textKind: "markdown",
      viewMode: "rendered",
    },
    {
      id: "log-1",
      type: "text",
      x: 360,
      y: 0,
      width: 320,
      height: 220,
      rotation: 0,
      zIndex: 2,
      text: "entry",
      fontSize: 16,
      color: "#111",
      background: "#fff",
      align: "left",
      textKind: "log",
      logEntries: [{ id: "e1", ts: "2026-07-01T00:00:00.000Z", text: "entry" }],
    },
  ];

  const document = createCanvasDocument(items, {
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  });
  const runtime = runtimeItemsFromDocument(document);

  assertEqual(document.items[0].data.textKind, "markdown");
  assertEqual(runtime[0].type, "text");
  if (runtime[0].type === "text") assertEqual(runtime[0].textKind, "markdown");
  assertDeepEqual(
    document.items[1].data.logEntries,
    items[1].type === "text" ? items[1].logEntries : [],
  );
}

export function testAudioItemRoundTripsThroughCanvasDocument(): void {
  const items: CanvasItem[] = [
    {
      id: "audio-1",
      type: "audio",
      x: 10,
      y: 20,
      width: 360,
      height: 126,
      rotation: 0,
      zIndex: 3,
      label: "Kick loop",
      sourceRef: "asset://loops/kick.wav",
      src: "data:audio/wav;base64,fixture",
      title: "Kick loop",
      artist: "Canvas Studio",
      durationMs: 42000,
      playbackMode: "sequence",
    },
  ];

  const document = createCanvasDocument(items, {
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  });
  assertEqual(document.items[0].type, "audio");
  assertEqual(document.items[0].data.sourceRef, "asset://loops/kick.wav");
  assertEqual(document.items[0].data.durationMs, 42000);
  assertDeepEqual(runtimeItemsFromDocument(document), items);
}

export function testLinkItemRoundTripsThroughCanvasDocument(): void {
  const document: CanvasDocument = {
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: CANVAS_DOCUMENT_VERSION,
    items: [
      {
        id: "link-1",
        type: "link",
        frame: { x: 1, y: 2, width: 300, height: 160, zIndex: 1 },
        label: "Example",
        data: {
          url: "https://example.com",
          title: "Example Domain",
          description: "A test link",
          preview: { siteName: "Example" },
          viewMode: "iframe",
        },
      },
    ],
  };

  const runtime = runtimeItemsFromDocument(document);
  assertEqual(runtime[0].type, "link");
  if (runtime[0].type === "link") {
    assertEqual(runtime[0].url, "https://example.com");
    assertEqual(runtime[0].viewMode, "iframe");
  }

  const back = createCanvasDocument(runtime, {
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  });
  assertEqual(back.items[0].type, "link");
  assertEqual(back.items[0].data.url, "https://example.com");
}
