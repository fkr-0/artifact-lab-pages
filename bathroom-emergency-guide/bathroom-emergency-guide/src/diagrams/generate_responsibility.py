#!/usr/bin/env python3
"""Generate Responsibility and Care operational diagrams.

Each figure is redundant with adjacent prose. Number, position, shape, and
direct labels preserve the same route in monochrome output; colour only speeds
scanning.
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#17211f"
MUTED = "#52605c"
PAPER = "#fbfcfa"
WHITE = "#ffffff"
ACCENT = "#9a6700"
ACCENT_LIGHT = "#f6ecd2"
RED = "#b42318"
RED_LIGHT = "#f8e5e2"
BLUE = "#175cd3"
BLUE_LIGHT = "#e8eefb"
GREEN = "#16794a"
GREEN_LIGHT = "#e2f1e8"
PURPLE = "#6f3ab2"
PURPLE_LIGHT = "#eee5f8"


def setup(width: float, height: float):
    fig, ax = plt.subplots(figsize=(width, height), dpi=220)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    return fig, ax


def box(
    ax,
    x: float,
    y: float,
    w: float,
    h: float,
    *,
    face: str = WHITE,
    edge: str = INK,
    lw: float = 1.6,
    radius: float = 0.025,
):
    patch = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle=f"round,pad=0.009,rounding_size={radius}",
        linewidth=lw,
        edgecolor=edge,
        facecolor=face,
    )
    ax.add_patch(patch)
    return patch


def arrow(
    ax,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    *,
    color: str = INK,
    lw: float = 1.8,
    connectionstyle: str = "arc3",
):
    ax.add_patch(
        FancyArrowPatch(
            (x1, y1),
            (x2, y2),
            arrowstyle="-|>",
            mutation_scale=13,
            linewidth=lw,
            color=color,
            connectionstyle=connectionstyle,
        )
    )


def title(ax, heading: str, subtitle: str) -> None:
    ax.text(0.04, 0.955, heading, ha="left", va="top", fontsize=17, fontweight="bold", color=INK)
    ax.text(0.04, 0.895, subtitle, ha="left", va="top", fontsize=9.5, color=MUTED)
    ax.plot([0.04, 0.96], [0.855, 0.855], color=ACCENT, linewidth=3)


def save(fig, filename: str) -> None:
    path = OUT / filename
    fig.savefig(path, dpi=220, bbox_inches="tight", pad_inches=0.12, facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"  [OK] {path}")


def responsibility_clock_map() -> None:
    fig, ax = setup(11.2, 6.3)
    title(
        ax,
        "Which responsibility clock is running?",
        "Choose the clock that owns the next useful action. Fault and explanation do not outrank safety.",
    )
    cards = [
        ("1", "LIVE HARM", "harm is happening now", "STOP + SAFETY ROUTE", RED_LIGHT, RED),
        ("2", "CONTINUING EFFECTS", "the event ended; effects remain", "STABILIZE + RECORD + TELL", BLUE_LIGHT, BLUE),
        ("3", "REPAIR", "no acute harm remains", "TRUTH + REPAIR + FOLLOW-UP", ACCENT_LIGHT, ACCENT),
        ("4", "ONGOING CARE", "a person, animal, or system depends on continuity", "ESSENTIALS + OWNER + BACKUP", GREEN_LIGHT, GREEN),
    ]
    positions = [(0.05, 0.52), (0.52, 0.52), (0.05, 0.23), (0.52, 0.23)]
    for (number, label, state, action, face, edge), (x, y) in zip(cards, positions):
        box(ax, x, y, 0.42, 0.22, face=face, edge=edge, lw=2)
        ax.add_patch(Circle((x + 0.045, y + 0.165), 0.025, facecolor=edge, edgecolor=edge))
        ax.text(x + 0.045, y + 0.165, number, ha="center", va="center", fontsize=9.5, fontweight="bold", color=WHITE)
        ax.text(x + 0.085, y + 0.167, label, ha="left", va="center", fontsize=10.7, fontweight="bold", color=INK)
        ax.text(x + 0.025, y + 0.102, state, ha="left", va="center", fontsize=8.8, color=MUTED)
        ax.text(x + 0.21, y + 0.045, action, ha="center", va="center", fontsize=8.7, fontweight="bold", color=edge)
    box(ax, 0.18, 0.075, 0.64, 0.09, face=WHITE, edge=INK)
    ax.text(
        0.50,
        0.12,
        "IMMEDIATE DANGER BYPASSES THE MORAL ARGUMENT. MOVE, CALL, OR HAND OFF FIRST.",
        ha="center",
        va="center",
        fontsize=9.1,
        fontweight="bold",
        color=INK,
    )
    save(fig, "responsibility_clock_map.png")


def repair_sequence() -> None:
    fig, ax = setup(11.7, 5.4)
    title(
        ax,
        "Repair is five verbs, not one verdict",
        "The sequence reduces further harm and tests whether the proposed repair actually helped.",
    )
    steps = [
        ("1", "STOP", "end the action\nor process", RED_LIGHT, RED),
        ("2", "STABILIZE", "prevent the next\ninjury or loss", BLUE_LIGHT, BLUE),
        ("3", "TELL", "state facts and\nurgent uncertainty", PURPLE_LIGHT, PURPLE),
        ("4", "REPAIR", "care · replace ·\ncompensate · change", ACCENT_LIGHT, ACCENT),
        ("5", "FOLLOW UP", "check effect and\nchange the system", GREEN_LIGHT, GREEN),
    ]
    xs = [0.035, 0.225, 0.415, 0.605, 0.795]
    for x, (number, label, detail, face, edge) in zip(xs, steps):
        box(ax, x, 0.33, 0.17, 0.34, face=face, edge=edge, lw=2)
        ax.text(x + 0.085, 0.605, number, ha="center", va="center", fontsize=14, fontweight="bold", color=edge)
        ax.text(x + 0.085, 0.515, label, ha="center", va="center", fontsize=9.6, fontweight="bold", color=INK)
        ax.text(x + 0.085, 0.405, detail, ha="center", va="center", fontsize=8.2, color=MUTED, linespacing=1.35)
    for x in (0.205, 0.395, 0.585, 0.775):
        arrow(ax, x, 0.50, x + 0.018, 0.50)
    arrow(ax, 0.88, 0.31, 0.12, 0.27, color=GREEN, lw=1.5, connectionstyle="arc3,rad=-0.16")
    ax.text(0.50, 0.20, "FOLLOW-UP MAY REOPEN STOP OR STABILIZE", ha="center", va="center", fontsize=8.4, fontweight="bold", color=GREEN)
    box(ax, 0.18, 0.075, 0.64, 0.075, face=WHITE, edge=ACCENT)
    ax.text(0.50, 0.112, "AN APOLOGY MAY BE PART OF REPAIR. IT IS NOT PROOF THAT REPAIR WAS ACCEPTED OR COMPLETE.", ha="center", va="center", fontsize=8.7, fontweight="bold", color=INK)
    save(fig, "repair_sequence.png")


def consent_authority_boundary() -> None:
    fig, ax = setup(11.0, 6.6)
    title(
        ax,
        "Support, consent, authority, and danger are different questions",
        "Disagreement does not automatically remove another adult's agency. Immediate danger changes the safety route, not the underlying principle.",
    )
    cards = [
        ("1", "CAN DECIDE + ASKS", "support the stated choice\nand offer one bounded action", GREEN_LIGHT, GREEN),
        ("2", "CAN DECIDE + DECLINES", "respect the boundary; state\nwhat help remains available", ACCENT_LIGHT, ACCENT),
        ("3", "CAPACITY UNCLEAR", "simplify communication; slow down;\nseek qualified assessment or advice", BLUE_LIGHT, BLUE),
        ("4", "IMMEDIATE DANGER", "use the emergency safety route;\nrestore participation as soon as possible", RED_LIGHT, RED),
    ]
    positions = [(0.06, 0.51), (0.52, 0.51), (0.06, 0.23), (0.52, 0.23)]
    for (number, label, detail, face, edge), (x, y) in zip(cards, positions):
        box(ax, x, y, 0.41, 0.21, face=face, edge=edge, lw=2)
        ax.text(x + 0.035, y + 0.155, number, ha="left", va="center", fontsize=14, fontweight="bold", color=edge)
        ax.text(x + 0.085, y + 0.155, label, ha="left", va="center", fontsize=10.2, fontweight="bold", color=INK)
        ax.text(x + 0.035, y + 0.072, detail, ha="left", va="center", fontsize=8.6, color=MUTED, linespacing=1.4)
    box(ax, 0.17, 0.075, 0.66, 0.09, face=WHITE, edge=INK)
    ax.text(
        0.50,
        0.12,
        "CARE DOES NOT CREATE UNLIMITED AUTHORITY. REFUSAL DOES NOT CANCEL A REAL EMERGENCY.",
        ha="center",
        va="center",
        fontsize=9.0,
        fontweight="bold",
        color=INK,
    )
    save(fig, "consent_authority_boundary.png")


def care_continuity_loop() -> None:
    fig, ax = setup(10.4, 7.0)
    title(
        ax,
        "A care plan must survive one person's absence",
        "Keep five fields visible. If any field is unknown, the plan still has a single point of failure.",
    )
    centre = (0.50, 0.48)
    ax.add_patch(Circle(centre, 0.105, facecolor=ACCENT_LIGHT, edgecolor=ACCENT, linewidth=2.2))
    ax.text(centre[0], centre[1] + 0.022, "PERSON · ANIMAL", ha="center", va="center", fontsize=10, fontweight="bold", color=INK)
    ax.text(centre[0], centre[1] - 0.025, "OR SYSTEM", ha="center", va="center", fontsize=10, fontweight="bold", color=INK)
    nodes = [
        (0.12, 0.60, "1", "ESSENTIALS", "food · medication\nshelter · routine", RED_LIGHT, RED),
        (0.63, 0.63, "2", "WARNING SIGNS", "what changes the route\nor triggers a call", BLUE_LIGHT, BLUE),
        (0.72, 0.28, "3", "OWNER", "who acts now\nand what they may decide", PURPLE_LIGHT, PURPLE),
        (0.28, 0.15, "4", "BACKUP", "who takes over\nif the owner cannot", GREEN_LIGHT, GREEN),
        (0.06, 0.28, "5", "NEXT REVIEW", "when facts, capacity,\nor supplies are checked", ACCENT_LIGHT, ACCENT),
    ]
    for x, y, number, label, detail, face, edge in nodes:
        box(ax, x, y, 0.25, 0.17, face=face, edge=edge, lw=2)
        ax.text(x + 0.025, y + 0.125, number, ha="left", va="center", fontsize=12, fontweight="bold", color=edge)
        ax.text(x + 0.065, y + 0.125, label, ha="left", va="center", fontsize=9.3, fontweight="bold", color=INK)
        ax.text(x + 0.025, y + 0.055, detail, ha="left", va="center", fontsize=8.0, color=MUTED, linespacing=1.35)
        arrow(ax, x + 0.125, y + 0.085, centre[0], centre[1], color=edge, lw=1.4)
    box(ax, 0.18, 0.055, 0.64, 0.075, face=WHITE, edge=GREEN)
    ax.text(0.50, 0.092, "WRITE THE PLAN WHERE THE BACKUP CAN FIND IT — NOT ONLY IN THE MOST EXHAUSTED PERSON'S HEAD.", ha="center", va="center", fontsize=8.6, fontweight="bold", color=INK)
    save(fig, "care_continuity_loop.png")


if __name__ == "__main__":
    responsibility_clock_map()
    repair_sequence()
    consent_authority_boundary()
    care_continuity_loop()
