"""Generate hub-specific diagrams: master flowchart, emergency banner, axiom icons."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

from .palette import SUBGUIDES, INK, PAPER, MUTED, WHITE, DECISION, hex_to_rgba

DANGER_RED = SUBGUIDES["ambulance"].accent


# ---------------------------------------------------------------------------
# Accessibility helpers
# ---------------------------------------------------------------------------

def _text_color_for_bg(bg_hex: str) -> str:
    """Return INK or WHITE for WCAG AA contrast on bg_hex."""
    r, g, b, _ = hex_to_rgba(bg_hex)
    # Relative luminance (WCAG 2.x)
    def _lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    lum = 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)
    # Contrast with white (#ffffff, lum=1.0): (1.05) / (lum + 0.05)
    contrast_white = 1.05 / (lum + 0.05)
    return WHITE if contrast_white >= 4.5 else INK


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def box(ax, x, y, w, h, text, color, size=9, text_color=WHITE):
    patch = FancyBboxPatch(
        (x - w / 2, y - h / 2), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.07",
        facecolor=color, edgecolor=INK, linewidth=1.1,
    )
    ax.add_patch(patch)
    ax.text(
        x, y, text,
        ha="center", va="center",
        color=text_color, fontsize=size, fontweight="bold",
        wrap=True, linespacing=1.3,
    )


def arrow(ax, start, end, label=None, color=None):
    c = color or INK
    ax.annotate(
        "", xy=end, xytext=start,
        arrowprops={"arrowstyle": "->", "color": c, "lw": 1.7},
    )
    if label:
        mx = (start[0] + end[0]) / 2
        my = (start[1] + end[1]) / 2
        ax.text(mx + 0.07, my, label, color=c, fontsize=7.5,
                fontweight="bold", backgroundcolor=PAPER)


# ---------------------------------------------------------------------------
# Individual diagram generators
# ---------------------------------------------------------------------------

def _diamond(ax, x, y, w, h, text, color=DECISION, size=8.5):
    """Draw a decision diamond with centered text."""
    hw, hh = w / 2, h / 2
    verts = [(x, y + hh), (x + hw, y), (x, y - hh), (x - hw, y), (x, y + hh)]
    from matplotlib.patches import Polygon
    patch = Polygon(verts, closed=True, facecolor=PAPER,
                    edgecolor=color, linewidth=1.6)
    ax.add_patch(patch)
    ax.text(x, y, text, ha="center", va="center",
            color=color, fontsize=size, fontweight="bold",
            linespacing=1.2)


def _outcome(ax, x, y, w, h, title, subtitle, accent, size=8):
    """Draw a rounded subguide destination box."""
    tc = _text_color_for_bg(accent)
    patch = FancyBboxPatch(
        (x - w / 2, y - h / 2), w, h,
        boxstyle="round,pad=0.04,rounding_size=0.06",
        facecolor=accent, edgecolor=INK, linewidth=1.0,
    )
    ax.add_patch(patch)
    ax.text(x, y + 0.15, title, ha="center", va="center",
            color=tc, fontsize=size, fontweight="bold")
    ax.text(x, y - 0.18, subtitle, ha="center", va="center",
            color=tc, fontsize=6.5, fontstyle="italic", alpha=0.9)


def generate_master_flowchart(output_dir: str) -> str:
    """Decision-tree routing: yes/no questions guide reader to a subguide."""
    fig, ax = plt.subplots(figsize=(11, 18), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(-1, 13)
    ax.set_ylim(-0.8, 19)
    ax.axis("off")

    # Shared geometry
    DW, DH = 3.8, 1.6      # diamond size
    BW, BH = 2.6, 0.9      # outcome box size
    CX = 5.0                # center x for decision column
    RX = 10.0               # right x for outcome boxes
    YOFF = -0.2             # yes-label nudge

    # ---- Title ----------------------------------------------------------
    ax.text(6, 18.5, "BATHROOM EMERGENCY ROUTING", ha="center",
            color=INK, fontsize=17, fontweight="bold")
    ax.text(6, 18.1,
            "Start at the top. Answer each question. Stop at the first YES.",
            ha="center", color=MUTED, fontsize=8.5)

    # ---- Emergency gate (top) -------------------------------------------
    box(ax, CX, 17.2, 5.5, 0.9,
        "Unconscious, not breathing,\nor severely bleeding?",
        DANGER_RED, 10)
    box(ax, RX, 17.2, 2.4, 0.7, "CALL 112\nUnlock · speaker", DANGER_RED, 8)
    arrow(ax, (CX + 2.8, 17.2), (RX - 1.2, 17.2), "YES", DANGER_RED)

    # ---- Decision tree --------------------------------------------------
    # Each row: (y, question_text, target_key, outcome_label, outcome_note)
    tree = [
        (15.6, "Am I panicking,\noverwhelmed, or\nfreezing up?",
         "calm", "The Teal Book", "breathe first"),
        (13.4, "Am I hurt, in\npain, or feeling\nphysically wrong?",
         "ambulance", "The Red Book", "triage & first aid"),
        (11.2, "Is this a body\nquestion — skin,\ndigestion, 'is\nthis normal?'",
         "body", "The Green Book", "body owner's manual"),
        (9.0, "Am I in danger\nor somewhere\nunsafe?",
         "safety", "The Blue Book", "secure the next hour"),
        (6.8, "Is infrastructure\nfailing — power,\nwater, building?",
         "zombie", "The Olive Book", "survival priorities"),
        (4.6, "Is this a natural\ndisaster — quake,\nflood, storm?",
         "disaster", "The Orange Book", "shelter & weather"),
        (2.4, "Did I cause harm\nor am I carrying\nguilt?",
         "responsibility", "The Amber Book", "repair sequence"),
    ]

    prev_y = 16.75  # bottom of emergency gate

    for y, q, key, title, note in tree:
        sg = SUBGUIDES[key]

        # Vertical connector from previous node
        arrow(ax, (CX, prev_y), (CX, y + DH / 2), "NO" if prev_y != 16.75 else "NO")

        # Diamond
        _diamond(ax, CX, y, DW, DH, q)

        # YES arrow to outcome box
        arrow(ax, (CX + DW / 2, y), (RX - BW / 2, y), "YES", sg.accent)

        # Outcome box
        _outcome(ax, RX, y, BW, BH, title, note, sg.accent)

        prev_y = y - DH / 2

    # ---- Bottom catch-all: three remaining subguides --------------------
    catch_y = 0.7
    arrow(ax, (CX, prev_y), (CX, catch_y + 0.5), "NO")

    ax.text(CX, catch_y + 0.5, "Still here?", ha="center", va="center",
            color=MUTED, fontsize=9, fontstyle="italic")

    remaining = [
        ("social",    1.5,  "The Purple Book", "social situations"),
        ("support",   5.0,  "The Indigo Book", "numbers & scripts"),
        ("appendix",  8.5,  "The Appendix", "reference & forms"),
        ("templates", 11.5, "The Grey Book", "printable forms"),
    ]
    for key, rx, title, note in remaining:
        sg = SUBGUIDES[key]
        _outcome(ax, rx, catch_y - 0.5, BW, BH, title, note, sg.accent, size=7)
        arrow(ax, (rx, catch_y + 0.3), (rx, catch_y - 0.05))

    # ---- Footer ---------------------------------------------------------
    ax.text(6, -0.3,
            "v4-alt  ·  Answer each question honestly  ·  Stop at the first YES",
            ha="center", color=MUTED, fontsize=7)

    path = os.path.join(output_dir, "master_flowchart_v2.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


def generate_emergency_banner(output_dir: str) -> str:
    """Horizontal red banner: immediate danger callout."""
    fig, ax = plt.subplots(figsize=(8, 1.5), dpi=180)
    fig.patch.set_facecolor(DANGER_RED)
    ax.set_facecolor(DANGER_RED)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 2)
    ax.axis("off")

    ax.text(5, 1.25, "IMMEDIATE DANGER? CALL 112",
            ha="center", va="center", color=WHITE,
            fontsize=16, fontweight="bold")
    ax.text(5, 0.55,
            "Unlock the door  ·  Put phone on speaker  ·  Follow dispatcher",
            ha="center", va="center", color=WHITE, fontsize=10)

    # Thin white line between heading and sub-text
    ax.axhline(y=0.95, xmin=0.1, xmax=0.9, color=WHITE, linewidth=0.7, alpha=0.5)

    path = os.path.join(output_dir, "emergency_banner.png")
    fig.savefig(path, bbox_inches="tight", facecolor=DANGER_RED)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


def generate_axiom_icons(output_dir: str) -> str:
    """Four axiom tiles: Door / Water / Shelter / Choice."""
    axioms = [
        ("Door",    "[lock]",    "You can lock it"),
        ("Water",   "[water]",   "You have access"),
        ("Shelter", "[shelter]", "You're indoors"),
        ("Choice",  "[read]",    "You're reading this"),
    ]
    # Accent colors drawn from existing SUBGUIDES palette family
    colors = [
        SUBGUIDES["calm"].accent,
        SUBGUIDES["safety"].accent,
        SUBGUIDES["zombie"].accent,
        SUBGUIDES["support"].accent,
    ]

    fig, axes = plt.subplots(1, 4, figsize=(8, 2), dpi=180)
    fig.patch.set_facecolor(PAPER)

    for ax, (title, icon, desc), accent in zip(axes, axioms, colors):
        ax.set_facecolor(PAPER)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis("off")

        # Coloured circle backdrop
        circle = plt.Circle((0.5, 0.68), 0.22, color=accent, zorder=0)
        ax.add_patch(circle)

        ax.text(0.5, 0.68, icon, ha="center", va="center",
                fontsize=20, zorder=1)
        ax.text(0.5, 0.35, title, ha="center", va="center",
                fontsize=11, fontweight="bold", color=INK)
        ax.text(0.5, 0.15, desc, ha="center", va="center",
                fontsize=8, color=MUTED)

    fig.tight_layout(pad=0.4)
    path = os.path.join(output_dir, "axiom_icons.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# Public entry-point
# ---------------------------------------------------------------------------

def generate_hub_diagrams(output_dir: str) -> None:
    """Generate all three hub diagrams into *output_dir*."""
    os.makedirs(output_dir, exist_ok=True)
    generate_master_flowchart(output_dir)
    generate_emergency_banner(output_dir)
    generate_axiom_icons(output_dir)


if __name__ == "__main__":
    out = (
        sys.argv[1]
        if len(sys.argv) > 1
        else str(Path(__file__).parent.parent.parent / "build" / "diagrams")
    )
    generate_hub_diagrams(out)
