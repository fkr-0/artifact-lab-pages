"""Generate subguide-specific data-visualization diagrams.

Each function produces one referenced PNG used inline in chapter content.
Uses matplotlib with the shared palette for consistency.
"""
from __future__ import annotations

import math
import os
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

from .palette import SUBGUIDES, INK, PAPER, MUTED, WHITE, DECISION, hex_to_rgba


def _text_color_for_bg(bg_hex: str) -> str:
    r, g, b, _ = hex_to_rgba(bg_hex)
    def _lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    lum = 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)
    contrast_white = 1.05 / (lum + 0.05)
    return WHITE if contrast_white >= 4.5 else INK


def _box(ax, x, y, w, h, text, color, size=9, text_color=None):
    if text_color is None:
        text_color = _text_color_for_bg(color)
    patch = FancyBboxPatch(
        (x - w / 2, y - h / 2), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.07",
        facecolor=color, edgecolor=INK, linewidth=1.1,
    )
    ax.add_patch(patch)
    ax.text(x, y, text, ha="center", va="center",
            color=text_color, fontsize=size, fontweight="bold",
            linespacing=1.3)


def _arrow(ax, start, end, color=None):
    c = color or INK
    ax.annotate("", xy=end, xytext=start,
                arrowprops={"arrowstyle": "->", "color": c, "lw": 1.5})


# ---------------------------------------------------------------------------
# 1. breathing_techniques.png — Calm Guide
# ---------------------------------------------------------------------------

def generate_breathing_techniques(output_dir: str) -> str:
    accent = SUBGUIDES["calm"].accent
    fig, axes = plt.subplots(1, 3, figsize=(10, 3.5), dpi=180)
    fig.patch.set_facecolor(PAPER)

    techniques = [
        ("Box Breathing", ["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s"],
         [4, 4, 4, 4]),
        ("4-7-8 Technique", ["Inhale 4s", "Hold 7s", "Exhale 8s"],
         [4, 7, 8]),
        ("Physiological Sigh", ["Double inhale\n(nose)", "Long exhale\n(mouth)"],
         [2, 6]),
    ]

    for ax, (title, labels, durations) in zip(axes, techniques):
        ax.set_facecolor(PAPER)
        ax.set_xlim(-1.5, 1.5)
        ax.set_ylim(-1.5, 1.5)
        ax.axis("off")

        n = len(labels)
        angles = [i * 2 * math.pi / n - math.pi / 2 for i in range(n)]
        radius = 0.9
        positions = [(radius * math.cos(a), radius * math.sin(a)) for a in angles]

        for i, (pos, label, dur) in enumerate(zip(positions, labels, durations)):
            circle = plt.Circle(pos, 0.38, facecolor=accent, edgecolor=INK,
                                linewidth=1.2, alpha=0.85)
            ax.add_patch(circle)
            ax.text(pos[0], pos[1] + 0.05, label, ha="center", va="center",
                    color=WHITE, fontsize=7, fontweight="bold", linespacing=1.2)
            ax.text(pos[0], pos[1] - 0.18, f"{dur}s", ha="center", va="center",
                    color=WHITE, fontsize=9, fontweight="bold", alpha=0.7)

            nxt = positions[(i + 1) % n]
            dx, dy = nxt[0] - pos[0], nxt[1] - pos[1]
            dist = math.sqrt(dx ** 2 + dy ** 2)
            if dist > 0:
                ux, uy = dx / dist, dy / dist
                sx, sy = pos[0] + ux * 0.42, pos[1] + uy * 0.42
                ex, ey = nxt[0] - ux * 0.42, nxt[1] - uy * 0.42
                ax.annotate("", xy=(ex, ey), xytext=(sx, sy),
                            arrowprops={"arrowstyle": "->", "color": INK, "lw": 1.3})

        ax.set_title(title, fontsize=10, fontweight="bold", color=INK, pad=8)

    fig.suptitle("Breathing Techniques", fontsize=13, fontweight="bold",
                 color=INK, y=1.02)
    fig.tight_layout(pad=0.6)
    path = os.path.join(output_dir, "breathing_techniques.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 2. triage_flow.png — Ambulance / First Response
# ---------------------------------------------------------------------------

def generate_triage_flow(output_dir: str) -> str:
    accent = SUBGUIDES["ambulance"].accent
    fig, ax = plt.subplots(figsize=(8, 10), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis("off")

    ax.text(5, 11.5, "FIRST-AID TRIAGE OVERVIEW", ha="center",
            color=INK, fontsize=14, fontweight="bold")

    steps = [
        (5, 10.3, "Is the scene safe\nfor you to approach?", DECISION, 2.8, 0.8),
        (8.5, 10.3, "DO NOT ENTER\nCall 112", accent, 2.0, 0.8),
        (5, 8.8, "Responsive?\n(tap shoulders, shout)", DECISION, 2.8, 0.8),
        (5, 7.3, "Breathing normally?", DECISION, 2.8, 0.8),
        (8.5, 7.3, "Call 112\nStart CPR: 30:2", accent, 2.0, 0.8),
        (5, 5.8, "Severe bleeding?", DECISION, 2.8, 0.8),
        (8.5, 5.8, "Direct pressure\nCall 112", accent, 2.0, 0.8),
        (5, 4.3, "Signs of shock?\n(pale, cold, rapid pulse)", DECISION, 2.8, 0.8),
        (8.5, 4.3, "Lay flat, elevate legs\nKeep warm, call 112", accent, 2.0, 0.8),
        (5, 2.8, "Monitor + reassess\nevery 2 minutes", SUBGUIDES["calm"].accent, 2.8, 0.8),
    ]

    for x, y, text, color, w, h in steps:
        _box(ax, x, y, w, h, text, color, size=8)

    _arrow(ax, (5, 9.9), (5, 9.2))
    _arrow(ax, (6.4, 10.3), (7.5, 10.3), accent)
    ax.text(6.7, 10.5, "NO", color=accent, fontsize=7, fontweight="bold")
    ax.text(4.6, 9.5, "YES", color=DECISION, fontsize=7, fontweight="bold")

    _arrow(ax, (5, 8.4), (5, 7.7))
    _arrow(ax, (5, 6.9), (5, 6.2))
    _arrow(ax, (6.4, 7.3), (7.5, 7.3), accent)
    ax.text(6.7, 7.5, "NO", color=accent, fontsize=7, fontweight="bold")

    _arrow(ax, (6.4, 5.8), (7.5, 5.8), accent)
    ax.text(6.7, 6.0, "YES", color=accent, fontsize=7, fontweight="bold")
    _arrow(ax, (5, 5.4), (5, 4.7))

    _arrow(ax, (6.4, 4.3), (7.5, 4.3), accent)
    ax.text(6.7, 4.5, "YES", color=accent, fontsize=7, fontweight="bold")
    _arrow(ax, (5, 3.9), (5, 3.2))

    ax.text(5, 1.8, "Reassess: any change → restart from top",
            ha="center", color=MUTED, fontsize=8, fontstyle="italic")

    path = os.path.join(output_dir, "triage_flow.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 3. situation_a_tree.png — Responsibility
# ---------------------------------------------------------------------------

def generate_situation_a_tree(output_dir: str) -> str:
    accent = SUBGUIDES["responsibility"].accent
    fig, ax = plt.subplots(figsize=(9, 8), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 9)
    ax.axis("off")

    ax.text(5, 8.6, "SITUATION A — DECISION TREE", ha="center",
            color=INK, fontsize=14, fontweight="bold")
    ax.text(5, 8.2, "\"Am I responsible for someone right now?\"",
            ha="center", color=MUTED, fontsize=9, fontstyle="italic")

    _box(ax, 5, 7.2, 4.5, 0.7, "Is someone depending on me\nright now?", DECISION, 9)

    _box(ax, 2.5, 5.8, 3.0, 0.7, "Are they in\nimmediate danger?", accent, 9)
    _box(ax, 7.5, 5.8, 3.0, 0.7, "Can they wait\n10 minutes?", DECISION, 9)

    _arrow(ax, (3.8, 6.85), (2.8, 6.15), accent)
    ax.text(2.8, 6.6, "YES", color=accent, fontsize=7, fontweight="bold")
    _arrow(ax, (6.2, 6.85), (7.2, 6.15))
    ax.text(7.0, 6.6, "NO", color=DECISION, fontsize=7, fontweight="bold")

    _box(ax, 1.3, 4.3, 2.2, 0.7, "Call 112\nDirect others", SUBGUIDES["ambulance"].accent, 8)
    _box(ax, 3.7, 4.3, 2.2, 0.7, "Delegate\nBriefly", accent, 8)
    _box(ax, 6.3, 4.3, 2.2, 0.7, "Take your\n10 min", SUBGUIDES["calm"].accent, 8)
    _box(ax, 8.7, 4.3, 2.2, 0.7, "Arrange cover\nthen pause", SUBGUIDES["support"].accent, 8)

    _arrow(ax, (1.8, 5.45), (1.5, 4.65), SUBGUIDES["ambulance"].accent)
    ax.text(1.1, 5.1, "YES", color=SUBGUIDES["ambulance"].accent, fontsize=7, fontweight="bold")
    _arrow(ax, (3.2, 5.45), (3.5, 4.65), accent)
    ax.text(3.6, 5.1, "NO", color=accent, fontsize=7, fontweight="bold")

    _arrow(ax, (6.8, 5.45), (6.5, 4.65), SUBGUIDES["calm"].accent)
    ax.text(6.2, 5.1, "YES", color=SUBGUIDES["calm"].accent, fontsize=7, fontweight="bold")
    _arrow(ax, (8.2, 5.45), (8.5, 4.65), SUBGUIDES["support"].accent)
    ax.text(8.6, 5.1, "NO", color=SUBGUIDES["support"].accent, fontsize=7, fontweight="bold")

    ax.text(5, 3.2, "In all cases: guilt ≠ evidence of wrongdoing.\n"
            "You are allowed to need a bathroom.",
            ha="center", color=MUTED, fontsize=8.5, fontstyle="italic",
            linespacing=1.5, bbox=dict(boxstyle="round,pad=0.3",
                                       facecolor=PAPER, edgecolor=MUTED,
                                       linewidth=0.7))

    path = os.path.join(output_dir, "situation_a_tree.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 4. safe_place_route_map.png — Safety
# ---------------------------------------------------------------------------

def generate_safe_place_route_map(output_dir: str) -> str:
    accent = SUBGUIDES["safety"].accent
    fig, ax = plt.subplots(figsize=(9, 7), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")

    ax.text(5, 7.5, "SAFE-PLACE ROUTING MAP", ha="center",
            color=INK, fontsize=14, fontweight="bold")

    _box(ax, 5, 6.3, 4.0, 0.7, "Am I safe\nwhere I am right now?", DECISION, 10)

    routes = [
        (1.8, 4.5, "Stay + lock\nthe door", SUBGUIDES["calm"].accent),
        (4.2, 4.5, "Leave to a\nsafer room", accent),
        (6.5, 4.5, "Leave the\nbuilding", SUBGUIDES["ambulance"].accent),
        (8.8, 4.5, "Call for\nhelp now", SUBGUIDES["ambulance"].accent),
    ]
    labels_top = ["Safe here", "Safer nearby", "Not safe inside", "Immediate threat"]

    for i, ((x, y, text, color), label) in enumerate(zip(routes, labels_top)):
        _box(ax, x, y, 2.0, 0.7, text, color, 8)
        _arrow(ax, (3.0 + i * 1.2, 5.95), (x, 4.85), color)
        ax.text(x, 5.15, label, ha="center", color=color, fontsize=7, fontweight="bold")

    resources = [
        (2.5, 2.8, "Lock · barricade · silence phone"),
        (5.0, 2.8, "Tell someone where you are"),
        (7.5, 2.8, "Document · photograph · note time"),
    ]
    for x, y, text in resources:
        ax.text(x, y, text, ha="center", color=MUTED, fontsize=7.5,
                bbox=dict(boxstyle="round,pad=0.25", facecolor=PAPER,
                          edgecolor=MUTED, linewidth=0.6))

    ax.text(5, 1.6, "If violence: 112 (EU) · 911 (US) · 999 (UK)\n"
            "Domestic violence hotline: see Support Guide",
            ha="center", color=SUBGUIDES["ambulance"].accent, fontsize=8,
            fontweight="bold", linespacing=1.5)

    path = os.path.join(output_dir, "safe_place_route_map.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 5. communication_access_card.png — Safety (accessibility)
# ---------------------------------------------------------------------------

def generate_communication_access_card(output_dir: str) -> str:
    accent = SUBGUIDES["safety"].accent
    fig, ax = plt.subplots(figsize=(8, 5), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")

    ax.text(5, 5.5, "COMMUNICATION ACCESS ADAPTATIONS", ha="center",
            color=INK, fontsize=12, fontweight="bold")

    rows = [
        ("Verbal", "Phone call · shout · ask someone nearby", SUBGUIDES["calm"].accent),
        ("Text", "SMS 112 · text a contact · messaging app", accent),
        ("Visual", "Flash lights · wave from window · written note", SUBGUIDES["responsibility"].accent),
        ("Assistive", "AAC device · text-to-speech · relay service", SUBGUIDES["support"].accent),
        ("Silent", "Tap patterns · pre-arranged code word", SUBGUIDES["social"].accent),
    ]

    for i, (mode, desc, color) in enumerate(rows):
        y = 4.5 - i * 0.85
        _box(ax, 1.8, y, 2.5, 0.6, mode, color, 9)
        ax.text(5.5, y, desc, va="center", color=INK, fontsize=8.5)

    path = os.path.join(output_dir, "communication_access_card.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 6. hazard_override_matrix.png — Safety (environmental)
# ---------------------------------------------------------------------------

def generate_hazard_override_matrix(output_dir: str) -> str:
    accent = SUBGUIDES["safety"].accent
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.axis("off")

    ax.text(0.5, 0.95, "ENVIRONMENTAL HAZARD OVERRIDE MATRIX",
            transform=ax.transAxes, ha="center", va="top",
            color=INK, fontsize=12, fontweight="bold")

    cols = ["Hazard", "Override?", "Immediate Action", "Escalation"]
    rows_data = [
        ["Gas / chemical smell", "YES", "Ventilate, leave", "112 + fire service"],
        ["Flooding / water rise", "YES", "Move up, power off", "112 + water utility"],
        ["Structural crack", "MAYBE", "Photo + leave room", "Building management"],
        ["Power outage", "NO", "Use phone light", "Wait / report"],
        ["Locked in", "MAYBE", "Phone → call out", "112 if no phone"],
        ["Extreme cold/heat", "YES if medical", "Insulate / hydrate", "112 if symptoms"],
    ]

    col_x = [0.5, 3.0, 5.5, 8.2]
    y_start = 4.0
    row_h = 0.55

    for ci, (cx, col) in enumerate(zip(col_x, cols)):
        ax.text(cx, y_start + 0.3, col, ha="center", va="center",
                color=WHITE, fontsize=8.5, fontweight="bold",
                bbox=dict(boxstyle="round,pad=0.15", facecolor=accent))

    for ri, row in enumerate(rows_data):
        y = y_start - (ri + 1) * row_h
        bg = PAPER if ri % 2 == 0 else "#f0efea"
        ax.axhspan(y - row_h / 2, y + row_h / 2, xmin=0.02, xmax=0.98,
                   facecolor=bg, edgecolor="none")
        for ci, (cx, cell) in enumerate(zip(col_x, row)):
            color = SUBGUIDES["ambulance"].accent if cell in ("YES", "YES if medical") else INK
            weight = "bold" if ci == 1 else "normal"
            ax.text(cx, y, cell, ha="center", va="center",
                    color=color, fontsize=7.5, fontweight=weight)

    ax.set_xlim(-0.5, 10)
    ax.set_ylim(y_start - (len(rows_data) + 1) * row_h, y_start + 0.7)

    path = os.path.join(output_dir, "hazard_override_matrix.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 7. dependency_continuity_map.png — Safety + Zombie shared
# ---------------------------------------------------------------------------

def generate_dependency_continuity_map(output_dir: str) -> str:
    accent_safety = SUBGUIDES["safety"].accent
    accent_zombie = SUBGUIDES["zombie"].accent
    fig, ax = plt.subplots(figsize=(9, 6), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis("off")

    ax.text(5, 6.6, "ESSENTIAL TREATMENT & DEVICE CONTINUITY",
            ha="center", color=INK, fontsize=12, fontweight="bold")

    categories = [
        ("Medication", 1.5, 5.5, accent_safety,
         ["Insulin", "Inhalers", "Epinephrine", "Anticoagulants"]),
        ("Powered devices", 5.0, 5.5, accent_zombie,
         ["CPAP", "Hearing aids", "Insulin pump", "Phone charger"]),
        ("Mobility", 8.5, 5.5, SUBGUIDES["body"].accent,
         ["Wheelchair", "Crutches", "Walker", "Prosthetics"]),
    ]

    for label, x, y, color, items in categories:
        _box(ax, x, y, 2.5, 0.6, label, color, 9)
        for i, item in enumerate(items):
            iy = y - 0.8 - i * 0.5
            ax.text(x, iy, f"• {item}", ha="center", va="center",
                    color=INK, fontsize=7.5)

    ax.text(5, 1.0,
            "Can I reach it in 2 minutes? → get it now\n"
            "Need someone to bring it? → call/text now\n"
            "Device failing? → note serial # and call support line",
            ha="center", color=MUTED, fontsize=8, linespacing=1.6,
            bbox=dict(boxstyle="round,pad=0.4", facecolor=PAPER,
                      edgecolor=MUTED, linewidth=0.7))

    path = os.path.join(output_dir, "dependency_continuity_map.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 8. survival_pyramid.png — Zombie Guide
# ---------------------------------------------------------------------------

def generate_survival_pyramid(output_dir: str) -> str:
    accent = SUBGUIDES["zombie"].accent
    fig, ax = plt.subplots(figsize=(7, 8), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")

    ax.text(5, 9.5, "SURVIVAL PRIORITY PYRAMID", ha="center",
            color=INK, fontsize=14, fontweight="bold")

    levels = [
        ("Immediate\nSafety", SUBGUIDES["ambulance"].accent, 1.0),
        ("Air · Warmth\nShelter", accent, 0.85),
        ("Water\n(3-day rule)", SUBGUIDES["safety"].accent, 0.7),
        ("Food\n(3-week rule)", SUBGUIDES["responsibility"].accent, 0.55),
        ("Communication\n& Rescue", SUBGUIDES["support"].accent, 0.4),
        ("Community\n& Morale", SUBGUIDES["calm"].accent, 0.3),
    ]

    base_w = 8.0
    y_base = 1.0
    layer_h = 1.2

    for i, (text, color, width_frac) in enumerate(levels):
        y = y_base + (len(levels) - 1 - i) * layer_h
        w = base_w * width_frac
        _box(ax, 5, y + layer_h / 2, w, layer_h * 0.85, text, color, 9)

    ax.text(5, 0.4, "Address from top to bottom — skip nothing",
            ha="center", color=MUTED, fontsize=8, fontstyle="italic")

    path = os.path.join(output_dir, "survival_pyramid.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 9. scaling_chart.png — Zombie Guide
# ---------------------------------------------------------------------------

def generate_scaling_chart(output_dir: str) -> str:
    accent = SUBGUIDES["zombie"].accent
    fig, ax = plt.subplots(figsize=(8, 5), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)

    groups = ["Solo", "2-3", "4-8", "9-20", "20+"]
    complexity = [1, 2, 5, 12, 30]
    coordination = [0, 1, 3, 8, 20]

    x = np.arange(len(groups))
    width = 0.35

    bars1 = ax.bar(x - width / 2, complexity, width, label="Task complexity",
                   color=accent, edgecolor=INK, linewidth=0.8)
    bars2 = ax.bar(x + width / 2, coordination, width, label="Coordination overhead",
                   color=SUBGUIDES["support"].accent, edgecolor=INK, linewidth=0.8)

    ax.set_xlabel("Group size", color=INK, fontsize=10)
    ax.set_ylabel("Relative effort", color=INK, fontsize=10)
    ax.set_title("Coordination Scaling: Solo → Community",
                 color=INK, fontsize=12, fontweight="bold", pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(groups, color=INK)
    ax.tick_params(colors=INK)
    ax.legend(fontsize=8, loc="upper left")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    for spine in ax.spines.values():
        spine.set_color(MUTED)

    fig.tight_layout()
    path = os.path.join(output_dir, "scaling_chart.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# 10. master_flowchart.png — Appendix (simpler version of v2)
# ---------------------------------------------------------------------------

def generate_master_flowchart_simple(output_dir: str) -> str:
    """Compact single-column flowchart for appendix print card."""
    fig, ax = plt.subplots(figsize=(6, 10), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 12)
    ax.axis("off")

    ax.text(4, 11.5, "QUICK-REFERENCE FLOWCHART", ha="center",
            color=INK, fontsize=13, fontweight="bold")

    steps = [
        ("Immediate danger?", SUBGUIDES["ambulance"].accent, "→ Call 112"),
        ("Panic / overwhelm?", SUBGUIDES["calm"].accent, "→ Calm Guide"),
        ("Pain / injury?", SUBGUIDES["ambulance"].accent, "→ First Response"),
        ("Responsible for someone?", SUBGUIDES["responsibility"].accent, "→ Situation A"),
        ("Unsafe location?", SUBGUIDES["safety"].accent, "→ Safety Guide"),
        ("Infrastructure failure?", SUBGUIDES["zombie"].accent, "→ Zombie Guide"),
        ("Body question?", SUBGUIDES["body"].accent, "→ Body Manual"),
        ("Social situation?", SUBGUIDES["social"].accent, "→ Social Guide"),
        ("Need a number?", SUBGUIDES["support"].accent, "→ Support Guide"),
    ]

    y = 10.5
    for text, color, action in steps:
        _box(ax, 2.8, y, 3.8, 0.7, text, DECISION, 8)
        ax.text(5.5, y, action, va="center", color=color,
                fontsize=8.5, fontweight="bold")
        if y > 3:
            _arrow(ax, (2.8, y - 0.35), (2.8, y - 0.65))
            ax.text(2.4, y - 0.5, "no", color=MUTED, fontsize=6.5)
        y -= 0.9

    path = os.path.join(output_dir, "master_flowchart.png")
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")
    return path


# ---------------------------------------------------------------------------
# Public entry-point
# ---------------------------------------------------------------------------

ALL_GENERATORS = [
    generate_breathing_techniques,
    generate_triage_flow,
    generate_situation_a_tree,
    generate_safe_place_route_map,
    generate_communication_access_card,
    generate_hazard_override_matrix,
    generate_dependency_continuity_map,
    generate_survival_pyramid,
    generate_scaling_chart,
    generate_master_flowchart_simple,
]


def generate_subguide_diagrams(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    for gen in ALL_GENERATORS:
        gen(output_dir)


if __name__ == "__main__":
    out = (
        sys.argv[1]
        if len(sys.argv) > 1
        else str(Path(__file__).parent.parent.parent / "build" / "diagrams")
    )
    generate_subguide_diagrams(out)
