import {
  normalizeCanvasDocument,
  type CanvasDocument,
  type CanvasDocumentLoader,
} from "../../src/canvas-core";

export interface GeneratedOpenApiCanvasClient {
  getCanvasDocument(args: { id: string }, options?: { signal?: AbortSignal }): Promise<{ document: unknown }>;
  putCanvasDocument(
    args: { id: string; document: CanvasDocument },
    options?: { signal?: AbortSignal },
  ): Promise<{ document: unknown }>;
}

export function createOpenApiCanvasDocumentLoader(
  client: GeneratedOpenApiCanvasClient,
): CanvasDocumentLoader {
  return {
    async load(id, signal) {
      const response = await client.getCanvasDocument({ id }, { signal });
      return normalizeCanvasDocument(response.document);
    },
    async save(document, signal) {
      const response = await client.putCanvasDocument(
        { id: document.id ?? "default", document },
        { signal },
      );
      return normalizeCanvasDocument(response.document);
    },
  };
}
