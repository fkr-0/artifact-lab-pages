#!/usr/bin/env python3
"""
Bathroom Emergency Guide — Diagram Generator
Generates all diagrams for the guide with pixel art aesthetic enhancements.

Enhancements over base:
  - Subtle scanline overlay (every other row slightly darker)
  - Warmer, more visible graph paper background
  - Pixel art sprite decorations in corners
  - Pixel-art style border/frame around each diagram
  - Graceful fallback when sprites are missing

Usage:
    python generate_all.py [OUTPUT_DIR]

    OUTPUT_DIR: target directory for PNG files (default: ../../build/diagrams)
"""
import sys
import os
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Output directory
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'build', 'diagrams')
os.makedirs(OUT, exist_ok=True)

# ── Color Palette ─────────────────────────────────────────
MATH_BLUE = '#2563EB'
LIGHT_BG = '#F8FAFC'
GRAPH_PAPER = '#FBF7F0'          # warmer tone (was #F1F5F9)
GRAPH_PAPER_LINE = '#E8E2D8'     # warmer minor grid
GRAPH_PAPER_LINE_MAJ = '#D5CEC2' # warmer major grid
GREEN = '#22C55E'
RED = '#EF4444'
ORANGE = '#F97316'
PURPLE = '#A855F7'
GRAY = '#94A3B8'
WHITE = '#FFFFFF'
DARK = '#1E293B'

# ── Pixel Art Enhancement Config ──────────────────────────
SPRITE_DIR = OUT
SPRITE_NAMES = {
    'bathroom_icon.png', 'water_drop.png', 'brain.png', 'heart.png',
    'zombie_hand.png', 'flame.png', 'shield.png', 'book.png',
    'breath.png', 'first_aid.png', 'compass.png', 'pixel_border.png'
}
CORNER_SPRITES = ['shield.png', 'flame.png', 'heart.png', 'compass.png']
BORDER_COLOR = '#2563EB'
BORDER_WIDTH = 4           # px
BORDER_INNER_GAP = 2       # px gap between border and content
CORNER_SPRITE_SCALE = 2    # scale factor for corner sprites
CORNER_PADDING = 12        # px from border inner edge
SCANLINE_ALPHA = 18        # 0-255; how dark each scanline row is

# ── Sprite Cache ──────────────────────────────────────────
_sprite_cache = {}


def load_sprite(name):
    """Load a pixel art sprite from the output directory, with caching."""
    if name in _sprite_cache:
        return _sprite_cache[name]
    path = os.path.join(SPRITE_DIR, name)
    if not os.path.exists(path):
        _sprite_cache[name] = None
        return None
    try:
        img = Image.open(path).convert('RGBA')
        _sprite_cache[name] = img
        return img
    except Exception:
        _sprite_cache[name] = None
        return None


# ── Post-Processing Helpers ───────────────────────────────
def apply_scanlines(img):
    """Add subtle scanline overlay: every other row slightly darker."""
    w, h = img.size
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = overlay.load()
    for y in range(0, h, 2):
        for x in range(w):
            px[x, y] = (0, 0, 0, SCANLINE_ALPHA)
    result = Image.alpha_composite(img, overlay)
    return result


def add_pixel_border_frame(img):
    """Draw a pixel-art style border/frame around the image."""
    w, h = img.size
    # Create a new image slightly larger to accommodate the border
    bw = BORDER_WIDTH
    gap = BORDER_INNER_GAP
    total = bw * 2 + gap * 2
    new_w = w + total
    new_h = h + total
    framed = Image.new('RGBA', (new_w, new_h), (0, 0, 0, 0))

    # Draw border using PIL
    draw = ImageDraw.Draw(framed)
    # Parse border color
    bc = BORDER_COLOR.lstrip('#')
    bc_rgba = (int(bc[:2], 16), int(bc[2:4], 16), int(bc[4:6], 16), 255)
    bc_dark = (max(0, bc_rgba[0] - 40), max(0, bc_rgba[1] - 40), max(0, bc_rgba[2] - 40), 255)
    bc_light = (min(255, bc_rgba[0] + 40), min(255, bc_rgba[1] + 40), min(255, bc_rgba[2] + 40), 255)

    # Outer border rectangle
    draw.rectangle([0, 0, new_w - 1, new_h - 1], outline=bc_dark, width=1)
    draw.rectangle([1, 1, new_w - 2, new_h - 2], outline=bc_rgba, width=1)
    draw.rectangle([2, 2, new_w - 3, new_h - 3], outline=bc_light, width=1)

    # Inner border rectangle
    inner_start = bw + gap
    draw.rectangle([inner_start - 1, inner_start - 1,
                     new_w - inner_start, new_h - inner_start],
                    outline=bc_light, width=1)
    draw.rectangle([inner_start, inner_start,
                     new_w - inner_start - 1, new_h - inner_start - 1],
                    outline=bc_rgba, width=1)
    draw.rectangle([inner_start + 1, inner_start + 1,
                     new_w - inner_start - 2, new_h - inner_start - 2],
                    outline=bc_dark, width=1)

    # Corner decorations (small pixel diamonds at the 4 corners of the border)
    corner_size = 3
    corners = [
        (bw // 2, bw // 2),                           # top-left
        (new_w - 1 - bw // 2, bw // 2),               # top-right
        (bw // 2, new_h - 1 - bw // 2),               # bottom-left
        (new_w - 1 - bw // 2, new_h - 1 - bw // 2),   # bottom-right
    ]
    for cx, cy in corners:
        for dy in range(-corner_size, corner_size + 1):
            for dx in range(-corner_size, corner_size + 1):
                if abs(dx) + abs(dy) <= corner_size:
                    px_x, px_y = cx + dx, cy + dy
                    if 0 <= px_x < new_w and 0 <= px_y < new_h:
                        draw.point((px_x, px_y), fill=bc_rgba)

    # Pixel-art notch marks along each edge (every 48px)
    for x in range(24, new_w, 48):
        for dy in range(bw):
            draw.point((x, dy), fill=bc_dark)
            draw.point((x, new_h - 1 - dy), fill=bc_dark)
    for y in range(24, new_h, 48):
        for dx in range(bw):
            draw.point((dx, y), fill=bc_dark)
            draw.point((new_w - 1 - dx, y), fill=bc_dark)

    # Paste original image into center
    framed.paste(img, (bw + gap, bw + gap), img if img.mode == 'RGBA' else None)
    return framed


def add_corner_sprites(img):
    """Embed small pixel art sprites in the corners as decorative elements."""
    w, h = img.size
    result = img.copy()

    positions = [
        ('top-left',     CORNER_PADDING, CORNER_PADDING),
        ('top-right',    w - CORNER_PADDING, CORNER_PADDING),
        ('bottom-left',  CORNER_PADDING, h - CORNER_PADDING),
        ('bottom-right', w - CORNER_PADDING, h - CORNER_PADDING),
    ]

    for i, (corner, cx, cy) in enumerate(positions):
        sprite_name = CORNER_SPRITES[i % len(CORNER_SPRITES)]
        sprite = load_sprite(sprite_name)
        if sprite is None:
            continue

        # Scale sprite
        sw, sh = sprite.size
        new_sw = sw * CORNER_SPRITE_SCALE
        new_sh = sh * CORNER_SPRITE_SCALE
        sprite_scaled = sprite.resize((new_sw, new_sh), Image.NEAREST)

        # Calculate paste position based on corner
        if corner == 'top-left':
            paste_x, paste_y = cx, cy
        elif corner == 'top-right':
            paste_x, paste_y = cx - new_sw, cy
        elif corner == 'bottom-left':
            paste_x, paste_y = cx, cy - new_sh
        else:  # bottom-right
            paste_x, paste_y = cx - new_sw, cy - new_sh

        # Clamp to image bounds
        paste_x = max(0, min(paste_x, w - new_sw))
        paste_y = max(0, min(paste_y, h - new_sh))

        # Create a temp image for alpha compositing
        temp = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        temp.paste(sprite_scaled, (paste_x, paste_y), sprite_scaled)
        result = Image.alpha_composite(result, temp)

    return result


def post_process(img):
    """Apply all pixel art enhancements to a diagram image."""
    img = apply_scanlines(img)
    img = add_corner_sprites(img)
    img = add_pixel_border_frame(img)
    return img


# ── Helpers ───────────────────────────────────────────────
def graph_paper_bg(ax, x_max=11, y_max=9):
    ax.set_facecolor(GRAPH_PAPER)
    for x in np.arange(0, x_max+0.5, 0.5):
        ax.axvline(x, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)
    for y in np.arange(0, y_max+0.5, 0.5):
        ax.axhline(y, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)
    for x in np.arange(0, x_max+1, 1):
        ax.axvline(x, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)
    for y in np.arange(0, y_max+1, 1):
        ax.axhline(y, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)

def draw_box(ax, x, y, w, h, text, color=MATH_BLUE, text_color=WHITE, fontsize=9, bold=True):
    box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                          boxstyle="round,pad=0.1",
                          facecolor=color, edgecolor='none',
                          zorder=3, alpha=0.95)
    ax.add_patch(box)
    weight = 'bold' if bold else 'normal'
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight=weight, zorder=4, fontfamily='sans-serif')

def draw_diamond(ax, x, y, w, h, text, color=ORANGE, text_color=WHITE, fontsize=8):
    diamond = plt.Polygon([(x, y+h/2), (x+w/2, y), (x, y-h/2), (x-w/2, y)],
                           facecolor=color, edgecolor='none', alpha=0.95, zorder=3)
    ax.add_patch(diamond)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight='bold', zorder=4, fontfamily='sans-serif')

def draw_arrow(ax, x1, y1, x2, y2, color=DARK, label=None, fontsize=7):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.5), zorder=2)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.1, my+0.1, label, fontsize=fontsize, color=color,
                fontweight='bold', fontfamily='sans-serif', zorder=5)

def save(fig, name):
    """Save diagram with pixel art enhancements applied."""
    path = os.path.join(OUT, name)

    # Render matplotlib figure to in-memory buffer
    buf = io.BytesIO()
    fig.savefig(buf, dpi=200, bbox_inches='tight', facecolor=LIGHT_BG, edgecolor='none', format='png')
    plt.close(fig)
    buf.seek(0)

    # Open with PIL and apply enhancements
    img = Image.open(buf).convert('RGBA')
    img = post_process(img)
    img.save(path, 'PNG')
    print(f"  [OK] {path}")


# ════════════════════════════════════════════════════════════
# 1. MASTER FLOWCHART
# ════════════════════════════════════════════════════════════
print("Generating diagrams...")
print("  [1/6] Master flowchart...")
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 11); ax.set_ylim(0, 9); ax.set_aspect('equal'); ax.axis('off')
graph_paper_bg(ax)

ax.text(5.5, 8.6, 'WHAT BROUGHT YOU HERE?', ha='center', va='center',
        fontsize=16, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif')
ax.text(5.5, 8.25, 'Master Decision Flowchart', ha='center', va='center',
        fontsize=10, color=GRAY, fontfamily='sans-serif')

draw_box(ax, 5.5, 7.7, 2.5, 0.5, 'WHAT BROUGHT\nYOU HERE?', MATH_BLUE, WHITE, 9)

entries = [(1.5, 6.3, 'A: CAUSED\nTROUBLE', MATH_BLUE),
           (3.5, 6.3, 'B: FEEL\nANXIOUS', '#0EA5E9'),
           (5.5, 6.3, 'C: FEEL\nPAIN', '#0EA5E9'),
           (7.5, 6.3, 'D: FEEL\nENDANGERED', '#0EA5E9'),
           (9.5, 6.3, 'E: CONGESTING', '#0EA5E9')]
for x, y, text, color in entries:
    draw_box(ax, x, y, 1.6, 0.7, text, color, WHITE, 8)
for x, _, _, _ in entries:
    draw_arrow(ax, 5.5, 7.45, x, 6.65, GRAY)

draw_box(ax, 3.5, 5.2, 1.6, 0.7, 'F: BAD\nSMELL', '#0EA5E9', WHITE, 8)
draw_box(ax, 7.5, 5.2, 1.6, 0.7, 'G: NO PLACE\nTO GO', '#0EA5E9', WHITE, 8)
draw_arrow(ax, 3.5, 5.95, 3.5, 5.55, GRAY)
draw_arrow(ax, 7.5, 5.95, 7.5, 5.55, GRAY)
draw_diamond(ax, 5.5, 5.2, 1.8, 0.7, 'Physical\nor Psych?', ORANGE, WHITE, 7)
draw_arrow(ax, 5.5, 5.95, 5.5, 5.55, GRAY)

destinations = [(2.0, 3.5, 'Calm\nGuide', GREEN, 'Ch.4'),
                (4.5, 3.5, 'Self\nAmbulance', RED, 'Ch.5'),
                (7.0, 3.5, 'Zombie\nGuide', PURPLE, 'Ch.6'),
                (9.5, 3.5, 'Prof.\nSupport', MATH_BLUE, 'Ch.7')]
for x, y, text, color, sec in destinations:
    draw_box(ax, x, y, 1.6, 0.7, text, color, WHITE, 8)
    ax.text(x, y-0.5, sec, ha='center', va='center', fontsize=7, color=GRAY, fontfamily='sans-serif')

# Routing arrows
draw_arrow(ax, 1.5, 5.95, 2.0, 3.85, GREEN)
draw_arrow(ax, 1.5, 5.95, 4.5, 3.85, RED)
draw_arrow(ax, 1.5, 5.95, 7.0, 3.85, PURPLE)
draw_arrow(ax, 1.5, 5.95, 9.5, 3.85, MATH_BLUE)
draw_arrow(ax, 3.5, 5.95, 2.0, 3.85, GREEN)
draw_arrow(ax, 3.5, 5.95, 9.5, 3.85, MATH_BLUE)
draw_arrow(ax, 4.8, 5.2, 4.5, 3.85, RED, 'Physical', 6)
draw_arrow(ax, 6.2, 5.2, 2.0, 3.85, GREEN, 'Psych', 6)
draw_arrow(ax, 7.5, 5.95, 9.5, 3.85, MATH_BLUE)
draw_arrow(ax, 7.5, 5.95, 2.0, 3.85, GREEN)
draw_arrow(ax, 9.5, 5.95, 4.5, 3.85, RED)
draw_arrow(ax, 9.5, 5.95, 2.0, 3.85, GREEN)
draw_arrow(ax, 3.5, 4.85, 2.0, 3.85, GREEN, 'minor', 6)
draw_arrow(ax, 7.5, 4.85, 9.5, 3.85, MATH_BLUE)
draw_arrow(ax, 7.5, 4.85, 2.0, 3.85, GREEN)

ax.text(5.5, 2.2, 'Most paths converge on Calm Guide -- it\'s the bathroom\'s core offering.',
        ha='center', va='center', fontsize=9, color=GRAY, style='italic', fontfamily='sans-serif')
save(fig, 'master_flowchart.png')


# ════════════════════════════════════════════════════════════
# 2. BREATHING TECHNIQUES
# ════════════════════════════════════════════════════════════
print("  [2/6] Breathing techniques...")
fig, axes = plt.subplots(1, 3, figsize=(14, 4.5))
fig.patch.set_facecolor(LIGHT_BG)
for ax in axes:
    ax.set_facecolor(GRAPH_PAPER); ax.set_aspect('equal'); ax.axis('off')

# Box breathing
ax = axes[0]; ax.set_xlim(-1.5, 1.5); ax.set_ylim(-1.5, 1.5)
bx, by, bs = -0.8, -0.8, 1.6
ax.plot([bx, bx+bs, bx+bs, bx, bx], [by, by, by+bs, by+bs, by], color=MATH_BLUE, lw=2, alpha=0.3, zorder=3)
arrow_kw = dict(arrowstyle='->', color=MATH_BLUE, lw=2.5, mutation_scale=15)
ax.annotate('', xy=(bx+bs*0.8, by+bs), xytext=(bx+bs*0.2, by+bs), arrowprops=arrow_kw, zorder=4)
ax.text(bx+bs/2, by+bs+0.15, 'INHALE 4s', ha='center', fontsize=8, color=MATH_BLUE, fontweight='bold', fontfamily='sans-serif')
ax.annotate('', xy=(bx+bs, by+bs*0.2), xytext=(bx+bs, by+bs*0.8), arrowprops=arrow_kw, zorder=4)
ax.text(bx+bs+0.15, by+bs/2, 'HOLD 4s', ha='left', fontsize=8, color=MATH_BLUE, fontweight='bold', fontfamily='sans-serif', rotation=270)
ax.annotate('', xy=(bx+bs*0.2, by), xytext=(bx+bs*0.8, by), arrowprops=arrow_kw, zorder=4)
ax.text(bx+bs/2, by-0.2, 'EXHALE 4s', ha='center', fontsize=8, color=MATH_BLUE, fontweight='bold', fontfamily='sans-serif')
ax.annotate('', xy=(bx, by+bs*0.8), xytext=(bx, by+bs*0.2), arrowprops=arrow_kw, zorder=4)
ax.text(bx-0.2, by+bs/2, 'HOLD 4s', ha='right', fontsize=8, color=MATH_BLUE, fontweight='bold', fontfamily='sans-serif', rotation=90)
ax.set_title('Box Breathing\n(4-4-4-4)', fontsize=11, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=10)

# 4-7-8
ax = axes[1]
bars = ax.bar(['Inhale', 'Hold', 'Exhale'], [4, 7, 8], color=[MATH_BLUE, ORANGE, GREEN], edgecolor='none', width=0.6, zorder=3)
ax.set_facecolor(GRAPH_PAPER)
for bar, val in zip(bars, [4, 7, 8]):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.2, f'{val}s', ha='center', fontsize=10, fontweight='bold', color=DARK, fontfamily='sans-serif')
ax.set_ylim(0, 10); ax.set_title('4-7-8 Breathing', fontsize=11, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=10)
ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY); ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8); ax.yaxis.grid(True, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)

# Physiological sigh
ax = axes[2]
t = np.linspace(0, 4*np.pi, 200)
breath = np.zeros_like(t)
for i, ti in enumerate(t):
    phase = ti % (2*np.pi)
    if phase < 0.8: breath[i] = 0.5 * np.sin(phase/0.8 * np.pi/2)
    elif phase < 1.2: breath[i] = 0.5
    elif phase < 2.0: breath[i] = 0.5 + 0.5 * np.sin((phase-1.2)/0.8 * np.pi/2)
    elif phase < 2.4: breath[i] = 1.0
    else: breath[i] = 1.0 * np.cos((phase-2.4)/(2*np.pi-2.4) * np.pi/2)
ax.fill_between(t, 0, breath, alpha=0.3, color=MATH_BLUE, zorder=2)
ax.plot(t, breath, color=MATH_BLUE, lw=2, zorder=3)
ax.set_facecolor(GRAPH_PAPER); ax.set_ylim(-0.1, 1.3)
ax.set_title('Physiological Sigh\n(Emergency Use)', fontsize=11, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=10)
ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY); ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=7)
ax.annotate('Inhale', xy=(0.8, 0.5), fontsize=7, color=DARK, fontfamily='sans-serif')
ax.annotate('Top-up', xy=(2.0, 1.0), fontsize=7, color=DARK, fontfamily='sans-serif')
ax.annotate('Long Exhale', xy=(6.0, 0.3), fontsize=7, color=DARK, fontfamily='sans-serif')

fig.suptitle('Breathing Techniques -- Calm Guide', fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', y=1.02)
fig.tight_layout()
save(fig, 'breathing_techniques.png')


# ════════════════════════════════════════════════════════════
# 3. SITUATION A TREE
# ════════════════════════════════════════════════════════════
print("  [3/6] Situation A decision tree...")
fig, ax = plt.subplots(1, 1, figsize=(14, 12))
ax.set_xlim(0, 14); ax.set_ylim(0, 12); ax.set_aspect('equal'); ax.axis('off')
graph_paper_bg(ax, 14, 12)
ax.text(7, 11.5, 'SITUATION A: "I Caused Trouble"', ha='center', fontsize=14, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif')
draw_box(ax, 7, 10.8, 3, 0.5, 'Biological or Silicon?', ORANGE, WHITE, 9)
draw_box(ax, 2.5, 9.5, 2.2, 0.6, 'SILICON', '#6366F1', WHITE, 8)
draw_arrow(ax, 5.5, 10.55, 2.5, 9.8, DARK)
draw_diamond(ax, 2.5, 8.2, 2.2, 0.6, 'Escaped?', ORANGE, WHITE, 7)
draw_arrow(ax, 2.5, 9.2, 2.5, 8.5, DARK)
draw_box(ax, 1.2, 7.0, 1.8, 0.5, 'BSI -> Calm', GREEN, WHITE, 7)
draw_box(ax, 3.8, 7.0, 1.8, 0.5, 'How feels?', '#6366F1', WHITE, 7)
draw_arrow(ax, 1.7, 7.9, 1.2, 7.25, DARK, 'Yes')
draw_arrow(ax, 3.3, 7.9, 3.8, 7.25, DARK, 'No')
draw_box(ax, 3.8, 5.8, 1.8, 0.6, 'Good: talk\nto host', GREEN, WHITE, 7)
draw_box(ax, 5.8, 5.8, 2.0, 0.6, 'Bad: see Bio\n+ geschlüpft', RED, WHITE, 7)
draw_arrow(ax, 3.3, 6.75, 3.8, 6.1, DARK, 'Good')
draw_arrow(ax, 4.5, 6.75, 5.8, 6.1, DARK, 'Bad')
draw_box(ax, 10, 9.5, 2.5, 0.6, 'BIOLOGICAL', MATH_BLUE, WHITE, 9)
draw_arrow(ax, 8.5, 10.55, 10, 9.8, DARK)
cases = [(8.5, 8.2, 'A1: Not geschlüpft\n-> Med. Support', '#0EA5E9'),
         (11.5, 8.2, 'A2: Geschlüpft\nmin. ago -> 110', PURPLE),
         (8.5, 6.8, 'A3: Days ago\n-> Med + Ethical', '#0EA5E9'),
         (11.5, 6.8, 'A4: <10 years\n-> State support', GREEN),
         (8.5, 5.4, 'A5: >20 years\n-> Grow up pls', GREEN),
         (11.5, 5.4, 'A6: Ambiguous\n-> Calm + Prof.', '#0EA5E9')]
for x, y, text, color in cases:
    draw_box(ax, x, y, 2.2, 0.8, text, color, WHITE, 7)
    draw_arrow(ax, 10, 9.2, x, y+0.4, GRAY)
draw_box(ax, 10, 3.8, 2.5, 0.6, 'A7: Harmed/Ended\na Life Form', RED, WHITE, 8)
draw_arrow(ax, 10, 5.0, 10, 4.1, DARK)
draw_diamond(ax, 8, 2.5, 2.0, 0.6, 'Why?', ORANGE, WHITE, 8)
draw_arrow(ax, 9, 3.5, 8, 2.8, DARK)
draw_box(ax, 5.5, 1.3, 2.0, 0.6, 'Self-defense\n-> Law + Calm', MATH_BLUE, WHITE, 7)
draw_box(ax, 8, 1.3, 2.0, 0.6, 'Accident\n-> Self Amb', RED, WHITE, 7)
draw_box(ax, 10.5, 1.3, 1.6, 0.6, 'For fun?\n-> Stop.', '#1E293B', WHITE, 7)
draw_arrow(ax, 7.3, 2.2, 5.5, 1.6, DARK)
draw_arrow(ax, 8, 2.2, 8, 1.6, DARK)
draw_arrow(ax, 8.7, 2.2, 10.5, 1.6, DARK)
draw_box(ax, 12.5, 3.8, 2.0, 0.6, 'A8: Managing\nresponsibility', '#0EA5E9', WHITE, 7)
save(fig, 'situation_a_tree.png')


# ════════════════════════════════════════════════════════════
# 4. SURVIVAL PYRAMID
# ════════════════════════════════════════════════════════════
print("  [4/6] Survival priority pyramid...")
fig, ax = plt.subplots(1, 1, figsize=(8, 7))
ax.set_xlim(0, 10); ax.set_ylim(0, 8); ax.set_aspect('equal'); ax.axis('off')
graph_paper_bg(ax, 10, 8)
ax.text(5, 7.5, 'Survival Priority Pyramid -- Zombie Guide', ha='center', fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif')
layers = [(1, 1.5, 8, 1.2, 'WATER (3 days to live)', '#2563EB', WHITE),
          (1.8, 2.9, 6.4, 1.0, 'SHELTER (exposure kills fast)', '#3B82F6', WHITE),
          (2.5, 4.1, 5.0, 0.9, 'FOOD (3 weeks, but brain needs calories)', '#60A5FA', DARK),
          (3.2, 5.2, 3.6, 0.8, 'HYGIENE (infection is the real killer)', '#93C5FD', DARK),
          (3.8, 6.2, 2.4, 0.7, 'ENERGY (conserve -> invest)', '#BFDBFE', DARK)]
for x, y, w, h, text, fc, tc in layers:
    rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05", facecolor=fc, edgecolor='none', alpha=0.9, zorder=3)
    ax.add_patch(rect)
    ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=9, color=tc, fontweight='bold', fontfamily='sans-serif', zorder=4)
for x, y, text in [(9.3, 2.1, '3 days'), (9.3, 3.4, 'Hours'), (9.3, 4.55, '3 weeks'), (9.3, 5.6, 'Days'), (9.3, 6.55, 'Ongoing')]:
    ax.text(x, y, text, ha='center', fontsize=7, color=GRAY, fontfamily='sans-serif', style='italic')
ax.annotate('', xy=(0.5, 6.8), xytext=(0.5, 1.5), arrowprops=dict(arrowstyle='->', color=DARK, lw=2))
ax.text(0.5, 4.0, 'P\nR\nI\nO\nR\nI\nT\nY', ha='center', va='center', fontsize=7, color=DARK, fontweight='bold', fontfamily='sans-serif')
save(fig, 'survival_pyramid.png')


# ════════════════════════════════════════════════════════════
# 5. SCALING CHART
# ════════════════════════════════════════════════════════════
print("  [5/6] Society scaling chart...")
fig, ax = plt.subplots(1, 1, figsize=(10, 5))
ax.set_facecolor(GRAPH_PAPER); fig.patch.set_facecolor(LIGHT_BG)
scales = [1, 5, 10, 25, 50, 100]
challenges = ['Loneliness', 'Communication', 'Coordination', 'Decision speed', 'Sub-groups', 'Governance']
complexity = [2, 4, 6, 8, 9, 10]
colors = [MATH_BLUE, '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']
bars = ax.bar(range(len(scales)), complexity, color=colors, edgecolor='none', width=0.7, zorder=3)
for bar, scale, chal, comp in zip(bars, scales, challenges, complexity):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.2, f'{comp}/10', ha='center', fontsize=8, fontweight='bold', color=DARK, fontfamily='sans-serif')
    ax.text(bar.get_x()+bar.get_width()/2, -0.6, f'{scale}ppl', ha='center', fontsize=8, color=DARK, fontfamily='sans-serif')
    ax.text(bar.get_x()+bar.get_width()/2, -1.1, chal, ha='center', fontsize=6, color=GRAY, fontfamily='sans-serif', style='italic')
ax.set_xticks([]); ax.set_ylim(-1.5, 11)
ax.set_ylabel('Coordination Complexity', fontsize=9, color=DARK, fontfamily='sans-serif')
ax.set_title('Scaling: 1 -> 100 People -- Zombie Guide', fontsize=12, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=10)
ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY); ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8); ax.yaxis.grid(True, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)
fig.tight_layout()
save(fig, 'scaling_chart.png')


# ════════════════════════════════════════════════════════════
# 6. TRIAGE FLOW
# ════════════════════════════════════════════════════════════
print("  [6/6] Triage decision flow...")
fig, ax = plt.subplots(1, 1, figsize=(10, 7))
ax.set_xlim(0, 10); ax.set_ylim(0, 7); ax.set_aspect('equal'); ax.axis('off')
graph_paper_bg(ax, 10, 7)
ax.text(5, 6.6, 'Self Ambulance -- Triage Flow', ha='center', fontsize=13, fontweight='bold', color=RED, fontfamily='sans-serif')
draw_diamond(ax, 5, 5.6, 3.0, 0.7, 'Life-threatening?', RED, WHITE, 9)
draw_box(ax, 2.5, 4.2, 2.2, 0.6, 'CALL 112\nIMMEDIATELY', RED, WHITE, 9, True)
draw_arrow(ax, 3.8, 5.6, 2.5, 4.5, RED, 'YES')
draw_diamond(ax, 7.5, 4.2, 2.5, 0.7, 'Physical or\nPsychological?', ORANGE, WHITE, 8)
draw_arrow(ax, 6.3, 5.6, 7.5, 4.55, GREEN, 'NO')
draw_box(ax, 5.8, 2.8, 2.0, 0.6, 'Physical Pain\n-> First Aid', '#0EA5E9', WHITE, 8)
draw_arrow(ax, 6.5, 3.85, 5.8, 3.1, DARK, 'Physical')
draw_box(ax, 9.0, 2.8, 2.0, 0.6, 'Psych Pain\n-> Calm Guide', GREEN, WHITE, 8)
draw_arrow(ax, 8.5, 3.85, 9.0, 3.1, DARK, 'Psych')
draw_box(ax, 2.5, 2.8, 2.2, 0.6, 'While waiting:\nSpeakerphone\nUnlock door', ORANGE, WHITE, 7)
draw_arrow(ax, 2.5, 3.9, 2.5, 3.1, DARK)
draw_box(ax, 5, 1.3, 3.0, 0.5, '-> Calm Guide (breathing)', GREEN, WHITE, 9)
draw_arrow(ax, 5.8, 2.5, 5, 1.55, GREEN)
draw_arrow(ax, 9.0, 2.5, 5, 1.55, GREEN)
draw_arrow(ax, 2.5, 2.5, 5, 1.55, GREEN)
save(fig, 'triage_flow.png')

print("\nAll 6 diagrams generated successfully (with pixel art enhancements).")

# Generate v3.2 scientific diagrams
import subprocess
subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'generate_scientific.py'), OUT])
