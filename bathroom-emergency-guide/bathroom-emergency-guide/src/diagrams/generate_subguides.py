#!/usr/bin/env python3
"""Generate graph-subguide identity, hub, and H-pilot figures.

These figures are structural and operational. They contain no diagnostic scores
or exposure thresholds. Every reader-facing figure has adjacent text that
remains complete when the image is unavailable.
"""
from __future__ import annotations

import json
import math
import sys
import textwrap
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, Rectangle

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
DATA = ROOT / "src" / "data" / "subguides.json"
PATTERN_DIR = ROOT / "build" / "subguides" / "assets" / "patterns"
QA_DIR = ROOT / "build" / "qa" / "subguides"
OUT.mkdir(parents=True, exist_ok=True)
PATTERN_DIR.mkdir(parents=True, exist_ok=True)
QA_DIR.mkdir(parents=True, exist_ok=True)

INK = "#16201d"
MUTED = "#52645e"
PAPER = "#fbfaf4"
LINE = "#9baca5"
RED = "#b42318"
GREEN = "#0d7355"
manifest = json.loads(DATA.read_text(encoding="utf-8"))
nodes = {item["id"]: item for item in manifest["nodes"]}

HATCHES = {
    "pulse": "-.-",
    "diamond": "xx",
    "wave": "---",
    "cross": "++",
    "shield": "OO",
    "zigzag": "///",
    "crosshatch": "xx",
    "dots": "..",
    "speech": "oO",
    "form-grid": "++",
    "solid": "---",
}


def finish(fig: plt.Figure, name: str, *, qa: bool = False) -> None:
    target = QA_DIR if qa else OUT
    fig.savefig(target / f"{name}.png", dpi=220, bbox_inches="tight", facecolor=PAPER)
    if not qa:
        fig.savefig(target / f"{name}.svg", bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)


def pattern_svg(pattern: str, title: str) -> str:
    common = 'stroke="#111" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"'
    shapes = {
        "pulse": f'<g {common}><path d="M0 50 H18 L27 50 L34 27 L43 72 L52 42 L61 50 H96"/></g>',
        "diamond": f'<g {common}><path d="M24 4 L44 24 L24 44 L4 24 Z M72 4 L92 24 L72 44 L52 24 Z M48 52 L68 72 L48 92 L28 72 Z"/></g>',
        "wave": f'<g {common}><path d="M0 18 Q12 8 24 18 T48 18 T72 18 T96 18"/><path d="M0 48 Q12 38 24 48 T48 48 T72 48 T96 48"/><path d="M0 78 Q12 68 24 78 T48 78 T72 78 T96 78"/></g>',
        "cross": f'<g {common}><path d="M16 8 H32 V16 H40 V32 H32 V40 H16 V32 H8 V16 H16 Z M64 56 H80 V64 H88 V80 H80 V88 H64 V80 H56 V64 H64 Z"/></g>',
        "shield": f'<g {common}><path d="M18 10 L42 18 V42 C42 58 31 70 18 78 C5 70 -6 58 -6 42 V18 Z M72 18 L96 26 V50 C96 66 85 78 72 86 C59 78 48 66 48 50 V26 Z"/></g>',
        "zigzag": f'<g {common}><path d="M0 20 L16 4 L32 20 L48 4 L64 20 L80 4 L96 20 M0 58 L16 42 L32 58 L48 42 L64 58 L80 42 L96 58 M0 96 L16 80 L32 96 L48 80 L64 96 L80 80 L96 96"/></g>',
        "crosshatch": f'<g {common}><path d="M-24 0 L72 96 M0 0 L96 96 M24 0 L120 96 M72 0 L-24 96 M96 0 L0 96 M120 0 L24 96"/></g>',
        "dots": '<g fill="#111"><circle cx="12" cy="12" r="2"/><circle cx="36" cy="36" r="2"/><circle cx="60" cy="12" r="2"/><circle cx="84" cy="36" r="2"/><circle cx="12" cy="60" r="2"/><circle cx="36" cy="84" r="2"/><circle cx="60" cy="60" r="2"/><circle cx="84" cy="84" r="2"/></g>',
        "speech": f'<g {common}><rect x="6" y="10" width="56" height="34" rx="9"/><path d="M20 44 L14 55 L34 44"/><rect x="36" y="50" width="54" height="32" rx="9"/><path d="M74 82 L82 91 L60 82"/></g>',
        "form-grid": f'<g {common}><path d="M0 24 H96 M0 48 H96 M0 72 H96 M24 0 V96 M48 0 V96 M72 0 V96"/><path d="M5 5 H19 V19 H5 Z M53 53 H67 V67 H53 Z"/></g>',
        "solid": f'<g {common}><path d="M0 18 H96 M0 48 H96 M0 78 H96"/></g>',
    }
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-labelledby="title"><title id="title">{title}</title><rect width="96" height="96" fill="#fff"/>{shapes[pattern]}</svg>\n'''


for node in nodes.values():
    filename = f'{node["id"]}-{node["pattern"]}.svg'
    (PATTERN_DIR / filename).write_text(
        pattern_svg(node["pattern"], f'{node["id"]} {node["title"]}: {node["pattern"]} pattern'),
        encoding="utf-8",
    )


# M1 contact sheet: color plus a monochrome-identical hatch channel.
columns = 5
rows = math.ceil(len(nodes) / columns)
fig, axes = plt.subplots(rows, columns, figsize=(15.5, 3.0 * rows))
fig.suptitle("Subguide identity system — code + pattern + title", fontsize=20, fontweight="bold", color=INK)
flat_axes = list(axes.flat)
for ax, node in zip(flat_axes, nodes.values()):
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.add_patch(Rectangle((0.02, 0.02), .96, .96, facecolor="white", edgecolor=INK, linewidth=1.4))
    ax.add_patch(Rectangle((0.02, .70), .96, .28, facecolor=node["colour"], edgecolor=INK, linewidth=0))
    ax.add_patch(Rectangle((0.02, .70), .96, .28, facecolor="none", edgecolor="white", linewidth=1.3, hatch=HATCHES[node["pattern"]]))
    ax.text(.08, .82, node["id"], color="white", fontsize=24, fontweight="bold", ha="left", va="center")
    ax.text(.08, .57, textwrap.fill(node["title"], 25), color=INK, fontsize=10.5, fontweight="bold", ha="left", va="top")
    ax.text(.08, .13, node["pattern"].replace("-", " "), color=MUTED, fontsize=8, ha="left")
for ax in flat_axes[len(nodes):]:
    ax.axis("off")
fig.tight_layout(rect=(0, 0, 1, .94))
finish(fig, "subguide_identity_contact_sheet", qa=True)


# Accessible overview projection. It shows the main routing spine; local pages
# provide complete neighbour lists generated from the same manifest.
overview_pos = {
    "O": (0, 3.0),
    "B": (-2.7, 1.55), "C": (0, 1.55), "H": (2.7, 1.55),
    "A": (-3.8, -.15), "D": (-1.3, -.15), "S": (1.3, -.15), "Z": (3.8, -.15),
    "P": (-2.3, -2.0), "T": (0, -2.0), "R": (2.3, -2.0),
}
primary_edges = [
    ("O", "B"), ("O", "C"), ("O", "H"), ("O", "S"), ("O", "A"),
    ("B", "C"), ("B", "S"), ("B", "P"), ("C", "H"), ("C", "P"),
    ("A", "D"), ("A", "P"), ("D", "P"), ("D", "S"), ("D", "H"),
    ("H", "Z"), ("H", "P"), ("Z", "P"), ("Z", "R"),
    ("P", "S"), ("P", "T"), ("P", "R"), ("S", "T"), ("T", "R"),
]
for source, target in primary_edges:
    if target not in nodes[source]["outgoing"]:
        raise RuntimeError(f"overview edge {source}->{target} absent from manifest")

fig, ax = plt.subplots(figsize=(10.5, 8.7))
ax.set_xlim(-4.8, 4.8)
ax.set_ylim(-3.1, 3.65)
ax.axis("off")
ax.set_title("The eleven-book shelf", fontsize=22, fontweight="bold", color=INK, pad=18)
ax.text(0, 3.02, "Handoffs, not required reading order.", ha="center", va="center", color=MUTED, fontsize=9.5)
for source, target in primary_edges:
    x1, y1 = overview_pos[source]
    x2, y2 = overview_pos[target]
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=10, linewidth=1.1, color=LINE, shrinkA=24, shrinkB=24, zorder=1))
for node_id, (x, y) in overview_pos.items():
    node = nodes[node_id]
    ax.add_patch(Circle((x, y), .42, facecolor=node["colour"], edgecolor=INK, linewidth=2.1, hatch=HATCHES[node["pattern"]], zorder=3))
    ax.text(x, y, node_id, color="white", fontsize=17, fontweight="bold", ha="center", va="center", zorder=4)
    ax.text(x, y-.58, textwrap.fill(node["title"], 18), color=INK, fontsize=8.3, fontweight="bold", ha="center", va="top")
ax.text(0, -2.85, "Choose the closest title; move when the problem changes.", ha="center", color=RED, fontsize=9, fontweight="bold")
finish(fig, "subguide_graph_overview")


# One local graph per node. A reader can identify current position and next
# destinations without tracing a dense whole-network hairball.
for current_id, current in nodes.items():
    neighbours = current["outgoing"]
    fig, ax = plt.subplots(figsize=(9.2, 6.8))
    ax.set_xlim(-3.3, 3.3)
    ax.set_ylim(-2.55, 2.75)
    ax.axis("off")
    ax.set_title(f'You are here: {current_id} — {current["title"]}', fontsize=18, fontweight="bold", color=INK, pad=14)
    radius = 2.05
    positions = {}
    for index, neighbour_id in enumerate(neighbours):
        angle = math.pi / 2 - (2 * math.pi * index / len(neighbours))
        positions[neighbour_id] = (radius * math.cos(angle), radius * math.sin(angle))
    for neighbour_id, (x, y) in positions.items():
        ax.add_patch(FancyArrowPatch((0, 0), (x, y), arrowstyle="-|>", mutation_scale=10, linewidth=1.2, color=LINE, shrinkA=37, shrinkB=27))
        neighbour = nodes[neighbour_id]
        ax.add_patch(Circle((x, y), .34, facecolor="white", edgecolor=neighbour["colour"], linewidth=2.1, hatch=HATCHES[neighbour["pattern"]]))
        ax.text(x, y, neighbour_id, color=INK, fontsize=12, fontweight="bold", ha="center", va="center")
        ax.text(x, y-.46, textwrap.fill(neighbour["title"], 18), color=INK, fontsize=7.4, fontweight="bold", ha="center", va="top")
    ax.add_patch(Circle((0, 0), .62, facecolor=current["colour"], edgecolor=INK, linewidth=3.0, hatch=HATCHES[current["pattern"]], zorder=4))
    ax.text(0, 0, current_id, color="white", fontsize=28, fontweight="bold", ha="center", va="center", zorder=5)
    ax.text(0, -2.42, "Complete route names follow as text. Immediate danger bypasses this map.", ha="center", color=MUTED, fontsize=8.5)
    finish(fig, f"subguide_graph_{current_id}")


# Paper-review comparison required by M2 / SG-0.
fig, axes = plt.subplots(1, 2, figsize=(11.4, 6.6))
fig.suptitle("Grouping prototype review", fontsize=20, fontweight="bold", color=INK)
panels = [
    (
        "A — ten-node core (selected)",
        [
            ("B", "alarm + overload + calm"),
            ("C", "pain + first aid"),
            ("D", "threat + safe-place routing"),
            ("H", "air + smell + environment"),
        ],
        "Fewer top-level doors; transitions stay explicit.",
    ),
    (
        "B — split routes (deferred)",
        [
            ("B", "alarm only"),
            ("E", "overload as a tenth core node"),
            ("C", "pain + first aid"),
            ("D/G", "threat and safe-place split"),
        ],
        "More precise labels, but a louder first graph and repeated handoffs.",
    ),
]
for ax, (title, rows, note) in zip(axes, panels):
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.add_patch(Rectangle((.02, .03), .96, .94, facecolor="white", edgecolor=INK, linewidth=1.5))
    ax.text(.08, .90, title, fontsize=13, fontweight="bold", color=INK, va="top")
    y=.73
    for code, label in rows:
        ax.add_patch(Circle((.14, y), .055, facecolor=GREEN if "selected" in title else "white", edgecolor=INK, linewidth=1.3))
        ax.text(.14, y, code, color="white" if "selected" in title else INK, fontsize=9, fontweight="bold", ha="center", va="center")
        ax.text(.24, y, label, color=INK, fontsize=10, va="center")
        y -= .14
    ax.text(.08, .15, textwrap.fill(note, 49), color=MUTED, fontsize=9, va="top")
fig.tight_layout(rect=(0, 0, 1, .92))
finish(fig, "subguide_grouping_comparison", qa=True)


# B visual 3: separate the channels in an alarm bundle before choosing an action.
fig, ax = plt.subplots(figsize=(10.8, 5.6))
ax.set_xlim(0, 10.8)
ax.set_ylim(0, 5.6)
ax.axis("off")
ax.set_title("One alarm bundle, four observable channels", fontsize=20, fontweight="bold", color=INK, pad=14)
channels = [
    ("S", "SENSATION", "heart · breath · nausea · tingling", "Where? Wave or steady?", "#175cd3"),
    ("E", "EMOTION", "fear · shame · dread", "One word is enough.", "#6f3ab2"),
    ("P", "PREDICTION", "‘This will be unbearable.’", "Event or forecast?", "#b54708"),
    ("U", "URGE", "flee · check · text · hide", "Can it wait one minute?", "#0d7355"),
]
for index, (code, label, examples, question, color) in enumerate(channels):
    x = .30 + index * 2.63
    ax.add_patch(Rectangle((x, .92), 2.35, 3.72, facecolor="white", edgecolor=color, linewidth=2.2))
    ax.add_patch(Rectangle((x, 3.76), 2.35, .88, facecolor=color, edgecolor=color))
    ax.text(x+.23, 4.20, code, color="white", fontsize=17, fontweight="bold", va="center")
    ax.text(x+.66, 4.20, label, color="white", fontsize=9.4, fontweight="bold", va="center")
    ax.text(x+.22, 3.30, textwrap.fill(examples, 27), color=INK, fontsize=9.5, fontweight="bold", va="top")
    ax.text(x+.22, 2.14, textwrap.fill(question, 24), color=MUTED, fontsize=9.2, va="top")
ax.text(5.4, .38, "Change one channel, compare after one minute. New, severe, unusual, or worsening physical signs stay on the medical route.", ha="center", color=RED, fontsize=8.8, fontweight="bold")
finish(fig, "alarm_channels_map")


# B visual 4: the overload equation is conceptual bookkeeping, not a diagnostic score.
fig, ax = plt.subplots(figsize=(10.8, 5.8))
ax.set_xlim(0, 10.8)
ax.set_ylim(0, 5.8)
ax.axis("off")
ax.set_title("Load control — make headroom before demanding performance", fontsize=19, fontweight="bold", color=INK, pad=14)
loads = [
    ("I", "intrinsic difficulty", "split or offload"),
    ("E", "avoidable clutter", "remove interruption"),
    ("S", "stress / pain / fatigue", "support the body"),
]
for index, (code, label, lever) in enumerate(loads):
    y = 4.25 - index * 1.12
    ax.add_patch(Rectangle((.45, y-.34), 3.25, .78, facecolor="white", edgecolor="#175cd3", linewidth=1.8))
    ax.text(.72, y+.05, code, color="#175cd3", fontsize=16, fontweight="bold", va="center")
    ax.text(1.14, y+.05, label, color=INK, fontsize=10, fontweight="bold", va="center")
    ax.add_patch(FancyArrowPatch((3.82, y+.05), (5.00, y+.05), arrowstyle="-|>", mutation_scale=12, linewidth=1.5, color=LINE))
    ax.text(5.18, y+.05, lever, color=GREEN, fontsize=10, fontweight="bold", va="center")
ax.text(7.98, 4.20, "L = I + E + S", ha="center", color=INK, fontsize=20, fontweight="bold")
ax.text(7.98, 3.36, "headroom  H = K − L", ha="center", color="#175cd3", fontsize=15, fontweight="bold")
ax.add_patch(Rectangle((6.32, 1.42), 3.36, 1.16, facecolor="#eef7f3", edgecolor=GREEN, linewidth=2.0))
ax.text(8.00, 2.18, "When L > capacity K", ha="center", color=INK, fontsize=11, fontweight="bold")
ax.text(8.00, 1.78, "reduce · support · offload", ha="center", color=GREEN, fontsize=10.5, fontweight="bold")
ax.text(5.4, .48, "Conceptual units only. Safety, shelter, medication, dependants, and today’s deadline remain first in the queue.", ha="center", color=MUTED, fontsize=8.8)
finish(fig, "overload_control_map")


# H visual 3: source location determines movement; current official warnings
# dominate for outside events.
fig, ax = plt.subplots(figsize=(10.8, 5.8))
ax.set_xlim(0, 10.8)
ax.set_ylim(0, 5.8)
ax.axis("off")
ax.set_title("Same hazard word, different source location", fontsize=20, fontweight="bold", color=INK, pad=14)
cards = [
    (0.25, "1 / SOURCE INSIDE", "Leave the source area", "Call from outside. Do not re-enter to improve the diagnosis.", "#b54708", "OUT"),
    (3.70, "2 / SOURCE OUTSIDE", "Read the current official warning", "Shelter or evacuate exactly as instructed for this event.", "#175cd3", "WARN"),
    (7.15, "3 / UNCLEAR OR CHANGING", "Increase distance; verify", "Immediate danger → 112. Otherwise confirm time, place, and authority.", "#6f3ab2", "?"),
]
for x, kicker, title, body, color, glyph in cards:
    ax.add_patch(Rectangle((x, .75), 3.15, 3.95, facecolor="white", edgecolor=color, linewidth=2.2))
    ax.add_patch(Rectangle((x, 3.86), 3.15, .84, facecolor=color, edgecolor=color))
    ax.text(x+.18, 4.28, kicker, color="white", fontsize=8.5, fontweight="bold", va="center")
    ax.text(x+.26, 3.42, glyph, color=color, fontsize=21, fontweight="bold", va="center")
    ax.text(x+.78, 3.43, textwrap.fill(title, 24), color=INK, fontsize=11.5, fontweight="bold", va="center")
    ax.text(x+.26, 2.30, textwrap.fill(body, 35), color=MUTED, fontsize=9.2, va="top")
ax.text(5.4, .25, "The diagram chooses no live instruction. NINA, warnung.bund.de, radio, police, and fire service own the event.", ha="center", color=MUTED, fontsize=8.6)
finish(fig, "hazard_source_location_map")


# H visual 4: a complete dispatcher/poison-centre handoff structure.
fig, ax = plt.subplots(figsize=(10.8, 5.2))
ax.set_xlim(0, 10.8)
ax.set_ylim(0, 5.2)
ax.axis("off")
ax.set_title("Hazard handoff — five fields from a safe place", fontsize=20, fontweight="bold", color=INK, pad=12)
fields = [
    ("1", "LOCATION", "exact address or position"),
    ("2", "HAZARD", "fire / smoke / CO / gas / chemical / electricity"),
    ("3", "PEOPLE", "out, inside, missing, or unknown"),
    ("4", "SYMPTOMS", "none, observed signs, and change"),
    ("5", "ACCESS", "child, mobility, communication, device, animal"),
]
for index, (number, label, detail) in enumerate(fields):
    x = .35 + index * 2.08
    ax.add_patch(Rectangle((x, 1.22), 1.82, 2.75, facecolor="white", edgecolor=GREEN, linewidth=1.8))
    ax.add_patch(Circle((x+.30, 3.60), .19, facecolor=GREEN, edgecolor=GREEN))
    ax.text(x+.30, 3.60, number, color="white", fontsize=9, fontweight="bold", ha="center", va="center")
    ax.text(x+.20, 3.10, label, color=INK, fontsize=9.5, fontweight="bold", va="top")
    ax.text(x+.20, 2.55, textwrap.fill(detail, 22), color=MUTED, fontsize=8.2, va="top")
    if index < len(fields)-1:
        ax.add_patch(FancyArrowPatch((x+1.83, 2.58), (x+2.04, 2.58), arrowstyle="-|>", mutation_scale=10, color=LINE, linewidth=1.2))
ax.text(5.4, .65, "Useful fields beat polished prose. Never return to the hazard for a better report.", ha="center", color=RED, fontsize=9.2, fontweight="bold")
finish(fig, "hazard_handoff_card")

print(f"  [OK] subguide identity, graph, pattern, and H-pilot figures → {OUT}")
