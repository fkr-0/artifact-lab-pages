#!/usr/bin/env python3
"""Generate route, hazard, and continuity diagrams from structured data."""
from __future__ import annotations

import json
import shutil
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
DATA = json.loads((ROOT / "src" / "data" / "route_catalog.json").read_text(encoding="utf-8"))

INK = "#14201d"; MUTED = "#52645e"; PAPER = "#fbfaf4"; GREEN = "#0d7355"
RED = "#b42318"; BLUE = "#175cd3"; PURPLE = "#6f3ab2"; AMBER = "#9b5b00"
WHITE = "#ffffff"; PALE = "#e9f2ed"


def wrap(text: str, width: int) -> str:
    return "\n".join(textwrap.wrap(text, width=width, break_long_words=False))


def canvas(figsize=(10, 8), xlim=(0, 10), ylim=(0, 10)):
    fig, ax = plt.subplots(figsize=figsize, dpi=180)
    fig.patch.set_facecolor(PAPER); ax.set_facecolor(PAPER)
    ax.set_xlim(*xlim); ax.set_ylim(*ylim); ax.axis("off")
    return fig, ax


def card(ax, x, y, w, h, title, body, color=GREEN, title_size=9, body_size=7.2):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=.04,rounding_size=.08", facecolor=WHITE, edgecolor=color, linewidth=2))
    ax.add_patch(FancyBboxPatch((x, y+h-.42), w, .42, boxstyle="round,pad=.04,rounding_size=.08", facecolor=color, edgecolor=color, linewidth=0))
    ax.text(x+w/2, y+h-.21, title, ha="center", va="center", color=WHITE, fontsize=title_size, fontweight="bold")
    ax.text(x+.16, y+h-.58, body, ha="left", va="top", color=INK, fontsize=body_size, linespacing=1.25)


def arrow(ax, start, end, color=MUTED, lw=1.5):
    ax.annotate("", xy=end, xytext=start, arrowprops={"arrowstyle":"->", "color":color, "lw":lw})


def save(fig, name):
    path = OUT / name
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")


# Two-pass route architecture
fig, ax = canvas((9.6, 11.8), (0, 10), (0, 14))
ax.text(5, 13.55, "TWO PASSES, ONE NEXT ACTION", ha="center", color=INK, fontsize=22, fontweight="bold")
ax.text(5, 13.12, "Pass 1 removes danger. Pass 2 identifies the need. Modifiers change logistics, not urgency.", ha="center", color=MUTED, fontsize=8.5)
ax.text(.5, 12.45, "PASS 1 / OVERRIDES", color=RED, fontsize=10, fontweight="bold")
groups = [
    (0.5, 10.65, 2.75, 1.45, "LIFE / MEDICAL", "Possible death, abnormal breathing, severe bleeding, collapse or lasting harm\n→ 112", RED),
    (3.62, 10.65, 2.75, 1.45, "VIOLENCE / CRIME", "Move to safety; 110.\nMedical or life danger too → 112", PURPLE),
    (6.75, 10.65, 2.75, 1.45, "ENVIRONMENT", "Fire · smoke · CO · gas · chemicals · electricity\n→ Situation H / 112", AMBER),
]
for args in groups: card(ax, *args)
for x in (1.875, 4.995, 8.125): arrow(ax, (x, 10.55), (x, 9.78), color=RED)
card(ax, 2.25, 8.65, 5.5, 1.0, "NO OVERRIDE REMAINS", "Choose the closest observable need. Uncertainty about danger goes back up, not down.", GREEN, 9, 7.5)
ax.text(.5, 8.05, "PASS 2 / NEED", color=GREEN, fontsize=10, fontweight="bold")
needs = DATA["needs"]
colors = [GREEN, GREEN, BLUE, PURPLE, AMBER, BLUE]
for idx, (need, color) in enumerate(zip(needs, colors)):
    col = idx % 3; row = idx // 3
    x = .5 + col*3.15; y = 6.15 - row*1.65
    card(ax, x, y, 2.75, 1.3, need["label"].upper(), wrap(need["action"], 31), color, 8, 6.6)
ax.text(.5, 3.05, "MODIFIERS / APPLY AFTER THE ROUTE", color=BLUE, fontsize=10, fontweight="bold")
labels = [m["label"] for m in DATA["modifiers"]]
for idx, label in enumerate(labels):
    col = idx % 3; row = idx // 3
    x = .5 + col*3.15; y = 2.15 - row*.7
    ax.add_patch(FancyBboxPatch((x, y), 2.75, .48, boxstyle="round,pad=.03", facecolor=PALE, edgecolor=BLUE, linewidth=1))
    ax.text(x+1.375, y+.24, label, ha="center", va="center", color=INK, fontsize=7.2, fontweight="bold")
ax.text(5, .1, "Registry: src/data/route_catalog.json · action + backup + escalation + destination", ha="center", color=MUTED, fontsize=7.5)
save(fig, "two_pass_route_map.png")
for alias in ("emergency_flowgraph.png", "master_flowchart.png", "decision_flow_graph.png"):
    shutil.copyfile(OUT / "two_pass_route_map.png", OUT / alias)

# Environmental hazard matrix
fig, ax = canvas((10.4, 8.4), (0, 12), (0, 9))
ax.text(6, 8.55, "SITUATION H / ENVIRONMENTAL OVERRIDE", ha="center", color=INK, fontsize=21, fontweight="bold")
ax.text(6, 8.12, "Do not diagnose the room before leaving the room.", ha="center", color=MUTED, fontsize=9, style="italic")
selected = [item for item in DATA["overrides"] if item["id"] in {"fire-smoke","carbon-monoxide","gas-release","chemical-exposure","electrical-danger"}]
colors = [RED, AMBER, AMBER, BLUE, PURPLE]
short_titles = {"fire-smoke":"FIRE / SMOKE","carbon-monoxide":"CO","gas-release":"GAS","chemical-exposure":"CHEMICAL","electrical-danger":"ELECTRICITY"}
for idx, (item, color) in enumerate(zip(selected, colors)):
    row = idx // 2; col = idx % 2
    if idx == 4: x = 3.25; y = .75
    else: x = .45 + col*5.8; y = 5.55 - row*2.55
    body = "FIRST  " + wrap(item["action"], 50) + "\n\nBACKUP  " + wrap(item["backup"], 50)
    card(ax, x, y, 5.3, 2.15, short_titles[item["id"]], body, color, 9.5, 6.3)
ax.text(6, .28, "Breathing difficulty · altered consciousness · fire/smoke · trapped person · uncertainty → 112", ha="center", color=RED, fontsize=8.2, fontweight="bold")
save(fig, "hazard_override_matrix.png")

# Dependency continuity map
fig, ax = canvas((10.4, 8.8), (0, 12), (0, 10))
ax.text(6, 9.55, "ESSENTIAL CARE CONTINUITY", ha="center", color=INK, fontsize=21, fontweight="bold")
ax.text(6, 9.12, "When power, medication, equipment, transport, or a caregiver fails", ha="center", color=MUTED, fontsize=9)
card(ax, 3.2, 7.5, 5.6, 1.05, "CAN THE TREATMENT OR DEVICE FAIL SAFELY?", "Use the personal emergency plan. If the answer is unknown, treat the uncertainty as time-critical.", RED, 9, 7)
arrow(ax, (6, 7.42), (6, 6.85), RED)
steps = [
    (0.45, 4.65, "1 / IDENTIFY", "What function is essential?\nWhat stopped?\nHow much runtime or supply remains?", BLUE),
    (3.4, 4.65, "2 / BRIDGE", "Use the approved battery, backup supply, reserve, caregiver, or alternate administration plan.", GREEN),
    (6.35, 4.65, "3 / CALL", "Supplier / pharmacy / care team / 116 117.\n112 if life-supporting function is threatened.", PURPLE),
    (9.3, 4.65, "4 / MOVE", "Go early to a powered, staffed, accessible destination before the reserve is exhausted.", AMBER),
]
for x, y, title, body, color in steps: card(ax, x, y, 2.25, 1.75, title, wrap(body, 27), color, 8.3, 6.5)
for x in (2.7, 5.65, 8.6): arrow(ax, (x, 5.52), (x+.62, 5.52), MUTED)
ax.text(.55, 3.75, "PREPARE THE HANDOFF", color=GREEN, fontsize=10, fontweight="bold")
fields = ["device / treatment", "power draw or storage", "battery / reserve", "supplier / prescriber", "accessible destination", "transport + entry"]
for idx, field in enumerate(fields):
    col=idx%3; row=idx//3; x=.55+col*3.75; y=2.75-row*.85
    ax.add_patch(FancyBboxPatch((x,y),3.35,.55,boxstyle="round,pad=.03",facecolor=PALE,edgecolor=GREEN,linewidth=1))
    ax.text(x+1.675,y+.275,field,ha="center",va="center",fontsize=7.5,color=INK,fontweight="bold")
ax.text(6,.45,"Do not improvise voltage, oxygen flow, medication dosing, refrigeration, or connectors.",ha="center",color=RED,fontsize=8.2,fontweight="bold")
save(fig, "dependency_continuity_map.png")
