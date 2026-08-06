import {
  CANVAS_DOCUMENT_SCHEMA,
  clearCanvasDocumentMigrationsForTests,
  normalizeCanvasDocument,
  registerCanvasDocumentMigration,
} from "../../src/canvas-core";
import { assertEqual } from "./assertions";

export function testDocumentMigrationRegistryRunsSequentialMigration(): void {
  clearCanvasDocumentMigrationsForTests();
  try {
    registerCanvasDocumentMigration(0, (document) => ({
      ...document,
      version: 1,
      schema: CANVAS_DOCUMENT_SCHEMA,
      items: [
        {
          id: "legacy-text",
          type: "text",
          frame: { x: 0, y: 0, width: 100, height: 50 },
          data: { text: String(document.legacyText ?? "") },
        },
      ],
    }));

    const migrated = normalizeCanvasDocument({ version: 0, legacyText: "hello migration" });
    assertEqual(migrated.version, 1);
    assertEqual(migrated.items.length, 1);
    assertEqual(migrated.items[0].id, "legacy-text");
    assertEqual(migrated.items[0].data.text, "hello migration");
  } finally {
    clearCanvasDocumentMigrationsForTests();
  }
}
