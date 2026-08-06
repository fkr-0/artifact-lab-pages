# Item Capabilities Roadmap

Canvas Studio items are moving from a fixed `image | text` model to capability-driven item families. Runtime support should stay lightweight while host apps provide heavyweight editors or media engines through capabilities.

## Text family

### Plaintext blocks

Plaintext remains the simple default. It now carries a semantic role so exporters, outline tools and graph tooling can treat blocks differently:

- `h1` ... `h6`
- `paragraph`
- `li`
- `ul`
- `pre`
- `code`

### Markdown blocks

Markdown blocks store source text and a `viewMode` of `source` or `rendered`. The built-in renderer is intentionally small and safe. Future integrations can provide a stronger markdown pipeline through a plugin/editor provider.

### Rich text blocks

Rich text stores sanitized HTML as `richTextHtml` while retaining text as the fallback/search/export representation. The canvas does not bundle a heavy rich-text editor; hosts can connect one through `CanvasCapabilities.textEditor`.

### Log blocks

Log blocks are append-only in the UI. Each entry has `id`, `ts`, `text` and optional `author`. The flattened `text` field is maintained for search, clipboard and simple exports.

## Link and web items

`link` items render as a preview card and can toggle to an iframe view. Iframes are best-effort: target sites may block embedding with CSP or frame policies. Hosts can provide preview data through a future `linkPreview` capability.

`web` items are the stricter embedding branch for hosts that know a URL is embeddable and want explicit `embedAllowed` semantics.

## Audio items

Audio items are now first-class runtime/document items. They keep media metadata and can optionally render an `<audio>` control when a runtime `src` is available.

The core canvas does not become an audio engine. Playback automation belongs to host-provided `CanvasCapabilities.audio` and graph relations such as `sequence-next` or `plays-after`.

## Image items

Image items support:

- non-destructive display scaling through item frame size;
- crop metadata;
- crop baking;
- slicing and cutting;
- simple baked effects: grayscale, sepia, old movie, high contrast, cartoon and cubist;
- external image editor bridge via `CanvasCapabilities.imageEditor` and the `cs:image-editor` event.

Later image work should add a real non-destructive effect stack UI, merge/composite operations, mask items and editor capability negotiation.

## External editor capability pattern

Heavy editors should be loaded by the host, not the core canvas. The current bridge is event/capability based:

- text items dispatch `cs:text-editor`;
- image context menu dispatches `cs:image-editor`;
- `CanvasStudio` calls the host capability if one is provided;
- returned results update the item and preserve normal undo/history semantics as far as current store operations allow.
