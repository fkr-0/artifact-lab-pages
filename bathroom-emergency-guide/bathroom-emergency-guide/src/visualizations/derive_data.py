#!/usr/bin/env python3
"""Derive reviewed Vega-Lite tables from canonical Bathroom Guide registries."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src" / "data"
OUT = DATA / "derived"
OUT.mkdir(parents=True, exist_ok=True)


def load(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def write(name: str, rows: list[dict]) -> None:
    path = OUT / name
    path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  [OK] {path.relative_to(ROOT)} ({len(rows)} rows)")


evidence = load("evidence_facts.json")["facts"]
continuity = load("continuity_catalog.json")

original = evidence["gad7_original"]
pooled = evidence["gad7_cochrane"]
gad7_rows = [
    {
        "study": "Original primary-care study",
        "measure": "Sensitivity",
        "estimate": round(original["sensitivity"] * 100),
        "lower": round(original["sensitivity"] * 100),
        "upper": round(original["sensitivity"] * 100),
        "label": f"{original['sensitivity']:.0%}",
        "interval_label": "single-study estimate",
        "row_label": "Sensitivity — Original primary-care study",
    },
    {
        "study": "Pooled diagnostic review",
        "measure": "Sensitivity",
        "estimate": round(pooled["sensitivity"] * 100),
        "lower": round(pooled["sensitivity_ci95"][0] * 100),
        "upper": round(pooled["sensitivity_ci95"][1] * 100),
        "label": f"{pooled['sensitivity']:.0%}",
        "interval_label": f"95% CI {pooled['sensitivity_ci95'][0]:.0%}–{pooled['sensitivity_ci95'][1]:.0%}",
        "row_label": "Sensitivity — Pooled diagnostic review",
    },
    {
        "study": "Original primary-care study",
        "measure": "Specificity",
        "estimate": round(original["specificity"] * 100),
        "lower": round(original["specificity"] * 100),
        "upper": round(original["specificity"] * 100),
        "label": f"{original['specificity']:.0%}",
        "interval_label": "single-study estimate",
        "row_label": "Specificity — Original primary-care study",
    },
    {
        "study": "Pooled diagnostic review",
        "measure": "Specificity",
        "estimate": round(pooled["specificity"] * 100),
        "lower": round(pooled["specificity_ci95"][0] * 100),
        "upper": round(pooled["specificity_ci95"][1] * 100),
        "label": f"{pooled['specificity']:.0%}",
        "interval_label": f"95% CI {pooled['specificity_ci95'][0]:.0%}–{pooled['specificity_ci95'][1]:.0%}",
        "row_label": "Specificity — Pooled diagnostic review",
    },
]
write("vega_gad7_accuracy.json", gad7_rows)

water = evidence["household_water"]
water_rows = []
for people in range(1, 7):
    for days, horizon in [
        (water["minimum_useful_days"], f"Start: {water['minimum_useful_days']} days"),
        (water["preferred_days"], f"Build toward: {water['preferred_days']} days"),
    ]:
        litres = water["litres_per_person_per_day"] * people * days
        water_rows.append({
            "people": str(people),
            "people_count": people,
            "days": days,
            "horizon": horizon,
            "litres": litres,
            "label": f"{int(litres)} L",
        })
write("vega_household_water_stock.json", water_rows)

social = evidence["social_connection_mortality"]
social_rows = []
for name, value in social["associations"].items():
    social_rows.append({
        "condition": name.title(),
        "reference": 1.0,
        "odds_ratio": value,
        "label": f"OR {value:.2f}",
    })
write("vega_social_connection.json", social_rows)

communication_rows = []
for n in [2, 3, 5, 10, 20, 50, 100]:
    channels = n * (n - 1) // 2
    communication_rows.append({
        "group_size": n,
        "channels": channels,
        "group_label": str(n),
        "channel_label": f"{channels:,}",
    })
write("vega_communication_channels.json", communication_rows)

systems = continuity["systems"]
supports = {item["id"]: 0 for item in systems}
for item in systems:
    for dep in item["dependencies"]:
        supports[dep] += 1
continuity_rows = []
for item in systems:
    continuity_rows.extend([
        {
            "system": item["label"],
            "metric": "Depends on",
            "count": len(item["dependencies"]),
            "label": str(len(item["dependencies"])),
        },
        {
            "system": item["label"],
            "metric": "Supports",
            "count": supports[item["id"]],
            "label": str(supports[item["id"]]),
        },
    ])
write("vega_continuity_dependencies.json", continuity_rows)

# Stroke urgency model: deterministic cumulative values at five-minute intervals.
stroke = evidence["stroke_time_model"]
stroke_rows = []
for minute in range(0, 61, 5):
    value = stroke["neurons_million_per_minute"] * minute
    stroke_rows.append({
        "minute": minute,
        "neurons_million": round(value, 1),
        "label": f"{value:.1f} million" if minute in {15, 30, 60} else "",
        "action_label": "FAST sign → 112" if minute == 60 else "",
    })
write("vega_stroke_time_model.json", stroke_rows)

# Sleep study design: exposure schedules only; no invented effect sizes.
sleep = evidence["sleep_restriction"]
sleep_rows = [
    {
        "condition": "8 h time in bed",
        "hours": 8,
        "duration_days": sleep["chronic_restriction_days"],
        "result": "comparatively stable performance",
        "label": f"{sleep['chronic_restriction_days']} days",
        "order": 1,
    },
    {
        "condition": "6 h time in bed",
        "hours": 6,
        "duration_days": sleep["chronic_restriction_days"],
        "result": "cumulative objective deficits",
        "label": f"{sleep['chronic_restriction_days']} days",
        "order": 2,
    },
    {
        "condition": "4 h time in bed",
        "hours": 4,
        "duration_days": sleep["chronic_restriction_days"],
        "result": "larger cumulative objective deficits",
        "label": f"{sleep['chronic_restriction_days']} days",
        "order": 3,
    },
    {
        "condition": "0 h comparator",
        "hours": 0,
        "duration_days": sleep["total_deprivation_comparator_days"],
        "result": "separate total-deprivation comparator",
        "label": f"{sleep['total_deprivation_comparator_days']} days",
        "order": 4,
    },
]
write("vega_sleep_study_design.json", sleep_rows)

# Deliberately separate denominators: one lifetime prevalence and one incidence range.
infertility = evidence["infertility_lifetime"]
psychosis = evidence["postpartum_psychosis"]
reproductive_rows = [
    {
        "panel": "Lifetime infertility",
        "measure": "People per 100",
        "value": round(infertility["estimate"] * 100, 1),
        "lower": round(infertility["estimate"] * 100, 1),
        "upper": round(infertility["estimate"] * 100, 1),
        "label": f"{infertility['estimate'] * 100:.1f} per 100",
        "denominator": "adults over the reproductive life course",
    },
    {
        "panel": "Postpartum psychosis",
        "measure": "Incidence per 1,000",
        "value": round(sum(psychosis["incidence_per_1000_range"]) / 2, 3),
        "lower": psychosis["incidence_per_1000_range"][0],
        "upper": psychosis["incidence_per_1000_range"][1],
        "label": f"{psychosis['incidence_per_1000_range'][0]:.2f}–{psychosis['incidence_per_1000_range'][1]:.1f} per 1,000",
        "denominator": "incidence estimates across five studies",
    },
]
write("vega_reproductive_denominators.json", reproductive_rows)
