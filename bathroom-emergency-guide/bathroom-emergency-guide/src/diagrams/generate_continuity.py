#!/usr/bin/env python3
"""Generate household-continuity and first-meeting visuals from structured data."""
from __future__ import annotations

import json
import sys
import textwrap
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT / "src" / "data" / "continuity_catalog.json").read_text(encoding="utf-8"))

PAPER = "#fbfaf4"
INK = "#14201d"
MUTED = "#52645e"
GREEN = "#0d7355"
BLUE = "#175cd3"
PURPLE = "#6f3ab2"
AMBER = "#9b5b00"
RED = "#b42318"
WHITE = "#ffffff"
PALE = "#e9f2ed"
COLORS = [BLUE, RED, PURPLE, BLUE, AMBER, GREEN, GREEN, PURPLE]


def wrap(text: str, width: int) -> str:
    return "\n".join(textwrap.wrap(text, width=width, break_long_words=False))


def canvas(figsize: tuple[float, float], xlim: tuple[float, float], ylim: tuple[float, float]):
    fig, ax = plt.subplots(figsize=figsize, dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.axis("off")
    return fig, ax


def card(ax, x: float, y: float, w: float, h: float, title: str, question: str, action: str, color: str):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=.04,rounding_size=.08",
        facecolor=WHITE, edgecolor=color, linewidth=2,
    ))
    ax.add_patch(FancyBboxPatch(
        (x, y + h - .44), w, .44,
        boxstyle="round,pad=.04,rounding_size=.08",
        facecolor=color, edgecolor=color, linewidth=0,
    ))
    ax.text(x + .15, y + h - .22, title.upper(), va="center", ha="left", color=WHITE, fontsize=8.5, fontweight="bold")
    ax.text(x + .15, y + h - .62, wrap(question, 43), va="top", ha="left", color=INK, fontsize=6.8, fontweight="bold", linespacing=1.18)
    ax.text(x + .15, y + .2, wrap(action, 46), va="bottom", ha="left", color=MUTED, fontsize=6.5, linespacing=1.2)


def save(fig, name: str):
    path = OUT / name
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")


# Household continuity board
fig, ax = canvas((10.5, 11.2), (0, 12), (0, 13))
ax.text(6, 12.55, "HOUSEHOLD CONTINUITY BOARD", ha="center", color=INK, fontsize=21, fontweight="bold")
ax.text(6, 12.12, "Protect the function · name the owner · define the backup · set the next check", ha="center", color=MUTED, fontsize=8.7)

for idx, (system, color) in enumerate(zip(DATA["systems"], COLORS)):
    col = idx % 2
    row = idx // 2
    x = .55 + col * 5.75
    y = 9.65 - row * 2.3
    card(ax, x, y, 5.15, 1.95, system["label"], system["question"], system["protect"], color)

ax.add_patch(FancyBboxPatch((.55, .25), 10.9, .95, boxstyle="round,pad=.05", facecolor=PALE, edgecolor=GREEN, linewidth=1.8))
ax.text(6, .88, "FOR EACH ACTIVE SYSTEM", ha="center", va="center", color=GREEN, fontsize=8.5, fontweight="bold")
ax.text(6, .5, "status · remaining safe window/stock · owner · backup · next action · review time · failure escalation", ha="center", va="center", color=INK, fontsize=7.4)
save(fig, "household_continuity_board.png")


# First-meeting roles and handoff
fig, ax = canvas((10.8, 8.8), (0, 12), (0, 10))
ax.text(6, 9.55, "FIRST MEETING / FIVE FUNCTIONS", ha="center", color=INK, fontsize=21, fontweight="bold")
ax.text(6, 9.12, "One person may hold two roles. No role may exist only in somebody's head.", ha="center", color=MUTED, fontsize=8.7)

role_colors = [BLUE, RED, GREEN, AMBER, PURPLE]
positions = [(.45, 6.05), (4.0, 6.05), (7.55, 6.05), (2.2, 3.25), (5.75, 3.25)]
for role, color, (x, y) in zip(DATA["roles"], role_colors, positions):
    ax.add_patch(FancyBboxPatch((x, y), 3.0, 2.1, boxstyle="round,pad=.04,rounding_size=.08", facecolor=WHITE, edgecolor=color, linewidth=2))
    ax.add_patch(FancyBboxPatch((x, y + 1.65), 3.0, .45, boxstyle="round,pad=.04,rounding_size=.08", facecolor=color, edgecolor=color, linewidth=0))
    ax.text(x + 1.5, y + 1.87, role["label"].upper(), ha="center", va="center", color=WHITE, fontsize=8.2, fontweight="bold")
    ax.text(x + .15, y + 1.47, "OWNS", ha="left", color=color, fontsize=6.6, fontweight="bold")
    ax.text(x + .15, y + 1.3, wrap(role["owns"], 36), ha="left", va="top", color=INK, fontsize=6.4, linespacing=1.15)
    ax.text(x + .15, y + .52, "BACKUP", ha="left", color=color, fontsize=6.6, fontweight="bold")
    ax.text(x + .15, y + .35, wrap(role["backup"], 36), ha="left", va="top", color=MUTED, fontsize=6.2, linespacing=1.12)

ax.add_patch(FancyBboxPatch((.65, .45), 10.7, 1.45, boxstyle="round,pad=.05", facecolor=PALE, edgecolor=GREEN, linewidth=1.8))
ax.text(6, 1.55, "THE ASSIGNMENT INVARIANT", ha="center", va="center", color=GREEN, fontsize=9, fontweight="bold")
ax.text(6, 1.15, "A task is not assigned until it has a named owner, a visible next action, a deadline or review time, and a backup.", ha="center", va="center", color=INK, fontsize=7.5)
ax.text(6, .75, "Publish confirmed facts and uncertainty separately. Confidence is not a credential; dissent needs a route.", ha="center", va="center", color=MUTED, fontsize=7.2)
save(fig, "first_meeting_roles.png")
