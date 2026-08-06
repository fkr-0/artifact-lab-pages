#!/usr/bin/env python3
"""Generate Small-Room Observatory orientation diagrams.

Each figure is redundant with adjacent chapter prose. Number, position, shape,
and direct labels preserve the same route in monochrome output.
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Circle

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#17211f"
MUTED = "#52605c"
PAPER = "#fbfcfa"
WHITE = "#ffffff"
GREEN = "#0d7355"
GREEN_LIGHT = "#e2f1e9"
BLUE = "#175cd3"
BLUE_LIGHT = "#e8eefb"
AMBER = "#9b5b00"
AMBER_LIGHT = "#f5ebd7"
PURPLE = "#6f3ab2"
PURPLE_LIGHT = "#eee5f8"
RED = "#b42318"


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


def arrow(ax, x1: float, y1: float, x2: float, y2: float, *, color: str = INK, lw: float = 1.8):
    ax.add_patch(
        FancyArrowPatch(
            (x1, y1),
            (x2, y2),
            arrowstyle="-|>",
            mutation_scale=13,
            linewidth=lw,
            color=color,
        )
    )


def title(ax, heading: str, subtitle: str) -> None:
    ax.text(0.04, 0.955, heading, ha="left", va="top", fontsize=17, fontweight="bold", color=INK)
    ax.text(0.04, 0.895, subtitle, ha="left", va="top", fontsize=9.5, color=MUTED)
    ax.plot([0.04, 0.96], [0.855, 0.855], color=GREEN, linewidth=3)


def save(fig, filename: str) -> None:
    path = OUT / filename
    fig.savefig(path, dpi=220, bbox_inches="tight", pad_inches=0.12, facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"  [OK] {path}")


def observatory_scan() -> None:
    fig, ax = setup(10.8, 5.6)
    title(
        ax,
        "Scan body, room, and attention",
        "Observe three channels before choosing the route that owns the loudest problem.",
    )
    cards = [
        ("1", "BODY", "breathing · response · pain\nnausea · heat · dizziness", RED, "What changed?"),
        ("2", "ROOM", "smoke · gas · chemicals\nelectricity · water · exit", AMBER, "Is the place safe?"),
        ("3", "ATTENTION", "alarm · confusion · overload\nrepeating thought · next step", BLUE, "Can one action fit?"),
    ]
    for index, (number, label, detail, colour, question) in enumerate(cards):
        x = 0.05 + index * 0.31
        box(ax, x, 0.34, 0.27, 0.40, face=WHITE, edge=colour, lw=2)
        ax.add_patch(Circle((x + 0.052, 0.675), 0.027, facecolor=colour, edgecolor=colour))
        ax.text(x + 0.052, 0.675, number, ha="center", va="center", fontsize=10, fontweight="bold", color=WHITE)
        ax.text(x + 0.095, 0.675, label, ha="left", va="center", fontsize=12, fontweight="bold", color=INK)
        ax.text(x + 0.025, 0.555, detail, ha="left", va="center", fontsize=9, color=MUTED, linespacing=1.5)
        ax.plot([x + 0.025, x + 0.245], [0.455, 0.455], color=colour, linewidth=1.2)
        ax.text(x + 0.135, 0.395, question, ha="center", va="center", fontsize=9.1, fontweight="bold", color=INK)
    box(ax, 0.19, 0.12, 0.62, 0.11, face=GREEN_LIGHT, edge=GREEN)
    ax.text(
        0.50,
        0.175,
        "NAME ONE OBSERVATION  ·  CHANGE ONE SAFE VARIABLE  ·  COMPARE ONCE  ·  CHOOSE A ROUTE",
        ha="center",
        va="center",
        fontsize=9,
        fontweight="bold",
        color=INK,
    )
    save(fig, "observatory_scan.png")


def interoception_loop() -> None:
    fig, ax = setup(9.4, 6.2)
    title(
        ax,
        "A body signal becomes a working hypothesis",
        "Sensing, attention, interpretation, and action can amplify or revise one another.",
    )
    nodes = [
        (0.18, 0.63, "1", "SIGNAL", "heartbeat · nausea\nheat · tension", GREEN_LIGHT, GREEN),
        (0.62, 0.63, "2", "ATTENTION", "what becomes loud\nor difficult to ignore", BLUE_LIGHT, BLUE),
        (0.62, 0.28, "3", "STORY", "danger · shame\nillness · uncertainty", PURPLE_LIGHT, PURPLE),
        (0.18, 0.28, "4", "ACTION + NEW DATA", "sit · cool · leave\ncall · wait · compare", AMBER_LIGHT, AMBER),
    ]
    for x, y, number, label, detail, face, edge in nodes:
        box(ax, x, y, 0.28, 0.20, face=face, edge=edge, lw=2)
        ax.text(x + 0.03, y + 0.145, number, fontsize=13, fontweight="bold", color=edge, va="center")
        ax.text(x + 0.08, y + 0.145, label, fontsize=10.5, fontweight="bold", color=INK, va="center")
        ax.text(x + 0.03, y + 0.065, detail, fontsize=8.5, color=MUTED, va="center", linespacing=1.35)
    arrow(ax, 0.47, 0.73, 0.61, 0.73, color=BLUE)
    arrow(ax, 0.76, 0.61, 0.76, 0.49, color=PURPLE)
    arrow(ax, 0.61, 0.38, 0.47, 0.38, color=AMBER)
    arrow(ax, 0.32, 0.48, 0.32, 0.61, color=GREEN)
    box(ax, 0.28, 0.08, 0.44, 0.09, face=WHITE, edge=INK)
    ax.text(0.50, 0.125, "A vivid interpretation is still a hypothesis.", ha="center", va="center", fontsize=9.4, fontweight="bold", color=INK)
    save(fig, "interoception_loop.png")


def signal_story_question() -> None:
    fig, ax = setup(10.2, 5.2)
    title(
        ax,
        "Separate signal, story, and next question",
        "Description keeps a difficult state observable without pretending it is harmless.",
    )
    stages = [
        (0.05, "1 / SIGNAL", "Tight chest\nHot face\nNausea", GREEN_LIGHT, GREEN),
        (0.37, "2 / FAST STORY", "“Something terrible\nis starting.”", PURPLE_LIGHT, PURPLE),
        (0.69, "3 / NEXT QUESTION", "New or familiar?\nSteady or changing?\nWhat route owns it?", BLUE_LIGHT, BLUE),
    ]
    for x, label, body, face, edge in stages:
        box(ax, x, 0.31, 0.26, 0.38, face=face, edge=edge, lw=2)
        ax.text(x + 0.025, 0.62, label, ha="left", va="center", fontsize=9.5, fontweight="bold", color=edge)
        ax.text(x + 0.13, 0.45, body, ha="center", va="center", fontsize=10.3, color=INK, linespacing=1.5)
    arrow(ax, 0.315, 0.50, 0.365, 0.50)
    arrow(ax, 0.635, 0.50, 0.685, 0.50)
    ax.text(0.50, 0.16, "The question does not cancel danger. It decides what to check or do next.", ha="center", va="center", fontsize=9.3, fontweight="bold", color=INK)
    save(fig, "signal_story_question.png")


def three_minute_observation() -> None:
    fig, ax = setup(11.0, 5.5)
    title(
        ax,
        "Three minutes of observation, not three minutes of delay",
        "Use only when no immediate danger is apparent and the state is stable enough to compare.",
    )
    steps = [
        ("0:00", "SUPPORT", "sit · lean · feet stable", GREEN_LIGHT, GREEN),
        ("1:00", "CHANGE ONE THING", "posture · fan · light · pressure", BLUE_LIGHT, BLUE),
        ("2:00", "COMPARE", "better · same · worse", AMBER_LIGHT, AMBER),
        ("3:00", "CHOOSE", "body · alarm · threat · environment", PURPLE_LIGHT, PURPLE),
    ]
    xs = [0.04, 0.28, 0.52, 0.76]
    for x, (time, label, detail, face, edge) in zip(xs, steps):
        box(ax, x, 0.35, 0.20, 0.34, face=face, edge=edge, lw=2)
        ax.text(x + 0.10, 0.625, time, ha="center", va="center", fontsize=13, fontweight="bold", color=edge)
        ax.text(x + 0.10, 0.535, label, ha="center", va="center", fontsize=9.7, fontweight="bold", color=INK)
        ax.text(x + 0.10, 0.435, detail, ha="center", va="center", fontsize=8.4, color=MUTED, linespacing=1.35)
    for x in (0.245, 0.485, 0.725):
        arrow(ax, x, 0.52, x + 0.03, 0.52)
    box(ax, 0.17, 0.13, 0.66, 0.10, face=WHITE, edge=RED)
    ax.text(0.50, 0.18, "STOP THE EXPERIMENT WHEN DANGER APPEARS, THE STATE WORSENS, OR SAFE COMPARISON IS NO LONGER POSSIBLE.", ha="center", va="center", fontsize=8.7, fontweight="bold", color=RED)
    save(fig, "three_minute_observation.png")


if __name__ == "__main__":
    observatory_scan()
    interoception_loop()
    signal_story_question()
    three_minute_observation()
