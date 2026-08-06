import type { CanvasCommand, CanvasCommandContext, CanvasItemPlugin } from "./contracts";
import type { CanvasDocument, CanvasDocumentItem } from "./document";

export interface CanvasPluginRegistry {
  all: () => CanvasItemPlugin[];
  get: (type: string) => CanvasItemPlugin | undefined;
  register: (plugin: CanvasItemPlugin) => CanvasPluginRegistry;
  unregister: (type: string) => CanvasPluginRegistry;
  statsForItem: (item: CanvasDocumentItem) => Record<string, unknown>;
  statsForDocument: (document: CanvasDocument) => Record<string, unknown>;
  dispatchCommand: (command: CanvasCommand, context: CanvasCommandContext) => boolean;
}

export function createCanvasPluginRegistry(
  initialPlugins: CanvasItemPlugin[] = [],
): CanvasPluginRegistry {
  const plugins = new Map<string, CanvasItemPlugin>();
  for (const plugin of initialPlugins) plugins.set(plugin.type, plugin);

  const registry: CanvasPluginRegistry = {
    all: () => [...plugins.values()],
    get: (type) => plugins.get(type),
    register: (plugin) => {
      plugins.set(plugin.type, plugin);
      return registry;
    },
    unregister: (type) => {
      plugins.delete(type);
      return registry;
    },
    statsForItem: (item) => {
      const plugin = plugins.get(item.type);
      return plugin?.getStats?.(item) ?? {};
    },
    statsForDocument: (document) => {
      const byType: Record<string, unknown[]> = {};
      for (const item of document.items) {
        const stats = registry.statsForItem(item);
        if (Object.keys(stats).length === 0) continue;
        byType[item.type] = [...(byType[item.type] ?? []), stats];
      }
      return byType;
    },
    dispatchCommand: (command, context) => {
      for (const plugin of plugins.values()) {
        for (const handler of plugin.commands ?? []) {
          if (handler(command, context)) return true;
        }
      }
      return false;
    },
  };

  return registry;
}

export const DEFAULT_CANVAS_ITEM_PLUGINS: CanvasItemPlugin[] = [
  {
    type: "image",
    displayName: "Image",
    getStats: (item) => ({
      naturalWidth: item.data.naturalWidth,
      naturalHeight: item.data.naturalHeight,
      hasCrop: !!item.data.crop,
      effects: item.data.effects,
    }),
  },
  {
    type: "text",
    displayName: "Text",
    getStats: (item) => ({
      textKind: item.data.textKind ?? "plaintext",
      textRole: item.data.textRole ?? "paragraph",
      chars: typeof item.data.text === "string" ? item.data.text.length : 0,
    }),
  },
  {
    type: "link",
    displayName: "Link",
    getStats: (item) => ({
      url: item.data.url,
      viewMode: item.data.viewMode ?? "card",
    }),
  },
  {
    type: "audio",
    displayName: "Audio",
    getStats: (item) => ({
      durationMs: item.data.durationMs,
      sourceRef: item.data.sourceRef,
    }),
  },
];

export function createDefaultCanvasPluginRegistry(): CanvasPluginRegistry {
  return createCanvasPluginRegistry(DEFAULT_CANVAS_ITEM_PLUGINS);
}
