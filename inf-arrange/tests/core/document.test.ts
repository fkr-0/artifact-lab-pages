import {
  CANVAS_DOCUMENT_SCHEMA,
  CANVAS_DOCUMENT_VERSION,
  createCanvasDocument,
  normalizeCanvasDocument,
  parseCanvasDocument,
  runtimeItemsFromDocument,
  serializeCanvasDocument,
} from "../../src/canvas-core";
import type { CanvasDocument } from "../../src/canvas-core";
import type { CanvasItem } from "../../src/types";
import { assertDeepEqual, assertEqual } from "./assertions";

export function testRuntimeItemsRoundTripThroughCanvasDocument(): void {
  const items: CanvasItem[] = [
    {
      id: "img-1",
      type: "image",
      x: 10,
      y: 20,
      width: 300,
      height: 200,
      rotation: 0,
      zIndex: 2,
      label: "Hero",
      src: "data:image/png;base64,aaa",
      naturalWidth: 1200,
      naturalHeight: 800,
      crop: { x: 10, y: 20, w: 300, h: 200 },
    },
    {
      id: "txt-1",
      type: "text",
      x: -30,
      y: 44,
      width: 180,
      height: 96,
      rotation: 0,
      zIndex: 3,
      text: "hello",
      fontSize: 18,
      color: "#111111",
      background: "#ffeeaa",
      align: "center",
    },
  ];

  const document = createCanvasDocument(items, {
    id: "doc-1",
    title: "Round trip",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    viewport: { x: 5, y: 6, k: 1.5 },
  });
  const parsed = parseCanvasDocument(serializeCanvasDocument(document));

  assertEqual(parsed.schema, CANVAS_DOCUMENT_SCHEMA);
  assertEqual(parsed.version, CANVAS_DOCUMENT_VERSION);
  assertDeepEqual(runtimeItemsFromDocument(parsed), items);
}

export function testUnknownDocumentItemsBecomeLosslessRuntimePlaceholders(): void {
  const document: CanvasDocument = normalizeCanvasDocument({
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: CANVAS_DOCUMENT_VERSION,
    viewport: { x: 0, y: 0, k: 1 },
    items: [
      {
        id: "plugin-1",
        type: "timeline-marker",
        frame: { x: 120, y: 80, width: 320, height: 88, zIndex: 5 },
        label: "Intro Track",
        data: {
          title: "Intro Track",
          artist: "Example Artist",
          durationMs: 182000,
          sourceRef: "asset://tracks/intro.mp3",
        },
        metadata: { externalId: "song-001" },
      },
    ],
  });

  const runtime = runtimeItemsFromDocument(document);
  assertEqual(runtime.length, 1, "unknown item must not be dropped at the runtime boundary");
  const item = runtime[0];
  assertEqual(item.type, "unknown");
  assertEqual(item.originalType, "timeline-marker");
  assertEqual(item.label, "Intro Track");
  assertDeepEqual(item.data, document.items[0].data);

  const roundTrip = createCanvasDocument(runtime, {
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  assertEqual(roundTrip.items[0].type, "timeline-marker");
  assertDeepEqual(roundTrip.items[0].data, document.items[0].data);
  assertDeepEqual(roundTrip.items[0].metadata, document.items[0].metadata);
}

export function testLinkItemsRoundTripThroughCanvasDocument(): void {
  const items: CanvasItem[] = [
    {
      id: "link-1",
      type: "link",
      x: 12,
      y: 24,
      width: 260,
      height: 120,
      rotation: 0,
      zIndex: 7,
      label: "Example Link",
      accent: "#4c6ef5",
      url: "https://example.invalid/demo",
      title: "Example",
      description: "Link preview text",
      preview: { title: "Preview title", siteName: "Example" },
      viewMode: "card",
    },
  ];

  const document = createCanvasDocument(items, {
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  assertEqual(document.items[0].type, "link");
  assertDeepEqual(document.items[0].data, {
    url: "https://example.invalid/demo",
    title: "Example",
    description: "Link preview text",
    preview: { title: "Preview title", siteName: "Example" },
    viewMode: "card",
  });
  assertDeepEqual(
    runtimeItemsFromDocument(parseCanvasDocument(serializeCanvasDocument(document))),
    items,
  );
}

export function testNormalizeCanvasDocumentClampsUnsafeFrameAndViewportValues(): void {
  const document = normalizeCanvasDocument({
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: CANVAS_DOCUMENT_VERSION,
    viewport: { x: Number.NaN, y: 7, k: -1 },
    items: [
      {
        id: "bad-size",
        type: "text",
        frame: { x: Number.POSITIVE_INFINITY, y: 2, width: -50, height: 0 },
        data: { text: "x" },
      },
    ],
  });

  assertDeepEqual(document.viewport, { x: 0, y: 7, k: 0.01 });
  assertDeepEqual(document.items[0].frame, {
    x: 0,
    y: 2,
    width: 1,
    height: 1,
    rotation: 0,
    zIndex: 0,
  });
}
