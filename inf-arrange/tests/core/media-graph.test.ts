import { CANVAS_DOCUMENT_SCHEMA, type CanvasDocument } from "../../src/canvas-core";
import { mediaStats, playlistSequence, relationSegments } from "../../src/canvas-core";
import { assertDeepEqual, assertEqual } from "./assertions";

function audioDocument(): CanvasDocument {
  return {
    schema: "canvas-studio-document",
    version: 1,
    items: [
      {
        id: "a",
        type: "audio",
        frame: { x: 0, y: 0, width: 100, height: 40 },
        data: { title: "A", durationMs: 1000, sourceRef: "asset://a.mp3" },
      },
      {
        id: "b",
        type: "audio",
        frame: { x: 140, y: 0, width: 100, height: 40 },
        data: { title: "B", durationMs: 2000, sourceRef: "asset://b.mp3" },
      },
      {
        id: "c",
        type: "audio",
        frame: { x: 280, y: 0, width: 100, height: 40 },
        data: { title: "C", durationMs: 3000, sourceRef: "asset://b.mp3" },
      },
      {
        id: "missing",
        type: "audio",
        frame: { x: 420, y: 0, width: 100, height: 40 },
        data: { title: "Missing", durationMs: 4000 },
      },
    ],
    relations: [
      { id: "r1", type: "sequence-next", sourceId: "a", targetId: "b" },
      { id: "r2", type: "sequence-next", sourceId: "b", targetId: "c" },
    ],
  };
}

export function testMediaStatsSummarizeDurationMissingAndDuplicateSources(): void {
  assertDeepEqual(mediaStats(audioDocument()), {
    mediaItemCount: 4,
    totalDurationMs: 10000,
    missingSourceRefs: ["missing"],
    duplicateSourceRefs: ["asset://b.mp3"],
  });
}

export function testPlaylistSequenceTraversesSequenceNextRelations(): void {
  assertDeepEqual(
    playlistSequence(audioDocument(), "a").map((item) => item.id),
    ["a", "b", "c"],
  );
}

export function testPlaylistSequenceCanInferStartNode(): void {
  assertEqual(playlistSequence(audioDocument())[0]?.id, "a");
}

export function testRelationSegmentsUseItemCentersAndSkipDanglingRelations(): void {
  const document: CanvasDocument = {
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: 1,
    items: [
      { id: "a", type: "text", frame: { x: 10, y: 20, width: 100, height: 60 }, data: {} },
      { id: "b", type: "text", frame: { x: 210, y: 120, width: 80, height: 40 }, data: {} },
    ],
    relations: [
      { id: "r1", type: "references", sourceId: "a", targetId: "b", label: "see" },
      { id: "dangling", type: "references", sourceId: "a", targetId: "missing" },
    ],
  };

  assertDeepEqual(relationSegments(document), [
    {
      relationId: "r1",
      type: "references",
      sourceId: "a",
      targetId: "b",
      x1: 60,
      y1: 50,
      x2: 250,
      y2: 140,
      label: "see",
    },
  ]);
}
