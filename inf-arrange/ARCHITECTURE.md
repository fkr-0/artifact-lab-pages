# Canvas Studio Modularization Design

## Goal

Refactor Canvas Studio from a useful Vite artifact into a clean embeddable infinite-canvas component system. The canvas should remain usable as the current single-page app, but its core should become independent enough for future hosts/backends to load documents, save documents, register item types, attach domain editors, and consume graph/statistics APIs.

The target architecture is a small canvas kernel plus React bindings plus a thin demo/app shell.

## Principles

1. **Document first**: canvas state must round-trip through a versioned JSON-safe `CanvasDocument`.
2. **Embeddable by default**: future apps should mount `<CanvasStudio />` with props/callbacks instead of importing the whole SPA.
3. **Framework-free core**: schema, geometry, serialization, graph queries and commands must not depend on React, Mantine, DOM clipboard APIs, or the Vite shell.
4. **Plugin-driven item behavior**: item types provide renderers, editors, serializers, inspectors, stats and commands through a registry.
5. **Host-owned effects**: fetching, saving, auth, multi-user sync, audio playback, Monaco loading and image-editor loading belong to host adapters/capabilities.
6. **Gradual migration**: keep existing UX working while boundaries are introduced.

## Proposed layers

```text
src/
├── canvas-core/              # pure model, document schema, commands, graph/stats
├── canvas-react/             # embeddable React component API and providers
├── item-plugins/             # built-in image/text now; audio/graph/editor plugins later
├── app-shell/                # Vite SPA toolbar, modals, demo integration
└── index.ts                  # public exports for embedding
```

Initial implementation can keep everything in one repo/package. Later, `canvas-core` and `canvas-react` can become separate workspace packages.

## Public React boundary

```ts
export interface CanvasStudioProps {
  document?: CanvasDocument;
  defaultDocument?: CanvasDocument;
  mode?: "controlled" | "uncontrolled";
  plugins?: CanvasItemPlugin[];
  extensions?: CanvasExtension[];
  capabilities?: CanvasCapabilities;
  onDocumentChange?: (document: CanvasDocument, change: CanvasChange) => void;
  onCommand?: (command: CanvasCommand, context: CanvasCommandContext) => void | boolean;
  onSelectionChange?: (selection: string[]) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

The current SPA becomes one host of this component. A backend-backed app can provide a loader/saver. A multimedia app can provide audio capabilities. A collaborative app can provide operation transport.

## Canonical document model

The canonical data model is intentionally richer than the runtime `CanvasItem[]` union:

```ts
export interface CanvasDocument {
  schema: "canvas-studio-document";
  version: 1;
  id?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  viewport?: Viewport;
  items: CanvasDocumentItem[];
  relations?: CanvasRelation[];
  metadata?: Record<string, unknown>;
}

export interface CanvasDocumentItem {
  id: string;
  type: string;
  frame: { x: number; y: number; width: number; height: number; rotation?: number; zIndex?: number };
  label?: string;
  accent?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

Built-in adapters map the document to current runtime items. Unknown item types should be preserved as placeholders when possible, not silently destroyed.

## Plugin seam

Every item type should eventually be registered with a `CanvasItemPlugin`:

- `type` and display metadata;
- renderer component;
- optional editor launcher (Monaco for text, image editor for images, audio panel for audio);
- serialize/deserialize hooks;
- stats extractor;
- command handlers.

Text and image are the first built-in plugins. Audio, graph edges, code blocks, markdown, table and video can be later plugins.

## External interfaces

A generated OpenAPI client should implement a small loader interface rather than being imported by the canvas:

```ts
export interface CanvasDocumentLoader {
  load(id: string, signal?: AbortSignal): Promise<CanvasDocument>;
  save(document: CanvasDocument, signal?: AbortSignal): Promise<CanvasDocument>;
}
```

The same boundary can be implemented by REST, GraphQL, localStorage, IndexedDB, file import/export or collaboration transports.

## Multi-user direction

Do not make Zustand shared state the collaboration API. Emit stable `CanvasChange` records and later translate them into Yjs/Automerge/OT/CRDT operations. Selection and presence should be separate from document content.

## Graph/statistics direction

Relations and metadata should enable graph-style operations without contaminating React components. Core should expose pure queries for bounds, spatial clusters, selected subgraphs, type counts, relation traversal, media duration totals and layout candidates.

## Refactor strategy

1. Introduce `canvas-core` document schema and runtime adapters.
2. Add serialization/deserialization tests.
3. Add public `CanvasStudio` facade and `src/index.ts` exports.
4. Move app chrome toward `app-shell` and keep renderer isolated.
5. Introduce item plugin registry and migrate text/image behavior.
6. Replace direct UI mutations with command/change APIs.
7. Add OpenAPI loader and audio-playlist examples as host adapters, not core dependencies.
8. Add later extension tasks for Monaco, image editor, multi-user sync, graph/stats and multimedia playback.


## Current implementation status

The repository now has the first hard boundary pieces in place: versioned document schema, runtime adapters, loader/capability contracts, an embeddable React facade, pure core graph helpers, pure core geometry helpers, package exports, and a small core test harness. Unknown document item types are intentionally converted into runtime placeholders and can round-trip back to their original `CanvasDocumentItem.type`, which is the minimum safe behavior required for future OpenAPI, audio, multimedia, and plugin-backed canvases.

The remaining architectural risk is that the active canvas runtime still uses a single global Zustand store. The public `CanvasStudio` facade is therefore a compatibility wrapper, not yet a fully isolated multi-instance component. The next refactor should split app-shell wiring and store ownership so embedding hosts can mount multiple independent canvases and choose controlled or uncontrolled mode without shared mutable state.


## 2026-07-01 continuation notes

The second continuation slice added first-class link-item round-tripping, media graph helper functions and a generic OpenAPI loader adapter factory. `link` is now a built-in item type, while unknown/plugin types remain preserved as placeholders. Media support remains host-owned: the core can compute durations, missing/duplicate source refs and ordered playlist candidates, but it does not play audio or preload assets. Backend support remains adapter-owned: `createOpenApiCanvasDocumentLoader` wraps generated-client methods while keeping generated clients outside the canvas package.
