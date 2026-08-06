#!/usr/bin/env python3
"""Validate that every supported guide family, layout, mode, and format exists."""
from __future__ import annotations

import json
from pathlib import Path

from project_meta import VERSION

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def need(path: str) -> None:
    target = ROOT / path
    check(target.exists() and target.stat().st_size > 0, f"missing or empty artifact: {path}")


for stem in (
    "guide",
    "guide_mono",
    "guide_a4half",
    "guide_a4half_mono",
    "guide_largeprint",
    "guide_largeprint_mono",
):
    need(f"build/html/{stem}.html")
    need(f"build/pdf/{stem}.pdf")

for path in (
    "build/md/guide.md",
    "build/docx/guide.docx",
    "build/latex/guide.tex",
    "build/subguides/index.html",
    "build/subguides/manifest.json",
    "build/site/index.html",
    "build/site/deploy/index.html",
    "build/site/downloads/index.html",
    "build/site/404.html",
    "build/site/assets/site.css",
    "build/site/assets/site.js",
    "build/site/guide/index.html",
    "build/site/routes/index.html",
    "build/site/meta/release.json",
    "build/release/manifest.json",
):
    need(path)

manifest_path = ROOT / "src/data/subguides.json"
check(manifest_path.exists(), "subguide source manifest missing")
if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    released = manifest.get("standalone_nodes", [])
    by_id = {item["id"]: item for item in manifest.get("nodes", [])}
    check(
        set(released) == {"O", "A", "B", "C", "D", "H", "Z", "P", "S", "T", "R"},
        "released standalone set drifted",
    )
    for node_id in released:
        node = by_id[node_id]
        for layout in ("a4", "a4half", "largeprint"):
            for mono in (False, True):
                parts = [node["slug"]]
                if layout != "a4":
                    parts.append(layout)
                if mono:
                    parts.append("mono")
                stem = "_".join(parts)
                for suffix in ("md", "html", "pdf"):
                    need(f"build/subguides/{node_id}/{stem}.{suffix}")
        need(f"build/subguides/{node_id}/manifest.json")

release_path = BUILD / "release/manifest.json"
if release_path.exists():
    release = json.loads(release_path.read_text(encoding="utf-8"))
    check(release.get("release") == VERSION, "release-manifest version drifted")
    check(release.get("deployment_performed") is False, "local build falsely claims deployment")
    check(release.get("publish_performed") is False, "local build falsely claims publication")
    check(len(release.get("artifacts", [])) >= 90, "release manifest does not cover the complete matrix")

if errors:
    raise SystemExit("Build-matrix validation failed:\n- " + "\n- ".join(errors))
print("Build-matrix validation passed: six master editions, editable formats, landing, release manifest, and 66 standalone eleven-book editions are present.")
