#!/usr/bin/env python3
"""Generate professional-support routing and handoff diagrams.

The figures are intentionally redundant with adjacent chapter text. They use
number, position, shape, and direct labels so monochrome output retains the same
information as colour output.
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#17211f"
MUTED = "#52605c"
PAPER = "#fbfcfa"
ACCENT = "#0e7490"
ACCENT_LIGHT = "#d8f0f4"
WARM = "#f5e8d0"
SAFE = "#e4f2e9"


def setup(width: float, height: float):
    fig, ax = plt.subplots(figsize=(width, height), dpi=220)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    return fig, ax


def box(ax, x: float, y: float, w: float, h: float, *, face: str = "white", edge: str = INK, lw: float = 1.6, radius: float = 0.025):
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.009,rounding_size={radius}",
        linewidth=lw,
        edgecolor=edge,
        facecolor=face,
    )
    ax.add_patch(patch)
    return patch


def arrow(ax, x1: float, y1: float, x2: float, y2: float, *, style: str = "-|>", lw: float = 1.8):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=13, linewidth=lw, color=INK))


def title(ax, heading: str, subtitle: str) -> None:
    ax.text(0.04, 0.955, heading, ha="left", va="top", fontsize=17, fontweight="bold", color=INK)
    ax.text(0.04, 0.895, subtitle, ha="left", va="top", fontsize=9.5, color=MUTED)
    ax.plot([0.04, 0.96], [0.855, 0.855], color=ACCENT, linewidth=3)


def save(fig, filename: str) -> None:
    path = OUT / filename
    fig.savefig(path, dpi=220, bbox_inches="tight", pad_inches=0.12, facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"  [OK] {path}")


def call_packet() -> None:
    fig, ax = setup(10.5, 5.0)
    title(
        ax,
        "Professional call packet",
        "Externalize six facts first. The call handler chooses the next question and operational response.",
    )
    fields = [
        ("1", "WHERE", "address · floor · access"),
        ("2", "WHAT", "one-sentence problem"),
        ("3", "WHEN", "started · last known well"),
        ("4", "STATE", "awake · breathing · symptoms"),
        ("5", "DANGER", "fire · violence · traffic · substance"),
        ("6", "CALLBACK", "number and usable channel"),
    ]
    positions = [(0.05, 0.55), (0.36, 0.55), (0.67, 0.55), (0.05, 0.26), (0.36, 0.26), (0.67, 0.26)]
    for (number, label, detail), (x, y) in zip(fields, positions):
        box(ax, x, y, 0.27, 0.20, face=ACCENT_LIGHT if number in {"1", "4", "5"} else "white")
        ax.text(x + 0.026, y + 0.145, number, ha="left", va="center", fontsize=15, fontweight="bold", color=ACCENT)
        ax.text(x + 0.075, y + 0.145, label, ha="left", va="center", fontsize=11.5, fontweight="bold", color=INK)
        ax.text(x + 0.026, y + 0.07, detail, ha="left", va="center", fontsize=8.6, color=MUTED)
    box(ax, 0.19, 0.07, 0.62, 0.10, face=SAFE, edge=ACCENT)
    ax.text(0.50, 0.12, "ANSWER QUESTIONS  ·  USE SPEAKERPHONE WHEN SAFE  ·  STAY ON THE LINE", ha="center", va="center", fontsize=9.3, fontweight="bold", color=INK)
    save(fig, "professional_call_packet.png")


def support_layers() -> None:
    fig, ax = setup(8.7, 6.5)
    title(
        ax,
        "Support systems work in layers",
        "The layers can operate together. They are not a ranking of deservingness or a rule to exhaust lower layers first.",
    )
    layers = [
        ("4", "SPECIALIZED SERVICES", "psychological · psychiatric · specialist treatment", 0.22, 0.68, 0.56, 0.12, ACCENT_LIGHT),
        ("3", "FOCUSED NON-SPECIALIZED", "trained general health and social-service support", 0.16, 0.52, 0.68, 0.12, "white"),
        ("2", "COMMUNITY AND FAMILY", "connection · routines · groups · practical mutual aid", 0.10, 0.36, 0.80, 0.12, SAFE),
        ("1", "BASIC SERVICES AND SECURITY", "safety · shelter · food · water · medical care · information", 0.04, 0.20, 0.92, 0.12, WARM),
    ]
    for number, label, detail, x, y, w, h, face in layers:
        box(ax, x, y, w, h, face=face, edge=INK)
        ax.text(x + 0.035, y + h / 2, number, ha="center", va="center", fontsize=16, fontweight="bold", color=ACCENT)
        ax.text(x + 0.085, y + h * 0.66, label, ha="left", va="center", fontsize=10.2, fontweight="bold", color=INK)
        ax.text(x + 0.085, y + h * 0.32, detail, ha="left", va="center", fontsize=8.5, color=MUTED)
    ax.text(0.50, 0.105, "Housing cannot replace treatment. Treatment cannot replace safety, shelter, food, or continuity.", ha="center", va="center", fontsize=9.1, fontweight="bold", color=INK)
    save(fig, "support_system_layers.png")


def route_selector() -> None:
    fig, ax = setup(11.5, 7.1)
    title(
        ax,
        "Name the problem, then choose the system",
        "A service is useful when it can change the named problem. Keep one backup and escalate when immediate danger appears.",
    )
    headers = [(0.04, "NAMED PROBLEM"), (0.36, "PRIMARY SYSTEM"), (0.68, "BACKUP / LIMIT")]
    for x, label in headers:
        ax.text(x, 0.81, label, ha="left", va="center", fontsize=10, fontweight="bold", color=ACCENT)
    rows = [
        ("Life danger · fire · severe injury", "112 control centre", "Follow dispatcher · do not delay for another service"),
        ("Active crime or immediate threat", "110 police · 112 for rescue/fire", "Move to safety when possible"),
        ("Urgent, non-life-threatening medical need", "116 117 medical on-call", "112 if state becomes dangerous or unclear"),
        ("Psychological crisis without acute danger", "116 123 · SPD · clinical route", "112 for immediate self/other danger"),
        ("Legal, authority, housing, or benefits problem", "Responsible legal/social/municipal service", "115 may identify authority; it does not guarantee a bed"),
    ]
    y = 0.69
    for index, (problem, primary, backup) in enumerate(rows, start=1):
        face = ACCENT_LIGHT if index % 2 else "white"
        box(ax, 0.035, y - 0.065, 0.285, 0.12, face=face)
        box(ax, 0.355, y - 0.065, 0.285, 0.12, face=SAFE if index in {1, 2, 3} else "white")
        box(ax, 0.675, y - 0.065, 0.29, 0.12, face=WARM if index in {1, 2} else "white")
        ax.text(0.055, y + 0.015, f"{index}", ha="left", va="center", fontsize=11, fontweight="bold", color=ACCENT)
        ax.text(0.09, y, problem, ha="left", va="center", fontsize=8.5, color=INK, wrap=True)
        ax.text(0.375, y, primary, ha="left", va="center", fontsize=8.5, color=INK, wrap=True)
        ax.text(0.695, y, backup, ha="left", va="center", fontsize=8.2, color=INK, wrap=True)
        arrow(ax, 0.322, y, 0.352, y)
        arrow(ax, 0.642, y, 0.672, y)
        y -= 0.145
    box(ax, 0.16, 0.04, 0.68, 0.08, face=SAFE, edge=ACCENT)
    ax.text(0.50, 0.08, "WRONG SYSTEM? NAME THE UNCHANGED PROBLEM AGAIN AND HAND OFF — DO NOT INVENT A PROMISE.", ha="center", va="center", fontsize=8.8, fontweight="bold", color=INK)
    save(fig, "professional_route_selector.png")


if __name__ == "__main__":
    call_packet()
    support_layers()
    route_selector()
