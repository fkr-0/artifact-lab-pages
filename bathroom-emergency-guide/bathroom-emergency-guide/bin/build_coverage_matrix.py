#!/usr/bin/env python3
"""Generate the cross-guide source, section, visual, and release coverage matrix."""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from project_meta import VERSION

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
GENERATED = ROOT / "build" / "generated"
JSON_OUT = DATA / "coverage_matrix.json"
MD_OUT = GENERATED / "coverage-matrix.md"


def load(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def readiness(*, released: bool, sections: int, sources: int, visuals: int) -> str:
    if released:
        return "released-standalone"
    if sections == 0:
        return "no-owned-sections"
    if sources >= 4 and visuals >= 4:
        return "standalone-candidate"
    if sources < 4 and visuals < 4:
        return "needs-sources-and-visuals"
    if sources < 4:
        return "needs-sources"
    return "needs-visuals"


def build_payload() -> dict:
    subguides = load("subguides.json")
    sections = load("section_ownership.json")["sections"]
    sources = load("source_inventory.json")["footnote_sources"]
    figures = load("figure_inventory.json")["figures"]
    illustrations = {
        item["id"]: item
        for item in load("illustration_catalog.json")["illustrations"]
    }
    released = set(subguides["standalone_nodes"])

    rows: list[dict] = []
    for node in subguides["nodes"]:
        node_id = node["id"]
        owned_sections = [item for item in sections if item.get("owner") == node_id]
        local_sources = [item for item in sources if node_id in item.get("subguides", [])]
        owned_figures = [
            item
            for item in figures
            if item.get("owner") == node_id and item.get("reader_facing", True)
        ]
        shared_figures = [
            item
            for item in figures
            if node_id in item.get("secondary_subguides", []) and item.get("reader_facing", True)
        ]
        source_kinds = Counter(item.get("kind", "unknown") for item in local_sources)
        review_priorities = Counter(
            illustrations[item["id"]].get("priority", "unclassified")
            for item in owned_figures
            if item["id"] in illustrations
        )
        records_with_basis = sum(bool(item.get("source_basis")) for item in owned_figures)
        rows.append(
            {
                "node": node_id,
                "title": node["title"],
                "standalone": node_id in released,
                "chapters": node["chapters"],
                "chapter_count": len(node["chapters"]),
                "section_count": len(owned_sections),
                "source_count": len(local_sources),
                "source_counts": {
                    "operational": source_kinds["operational"],
                    "research": source_kinds["research"],
                    "explanatory": source_kinds["explanatory"],
                },
                "source_ids": [item["id"] for item in local_sources],
                "owned_visual_count": len(owned_figures),
                "shared_visual_count": len(shared_figures),
                "visual_ids": [item["id"] for item in owned_figures],
                "shared_visual_ids": [item["id"] for item in shared_figures],
                "visuals_with_source_basis": records_with_basis,
                "visual_review_priorities": dict(sorted(review_priorities.items())),
                "readiness": readiness(
                    released=node_id in released,
                    sections=len(owned_sections),
                    sources=len(local_sources),
                    visuals=len(owned_figures),
                ),
            }
        )

    return {
        "schema_version": 1,
        "release": VERSION,
        "status": "canonical-cross-guide-coverage-matrix",
        "standalone_candidate_rule": {
            "minimum_local_sources": 4,
            "minimum_owned_reader_visuals": 4,
            "note": "Passing the numeric screen does not replace content, source, layout, accessibility, or usability review.",
        },
        "totals": {
            "nodes": len(rows),
            "sections": len(sections),
            "sources": len(sources),
            "reader_visuals": sum(
                1 for item in figures if item.get("reader_facing", True)
            ),
            "standalone_nodes": len(released),
        },
        "nodes": rows,
    }


def markdown(payload: dict) -> str:
    rows = payload["nodes"]
    lines = [
        "## Source, visual, and standalone coverage matrix",
        "",
        "This generated view shows what each graph node currently owns. It is a",
        "release-planning instrument, not a score of human importance. A node marked",
        "*standalone candidate* has crossed the numerical source/visual screen but",
        "still needs editorial, layout, accessibility, and usability review.",
        "",
        "| Guide | Status | Sections | Sources O/R/E | Owned visuals | Shared visuals | Visual source basis |",
        "|---|---|---:|---:|---:|---:|---:|",
    ]
    for item in rows:
        counts = item["source_counts"]
        lines.append(
            "| {node} — {title} | {status} | {sections} | {operational}/{research}/{explanatory} | {owned} | {shared} | {basis}/{owned} |".format(
                node=item["node"],
                title=item["title"],
                status=item["readiness"].replace("-", " "),
                sections=item["section_count"],
                operational=counts["operational"],
                research=counts["research"],
                explanatory=counts["explanatory"],
                owned=item["owned_visual_count"],
                shared=item["shared_visual_count"],
                basis=item["visuals_with_source_basis"],
            )
        )

    lines.extend(["", "### Per-guide provenance", ""])
    for item in rows:
        source_ids = ", ".join(f"`{value}`" for value in item["source_ids"]) or "none"
        visual_ids = ", ".join(f"`{value}`" for value in item["visual_ids"]) or "none"
        shared_ids = ", ".join(f"`{value}`" for value in item["shared_visual_ids"]) or "none"
        lines.extend(
            [
                f"#### {item['node']} — {item['title']}",
                "",
                f"- **Release state:** {item['readiness'].replace('-', ' ')}",
                f"- **Canonical chapters:** {', '.join(f'`{value}`' for value in item['chapters'])}",
                f"- **Local source IDs:** {source_ids}",
                f"- **Owned reader visuals:** {visual_ids}",
                f"- **Shared reader visuals:** {shared_ids}",
                "",
            ]
        )
    return "\n".join(lines).rstrip() + "\n"


def render(*, check: bool) -> None:
    payload = build_payload()
    outputs = {
        JSON_OUT: json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        MD_OUT: markdown(payload),
    }
    stale: list[str] = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    if stale:
        raise SystemExit("Coverage outputs are stale:\n- " + "\n- ".join(stale))
    if not check:
        totals = payload["totals"]
        print(
            "  [OK] coverage matrix: "
            f"{totals['nodes']} nodes, {totals['sources']} sources, "
            f"{totals['reader_visuals']} reader visuals"
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    render(check=args.check)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
