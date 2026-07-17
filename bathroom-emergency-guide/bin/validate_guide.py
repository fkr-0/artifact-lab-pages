#!/usr/bin/env python3
"""Structural and safety regression checks for the guide."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHAPTERS = sorted((ROOT / "src" / "chapters").glob("*.md"))
STYLE = (ROOT / "src" / "style.css").read_text(encoding="utf-8")
HTML = ROOT / "build" / "html" / "guide.html"
PDF = ROOT / "build" / "pdf" / "guide.pdf"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


check(len(CHAPTERS) == 11, f"expected 11 chapters, found {len(CHAPTERS)}")
source = "\n".join(path.read_text(encoding="utf-8") for path in CHAPTERS)
check("Call 110. Now." not in source, "medical path still routes to police 110")
check("pain_nrs_correlates" not in source, "pain score still claims physiological correlates")
check("C(t) = C_0" not in source and "C(t)=C_0" not in source, "legacy cortisol-decay formula remains")
check("2 drops of unscented household bleach" not in source, "unsafe concentration-free bleach recipe remains")
check("starvation is preferable to poisoning" not in source.lower(), "unsafe foraging rhetoric remains")
check("112" in source and "116 117" in source and "116 123" in source, "core German help numbers missing")
check("column-count: 1 !important" in STYLE, "single-column print invariant missing")
check("columns: auto !important" in STYLE, "print column reset missing")

for path in CHAPTERS:
    text = path.read_text(encoding="utf-8")
    check(text.startswith("---\n"), f"{path.name}: missing YAML frontmatter")
    check(re.search(r"revision:\s*[\"']4\.0\.0[\"']", text) is not None, f"{path.name}: revision is not 4.0.0")

if HTML.exists():
    html = HTML.read_text(encoding="utf-8")
    check("<math" in html, "built HTML has no native MathML")
    check("cdn.jsdelivr" not in html and re.search(r"<script[^>]+mathjax", html, re.IGNORECASE) is None, "built HTML has a remote math dependency")
    check("<main id=\"guide\">" in html, "semantic guide wrapper missing")
    check("class=\"chapter" in html, "chapter wrappers missing")
else:
    errors.append("build/html/guide.html is missing")

if PDF.exists():
    result = subprocess.run(["pdfinfo", str(PDF)], capture_output=True, text=True)
    check(result.returncode == 0, "pdfinfo could not read guide.pdf")
    if result.returncode == 0:
        match = re.search(r"Pages:\s+(\d+)", result.stdout)
        check(bool(match and int(match.group(1)) >= 12), "PDF is suspiciously short")
        check("A4" in result.stdout or "595" in result.stdout, "PDF does not appear to be A4")
else:
    errors.append("build/pdf/guide.pdf is missing")

for markdown_path in re.findall(r"\]\((?:build/)?(diagrams/[^)]+)\)", source):
    image = ROOT / "build" / markdown_path
    check(image.exists(), f"referenced image missing: {image.relative_to(ROOT)}")

if errors:
    print("Guide validation failed:")
    for error in errors:
        print(f"  - {error}")
    raise SystemExit(1)

print(f"Guide validation passed: {len(CHAPTERS)} chapters, native MathML, A4 PDF, one-column print.")
