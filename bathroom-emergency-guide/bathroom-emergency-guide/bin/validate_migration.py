#!/usr/bin/env python3
"""Validate the eleven-book extraction, provenance, and edition matrix."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

from project_meta import VERSION

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
BUILD = ROOT / "build" / "subguides"
EXPECTED = {"O", "A", "B", "C", "D", "H", "Z", "P", "S", "T", "R"}
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def run_check(script: str) -> None:
    result = subprocess.run(
        ["python3", str(ROOT / "bin" / script), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    check(
        result.returncode == 0,
        (result.stderr or result.stdout).strip() or f"{script} --check failed",
    )


class MainText(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_main = False
        self.skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "main":
            self.in_main = True
        if self.in_main and tag in {"script", "style", "nav"}:
            self.skip += 1

    def handle_endtag(self, tag: str) -> None:
        if self.in_main and tag in {"script", "style", "nav"} and self.skip:
            self.skip -= 1
        if tag == "main":
            self.in_main = False

    def handle_data(self, data: str) -> None:
        if self.in_main and not self.skip:
            self.parts.append(data)


def semantic_text(path: Path) -> str:
    parser = MainText()
    parser.feed(path.read_text(encoding="utf-8"))
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()


def pdf_info(path: Path) -> dict[str, str]:
    result = subprocess.run(
        ["pdfinfo", str(path)], cwd=ROOT, text=True, capture_output=True
    )
    if result.returncode:
        return {}
    info: dict[str, str] = {}
    for line in result.stdout.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            info[key.strip()] = value.strip()
    return info


run_check("build_inventories.py")
run_check("build_source_inventory.py")
run_check("build_reference_index.py")
run_check("build_coverage_matrix.py")

section_path = DATA / "section_ownership.json"
figure_path = DATA / "figure_inventory.json"
source_path = DATA / "source_inventory.json"
manifest_path = DATA / "subguides.json"
for path in (section_path, figure_path, source_path, manifest_path):
    check(path.exists(), f"missing {path.relative_to(ROOT)}")

if section_path.exists():
    data = json.loads(section_path.read_text(encoding="utf-8"))
    records = data.get("sections", [])
    keys = [item.get("key") for item in records]
    check(data.get("release") == VERSION, "section inventory version drifted")
    check(len(records) >= 220, f"section inventory unexpectedly small: {len(records)}")
    check(len(keys) == len(set(keys)), "duplicate section inventory keys")
    check(all(item.get("owner") in EXPECTED for item in records), "unknown section owner")
    check(any(item.get("owner") == "S" for item in records), "Purple Book owns no sections")

if figure_path.exists():
    data = json.loads(figure_path.read_text(encoding="utf-8"))
    records = data.get("figures", [])
    ids = [item.get("id") for item in records]
    check(data.get("release") == VERSION, "figure inventory version drifted")
    check(len(records) >= 26, f"figure inventory unexpectedly small: {len(records)}")
    check(len(ids) == len(set(ids)), "duplicate figure inventory IDs")
    for item in records:
        check(item.get("owner") in EXPECTED, f"{item.get('id')}: missing exact owner")
        check(bool(item.get("question")), f"{item.get('id')}: missing question")
        check(bool(item.get("source_basis")), f"{item.get('id')}: missing source basis")
        if item.get("reader_facing", True):
            check((ROOT / item.get("file", "missing")).exists(), f"{item.get('id')}: output missing")

if source_path.exists():
    data = json.loads(source_path.read_text(encoding="utf-8"))
    records = data.get("footnote_sources", [])
    ids = [item.get("id") for item in records]
    check(data.get("release") == VERSION, "source registry version drifted")
    check(data.get("status") == "canonical-source-registry", "canonical source status missing")
    check(not data.get("unresolved_references"), "unresolved chapter citations remain")
    check(len(records) >= 60, f"source registry unexpectedly small: {len(records)}")
    check(len(ids) == len(set(ids)), "duplicate source IDs")
    for node in EXPECTED - {"T", "R"}:
        check(any(node in item.get("subguides", []) for item in records), f"{node} has no source")

layout_geometry = {
    "a4": ("594", "841"),
    "a4half": ("298", "841"),
    "largeprint": ("594", "841"),
}

if manifest_path.exists():
    graph = json.loads(manifest_path.read_text(encoding="utf-8"))
    nodes = graph.get("nodes", [])
    by_id = {node["id"]: node for node in nodes}
    check(graph.get("release") == VERSION, "book manifest version drifted")
    check(set(by_id) == EXPECTED, "eleven-book node set drifted")
    check(set(graph.get("standalone_nodes", [])) == EXPECTED, "standalone shelf drifted")
    check(graph.get("standalone_emergency_gate") == "once-on-cover", "cover gate policy drifted")

    pdf_editions = 0
    for node_id in graph.get("standalone_nodes", []):
        node = by_id[node_id]
        out = BUILD / node_id
        book_manifest_path = out / "manifest.json"
        check(book_manifest_path.exists(), f"{node_id}: standalone manifest missing")
        if not book_manifest_path.exists():
            continue
        book = json.loads(book_manifest_path.read_text(encoding="utf-8"))
        check(book.get("release") == VERSION, f"{node_id}: version drifted")
        check(book.get("node") == node_id, f"{node_id}: manifest node drifted")
        check(book.get("source_count") == len(book.get("source_ids", [])), f"{node_id}: source count mismatch")
        check(len(book.get("source_ids", [])) == len(set(book.get("source_ids", []))), f"{node_id}: duplicate source IDs")
        check(book.get("canonical_visual_count") == len(book.get("canonical_visuals", [])), f"{node_id}: visual count mismatch")
        encapsulation = book.get("encapsulation", {})
        for field in ("scope", "outside_scope", "aliases", "figure_refs", "form_refs", "support_refs"):
            check(field in encapsulation, f"{node_id}: encapsulation lacks {field}")

        reference_text: str | None = None
        outputs = book.get("outputs", {})
        check(set(outputs) == set(layout_geometry), f"{node_id}: layout set drifted")
        for layout, (width, height) in layout_geometry.items():
            modes = outputs.get(layout, {})
            check(set(modes) == {"color", "mono"}, f"{node_id}/{layout}: mode set drifted")
            page_counts: list[int] = []
            for monochrome in (False, True):
                mode = "mono" if monochrome else "color"
                parts = [node["slug"]]
                if layout != "a4":
                    parts.append(layout)
                if monochrome:
                    parts.append("mono")
                stem = "_".join(parts)
                md = out / f"{stem}.md"
                html = out / f"{stem}.html"
                pdf = out / f"{stem}.pdf"
                for artifact in (md, html, pdf):
                    check(artifact.exists() and artifact.stat().st_size > 0, f"{node_id}: missing {artifact.name}")
                if md.exists():
                    text = md.read_text(encoding="utf-8")
                    check(node["title"] in text, f"{node_id}: book title missing")
                    check(text.count("::: {.emergency-gate}") == 1, f"{node_id}/{stem}: emergency gate count is not one")
                    for marker in ("# Start here", "# Where next?", "# Source notes", "What this book does", "What it hands off"):
                        check(marker in text, f"{node_id}: reader contract missing: {marker}")
                    for obsolete in ("Page 0 — Position in the graph", "Edition contract", "Immediate danger bypasses the graph"):
                        check(obsolete not in text, f"{node_id}: old governance-first wrapper remains: {obsolete}")
                if html.exists():
                    html_text = html.read_text(encoding="utf-8")
                    check(html_text.count('class="emergency-gate"') == 1, f"{node_id}/{stem}: HTML gate count is not one")
                    check('class="sources-and-limits"' in html_text, f"{node_id}/{stem}: source block missing")
                    check(f'data-subguide="{node_id}"' in html_text, f"{node_id}/{stem}: identity wrapper missing")
                    check('class="subguide-scope-grid"' in html_text, f"{node_id}/{stem}: concise scope block missing")
                    check('class="edition-resource-map"' in html_text, f"{node_id}/{stem}: resource map missing")
                    current = semantic_text(html)
                    if reference_text is None:
                        reference_text = current
                    else:
                        check(current == reference_text, f"{node_id}/{stem}: semantic text differs across editions")
                if pdf.exists():
                    pdf_editions += 1
                    info = pdf_info(pdf)
                    pages = int(info.get("Pages", "0") or 0)
                    page_counts.append(pages)
                    check(info.get("Tagged") == "yes", f"{node_id}/{stem}: PDF is not tagged")
                    size = info.get("Page size", "")
                    check(width in size and height in size, f"{node_id}/{stem}: wrong page geometry: {size}")
                    expected_hash = modes.get(mode, {}).get("pdf_sha256")
                    check(expected_hash == hashlib.sha256(pdf.read_bytes()).hexdigest(), f"{node_id}/{stem}: PDF hash drifted")
            if len(page_counts) == 2:
                check(page_counts[0] == page_counts[1], f"{node_id}/{layout}: colour/mono page counts differ")

    check(pdf_editions == 66, f"expected 66 standalone PDFs, found {pdf_editions}")

hub_path = BUILD / "index.html"
hub_manifest_path = BUILD / "manifest.json"
check(hub_path.exists(), "eleven-book hub missing")
check(hub_manifest_path.exists(), "hub manifest missing")
if hub_manifest_path.exists():
    hub = json.loads(hub_manifest_path.read_text(encoding="utf-8"))
    check(hub.get("release") == VERSION, "hub release drifted")
    check(set(hub.get("standalone_nodes", [])) == EXPECTED, "hub shelf drifted")
    check(not hub.get("master_only_nodes"), "all eleven books should be standalone")
if hub_path.exists():
    hub_text = hub_path.read_text(encoding="utf-8")
    check("The Eleven Books" in hub_text, "hub title missing")
    for title in ("Green Book", "Amber Book", "Teal Book", "Red Book", "Blue Book", "Orange Book", "Olive Book", "Indigo Book", "Purple Book", "Grey Book", "Copper Book"):
        check(title in hub_text, f"hub book missing: {title}")

if errors:
    raise SystemExit("Migration validation failed:\n- " + "\n- ".join(errors))

print("Migration validation passed: eleven canonical books, one cover gate each, source-complete extraction, and 66 tagged standalone PDF editions with layout and colour/mono parity.")
