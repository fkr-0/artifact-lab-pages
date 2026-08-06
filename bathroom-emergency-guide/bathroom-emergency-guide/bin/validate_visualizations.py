#!/usr/bin/env python3
"""Validate Vega-Lite catalog, provenance, derived data, outputs, and reader references."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "src" / "data" / "visualization_catalog.json"
EVIDENCE_PATH = ROOT / "src" / "data" / "evidence_facts.json"
ROUTES_PATH = ROOT / "src" / "data" / "route_catalog.json"
SUBGUIDES_PATH = ROOT / "src" / "data" / "subguides.json"
THEME_PATH = ROOT / "src" / "visualizations" / "theme.json"
DESIGN_SYSTEM_PATH = ROOT / "docs" / "plans" / "visual-design-system.md"
HTML_PATH = ROOT / "build" / "html" / "guide.html"
from project_meta import VERSION
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def relative_luminance(hex_color: str) -> float:
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(first: str, second: str = "#ffffff") -> float:
    high, low = sorted((relative_luminance(first), relative_luminance(second)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def iter_encodings(node: object):
    if isinstance(node, dict):
        for key in ("x", "y"):
            encoding = node.get(key)
            if isinstance(encoding, dict) and encoding.get("type") == "quantitative":
                yield key, encoding
        for value in node.values():
            yield from iter_encodings(value)
    elif isinstance(node, list):
        for value in node:
            yield from iter_encodings(value)


def iter_color_ranges(node: object):
    if isinstance(node, dict):
        scale = node.get("scale")
        if isinstance(scale, dict) and isinstance(scale.get("range"), list):
            for value in scale["range"]:
                if isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", value):
                    yield value
        for value in node.values():
            yield from iter_color_ranges(value)
    elif isinstance(node, list):
        for value in node:
            yield from iter_color_ranges(value)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


for path, label in ((CATALOG_PATH, "visualization catalog"), (EVIDENCE_PATH, "evidence registry"), (ROUTES_PATH, "route registry"), (SUBGUIDES_PATH, "subguide manifest"), (THEME_PATH, "shared Vega-Lite theme"), (DESIGN_SYSTEM_PATH, "visual design system")):
    check(path.exists(), f"{label} missing")

if not errors:
    catalog = load(CATALOG_PATH)
    evidence = load(EVIDENCE_PATH)["facts"]
    route_sources = set(load(ROUTES_PATH)["source_registry"])
    subguide_ids = {item["id"] for item in load(SUBGUIDES_PATH)["nodes"]}
    internal_sources = {"math-pairwise-channels", "continuity-catalog"}
    valid_sources = set(evidence) | route_sources | internal_sources
    items = catalog.get("visualizations", [])
    ids = [item.get("id") for item in items]
    check(catalog.get("release") == VERSION, f"catalog release is not {VERSION}")
    check(catalog.get("renderer", {}).get("offline") is True, "offline renderer contract missing")
    check(catalog.get("renderer", {}).get("canonical") == "SVG", "SVG is not canonical output")
    check(catalog.get("renderer", {}).get("theme") == "src/visualizations/theme.json", "shared Vega-Lite theme contract missing")
    check(catalog.get("renderer", {}).get("fontconfig") == "src/visualizations/fontconfig.conf", "project-local Fontconfig contract missing")
    check(catalog.get("renderer", {}).get("title_owner") == "document", "document-owned chart title contract missing")
    check(catalog.get("renderer", {}).get("svg_accessibility_metadata") is True, "SVG accessibility metadata contract missing")
    check(len(items) >= 8, f"expected at least eight Vega-Lite figures, found {len(items)}")
    check(len(ids) == len(set(ids)), "duplicate visualization IDs")

    chapter_source = "\n".join(path.read_text(encoding="utf-8") for path in sorted((ROOT / "src" / "chapters").glob("*.md")))
    for item in items:
        item_id = item.get("id", "?")
        for field in ("title", "subguides", "family", "question", "takeaway", "data", "spec", "svg", "png", "sources", "evidence_class", "denominator_scope", "uncertainty_policy", "limit", "alt", "long_description", "table_fallback", "mono_encoding", "reviewed_on"):
            check(bool(item.get(field)), f"{item_id}: missing {field}")
        check(set(item.get("subguides", [])) <= subguide_ids, f"{item_id}: unknown subguide")
        check(set(item.get("sources", [])) <= valid_sources, f"{item_id}: unknown source ID")
        check(len(item.get("alt", "")) >= 80, f"{item_id}: alt text too short")
        check(len(item.get("long_description", "")) >= 180, f"{item_id}: long description too short")
        check(len(item.get("mono_encoding", [])) >= 2, f"{item_id}: needs at least two non-colour encodings")
        for key in ("data", "spec", "svg", "png", "table_fallback"):
            path = ROOT / item.get(key, "missing")
            check(path.exists(), f"{item_id}: missing {key} file {path.relative_to(ROOT) if path.is_absolute() else path}")
        if (ROOT / item.get("spec", "missing")).exists():
            spec = load(ROOT / item["spec"])
            check("vega-lite" in spec.get("$schema", ""), f"{item_id}: spec is not Vega-Lite")
            check(spec.get("data", {}).get("name") == "table", f"{item_id}: spec must use injected reviewed table")
            check("title" not in spec, f"{item_id}: chart title must be owned by the document, not baked into the spec")
            check("config" not in spec, f"{item_id}: local config duplicates the shared Vega-Lite theme")
            for channel, encoding in iter_encodings(spec):
                axis = encoding.get("axis")
                if axis is None:
                    continue
                if isinstance(axis, dict):
                    values = axis.get("values")
                    tick_count = axis.get("tickCount")
                    check(
                        (isinstance(values, list) and 2 <= len(values) <= 8)
                        or (isinstance(tick_count, (int, float)) and tick_count <= 8),
                        f"{item_id}: quantitative {channel}-axis needs 2–8 intentional major ticks",
                    )
            for color in iter_color_ranges(spec):
                check(contrast_ratio(color) >= 3.0, f"{item_id}: essential mark color {color} is below 3:1 against white")
            serialized = json.dumps(spec)
            check("http://" not in serialized and "url\"" not in serialized, f"{item_id}: network data dependency in spec")
            check("3d" not in serialized.lower(), f"{item_id}: forbidden 3D chart marker")
        if item.get("reader_facing"):
            macro = f"{{{{visualization:{item_id}}}}}"
            check(macro in chapter_source, f"{item_id}: reader-facing catalog macro not referenced by chapters")
            svg_path = ROOT / item["svg"]
            if svg_path.exists():
                svg = svg_path.read_text(encoding="utf-8")
                check('role="img"' in svg, f"{item_id}: SVG lacks image role")
                check(f'id="{item_id}-title"' in svg, f"{item_id}: SVG title metadata missing")
                check(f'id="{item_id}-desc"' in svg, f"{item_id}: SVG description metadata missing")
                font_sizes = [float(value) for value in re.findall(r'font-size="([0-9.]+)px"', svg)]
                check(bool(font_sizes), f"{item_id}: rendered SVG contains no measurable text")
                if font_sizes:
                    check(min(font_sizes) >= 11, f"{item_id}: rendered SVG text falls below 11 px")

    expected_ids = {
        "vega-gad7-accuracy", "vega-household-water-stock", "vega-social-connection",
        "vega-communication-channels", "vega-continuity-dependencies",
        "vega-stroke-time-model", "vega-sleep-study-design",
        "vega-reproductive-denominators",
    }
    check(expected_ids <= set(ids), f"Vega batch incomplete: {sorted(expected_ids - set(ids))}")
    # Ensure migrated charts actually retired their old raster generators.
    old_names = {
        "gad7_validation_comparison.png", "household_water_planner.png",
        "social_connection_associations.png", "stroke_time_model.png",
        "sleep_restriction_study.png", "reproductive_health_denominators.png",
    }
    check(
        not any(f"](build/diagrams/{name})" in chapter_source for name in old_names),
        "superseded matplotlib chart remains referenced",
    )

    theme = load(THEME_PATH)
    check(theme.get("background") is None, "shared chart theme should inherit the document background")
    check(theme.get("view", {}).get("stroke") is None, "shared chart theme should not add a decorative frame")
    check(theme.get("axis", {}).get("domain") is False, "shared chart theme should suppress redundant axis domains")
    for color_path in (("axis", "labelColor"), ("axis", "titleColor"), ("text", "color")):
        color = theme.get(color_path[0], {}).get(color_path[1])
        check(isinstance(color, str) and contrast_ratio(color) >= 4.5, f"shared theme text color {color_path} is below 4.5:1")

    design_system = DESIGN_SYSTEM_PATH.read_text(encoding="utf-8")
    for marker in (
        "Why Vega-Lite",
        "Renderer decision matrix",
        "Quantitative-chart contract",
        "Illustration contract",
        "Page composition",
        "document** owns",
        "Vega-Lite specification** owns",
    ):
        check(marker.lower() in design_system.lower(), f"visual design system marker missing: {marker}")

    if HTML_PATH.exists():
        html = HTML_PATH.read_text(encoding="utf-8")
        reader_count = sum(1 for item in items if item.get("reader_facing"))
        check(html.count('class="quantitative-figure"') == reader_count, "built HTML quantitative-figure count does not match catalog")
        check(html.count('class="chart-note"') == reader_count, "built HTML chart-note count does not match catalog")

if errors:
    raise SystemExit("Visualization validation failed:\n- " + "\n- ".join(errors))
print(f"Visualization validation passed: {len(items)} offline Vega-Lite figures with provenance, limits, text/table fallbacks, intentional ticks, contrast, and non-colour encodings at {VERSION}.")
