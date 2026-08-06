#!/usr/bin/env python3
"""Generate simple first-aid orientation diagrams with complete text fallbacks."""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Polygon, Rectangle

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#16201d"
MUTED = "#52645e"
PAPER = "#fbfaf4"
RED = "#b42318"
BLUE = "#2457a6"
GREEN = "#0d7355"
LINE = "#9baca5"


def finish(fig: plt.Figure, name: str) -> None:
    fig.savefig(OUT / f"{name}.png", dpi=220, bbox_inches="tight", facecolor=PAPER)
    fig.savefig(OUT / f"{name}.svg", bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {OUT / (name + '.png')}")


# Adult CPR location: deliberately schematic, with head/hips/feet landmarks.
fig, ax = plt.subplots(figsize=(8.2, 10.4))
ax.set_xlim(0, 10)
ax.set_ylim(0, 14)
ax.axis("off")
ax.set_title("Adult chest-compression orientation", fontsize=20, fontweight="bold", color=INK, pad=18)
ax.text(5, 13.35, "Person flat on a firm surface · kneel beside the chest", ha="center", color=MUTED, fontsize=10)
ax.add_patch(Circle((5, 11.9), .72, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(FancyBboxPatch((3.25, 7.1), 3.5, 4.25, boxstyle="round,pad=.18,rounding_size=.8", facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Polygon([[3.55,7.2],[2.95,4.7],[3.75,4.55],[4.45,7.2]], closed=True, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Polygon([[6.45,7.2],[5.55,7.2],[6.25,4.55],[7.05,4.7]], closed=True, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Rectangle((3.95, 1.2), .9, 3.5, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Rectangle((5.15, 1.2), .9, 3.5, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Rectangle((3.55, .75), 1.3, .55, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Rectangle((5.15, .75), 1.3, .55, facecolor="white", edgecolor=INK, linewidth=2))
ax.add_patch(Circle((5, 9.25), .43, facecolor="#fde7e5", edgecolor=RED, linewidth=3))
ax.add_patch(FancyArrowPatch((8.75, 10.2), (5.45, 9.45), arrowstyle="-|>", mutation_scale=16, color=RED, linewidth=2))
ax.text(8.8, 10.55, "CENTRE OF CHEST", ha="right", color=RED, fontsize=12, fontweight="bold")
ax.text(8.8, 10.05, "lower half of breastbone", ha="right", color=INK, fontsize=9.5)
ax.text(1.05, 12.0, "HEAD", color=BLUE, fontsize=11, fontweight="bold")
ax.add_patch(FancyArrowPatch((2.1, 11.95), (4.2, 11.95), arrowstyle="-|>", mutation_scale=12, color=BLUE))
ax.text(1.05, 6.3, "HIPS", color=BLUE, fontsize=11, fontweight="bold")
ax.add_patch(FancyArrowPatch((2.1, 6.25), (3.6, 6.25), arrowstyle="-|>", mutation_scale=12, color=BLUE))
ax.text(1.05, 1.0, "FEET", color=BLUE, fontsize=11, fontweight="bold")
ax.add_patch(FancyArrowPatch((2.1, 1.0), (3.5, 1.0), arrowstyle="-|>", mutation_scale=12, color=BLUE))
ax.text(5, .05, "Hands together · shoulders above hands · push hard and fast · allow full recoil", ha="center", color=GREEN, fontsize=9.5, fontweight="bold")
finish(fig, "cpr_body_orientation")


# Recovery position: five spatial steps, matching the adjacent text route.
fig, axes = plt.subplots(1, 5, figsize=(15.5, 4.2))
fig.suptitle("Recovery position — unresponsive and breathing normally", fontsize=19, fontweight="bold", color=INK)
steps = [
    ("1", "Near arm up", "Kneel beside them.\nStraighten legs."),
    ("2", "Far hand to cheek", "Hold the hand\nagainst the near cheek."),
    ("3", "Far knee up", "Bend the far leg\nwithout lifting the body."),
    ("4", "Roll toward you", "Use the bent knee\nas a lever."),
    ("5", "Airway and drain", "Top leg at a right angle.\nTilt head back; mouth down."),
]
for ax, (number, title, note) in zip(axes, steps):
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.add_patch(FancyBboxPatch((.03,.05),.94,.88,boxstyle="round,pad=.02",facecolor="white",edgecolor=LINE,linewidth=1.5))
    ax.add_patch(Circle((.16,.82),.09,facecolor=GREEN,edgecolor=GREEN))
    ax.text(.16,.82,number,color="white",fontweight="bold",ha="center",va="center")
    ax.add_patch(Circle((.28,.55),.09,facecolor="white",edgecolor=INK,linewidth=1.5))
    if number in {"1","2","3"}:
        ax.plot([.36,.72],[.55,.55],color=INK,linewidth=5,solid_capstyle="round")
        ax.plot([.48,.38],[.55,.34],color=BLUE,linewidth=3)
        ax.plot([.63,.78],[.55,.33 if number=="3" else .55],color=BLUE,linewidth=3)
    else:
        ax.plot([.34,.66],[.55,.43],color=INK,linewidth=5,solid_capstyle="round")
        ax.plot([.52,.73],[.48,.27],color=BLUE,linewidth=3)
        ax.plot([.52,.35],[.48,.26],color=BLUE,linewidth=3)
        ax.add_patch(FancyArrowPatch((.75,.66),(.60,.52),arrowstyle="-|>",mutation_scale=12,color=GREEN))
    ax.text(.5,.18,title,ha="center",fontweight="bold",color=INK,fontsize=10)
    ax.text(.5,.075,note,ha="center",va="top",color=MUTED,fontsize=7.8)
fig.text(.5,.01,"Call 112 · keep checking normal breathing · abnormal breathing means CPR",ha="center",color=RED,fontweight="bold",fontsize=9)
fig.tight_layout(rect=(0,.05,1,.88))
finish(fig, "recovery_position_steps")


# AED action sequence: no reboot metaphor; the device decides whether shock is indicated.
fig, ax = plt.subplots(figsize=(12.6, 5.2))
ax.set_xlim(0, 12.6)
ax.set_ylim(0, 5.2)
ax.axis("off")
ax.set_title("AED — attach, listen, clear, continue CPR", fontsize=20, fontweight="bold", color=INK, pad=14)
steps = [
    ("1", "TURN ON", "Open or power on.\nFollow the voice."),
    ("2", "BARE + DRY CHEST", "Attach pads exactly\nas pictured."),
    ("3", "ANALYSE", "Nobody touches\nthe person."),
    ("4", "SHOCK IF TOLD", "Say CLEAR.\nDevice shocks only if indicated."),
    ("5", "CPR AGAIN", "Resume immediately.\nFollow the next prompt."),
]
for index,(number,title,note) in enumerate(steps):
    x=.25+index*2.46
    ax.add_patch(FancyBboxPatch((x,.9),2.12,3.2,boxstyle="round,pad=.08",facecolor="white",edgecolor=BLUE if index<3 else RED if index==3 else GREEN,linewidth=2))
    ax.add_patch(Circle((x+.27,3.76),.17,facecolor=INK,edgecolor=INK))
    ax.text(x+.27,3.76,number,color="white",ha="center",va="center",fontweight="bold")
    ax.text(x+1.06,3.14,title,ha="center",color=INK,fontweight="bold",fontsize=10)
    ax.text(x+1.06,2.25,note,ha="center",va="center",color=MUTED,fontsize=8.8)
    if index<4:
        ax.add_patch(FancyArrowPatch((x+2.14,2.5),(x+2.38,2.5),arrowstyle="-|>",mutation_scale=12,color=LINE))
ax.text(6.3,.35,"An AED analyzes the rhythm. It does not shock every cardiac arrest and it does not replace compressions.",ha="center",color=INK,fontweight="bold",fontsize=9.4)
finish(fig, "aed_action_sequence")
