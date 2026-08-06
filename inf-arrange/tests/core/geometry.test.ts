import {
  canvasToScreen,
  rectFromCorners,
  rectsIntersect,
  screenToCanvas,
} from "../../src/canvas-core/geometry";
import { assert, assertDeepEqual } from "./assertions";

export function testGeometryIsAvailableFromFrameworkFreeCoreBoundary(): void {
  const viewport = { x: 10, y: 20, k: 2 };
  const screen = { x: 18, y: 32 };
  const canvas = screenToCanvas(screen, viewport);

  assertDeepEqual(canvas, { x: 4, y: 6 });
  assertDeepEqual(canvasToScreen(canvas, viewport), screen);
}

export function testCoreRectHelpersRemainPureAndSerializable(): void {
  const rect = rectFromCorners({ x: 10, y: 30 }, { x: -5, y: 12 });

  assertDeepEqual(rect, { x: -5, y: 12, w: 15, h: 18 });
  assert(rectsIntersect(rect, { x: 0, y: 0, w: 3, h: 20 }), "expected rectangles to intersect");
}
