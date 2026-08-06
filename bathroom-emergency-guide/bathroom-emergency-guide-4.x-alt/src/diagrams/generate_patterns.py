"""Generate repeating tile patterns for each subguide's visual identity.

Each pattern is structurally unique at any size and in grayscale:
- Different stroke widths, densities, and geometric primitives
- High contrast (INK on PAPER) so patterns remain distinct in mono print
"""
from __future__ import annotations

import math
import os
import sys
from PIL import Image, ImageDraw

from .palette import SUBGUIDES, hex_to_rgba, INK, PAPER

TILE_SIZE = 128

_INK_RGBA = hex_to_rgba(INK)
_PAPER_RGBA = hex_to_rgba(PAPER)
_MID_RGBA = (120, 140, 132, 255)


def _draw_wave(draw: ImageDraw.Draw, color: tuple) -> None:
    """Thick horizontal sine curves with thin counter-waves."""
    for y_off in range(0, TILE_SIZE, 28):
        points = []
        for x in range(TILE_SIZE + 1):
            y = y_off + int(10 * math.sin(x * 2 * math.pi / 40))
            points.append((x, y))
        draw.line(points, fill=color, width=3)
        counter = []
        for x in range(TILE_SIZE + 1):
            y = y_off + 14 + int(5 * math.sin(x * 2 * math.pi / 40 + math.pi))
            counter.append((x, y))
        draw.line(counter, fill=_MID_RGBA, width=1)


def _draw_cross(draw: ImageDraw.Draw, color: tuple) -> None:
    """Bold medical crosses with circle halos."""
    spacing = 36
    arm = 6
    for cy in range(spacing // 2, TILE_SIZE, spacing):
        for cx in range(spacing // 2, TILE_SIZE, spacing):
            draw.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], outline=_MID_RGBA, width=1)
            draw.rectangle([cx - arm, cy - 2, cx + arm, cy + 2], fill=color)
            draw.rectangle([cx - 2, cy - arm, cx + 2, cy + arm], fill=color)


def _draw_diamond(draw: ImageDraw.Draw, color: tuple) -> None:
    """Nested concentric diamonds at two scales."""
    spacing = 32
    for row in range(0, TILE_SIZE + spacing, spacing):
        offset = (spacing // 2) if (row // spacing) % 2 else 0
        for col in range(-spacing, TILE_SIZE + spacing, spacing):
            cx, cy = col + offset, row
            for size in (11, 6):
                draw.polygon([(cx, cy - size), (cx + size, cy),
                              (cx, cy + size), (cx - size, cy)],
                             outline=color if size == 11 else _MID_RGBA, width=2)


def _draw_shield(draw: ImageDraw.Draw, color: tuple) -> None:
    """Staggered brick wall with mortar lines."""
    bh, bw = 18, 36
    for row in range(0, TILE_SIZE, bh):
        offset = (bw // 2) if (row // bh) % 2 else 0
        draw.line([(0, row), (TILE_SIZE, row)], fill=_MID_RGBA, width=1)
        for col in range(-bw, TILE_SIZE + bw, bw):
            x = col + offset
            draw.rectangle([x + 2, row + 2, x + bw - 3, row + bh - 3], outline=color, width=2)


def _draw_crosshatch(draw: ImageDraw.Draw, color: tuple) -> None:
    """Dense diagonal crossing lines with alternating weight."""
    spacing = 14
    for i in range(-TILE_SIZE, TILE_SIZE * 2, spacing):
        w = 2 if (i // spacing) % 2 == 0 else 1
        draw.line([(i, 0), (i + TILE_SIZE, TILE_SIZE)], fill=color, width=w)
        draw.line([(i, TILE_SIZE), (i + TILE_SIZE, 0)], fill=color, width=w)


def _draw_dots(draw: ImageDraw.Draw, color: tuple) -> None:
    """Alternating large and small dots in a grid."""
    spacing = 20
    for yi, y in enumerate(range(spacing // 2, TILE_SIZE, spacing)):
        for xi, x in enumerate(range(spacing // 2, TILE_SIZE, spacing)):
            r = 5 if (xi + yi) % 2 == 0 else 2
            c = color if r == 5 else _MID_RGBA
            draw.ellipse([x - r, y - r, x + r, y + r], fill=c)


def _draw_solid(draw: ImageDraw.Draw, color: tuple) -> None:
    """Horizontal dashes with vertical tick marks."""
    h_spacing = 18
    dash_len = 22
    gap = 10
    for y in range(h_spacing // 2, TILE_SIZE, h_spacing):
        x = 0
        while x < TILE_SIZE:
            draw.line([(x, y), (min(x + dash_len, TILE_SIZE), y)], fill=color, width=2)
            x += dash_len + gap
    v_spacing = 32
    for x in range(v_spacing // 2, TILE_SIZE, v_spacing):
        draw.line([(x, 0), (x, TILE_SIZE)], fill=_MID_RGBA, width=1)


def _draw_pulse(draw: ImageDraw.Draw, color: tuple) -> None:
    """Bold EKG heartbeat line with baseline."""
    for y_off in range(0, TILE_SIZE, 36):
        mid = y_off + 18
        draw.line([(0, mid), (TILE_SIZE, mid)], fill=_MID_RGBA, width=1)
        points = []
        for x in range(TILE_SIZE + 1):
            phase = x % 72
            if 24 <= phase <= 28:
                y = mid - 16
            elif 30 <= phase <= 34:
                y = mid + 10
            elif 36 <= phase <= 40:
                y = mid - 6
            else:
                y = mid
            points.append((x, y))
        draw.line(points, fill=color, width=3)


def _draw_zigzag(draw: ImageDraw.Draw, color: tuple) -> None:
    """Sharp seismograph peaks with ground line."""
    spacing = 28
    amp = 12
    period = 20
    for y_off in range(0, TILE_SIZE, spacing):
        mid = y_off + spacing // 2
        draw.line([(0, mid), (TILE_SIZE, mid)], fill=_MID_RGBA, width=1)
        points = []
        for x in range(TILE_SIZE + 1):
            phase = x % period
            half = period // 2
            if phase < half:
                y = mid - int(amp * (2 * phase / half - 1))
            else:
                y = mid + int(amp * (2 * (phase - half) / half - 1))
            points.append((x, y))
        draw.line(points, fill=color, width=3)


def _draw_speech(draw: ImageDraw.Draw, color: tuple) -> None:
    """Overlapping speech bubbles with tails."""
    positions = [
        (8, 8, 52, 36),
        (62, 16, 116, 48),
        (16, 52, 64, 80),
        (68, 60, 120, 92),
        (4, 88, 56, 118),
        (64, 94, 118, 122),
    ]
    for i, (x1, y1, x2, y2) in enumerate(positions):
        draw.rounded_rectangle([x1, y1, x2, y2], radius=8,
                               outline=color if i % 2 == 0 else _MID_RGBA, width=2)
        tx = x1 + 8 if i % 2 == 0 else x2 - 8
        ty = y2
        draw.polygon([(tx, ty), (tx + 6, ty + 8), (tx - 4, ty + 5)],
                     fill=color if i % 2 == 0 else _MID_RGBA)


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


def generate_pattern(pattern_name: str, output_dir: str) -> str:
    img = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), _PAPER_RGBA)
    draw = ImageDraw.Draw(img)
    PATTERN_FUNCS[pattern_name](draw, _INK_RGBA)
    path = os.path.join(output_dir, f"pattern_{pattern_name}.png")
    img.save(path, "PNG")
    return path


def generate_all_patterns(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    for key, sg in SUBGUIDES.items():
        path = generate_pattern(sg.pattern, output_dir)
        print(f"  [OK] {path}")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "..", "build", "diagrams")
    generate_all_patterns(out)
