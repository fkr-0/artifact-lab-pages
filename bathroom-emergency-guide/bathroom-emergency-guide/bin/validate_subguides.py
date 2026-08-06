#!/usr/bin/env python3
"""Validate the current graph and released standalone identity contract."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "src" / "data" / "subguides.json"
SECTION_PATH = ROOT / "src" / "data" / "section_ownership.json"
STYLE_PATH = ROOT / "src" / "style-subguides.css"
PATTERN_DIR = ROOT / "build" / "subguides" / "assets" / "patterns"
DIAGRAM_DIR = ROOT / "build" / "diagrams"
HUB_PATH = ROOT / "build" / "subguides" / "index.html"
from project_meta import VERSION
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


check(PATH.exists(), "subguide manifest missing")
check(SECTION_PATH.exists(), "section ownership inventory missing")
check(STYLE_PATH.exists(), "subguide identity stylesheet missing")

if PATH.exists():
    data = json.loads(PATH.read_text(encoding="utf-8"))
    nodes = data.get("nodes", [])
    expected = {"O", "A", "B", "C", "D", "H", "Z", "P", "S", "T", "R"}
    ids = [item.get("id") for item in nodes]
    check(data.get("release") == VERSION, f"subguide release is not {VERSION}")
    check(
        data.get("status") == "experimental-eleven-book-synthesis",
        "experimental eleven-book status marker missing",
    )
    check(data.get("identity_frozen_on") == "2026-08-06", "identity freeze date missing")
    check(
        set(data.get("standalone_nodes", [])) == {"O", "A", "B", "C", "D", "H", "Z", "P", "S", "T", "R"},
        "eleven-book standalone release set drifted",
    )
    check(
        data.get("master_emergency_gate") == "once-on-master-cover",
        "master emergency-gate rule drifted",
    )
    check(
        data.get("standalone_emergency_gate") == "once-on-cover",
        "standalone cover emergency-gate rule drifted",
    )
    check(
        data.get("source_strategy") == "generated-filtered-sources-and-limits",
        "generated source strategy missing",
    )
    check(len(nodes) == 11, f"expected 11 books, found {len(nodes)}")
    check(set(ids) == expected, f"core node IDs drifted: {ids}")
    check(len(ids) == len(set(ids)), "duplicate subguide IDs")

    patterns: set[str] = set()
    slugs: set[str] = set()
    colours: set[str] = set()
    glyphs: set[str] = set()
    chapter_owners: dict[str, list[str]] = {}
    by_id = {item["id"]: item for item in nodes}
    for item in nodes:
        node_id = item.get("id", "?")
        for field in (
            "slug", "title", "promise", "reviewed_on", "colour", "pattern",
            "glyph", "chapters", "sections", "incoming", "outgoing", "questions",
            "aliases", "scope", "outside_scope",
        ):
            check(bool(item.get(field)), f"{node_id}: missing {field}")
        check(item.get("reviewed_on") == "2026-08-06", f"{node_id}: review date drifted")
        pattern = item.get("pattern")
        check(pattern not in patterns, f"{node_id}: duplicate pattern {pattern}")
        patterns.add(pattern)
        check(item.get("slug") not in slugs, f"{node_id}: duplicate slug")
        slugs.add(item.get("slug"))
        check(item.get("colour") not in colours, f"{node_id}: duplicate colour")
        colours.add(item.get("colour"))
        check(item.get("glyph") not in glyphs, f"{node_id}: duplicate glyph")
        glyphs.add(item.get("glyph"))
        colour = item.get("colour", "")
        check(len(colour) == 7 and colour.startswith("#"), f"{node_id}: invalid colour token")
        for edge in item.get("incoming", []) + item.get("outgoing", []):
            check(edge in expected and edge != node_id, f"{node_id}: invalid graph edge {edge}")
        check(
            len(item.get("incoming", [])) == len(set(item.get("incoming", []))),
            f"{node_id}: duplicate incoming edge",
        )
        check(
            len(item.get("outgoing", [])) == len(set(item.get("outgoing", []))),
            f"{node_id}: duplicate outgoing edge",
        )
        for target in item.get("outgoing", []):
            if target in by_id:
                check(
                    node_id in by_id[target].get("incoming", []),
                    f"{node_id}->{target}: outgoing edge lacks reciprocal incoming declaration",
                )
        for chapter in item.get("chapters", []):
            chapter_path = ROOT / "src" / "chapters" / chapter
            check(chapter_path.exists(), f"{node_id}: missing canonical chapter {chapter}")
            chapter_owners.setdefault(chapter, []).append(node_id)

    canonical = {path.name for path in (ROOT / "src" / "chapters").glob("*.md")}
    check(
        set(chapter_owners) == canonical,
        f"manifest chapter coverage differs: owned={sorted(chapter_owners)} canonical={sorted(canonical)}",
    )
    check(
        set(chapter_owners.get("03-situations-b-g.md", [])) == {"B", "C", "D", "H"},
        "mixed-situations section ownership drifted",
    )

    if SECTION_PATH.exists():
        section_data = json.loads(SECTION_PATH.read_text(encoding="utf-8"))
        section_records = section_data.get("sections", [])
        check(section_data.get("release") == VERSION, "section ownership release drifted")
        check(len(section_records) >= 200, f"section ownership inventory too small: {len(section_records)}")
        check(
            all(item.get("owner") in expected for item in section_records),
            "section ownership contains unknown node",
        )

    if STYLE_PATH.exists():
        style = STYLE_PATH.read_text(encoding="utf-8")
        for item in nodes:
            check(
                f'[data-subguide="{item["id"]}"]' in style,
                f'{item["id"]}: missing CSS identity selector',
            )
            check(
                item["pattern"] in style,
                f'{item["id"]}: pattern name absent from identity stylesheet',
            )
        for marker in (
            "--sg-pattern", "subguide-pattern-swatch", "data-print-layout",
            "a4half", "largeprint", "route-chip", "template-route-band",
            "figure-reference", "subguide-scope-grid", "edition-resource-map",
        ):
            check(marker in style, f"subguide CSS marker missing: {marker}")

    pattern_files = [
        PATTERN_DIR / f'{item["id"]}-{item["pattern"]}.svg' for item in nodes
    ]
    for path in pattern_files:
        check(path.exists(), f"pattern prototype missing: {path.relative_to(ROOT)}")
        if path.exists():
            svg = path.read_text(encoding="utf-8")
            check('role="img"' in svg and "<title" in svg, f"{path.name}: accessible SVG metadata missing")
    hashes = {
        hashlib.sha256(path.read_bytes()).hexdigest()
        for path in pattern_files if path.exists()
    }
    check(len(hashes) == 11, "pattern prototype files are not visually/file-distinct")

    for name in (
        "subguide_graph_overview.png",
        "subguide_identity_contact_sheet.png",
        "subguide_grouping_comparison.png",
    ):
        base = ROOT / "build" / ("diagrams" if name == "subguide_graph_overview.png" else "qa/subguides") / name
        check(base.exists(), f"subguide review artifact missing: {base.relative_to(ROOT)}")
    for node_id in expected:
        check(
            (DIAGRAM_DIR / f"subguide_graph_{node_id}.png").exists(),
            f"{node_id}: local graph figure missing",
        )
    check(HUB_PATH.exists(), "accessible graph hub HTML missing")
    check(
        not list((ROOT / "build" / "subguides" / "T").glob("templates-blue-book*")),
        "obsolete templates-blue-book output aliases remain after clean build",
    )

if errors:
    raise SystemExit("Subguide validation failed:\n- " + "\n- ".join(errors))

print(
    "Subguide validation passed: 11 code/pattern/glyph book identities, "
    "reciprocal graph declarations, generated hub/local maps, print-safe pattern "
    f"prototypes, and the complete eleven-book standalone shelf at {VERSION}."
)
