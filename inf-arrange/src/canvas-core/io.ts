import type { CanvasDocument } from "./document";
import {
  normalizeCanvasDocument,
  serializeCanvasDocument,
  validateCanvasDocument,
} from "./document";

export interface CanvasDocumentImportError {
  kind: "invalid-json" | "invalid-document";
  message: string;
}

export type CanvasDocumentImportResult =
  | { ok: true; document: CanvasDocument }
  | { ok: false; error: CanvasDocumentImportError };

export function exportCanvasDocumentJson(document: CanvasDocument): string {
  return `${serializeCanvasDocument(normalizeCanvasDocument(document))}\n`;
}

export function importCanvasDocumentJson(source: string): CanvasDocumentImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: "invalid-json",
        message: error instanceof Error ? error.message : "Invalid JSON",
      },
    };
  }

  const validation = validateCanvasDocument(parsed);
  if (!validation.ok) {
    return {
      ok: false,
      error: { kind: "invalid-document", message: validation.errors.join("; ") },
    };
  }

  return { ok: true, document: normalizeCanvasDocument(parsed) };
}
