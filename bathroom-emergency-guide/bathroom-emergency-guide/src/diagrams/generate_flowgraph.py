#!/usr/bin/env python3
"""Generate the five diagrams referenced by Bathroom Emergency Guide v4."""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#14201d"
MUTED = "#52645e"
PAPER = "#fbfaf4"
GREEN = "#0d7355"
RED = "#b42318"
BLUE = "#175cd3"
PURPLE = "#6f3ab2"
AMBER = "#9b5b00"
WHITE = "#ffffff"
PALE = "#e9f2ed"


def box(ax, x, y, width, height, text, color, size=10):
    patch = FancyBboxPatch(
        (x - width / 2, y - height / 2), width, height,
        boxstyle="round,pad=0.05,rounding_size=0.07",
        facecolor=color, edgecolor=INK, linewidth=1.1,
    )
    ax.add_patch(patch)
    ax.text(x, y, text, ha="center", va="center", color=WHITE, fontsize=size, fontweight="bold")


def arrow(ax, start, end, label=None, color=INK):
    ax.annotate("", xy=end, xytext=start, arrowprops={"arrowstyle": "->", "color": color, "lw": 1.7})
    if label:
        x = (start[0] + end[0]) / 2
        y = (start[1] + end[1]) / 2
        ax.text(x + .07, y, label, color=color, fontsize=7.5, fontweight="bold", backgroundcolor=PAPER)


def canvas(size, xlim, ylim):
    fig, ax = plt.subplots(figsize=size, dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.axis("off")
    return fig, ax


def save(fig, name):
    path = OUT / name
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")


# Orientation graph
fig, ax = canvas((8.27, 11.69), (0, 10), (0, 14))
ax.text(5, 13.45, "START WITH THE OVERRIDE", ha="center", color=GREEN, fontsize=10, fontweight="bold")
ax.text(5, 12.9, "Bathroom emergency routing", ha="center", color=INK, fontsize=22, fontweight="bold")
ax.text(5, 12.45, "One question at a time. Arithmetic never outranks a red flag.", ha="center", color=MUTED, fontsize=9)
box(ax, 5, 11.45, 5.4, 1.0, "Immediate danger or possible lasting harm?", RED, 12)
box(ax, 8.1, 9.8, 2.7, 1.0, "CALL 112\nUnlock · speakerphone", RED, 10)
box(ax, 3.5, 9.8, 3.7, 1.0, "What is the next problem?", GREEN, 11)
arrow(ax, (6.7, 11.1), (7.55, 10.25), "YES", RED)
arrow(ax, (4.15, 10.98), (3.72, 10.3), "NO", GREEN)
routes = [
    (1.5, "Body / pain", BLUE, "Ch. 5\nFirst aid"),
    (4.0, "Panic / overload", GREEN, "Ch. 4\nCalm"),
    (6.5, "Threat / violence", PURPLE, "Ch. 7\nSupport"),
    (8.8, "Outage / collapse", AMBER, "Ch. 6\nSurvival"),
]
for x, label, color, destination in routes:
    box(ax, x, 7.8, 2.05, .85, label, color, 9)
    box(ax, x, 6.05, 2.05, .8, destination, color, 9)
    arrow(ax, (x, 7.35), (x, 6.5), color=color)
    arrow(ax, (3.5, 9.3), (x, 8.25), color=MUTED)
box(ax, 5, 4.5, 5.8, .9, "Do one action · reassess · escalate if worse", INK, 11)
for x, *_ in routes:
    arrow(ax, (x, 5.63), (4.35 + (x - 5) * .12, 4.92), color=MUTED)
ax.text(5, 3.35, "THE ROUTING INVARIANT", ha="center", color=GREEN, fontsize=9, fontweight="bold")
ax.text(5, 2.85, "Every non-emergency path ends in an action and an escalation rule.", ha="center", color=INK, fontsize=11)
ax.text(5, 2.25, "112 life/lasting harm · 116 117 urgent medical · 116 123 human voice", ha="center", color=MUTED, fontsize=8.5)
ax.text(5, 1.45, "You are not required to diagnose the situation before asking for help.", ha="center", color=INK, fontsize=9, style="italic")
save(fig, "emergency_flowgraph.png")
for alias in ("master_flowchart.png", "decision_flow_graph.png"):
    (OUT / alias).write_bytes((OUT / "emergency_flowgraph.png").read_bytes())


# Breathing choices
fig, axes = plt.subplots(1, 3, figsize=(10.8, 3.6), dpi=180)
fig.patch.set_facecolor(PAPER)
titles = ["RETURN TO NORMAL", "LONGER EXHALE", "OPTIONAL SIGH"]
subtitles = [
    "If counting makes it worse",
    "Quiet in · gentle longer out",
    "In · small top-up · long out",
]
colors = [BLUE, GREEN, PURPLE]
patterns = [
    ([0, 1, 2, 3, 4], [1, 1.1, .95, 1.05, 1]),
    ([0, 1, 2, 3, 4, 5, 6, 7], [1, 1.4, 1.8, 1.2, .9, .65, .5, 1]),
    ([0, 1, 2, 3, 4, 5, 6], [1, 1.5, 1.25, 1.75, 1.1, .65, 1]),
]
for ax, title, subtitle, color, (xs, ys) in zip(axes, titles, subtitles, colors, patterns):
    ax.set_facecolor(PAPER)
    ax.plot(xs, ys, color=color, lw=4, solid_capstyle="round")
    ax.axhline(1, color=MUTED, lw=.7, ls=":")
    ax.set_ylim(.25, 2.1)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_title(title, color=color, fontsize=10, fontweight="bold", pad=12)
    ax.text(.5, -.1, subtitle, transform=ax.transAxes, ha="center", color=MUTED, fontsize=8)
fig.suptitle("Breathing is a menu, not an exam", color=INK, fontsize=15, fontweight="bold")
fig.tight_layout(rect=(0, .04, 1, .9))
save(fig, "breathing_techniques.png")


# First-aid routing. Keep the emergency call in its own action box so the
# diagram cannot be read as "finish several tasks, then call".
fig, ax = canvas((8.27, 10.6), (0, 10), (0, 12))
ax.text(5, 11.55, "FIRST-AID FIRST MINUTE", ha="center", color=INK, fontsize=20, fontweight="bold")
box(ax, 5, 10.35, 5.4, .8, "1 · Scene safe to approach?", AMBER, 11)
box(ax, 2.0, 8.75, 3.1, .8, "STAY BACK", RED, 11)
box(ax, 6.6, 8.75, 4.1, .9, "2 · Responsive and\nbreathing normally?", GREEN, 9.5)
arrow(ax, (3.5, 10.0), (2.25, 9.17), "NO", RED)
arrow(ax, (6.1, 10.0), (6.5, 9.17), "YES", GREEN)
box(ax, 2.0, 7.15, 3.1, .8, "3 · CALL 112", RED, 12)
arrow(ax, (2.0, 8.33), (2.0, 7.57), color=RED)
box(ax, 4.2, 6.7, 3.8, 1.0, "Unresponsive or\nabnormal breathing", RED, 10)
box(ax, 8.1, 6.7, 2.8, 1.0, "Other red flag?", BLUE, 10)
arrow(ax, (5.7, 8.3), (4.65, 7.22), "NO / UNSURE", RED)
arrow(ax, (7.05, 8.3), (7.85, 7.22), "YES", BLUE)
box(ax, 4.2, 5.05, 3.8, .82, "3 · CALL 112", RED, 12)
arrow(ax, (4.2, 6.18), (4.2, 5.48), color=RED)
box(ax, 4.2, 3.55, 3.8, .9, "4 · CPR · AED\nFollow dispatcher", RED, 10.5)
arrow(ax, (4.2, 4.63), (4.2, 4.02), color=RED)
box(ax, 8.1, 5.05, 2.8, .82, "YES · CALL 112", RED, 10.5)
box(ax, 8.1, 3.55, 2.8, .9, "NO · matching\nfirst-aid section", BLUE, 9.5)
arrow(ax, (8.1, 6.18), (8.1, 5.48), "YES", RED)
arrow(ax, (8.85, 6.18), (8.55, 4.02), "NO", BLUE)
ax.text(5, 1.9, "Speakerphone externalizes the call and frees both hands.", ha="center", color=INK, fontsize=9.5, fontweight="bold")
ax.text(5, 1.28, "Gasping is not normal breathing. Do not delay the call to finish the chart.", ha="center", color=MUTED, fontsize=9)
save(fig, "triage_flow.png")


# Preparedness priorities
fig, ax = canvas((8.27, 8.0), (0, 10), (0, 9))
ax.text(5, 8.45, "DISRUPTION PRIORITIES", ha="center", color=INK, fontsize=19, fontweight="bold")
layers = [
    (7.25, "VERIFY HAZARD · FOLLOW OFFICIAL INSTRUCTIONS", RED),
    (6.05, "SAFE AIR · FIRE / CO / CHEMICAL CONTROL", AMBER),
    (4.85, "WATER · MEDICATION · ESSENTIAL CARE", BLUE),
    (3.65, "SHELTER · TEMPERATURE · HYGIENE", GREEN),
    (2.45, "FOOD · POWER · INFORMATION", PURPLE),
    (1.25, "ROLES · REST · RECORDS · NEIGHBOURS", INK),
]
for y, label, color in layers:
    width = 8.6 - (7.25 - y) * .55
    ax.add_patch(Rectangle((5 - width / 2, y - .43), width, .86, facecolor=color, edgecolor=INK, linewidth=1))
    ax.text(5, y, label, ha="center", va="center", color=WHITE, fontsize=9.2, fontweight="bold")
save(fig, "survival_pyramid.png")


# Exact coordination scaling
fig, ax = plt.subplots(figsize=(9.6, 5.2), dpi=180)
fig.patch.set_facecolor(PAPER)
ax.set_facecolor(PAPER)
people = [1, 5, 10, 20, 30]
channels = [n * (n - 1) // 2 for n in people]
bars = ax.bar([str(n) for n in people], channels, color=[GREEN, BLUE, PURPLE, AMBER, RED], width=.65)
for bar, value in zip(bars, channels):
    ax.text(bar.get_x() + bar.get_width() / 2, value + 8, str(value), ha="center", color=INK, fontsize=9, fontweight="bold")
ax.set_title("Pairwise communication channels", color=INK, fontsize=17, fontweight="bold")
ax.set_xlabel("People in a fully connected group", color=MUTED)
ax.set_ylabel("C(n) = n(n−1)/2", color=MUTED)
ax.spines[["top", "right"]].set_visible(False)
ax.grid(axis="y", color="#b8c9c1", alpha=.5, lw=.7)
ax.text(.01, .96, "Exact graph relation — not a measure of social difficulty", transform=ax.transAxes, color=MUTED, fontsize=8, va="top")
fig.tight_layout()
save(fig, "scaling_chart.png")
