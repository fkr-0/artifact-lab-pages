#!/usr/bin/env python3
"""Generate custom scientific figures used by Bathroom Emergency Guide.

All numeric inputs live in ``src/data/evidence_facts.json``.  The figures are
therefore reviewable without reading plotting code, and each chart prints its
scope and limit directly into the image.
"""
from __future__ import annotations

import io
import json
import sys
import textwrap
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "build" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)
DATA_PATH = ROOT / "src" / "data" / "evidence_facts.json"
DATA = json.loads(DATA_PATH.read_text(encoding="utf-8"))
F = DATA["facts"]

BG = "#fbf8f1"
PAPER = "#fffdf8"
INK = "#172033"
MUTED = "#5f6b7a"
GRID = "#ded8cc"
BLUE = "#2563eb"
CYAN = "#0891b2"
GREEN = "#15803d"
ORANGE = "#c2410c"
RED = "#b91c1c"
PURPLE = "#7e22ce"
YELLOW = "#a16207"


def wrapped(value: str, width: int = 105) -> str:
    return "\n".join(textwrap.wrap(value, width=width))


def evidence_footer(fig: plt.Figure, source: str, limit: str) -> None:
    fig.text(0.02, 0.045, wrapped(f"SOURCE · {source}", 120), fontsize=7.2,
             color=MUTED, ha="left", va="bottom")
    fig.text(0.02, 0.012, wrapped(f"LIMIT · {limit}", 120), fontsize=7.2,
             color=RED, ha="left", va="bottom", fontweight="bold")


def finish(fig: plt.Figure, filename: str) -> None:
    """Render a high-resolution PNG and add a restrained pixel frame."""
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", dpi=190, bbox_inches="tight",
                facecolor=BG, edgecolor="none")
    plt.close(fig)
    buffer.seek(0)
    image = Image.open(buffer).convert("RGBA")
    frame = 8
    framed = Image.new("RGBA", (image.width + 2 * frame, image.height + 2 * frame), BG)
    framed.paste(image, (frame, frame), image)
    draw = ImageDraw.Draw(framed)
    draw.rectangle((1, 1, framed.width - 2, framed.height - 2), outline=INK, width=2)
    draw.rectangle((4, 4, framed.width - 5, framed.height - 5), outline=BLUE, width=2)
    for x, y in ((4, 4), (framed.width - 5, 4), (4, framed.height - 5),
                 (framed.width - 5, framed.height - 5)):
        draw.rectangle((x - 2, y - 2, x + 2, y + 2), fill=BLUE)
    target = OUT / filename
    framed.convert("RGB").save(target, "PNG", optimize=True)
    print(f"  [OK] {target}")


def clean_axis(ax: plt.Axes) -> None:
    ax.set_facecolor(PAPER)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color(MUTED)
    ax.tick_params(colors=INK, labelsize=9)
    ax.grid(axis="x", color=GRID, linewidth=0.7, zorder=0)


def chart_evidence_classes() -> None:
    fig, ax = plt.subplots(figsize=(12, 6.2))
    fig.patch.set_facecolor(BG)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_facecolor(PAPER)
    ax.text(6, 6.55, "Evidence labels: what the number is allowed to say",
            ha="center", fontsize=16, fontweight="bold", color=INK)
    entries = [
        (1.55, "PROTOCOL", "authoritative action", "Do this when the condition applies", RED),
        (4.45, "POPULATION", "frequency in a defined group", "Context, not personal prophecy", BLUE),
        (7.55, "STUDY", "measured comparison", "Result depends on design and sample", GREEN),
        (10.45, "MODEL", "calculation from assumptions", "Useful only inside its stated scope", PURPLE),
    ]
    for x, title, middle, bottom, color in entries:
        box = patches.FancyBboxPatch((x - 1.25, 2.05), 2.5, 3.25,
                                     boxstyle="round,pad=0.18", facecolor="white",
                                     edgecolor=color, linewidth=2.5)
        ax.add_patch(box)
        ax.text(x, 4.7, title, ha="center", fontsize=12, color=color, fontweight="bold")
        ax.text(x, 3.75, wrapped(middle, 24), ha="center", va="center", fontsize=9, color=INK)
        ax.text(x, 2.75, wrapped(bottom, 25), ha="center", va="center", fontsize=8.5, color=MUTED)
    ax.text(6, 1.25,
            "Every figure also names its denominator, source, uncertainty and practical limit.",
            ha="center", fontsize=10.5, color=INK, fontweight="bold")
    ax.text(6, 0.72,
            "A chart without scope is decoration wearing safety goggles.",
            ha="center", fontsize=9.5, color=MUTED, style="italic")
    evidence_footer(fig, "Bathroom Emergency Guide evidence policy, v4.1.x",
                    "The label describes evidential role, not a universal quality score.")
    finish(fig, "evidence_classes.png")


def chart_gad7() -> None:
    original = F["gad7_original"]
    pooled = F["gad7_cochrane"]
    rows = [
        ("Original study · sensitivity", original["sensitivity"], None, BLUE),
        ("Pooled review · sensitivity", pooled["sensitivity"], pooled["sensitivity_ci95"], CYAN),
        ("Original study · specificity", original["specificity"], None, ORANGE),
        ("Pooled review · specificity", pooled["specificity"], pooled["specificity_ci95"], GREEN),
    ]
    fig, ax = plt.subplots(figsize=(11, 6.4))
    fig.patch.set_facecolor(BG)
    clean_axis(ax)
    y = np.arange(len(rows))[::-1]
    for yi, (label, value, ci, color) in zip(y, rows):
        if ci:
            ax.errorbar(value, yi, xerr=[[value - ci[0]], [ci[1] - value]], fmt="o",
                        markersize=9, capsize=5, color=color, linewidth=2.2, zorder=4)
        else:
            ax.scatter([value], [yi], s=90, color=color, marker="s", zorder=4)
        ax.text(value + 0.018, yi, f"{value:.0%}", va="center", fontsize=10,
                color=INK, fontweight="bold")
    ax.set_yticks(y, [r[0] for r in rows])
    ax.set_xlim(0.4, 1.01)
    ax.set_xticks(np.arange(0.4, 1.01, 0.1), [f"{x:.0%}" for x in np.arange(0.4, 1.01, 0.1)])
    ax.set_xlabel("Diagnostic-accuracy estimate at GAD-7 cut-off ≥10", color=INK)
    ax.set_title("GAD-7: one famous study is not the final calibration",
                 fontsize=15, fontweight="bold", color=INK, pad=14)
    ax.text(0.4, -1.0,
            "Squares: original primary-care validation. Circles: pooled estimate; whiskers: 95% CI.",
            fontsize=8.5, color=MUTED)
    evidence_footer(fig, f"{original['source']}  ·  {pooled['source']}", pooled["limit"])
    fig.subplots_adjust(left=0.29, bottom=0.21, top=0.84, right=0.97)
    finish(fig, "gad7_validation_comparison.png")


def chart_breathwork() -> None:
    trial = F["breathwork_trial"]
    fig, ax = plt.subplots(figsize=(12, 7.2))
    fig.patch.set_facecolor(BG)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.text(6, 7.55, "Breathwork trial: what was actually tested",
            ha="center", fontsize=16, fontweight="bold", color=INK)
    ax.text(6, 6.85,
            f"{trial['participants_included']} adults included · {trial['minutes_per_day']} min/day · {trial['duration_days']} days · remote randomized design",
            ha="center", fontsize=10, color=MUTED)
    labels = [
        ("Mindfulness\nmeditation", PURPLE),
        ("Cyclic\nsighing", BLUE),
        ("Box\nbreathing", GREEN),
        ("Cyclic hyperventilation\n+ retention", ORANGE),
    ]
    xs = [1.65, 4.55, 7.45, 10.35]
    for x, (label, color) in zip(xs, labels):
        box = patches.FancyBboxPatch((x - 1.15, 4.3), 2.3, 1.35,
                                     boxstyle="round,pad=0.15", facecolor="white",
                                     edgecolor=color, linewidth=2.4)
        ax.add_patch(box)
        ax.text(x, 4.98, label, ha="center", va="center", fontsize=9.5,
                color=color, fontweight="bold")
        ax.annotate("", xy=(x, 3.55), xytext=(x, 4.27),
                    arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.5))
    outcome = patches.FancyBboxPatch((1.15, 1.65), 9.7, 1.85,
                                     boxstyle="round,pad=0.18", facecolor="#eef6ff",
                                     edgecolor=BLUE, linewidth=2)
    ax.add_patch(outcome)
    ax.text(6, 2.95, "Measured daily mood/anxiety and wearable physiology",
            ha="center", fontsize=10.5, fontweight="bold", color=INK)
    ax.text(6, 2.35,
            wrapped("All four groups improved daily mood measures. Breathwork—especially cyclic sighing—showed greater positive-affect improvement and lower respiratory rate than mindfulness meditation.", 95),
            ha="center", va="center", fontsize=9.5, color=INK)
    ax.text(6, 0.95,
            "Interesting? Yes. Universal emergency cure? The study did not test that sentence.",
            ha="center", fontsize=10, color=RED, fontweight="bold")
    evidence_footer(fig, trial["source"], trial["limit"])
    finish(fig, "breathwork_trial_map.png")


def chart_reproductive_context() -> None:
    infertility = F["infertility_lifetime"]
    psychosis = F["postpartum_psychosis"]
    fig, axes = plt.subplots(1, 2, figsize=(12, 6.7))
    fig.patch.set_facecolor(BG)
    for ax in axes:
        ax.set_facecolor(PAPER)
        ax.spines[["top", "right"]].set_visible(False)
        ax.grid(axis="y", color=GRID, linewidth=0.6, zorder=0)
    axes[0].bar(["Lifetime infertility"], [100 * infertility["estimate"]], color=BLUE, width=0.55, zorder=3)
    axes[0].set_ylim(0, 25)
    axes[0].set_ylabel("people per 100", color=INK)
    axes[0].text(0, 100 * infertility["estimate"] + 0.8, "17.5 per 100\n≈ one in six",
                 ha="center", fontsize=11, fontweight="bold", color=INK)
    axes[0].set_title("Lifetime population estimate", fontsize=12, color=BLUE, fontweight="bold")
    lo, hi = psychosis["incidence_per_1000_range"]
    axes[1].bar(["Postpartum psychosis"], [hi - lo], bottom=[lo], color=ORANGE,
                width=0.55, zorder=3)
    axes[1].scatter([0, 0], [lo, hi], color=RED, s=55, zorder=4)
    axes[1].set_ylim(0, 3.2)
    axes[1].set_ylabel("incidence estimates per 1,000 women", color=INK)
    axes[1].text(0, hi + 0.15, f"range {lo:.2f}–{hi:.1f} per 1,000",
                 ha="center", fontsize=10.5, fontweight="bold", color=INK)
    axes[1].set_title("Incidence across five studies", fontsize=12, color=ORANGE, fontweight="bold")
    fig.suptitle("Denominators matter: two reproductive-health facts",
                 fontsize=15, fontweight="bold", color=INK, y=0.96)
    fig.text(0.5, 0.105,
             "These panels deliberately use different denominators and time frames. Do not compare bar heights.",
             ha="center", fontsize=9, color=RED, fontweight="bold")
    evidence_footer(fig, f"{infertility['source']}  ·  {psychosis['source']}",
                    "Population context only. Postpartum psychosis symptoms remain an emergency despite low incidence; infertility prevalence does not predict one person or one attempt.")
    fig.subplots_adjust(bottom=0.23, top=0.82, left=0.09, right=0.97, wspace=0.35)
    finish(fig, "reproductive_health_denominators.png")


def chart_stroke_model() -> None:
    stroke = F["stroke_time_model"]
    minutes = np.arange(0, 61)
    neurons = stroke["neurons_million_per_minute"] * minutes
    fig, ax = plt.subplots(figsize=(11, 6.8))
    fig.patch.set_facecolor(BG)
    clean_axis(ax)
    ax.plot(minutes, neurons, color=RED, linewidth=3, zorder=3)
    ax.fill_between(minutes, 0, neurons, color=RED, alpha=0.12, zorder=2)
    for minute in (15, 30, 60):
        value = stroke["neurons_million_per_minute"] * minute
        ax.scatter([minute], [value], color=INK, s=50, zorder=4)
        ax.text(minute, value + 4.5, f"{value:.1f} million", ha="center",
                fontsize=9, color=INK, fontweight="bold")
    ax.set_xlim(0, 60)
    ax.set_ylim(0, 125)
    ax.set_xlabel("minutes in the model", color=INK)
    ax.set_ylabel("cumulative neurons lost (millions, model estimate)", color=INK)
    ax.set_title("‘Time is brain’ quantified—an urgency model, not a bedside meter",
                 fontsize=14.5, fontweight="bold", color=INK, pad=14)
    ax.text(2, 108,
            f"Also estimated per minute:\n{stroke['synapses_billion_per_minute']} billion synapses\n{stroke['myelinated_fibre_km_per_minute']} km myelinated fibres",
            fontsize=9.5, color=INK, va="top",
            bbox=dict(boxstyle="round,pad=0.45", facecolor="white", edgecolor=BLUE))
    ax.text(59, 8, "FAST sign → 112 now", ha="right", fontsize=11,
            color=RED, fontweight="bold")
    evidence_footer(fig, stroke["source"], stroke["limit"])
    fig.subplots_adjust(bottom=0.22, top=0.84, left=0.12, right=0.97)
    finish(fig, "stroke_time_model.png")


def chart_water() -> None:
    water = F["household_water"]
    people = np.arange(1, 7)
    short = water["litres_per_person_per_day"] * people * water["minimum_useful_days"]
    full = water["litres_per_person_per_day"] * people * water["preferred_days"]
    width = 0.34
    fig, ax = plt.subplots(figsize=(11, 6.8))
    fig.patch.set_facecolor(BG)
    clean_axis(ax)
    x = np.arange(len(people))
    ax.bar(x - width / 2, short, width, label=f"{water['minimum_useful_days']} days",
           color=CYAN, zorder=3)
    ax.bar(x + width / 2, full, width, label=f"{water['preferred_days']} days",
           color=BLUE, zorder=3)
    for xi, value in zip(x + width / 2, full):
        ax.text(xi, value + 2.4, f"{int(value)} L", ha="center", fontsize=8,
                color=INK, fontweight="bold")
    ax.set_xticks(x, [str(n) for n in people])
    ax.set_xlabel("people in household", color=INK)
    ax.set_ylabel("stored drinking/cooking water (litres)", color=INK)
    ax.set_title("Household water planner: start with three days, build toward ten",
                 fontsize=14.5, fontweight="bold", color=INK, pad=14)
    ax.legend(frameon=False, loc="upper left")
    ax.text(5.4, 25, r"$W = 2nd$ litres", fontsize=13, color=BLUE, ha="right",
            bbox=dict(boxstyle="round,pad=0.35", facecolor="white", edgecolor=BLUE))
    evidence_footer(fig, water["source"], water["limit"])
    fig.subplots_adjust(bottom=0.22, top=0.84, left=0.11, right=0.97)
    finish(fig, "household_water_planner.png")


def chart_sleep() -> None:
    sleep = F["sleep_restriction"]
    fig, ax = plt.subplots(figsize=(12, 7.1))
    fig.patch.set_facecolor(BG)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 10)
    ax.axis("off")
    ax.text(7.5, 9.55, "Sleep restriction: impairment can accumulate before self-awareness catches up",
            ha="center", fontsize=15, fontweight="bold", color=INK)
    ax.text(7.5, 8.9,
            f"Controlled laboratory study · n={sleep['participants']} enrolled · chronic-restriction arms {sleep['chronic_restriction_days']} days",
            ha="center", fontsize=10, color=MUTED)
    rows = [(8, GREEN, "8 h time in bed", "performance comparatively stable"),
            (6, ORANGE, "6 h time in bed", "cumulative objective deficits"),
            (4, RED, "4 h time in bed", "larger cumulative objective deficits")]
    for y, color, label, result in rows:
        ax.add_patch(patches.FancyBboxPatch((0.7, y - 0.45), 3.0, 0.9,
                                            boxstyle="round,pad=0.1", facecolor="white",
                                            edgecolor=color, linewidth=2.2))
        ax.text(2.2, y, label, ha="center", va="center", fontsize=10,
                fontweight="bold", color=color)
        for day in range(1, 15):
            ax.add_patch(patches.Rectangle((4.1 + (day - 1) * 0.56, y - 0.22),
                                           0.42, 0.44, facecolor=color, alpha=0.78,
                                           edgecolor="none"))
        ax.text(12.45, y, wrapped(result, 26), ha="left", va="center",
                fontsize=9.2, color=INK)
    ax.text(7.9, 4.75, "chronic-restriction days 1 → 14", ha="center", fontsize=9, color=MUTED)
    ax.text(7.5, 4.25,
            f"A separate 0-hour time-in-bed comparator lasted {sleep['total_deprivation_comparator_days']} days.",
            ha="center", fontsize=8.7, color=MUTED)
    ax.text(7.5, 2.95,
            wrapped("Subjective sleepiness increased early but changed less thereafter and did not clearly distinguish the four- and six-hour conditions. Feeling ‘used to it’ was not the same as performing normally.", 105),
            ha="center", va="center", fontsize=10, color=INK,
            bbox=dict(boxstyle="round,pad=0.55", facecolor="#fff7ed", edgecolor=ORANGE))
    ax.text(7.5, 1.35,
            "The bathroom translation: after repeated short sleep, simplify decisions and recruit a second brain.",
            ha="center", fontsize=10.5, color=BLUE, fontweight="bold")
    evidence_footer(fig, sleep["source"], sleep["limit"])
    finish(fig, "sleep_restriction_study.png")


def chart_social_connection() -> None:
    social = F["social_connection_mortality"]
    labels = list(social["associations"].keys())
    values = list(social["associations"].values())
    y = np.arange(len(labels))[::-1]
    fig, ax = plt.subplots(figsize=(10.5, 6.2))
    fig.patch.set_facecolor(BG)
    clean_axis(ax)
    ax.axvline(1.0, color=MUTED, linestyle="--", linewidth=1.5, zorder=1)
    colors = [BLUE, PURPLE, ORANGE]
    for yi, label, value, color in zip(y, labels, values, colors):
        ax.plot([1.0, value], [yi, yi], color=color, linewidth=4, alpha=0.45, zorder=2)
        ax.scatter([value], [yi], s=120, color=color, zorder=3)
        ax.text(value + 0.012, yi, f"OR {value:.2f}", va="center", fontsize=10,
                color=INK, fontweight="bold")
    ax.set_yticks(y, [label.title() for label in labels])
    ax.set_xlim(0.95, 1.38)
    ax.set_xlabel("adjusted odds ratio for mortality across longitudinal studies", color=INK)
    ax.set_title("Social connection: notable long-term associations, not personal fate",
                 fontsize=14.5, fontweight="bold", color=INK, pad=14)
    ax.text(1.005, -0.72, "OR 1.00 = reference", fontsize=8.5, color=MUTED)
    evidence_footer(fig, social["source"], social["limit"])
    fig.subplots_adjust(left=0.23, bottom=0.23, top=0.82, right=0.96)
    finish(fig, "social_connection_associations.png")


CHARTS = [
    chart_evidence_classes,
    chart_breathwork,
]

if __name__ == "__main__":
    print("Generating evidence diagrams...")
    for index, chart in enumerate(CHARTS, start=1):
        print(f"  [{index}/{len(CHARTS)}] {chart.__name__.removeprefix('chart_').replace('_', ' ')}...")
        chart()
    print(f"Generated {len(CHARTS)} evidence diagrams from {DATA_PATH.relative_to(ROOT)}.")
