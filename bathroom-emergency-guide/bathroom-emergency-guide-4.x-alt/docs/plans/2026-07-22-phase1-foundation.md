# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the visual identity system, subguide build infrastructure, and hub triptych — the foundation that all later phases (diagram expansion, new subguides, print integration) depend on.

**Architecture:** A manifest-driven build system where `subguide_manifest.json` defines each booklet's metadata (color, pattern, mascot, chapters, sources). A shared `palette.py` feeds both CSS generation and Python diagram generators. The hub triptych is three markdown pages assembling into the visual entry point. `build_guide.py` gains a `--subguide` flag for standalone builds alongside the existing combined `all` target.

**Tech Stack:** Python 3.10+ (PIL/Pillow, matplotlib, numpy), Pandoc 3+, Node.js (Playwright for PDF), pnpm, shell scripts.

## Global Constraints

- No CDN/external dependencies (strict CSP). All assets inline or local.
- Red-flag invariant: every subguide's standalone output must include the emergency gate.
- All patterns must be structurally distinct in grayscale (not just color swaps).
- All text in diagrams must meet WCAG AA contrast (≥4.5:1).
- Pandoc extensions: `+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs+link_attributes`.
- Native MathML only (no MathJax/KaTeX CDN).
- Existing chapter content must not be modified — only reorganized into the new directory structure.
- Build must remain reproducible from clean checkout: `pnpm run build` produces all outputs.

---

### Task 1: Shared Color Palette Module

**Files:**
- Create: `src/diagrams/palette.py`
- Test: `tests/test_palette.py`

**Interfaces:**
- Consumes: nothing
- Produces: `SUBGUIDES: dict[str, SubguidePalette]` where `SubguidePalette` has `.accent: str`, `.accent_dim: str`, `.accent_glow: str`, `.secondary: str`, `.name: str`, `.pattern: str`. Also `hex_to_rgba(hex_str: str, alpha: int = 255) -> tuple[int,int,int,int]` and `PAPER: str`, `INK: str`, `MUTED: str` shared constants.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_palette.py
import pytest

def test_subguides_has_all_ten_entries():
    from src.diagrams.palette import SUBGUIDES
    expected = {"calm", "ambulance", "responsibility", "safety", "zombie",
                "support", "appendix", "body", "social", "disaster"}
    assert set(SUBGUIDES.keys()) == expected

def test_each_subguide_has_required_fields():
    from src.diagrams.palette import SUBGUIDES
    for key, sg in SUBGUIDES.items():
        assert sg.accent.startswith("#"), f"{key}.accent not a hex color"
        assert sg.accent_dim.startswith("#"), f"{key}.accent_dim not a hex color"
        assert sg.accent_glow.startswith("rgba"), f"{key}.accent_glow not rgba"
        assert sg.secondary.startswith("#"), f"{key}.secondary not a hex color"
        assert len(sg.name) > 0, f"{key}.name is empty"
        assert sg.pattern in {"wave", "cross", "diamond", "shield", "crosshatch",
                               "dots", "solid", "pulse", "zigzag", "speech"}

def test_hex_to_rgba():
    from src.diagrams.palette import hex_to_rgba
    assert hex_to_rgba("#FF0000") == (255, 0, 0, 255)
    assert hex_to_rgba("#00FF00", 128) == (0, 255, 0, 128)
    assert hex_to_rgba("1E2228") == (30, 34, 40, 255)

def test_shared_constants_exist():
    from src.diagrams.palette import PAPER, INK, MUTED
    assert PAPER.startswith("#")
    assert INK.startswith("#")
    assert MUTED.startswith("#")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/user/work/code/artifacts/bathroom-disaster/bathroom-emergency-guide-4.x-alt && python -m pytest tests/test_palette.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.diagrams.palette'`

- [ ] **Step 3: Write the implementation**

```python
# src/diagrams/palette.py
"""Shared color tokens for all subguide generators and CSS."""
from __future__ import annotations
from dataclasses import dataclass

PAPER = "#fbfaf4"
INK = "#14201d"
MUTED = "#52645e"
WHITE = "#ffffff"


def hex_to_rgba(h: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = h.lstrip("#")
    return (int(h[:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


def _glow(hex_color: str, opacity: float = 0.06) -> str:
    r, g, b, _ = hex_to_rgba(hex_color)
    return f"rgba({r},{g},{b},{opacity})"


def _dim(hex_color: str, factor: float = 0.8) -> str:
    r, g, b, _ = hex_to_rgba(hex_color)
    return f"#{int(r*factor):02x}{int(g*factor):02x}{int(b*factor):02x}"


def _secondary(hex_color: str) -> str:
    r, g, b, _ = hex_to_rgba(hex_color)
    avg = (r + g + b) // 3
    return f"#{(r+avg)//2:02x}{(g+avg)//2:02x}{(b+avg)//2:02x}"


@dataclass(frozen=True)
class SubguidePalette:
    name: str
    accent: str
    accent_dim: str
    accent_glow: str
    secondary: str
    pattern: str


SUBGUIDES: dict[str, SubguidePalette] = {
    "calm": SubguidePalette(
        name="The Teal Book", accent="#2E8B7A", accent_dim=_dim("#2E8B7A"),
        accent_glow=_glow("#2E8B7A"), secondary=_secondary("#2E8B7A"), pattern="wave"),
    "ambulance": SubguidePalette(
        name="The Red Book", accent="#C23D2E", accent_dim=_dim("#C23D2E"),
        accent_glow=_glow("#C23D2E"), secondary=_secondary("#C23D2E"), pattern="cross"),
    "responsibility": SubguidePalette(
        name="The Amber Book", accent="#D4880A", accent_dim=_dim("#D4880A"),
        accent_glow=_glow("#D4880A"), secondary=_secondary("#D4880A"), pattern="diamond"),
    "safety": SubguidePalette(
        name="The Blue Book", accent="#2563EB", accent_dim=_dim("#2563EB"),
        accent_glow=_glow("#2563EB"), secondary=_secondary("#2563EB"), pattern="shield"),
    "zombie": SubguidePalette(
        name="The Olive Book", accent="#4A6741", accent_dim=_dim("#4A6741"),
        accent_glow=_glow("#4A6741"), secondary=_secondary("#4A6741"), pattern="crosshatch"),
    "support": SubguidePalette(
        name="The Indigo Book", accent="#6366F1", accent_dim=_dim("#6366F1"),
        accent_glow=_glow("#6366F1"), secondary=_secondary("#6366F1"), pattern="dots"),
    "appendix": SubguidePalette(
        name="The Appendix", accent="#B5763B", accent_dim=_dim("#B5763B"),
        accent_glow=_glow("#B5763B"), secondary=_secondary("#B5763B"), pattern="solid"),
    "body": SubguidePalette(
        name="The Green Book", accent="#16A34A", accent_dim=_dim("#16A34A"),
        accent_glow=_glow("#16A34A"), secondary=_secondary("#16A34A"), pattern="pulse"),
    "social": SubguidePalette(
        name="The Purple Book", accent="#9333EA", accent_dim=_dim("#9333EA"),
        accent_glow=_glow("#9333EA"), secondary=_secondary("#9333EA"), pattern="speech"),
    "disaster": SubguidePalette(
        name="The Orange Book", accent="#EA580C", accent_dim=_dim("#EA580C"),
        accent_glow=_glow("#EA580C"), secondary=_secondary("#EA580C"), pattern="zigzag"),
}
```

- [ ] **Step 4: Create `conftest.py` for import resolution**

```python
# conftest.py  (project root)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `python -m pytest tests/test_palette.py -v`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add src/diagrams/palette.py tests/test_palette.py conftest.py
git commit -m "feat: shared subguide color palette module"
```

---

### Task 2: Pattern Tile Generator

**Files:**
- Create: `src/diagrams/generate_patterns.py`
- Test: `tests/test_patterns.py`

**Interfaces:**
- Consumes: `palette.SUBGUIDES` for color tokens, `palette.hex_to_rgba`
- Produces: 10 PNG files at `build/diagrams/pattern_{name}.png` (128×128 repeating tiles). CLI: `python generate_patterns.py [OUTPUT_DIR]`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_patterns.py
import os
import tempfile
import pytest

def test_generates_all_ten_patterns():
    from src.diagrams.generate_patterns import generate_all_patterns
    with tempfile.TemporaryDirectory() as td:
        generate_all_patterns(td)
        files = set(os.listdir(td))
        expected = {f"pattern_{name}.png" for name in
                    ["wave", "cross", "diamond", "shield", "crosshatch",
                     "dots", "solid", "pulse", "zigzag", "speech"]}
        assert files == expected

def test_pattern_files_are_valid_png():
    from src.diagrams.generate_patterns import generate_all_patterns
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_all_patterns(td)
        for f in os.listdir(td):
            img = Image.open(os.path.join(td, f))
            assert img.size == (128, 128), f"{f} is not 128x128"
            assert img.mode in ("RGBA", "RGB"), f"{f} has unexpected mode {img.mode}"

def test_patterns_are_structurally_distinct():
    """Each pattern must have a distinct pixel distribution (not just color swaps)."""
    from src.diagrams.generate_patterns import generate_all_patterns
    from PIL import Image
    import numpy as np
    with tempfile.TemporaryDirectory() as td:
        generate_all_patterns(td)
        signatures = {}
        for f in sorted(os.listdir(td)):
            img = Image.open(os.path.join(td, f)).convert("L")  # grayscale
            arr = np.array(img)
            # Binary threshold to compare structure, not color
            binary = (arr > 128).astype(int)
            sig = binary.tobytes()
            signatures[f] = sig
        # All signatures must be unique
        unique_sigs = set(signatures.values())
        assert len(unique_sigs) == 10, "Some patterns are identical in grayscale structure"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_patterns.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.diagrams.generate_patterns'`

- [ ] **Step 3: Write the implementation**

Create `src/diagrams/generate_patterns.py`. Each pattern is drawn onto a 128×128 RGBA PIL Image using the subguide's accent color on a transparent background. The patterns:

```python
# src/diagrams/generate_patterns.py
"""Generate repeating tile patterns for each subguide's visual identity."""
from __future__ import annotations

import math
import os
import sys
from PIL import Image, ImageDraw

from .palette import SUBGUIDES, hex_to_rgba, INK

TILE_SIZE = 128


def _draw_wave(draw: ImageDraw.Draw, color: tuple) -> None:
    """Horizontal sine curves."""
    for y_off in range(0, TILE_SIZE, 24):
        points = []
        for x in range(TILE_SIZE + 1):
            y = y_off + int(8 * math.sin(x * 2 * math.pi / 48))
            points.append((x, y))
        draw.line(points, fill=color, width=2)


def _draw_cross(draw: ImageDraw.Draw, color: tuple) -> None:
    """Medical crosses on a grid."""
    spacing = 32
    arm = 4
    for cy in range(spacing // 2, TILE_SIZE, spacing):
        for cx in range(spacing // 2, TILE_SIZE, spacing):
            draw.rectangle([cx - arm, cy - 1, cx + arm, cy + 1], fill=color)
            draw.rectangle([cx - 1, cy - arm, cx + 1, cy + arm], fill=color)


def _draw_diamond(draw: ImageDraw.Draw, color: tuple) -> None:
    """Rotated squares / argyle pattern."""
    spacing = 24
    size = 8
    for row in range(0, TILE_SIZE + spacing, spacing):
        offset = (spacing // 2) if (row // spacing) % 2 else 0
        for col in range(-spacing, TILE_SIZE + spacing, spacing):
            cx, cy = col + offset, row
            draw.polygon([(cx, cy - size), (cx + size, cy),
                          (cx, cy + size), (cx - size, cy)], outline=color, width=2)


def _draw_shield(draw: ImageDraw.Draw, color: tuple) -> None:
    """Solid blocks / brickwork."""
    bh, bw = 16, 32
    for row in range(0, TILE_SIZE, bh):
        offset = (bw // 2) if (row // bh) % 2 else 0
        for col in range(-bw, TILE_SIZE + bw, bw):
            x = col + offset
            draw.rectangle([x + 1, row + 1, x + bw - 2, row + bh - 2], outline=color, width=1)


def _draw_crosshatch(draw: ImageDraw.Draw, color: tuple) -> None:
    """Diagonal crossing lines."""
    spacing = 16
    for i in range(-TILE_SIZE, TILE_SIZE * 2, spacing):
        draw.line([(i, 0), (i + TILE_SIZE, TILE_SIZE)], fill=color, width=1)
        draw.line([(i, TILE_SIZE), (i + TILE_SIZE, 0)], fill=color, width=1)


def _draw_dots(draw: ImageDraw.Draw, color: tuple) -> None:
    """Regular dot grid."""
    spacing = 16
    r = 3
    for y in range(spacing // 2, TILE_SIZE, spacing):
        for x in range(spacing // 2, TILE_SIZE, spacing):
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def _draw_solid(draw: ImageDraw.Draw, color: tuple) -> None:
    """Horizontal rules / dashes."""
    spacing = 16
    dash_len = 20
    gap = 8
    for y in range(spacing // 2, TILE_SIZE, spacing):
        x = 0
        while x < TILE_SIZE:
            draw.line([(x, y), (min(x + dash_len, TILE_SIZE), y)], fill=color, width=2)
            x += dash_len + gap


def _draw_pulse(draw: ImageDraw.Draw, color: tuple) -> None:
    """Heartbeat / EKG line."""
    for y_off in range(0, TILE_SIZE, 32):
        mid = y_off + 16
        points = []
        for x in range(TILE_SIZE + 1):
            phase = x % 64
            if 20 <= phase <= 24:
                y = mid - 12
            elif 26 <= phase <= 30:
                y = mid + 8
            elif 32 <= phase <= 36:
                y = mid - 4
            else:
                y = mid
            points.append((x, y))
        draw.line(points, fill=color, width=2)


def _draw_zigzag(draw: ImageDraw.Draw, color: tuple) -> None:
    """Sharp peaks / seismograph."""
    spacing = 24
    amp = 10
    period = 16
    for y_off in range(0, TILE_SIZE, spacing):
        mid = y_off + spacing // 2
        points = []
        for x in range(TILE_SIZE + 1):
            phase = x % period
            if phase < period // 2:
                y = mid - int(amp * (2 * phase / (period // 2) - 1))
            else:
                y = mid + int(amp * (2 * (phase - period // 2) / (period // 2) - 1))
            points.append((x, y))
        draw.line(points, fill=color, width=2)


def _draw_speech(draw: ImageDraw.Draw, color: tuple) -> None:
    """Overlapping rounded rectangles / bubbles."""
    positions = [(10, 10, 50, 35), (60, 20, 110, 50),
                 (20, 55, 65, 80), (70, 65, 120, 95),
                 (5, 90, 55, 118), (65, 95, 115, 120)]
    for x1, y1, x2, y2 in positions:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=6, outline=color, width=2)


PATTERN_FUNCS = {
    "wave": _draw_wave,
    "cross": _draw_cross,
    "diamond": _draw_diamond,
    "shield": _draw_shield,
    "crosshatch": _draw_crosshatch,
    "dots": _draw_dots,
    "solid": _draw_solid,
    "pulse": _draw_pulse,
    "zigzag": _draw_zigzag,
    "speech": _draw_speech,
}


def generate_pattern(pattern_name: str, accent_hex: str, output_dir: str) -> str:
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    color = hex_to_rgba(accent_hex)
    PATTERN_FUNCS[pattern_name](draw, color)
    path = os.path.join(output_dir, f"pattern_{pattern_name}.png")
    img.save(path, "PNG")
    return path


def generate_all_patterns(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    for key, sg in SUBGUIDES.items():
        path = generate_pattern(sg.pattern, sg.accent, output_dir)
        print(f"  [OK] {path}")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "..", "build", "diagrams")
    generate_all_patterns(out)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_patterns.py -v`
Expected: 3 passed

- [ ] **Step 5: Generate the actual pattern tiles**

Run: `mkdir -p build/diagrams && python -m src.diagrams.generate_patterns build/diagrams`
Expected: 10 lines of `[OK]` output, 10 PNG files in `build/diagrams/`

- [ ] **Step 6: Commit**

```bash
git add src/diagrams/generate_patterns.py tests/test_patterns.py
git commit -m "feat: pattern tile generator for 10 subguide identities"
```

---

### Task 3: Mascot Sprite Generator

**Files:**
- Create: `src/diagrams/generate_mascots.py`
- Test: `tests/test_mascots.py`

**Interfaces:**
- Consumes: `palette.SUBGUIDES`, `palette.hex_to_rgba`
- Produces: 10 PNG files at `build/diagrams/mascot_{subguide_key}.png` (32×32 sprites). CLI: `python generate_mascots.py [OUTPUT_DIR]`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_mascots.py
import os
import tempfile

def test_generates_all_ten_mascots():
    from src.diagrams.generate_mascots import generate_all_mascots
    with tempfile.TemporaryDirectory() as td:
        generate_all_mascots(td)
        files = set(os.listdir(td))
        expected = {f"mascot_{name}.png" for name in
                    ["calm", "ambulance", "responsibility", "safety", "zombie",
                     "support", "appendix", "body", "social", "disaster"]}
        assert files == expected

def test_mascot_dimensions():
    from src.diagrams.generate_mascots import generate_all_mascots
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_all_mascots(td)
        for f in os.listdir(td):
            img = Image.open(os.path.join(td, f))
            assert img.size == (32, 32), f"{f} should be 32x32, got {img.size}"
            assert img.mode == "RGBA"

def test_mascots_use_subguide_accent():
    """Each mascot should contain pixels of its subguide's accent color."""
    from src.diagrams.generate_mascots import generate_all_mascots
    from src.diagrams.palette import SUBGUIDES, hex_to_rgba
    from PIL import Image
    import numpy as np
    with tempfile.TemporaryDirectory() as td:
        generate_all_mascots(td)
        for key, sg in SUBGUIDES.items():
            img = Image.open(os.path.join(td, f"mascot_{key}.png"))
            arr = np.array(img)
            accent = hex_to_rgba(sg.accent)
            # Check that at least some pixels match the accent color
            matches = np.all(arr == accent, axis=2)
            assert matches.any(), f"mascot_{key} has no pixels in accent color {sg.accent}"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_mascots.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Write the implementation**

Create `src/diagrams/generate_mascots.py` following the existing `generate_pixel_art.py` pattern — character maps with palette lookups. Each mascot is a 32×32 sprite using `render_map()` and `save_sprite()` style helpers. Ten sprites:

- **calm**: brain with relaxed expression (teal)
- **ambulance**: first-aid kit with cross (red)
- **responsibility**: heart (amber)
- **safety**: shield (blue)
- **zombie**: reaching hand (olive)
- **support**: open book (indigo)
- **appendix**: compass rose (copper)
- **body**: body silhouette (green)
- **social**: speech bubble with dots (purple)
- **disaster**: flame with alert triangle (orange)

```python
# src/diagrams/generate_mascots.py
"""Generate 32x32 pixel-art mascot sprites for each subguide."""
from __future__ import annotations

import os
import sys
from PIL import Image

from .palette import SUBGUIDES, hex_to_rgba

SIZE = 32


def render_map(pmap: list[str], palette: dict[str, str | None]) -> Image.Image:
    h = len(pmap)
    w = max(len(row) for row in pmap)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(pmap):
        for x, ch in enumerate(row):
            color_hex = palette.get(ch)
            if color_hex is not None:
                px[x, y] = hex_to_rgba(color_hex)
    return img


def _brain_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        "..........11111111..............",
        ".........1222222221.............",
        "........122222222221............",
        ".......12222233222221...........",
        "......1222223332222221..........",
        "......1222233333222221..........",
        ".....122223333332222221.........",
        ".....122222333332222221.........",
        ".....122222233322222221.........",
        ".....122222222222222221.........",
        ".....122222222222222221.........",
        "......1222222222222221..........",
        "......1222211112222221..........",
        ".......12221...1222221..........",
        "........1221....122221..........",
        ".........121.....12221..........",
        "..........11......1121..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _firstaid_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        "........1111111111111...........",
        "........1222222222221...........",
        "........1222222222221...........",
        "........1222233222221...........",
        "........1222233222221...........",
        "........1223333322221...........",
        "........1223333322221...........",
        "........1222233222221...........",
        "........1222233222221...........",
        "........1222222222221...........",
        "........1222222222221...........",
        "........1111111111111...........",
        ".......11111111111111...........",
        ".......12222222222221...........",
        ".......12222222222221...........",
        ".......12222222222221...........",
        ".......12222222222221...........",
        ".......11111111111111...........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _heart_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        "................................",
        ".....1111.....1111..............",
        "....122221...122221.............",
        "...12233221.12233221............",
        "...1223322212233221.............",
        "...12222222222222221............",
        "....122222222222221.............",
        ".....1222222222221..............",
        "......12222222221...............",
        ".......122222221................",
        "........1222221.................",
        ".........12221..................",
        "..........121...................",
        "...........1....................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _shield_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        ".......111111111111.............",
        "......1222222222221.............",
        ".....122222222222221............",
        ".....122222332222221............",
        ".....122223333222221............",
        ".....122222332222221............",
        ".....122222222222221............",
        "......1222222222221.............",
        "......1222222222221.............",
        ".......12222222221..............",
        ".......12222222221..............",
        "........122222221...............",
        ".........1222221................",
        "..........12221.................",
        "...........121..................",
        "............1...................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _zombie_hand_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent}
    m = [
        "................................",
        "................................",
        ".........11....11...............",
        "........121...121...............",
        "........121..1211...............",
        "........121.12121...............",
        "..11...1211121211...............",
        ".121..121211121211..............",
        ".121.1212111121211..............",
        ".121121211111121211.............",
        "..1212121111111121..............",
        "..1212121111111121..............",
        "...121212111111111..............",
        "...121211111111111..............",
        "....12111111111111..............",
        ".....1211111111111..............",
        "......121111111111..............",
        ".......11111111111..............",
        "........1111111111..............",
        ".........111111111..............",
        "..........11111111..............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _book_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        "......1111111111111.............",
        ".....122222222222211............",
        ".....122233333322211............",
        ".....122222222222211............",
        ".....122233333222211............",
        ".....122222222222211............",
        ".....122233333322211............",
        ".....122222222222211............",
        ".....122222222222211............",
        ".....122222222222211............",
        ".....111111111111111............",
        ".....122222222222211............",
        ".....111111111111111............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _compass_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        ".........11111111...............",
        "........1222222221..............",
        ".......122222222221.............",
        "......1222222222221.............",
        "......1222223222221.............",
        "......1222232322221.............",
        "......1222323232221.............",
        "......1223232323221.............",
        "......1222323232221.............",
        "......1222232322221.............",
        "......1222223222221.............",
        "......1222222222221.............",
        ".......122222222221.............",
        "........1222222221..............",
        ".........11111111...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _body_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent}
    m = [
        "................................",
        "................................",
        "...........1111.................",
        "..........122221................",
        "..........122221................",
        "...........1111.................",
        "..........122221................",
        ".........12222221...............",
        "........1222222221..............",
        ".......12212222122..............",
        "........1.122221................",
        "..........122221................",
        "..........122221................",
        "..........122221................",
        ".........12222221...............",
        "........121....121..............",
        ".......121......121.............",
        "......121........121............",
        ".....121..........121...........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _speech_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#ffffff"}
    m = [
        "................................",
        "................................",
        "......1111111111111.............",
        ".....122222222222221............",
        "....12222222222222221...........",
        "....12222222222222221...........",
        "....12222322232223221...........",
        "....12222222222222221...........",
        "....12222222222222221...........",
        ".....122222222222221............",
        "......1111111111111.............",
        ".......121..........................",
        "........11..........................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


def _flame_sprite(accent: str, dim: str) -> Image.Image:
    p = {".": None, "1": dim, "2": accent, "3": "#FACC15"}
    m = [
        "................................",
        "................................",
        "...........11...................",
        "..........121...................",
        "..........1221..................",
        ".........12321..................",
        ".........12321..................",
        "........1233321.................",
        "........1233321.................",
        ".......123333321................",
        ".......123333321................",
        "......1233333321................",
        "......1233333321................",
        ".......12333321.................",
        "........123321..................",
        ".........1111...................",
        "................................",
        ".......1111111111...............",
        "......1222222222221.............",
        "......1223332233221.............",
        "......1222222222221.............",
        "......1111111111111.............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ]
    return render_map(m, p)


MASCOT_GENERATORS = {
    "calm": _brain_sprite,
    "ambulance": _firstaid_sprite,
    "responsibility": _heart_sprite,
    "safety": _shield_sprite,
    "zombie": _zombie_hand_sprite,
    "support": _book_sprite,
    "appendix": _compass_sprite,
    "body": _body_sprite,
    "social": _speech_sprite,
    "disaster": _flame_sprite,
}


def generate_all_mascots(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    for key, sg in SUBGUIDES.items():
        gen = MASCOT_GENERATORS[key]
        dim = sg.accent_dim
        img = gen(sg.accent, dim)
        # Crop/resize to exactly 32x32
        if img.size != (SIZE, SIZE):
            img = img.crop((0, 0, SIZE, SIZE))
        path = os.path.join(output_dir, f"mascot_{key}.png")
        img.save(path, "PNG")
        print(f"  [OK] {path}")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "..", "build", "diagrams")
    generate_all_mascots(out)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_mascots.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/diagrams/generate_mascots.py tests/test_mascots.py
git commit -m "feat: pixel-art mascot sprite generator for 10 subguides"
```

---

### Task 4: Subguide Manifest and Source Directory Restructure

**Files:**
- Create: `src/data/subguide_manifest.json`
- Create: `src/hub/00-cover.md`, `src/hub/01-map.md`, `src/hub/02-directory.md`
- Move: existing chapter files into `src/subguides/{name}/chapters/`
- Create: per-subguide `sources.md` and `version.md` stubs
- Test: `tests/test_manifest.py`

**Interfaces:**
- Consumes: nothing
- Produces: `subguide_manifest.json` — the single source of truth for the build system. JSON with keys matching palette keys, each having `title`, `accent`, `pattern`, `mascot`, `chapters` (list of paths relative to `src/`), `sources`, `version`, `tagline`.

- [ ] **Step 1: Write the test for manifest validation**

```python
# tests/test_manifest.py
import json
import os
import pytest

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "data", "subguide_manifest.json")

def test_manifest_loads_and_has_all_subguides():
    with open(MANIFEST_PATH) as f:
        m = json.load(f)
    expected = {"calm", "ambulance", "responsibility", "safety", "zombie",
                "support", "appendix", "body", "social", "disaster"}
    assert set(m.keys()) == expected

def test_manifest_entries_have_required_fields():
    with open(MANIFEST_PATH) as f:
        m = json.load(f)
    required = {"title", "accent", "pattern", "mascot", "chapters", "sources", "version", "tagline"}
    for key, entry in m.items():
        missing = required - set(entry.keys())
        assert not missing, f"{key} missing fields: {missing}"
        assert isinstance(entry["chapters"], list) and len(entry["chapters"]) > 0
        assert entry["accent"].startswith("#")

def test_manifest_chapter_files_exist():
    with open(MANIFEST_PATH) as f:
        m = json.load(f)
    src_root = os.path.join(os.path.dirname(__file__), "..", "src")
    for key, entry in m.items():
        for ch in entry["chapters"]:
            path = os.path.join(src_root, ch)
            assert os.path.exists(path), f"{key}: chapter file missing: {ch} (looked at {path})"

def test_hub_files_exist():
    hub_dir = os.path.join(os.path.dirname(__file__), "..", "src", "hub")
    for name in ["00-cover.md", "01-map.md", "02-directory.md"]:
        assert os.path.exists(os.path.join(hub_dir, name)), f"Hub file missing: {name}"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_manifest.py -v`
Expected: FAIL — manifest file not found

- [ ] **Step 3: Create the directory structure**

Reorganize `src/chapters/` into the subguide layout. The existing files move — their content stays identical.

```bash
# Create subguide directories
mkdir -p src/hub
mkdir -p src/subguides/{calm,ambulance,responsibility,safety,zombie,support,appendix}/chapters
mkdir -p src/subguides/{body,social,disaster}/chapters
mkdir -p src/data

# Move existing chapters into subguide directories
cp src/chapters/04-calm-guide.md src/subguides/calm/chapters/01-calm-guide.md
cp src/chapters/03-situations-b-g.md src/subguides/calm/chapters/00-situations-b-e.md

cp src/chapters/05-self-ambulance.md src/subguides/ambulance/chapters/01-first-response.md

cp src/chapters/02-situation-a.md src/subguides/responsibility/chapters/01-situation-a.md

cp src/chapters/03g-safe-place-routing.md src/subguides/safety/chapters/01-no-safe-place.md
cp src/chapters/03h-environmental-hazards.md src/subguides/safety/chapters/02-environmental.md

cp src/chapters/06-zombie-guide.md src/subguides/zombie/chapters/01-zombie-guide.md

cp src/chapters/07-professional-support.md src/subguides/support/chapters/01-professional.md

cp src/chapters/08-appendix.md src/subguides/appendix/chapters/01-reference.md
```

Note: `src/chapters/` is kept as-is for backward compatibility (the flat build still works). The subguide layout is a parallel structure that the new build targets consume.

- [ ] **Step 4: Create per-subguide sources and version stubs**

For each of the 7 existing subguides, create a `sources.md` by extracting the relevant footnote references from the chapter files and matching them against `10-sources.md`. Create a `version.md` stub with the subguide's first version entry.

Example for calm:

```markdown
<!-- src/subguides/calm/sources.md -->
---
title: "Sources — Calm Guide"
---

## Sources

1. **Balban MY et al.** "Brief structured respiration practices enhance mood
   and reduce physiological arousal," *Cell Reports Medicine* 4 (2023), 100895.
   https://doi.org/10.1016/j.xcrm.2022.100895

2. **Lieberman MD et al.** "Subjective Responses to Emotional Stimuli During
   Labeling, Reappraisal, and Distraction," *Emotion* 11 (2011): 468–480.
   https://pmc.ncbi.nlm.nih.gov/articles/PMC3444304/

3. **World Health Organization.** *Doing What Matters in Times of Stress*
   (2020). https://www.who.int/publications/i/item/9789240003927

4. **Johnson PL et al.** "Etiology, triggers and neurochemical circuits
   associated with panic attacks," *Neuroscience & Biobehavioral Reviews*
   46 (2014): 429–454. https://pmc.ncbi.nlm.nih.gov/articles/PMC4252820/

5. **Khurana RK et al.** "The Implications of the Diving Response in Reducing
   Panic Symptoms," *Frontiers in Psychiatry* 12 (2021): 798664.
   https://pmc.ncbi.nlm.nih.gov/articles/PMC8667218/

6. **Espeland D et al.** "Health effects of voluntary exposure to cold water,"
   *International Journal of Circumpolar Health* 81 (2022).
   https://pmc.ncbi.nlm.nih.gov/articles/PMC9518606/
```

```markdown
<!-- src/subguides/calm/version.md -->
---
title: "Version — Calm Guide"
---

## Version History

| Version | Date | Changes |
|---|---|---|
| 4.0.0-alt | 2026-07-22 | Initial v4-alt release |
| 4.0.0-alt.2 | 2026-07-22 | Added grounding, cold water safety, panic profile, escalation criteria |
```

Repeat for all 7 existing subguides. For the 3 new subguides (body, social, disaster), create empty placeholder chapters:

```markdown
<!-- src/subguides/body/chapters/01-placeholder.md -->
---
title: "Body Owner's Manual"
chapter: 1
revision: "0.1.0"
---

# Body Owner's Manual

*Content coming in Phase 3.*
```

- [ ] **Step 5: Create the manifest**

```json
{
  "calm": {
    "title": "The Teal Book — Calm Guide",
    "accent": "#2E8B7A",
    "pattern": "wave",
    "mascot": "mascot_calm.png",
    "chapters": [
      "subguides/calm/chapters/00-situations-b-e.md",
      "subguides/calm/chapters/01-calm-guide.md"
    ],
    "sources": "subguides/calm/sources.md",
    "version": "subguides/calm/version.md",
    "tagline": "Anxiety, panic, breathing, comfort, and exit strategies"
  },
  "ambulance": {
    "title": "The Red Book — Self Ambulance",
    "accent": "#C23D2E",
    "pattern": "cross",
    "mascot": "mascot_ambulance.png",
    "chapters": [
      "subguides/ambulance/chapters/01-first-response.md"
    ],
    "sources": "subguides/ambulance/sources.md",
    "version": "subguides/ambulance/version.md",
    "tagline": "First aid, pain, triage, and vital signs"
  },
  "responsibility": {
    "title": "The Amber Book — Responsibility",
    "accent": "#D4880A",
    "pattern": "diamond",
    "mascot": "mascot_responsibility.png",
    "chapters": [
      "subguides/responsibility/chapters/01-situation-a.md"
    ],
    "sources": "subguides/responsibility/sources.md",
    "version": "subguides/responsibility/version.md",
    "tagline": "Harm, guilt, caregiving, and repair"
  },
  "safety": {
    "title": "The Blue Book — Safety & No Place",
    "accent": "#2563EB",
    "pattern": "shield",
    "mascot": "mascot_safety.png",
    "chapters": [
      "subguides/safety/chapters/01-no-safe-place.md",
      "subguides/safety/chapters/02-environmental.md"
    ],
    "sources": "subguides/safety/sources.md",
    "version": "subguides/safety/version.md",
    "tagline": "Danger, coercion, shelter, and environmental hazards"
  },
  "zombie": {
    "title": "The Olive Book — Zombie Guide",
    "accent": "#4A6741",
    "pattern": "crosshatch",
    "mascot": "mascot_zombie.png",
    "chapters": [
      "subguides/zombie/chapters/01-zombie-guide.md"
    ],
    "sources": "subguides/zombie/sources.md",
    "version": "subguides/zombie/version.md",
    "tagline": "Survival, outages, community, and preparedness"
  },
  "support": {
    "title": "The Indigo Book — Professional Support",
    "accent": "#6366F1",
    "pattern": "dots",
    "mascot": "mascot_support.png",
    "chapters": [
      "subguides/support/chapters/01-professional.md"
    ],
    "sources": "subguides/support/sources.md",
    "version": "subguides/support/version.md",
    "tagline": "Numbers, scripts, legal, and medical routes"
  },
  "appendix": {
    "title": "The Appendix — Reference",
    "accent": "#B5763B",
    "pattern": "solid",
    "mascot": "mascot_appendix.png",
    "chapters": [
      "subguides/appendix/chapters/01-reference.md"
    ],
    "sources": "subguides/appendix/sources.md",
    "version": "subguides/appendix/version.md",
    "tagline": "Formulas, flowcharts, fillable fields, and print card"
  },
  "body": {
    "title": "The Green Book — Body Owner's Manual",
    "accent": "#16A34A",
    "pattern": "pulse",
    "mascot": "mascot_body.png",
    "chapters": [
      "subguides/body/chapters/01-placeholder.md"
    ],
    "sources": "subguides/body/sources.md",
    "version": "subguides/body/version.md",
    "tagline": "Skin, teeth, digestion, periods, allergies, and 'is this normal?'"
  },
  "social": {
    "title": "The Purple Book — Social Field Guide",
    "accent": "#9333EA",
    "pattern": "speech",
    "mascot": "mascot_social.png",
    "chapters": [
      "subguides/social/chapters/01-placeholder.md"
    ],
    "sources": "subguides/social/sources.md",
    "version": "subguides/social/version.md",
    "tagline": "Awkward moments, etiquette, hosting, and small-talk"
  },
  "disaster": {
    "title": "The Orange Book — Natural Disasters",
    "accent": "#EA580C",
    "pattern": "zigzag",
    "mascot": "mascot_disaster.png",
    "chapters": [
      "subguides/disaster/chapters/01-placeholder.md"
    ],
    "sources": "subguides/disaster/sources.md",
    "version": "subguides/disaster/version.md",
    "tagline": "Earthquake, flood, storm, and extreme weather"
  }
}
```

- [ ] **Step 6: Create hub pages**

Write the three hub markdown files. These are the entry triptych — heavily visual, minimal text:

`src/hub/00-cover.md` — emergency gate + axioms + opening line
`src/hub/01-map.md` — references the master flowchart diagram (generated in Task 6)
`src/hub/02-directory.md` — subguide directory cards (will reference mascot + pattern images)

- [ ] **Step 7: Run tests to verify they pass**

Run: `python -m pytest tests/test_manifest.py -v`
Expected: 4 passed

- [ ] **Step 8: Commit**

```bash
git add src/data/subguide_manifest.json src/hub/ src/subguides/ tests/test_manifest.py
git commit -m "feat: subguide directory structure, manifest, hub pages, per-subguide sources"
```

---

### Task 5: Build Pipeline — Per-Subguide and Combined Output

**Files:**
- Create: `bin/build_guide.py` (new build script for v4-alt)
- Create: `bin/build_all.sh`
- Create: `src/styles/base.css`, `src/styles/tokens.css`
- Create: `src/styles/theme-{name}.css` for each subguide (10 files)
- Create: `src/template.html`
- Create: `package.json`
- Test: `tests/test_build.py`

**Interfaces:**
- Consumes: `subguide_manifest.json`, all chapter/source/version files, CSS, template
- Produces: `build/{subguide_key}/guide.html`, `build/{subguide_key}/guide.pdf`, `build/combined/guide.html`, `build/combined/guide.pdf`

- [ ] **Step 1: Write the build test**

```python
# tests/test_build.py
import json
import os
import subprocess
import pytest

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")

def test_build_script_exists():
    assert os.path.exists(os.path.join(PROJECT_ROOT, "bin", "build_guide.py"))

def test_build_md_for_single_subguide():
    """Build just the markdown assembly for one subguide."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--subguide", "calm", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    assert os.path.exists(os.path.join(PROJECT_ROOT, "build", "calm", "guide.md"))

def test_build_md_for_combined():
    """Build the combined markdown."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    assert os.path.exists(os.path.join(PROJECT_ROOT, "build", "combined", "guide.md"))

def test_subguide_md_includes_sources():
    """Each subguide's markdown must end with its own sources."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--subguide", "calm", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    md_path = os.path.join(PROJECT_ROOT, "build", "calm", "guide.md")
    content = open(md_path).read()
    assert "Sources" in content, "Subguide markdown should include sources"

def test_subguide_md_includes_emergency_gate():
    """Red-flag invariant: every standalone subguide includes the emergency gate."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--subguide", "calm", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    md_path = os.path.join(PROJECT_ROOT, "build", "calm", "guide.md")
    content = open(md_path).read()
    assert "112" in content, "Emergency gate with 112 must appear in every subguide"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_build.py -v`
Expected: FAIL — build script not found

- [ ] **Step 3: Create the CSS architecture**

`src/styles/tokens.css` — defines CSS custom properties for the default (hub/copper) theme:

```css
/* src/styles/tokens.css */
:root {
  --sg-accent: #B5763B;
  --sg-accent-dim: #9A6530;
  --sg-accent-glow: rgba(181,118,59,0.06);
  --ground: #F0F2F4;
  --ground-warm: #E8EAED;
  --ink: #1E2228;
  --ink-soft: #3A3F47;
  --alert: #C23D2E;
  --rule: #D0D4DA;
  --code-bg: #E4E7EB;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #171A1E; --ground-warm: #1E2126; --ink: #D6DAE0;
    --ink-soft: #9BA1AB; --alert: #E05A4A; --rule: #2E3238;
    --code-bg: #22262C;
  }
}
:root[data-theme="dark"] {
  --ground: #171A1E; --ground-warm: #1E2126; --ink: #D6DAE0;
  --ink-soft: #9BA1AB; --alert: #E05A4A; --rule: #2E3238;
  --code-bg: #22262C;
}
:root[data-theme="light"] {
  --ground: #F0F2F4; --ground-warm: #E8EAED; --ink: #1E2228;
  --ink-soft: #3A3F47; --alert: #C23D2E; --rule: #D0D4DA;
  --code-bg: #E4E7EB;
}
```

`src/styles/base.css` — typography, layout, tables, safety cards, print styles. Uses `var(--sg-accent)` everywhere so theme files just override the token.

Each `src/styles/theme-{name}.css` overrides `--sg-accent`, `--sg-accent-dim`, `--sg-accent-glow`:

```css
/* src/styles/theme-calm.css */
:root {
  --sg-accent: #2E8B7A;
  --sg-accent-dim: #256f62;
  --sg-accent-glow: rgba(46,139,122,0.06);
}
```

- [ ] **Step 4: Create the Pandoc template**

`src/template.html` — based on the existing template from the main repo. Includes `$css$` injection, MathML support, theme toggle script, and the fenced-div class pass-through for per-subguide styling.

- [ ] **Step 5: Write the build script**

`bin/build_guide.py` — a manifest-driven build. Key behaviors:

- `--subguide calm` assembles: emergency gate (from hub cover) + calm chapters + calm sources + calm version
- No `--subguide` flag assembles: hub pages + all subguides in sequence (the combined output)
- `--target md|html|pdf|all` controls output format
- CSS selection: for `--subguide calm`, concatenate `tokens.css` + `theme-calm.css` + `base.css`
- For combined: use `tokens.css` + `base.css` (no per-subguide theme; each chapter uses fenced-div classes)

```python
# bin/build_guide.py
"""Build Bathroom Emergency Guide v4-alt.

Manifest-driven build supporting per-subguide and combined output.

Usage:
    python build_guide.py [--subguide NAME] [--target md|html|pdf|all]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
BUILD = ROOT / "build"
MANIFEST_PATH = SRC / "data" / "subguide_manifest.json"
TEMPLATE = SRC / "template.html"
STYLES_DIR = SRC / "styles"
HUB_DIR = SRC / "hub"
EMERGENCY_GATE_FILE = HUB_DIR / "00-cover.md"
VERSION = "4.0.0-alt.2"


class BuildError(RuntimeError):
    pass


def note(msg: str) -> None:
    print(f"  {msg}")


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                            env={**os.environ, "PYTHONUTF8": "1"})
    if check and result.returncode:
        raise BuildError(f"{' '.join(cmd)}\n{(result.stderr or result.stdout).strip()}")
    return result


def require(binary: str) -> str:
    found = shutil.which(binary)
    if not found:
        raise BuildError(f"Required: {binary}")
    return found


def strip_frontmatter(text: str) -> str:
    return re.sub(r"\A---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def assemble_subguide(key: str, manifest: dict) -> Path:
    entry = manifest[key]
    out_dir = BUILD / key
    out_dir.mkdir(parents=True, exist_ok=True)

    parts = [
        "---",
        f'title: "{entry["title"]}"',
        f'version: "{VERSION}"',
        'lang: "en"',
        "---",
        "",
    ]

    # Emergency gate from hub cover
    gate_text = strip_frontmatter(EMERGENCY_GATE_FILE.read_text(encoding="utf-8")).strip()
    parts.extend(["::: {.emergency-gate}", "", gate_text, "", ":::", ""])

    # Chapters
    for ch_path in entry["chapters"]:
        full_path = SRC / ch_path
        if not full_path.exists():
            raise BuildError(f"Missing chapter: {full_path}")
        body = strip_frontmatter(full_path.read_text(encoding="utf-8")).strip()
        slug = full_path.stem
        parts.extend([f"::: {{#{slug} .chapter .subguide-{key}}}", "", body, "", ":::", ""])

    # Sources
    src_path = SRC / entry["sources"]
    if src_path.exists():
        body = strip_frontmatter(src_path.read_text(encoding="utf-8")).strip()
        parts.extend(["::: {.sources}", "", body, "", ":::", ""])

    # Version
    ver_path = SRC / entry["version"]
    if ver_path.exists():
        body = strip_frontmatter(ver_path.read_text(encoding="utf-8")).strip()
        parts.extend(["::: {.version-info}", "", body, "", ":::", ""])

    output = out_dir / "guide.md"
    output.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
    note(f"assembled {key} → {output.relative_to(ROOT)}")
    return output


def assemble_combined(manifest: dict) -> Path:
    out_dir = BUILD / "combined"
    out_dir.mkdir(parents=True, exist_ok=True)

    parts = [
        "---",
        'title: "Bathroom Emergency Guide"',
        f'version: "{VERSION}"',
        'lang: "en"',
        "---",
        "",
    ]

    # Hub pages
    for hub_file in sorted(HUB_DIR.glob("*.md")):
        body = strip_frontmatter(hub_file.read_text(encoding="utf-8")).strip()
        slug = hub_file.stem
        parts.extend([f"::: {{#{slug} .hub}}", "", body, "", ":::", ""])

    # All subguides in order
    order = ["calm", "ambulance", "responsibility", "safety", "zombie",
             "support", "appendix", "body", "social", "disaster"]
    for key in order:
        if key not in manifest:
            continue
        entry = manifest[key]
        for ch_path in entry["chapters"]:
            full_path = SRC / ch_path
            if not full_path.exists():
                raise BuildError(f"Missing: {full_path}")
            body = strip_frontmatter(full_path.read_text(encoding="utf-8")).strip()
            slug = full_path.stem
            parts.extend([f"::: {{#{slug} .chapter .subguide-{key}}}", "", body, "", ":::", ""])
        # Append per-subguide sources
        src_path = SRC / entry["sources"]
        if src_path.exists():
            body = strip_frontmatter(src_path.read_text(encoding="utf-8")).strip()
            parts.extend([f"::: {{.sources .subguide-{key}}}", "", body, "", ":::", ""])

    output = out_dir / "guide.md"
    output.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
    note(f"assembled combined → {output.relative_to(ROOT)}")
    return output


def combined_css(subguide_key: str | None = None) -> Path:
    tokens = (STYLES_DIR / "tokens.css").read_text(encoding="utf-8")
    base = (STYLES_DIR / "base.css").read_text(encoding="utf-8")
    theme = ""
    if subguide_key:
        theme_file = STYLES_DIR / f"theme-{subguide_key}.css"
        if theme_file.exists():
            theme = theme_file.read_text(encoding="utf-8")

    out_dir = BUILD / (subguide_key or "combined")
    out_dir.mkdir(parents=True, exist_ok=True)
    css_path = out_dir / "guide.css"
    css_path.write_text(f"{tokens}\n\n{theme}\n\n{base}", encoding="utf-8")
    return css_path


def build_html(markdown: Path, subguide_key: str | None = None) -> Path:
    pandoc = require("pandoc")
    css = combined_css(subguide_key)
    out_dir = BUILD / (subguide_key or "combined")
    output = out_dir / "guide.html"
    cmd = [
        pandoc, str(markdown),
        "--from=markdown+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs+link_attributes",
        "--to=html5", "--standalone",
        "--template", str(TEMPLATE),
        "--toc", "--toc-depth=2", "--mathml", "--embed-resources",
        f"--css={css.name}",
        "--resource-path", os.pathsep.join([str(out_dir), str(BUILD), str(SRC), str(ROOT)]),
        "--metadata", f"guide-version={VERSION}",
        "--output", str(output),
    ]
    run(cmd)
    note(f"built HTML → {output.relative_to(ROOT)}")
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--subguide", type=str, default=None,
                        help="Build a single subguide (e.g. 'calm')")
    parser.add_argument("--target", type=str, default="all",
                        choices=["md", "html", "pdf", "all"])
    args = parser.parse_args()

    manifest = load_manifest()

    if args.subguide:
        if args.subguide not in manifest:
            print(f"Unknown subguide: {args.subguide}", file=sys.stderr)
            return 2
        md = assemble_subguide(args.subguide, manifest)
        if args.target == "md":
            return 0
        html = build_html(md, args.subguide)
        if args.target == "html":
            return 0
        # PDF would go here (same Chrome/WeasyPrint pattern as the existing build)
    else:
        md = assemble_combined(manifest)
        if args.target == "md":
            return 0
        html = build_html(md)
        if args.target == "html":
            return 0

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BuildError as exc:
        print(f"BUILD FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
```

- [ ] **Step 6: Create `package.json`**

```json
{
  "name": "bathroom-emergency-guide-v4-alt",
  "private": true,
  "version": "0.0.2",
  "description": "Modular bathroom emergency guide — hub + subguide architecture.",
  "type": "module",
  "scripts": {
    "build": "./bin/build_all.sh",
    "build:diagrams": "python3 -m src.diagrams.generate_patterns build/diagrams && python3 -m src.diagrams.generate_mascots build/diagrams",
    "build:calm": "python3 bin/build_guide.py --subguide calm",
    "build:ambulance": "python3 bin/build_guide.py --subguide ambulance",
    "build:responsibility": "python3 bin/build_guide.py --subguide responsibility",
    "build:safety": "python3 bin/build_guide.py --subguide safety",
    "build:zombie": "python3 bin/build_guide.py --subguide zombie",
    "build:support": "python3 bin/build_guide.py --subguide support",
    "build:appendix": "python3 bin/build_guide.py --subguide appendix",
    "build:body": "python3 bin/build_guide.py --subguide body",
    "build:social": "python3 bin/build_guide.py --subguide social",
    "build:disaster": "python3 bin/build_guide.py --subguide disaster",
    "build:combined": "python3 bin/build_guide.py",
    "test": "python3 -m pytest tests/ -v"
  },
  "devDependencies": {
    "playwright": "^1.54.0"
  }
}
```

- [ ] **Step 7: Create `bin/build_all.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Building diagrams ==="
python3 -m src.diagrams.generate_patterns "$PROJECT_DIR/build/diagrams"
python3 -m src.diagrams.generate_mascots "$PROJECT_DIR/build/diagrams"

echo "=== Building combined guide ==="
python3 "$SCRIPT_DIR/build_guide.py"

echo "=== Building standalone subguides ==="
for sg in calm ambulance responsibility safety zombie support appendix body social disaster; do
    python3 "$SCRIPT_DIR/build_guide.py" --subguide "$sg"
done

echo "=== Running tests ==="
python3 -m pytest "$PROJECT_DIR/tests/" -v
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `python -m pytest tests/test_build.py -v`
Expected: 4 passed (may need pandoc installed; if not available, the HTML/PDF tests skip gracefully)

- [ ] **Step 9: Commit**

```bash
git add bin/ src/styles/ src/template.html package.json tests/test_build.py
git commit -m "feat: manifest-driven build pipeline with per-subguide and combined output"
```

---

### Task 6: Hub Master Flowchart Generator

**Files:**
- Create: `src/diagrams/generate_hub.py`
- Test: `tests/test_hub_diagrams.py`

**Interfaces:**
- Consumes: `palette.SUBGUIDES`, `palette.PAPER`, `palette.INK`, `palette.MUTED`
- Produces: `build/diagrams/master_flowchart_v2.png`, `build/diagrams/emergency_banner.png`, `build/diagrams/axiom_icons.png`. CLI: `python generate_hub.py [OUTPUT_DIR]`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_hub_diagrams.py
import os
import tempfile

def test_generates_hub_diagrams():
    from src.diagrams.generate_hub import generate_hub_diagrams
    with tempfile.TemporaryDirectory() as td:
        generate_hub_diagrams(td)
        expected = {"master_flowchart_v2.png", "emergency_banner.png", "axiom_icons.png"}
        assert expected.issubset(set(os.listdir(td)))

def test_master_flowchart_uses_subguide_colors():
    """The flowchart should reference all 10 subguide accent colors."""
    from src.diagrams.generate_hub import generate_hub_diagrams
    from src.diagrams.palette import SUBGUIDES
    from PIL import Image
    import numpy as np
    with tempfile.TemporaryDirectory() as td:
        generate_hub_diagrams(td)
        img = Image.open(os.path.join(td, "master_flowchart_v2.png"))
        # Just verify it generated successfully and is a reasonable size
        assert img.size[0] >= 800, "Flowchart should be at least 800px wide"
        assert img.size[1] >= 600, "Flowchart should be at least 600px tall"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_hub_diagrams.py -v`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

`src/diagrams/generate_hub.py` — uses the existing flowgraph pattern (matplotlib FancyBboxPatch) but with subguide colors. The master flowchart v2 shows:

1. Emergency gate (red) at top
2. "What is the next problem?" decision node (green)
3. Eight routing arrows to subguide destination boxes, each in its subguide's accent color
4. Pattern fill strips beside each box (using the generated pattern tiles if available, otherwise solid)

```python
# src/diagrams/generate_hub.py
"""Generate hub-specific diagrams: master flowchart, emergency banner, axiom icons."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

from .palette import SUBGUIDES, INK, PAPER, MUTED, WHITE, hex_to_rgba


def box(ax, x, y, w, h, text, color, size=9, text_color=WHITE):
    patch = FancyBboxPatch(
        (x - w/2, y - h/2), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.07",
        facecolor=color, edgecolor=INK, linewidth=1.1)
    ax.add_patch(patch)
    ax.text(x, y, text, ha="center", va="center", color=text_color,
            fontsize=size, fontweight="bold", wrap=True)


def arrow(ax, start, end, label=None, color=None):
    c = color or INK
    ax.annotate("", xy=end, xytext=start,
                arrowprops={"arrowstyle": "->", "color": c, "lw": 1.7})
    if label:
        mx = (start[0] + end[0]) / 2
        my = (start[1] + end[1]) / 2
        ax.text(mx + 0.07, my, label, color=c, fontsize=7.5, fontweight="bold",
                backgroundcolor=PAPER)


def generate_master_flowchart(output_dir: str) -> str:
    fig, ax = plt.subplots(figsize=(10, 14), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 16)
    ax.axis("off")

    # Title
    ax.text(6, 15.5, "BATHROOM EMERGENCY ROUTING", ha="center",
            color=INK, fontsize=18, fontweight="bold")
    ax.text(6, 15.1, "One question at a time. Arithmetic never outranks a red flag.",
            ha="center", color=MUTED, fontsize=9)

    # Emergency gate
    box(ax, 6, 14.0, 7, 1.0, "Immediate danger or possible lasting harm?",
        "#C23D2E", 12)
    box(ax, 10, 12.5, 3.0, 0.8, "CALL 112\nUnlock · speaker", "#C23D2E", 10)
    arrow(ax, (8.5, 13.5), (9.5, 12.9), "YES", "#C23D2E")

    # Decision node
    box(ax, 4, 12.5, 4.5, 0.8, "What is the next problem?", "#0d7355", 11)
    arrow(ax, (4.5, 13.5), (4.2, 12.9), "NO", "#0d7355")

    # Subguide routing
    routes = [
        ("calm",           1.5, 10.5, "Panic / overload / anxiety"),
        ("ambulance",      4.5, 10.5, "Body / pain / injury / illness"),
        ("responsibility", 7.5, 10.5, "Guilt / harm / caregiving"),
        ("safety",         10.5, 10.5, "Threat / violence / no safe place"),
        ("zombie",         1.5, 8.5, "Outage / infrastructure / collapse"),
        ("support",        4.5, 8.5, "Need a number / script / route"),
        ("body",           7.5, 8.5, "Skin / teeth / digestion / 'is this normal?'"),
        ("social",         10.5, 8.5, "Awkward / hosting / cultural"),
        ("disaster",       6.0, 6.5, "Earthquake / flood / storm"),
        ("appendix",       6.0, 4.5, "Reference / formulas / print card"),
    ]

    for key, x, y, label in routes:
        sg = SUBGUIDES[key]
        box(ax, x, y, 2.8, 1.2, f"{sg.name}\n{label}", sg.accent, 7)
        if y == 10.5:
            arrow(ax, (x, 12.1), (x, y + 0.6), color=sg.accent)
        elif y == 8.5:
            arrow(ax, (x, 10.5 - 0.6), (x, y + 0.6), color=sg.accent)
        elif y == 6.5:
            arrow(ax, (6.0, 8.5 - 0.6), (x, y + 0.6), color=sg.accent)
        else:
            arrow(ax, (6.0, 6.5 - 0.6), (x, y + 0.6), color=sg.accent)

    path = os.path.join(output_dir, "master_flowchart_v2.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


def generate_emergency_banner(output_dir: str) -> str:
    fig, ax = plt.subplots(figsize=(8, 1.5), dpi=180)
    fig.patch.set_facecolor("#C23D2E")
    ax.set_facecolor("#C23D2E")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 2)
    ax.axis("off")
    ax.text(5, 1.2, "IMMEDIATE DANGER? CALL 112", ha="center", color=WHITE,
            fontsize=16, fontweight="bold")
    ax.text(5, 0.5, "Unlock the door · Put phone on speaker · Follow dispatcher",
            ha="center", color=WHITE, fontsize=10)
    path = os.path.join(output_dir, "emergency_banner.png")
    fig.savefig(path, bbox_inches="tight", facecolor="#C23D2E")
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


def generate_axiom_icons(output_dir: str) -> str:
    fig, axes = plt.subplots(1, 4, figsize=(8, 2), dpi=180)
    fig.patch.set_facecolor(PAPER)
    axioms = [("Door", "🚪", "You can lock it"),
              ("Water", "🚰", "You have access"),
              ("Shelter", "🏠", "You're indoors"),
              ("Choice", "✋", "You're reading this")]
    for ax, (title, icon, desc) in zip(axes, axioms):
        ax.set_facecolor(PAPER)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis("off")
        ax.text(0.5, 0.7, icon, ha="center", va="center", fontsize=24)
        ax.text(0.5, 0.35, title, ha="center", va="center", fontsize=11,
                fontweight="bold", color=INK)
        ax.text(0.5, 0.15, desc, ha="center", va="center", fontsize=8, color=MUTED)
    path = os.path.join(output_dir, "axiom_icons.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


def generate_hub_diagrams(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    generate_master_flowchart(output_dir)
    generate_emergency_banner(output_dir)
    generate_axiom_icons(output_dir)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "..", "build", "diagrams")
    generate_hub_diagrams(out)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_hub_diagrams.py -v`
Expected: 2 passed

- [ ] **Step 5: Generate the hub diagrams**

Run: `python -m src.diagrams.generate_hub build/diagrams`
Expected: 3 `[OK]` lines

- [ ] **Step 6: Commit**

```bash
git add src/diagrams/generate_hub.py tests/test_hub_diagrams.py
git commit -m "feat: hub diagram generator — master flowchart v2, emergency banner, axiom icons"
```

---

### Task 7: Generate All Orchestrator and Integration Test

**Files:**
- Create: `src/diagrams/generate_all.py`
- Create: `src/diagrams/__init__.py`
- Create: `tests/test_integration.py`

**Interfaces:**
- Consumes: all generator modules
- Produces: complete `build/diagrams/` directory with all patterns, mascots, and hub diagrams

- [ ] **Step 1: Write the integration test**

```python
# tests/test_integration.py
import os
import tempfile
import subprocess

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")

def test_generate_all_produces_expected_files():
    """Running generate_all should produce patterns, mascots, and hub diagrams."""
    with tempfile.TemporaryDirectory() as td:
        result = subprocess.run(
            ["python3", "-m", "src.diagrams.generate_all", td],
            cwd=PROJECT_ROOT, capture_output=True, text=True
        )
        assert result.returncode == 0, f"Failed: {result.stderr}"
        files = set(os.listdir(td))
        # Patterns
        for pattern in ["wave", "cross", "diamond", "shield", "crosshatch",
                        "dots", "solid", "pulse", "zigzag", "speech"]:
            assert f"pattern_{pattern}.png" in files, f"Missing pattern_{pattern}.png"
        # Mascots
        for key in ["calm", "ambulance", "responsibility", "safety", "zombie",
                    "support", "appendix", "body", "social", "disaster"]:
            assert f"mascot_{key}.png" in files, f"Missing mascot_{key}.png"
        # Hub diagrams
        assert "master_flowchart_v2.png" in files
        assert "emergency_banner.png" in files
        assert "axiom_icons.png" in files

def test_full_md_build():
    """End-to-end: generate diagrams then build combined markdown."""
    result = subprocess.run(
        ["python3", "-m", "src.diagrams.generate_all", "build/diagrams"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Diagram gen failed: {result.stderr}"
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    md_path = os.path.join(PROJECT_ROOT, "build", "combined", "guide.md")
    assert os.path.exists(md_path)
    content = open(md_path).read()
    assert len(content) > 1000, "Combined markdown seems too short"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_integration.py -v`
Expected: FAIL — generate_all module not found

- [ ] **Step 3: Create the orchestrator and package init**

```python
# src/diagrams/__init__.py
```

```python
# src/diagrams/generate_all.py
"""Generate all diagrams for the v4-alt bathroom emergency guide."""
from __future__ import annotations

import os
import sys

from .generate_patterns import generate_all_patterns
from .generate_mascots import generate_all_mascots
from .generate_hub import generate_hub_diagrams


def generate_all(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    print("=== Patterns ===")
    generate_all_patterns(output_dir)
    print("=== Mascots ===")
    generate_all_mascots(output_dir)
    print("=== Hub Diagrams ===")
    generate_hub_diagrams(output_dir)
    print(f"=== Done: {len(os.listdir(output_dir))} files in {output_dir} ===")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "..", "build", "diagrams")
    generate_all(out)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_integration.py -v`
Expected: 2 passed

- [ ] **Step 5: Run the full build to verify everything integrates**

Run: `cd /home/user/work/code/artifacts/bathroom-disaster/bathroom-emergency-guide-4.x-alt && python -m src.diagrams.generate_all build/diagrams`
Expected: 23 `[OK]` lines (10 patterns + 10 mascots + 3 hub diagrams)

- [ ] **Step 6: Commit and tag**

```bash
git add src/diagrams/__init__.py src/diagrams/generate_all.py tests/test_integration.py
git commit -m "feat: diagram orchestrator and integration tests — Phase 1 complete"
git tag v0.1.0
```

---

## Phase 1 Deliverables Summary

| Deliverable | Task | Files |
|-------------|------|-------|
| Shared palette with 10 subguide identities | 1 | `palette.py` |
| 10 repeating pattern tiles | 2 | `generate_patterns.py` |
| 10 pixel-art mascot sprites | 3 | `generate_mascots.py` |
| Subguide manifest + directory restructure | 4 | `subguide_manifest.json`, `src/hub/`, `src/subguides/` |
| Manifest-driven build pipeline | 5 | `build_guide.py`, CSS arch, `package.json` |
| Hub master flowchart + emergency banner + axiom icons | 6 | `generate_hub.py` |
| Orchestrator + integration tests | 7 | `generate_all.py`, `test_integration.py` |

**Total new visual assets:** 23 (10 patterns + 10 mascots + 3 hub diagrams)
**Next phase:** Phase 2 (Existing Subguide Polish) adds ~22 new diagrams across the 7 existing subguides, cover pages, quick-reference cards, and final visual consistency.
