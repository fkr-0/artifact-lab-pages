#!/usr/bin/env python3
"""Validate generated cross-guide source and visual coverage."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

from project_meta import VERSION

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "src" / "data" / "coverage_matrix.json"
FRAGMENT = ROOT / "build" / "generated" / "coverage-matrix.md"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


result = subprocess.run(
    ["python3", str(ROOT / "bin" / "build_coverage_matrix.py"), "--check"],
    cwd=ROOT,
    text=True,
    capture_output=True,
)
check(result.returncode == 0, (result.stderr or result.stdout).strip() or "coverage generation check failed")
check(PATH.exists(), "coverage matrix missing")
check(FRAGMENT.exists(), "coverage matrix reference fragment missing")

if PATH.exists():
    data = json.loads(PATH.read_text(encoding="utf-8"))
    nodes = data.get("nodes", [])
    by_id = {item.get("node"): item for item in nodes}
    check(data.get("release") == VERSION, "coverage matrix release drifted")
    check(data.get("status") == "canonical-cross-guide-coverage-matrix", "coverage status marker missing")
    check(set(by_id) == {"O", "A", "B", "C", "D", "H", "Z", "P", "S", "T", "R"}, "coverage node set drifted")
    check(len(nodes) == 11, f"expected eleven coverage rows, found {len(nodes)}")
    totals = data.get("totals", {})
    check(totals.get("nodes") == 11, "coverage total node count drifted")
    check(totals.get("sections", 0) >= 220, "coverage matrix has too few sections")
    check(totals.get("sources", 0) >= 60, "coverage matrix has too few sources")
    check(totals.get("reader_visuals", 0) >= 41, "coverage matrix has too few reader visuals")
    for item in nodes:
        node = item.get("node", "?")
        check(item.get("section_count", 0) > 0, f"{node}: no owned sections")
        check(item.get("chapter_count") == len(item.get("chapters", [])), f"{node}: chapter count mismatch")
        check(item.get("source_count") == len(item.get("source_ids", [])), f"{node}: source count mismatch")
        check(item.get("owned_visual_count") == len(item.get("visual_ids", [])), f"{node}: visual count mismatch")
        check(item.get("shared_visual_count") == len(item.get("shared_visual_ids", [])), f"{node}: shared visual count mismatch")
        check(
            item.get("visuals_with_source_basis") == item.get("owned_visual_count"),
            f"{node}: one or more reader visuals lack source basis",
        )
        if item.get("standalone"):
            check(item.get("readiness") == "released-standalone", f"{node}: released node not marked released")
    check(by_id.get("C", {}).get("readiness") in {"standalone-candidate", "released-standalone"}, "C is no longer ready for standalone review")
    check(by_id.get("A", {}).get("source_count", 0) >= 5, "A lacks five local sources")
    check(by_id.get("A", {}).get("owned_visual_count", 0) >= 5, "A lacks five owned reader visuals")
    check(by_id.get("A", {}).get("readiness") == "released-standalone", "A is not marked as a released standalone")
    check(by_id.get("P", {}).get("source_count", 0) >= 4, "P lacks the operational source base needed for visual work")
    check(by_id.get("S", {}).get("source_count", 0) >= 4, "S lacks a source base")
    check(by_id.get("S", {}).get("readiness") == "released-standalone", "S is not released")
    check(by_id.get("O", {}).get("owned_visual_count", 0) >= 4, "O lacks four owned reader visuals")
    check(by_id.get("O", {}).get("readiness") == "released-standalone", "O is not marked as a released standalone")
    check(by_id.get("D", {}).get("owned_visual_count", 0) >= 4, "D lacks four owned reader visuals")
    check(by_id.get("D", {}).get("readiness") == "released-standalone", "D is not marked as a released standalone")
    check(by_id.get("Z", {}).get("source_count", 0) >= 4, "Z lacks four local sources")
    check(by_id.get("Z", {}).get("owned_visual_count", 0) >= 7, "Z lacks seven owned reader visuals")
    check(by_id.get("Z", {}).get("readiness") == "released-standalone", "Z is not marked as a released standalone")

if FRAGMENT.exists():
    text = FRAGMENT.read_text(encoding="utf-8")
    for marker in ("Source, visual, and standalone coverage matrix", "Per-guide provenance", "O — The Green Book", "A — The Amber Book", "D — The Blue Book", "C — The Red Book", "Z — The Olive Book", "P — The Indigo Book", "S — The Purple Book"):
        check(marker in text, f"coverage fragment missing marker: {marker}")

if errors:
    raise SystemExit("Coverage validation failed:\n- " + "\n- ".join(errors))
print(f"Coverage validation passed: eleven books with current source, section, visual, and release provenance at {VERSION}.")
