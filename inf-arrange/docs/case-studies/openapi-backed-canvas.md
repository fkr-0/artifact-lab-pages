# Case Study: OpenAPI-Backed Canvas Document

## Story

A host application has a backend exposing canvas documents through an OpenAPI-generated client. The app wants to embed Canvas Studio, fetch a document by ID, let the user arrange/edit items, and save changes back to the backend.

## Desired user flow

1. User opens `/boards/:id` in the host app.
2. Host calls `CanvasDocumentLoader.load(id)` using its generated OpenAPI client.
3. Host renders `<CanvasStudio document={document} onDocumentChange={...} />`.
4. User edits, moves, pastes and deletes items.
5. Canvas emits typed document changes or full normalized snapshots.
6. Host debounces or transactionally saves with `CanvasDocumentLoader.save(document)`.
7. Backend validates schema version and persists JSON plus asset references.

## Requirements

- Versioned `CanvasDocument` schema with validation and migration.
- Runtime adapters between `CanvasDocument` and current `CanvasItem` objects.
- Controlled/uncontrolled React component modes.
- `onDocumentChange(document, change)` callback.
- Clear error reporting when backend documents are invalid.
- Asset strategy: data URLs for small inline assets, external URL/object-store references for larger assets.
- Unknown item preservation so old clients do not destroy newer plugin data.
- Optional optimistic save status and conflict handling.

## Critical notes

The canvas should not import a generated OpenAPI client. The host owns the client and implements the loader interface. This avoids coupling the embeddable canvas to one backend and makes local file, IndexedDB and CRDT-backed documents equally possible.

## Minimal adapter sketch

```ts
const loader: CanvasDocumentLoader = {
  async load(id, signal) {
    const dto = await api.getCanvasDocument({ id }, { signal });
    return normalizeCanvasDocument(dto.document);
  },
  async save(document, signal) {
    const dto = await api.putCanvasDocument({ id: document.id, document }, { signal });
    return normalizeCanvasDocument(dto.document);
  },
};
```

## Feasibility checklist

- [x] Initial document schema and runtime adapters.
- [x] Loader interface export.
- [x] OpenAPI-style loader adapter factory export.
- [x] Controlled document prop support beyond current hydration facade.
- [x] Initial snapshot change event format.
- [ ] SPA import/export JSON commands.
- [x] Loader save example through `createOpenApiCanvasDocumentLoader`.
- [x] Initial validation/normalization tests for unsafe document values.


## Current implementation notes

- Backend/plugin item types unknown to this client now become runtime `unknown` placeholders and round-trip to their original document type.
- This makes OpenAPI-fed documents safer because newer server-side/plugin item data is not silently destroyed by older clients.
- The remaining critical gap is per-instance store ownership: the current facade can hydrate from a provided document and emit snapshots, but active editing state still flows through the shared Zustand store.
- `createOpenApiCanvasDocumentLoader(client, options?)` now covers the generated-client adapter shape without importing any generated client into canvas core.
