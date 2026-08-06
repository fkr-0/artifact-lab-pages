#!/usr/bin/env python3
"""Validate the non-Vega illustration inventory and chapter coverage."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "src" / "data" / "illustration_catalog.json"
CHAPTER_DIR = ROOT / "src" / "chapters"
from project_meta import VERSION
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


check(CATALOG_PATH.exists(), "illustration catalog missing")
if CATALOG_PATH.exists():
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    records = catalog.get("illustrations", [])
    allowed_families = set(catalog.get("families", []))
    ids = [item.get("id") for item in records]
    files = [item.get("file") for item in records]

    check(catalog.get("release") == VERSION, f"illustration catalog release is not {VERSION}")
    check(len(records) == 36, f"expected 33 current plus three migrated illustration records, found {len(records)}")
    check(len(ids) == len(set(ids)), "duplicate illustration IDs")
    check(len(files) == len(set(files)), "duplicate illustration files")

    for item in records:
        item_id = item.get("id", "?")
        for field in (
            "file", "chapters", "family", "question", "renderer",
            "text_fallback", "mono_strategy", "status", "next_action", "priority",
            "owner", "sources",
        ):
            check(bool(item.get(field)), f"{item_id}: missing {field}")
        check(item.get("family") in allowed_families, f"{item_id}: unknown family")
        check(item.get("owner") in {"O","A","B","C","D","H","Z","P","R"}, f"{item_id}: invalid owner")
        check(all(node in {"O","A","B","C","D","H","Z","P","R"} for node in item.get("secondary_subguides", [])), f"{item_id}: invalid secondary subguide")
        check(item.get("priority") in {"low", "medium", "high"}, f"{item_id}: invalid priority")
        check(len(item.get("mono_strategy", [])) >= 2, f"{item_id}: insufficient monochrome strategy")
        reader_facing = item.get("reader_facing", True)
        figure_path = ROOT / item.get("file", "missing")
        if reader_facing:
            check(figure_path.exists(), f"{item_id}: generated figure missing: {item.get('file')}")
        for chapter in item.get("chapters", []):
            chapter_path = CHAPTER_DIR / chapter
            check(chapter_path.exists(), f"{item_id}: unknown chapter {chapter}")
            if reader_facing and chapter_path.exists():
                check(Path(item["file"]).name in chapter_path.read_text(encoding="utf-8"), f"{item_id}: figure not referenced by declared chapter {chapter}")

    referenced: set[str] = set()
    for chapter_path in CHAPTER_DIR.glob("*.md"):
        text = chapter_path.read_text(encoding="utf-8")
        for match in re.finditer(r"!\[[^\]]*\]\((build/diagrams/[^)]+)\)", text):
            file = match.group(1)
            if "vega_" not in file:
                referenced.add(file)
    cataloged = {item["file"] for item in records if item.get("reader_facing", True)}
    check(referenced == cataloged, f"illustration coverage drift: missing={sorted(referenced - cataloged)}, unused={sorted(cataloged - referenced)}")
    current = [item for item in records if item.get("reader_facing", True)]
    migrated = [item for item in records if not item.get("reader_facing", True)]
    check(len(current) == 33, f"expected 33 current non-Vega figures after three Vega migrations, found {len(current)}")
    check(len(migrated) == 3, f"expected three migrated illustration records, found {len(migrated)}")
    check(all(item.get("replacement_id") for item in migrated), "migrated illustration lacks replacement_id")
    check(sum(1 for item in current if item.get("priority") == "high") >= 7, "illustration inventory lacks a meaningful high-priority redesign queue")
    current_ids = {item["id"] for item in current}
    required_new = {
        "observatory-scan",
        "interoception-loop",
        "signal-story-question",
        "three-minute-observation",
        "safe-place-confirmation-packet",
        "safe-reserve-clock",
        "responsibility-clock-map",
        "repair-sequence",
        "consent-authority-boundary",
        "care-continuity-loop",
    }
    check(required_new <= current_ids, f"new O/A/D illustration set incomplete: {sorted(required_new - current_ids)}")
    owner_counts = {
        owner: sum(1 for item in current if item.get("owner") == owner)
        for owner in {"O", "A", "D", "Z"}
    }
    check(owner_counts["A"] >= 4, "A lacks the four new operational reader visuals")
    check(owner_counts["O"] >= 4, "O lacks the four owned reader visuals required for candidate review")
    check(owner_counts["D"] >= 4, "D lacks the four owned reader visuals required for candidate review")
    check(owner_counts["Z"] >= 3, "Z lacks its current non-Vega operational visual set")

if errors:
    raise SystemExit("Illustration validation failed:\n- " + "\n- ".join(errors))
print(f"Illustration validation passed: {len(current)} current non-Vega figures plus {len(migrated)} migrated audit records, including released O, A, D, and Z visual slices, at {VERSION}.")
