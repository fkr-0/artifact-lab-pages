import type { CanvasCommand } from "../../src/canvas-core";
import { createCanvasPluginRegistry } from "../../src/canvas-core";
import { createCanvasStore, dispatchCanvasCommand } from "../../src/store/canvas";
import { assertDeepEqual, assertEqual } from "./assertions";

export function testDispatchCanvasCommandAddsUpdatesSelectsAndRemovesItems(): void {
  const store = createCanvasStore();

  const addCommand: CanvasCommand = {
    type: "item.add",
    item: {
      id: "t1",
      type: "text",
      frame: { x: 1, y: 2, width: 120, height: 40, zIndex: 3 },
      data: { text: "hello", fontSize: 16, color: "#111", background: "#fff", align: "left" },
    },
  };

  assertEqual(dispatchCanvasCommand(store, addCommand).ok, true);
  assertEqual(store.getState().items[0].id, "t1");

  assertEqual(
    dispatchCanvasCommand(store, {
      type: "item.update",
      id: "t1",
      patch: { frame: { x: 10, y: 20, width: 120, height: 40 } },
    }).ok,
    true,
  );
  assertEqual(store.getState().items[0].x, 10);
  assertEqual(store.getState().items[0].y, 20);

  dispatchCanvasCommand(store, { type: "selection.set", ids: ["t1"] });
  assertDeepEqual(store.getState().selection, ["t1"]);

  dispatchCanvasCommand(store, { type: "item.remove", ids: ["t1"] });
  assertDeepEqual(store.getState().items, []);
  assertDeepEqual(store.getState().selection, []);
}

export function testDispatchCanvasCommandRejectsHostOwnedCommands(): void {
  const store = createCanvasStore();
  assertDeepEqual(dispatchCanvasCommand(store, { type: "document.save" }), {
    ok: false,
    reason: "host-owned-command",
  });
}

export function testDispatchCanvasCommandAddsAndRemovesRelations(): void {
  const store = createCanvasStore();

  assertEqual(
    dispatchCanvasCommand(store, {
      type: "relation.add",
      relation: {
        id: "r1",
        sourceId: "a",
        targetId: "b",
        label: "supports",
      },
    }).ok,
    true,
  );
  assertDeepEqual(store.getState().relations, [
    { id: "r1", sourceId: "a", targetId: "b", label: "supports" },
  ]);

  assertEqual(dispatchCanvasCommand(store, { type: "relation.remove", id: "r1" }).ok, true);
  assertDeepEqual(store.getState().relations, []);
}

export function testDispatchCanvasCommandCanDelegateCustomCommandsToPlugins(): void {
  const store = createCanvasStore();
  let observedSelection: string[] = [];
  const registry = createCanvasPluginRegistry([
    {
      type: "tool",
      displayName: "Tool",
      commands: [
        (_command, context) => {
          observedSelection = context.selection;
          return true;
        },
      ],
    },
  ]);

  store.getState().setSelection(["selected"]);
  const result = dispatchCanvasCommand(
    store,
    { type: "custom", name: "tool.run" },
    { plugins: registry },
  );

  assertEqual(result.ok, true);
  assertDeepEqual(observedSelection, ["selected"]);
}

export function testDispatchCanvasCommandReturnsStructuredChangeMetadata(): void {
  const store = createCanvasStore();
  const itemCommand: CanvasCommand = {
    type: "item.add",
    item: {
      id: "meta-item",
      type: "text",
      frame: { x: 0, y: 0, width: 10, height: 10 },
      data: { text: "tracked" },
    },
  };

  assertDeepEqual(dispatchCanvasCommand(store, itemCommand), {
    ok: true,
    command: itemCommand,
    change: {
      type: "command",
      action: "add",
      subject: "item",
      command: itemCommand,
      itemIds: ["meta-item"],
    },
  });

  const relationCommand: CanvasCommand = {
    type: "relation.remove",
    id: "missing-relation",
  };
  assertDeepEqual(dispatchCanvasCommand(store, relationCommand), {
    ok: true,
    command: relationCommand,
    change: {
      type: "command",
      action: "remove",
      subject: "relation",
      command: relationCommand,
      relationIds: ["missing-relation"],
    },
  });
}
