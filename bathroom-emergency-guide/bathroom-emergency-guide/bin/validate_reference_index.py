#!/usr/bin/env python3
"""Validate stable reference immutability, coverage, and generated fragments."""
from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from pathlib import Path

from project_meta import VERSION

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
REGISTRY = DATA / "reference_ids.json"
INDEX = DATA / "content_index.json"
REF_RE = re.compile(r"^\[BEG:([OABCDHZPSTR]):([SFGCDW]):(\d{3})\]$")
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


result = subprocess.run(
    ["python3", str(ROOT / "bin/build_reference_index.py"), "--check"],
    cwd=ROOT,
    text=True,
    capture_output=True,
)
check(result.returncode == 0, (result.stderr or result.stdout).strip() or "reference generation check failed")
check(REGISTRY.exists(), "stable reference registry missing")
check(INDEX.exists(), "global content index missing")

if REGISTRY.exists() and INDEX.exists():
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    ids = registry.get("ids", {})
    records = index.get("records", [])
    active = {item.get("resource_key"): item.get("public_ref") for item in records}
    check(registry.get("release") == VERSION, "reference registry release drifted")
    check(index.get("release") == VERSION, "content index release drifted")
    check(len(records) >= 290, f"content index unexpectedly small: {len(records)}")
    check(len(active) == len(records), "duplicate active resource keys")
    check(len(set(ids.values())) == len(ids), "public reference IDs are not unique")
    for key, ref in ids.items():
        check(bool(REF_RE.match(ref)), f"{key}: malformed public reference {ref}")
    for key, ref in active.items():
        check(ids.get(key) == ref, f"{key}: active index and registry disagree")
    retired = set(registry.get("retired_resource_keys", []))
    check(retired == set(ids) - set(active), "retired reference-key set drifted")
    check(not (set(active) & retired), "retired reference key is active")
    # Retired IDs remain reserved. Editorial restructuring may retire many
    # headings at once; immutability matters more than preserving obsolete prose.
    check(all(key in ids for key in retired), "retired reference is no longer reserved")
    migrations = registry.get("resource_key_migrations", {})
    check(len(migrations) == 8, f"expected 8 form-to-figure reference migrations, found {len(migrations)}")
    record_by_key = {item.get("resource_key"): item for item in records}
    for old_key, new_key in migrations.items():
        check(old_key in retired, f"migrated key is not retired: {old_key}")
        check(new_key in active, f"migration target is not active: {new_key}")
        target = record_by_key.get(new_key, {})
        check(ids.get(old_key) in target.get("legacy_public_refs", []), f"{new_key}: legacy reference alias missing")
        check(bool(target.get("legacy_html_ids")), f"{new_key}: legacy HTML anchor missing")
    counts = Counter(item.get("kind") for item in records)
    for kind in ("S", "F", "G", "C", "D", "W"):
        check(counts[kind] > 0, f"reference kind {kind} has no records")
    html_ids = [item.get("html_id") for item in records]
    check(len(html_ids) == len(set(html_ids)), "generated HTML reference anchors collide")

    route_ids = {
        item["id"]
        for item in json.loads((DATA / "subguides.json").read_text(encoding="utf-8"))["nodes"]
    }
    figure_ids = {
        item["resource_key"].split(":", 1)[1]
        for item in records if item.get("kind") == "G"
    }
    service_keys = {
        item.get("service_key")
        for item in records if item.get("kind") == "C" and item.get("service_key")
    }
    templates = [item for item in records if item.get("kind") == "F"]
    figures = [item for item in records if item.get("kind") == "G"]
    local_figures = [item for item in figures if item.get("prepared_by") == "deployer"]
    check(len(templates) == 10, f"expected 10 canonical templates, found {len(templates)}")
    check(len(figures) == 49, f"expected 49 canonical figures, found {len(figures)}")
    check(len(local_figures) == 8, f"expected 8 deployer-completed figures, found {len(local_figures)}")

    for item in [*templates, *local_figures]:
        check(bool(item.get("routes")), f"{item['title']}: no related book identities")
        check(
            set(item.get("routes", [])) <= route_ids,
            f"{item['title']}: unknown book identity",
        )
        check(
            set(item.get("figure_ids", [])) <= figure_ids,
            f"{item['title']}: unknown related figure",
        )
        check(
            set(item.get("support_keys", [])) <= service_keys,
            f"{item['title']}: unknown support service",
        )
        for field in ("purpose", "description", "resource_type", "interaction", "responsibility", "privacy"):
            check(bool(item.get(field)), f"{item['title']}: missing {field}")

    for template in templates:
        check(template.get("resource_type") == "template", f"{template['title']}: not typed as template")
        check(template.get("interaction") == "write", f"{template['title']}: template is not writable")

    for figure in figures:
        for field in ("title", "description", "resource_type", "interaction", "public_ref"):
            check(bool(figure.get(field)), f"{figure.get('resource_key')}: missing {field}")
        check(figure.get("resource_type") == "figure", f"{figure['title']}: not typed as figure")
        check(figure.get("interaction") == "read-only", f"{figure['title']}: figure is not read-only")


for name in (
    "global-content-index.md",
    "diagram-index.md",
    "contact-index.md",
    "deployment-index.md",
    "glossary-index.md",
    "form-index.md",
    "template-index.md",
    "route-identity-index.md",
    "support-form-map.md",
):
    path = ROOT / "build/generated" / name
    check(path.exists(), f"generated reference fragment missing: {name}")
    if path.exists():
        if name != "route-identity-index.md":
            check("[BEG:" in path.read_text(encoding="utf-8"), f"{name}: no stable references")

for name, markers in {
    "diagram-index.md": ("Figure catalogue", "Figure · read", "stable reference", "short description"),
    "form-index.md": ("Template catalogue", "Template · write", "stable reference", "short description"),
    "template-index.md": ("Template catalogue", "Template · write", "stable reference", "short description"),
    "route-identity-index.md": ("code, colour, pattern, and glyph", "Deliberate boundary"),
    "support-form-map.md": ("Support handoff map", "Use this resource", "Related figures"),
}.items():
    path = ROOT / "build/generated" / name
    if path.exists():
        text = path.read_text(encoding="utf-8")
        for marker in markers:
            check(marker in text, f"{name}: missing cross-reference marker {marker}")

check(
    (ROOT / "build/generated/coverage-matrix.md").exists(),
    "generated coverage fragment missing: coverage-matrix.md",
)

if errors:
    raise SystemExit("Reference-index validation failed:\n- " + "\n- ".join(errors))

print(f"Reference-index validation passed: {len(records)} stable active resources across six typed kinds.")
