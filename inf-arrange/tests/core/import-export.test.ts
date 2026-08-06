import {
  CANVAS_DOCUMENT_SCHEMA,
  type CanvasDocument,
  exportCanvasDocumentJson,
  importCanvasDocumentJson,
} from "../../src/canvas-core";
import { assert, assertEqual } from "./assertions";

export function testCanvasDocumentJsonExportAndImportNormalizesDocument(): void {
  const document: CanvasDocument = {
    schema: CANVAS_DOCUMENT_SCHEMA,
    version: 1,
    id: "doc-io",
    viewport: { x: 1, y: 2, k: 1 },
    items: [],
  };

  const json = exportCanvasDocumentJson(document);
  const imported = importCanvasDocumentJson(json);

  assert(imported.ok, "expected import to succeed");
  assertEqual(imported.document.id, "doc-io");
  assertEqual(imported.document.schema, CANVAS_DOCUMENT_SCHEMA);
}

export function testCanvasDocumentJsonImportReturnsDiagnosticsForInvalidJson(): void {
  const imported = importCanvasDocumentJson("{not json");

  assertEqual(imported.ok, false);
  if (!imported.ok) assertEqual(imported.error.kind, "invalid-json");
}
