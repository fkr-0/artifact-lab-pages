#!/usr/bin/env python3
"""Validate deterministic, warning-free offline chart rendering."""
from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src" / "data" / "visualization_catalog.json"
RENDERER = ROOT / "bin" / "build_visualizations.mjs"
DIAGRAM_DIR = ROOT / "src" / "diagrams"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


catalog = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else {}
fontconfig_relative = catalog.get("renderer", {}).get("fontconfig")
check(bool(fontconfig_relative), "visualization catalog lacks renderer.fontconfig")
FONTCONFIG = ROOT / fontconfig_relative if fontconfig_relative else ROOT / "missing-fontconfig.conf"
check(FONTCONFIG.exists(), "project-local Fontconfig profile missing")
if FONTCONFIG.exists():
    try:
        root = ET.parse(FONTCONFIG).getroot()
        check(root.tag == "fontconfig", "Fontconfig profile has the wrong root element")
        text = FONTCONFIG.read_text(encoding="utf-8")
        for family in ("DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono"):
            check(family in text, f"Fontconfig profile lacks {family} fallback")
    except ET.ParseError as exc:
        errors.append(f"Fontconfig profile is not valid XML: {exc}")

black_weight = re.compile(r"fontweight\s*=\s*['\"]black['\"]")
for path in sorted(DIAGRAM_DIR.glob("*.py")):
    check(not black_weight.search(path.read_text(encoding="utf-8")), f"unsupported black font weight remains in {path.relative_to(ROOT)}")

if CATALOG.exists() and RENDERER.exists() and not errors:
    expected = {Path(item["png"]).name for item in catalog.get("visualizations", [])}
    expected |= {Path(item["svg"]).name for item in catalog.get("visualizations", [])}
    with tempfile.TemporaryDirectory(prefix="beg-render-smoke-") as directory:
        environment = os.environ.copy()
        environment.pop("FONTCONFIG_FILE", None)
        result = subprocess.run(
            ["node", str(RENDERER), directory],
            cwd=ROOT,
            env=environment,
            text=True,
            capture_output=True,
        )
        check(result.returncode == 0, (result.stderr or result.stdout).strip() or "offline chart smoke render failed")
        check(not result.stderr.strip(), f"offline chart smoke render emitted stderr: {result.stderr.strip()}")
        produced = {path.name for path in Path(directory).iterdir() if path.is_file()}
        check(produced == expected, f"offline chart smoke output drifted: missing={sorted(expected - produced)}, extra={sorted(produced - expected)}")

if errors:
    raise SystemExit("Render-tooling validation failed:\n- " + "\n- ".join(errors))
print("Render-tooling validation passed: supported diagram weights and warning-free project-local Fontconfig rendering.")
