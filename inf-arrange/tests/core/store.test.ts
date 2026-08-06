import { createCanvasStore, createTextItem } from "../../src/store/canvas";
import { assertDeepEqual, assertEqual } from "./assertions";

export function testCanvasStoreFactoryCreatesIsolatedStores(): void {
  const left = createCanvasStore();
  const right = createCanvasStore();

  left.getState().addItems([createTextItem({ id: "left", text: "left" })]);
  right.getState().addItems([createTextItem({ id: "right", text: "right" })]);

  assertDeepEqual(
    left.getState().items.map((item) => item.id),
    ["left"],
  );
  assertDeepEqual(
    right.getState().items.map((item) => item.id),
    ["right"],
  );
  assertEqual(left.getState().selection[0], "left");
  assertEqual(right.getState().selection[0], "right");
}

export function testCanvasStoreRelationsAreUndoableRuntimeState(): void {
  const store = createCanvasStore();
  store
    .getState()
    .addItems([createTextItem({ id: "a", text: "A" }), createTextItem({ id: "b", text: "B" })]);
  store.getState().setRelations([
    { id: "r1", type: "sequence-next", sourceId: "a", targetId: "b" },
    { id: "r2", type: "references", sourceId: "b", targetId: "a" },
  ]);

  assertEqual(store.getState().relations.length, 2);
  store.getState().undo();
  assertDeepEqual(store.getState().relations, []);
  store.getState().redo();
  assertEqual(store.getState().relations.length, 2);
}

export function testCanvasStoreRelationsAreCleanedWhenItemsAreRemoved(): void {
  const store = createCanvasStore();
  store
    .getState()
    .addItems([createTextItem({ id: "a", text: "A" }), createTextItem({ id: "b", text: "B" })]);
  store
    .getState()
    .setRelations([{ id: "r1", type: "sequence-next", sourceId: "a", targetId: "b" }]);

  store.getState().removeItems(["a"]);

  assertEqual(store.getState().items.length, 1);
  assertDeepEqual(store.getState().relations, []);
}
