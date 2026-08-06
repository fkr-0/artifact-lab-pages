#!/usr/bin/env python3
"""Generate safe-place, reserve, and communication-access figures."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)
ROUTES = json.loads((ROOT / "src" / "data" / "route_catalog.json").read_text(encoding="utf-8"))
ACCESS = json.loads((ROOT / "src" / "data" / "accessibility_profiles.json").read_text(encoding="utf-8"))

INK = "#14201d"
MUTED = "#52645e"
PAPER = "#fbfaf4"
WHITE = "#ffffff"
GREEN = "#0d7355"
RED = "#b42318"
BLUE = "#175cd3"
PURPLE = "#6f3ab2"
AMBER = "#9b5b00"
PALE = "#e9f2ed"


def canvas(figsize: tuple[float, float], xlim=(0, 12), ylim=(0, 10)):
    fig, ax = plt.subplots(figsize=figsize, dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.axis("off")
    return fig, ax


def card(ax, x, y, w, h, title, body, color, *, body_size=6.8):
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
    ax.text(x + w / 2, y + h - .22, title, ha="center", va="center",
            color=WHITE, fontsize=9.2, fontweight="bold")
    ax.text(x + .18, y + h - .62, body, ha="left", va="top",
            color=INK, fontsize=body_size, linespacing=1.25)


def save(fig, name: str):
    path = OUT / name
    fig.savefig(path, bbox_inches="tight", facecolor=PAPER)
    plt.close(fig)
    print(f"  [OK] {path}")


# Four-way safe-place route map: short labels only; the chapter owns the detail.
fig, ax = canvas((10.5, 7.6), (0, 12), (0, 8.5))
ax.text(6, 8.34, "SITUATION G / NO SAFE PLACE", ha="center", color=INK,
        fontsize=22, fontweight="bold")
ax.set_ylim(0, 8.5)
ax.text(6, 8.08, "Secure the next safe hour. Then solve the larger problem.",
        ha="center", color=MUTED, fontsize=9, style="italic")
ax.add_patch(FancyBboxPatch((2.4, 7.12), 7.2, .58, boxstyle="round,pad=.03",
                            facecolor=RED, edgecolor=RED))
ax.text(6, 7.41, "OVERRIDE: 112 life/medical · 110 active threat · Situation H environment",
        ha="center", va="center", color=WHITE, fontsize=8.2, fontweight="bold")

routes = ROUTES["safe_place_routes"]
colors = [PURPLE, AMBER, BLUE, GREEN]
titles = {
    "violence-coercion": "1 / PERSON OR THREAT",
    "no-roof-tonight": "2 / NO ROOF TONIGHT",
    "access-care-failure": "3 / PLACE FAILS ACCESS OR CARE",
    "social-internal-crisis": "4 / SOCIAL OR INTERNAL CRISIS",
}
route_copy = {
    "violence-coercion": ("Unsafe person or active threat", "Move toward safety", "Police / rescue / specialist route"),
    "no-roof-tonight": ("No weather-safe roof tonight", "Contact responsible local service", "Confirmed staffed place + backup"),
    "access-care-failure": ("Place fails access or essential care", "Name the barrier and reserve", "Accessible staffed destination"),
    "social-internal-crisis": ("Place is physically safe but unworkable", "Build a one-hour container", "Person + contact + escalation"),
}
for idx, (route, color) in enumerate(zip(routes, colors)):
    col, row = idx % 2, idx // 2
    x = .45 + col * 5.8
    y = 4.35 - row * 2.65
    failure, first, confirm = route_copy[route["id"]]
    body = f"FAILURE   {failure}\n\nFIRST     {first}\n\nCONFIRM   {confirm}"
    card(ax, x, y, 5.3, 2.25, titles[route["id"]], body, color, body_size=7.1)

ax.text(6, .35,
        "Start with the route that can make the next hour dangerous fastest.",
        ha="center", color=MUTED, fontsize=7.7)
save(fig, "safe_place_route_map.png")


# Communication access card: channel, action, and confirmation rather than prose blocks.
fig, ax = canvas((10.5, 8.8), (0, 12), (0, 9.8))
ax.text(6, 9.35, "COMMUNICATION IS PART OF THE ROUTE", ha="center", color=INK,
        fontsize=21, fontweight="bold")
ax.text(6, 8.9, "Ask what works. Adapt the channel; do not lower the urgency threshold.",
        ha="center", color=MUTED, fontsize=9)
profiles = ACCESS["profiles"]
short = {
    "blind-low-vision": "BLIND / LOW VISION",
    "deaf-hard-of-hearing": "DEAF / HARD OF HEARING",
    "speech-language": "SPEECH / LANGUAGE",
    "cognitive-overload": "COGNITIVE OVERLOAD",
    "mobility-fatigue-pain": "MOBILITY / FATIGUE / PAIN",
    "sensory-panic-neurodivergent": "SENSORY / PANIC / NEURODIVERGENCE",
}
colors = [BLUE, PURPLE, GREEN, AMBER, BLUE, PURPLE]
compact = {
    "blind-low-vision": ("read aloud · describe obstacles", "mobility aid stays with person"),
    "deaf-hard-of-hearing": ("write · text · visual alert · relay", "confirm the reply was understood"),
    "speech-language": ("point · yes/no · text · chosen partner", "person answers when they can"),
    "cognitive-overload": ("one speaker · literal short sentence", "one action, then repeat"),
    "mobility-fatigue-pain": ("accessible route · trained transfer help", "equipment and position stay safe"),
    "sensory-panic-neurodivergent": ("reduce stimulation · ask before touch", "offer a non-breath option"),
}
for idx, (profile, color) in enumerate(zip(profiles, colors)):
    col, row = idx % 2, idx // 2
    x = .45 + col * 5.8
    y = 6.25 - row * 2.0
    adapt, confirm = compact[profile["id"]]
    body = f"ADAPT    {adapt}\n\nCONFIRM  {confirm}"
    card(ax, x, y, 5.3, 1.68, short[profile["id"]], body, color, body_size=7.1)

ax.add_patch(FancyBboxPatch((1.0, .34), 10.0, .78, boxstyle="round,pad=.04",
                            facecolor=PALE, edgecolor=GREEN, linewidth=1.5))
ax.text(6, .73,
        "ONE SPEAKER · ONE SENTENCE · ONE QUESTION · ONE NEXT ACTION · WRITE IT DOWN",
        ha="center", va="center", color=INK, fontsize=8.5, fontweight="bold")
save(fig, "communication_access_card.png")


# Six fields that turn a possible safe place into a usable route.
fig, ax = canvas((10.8, 6.2), (0, 12), (0, 7))
ax.text(6, 6.58, "A SAFE PLACE IS CONFIRMED, NOT MERELY NAMED", ha="center", color=INK,
        fontsize=20, fontweight="bold")
ax.text(6, 6.18, "Obtain enough operational detail to arrive, enter, and recover when the first route fails.",
        ha="center", color=MUTED, fontsize=8.8)
fields = [
    ("1", "DESTINATION", "name + exact place", PURPLE),
    ("2", "AVAILABLE", "open · permitted · staffed", AMBER),
    ("3", "ACCESS", "entry · stairs · lift · transfer", BLUE),
    ("4", "ARRIVAL", "time · entrance · who to ask for", GREEN),
    ("5", "BACKUP", "second destination or service", PURPLE),
    ("6", "ESCALATE", "condition that changes the route", RED),
]
for idx, (number, label, detail, colour) in enumerate(fields):
    col, row = idx % 3, idx // 3
    x = .45 + col * 3.83
    y = 3.62 - row * 2.05
    card(ax, x, y, 3.35, 1.55, f"{number} / {label}", detail, colour, body_size=8.0)
ax.text(6, .32, "“TRY SOMEWHERE ELSE” IS NOT YET A DESTINATION, BACKUP, OR ARRIVAL INSTRUCTION.",
        ha="center", va="center", color=INK, fontsize=8.4, fontweight="bold")
save(fig, "safe_place_confirmation_packet.png")


# Reserve clock for access, medication, power, caregiver, and transport failure.
fig, ax = canvas((10.6, 5.8), (0, 12), (0, 6.5))
ax.text(6, 6.08, "MOVE BEFORE THE SAFE RESERVE ENDS", ha="center", color=INK,
        fontsize=21, fontweight="bold")
ax.text(6, 5.68, "The remaining time or supply is a planning estimate, not a guarantee.",
        ha="center", color=MUTED, fontsize=9)
stages = [
    (0.55, "1 / IDENTIFY", "What function is essential?\nWhat remains?", BLUE),
    (4.35, "2 / CALL + CONFIRM", "Supplier · care team · service\nDestination · access · transport", GREEN),
    (8.15, "3 / MOVE EARLY", "Leave margin for delay\nEscalate before failure", AMBER),
]
for x, label, body, colour in stages:
    card(ax, x, 2.6, 3.3, 1.72, label, body, colour, body_size=7.7)
for x in (3.9, 7.7):
    ax.annotate("", xy=(x + .35, 3.46), xytext=(x, 3.46),
                arrowprops={"arrowstyle": "-|>", "lw": 1.8, "color": INK})
ax.add_patch(FancyBboxPatch((1.2, .75), 9.6, .72, boxstyle="round,pad=.04",
                            facecolor=PALE, edgecolor=RED, linewidth=1.8))
ax.text(6, 1.11,
        "UNKNOWN RESERVE OR A LIFE-SUPPORTING FAILURE → TREAT AS TIME-CRITICAL AND USE THE EMERGENCY ROUTE WHEN INDICATED.",
        ha="center", va="center", color=RED, fontsize=8.2, fontweight="bold")
save(fig, "safe_reserve_clock.png")
