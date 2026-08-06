# Canvas Studio

An infinite canvas for arranging, slicing, cropping and resizing images and short text blocks. **100% client-side** — no backend, no server uploads, everything lives in the browser.

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite 5 |
| UI kit | Mantine 7 |
| State | Zustand |
| Pan / zoom | d3-zoom + d3-selection |
| Language | TypeScript (strict) |
| Lint / format | Biome |
| Package manager | pnpm |

PixiJS was considered but skipped — HTML/CSS positioning with a CSS-transformed layer delivers identical UX for the supported item counts (up to a few hundred) while keeping crop/slice/edit logic trivially debuggable. The architecture is intentionally decoupled from the renderer so a PixiJS swap-in is possible later.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production build into dist/
pnpm preview    # preview the build
pnpm lint       # biome check
pnpm format     # biome format --write
```

## Features

### Infinite canvas

- Smooth requestAnimationFrame mousewheel zoom centred on the cursor
- Pan with the middle mouse button (or space + drag — see roadmap)
- Persistent dotted grid that pans/scales with the viewport
- Origin crosshair so you always know where `(0, 0)` is
- Click/drag minimap with current viewport rectangle and selected-item highlights
- Zoom range 5% – 1600%

### Item types

- **Images** — pasted, dropped, or uploaded. Lossless until you commit a crop.
- **Text blocks** — yellow sticky-note style; double-click to edit inline.

### Selecting

- Click to select
- Shift+click to add/remove from selection
- Drag on empty canvas to rubber-band (marquee) select
- Ctrl/⌘+A to select all
- Esc to clear

### Manipulating

- Drag selected item(s) to move (delta is applied to all selected)
- Arrow keys nudge by 1 px (Shift = 10 px)
- Drag a handle (visible when selected) to resize that corner/edge
- **Shift+drag on body** = move constrained to the dominant axis
- **Alt+drag on body** = duplicate-and-drag, matching common diagram-editor behaviour
- **Ctrl/⌘+drag on body** = quick resize from south-east corner
- **Ctrl/⌘+Shift+drag on image** = crop (draws the kept region in place; non-destructive)
- Right-click → **Bake crop** to commit (produces a new lossless PNG)

### Image operations (right-click → context menu)

- **Slice into grid** — split an image into `rows × cols` cells with optional gutter. Each cell becomes a new item laid out at the original position.
- **Cut in two** — single straight cut, horizontal or vertical, at a chosen position. The original is replaced by half A; half B is appended next to it.
- **Bake crop** — commits the current non-destructive crop into a new image.

#
### Graph panel

The toolbar **⟲ Graph** button opens a graph/stats panel. It edits relations using the edge mini-language from `docs/graph-language.md`, validates edge endpoints against current item IDs, shows relation type counts, media duration stats, and previews `sequence-next` / `plays-after` chains for playlist-like workflows. Relations are also drawn directly on the canvas as curved directed edges.

## Shortcuts

| Action | Default |
| --- | --- |
| Duplicate | `Ctrl/⌘ + D` |
| Copy / Cut / Paste latest | `Ctrl/⌘ + C / X / V` |
| Paste from clip history | `Ctrl/⌘ + Shift + V`, then `A S D F H J K L` |
| Delete | `Del` / `Backspace` |
| Undo / Redo | `Ctrl/⌘ + Z` / `Shift+Ctrl/⌘+Z` (or `Ctrl/⌘ + Y`) |
| Select all | `Ctrl/⌘ + A` |
| Bring/send one step | `Ctrl/⌘ + ]` / `Ctrl/⌘ + [` |
| Bring to front / send to back | `Ctrl/⌘ + Shift + ]` / `Ctrl/⌘ + Shift + [` |
| Zoom in / out | `+` / `-` |
| Zoom to fit | `F` |
| Reset view | `Ctrl/⌘ + 0` |
| Cancel / clear selection | `Esc` |
| Edit selected text | `Ctrl/⌘ + Enter` |
| Nudge (1 px / 10 px) | `Arrow keys` / `Shift+Arrows` |

### Mouse gestures (draw.io-style defaults)

| Gesture | Context | Action |
| --- | --- | --- |
| Left click | item | Select |
| Left click | empty canvas | Clear selection |
| Left drag | item | Move |
| Left drag | empty canvas | Marquee select |
| Shift+Left click | any | Toggle in selection |
| Ctrl/Cmd+Left click | any | Toggle in selection |
| Shift+Left drag | item | Move constrained to dominant axis (H/V) |
| Alt+Left drag | item | Duplicate-and-drag (clones on first move) |
| Ctrl+Left drag | item | Resize (south-east corner) |
| Ctrl+Shift+Left drag | image | Crop |
| Middle drag | any | Pan canvas |
| Right click | any | Context menu |
| Wheel | any | Zoom (cursor-anchored) |

### Configurable keybindings

Open **Keybindings** from the toolbar to rebind any mouse gesture or keyboard shortcut. Mouse bindings are differentiated by:

- **Button** (left / middle / right)
- **Modifiers** (Ctrl / Shift / Alt, in any combination)
- **Context** (any / empty canvas / any item / image / text)

When multiple bindings match the same gesture, the most specific context wins (`image`/`text` beats `item` beats `any`). Bindings persist to `localStorage` and survive page reloads. The dialog flags conflicts (two bindings that would match the same gesture) with a red badge.

Click **Rebind** on any keyboard row, then press a new key combo. Click **Reset all to defaults** to return to the draw.io-style setup.

### Clipboard robustness

- Copy/cut stores a deep-cloned internal canvas selection for immediate paste and pushes a separate entry onto the Canvas Studio clipboard history stack.
- Copy/cut also attempts to write a Canvas Studio clipboard payload to the system clipboard. Browsers that reject custom MIME writes fall back to marked `text/plain`, so selections can still round-trip across tabs/windows where possible.
- `Ctrl/⌘+V` lets the native browser paste event run first, so OS clipboard images/text are not accidentally blocked by the internal shortcut handler. If no pasteable OS payload is exposed, Canvas Studio falls back to the latest in-memory selection clipboard.
- `Ctrl/⌘+Shift+V` opens the clipboard history palette. Press `A S D F H J K L`, click an entry, or use arrows+Enter to paste older Canvas Studio clips.
- Pasted canvas selections regenerate ids and preserve relative layout, placing the group near the recent pointer position or the viewport centre.

### Data sources

- **Clipboard paste** (`Ctrl/⌘+V`): latest Canvas Studio clip, OS images, raw base64 strings, `data:image/…` URLs, or plain text → text block. Internal copy/cut also writes a marked system-clipboard fallback when browser permissions allow it. `Ctrl/⌘+Shift+V` opens the multi-clip history for webapp-native selections.
- **Drag-and-drop** files from the file system onto the canvas (placed at the drop point).
- **Upload button** in the toolbar.
- **Media Manager → Replace** swaps an existing item's source while preserving position/size.

### Media Manager (modal)

Lists every item on the canvas with a thumbnail, dimensions, position, z-index, and selection state. Per-row actions:

- **Focus** — select only this item on the canvas (canvas pans into view via `F` if needed)
- **Replace** — swap the underlying image while keeping position/size/z-index
- **Remove** — delete from canvas
- Click a row (or Shift/Cmd+click) to multi-select; the canvas selection syncs live.

A filter input narrows by label / text content.

## Architecture

```
src/
├── main.tsx                    # bootstrap, Mantine CSS imports
├── App.tsx                     # AppShell + provider wiring + global context-menu suppression
├── styles.css                  # global CSS (canvas, items, handles, hints, context menu, …)
├── store/
│   ├── canvas.ts               # Zustand store: items, selection, viewport, history, clipboard
│   └── keybindings.ts          # Zustand+persist: configurable mouse + keyboard bindings
├── components/
│   ├── InfiniteCanvas.tsx      # surface + smooth wheel zoom + grid + item layer
│   ├── CanvasItemView.tsx      # one item: image body or text body + resize handles
│   ├── MarqueeOverlay.tsx      # rubber-band selection rectangle
│   ├── ContextMenu.tsx         # right-click menu (slice, cut, bake, z-order, zoom)
│   ├── MediaManager.tsx        # modal listing all items with replace/remove
│   ├── KeybindingsDialog.tsx   # searchable rebind UI; mouse + keyboard conflict detection
│   ├── Minimap.tsx             # viewport overview; click/drag recentering
│   ├── ClipboardHistoryPalette.tsx # Ctrl+Shift+V multi-clip chooser
│   ├── ClipboardInspector.tsx  # floating panel showing last clipboard contents
│   └── Toolbar.tsx             # top bar: upload, undo/redo, zoom, MM/KB buttons
├── hooks/
│   ├── useCanvasInteraction.ts # pointer state machine; resolves gestures via binding store
│   ├── useShortcuts.ts         # global keyboard shortcuts; reads from binding store
│   └── useGlobalPaste.ts       # window 'paste' handler → image/text/base64/data-URL
├── lib/
│   ├── clipboard.ts            # Canvas Studio clipboard payload serialization/fallbacks
│   ├── imageOps.ts             # load, extractRegion, sliceImage, cutImage, bakeCrop, …
│   ├── geometry.ts             # screenToCanvas, rectsIntersect, applyResize, clamp, …
│   ├── keybindingDefaults.ts   # draw.io-style default mouse + keyboard bindings
│   └── keybindingMatchers.ts   # matchMouseBinding, matchKeyBinding, conflict detection
├── types/
│   ├── index.ts                # CanvasItem union, Viewport, Rect, Point, DragMode, …
│   └── keybindings.ts          # KeyBinding, MouseBinding, ActionId, BindingContext
```

### Rendering model

A single CSS-transformed `<div>` (`cs-canvas-layer`) holds all item DOM. Its `transform: translate(x, y) scale(k)` is updated from the Zustand viewport, which itself is driven by `d3-zoom`. This means:

- The browser handles compositing — no per-frame React reconciliation of positions
- Items stay clickable / hoverable at any zoom
- Handles scale inversely so they remain a constant 9 CSS pixels regardless of zoom

### History

- Most mutations call `_pushHistory()` *before* applying, snapshotting the previous state
- Drag gestures snapshot at `pointerdown` (pre-drag state) and push to `past` at `pointerup` if the pointer actually moved — so a single drag = one undo step
- History is capped at 80 entries; `redo` is cleared on any new mutation

### Non-destructive crop

Crop is implemented with `background-image` + `background-position` + `background-size`, so the original pixel data is never modified. The crop rectangle is stored in source-pixel coordinates on the item. **Bake crop** is the only operation that re-encodes pixels (via a `<canvas>` toDataURL call).

## Roadmap (not implemented)

- Space + drag to pan with left mouse (currently middle-mouse only)
- Rotation handles
- Group items
- Export canvas as PNG / SVG
- PixiJS renderer swap for >1k items
- Touch / trackpad pinch gestures
