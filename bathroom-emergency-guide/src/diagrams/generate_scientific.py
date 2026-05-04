#!/usr/bin/env python3
"""
Bathroom Emergency Guide v3.2 — Scientific Diagram Generator
Generates 8 new scientific diagrams for the guide with pixel art aesthetic enhancements.

Diagrams:
  1. stress_decay_curve.png         — Ch.4 Calm Guide
  2. anxiety_severity_spectrum.png  — Ch.3 Situations B-G
  3. triage_priority_heatmap.png    — Ch.5 Self Ambulance
  4. survival_probability_function.png — Ch.6 Zombie Guide
  5. group_complexity_scaling.png   — Ch.6 Zombie Guide
  6. pain_nrs_correlates.png        — Ch.3/Ch.5 Pain
  7. decision_flow_graph.png        — Ch.1 How to Use
  8. water_requirements_scaling.png — Ch.6 Zombie Guide

Usage:
    python generate_scientific.py [OUTPUT_DIR]

    OUTPUT_DIR: target directory for PNG files (default: ../../build/diagrams)
"""
import sys
import os
import io
import math

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.colors as mcolors
from matplotlib.patches import FancyBboxPatch
from matplotlib.collections import PatchCollection
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Output directory
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'build', 'diagrams')
os.makedirs(OUT, exist_ok=True)

# ── Color Palette (identical to generate_all.py) ──────────
MATH_BLUE = '#2563EB'
LIGHT_BG = '#F8FAFC'
GRAPH_PAPER = '#FBF7F0'
GRAPH_PAPER_LINE = '#E8E2D8'
GRAPH_PAPER_LINE_MAJ = '#D5CEC2'
GREEN = '#22C55E'
RED = '#EF4444'
ORANGE = '#F97316'
PURPLE = '#A855F7'
GRAY = '#94A3B8'
WHITE = '#FFFFFF'
DARK = '#1E293B'
CYAN = '#06B6D4'

# ── Pixel Art Enhancement Config (identical to generate_all.py) ──
SPRITE_DIR = OUT
SPRITE_NAMES = {
    'bathroom_icon.png', 'water_drop.png', 'brain.png', 'heart.png',
    'zombie_hand.png', 'flame.png', 'shield.png', 'book.png',
    'breath.png', 'first_aid.png', 'compass.png', 'pixel_border.png'
}
CORNER_SPRITES = ['shield.png', 'flame.png', 'heart.png', 'compass.png']
BORDER_COLOR = '#2563EB'
BORDER_WIDTH = 4
BORDER_INNER_GAP = 2
CORNER_SPRITE_SCALE = 2
CORNER_PADDING = 12
SCANLINE_ALPHA = 18

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


# ── Post-Processing Helpers (identical to generate_all.py) ──
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
    bw = BORDER_WIDTH
    gap = BORDER_INNER_GAP
    total = bw * 2 + gap * 2
    new_w = w + total
    new_h = h + total
    framed = Image.new('RGBA', (new_w, new_h), (0, 0, 0, 0))

    draw = ImageDraw.Draw(framed)
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

    # Corner decorations
    corner_size = 3
    corners = [
        (bw // 2, bw // 2),
        (new_w - 1 - bw // 2, bw // 2),
        (bw // 2, new_h - 1 - bw // 2),
        (new_w - 1 - bw // 2, new_h - 1 - bw // 2),
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

        sw, sh = sprite.size
        new_sw = sw * CORNER_SPRITE_SCALE
        new_sh = sh * CORNER_SPRITE_SCALE
        sprite_scaled = sprite.resize((new_sw, new_sh), Image.NEAREST)

        if corner == 'top-left':
            paste_x, paste_y = cx, cy
        elif corner == 'top-right':
            paste_x, paste_y = cx - new_sw, cy
        elif corner == 'bottom-left':
            paste_x, paste_y = cx, cy - new_sh
        else:
            paste_x, paste_y = cx - new_sw, cy - new_sh

        paste_x = max(0, min(paste_x, w - new_sw))
        paste_y = max(0, min(paste_y, h - new_sh))

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


# ── Helpers (identical to generate_all.py) ────────────────
def graph_paper_bg(ax, x_max=11, y_max=9):
    ax.set_facecolor(GRAPH_PAPER)
    for x in np.arange(0, x_max + 0.5, 0.5):
        ax.axvline(x, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)
    for y in np.arange(0, y_max + 0.5, 0.5):
        ax.axhline(y, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)
    for x in np.arange(0, x_max + 1, 1):
        ax.axvline(x, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)
    for y in np.arange(0, y_max + 1, 1):
        ax.axhline(y, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)


def draw_box(ax, x, y, w, h, text, color=MATH_BLUE, text_color=WHITE, fontsize=9, bold=True):
    box = FancyBboxPatch((x - w / 2, y - h / 2), w, h,
                          boxstyle="round,pad=0.1",
                          facecolor=color, edgecolor='none',
                          zorder=3, alpha=0.95)
    ax.add_patch(box)
    weight = 'bold' if bold else 'normal'
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight=weight, zorder=4, fontfamily='sans-serif')


def draw_diamond(ax, x, y, w, h, text, color=ORANGE, text_color=WHITE, fontsize=8):
    diamond = plt.Polygon([(x, y + h / 2), (x + w / 2, y), (x, y - h / 2), (x - w / 2, y)],
                           facecolor=color, edgecolor='none', alpha=0.95, zorder=3)
    ax.add_patch(diamond)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight='bold', zorder=4, fontfamily='sans-serif')


def draw_arrow(ax, x1, y1, x2, y2, color=DARK, label=None, fontsize=7):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.5), zorder=2)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx + 0.1, my + 0.1, label, fontsize=fontsize, color=color,
                fontweight='bold', fontfamily='sans-serif', zorder=5)


def save(fig, name):
    """Save diagram with pixel art enhancements applied."""
    path = os.path.join(OUT, name)

    buf = io.BytesIO()
    fig.savefig(buf, dpi=200, bbox_inches='tight', facecolor=LIGHT_BG, edgecolor='none', format='png')
    plt.close(fig)
    buf.seek(0)

    img = Image.open(buf).convert('RGBA')
    img = post_process(img)
    img.save(path, 'PNG')
    print(f"  [OK] {path}")


# ════════════════════════════════════════════════════════════════
# 1. STRESS DECAY CURVE
# ════════════════════════════════════════════════════════════════
print("Generating v3.2 scientific diagrams...")
print("  [1/8] Stress decay curve...")
fig, ax = plt.subplots(1, 1, figsize=(10, 6))
ax.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

# Cortisol half-life ~90 min => lambda = ln(2)/90 ≈ 0.0077 per minute
# We plot over 0-60 minutes
t = np.linspace(0, 60, 300)
lam = np.log(2) / 90  # per minute
C0 = 1.0
C = C0 * np.exp(-lam * t)

# 10-minute reset window shaded region
ax.axvspan(0, 10, alpha=0.18, color=GREEN, zorder=1, label='10-min reset window')

# Plot the decay curve
ax.plot(t, C, color=MATH_BLUE, lw=2.5, zorder=3, label='C(t) = C₀·e$^{-\\lambda t}$')

# 50% decay mark — when C = 0.5
t_half = 90  # minutes (outside our range, so we show the projected value at t=60)
C_at_60 = C0 * np.exp(-lam * 60)
ax.axhline(y=0.5, color=GRAY, ls=':', lw=1.5, zorder=2, label='50% decay mark')

# Dotted vertical line at t=10
ax.axvline(x=10, color=GREEN, ls='--', lw=1, alpha=0.7, zorder=2)

# Annotation: Sympathetic → Parasympathetic transition
ax.annotate('Sympathetic → Parasympathetic\ntransition zone',
            xy=(10, C0 * np.exp(-lam * 10)), xytext=(25, 0.75),
            fontsize=9, color=DARK, fontfamily='sans-serif',
            arrowprops=dict(arrowstyle='->', color=DARK, lw=1.2),
            bbox=dict(boxstyle='round,pad=0.3', facecolor=GRAPH_PAPER, edgecolor=GRAY, alpha=0.9),
            zorder=5)

# Annotation at the 50% mark
ax.annotate(f'50% at t=90 min\n(cortisol half-life)',
            xy=(60, 0.5), xytext=(40, 0.35),
            fontsize=8, color=GRAY, fontfamily='sans-serif',
            arrowprops=dict(arrowstyle='->', color=GRAY, lw=1),
            zorder=5)

# Shade the curve area lightly
ax.fill_between(t, 0, C, alpha=0.08, color=MATH_BLUE, zorder=1)

ax.set_xlim(0, 60)
ax.set_ylim(0, 1.05)
ax.set_xlabel('Time (minutes)', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_ylabel('Cortisol / Stress Level (normalized)', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_title('Stress Decay Curve — Your 10-Minute Reset Window',
             fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)

ax.legend(loc='upper right', fontsize=8, framealpha=0.9, edgecolor=GRAPH_PAPER_LINE_MAJ)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY)
ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8)
ax.yaxis.grid(True, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)
ax.xaxis.grid(True, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)

fig.tight_layout()
save(fig, 'stress_decay_curve.png')


# ════════════════════════════════════════════════════════════════
# 2. ANXIETY SEVERITY SPECTRUM
# ════════════════════════════════════════════════════════════════
print("  [2/8] Anxiety severity spectrum...")
fig, ax = plt.subplots(1, 1, figsize=(12, 5))
ax.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

# GAD-7 segments
segments = [
    (0, 4, '#22C55E', 'Minimal\n(0–4)', 'Self-care\n(Breathing, journaling)'),
    (5, 9, '#EAB308', 'Mild\n(5–9)', 'Calm Guide\n(Ch.4 techniques)'),
    (10, 14, '#F97316', 'Moderate\n(10–14)', 'Professional\nSupport (Ch.7)'),
    (15, 21, '#EF4444', 'Severe\n(15–21)', 'Crisis\nIntervention (112)'),
]

for lo, hi, color, label, action in segments:
    width = hi - lo + 1
    rect = FancyBboxPatch((lo, 1.5), width, 1.5,
                           boxstyle="round,pad=0.1",
                           facecolor=color, edgecolor='none', alpha=0.85, zorder=3)
    ax.add_patch(rect)
    mid = (lo + hi) / 2
    ax.text(mid, 2.25, label, ha='center', va='center', fontsize=10,
            fontweight='bold', color=WHITE, fontfamily='sans-serif', zorder=4)
    ax.text(mid, 0.7, action, ha='center', va='center', fontsize=8,
            color=DARK, fontfamily='sans-serif', zorder=4,
            bbox=dict(boxstyle='round,pad=0.2', facecolor=GRAPH_PAPER, edgecolor=GRAPH_PAPER_LINE_MAJ, alpha=0.9))

# Tick marks for key scores
for score in range(0, 22, 5):
    ax.axvline(x=score, color=GRAPH_PAPER_LINE_MAJ, lw=0.5, zorder=1, ymin=0.35, ymax=0.65)

ax.set_xlim(-1, 23)
ax.set_ylim(-0.2, 4.0)
ax.set_xlabel('GAD-7 Score', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_title('GAD-7 Anxiety Severity Spectrum',
             fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)
ax.set_xticks(range(0, 22, 3))
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.set_yticks([])
ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8)
ax.yaxis.grid(False)
ax.xaxis.grid(True, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)

fig.tight_layout()
save(fig, 'anxiety_severity_spectrum.png')


# ════════════════════════════════════════════════════════════════
# 3. TRIAGE PRIORITY HEATMAP
# ════════════════════════════════════════════════════════════════
print("  [3/8] Triage priority heatmap...")
fig, ax = plt.subplots(1, 1, figsize=(8, 7))
ax.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

severity = np.arange(1, 6)
urgency = np.arange(1, 6)

# Priority = severity * urgency
S, U = np.meshgrid(severity, urgency)
priority = S * U  # 1..25

# Custom colormap: green -> yellow -> orange -> red
cmap_colors = ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444', '#DC2626']
cmap = mcolors.LinearSegmentedColormap.from_list('triage', cmap_colors, N=256)

im = ax.imshow(priority, cmap=cmap, origin='lower', aspect='equal',
               extent=[0.5, 5.5, 0.5, 5.5], vmin=1, vmax=25, zorder=2)

# Label key cells
labels = {
    (1, 1): 'Monitor',
    (3, 1): 'Schedule',
    (1, 3): 'Watch',
    (3, 3): 'Act Soon',
    (5, 1): 'Urgent\nCare',
    (1, 5): 'Elevated',
    (5, 3): 'High\nPriority',
    (3, 5): 'Escalate',
    (5, 5): 'Call 112',
    (4, 4): 'Urgent',
    (2, 2): 'Low',
}

for (s, u), text in labels.items():
    val = s * u
    text_color = WHITE if val > 10 else DARK
    ax.text(s, u, text, ha='center', va='center', fontsize=8,
            fontweight='bold', color=text_color, fontfamily='sans-serif', zorder=4)

# Add numeric priority in smaller text
for i in range(1, 6):
    for j in range(1, 6):
        val = i * j
        text_color = WHITE if val > 10 else DARK
        ax.text(i, j - 0.3, f'({val})', ha='center', va='center', fontsize=6,
                color=text_color, alpha=0.6, fontfamily='sans-serif', zorder=4)

ax.set_xticks(severity)
ax.set_yticks(urgency)
ax.set_xlabel('Severity (1–5)', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_ylabel('Urgency (1–5)', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_title('Triage Priority Matrix — Severity × Urgency',
             fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)
ax.tick_params(colors=DARK, labelsize=9)

# Colorbar
cbar = fig.colorbar(im, ax=ax, shrink=0.8, pad=0.02)
cbar.set_label('Priority Score', fontsize=9, color=DARK, fontfamily='sans-serif')
cbar.ax.tick_params(colors=DARK, labelsize=8)

fig.tight_layout()
save(fig, 'triage_priority_heatmap.png')


# ════════════════════════════════════════════════════════════════
# 4. SURVIVAL PROBABILITY FUNCTION
# ════════════════════════════════════════════════════════════════
print("  [4/8] Survival probability function...")
fig, ax = plt.subplots(1, 1, figsize=(10, 6))
ax.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

# Water: steep exponential decay — survival drops to near 0 by day 3
t_water = np.linspace(0, 7, 300)
P_water = np.exp(-1.2 * t_water)

# Food: gradual decay — survival over 30 days
t_food = np.linspace(0, 30, 300)
P_food = np.exp(-0.08 * t_food)

# Shelter: context-dependent, flatter curve
t_shelter = np.linspace(0, 30, 300)
P_shelter = 1.0 / (1.0 + 0.03 * t_shelter**1.5)

ax.plot(t_water, P_water, color=RED, lw=2.5, zorder=3, label='Water (days)')
ax.plot(t_food, P_food, color=ORANGE, lw=2.5, zorder=3, label='Food (days)')
ax.plot(t_shelter, P_shelter, color=MATH_BLUE, lw=2.5, ls='--', zorder=3, label='Shelter (context)')

# Fill under curves lightly
ax.fill_between(t_water, 0, P_water, alpha=0.08, color=RED, zorder=1)
ax.fill_between(t_food, 0, P_food, alpha=0.06, color=ORANGE, zorder=1)

# Rule of 3s annotations
rule_of_3s = [
    (0.0, 0.15, '3 minutes\nwithout air', RED),
    (3.0, 0.15, '3 days\nwithout water', RED),
    (21.0, 0.15, '3 weeks\nwithout food', ORANGE),
]
for x, y, text, color in rule_of_3s:
    ax.axvline(x=x, color=color, ls=':', lw=1, alpha=0.5, zorder=2)
    ax.annotate(text, xy=(x, y), xytext=(x, y + 0.18),
                fontsize=7, color=color, fontfamily='sans-serif', fontweight='bold',
                ha='center', zorder=5,
                bbox=dict(boxstyle='round,pad=0.2', facecolor=GRAPH_PAPER, edgecolor=color, alpha=0.85))

ax.set_xlim(0, 30)
ax.set_ylim(0, 1.05)
ax.set_xlabel('Days', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_ylabel('Survival Probability', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_title('Survival Probability — The Rule of 3s',
             fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)
ax.legend(loc='upper right', fontsize=9, framealpha=0.9, edgecolor=GRAPH_PAPER_LINE_MAJ)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY)
ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8)
ax.yaxis.grid(True, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)
ax.xaxis.grid(True, color=GRAPH_PAPER_LINE, linewidth=0.3, zorder=0)

fig.tight_layout()
save(fig, 'survival_probability_function.png')


# ════════════════════════════════════════════════════════════════
# 5. GROUP COMPLEXITY SCALING
# ════════════════════════════════════════════════════════════════
print("  [5/8] Group complexity scaling...")
fig, ax1 = plt.subplots(1, 1, figsize=(10, 6))
ax1.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

# Group sizes
group_sizes = np.array([1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 75, 100, 150])
comm_channels = group_sizes * (group_sizes - 1) / 2  # C(n) = n(n-1)/2

# Plot communication channels on left y-axis
ax1.plot(group_sizes, comm_channels, color=MATH_BLUE, lw=2.5, marker='o',
         markersize=5, zorder=3, label='Communication channels C(n)')
ax1.fill_between(group_sizes, 0, comm_channels, alpha=0.08, color=MATH_BLUE, zorder=1)

ax1.set_xlabel('Group Size', fontsize=10, color=DARK, fontfamily='sans-serif')
ax1.set_ylabel('Communication Channels C(n) = n(n-1)/2', fontsize=10, color=MATH_BLUE, fontfamily='sans-serif')
ax1.tick_params(axis='y', colors=MATH_BLUE, labelsize=8)
ax1.tick_params(axis='x', colors=DARK, labelsize=8)

# Mark Dunbar numbers
dunbar_numbers = {
    5: ('Support\ncircle', GREEN),
    15: ('Sympathy\ngroup', ORANGE),
    50: ('Band', PURPLE),
    150: ('Community\n(Dunbar #)', RED),
}
for n, (label, color) in dunbar_numbers.items():
    c_val = n * (n - 1) / 2
    ax1.axvline(x=n, color=color, ls='--', lw=1, alpha=0.6, zorder=2)
    ax1.plot(n, c_val, 's', color=color, markersize=10, zorder=5)
    ax1.annotate(f'{label}\nn={n}', xy=(n, c_val), xytext=(n + 8, c_val + 500),
                 fontsize=7, color=color, fontfamily='sans-serif', fontweight='bold',
                 arrowprops=dict(arrowstyle='->', color=color, lw=1),
                 zorder=5)

# Right y-axis: Coordination complexity (qualitative)
ax2 = ax1.twinx()
# Qualitative complexity: 1-10 scale based on channels but compressed
coord_complexity = np.log1p(comm_channels) / np.log1p(comm_channels.max()) * 10
ax2.plot(group_sizes, coord_complexity, color=ORANGE, lw=2, ls='--',
         marker='D', markersize=4, zorder=3, label='Coordination complexity')
ax2.set_ylabel('Coordination Complexity (1–10)', fontsize=10, color=ORANGE, fontfamily='sans-serif')
ax2.tick_params(axis='y', colors=ORANGE, labelsize=8)
ax2.set_ylim(0, 11)

ax1.set_title('Group Complexity Scaling — Dunbar Numbers & Communication Overhead',
              fontsize=12, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)
ax1.spines['top'].set_visible(False)
ax1.spines['left'].set_color(MATH_BLUE)
ax1.spines['right'].set_color(ORANGE)
ax1.spines['bottom'].set_color(GRAY)
ax1.yaxis.grid(True, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)

# Combined legend
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=8,
           framealpha=0.9, edgecolor=GRAPH_PAPER_LINE_MAJ)

fig.tight_layout()
save(fig, 'group_complexity_scaling.png')


# ════════════════════════════════════════════════════════════════
# 6. PAIN NRS CORRELATES
# ════════════════════════════════════════════════════════════════
print("  [6/8] Pain NRS correlates...")
fig, ax = plt.subplots(1, 1, figsize=(12, 6))
ax.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

nrs_levels = np.arange(0, 11)

# Color gradient: green(0) -> yellow(4) -> orange(7) -> red(10)
color_stops = [
    (0, '#22C55E'), (1, '#4ADE47'), (2, '#84CC16'), (3, '#A3E635'),
    (4, '#EAB308'), (5, '#F59E0B'), (6, '#F59E0B'), (7, '#F97316'),
    (8, '#EA580C'), (9, '#EF4444'), (10, '#DC2626'),
]

# Pain descriptors
descriptors = ['None', 'Barely\nnoticeable', 'Minor', 'Mild', 'Moderate\n(low)',
               'Moderate', 'Moderate\n(severe)', 'Severe', 'Very\nsevere',
               'Extreme', 'Worst\npossible']

# Physiological correlates
physio = [
    'Baseline',
    'Slight HR ↑',
    'HR ↑ 10%',
    'HR ↑ 15%\nBP ↑',
    'HR ↑ 20%\nBP ↑\nCortisol ↑',
    'HR ↑ 25%\nBP ↑↑\nCortisol ↑',
    'HR ↑ 30%\nBP ↑↑\nCortisol ↑↑',
    'HR ↑ 40%\nBP ↑↑↑\nSweating',
    'HR ↑ 50%\nBP crisis\nPale/sweating',
    'HR ↑ 60%+\nShock risk\nDiaphoresis',
    'HR max\nShock\nUnconscious risk',
]

bar_height = 1.2
for i in range(11):
    color = color_stops[i][1]
    rect = FancyBboxPatch((i - 0.45, 3), 0.9, bar_height,
                           boxstyle="round,pad=0.02",
                           facecolor=color, edgecolor='none', alpha=0.85, zorder=3)
    ax.add_patch(rect)
    ax.text(i, 3 + bar_height / 2, str(i), ha='center', va='center',
            fontsize=11, fontweight='bold', color=WHITE, fontfamily='sans-serif', zorder=4)

    # Descriptor below
    ax.text(i, 2.3, descriptors[i], ha='center', va='top', fontsize=6,
            color=DARK, fontfamily='sans-serif', zorder=4)

    # Physiological correlates below that
    ax.text(i, 1.0, physio[i], ha='center', va='top', fontsize=5.5,
            color=GRAY, fontfamily='sans-serif', zorder=4,
            bbox=dict(boxstyle='round,pad=0.15', facecolor=GRAPH_PAPER,
                      edgecolor=GRAPH_PAPER_LINE_MAJ, alpha=0.85))

# Category brackets
brackets = [
    (0, 3, 'Mild', '#22C55E'),
    (4, 6, 'Moderate', '#F59E0B'),
    (7, 10, 'Severe', '#EF4444'),
]
for lo, hi, label, color in brackets:
    mid = (lo + hi) / 2
    ax.annotate('', xy=(lo - 0.45, 4.5), xytext=(hi + 0.45, 4.5),
                arrowprops=dict(arrowstyle='|-|', color=color, lw=1.5), zorder=3)
    ax.text(mid, 4.8, label, ha='center', va='bottom', fontsize=9,
            fontweight='bold', color=color, fontfamily='sans-serif', zorder=4)

ax.set_xlim(-1, 11)
ax.set_ylim(-0.2, 5.5)
ax.set_xlabel('Numeric Rating Scale (NRS)', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_title('Numeric Rating Scale — Pain with Physiological Correlates',
             fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)
ax.set_xticks(nrs_levels)
ax.set_yticks([])
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8)

fig.tight_layout()
save(fig, 'pain_nrs_correlates.png')


# ════════════════════════════════════════════════════════════════
# 7. DECISION FLOW GRAPH
# ════════════════════════════════════════════════════════════════
print("  [7/8] Decision flow graph...")
fig, ax = plt.subplots(1, 1, figsize=(14, 9))
ax.set_xlim(0, 14)
ax.set_ylim(0, 9)
ax.set_aspect('equal')
ax.axis('off')
graph_paper_bg(ax, 14, 9)

ax.text(7, 8.6, 'Guide Topology — 7 Entry Nodes → 4 Destination Nodes',
        ha='center', fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif')

# Entry nodes (A-G) at top — sizes proportional to reference frequency
entry_nodes = [
    (1.0, 7.2, 'A', 'Caused\nTrouble', MATH_BLUE, 0.40),
    (3.0, 7.2, 'B', 'Anxious', '#0EA5E9', 0.35),
    (5.0, 7.2, 'C', 'Pain', '#0EA5E9', 0.30),
    (7.0, 7.2, 'D', 'Endangered', '#0EA5E9', 0.20),
    (9.0, 7.2, 'E', 'Congesting', '#0EA5E9', 0.25),
    (11.0, 7.2, 'F', 'Bad Smell', '#0EA5E9', 0.15),
    (13.0, 7.2, 'G', 'No Place', '#0EA5E9', 0.20),
]

# Destination nodes at bottom
dest_nodes = [
    (2.5, 1.8, 'Ch.4', 'Calm\nGuide', GREEN, 0.50),
    (5.5, 1.8, 'Ch.5', 'Self\nAmbulance', RED, 0.30),
    (8.5, 1.8, 'Ch.6', 'Zombie\nGuide', PURPLE, 0.15),
    (11.5, 1.8, 'Ch.7', 'Professional\nSupport', MATH_BLUE, 0.25),
]

# Draw entry nodes with size proportional to frequency
for x, y, letter, label, color, freq in entry_nodes:
    size = 0.4 + freq * 0.6  # scale node size
    draw_box(ax, x, y, size * 2.5, size * 2, f'{letter}\n{label}', color, WHITE, 7)
    # Frequency label
    ax.text(x, y - size - 0.1, f'p={freq:.0%}', ha='center', fontsize=6,
            color=GRAY, fontfamily='sans-serif', zorder=5)

# Draw destination nodes
for x, y, ch, label, color, freq in dest_nodes:
    size = 0.4 + freq * 0.6
    draw_box(ax, x, y, size * 3, size * 2.2, f'{ch}\n{label}', color, WHITE, 8)
    ax.text(x, y - size - 0.15, f'p={freq:.0%}', ha='center', fontsize=6,
            color=GRAY, fontfamily='sans-serif', zorder=5)

# Edge connections with weights (entry → destination)
edges = [
    # A → destinations
    ('A', 'Ch.4', 0.40), ('A', 'Ch.5', 0.30), ('A', 'Ch.6', 0.10), ('A', 'Ch.7', 0.20),
    # B → destinations
    ('B', 'Ch.4', 0.55), ('B', 'Ch.7', 0.35), ('B', 'Ch.5', 0.10),
    # C → destinations
    ('C', 'Ch.5', 0.50), ('C', 'Ch.4', 0.25), ('C', 'Ch.7', 0.25),
    # D → destinations
    ('D', 'Ch.5', 0.35), ('D', 'Ch.7', 0.35), ('D', 'Ch.4', 0.20), ('D', 'Ch.6', 0.10),
    # E → destinations
    ('E', 'Ch.5', 0.40), ('E', 'Ch.4', 0.30), ('E', 'Ch.6', 0.20), ('E', 'Ch.7', 0.10),
    # F → destinations
    ('F', 'Ch.4', 0.45), ('F', 'Ch.7', 0.30), ('F', 'Ch.6', 0.25),
    # G → destinations
    ('G', 'Ch.4', 0.35), ('G', 'Ch.7', 0.30), ('G', 'Ch.6', 0.25), ('G', 'Ch.5', 0.10),
]

# Map node names to positions
entry_pos = {n[2]: (n[0], n[1]) for n in entry_nodes}
dest_pos = {n[2]: (n[0], n[1]) for n in dest_nodes}

# Draw edges with varying thickness/alpha based on weight
for src, dst, weight in edges:
    sx, sy = entry_pos[src]
    dx, dy = dest_pos[dst]
    lw = 0.5 + weight * 4
    alpha = 0.3 + weight * 0.7

    # Curve the arrows slightly for readability
    mid_y = (sy + dy) / 2
    ax.annotate('', xy=(dx, dy + 0.5), xytext=(sx, sy - 0.6),
                arrowprops=dict(arrowstyle='->', color=MATH_BLUE,
                                lw=lw, alpha=alpha,
                                connectionstyle='arc3,rad=0.1'),
                zorder=2)

    # Edge weight label at midpoint
    mx = (sx + dx) / 2 + np.random.uniform(-0.3, 0.3)
    my = mid_y + np.random.uniform(-0.2, 0.2)
    ax.text(mx, my, f'{weight:.0%}', fontsize=5, color=GRAY,
            fontfamily='sans-serif', ha='center', alpha=0.7, zorder=5)

# Layer labels
ax.text(7, 6.2, 'ENTRY SITUATIONS (7 nodes)', ha='center', fontsize=8,
        color=GRAY, fontfamily='sans-serif', style='italic')
ax.text(7, 3.0, 'DESTINATION GUIDES (4 nodes)', ha='center', fontsize=8,
        color=GRAY, fontfamily='sans-serif', style='italic')

save(fig, 'decision_flow_graph.png')


# ════════════════════════════════════════════════════════════════
# 8. WATER REQUIREMENTS SCALING
# ════════════════════════════════════════════════════════════════
print("  [8/8] Water requirements scaling...")
fig, ax = plt.subplots(1, 1, figsize=(10, 6))
ax.set_facecolor(GRAPH_PAPER)
fig.patch.set_facecolor(LIGHT_BG)

group_sizes = [1, 5, 10, 25, 50, 100]
x_pos = np.arange(len(group_sizes))

# Water components per person per day (liters)
drinking = 3  # L/person/day
cooking = 2   # L/person/day
hygiene = 5   # L/person/day
total_per_person = drinking + cooking + hygiene  # 10 L/person/day

# Calculate totals for each group size
drinking_totals = [s * drinking for s in group_sizes]
cooking_totals = [s * cooking for s in group_sizes]
hygiene_totals = [s * hygiene for s in group_sizes]

# Stacked bar chart
bar_width = 0.5
bars1 = ax.bar(x_pos, drinking_totals, bar_width, label=f'Drinking ({drinking}L/person)',
               color='#06B6D4', edgecolor='none', zorder=3, alpha=0.9)
bars2 = ax.bar(x_pos, cooking_totals, bar_width, bottom=drinking_totals,
               label=f'Cooking ({cooking}L/person)',
               color='#22D3EE', edgecolor='none', zorder=3, alpha=0.9)
bars3 = ax.bar(x_pos, hygiene_totals, bar_width,
               bottom=[d + c for d, c in zip(drinking_totals, cooking_totals)],
               label=f'Hygiene ({hygiene}L/person)',
               color='#67E8F9', edgecolor='none', zorder=3, alpha=0.9)

# Total labels on top of each bar
for i, (s, dt, ct, ht) in enumerate(zip(group_sizes, drinking_totals, cooking_totals, hygiene_totals)):
    total = dt + ct + ht
    ax.text(i, total + 10, f'{total}L', ha='center', fontsize=8,
            fontweight='bold', color=DARK, fontfamily='sans-serif', zorder=4)
    ax.text(i, total + 30, f'({total_per_person}L/person)', ha='center', fontsize=6,
            color=GRAY, fontfamily='sans-serif', zorder=4)

# WHO minimum line: 15L/person/day
who_line = [s * 15 for s in group_sizes]
ax.plot(x_pos, who_line, color=RED, ls='--', lw=2, marker='v', markersize=6,
        zorder=5, label='WHO minimum (15L/person/day)')

# Annotation for WHO line
ax.annotate('WHO minimum:\n15L/person/day', xy=(5, who_line[-1]),
            xytext=(3.5, who_line[-1] + 200),
            fontsize=8, color=RED, fontfamily='sans-serif', fontweight='bold',
            arrowprops=dict(arrowstyle='->', color=RED, lw=1.2),
            zorder=5)

ax.set_xticks(x_pos)
ax.set_xticklabels([f'{s} person{"s" if s > 1 else ""}' for s in group_sizes],
                    fontsize=9, color=DARK, fontfamily='sans-serif')
ax.set_ylabel('Daily Water Requirement (liters)', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_xlabel('Group Size', fontsize=10, color=DARK, fontfamily='sans-serif')
ax.set_title('Daily Water Requirements by Group Size',
             fontsize=13, fontweight='bold', color=MATH_BLUE, fontfamily='sans-serif', pad=12)
ax.legend(loc='upper left', fontsize=8, framealpha=0.9, edgecolor=GRAPH_PAPER_LINE_MAJ)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color(GRAY)
ax.spines['bottom'].set_color(GRAY)
ax.tick_params(colors=DARK, labelsize=8)
ax.yaxis.grid(True, color=GRAPH_PAPER_LINE_MAJ, linewidth=0.5, zorder=0)

fig.tight_layout()
save(fig, 'water_requirements_scaling.png')


print("\nAll 8 v3.2 scientific diagrams generated successfully (with pixel art enhancements).")
