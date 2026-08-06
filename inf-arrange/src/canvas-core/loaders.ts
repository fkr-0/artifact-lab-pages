import type { CanvasDocumentLoader } from "./contracts";
import type { CanvasDocument } from "./document";
import { normalizeCanvasDocument } from "./document";

type AnyClient = Record<string, (...args: never[]) => Promise<unknown>>;

export interface OpenApiCanvasDocumentLoaderOptions<TClient extends AnyClient, TLoadDto, TSaveDto> {
  loadMethod?: keyof TClient & string;
  saveMethod?: keyof TClient & string;
  loadArgs?: (id: string, signal?: AbortSignal) => unknown;
  saveArgs?: (document: CanvasDocument, signal?: AbortSignal) => unknown;
  extractDocument?: (dto: TLoadDto | TSaveDto) => unknown;
}

function defaultExtractDocument(dto: unknown): unknown {
  if (dto && typeof dto === "object" && "document" in dto) {
    return (dto as { document: unknown }).document;
  }
  return dto;
}

export function createOpenApiCanvasDocumentLoader<
  TClient extends AnyClient,
  TLoadDto = unknown,
  TSaveDto = TLoadDto,
>(
  client: TClient,
  options: OpenApiCanvasDocumentLoaderOptions<TClient, TLoadDto, TSaveDto> = {},
): CanvasDocumentLoader {
  const loadMethod = options.loadMethod ?? "getCanvasDocument";
  const saveMethod = options.saveMethod ?? "putCanvasDocument";
  const extractDocument = options.extractDocument ?? defaultExtractDocument;

  return {
    async load(id, signal) {
      const method = client[loadMethod];
      if (typeof method !== "function") throw new Error(`OpenAPI client is missing ${loadMethod}`);
      const args = options.loadArgs?.(id, signal) ?? { id, signal };
      const dto = (await method(args as never)) as TLoadDto;
      return normalizeCanvasDocument(extractDocument(dto));
    },
    async save(document, signal) {
      const method = client[saveMethod];
      if (typeof method !== "function") throw new Error(`OpenAPI client is missing ${saveMethod}`);
      const args = options.saveArgs?.(document, signal) ?? { id: document.id, document, signal };
      const dto = (await method(args as never)) as TSaveDto;
      return normalizeCanvasDocument(extractDocument(dto));
    },
  };
}
