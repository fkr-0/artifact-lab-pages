import {
  type CanvasDocument,
  createCanvasPluginRegistry,
  createDefaultCanvasPluginRegistry,
} from "../../src/canvas-core";
import { assertDeepEqual, assertEqual } from "./assertions";

export function testPluginRegistryProvidesTypeScopedStats(): void {
  const registry = createCanvasPluginRegistry([
    {
      type: "audio",
      displayName: "Audio",
      getStats: (item) => ({ durationMs: item.data.durationMs }),
    },
  ]);

  const document: CanvasDocument = {
    schema: "canvas-studio-document",
    version: 1,
    items: [
      {
        id: "a1",
        type: "audio",
        frame: { x: 0, y: 0, width: 100, height: 50 },
        data: { durationMs: 1000 },
      },
      {
        id: "t1",
        type: "text",
        frame: { x: 0, y: 80, width: 100, height: 50 },
        data: { text: "ignored" },
      },
    ],
  };

  assertEqual(registry.get("audio")?.displayName, "Audio");
  assertDeepEqual(registry.statsForDocument(document), { audio: [{ durationMs: 1000 }] });
}

export function testDefaultCanvasPluginsCoverBuiltInRuntimeTypes(): void {
  const registry = createDefaultCanvasPluginRegistry();
  assertDeepEqual(
    registry.all().map((plugin) => plugin.type),
    ["image", "text", "link", "audio"],
  );
  assertEqual(registry.get("text")?.displayName, "Text");
  assertEqual(registry.get("link")?.displayName, "Link");
}

export function testDefaultCanvasPluginsExposeStatsExtractors(): void {
  const registry = createDefaultCanvasPluginRegistry();
  assertDeepEqual(
    registry.statsForItem({
      id: "a1",
      type: "audio",
      frame: { x: 0, y: 0, width: 100, height: 40 },
      data: { title: "Song", durationMs: 1234, sourceRef: "asset://song.mp3" },
    }),
    { durationMs: 1234, sourceRef: "asset://song.mp3" },
  );
}

export function testPluginRegistryDispatchesFirstHandledCommand(): void {
  const handled: string[] = [];
  const registry = createCanvasPluginRegistry([
    {
      type: "one",
      displayName: "One",
      commands: [() => false],
    },
    {
      type: "two",
      displayName: "Two",
      commands: [
        (command) => {
          handled.push(command.type);
          return true;
        },
      ],
    },
    {
      type: "three",
      displayName: "Three",
      commands: [
        () => {
          handled.push("should-not-run");
          return true;
        },
      ],
    },
  ]);

  const result = registry.dispatchCommand(
    { type: "custom", name: "plugin.test" },
    {
      document: {
        schema: "canvas-document/v1",
        version: 1,
        id: "doc",
        items: [],
      },
      selection: ["x"],
    },
  );

  assertEqual(result, true);
  assertDeepEqual(handled, ["custom"]);
}
