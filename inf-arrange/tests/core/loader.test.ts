import {
  CANVAS_DOCUMENT_SCHEMA,
  type CanvasDocument,
  createOpenApiCanvasDocumentLoader,
} from "../../src/canvas-core";
import { assertDeepEqual, assertEqual } from "./assertions";

export async function testOpenApiCanvasDocumentLoaderNormalizesLoadAndSaveDtos(): Promise<void> {
  const calls: string[] = [];
  const client = {
    async getCanvasDocument({ id }: { id: string }) {
      calls.push(`load:${id}`);
      return {
        document: {
          schema: CANVAS_DOCUMENT_SCHEMA,
          version: 1,
          id,
          items: [
            {
              id: "t1",
              type: "text",
              frame: { x: 1, y: 2, width: 100, height: 40 },
              data: { text: "from api" },
            },
          ],
        },
      };
    },
    async putCanvasDocument({ id, document }: { id: string; document: CanvasDocument }) {
      calls.push(`save:${id}:${document.items.length}`);
      return { document };
    },
  };

  const loader = createOpenApiCanvasDocumentLoader(client);
  const loaded = await loader.load("doc-1");
  assertEqual(loaded.id, "doc-1");
  assertEqual(loaded.items[0].frame.width, 100);

  const saved = await loader.save({ ...loaded, items: [] });
  assertDeepEqual(calls, ["load:doc-1", "save:doc-1:0"]);
  assertEqual(saved.items.length, 0);
}

export async function testOpenApiLoaderSupportsCustomDtoExtractors(): Promise<void> {
  const loader = createOpenApiCanvasDocumentLoader(
    {
      async getBoard({ id }: { id: string }) {
        return {
          board: { payload: { schema: CANVAS_DOCUMENT_SCHEMA, version: 1, id, items: [] } },
        };
      },
      async updateBoard({ id, payload }: { id: string; payload: CanvasDocument }) {
        return { board: { payload: { ...payload, id } } };
      },
    },
    {
      loadMethod: "getBoard",
      saveMethod: "updateBoard",
      loadArgs: (id) => ({ id }),
      saveArgs: (document) => ({ id: document.id ?? "new", payload: document }),
      extractDocument: (dto) => dto.board.payload,
    },
  );

  const loaded = await loader.load("custom");
  assertEqual(loaded.id, "custom");
  const saved = await loader.save(loaded);
  assertEqual(saved.id, "custom");
}
