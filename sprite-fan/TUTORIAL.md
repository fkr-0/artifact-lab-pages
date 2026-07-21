# Sprite Fan — Quick Tutorial

Open `atlas-studio.html` in any browser. Zero dependencies.

## Single Sprite Workflow

1. **Load** — Click "Source Image" or drag-drop a PNG onto the canvas
2. **Clean** (optional) — Go to "Cleanup" tab → "Apply Remove BG" to strip white backgrounds
3. **Slice** — Return to "Import" tab → set frame size (use presets: Player 48×48, Boss 96×96, Tile 32×32) → "Slice by Grid"
4. **Review** — Check "Cleanup by Frame" tab for stray pixels, pinholes, jitter
5. **Export** — Go to "Export" tab → "Export PNG" for the sheet, "Export Manifest" for sprites.json

## Batch Queue (Multiple Sprites)

For processing many sprites from a DALL-E batch or manifest:

1. **Add sprites** — Click "Batch Queue" → "+ Add Sprites" (multi-select) or "Load Manifest" (pick sprites.json)
2. **Navigate** — Click any chip in the queue strip to jump to it
3. **Adjust** — Set frame size in Grid Slicing. Dimensions auto-detect from manifest/name patterns
4. **Proceed** — Click "Next →" (or press `N`) to mark done and move to next sprite
5. **Save patterns** — Click "Save Dims" to remember frame size for boss/enemy/character patterns, then "Apply Saved" to bulk-apply to remaining items

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next sprite (mark done) |
| `P` | Previous sprite |
| `D` | Mark current as done |
| `S` | Skip current sprite |
| `F` | Fit canvas to view |
| `O` | Toggle onion skin |
| `Space` + drag | Pan canvas |
| Scroll wheel | Zoom in/out (cursor-centered) |
| `←` `→` | Navigate frames in timeline |
| `M` | Toggle preview frame |
| `I` | Jump to next issue |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Dimension Presets

| Preset | Size | Anchor | Use For |
|--------|------|--------|---------|
| Player | 48×48 | 24,44 | Moss, enemies, companions |
| Item | 16×16 | 16,16 | Pickups |
| Boss | 96×96 | 48,88 | Bosses |
| Tile | 32×32 | 16,16 | World textures |

## Tips

- **Auto-detect**: When loading from manifest, frame sizes are pre-filled from `sprites.json`
- **Cell overrides**: In Grid Edit Mode, drag individual cells to fix non-uniform frames
- **Config save**: Click ⚙ to save/load all settings including cleanup thresholds
- **Contract export**: For Badger Runner/Ethic Brawl targets, use "Export Contract Pages" for strict 4×4 grids

## Troubleshooting

- **Image appears partial/offset**: Press `F` to fit to view, or scroll-wheel to zoom out
- **Can't pan**: Hold `Space` + drag, or middle-click drag
- **Canvas feels stuck**: Press `F` to reset view
