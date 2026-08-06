#!/usr/bin/env python3
"""Build section and figure ownership inventories for the current release."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTER_DIR = ROOT / "src" / "chapters"
DATA_DIR = ROOT / "src" / "data"
from project_meta import VERSION

DEFAULT_OWNER = {
    "00-cover.md": "O",
    "01-how-to-use.md": "O",
    "01b-body-owner-manual.md": "O",
    "02-situation-a.md": "A",
    "03g-safe-place-routing.md": "D",
    "03h-environmental-hazards.md": "H",
    "04-calm-guide.md": "B",
    "04b-social-field-guide.md": "S",
    "05-self-ambulance.md": "C",
    "06-zombie-guide.md": "Z",
    "06b-natural-disasters.md": "H",
    "07-professional-support.md": "P",
    "07a-templates.md": "T",
    "08-appendix.md": "R",
    "09-version-history.md": "R",
    "10-sources.md": "R",
}


def slugify(value: str) -> str:
    value = value.lower().replace("–", "-").replace("—", "-")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def mixed_owner(heading: str, level: int) -> str:
    if level == 1:
        return "B"  # shared chapter shell; first owned route is B
    for prefix, owner in (
        ("B —", "B"),
        ("C —", "C"),
        ("D —", "D"),
        ("E —", "B"),
        ("F —", "H"),
        ("G —", "D"),
        ("Situations B–F", "D"),
    ):
        if heading.startswith(prefix):
            return owner
    raise ValueError(f"No mixed-chapter owner rule for heading: {heading}")


def build_sections() -> dict:
    records: list[dict] = []
    for chapter in sorted(CHAPTER_DIR.glob("*.md")):
        for line_number, line in enumerate(chapter.read_text(encoding="utf-8").splitlines(), 1):
            match = re.match(r"^(#{1,2})\s+(.+?)\s*$", line)
            if not match:
                continue
            level = len(match.group(1))
            heading = match.group(2)
            if chapter.name == "03-situations-b-g.md":
                owner = mixed_owner(heading, level)
            else:
                owner = DEFAULT_OWNER[chapter.name]
            records.append({
                "key": f"{chapter.stem}:{slugify(heading)}",
                "chapter": chapter.name,
                "line": line_number,
                "level": level,
                "heading": heading,
                "owner": owner,
            })
    return {
        "schema_version": 1,
        "release": VERSION,
        "generated_by": "bin/build_inventories.py",
        "granularity": "all level-1 and level-2 headings",
        "sections": records,
    }


def build_figures() -> dict:
    illustrations = json.loads((DATA_DIR / "illustration_catalog.json").read_text(encoding="utf-8"))["illustrations"]
    visualizations = json.loads((DATA_DIR / "visualization_catalog.json").read_text(encoding="utf-8"))["visualizations"]
    image_titles: dict[str, str] = {}
    image_re = re.compile(r"^!\[([^\]]+)\]\((build/diagrams/[^)]+)\)\s*$", re.MULTILINE)
    for chapter in sorted(CHAPTER_DIR.glob("*.md")):
        for alt, file in image_re.findall(chapter.read_text(encoding="utf-8")):
            previous = image_titles.get(file)
            if previous and previous != alt:
                raise ValueError(
                    f"Figure {file} has conflicting titles: {previous!r} / {alt!r}"
                )
            image_titles[file] = alt.strip()
    records: list[dict] = []
    for item in illustrations:
        title = image_titles.get(item["file"])
        if item.get("reader_facing", True) and not title:
            raise ValueError(f"Reader-facing figure {item['id']} has no Markdown title")
        records.append({
            "id": item["id"],
            "kind": "illustration",
            "file": item["file"],
            "title": title or item["id"].replace("-", " "),
            "description": item["question"],
            "resource_type": "figure",
            "interaction": "read-only",
            "owner": item["owner"],
            "secondary_subguides": item.get("secondary_subguides", []),
            "question": item["question"],
            "source_basis": item["sources"],
            "replacement_status": item["status"],
            "reader_facing": item.get("reader_facing", True),
            "replacement_id": item.get("replacement_id"),
            "renderer": item["renderer"],
        })
    for item in visualizations:
        owners = item.get("subguides", [])
        if len(owners) != 1:
            raise ValueError(f"Visualization {item['id']} must have exactly one proposed owner during M0")
        records.append({
            "id": item["id"],
            "kind": "vega-lite",
            "file": item["png"],
            "title": item["title"],
            "description": item["question"],
            "resource_type": "figure",
            "interaction": "read-only",
            "owner": owners[0],
            "secondary_subguides": [],
            "question": item["question"],
            "source_basis": item["sources"],
            "replacement_status": "canonical-vega",
            "reader_facing": item.get("reader_facing", True),
            "replacement_id": None,
            "renderer": "Vega-Lite",
        })
    records.sort(key=lambda item: (item["owner"], item["kind"], item["id"]))
    return {
        "schema_version": 1,
        "release": VERSION,
        "generated_by": "bin/build_inventories.py",
        "figures": records,
    }


def write_or_check(path: Path, data: dict, check: bool) -> None:
    rendered = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    if check:
        if not path.exists() or path.read_text(encoding="utf-8") != rendered:
            raise SystemExit(f"Inventory out of date: {path.relative_to(ROOT)}")
    else:
        path.write_text(rendered, encoding="utf-8")
        print(f"  [OK] {path.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(DATA_DIR / "section_ownership.json", build_sections(), args.check)
    write_or_check(DATA_DIR / "figure_inventory.json", build_figures(), args.check)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
