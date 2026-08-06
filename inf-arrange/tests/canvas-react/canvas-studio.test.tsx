import { createElement, createRef } from "react";
import { createCanvasPluginRegistry } from "../../src/canvas-core";
import {
  CanvasStudio,
  type CanvasStudioHandle,
  type CanvasStudioProps,
  dispatchCanvasStudioCommand,
} from "../../src/canvas-react";
import { createCanvasStore } from "../../src/store/canvas";
import { assert, assertDeepEqual, assertEqual } from "../core/assertions";

export function testCanvasStudioEmbeddableComponentExportsHandleType(): void {
  const ref = createRef<CanvasStudioHandle>();
  const element = createElement(CanvasStudio, {
    ref,
    showMinimap: false,
    showClipboardInspector: false,
  });

  assert(element, "React element should be created without mounting the SPA shell");
  assertEqual(element.type, CanvasStudio);
}

export function testCanvasStudioAcceptsPluginRegistryForCommandDispatch(): void {
  const plugins = createCanvasPluginRegistry();
  const props: CanvasStudioProps = {
    plugins,
    showMinimap: false,
    showClipboardInspector: false,
  };
  const element = createElement(CanvasStudio, props);

  assertEqual(element.props.plugins, plugins);
}

export function testCanvasStudioCommandDispatchReportsStructuredDocumentChange(): void {
  const store = createCanvasStore();
  const command = {
    type: "item.add" as const,
    item: {
      id: "reported-item",
      type: "text",
      frame: { x: 0, y: 0, width: 100, height: 40 },
      data: { text: "reported" },
    },
  };
  const observed = [] as unknown[];

  const result = dispatchCanvasStudioCommand({
    store,
    command,
    onDocumentChange: (document, change) => {
      observed.push({ itemIds: document.items.map((item) => item.id), change });
    },
  });

  assertEqual(result.ok, true);
  assertDeepEqual(observed, [
    {
      itemIds: ["reported-item"],
      change: result.ok ? result.change : null,
    },
  ]);
}
