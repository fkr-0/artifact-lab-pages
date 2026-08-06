#!/usr/bin/env python3
"""Validate the full eleven-book guide without enforcing one editorial era."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from project_meta import RELEASE_DATE, VERSION

ROOT = Path(__file__).resolve().parents[1]
CHAPTER_DIR = ROOT / "src" / "chapters"
CHAPTERS = sorted(CHAPTER_DIR.glob("*.md"))
STYLE = (ROOT / "src" / "style.css").read_text(encoding="utf-8")
STYLE_BOOKS = (ROOT / "src" / "style-subguides.css").read_text(encoding="utf-8")
STYLE_HALF = (ROOT / "src" / "style-a4-half.css").read_text(encoding="utf-8")
STYLE_LARGE = (ROOT / "src" / "style-large-print.css").read_text(encoding="utf-8")
HTML = ROOT / "build" / "html" / "guide.html"
PDF = ROOT / "build" / "pdf" / "guide.pdf"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def pdf_info(path: Path) -> dict[str, str]:
    result = subprocess.run(["pdfinfo", str(path)], capture_output=True, text=True)
    if result.returncode:
        return {}
    info: dict[str, str] = {}
    for line in result.stdout.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            info[key.strip()] = value.strip()
    return info


check(len(CHAPTERS) == 17, f"expected 17 canonical chapters, found {len(CHAPTERS)}")
source = "\n".join(path.read_text(encoding="utf-8") for path in CHAPTERS)
action_source = "\n".join(
    path.read_text(encoding="utf-8")
    for path in CHAPTERS
    if path.name not in {"09-version-history.md", "10-sources.md"}
)
opening = "\n".join(
    (CHAPTER_DIR / name).read_text(encoding="utf-8")
    for name in ("00-cover.md", "01-how-to-use.md")
)

# Chapter metadata remains reproducible.
for path in CHAPTERS:
    text = path.read_text(encoding="utf-8")
    check(text.startswith("---\n"), f"{path.name}: missing YAML frontmatter")
    check(re.search(rf'revision:\s*["\']{re.escape(VERSION)}["\']', text) is not None, f"{path.name}: revision drifted")
    check(re.search(rf'last_updated:\s*["\']{re.escape(RELEASE_DATE)}["\']', text) is not None, f"{path.name}: release date drifted")

# The master guide uses one compact gate, not a safety preface before every idea.
check(opening.count('<div class="emergency-gate">') == 1, "opening must contain one emergency gate")
check(opening.count("112") == 1, "opening must name 112 exactly once")
check("Page 0 — Position in the graph" not in source, "governance-first wrapper leaked into canonical prose")
check("Edition contract" not in source, "edition-contract language leaked into canonical prose")

books = (
    "The Green Book — Body Owner’s Manual",
    "The Amber Book — Responsibility",
    "The Teal Book — Calm Guide",
    "The Red Book — Self Ambulance",
    "The Blue Book — Safety & No Place",
    "The Orange Book — Natural Disasters",
    "The Olive Book — Zombie Guide",
    "The Indigo Book — Professional Support",
    "The Purple Book — Social Field Guide",
    "The Grey Book — Templates & Forms",
    "The Copper Book — Reference",
)
for title in books:
    check(title in source, f"canonical book title missing: {title}")

# Voice acceptance: adult humour remains, but it may not invent certainty.
for marker in (
    "You’re in a bathroom. That’s already a good start.",
    "future remains poorly supervised",
    "kernel panic",
    "The world changed while you were on the toilet",
    "floor first, dignity later",
    "The jokes stay. So do the sources.",
):
    check(marker in source, f"adult voice marker missing: {marker}")

unsafe_legacy = {
    "You die in 3 days without water": "fixed survival-clock claim remains",
    "You can survive roughly three weeks without food": "fixed starvation-clock claim remains",
    "Every container you find is now a water container": "unsafe indiscriminate water storage advice remains",
    "2 drops of unscented household bleach": "concentration-free bleach recipe remains",
    "Used by Navy SEALs": "unsupported authority appeal remains",
    "Fastest known way to reduce real-time physiological arousal": "breathing overclaim remains",
    "comfort threshold": "invented comfort score remains",
    "The bathtub protocol": "universal bathtub shelter protocol remains",
    "pressure equalization": "window-opening storm myth remains",
    "Toilet tank (cistern) |": "toilet-cistern drinking table remains",
    "112 works on any mobile, any network": "universal network guarantee remains",
    "Insects. Yes, really.": "unsafe wild-insect advice remains",
    "Scavenging. In a collapse": "looting/scavenging guidance remains",
}
for phrase, message in unsafe_legacy.items():
    check(phrase.lower() not in action_source.lower(), message)

# Core safety removals from earlier releases remain removed.
for phrase in (
    "Call 110. Now.",
    "pain_nrs_correlates",
    "starvation is preferable to poisoning",
    "Notdienst (emergency lawyer)",
    "fight it — not heroically",
    "Scent candle location",
):
    check(phrase.lower() not in action_source.lower(), f"removed unsafe phrase remains: {phrase}")
check("C(t) = C_0" not in action_source and "C(t)=C_0" not in action_source, "fictional cortisol equation remains")

# Every identity is independently visible without colour.
for node, pattern in {
    "O": "pulse", "A": "diamond", "B": "wave", "C": "cross",
    "D": "shield", "H": "zigzag", "Z": "crosshatch", "P": "dots",
    "S": "speech", "T": "form-grid", "R": "solid",
}.items():
    check(f'[data-subguide="{node}"]' in STYLE_BOOKS, f"book CSS selector missing: {node}")
    check(pattern in STYLE_BOOKS, f"book pattern missing: {pattern}")
for marker in (
    ".route-chip", ".figure-reference", ".template-route-band",
    ".resource-card", ".resource-kicker", ".resource-catalog",
    ".subguide-scope-grid", ".edition-resource-map",
):
    check(marker in STYLE_BOOKS, f"book cross-reference styling missing: {marker}")
check("column-count: 1 !important" in STYLE, "single-column print invariant missing")
check("font-size: 9.3pt" in STYLE, "A4 density typography drifted")
check("size: 105mm 297mm" in STYLE_HALF, "A4/2 geometry missing")
check("font-size: 13.25pt" in STYLE_LARGE, "large-print typography drifted")

# Evidence facts retain class, context, source, and limit.
evidence_path = ROOT / "src" / "data" / "evidence_facts.json"
check(evidence_path.exists(), "evidence registry missing")
if evidence_path.exists():
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    facts = evidence.get("facts", {})
    required = {
        "gad7_original", "gad7_cochrane", "breathwork_trial",
        "infertility_lifetime", "postpartum_psychosis", "stroke_time_model",
        "household_water", "sleep_restriction", "social_connection_mortality",
    }
    check(evidence.get("release") == VERSION, "evidence release drifted")
    check(required <= set(facts), "reviewed evidence fact set incomplete")
    for key in required & set(facts):
        fact = facts[key]
        check(bool(fact.get("class")), f"{key}: evidence class missing")
        check(bool(fact.get("source")), f"{key}: source missing")
        check(bool(fact.get("limit")), f"{key}: practical limit missing")

figure_groups = {
    "evidence": {
        "evidence_classes.png", "vega_gad7_accuracy.png", "breathwork_trial_map.png",
        "vega_reproductive_denominators.png", "vega_stroke_time_model.png",
        "vega_household_water_stock.png", "vega_sleep_study_design.png",
        "vega_social_connection.png", "vega_communication_channels.png",
    },
    "route": {
        "two_pass_route_map.png", "hazard_override_matrix.png",
        "dependency_continuity_map.png", "safe_place_route_map.png",
        "communication_access_card.png", "safe_place_confirmation_packet.png",
        "safe_reserve_clock.png",
    },
    "observation": {
        "observatory_scan.png", "interoception_loop.png",
        "signal_story_question.png", "three_minute_observation.png",
    },
    "responsibility": {
        "responsibility_clock_map.png", "repair_sequence.png",
        "consent_authority_boundary.png", "care_continuity_loop.png",
    },
    "continuity": {
        "household_continuity_board.png", "first_meeting_roles.png",
        "vega_continuity_dependencies.png",
    },
}
for group, names in figure_groups.items():
    for name in names:
        check((ROOT / "build" / "diagrams" / name).exists(), f"{group} figure missing: {name}")
        check(name in source, f"{group} figure not referenced: {name}")

for name in (
    "stress_decay_curve.png", "anxiety_severity_spectrum.png",
    "survival_probability_function.png", "pain_nrs_correlates.png",
    "water_requirements_scaling.png", "situation_a_tree.png",
):
    check(f"build/diagrams/{name}" not in source, f"deprecated figure referenced: {name}")

# The alternate integration must add real breadth rather than replace the mature guide.
for marker in (
    "OPQRST", "GAD-7 severity spectrum", "Situation G — No Safe Place",
    "Essential medication and powered-device failure", "IASC support pyramid",
    "Ostrom’s eight commons principles", "Stable references — addresses that survive editing",
    "Templates", "Boundary Setting From a Bathroom", "Emergency water",
):
    check(marker.lower() in source.lower(), f"subject breadth marker missing: {marker}")
check(len(source) >= 220_000, f"canonical source unexpectedly small: {len(source):,} chars")

# Source registry must resolve every chapter footnote.
source_inventory = ROOT / "src" / "data" / "source_inventory.json"
check(source_inventory.exists(), "source inventory missing")
if source_inventory.exists():
    inventory = json.loads(source_inventory.read_text(encoding="utf-8"))
    check(inventory.get("release") == VERSION, "source inventory version drifted")
    check(not inventory.get("unresolved_references"), "unresolved source references remain")
    check(len(inventory.get("footnote_sources", [])) >= 60, "source inventory too small")

# Built master artifacts must contain the current books and native math.
if HTML.exists():
    html = HTML.read_text(encoding="utf-8")
    html_titles = html.replace("&amp;", "&")
    check("<math" in html, "built HTML has no native MathML")
    check("cdn.jsdelivr" not in html and not re.search(r"<script[^>]+mathjax", html, re.I), "remote math dependency remains")
    check('<main id="guide">' in html, "semantic guide wrapper missing")
    check('class="chapter' in html, "chapter wrappers missing")
    check('class="revision-footer"' in html, "revision footer missing")
    check(VERSION in html, "built HTML version drifted")
    for title in books:
        check(title in html_titles, f"built HTML missing book: {title}")
    graphical_figures = len(re.findall(
        r'class="figure-reference resource-card"[^>]+data-interaction="read-only"',
        html,
    ))
    local_figures = len(re.findall(
        r'class="template-route-band resource-card"[^>]+data-resource-type="figure"[^>]+data-interaction="read-only"',
        html,
    ))
    writable_templates = len(re.findall(
        r'class="template-route-band resource-card"[^>]+data-resource-type="template"[^>]+data-interaction="write"',
        html,
    ))
    check(graphical_figures >= 41, f"built HTML has too few graphical figures: {graphical_figures}")
    check(local_figures == 8, f"built HTML has {local_figures} deployer-completed figures, expected 8")
    check(writable_templates == 10, f"built HTML has {writable_templates} templates, expected 10")
    check(
        re.search(r"<strong>Figure</strong><span>Read\s+only</span>", html) is not None,
        "built HTML missing Figure · Read only label",
    )
    check("<strong>Template</strong>" in html, "built HTML missing Template · Write label")
    check("<strong>Deployment plate</strong>" not in html, "obsolete deployment-plate type remains")
    for label, pattern in {
        "figure catalogue": r"Figure catalogue\s+—\s+read-only references",
        "template catalogue": r"Template catalogue\s+—\s+write when needed",
    }.items():
        check(re.search(pattern, html) is not None, f"built HTML missing {label}")
    check("Reader question:" not in html, "legacy figure dashboard label remains in built HTML")
    check("Paired forms:" not in html, "legacy paired-form dashboard label remains in built HTML")
else:
    errors.append("build/html/guide.html is missing")

package_path = ROOT / "package.json"
if package_path.exists():
    package = json.loads(package_path.read_text(encoding="utf-8"))
    for target in ("build:guide", "build:a4half", "build:largeprint"):
        command = package.get("scripts", {}).get(target, "")
        check("build:diagrams" in command, f"{target} does not refresh diagrams before rendering")
        check("build:inventories" in command, f"{target} does not refresh reference inventories before rendering")

if PDF.exists():
    info = pdf_info(PDF)
    check(int(info.get("Pages", "0") or 0) >= 40, "master PDF is suspiciously short")
    check("594" in info.get("Page size", "") and "841" in info.get("Page size", ""), "master PDF is not A4")
    check(info.get("Tagged") == "yes", "master PDF is not tagged")
else:
    errors.append("build/pdf/guide.pdf is missing")

for stem, width in (
    ("guide_a4half", "298"), ("guide_a4half_mono", "298"),
    ("guide_largeprint", "594"), ("guide_largeprint_mono", "594"),
):
    html_path = ROOT / "build" / "html" / f"{stem}.html"
    pdf_path = ROOT / "build" / "pdf" / f"{stem}.pdf"
    check(html_path.exists(), f"missing {stem}.html")
    check(pdf_path.exists(), f"missing {stem}.pdf")
    if pdf_path.exists():
        info = pdf_info(pdf_path)
        check(width in info.get("Page size", "") and "841" in info.get("Page size", ""), f"{stem}: wrong geometry")
        check(info.get("Tagged") == "yes", f"{stem}: PDF is not tagged")

required_scripts = (
    "bin/build_all.sh", "bin/build_guide.sh", "bin/chrome_pdf.mjs",
    "bin/validate_guide.py", "bin/validate_routes.py", "bin/validate_continuity.py",
    "bin/validate_subguides.py", "bin/validate_render_tooling.py",
    "bin/validate_visualizations.py", "bin/validate_illustrations.py",
    "bin/build_inventories.py", "bin/build_source_inventory.py",
    "bin/build_reference_index.py", "bin/build_coverage_matrix.py",
    "bin/build_subguides.py", "bin/build_site.py", "bin/build_release_manifest.py",
    "bin/validate_migration.py", "bin/validate_reference_index.py",
    "bin/validate_coverage_matrix.py", "bin/validate_site.py",
    "bin/validate_build_matrix.py", "bin/project_meta.py",
    "bin/verify_accessibility.py", "bin/verify_density.py",
    "bin/verify_layout.py", "bin/verify_overflow.mjs",
)
for relative in required_scripts:
    path = ROOT / relative
    check(path.exists(), f"required script missing: {relative}")
    if path.exists():
        check(bool(path.stat().st_mode & 0o111), f"required script not executable: {relative}")

if errors:
    print("Guide validation failed:")
    for error in errors:
        print(f"  - {error}")
    raise SystemExit(1)

print(
    f"Guide validation passed: {len(CHAPTERS)} chapters at {VERSION}, "
    f"{len(source):,} source chars, eleven adult-voice books, reviewed evidence, "
    "resolved sources, local assets, native MathML, and A4/A4-half/large-print outputs."
)
