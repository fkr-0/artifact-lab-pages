#!/usr/bin/env python3
"""Build the canonical source registry used by master and standalone views."""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTER_DIR = ROOT / "src" / "chapters"
DATA_DIR = ROOT / "src" / "data"
from project_meta import VERSION
URL_RE = re.compile(r"https?://[^\s)>]+")
REF_RE = re.compile(r"\[\^([A-Za-z0-9_-]+)\]")
DEF_RE = re.compile(r"^\[\^([A-Za-z0-9_-]+)\]:\s*(.*)$")
HEADING_RE = re.compile(r"^(#{1,3})\s+(.+?)\s*$")


def slugify(value: str) -> str:
    value = value.lower().replace("–", "-").replace("—", "-")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def parse_definitions(lines: list[str]) -> tuple[dict[str, str], set[int]]:
    definitions: dict[str, str] = {}
    consumed: set[int] = set()
    index = 0
    while index < len(lines):
        match = DEF_RE.match(lines[index])
        if not match:
            index += 1
            continue
        key = match.group(1)
        chunks = [match.group(2).strip()]
        consumed.add(index)
        index += 1
        while index < len(lines) and (lines[index].startswith("    ") or lines[index].startswith("\t")):
            chunks.append(lines[index].strip())
            consumed.add(index)
            index += 1
        definitions[key] = " ".join(part for part in chunks if part)
    return definitions, consumed


def owner_at_line(chapter: str, line_number: int, ownership: dict[str, list[dict]]) -> str:
    candidates = [item for item in ownership.get(chapter, []) if item["line"] <= line_number]
    if not candidates:
        return "R"
    return max(candidates, key=lambda item: item["line"])["owner"]


def source_kind(chapter: str, key: str, text: str) -> str:
    operational_chapters = {"03g-safe-place-routing.md", "03h-environmental-hazards.md", "07-professional-support.md"}
    if chapter in operational_chapters or any(token in key for token in ("bbk", "help", "authority", "poison", "electric", "numbers")):
        return "operational"
    if any(token in text.lower() for token in ("doi.org", "study", "review", "journal", "et al.")):
        return "research"
    return "explanatory"


def build() -> dict:
    ownership_data = json.loads((DATA_DIR / "section_ownership.json").read_text(encoding="utf-8"))
    ownership: dict[str, list[dict]] = defaultdict(list)
    for item in ownership_data["sections"]:
        ownership[item["chapter"]].append(item)

    records: list[dict] = []
    unresolved: list[dict] = []
    for path in sorted(CHAPTER_DIR.glob("*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        definitions, definition_lines = parse_definitions(lines)
        uses: dict[str, list[int]] = defaultdict(list)
        subguides: dict[str, set[str]] = defaultdict(set)
        for index, line in enumerate(lines, 1):
            if index - 1 in definition_lines:
                continue
            for key in REF_RE.findall(line):
                uses[key].append(index)
                subguides[key].add(owner_at_line(path.name, index, ownership))
        for key, use_lines in uses.items():
            if key not in definitions:
                unresolved.append({"chapter": path.name, "footnote_key": key, "lines": use_lines})
                continue
            text = definitions[key]
            records.append({
                "id": f"{path.stem}--{key}",
                "chapter": path.name,
                "footnote_key": key,
                "kind": source_kind(path.name, key, text),
                "text": text,
                "urls": URL_RE.findall(text),
                "used_at_lines": use_lines,
                "subguides": sorted(subguides[key]),
            })

    # Index the existing global source notes without attempting semantic cleanup.
    source_notes: list[dict] = []
    source_path = CHAPTER_DIR / "10-sources.md"
    source_lines = source_path.read_text(encoding="utf-8").splitlines()
    headings: list[tuple[int, int, str]] = []
    for index, line in enumerate(source_lines, 1):
        match = HEADING_RE.match(line)
        if match and len(match.group(1)) in {2, 3}:
            headings.append((index, len(match.group(1)), match.group(2)))
    for pos, (line_number, level, heading) in enumerate(headings):
        end = headings[pos + 1][0] - 1 if pos + 1 < len(headings) else len(source_lines)
        body = "\n".join(source_lines[line_number:end]).strip()
        source_notes.append({
            "id": f"source-note--{slugify(heading)}",
            "heading": heading,
            "level": level,
            "line": line_number,
            "text": body,
            "urls": URL_RE.findall(body),
            "owner": "R",
        })

    url_owners: dict[str, list[str]] = defaultdict(list)
    for record in records:
        for url in record["urls"]:
            url_owners[url].append(record["id"])
    duplicates = [
        {"url": url, "source_ids": sorted(ids)}
        for url, ids in sorted(url_owners.items()) if len(set(ids)) > 1
    ]
    return {
        "schema_version": 1,
        "release": VERSION,
        "status": "canonical-source-registry",
        "generated_by": "bin/build_source_inventory.py",
        "footnote_sources": sorted(records, key=lambda item: item["id"]),
        "global_source_notes": source_notes,
        "duplicate_urls": duplicates,
        "unresolved_references": unresolved,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    output = DATA_DIR / "source_inventory.json"
    rendered = json.dumps(build(), indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != rendered:
            raise SystemExit("Source inventory is out of date")
    else:
        output.write_text(rendered, encoding="utf-8")
        data = json.loads(rendered)
        print(f"  [OK] {output.relative_to(ROOT)}: {len(data['footnote_sources'])} footnotes, {len(data['global_source_notes'])} source-note sections")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
