import {
  CANVAS_DOCUMENT_SCHEMA,
  type CanvasDocument,
  createCanvasDocument,
  documentStats,
  normalizeCanvasDocument,
  parseCanvasDocument,
  runtimeItemsFromDocument,
  serializeCanvasDocument,
  validateCanvasDocument,
} from "@/canvas-core";
import type { CanvasItem } from "@/types";

export const DOCUMENT_CORE_CONTRACT_FIXTURE_ITEMS: CanvasItem[] = [
  {
    id: "image-1",
    type: "image",
    x: 10,
    y: 20,
    width: 320,
    height: 180,
    rotation: 0,
    zIndex: 1,
    label: "fixture image",
    src: "data:image/png;base64,fixture",
    naturalWidth: 640,
    naturalHeight: 360,
  },
  {
    id: "text-1",
    type: "text",
    x: 400,
    y: 20,
    width: 240,
    height: 96,
    rotation: 0,
    zIndex: 2,
    label: "fixture text",
    text: "Fixture text",
    fontSize: 16,
    color: "#111111",
    background: "#fff8d6",
    align: "left",
  },
];

export const DOCUMENT_CORE_CONTRACT_DOCUMENT = createCanvasDocument(
  DOCUMENT_CORE_CONTRACT_FIXTURE_ITEMS,
  { id: "contract-doc", title: "Contract document", viewport: { x: 1, y: 2, k: 1 } },
) satisfies CanvasDocument;

export function runDocumentCoreContractAssertions(): void {
  const validation = validateCanvasDocument(DOCUMENT_CORE_CONTRACT_DOCUMENT);
  if (!validation.ok) throw new Error(validation.errors.join("; "));
  const serialized = serializeCanvasDocument(DOCUMENT_CORE_CONTRACT_DOCUMENT);
  const parsed = parseCanvasDocument(serialized);
  const runtime = runtimeItemsFromDocument(parsed);
  if (parsed.schema !== CANVAS_DOCUMENT_SCHEMA) throw new Error("schema did not normalize");
  if (runtime.length !== DOCUMENT_CORE_CONTRACT_FIXTURE_ITEMS.length) {
    throw new Error("runtime item round-trip count mismatch");
  }
  const stats = documentStats(normalizeCanvasDocument(parsed));
  if (stats.typeCounts.image !== 1 || stats.typeCounts.text !== 1) {
    throw new Error("document stats type count mismatch");
  }
}
