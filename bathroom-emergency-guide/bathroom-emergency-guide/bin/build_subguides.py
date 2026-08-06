#!/usr/bin/env python3
"""Build the public book shelf and released standalone books.

Canonical prose remains in src/chapters. This builder extracts owned sections,
adds generated orientation/source wrappers, and renders the same content into
A4, A4/2, and large-print colour/monochrome editions.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

from build_reference_index import decorate_figure_references, inject_heading_ids, mini_toc
from project_meta import (
    SOURCE_REVIEW_DATE,
    VERSION,
    build_date,
    git_revision,
    revision_footer_css,
)

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
CHAPTER_DIR = SRC / "chapters"
DATA_DIR = SRC / "data"
BUILD = ROOT / "build" / "subguides"
REVIEWED_ON = SOURCE_REVIEW_DATE
REF_RE = re.compile(r"\[\^([A-Za-z0-9_-]+)\]")
DEF_RE = re.compile(r"^\[\^([A-Za-z0-9_-]+)\]:")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\((build/diagrams/[^)]+)\)")
LAYOUTS = {
    "a4": None,
    "a4half": SRC / "style-a4-half.css",
    "largeprint": SRC / "style-large-print.css",
}


def load_guide_module():
    path = ROOT / "bin" / "build_guide.py"
    spec = importlib.util.spec_from_file_location("build_guide", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load build_guide.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BG = load_guide_module()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        capture_output=True,
        env={**os.environ, "PYTHONUTF8": "1"},
    )
    if result.returncode:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return result


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pdf_pages(path: Path) -> int:
    result = run(["pdfinfo", str(path)])
    match = re.search(r"^Pages:\s+(\d+)$", result.stdout, re.MULTILINE)
    if not match:
        raise RuntimeError(f"could not read page count for {path}")
    return int(match.group(1))


def remove_footnote_definitions(text: str) -> str:
    lines = text.splitlines()
    kept: list[str] = []
    index = 0
    while index < len(lines):
        if DEF_RE.match(lines[index]):
            index += 1
            while index < len(lines) and (
                lines[index].startswith("    ") or lines[index].startswith("\t")
            ):
                index += 1
            continue
        kept.append(lines[index])
        index += 1
    return "\n".join(kept).rstrip()


def mixed_sections(owner: str) -> str:
    path = CHAPTER_DIR / "03-situations-b-g.md"
    body = BG.strip_frontmatter(path.read_text(encoding="utf-8"))
    lines = body.splitlines()
    starts: list[tuple[int, str]] = []
    for index, line in enumerate(lines):
        if line.startswith("## "):
            starts.append((index, line[3:].strip()))
    ownership = json.loads(
        (DATA_DIR / "section_ownership.json").read_text(encoding="utf-8")
    )["sections"]
    owner_by_heading = {
        item["heading"]: item["owner"]
        for item in ownership
        if item["chapter"] == path.name and item["level"] == 2
    }
    chunks: list[str] = []
    for pos, (start, heading) in enumerate(starts):
        end = starts[pos + 1][0] if pos + 1 < len(starts) else len(lines)
        if owner_by_heading.get(heading) == owner:
            chunks.append("\n".join(lines[start:end]).strip())
    if not chunks:
        raise RuntimeError(f"no mixed sections for owner {owner}")
    return "\n\n".join(chunks)


def chapter_without_definitions(filename: str) -> str:
    text = remove_footnote_definitions(
        BG.strip_frontmatter((CHAPTER_DIR / filename).read_text(encoding="utf-8"))
    )
    return re.sub(r"\{\{subguide-sources:[A-Z]\}\}", "", text).rstrip()


def replace_refs(
    text: str,
    chapter: str,
    source_lookup: dict[tuple[str, str], dict],
    ordered_sources: list[dict],
) -> str:
    seen = {item["id"] for item in ordered_sources}

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        source = source_lookup.get((chapter, key))
        if source is None:
            raise RuntimeError(f"unresolved source {chapter}:{key}")
        if source["id"] not in seen:
            ordered_sources.append(source)
            seen.add(source["id"])
        return f"[^{source['id']}]"

    return REF_RE.sub(repl, text)


def source_endmatter(sources: list[dict]) -> str:
    groups = [
        ("Operational guidance", "operational"),
        ("Research and evidence", "research"),
        ("Models and explanations", "explanatory"),
    ]
    parts = [
        "# Source notes",
        "",
        "Generated from the canonical source registry. Every entry stays with the "
        "book that uses it, including the caveats that keep the source honest.",
        "",
    ]
    for title, kind in groups:
        subset = [item for item in sources if item["kind"] == kind]
        if not subset:
            continue
        parts.extend([f"## {title}", ""])
        for item in subset:
            parts.extend(
                [
                    f"### `{item['id']}`",
                    "",
                    item["text"],
                    "",
                    f"**Appears in:** {item['chapter']} · **Book:** "
                    f"{', '.join(item['subguides']) or 'unassigned'}",
                    "",
                ]
            )
    parts.extend(["## Citation links", ""])
    for item in sources:
        parts.append(
            f"[^{item['id']}]: See source `{item['id']}` in "
            "**Source notes** above."
        )
    return "\n".join(parts).rstrip()


def variant_stem(slug: str, layout: str, monochrome: bool) -> str:
    parts = [slug]
    if layout != "a4":
        parts.append(layout)
    if monochrome:
        parts.append("mono")
    return "_".join(parts)


def identity_css(node: dict, *, layout: str, monochrome: bool) -> str:
    parts = [
        (SRC / "style.css").read_text(encoding="utf-8"),
        (SRC / "style-subguides.css").read_text(encoding="utf-8"),
    ]
    if LAYOUTS[layout] is not None:
        parts.append(LAYOUTS[layout].read_text(encoding="utf-8"))
    if monochrome:
        parts.append((SRC / "style-mono.css").read_text(encoding="utf-8"))
    parts.append(
        revision_footer_css(
            title=f'{node["id"]} — {node["title"]}',
            layout=layout,
            mode="mono" if monochrome else "color",
        )
    )
    layout_label = {"a4": "A4", "a4half": "A4/2", "largeprint": "LARGE PRINT"}[layout]
    parts.append(
        "\n".join(
            (
                "/* Generated standalone page furniture. */",
                f'@page {{ @top-left {{ content: "{node["id"]} / {node["title"]}"; }} '
                f'@top-right {{ content: "{layout_label}"; }} }}',
                f':root {{ --subguide-accent: {node["colour"]}; }}',
            )
        )
    )
    return "\n\n".join(parts) + "\n"


def meta_grid(node: dict, layout: str) -> str:
    values = [
        ("Guide version", VERSION),
        ("Subguide revision", VERSION),
        ("Locale", "de-DE / English text"),
        ("Source review", REVIEWED_ON),
        ("Edition", f"standalone {layout}"),
        ("Identity", f'{node["id"]} · {node["pattern"]} · {node["glyph"]}'),
    ]
    blocks = "\n".join(
        f'<div><strong>{label}</strong>{value}</div>' for label, value in values
    )
    return f'<div class="subguide-meta">{blocks}</div>'


def neighbour_grid(node: dict, titles: dict[str, str]) -> str:
    blocks = "\n".join(
        f'<div><strong>{edge} — {titles[edge]}</strong><br>'
        "Move here when that problem becomes primary.</div>"
        for edge in node["outgoing"]
    )
    return f'<div class="subguide-neighbours">{blocks}</div>'


def route_chip(route: str, nodes: dict[str, dict]) -> str:
    node = nodes[route]
    return (
        f'<span class="route-chip" data-subguide="{route}">'
        f'<strong>{route}</strong><span>{node["title"]}</span>'
        f'<small>{node["pattern"].replace("-", " ")}</small></span>'
    )


def edition_resource_map(node: dict, visual_files: list[str]) -> tuple[str, dict]:
    index = json.loads((DATA_DIR / "content_index.json").read_text(encoding="utf-8"))
    records = index["records"]
    nodes = {
        item["id"]: item
        for item in json.loads((DATA_DIR / "subguides.json").read_text(encoding="utf-8"))["nodes"]
    }
    authored_figures = [
        item for item in records
        if item.get("kind") == "G" and item.get("file") in visual_files
    ]
    local_figures = [
        item for item in records
        if item.get("kind") == "G"
        and item.get("prepared_by") == "deployer"
        and (node["id"] == "T" or node["id"] in item.get("routes", []))
    ]
    figure_records = [*authored_figures, *local_figures]
    template_records = [
        item for item in records
        if item.get("kind") == "F"
        and (node["id"] == "T" or node["id"] in item.get("routes", []))
    ]
    support_keys = {
        key
        for resource in [*local_figures, *template_records]
        for key in resource.get("support_keys", [])
    }
    support_records = [
        item for item in records
        if item.get("kind") == "C" and item.get("service_key") in support_keys
    ]

    if figure_records:
        figures = "".join(
            f'<li><strong>{item["public_ref"]}</strong> {item["title"]}<br>'
            f'<span>{item.get("description", "")}</span>'
            + ('<br><small>Completed by deployer before installation.</small>' if item.get("prepared_by") == "deployer" else '')
            + '</li>'
            for item in figure_records
        )
    else:
        figures = "<li>No figure is required to use this book.</li>"

    if node["id"] == "T":
        templates = (
            f'<p><strong>{len(template_records)} canonical templates.</strong> Each heading below '
            'carries its title, stable template reference, short description, privacy class, '
            'related figures, and support links.</p>'
        )
    elif template_records:
        templates = "<ul>" + "".join(
            f'<li><strong>{item["public_ref"]}</strong> {item["title"]} — '
            f'{item.get("description", "")} '
            f'<span class="resource-privacy">{item.get("privacy", "review locally")}</span></li>'
            for item in template_records
        ) + "</ul>"
    else:
        templates = "<p>No dedicated Grey Book template is required.</p>"

    if support_records:
        support = "<ul>" + "".join(
            f'<li><strong>{item["public_ref"]}</strong> {item["title"]} — '
            f'{item.get("scope", "verify locally")}</li>'
            for item in support_records
        ) + "</ul>"
    else:
        support = "<p>Use the named local or emergency service when the text calls for it.</p>"

    related_routes = [node["id"]]
    for resource in [*local_figures, *template_records]:
        related_routes.extend(resource.get("routes", []))
    related_routes.extend(item["owner"] for item in authored_figures)
    related_routes = list(dict.fromkeys(related_routes))
    route_chips = "".join(route_chip(route, nodes) for route in related_routes)
    html = f'''<div class="edition-resource-map">
<section><h3>Figures used by this edition</h3><ul>{figures}</ul></section>
<section><h3>Grey Book templates paired with this book</h3>{templates}</section>
<section><h3>Support contacts named by those resources</h3>{support}</section>
<section class="edition-route-key"><h3>Related books</h3><div class="route-chip-row">{route_chips}</div></section>
</div>'''
    metadata = {
        "figure_refs": [item["public_ref"] for item in figure_records],
        "form_refs": [item["public_ref"] for item in template_records],
        "template_refs": [item["public_ref"] for item in template_records],
        "support_refs": [item["public_ref"] for item in support_records],
    }
    return html, metadata



def build_markdown(
    node: dict,
    canonical_content: str,
    ordered_sources: list[dict],
    *,
    layout: str,
    contents: str,
    resource_map: str,
) -> str:
    """Assemble a standalone book without placing governance before content."""
    node_id = node["id"]
    titles = {
        item["id"]: item["title"]
        for item in json.loads(
            (DATA_DIR / "subguides.json").read_text(encoding="utf-8")
        )["nodes"]
    }
    questions = "\n".join(f"- {question}" for question in node["questions"])
    handoffs = "\n".join(
        f"- **{edge} — {titles[edge]}** — use it when that problem becomes primary."
        for edge in node["outgoing"]
    )
    cover = f'''::: {{#top .standalone-subguide data-subguide="{node_id}" data-pattern="{node["pattern"]}"}}

::: {{.subguide-cover}}

<div class="subguide-family-mark">Bathroom Emergency Guide / one of eleven books</div>
<div class="subguide-code">{node["glyph"]}</div>

# {node["title"]}

<div class="subguide-promise">{node["promise"]}</div>

::: {{.emergency-gate}}

**Actual emergency?** Stop reading, involve another person, and call local
emergency services. In Germany, **112** is for life, medical, and fire danger;
**110** is for an active police threat.

:::

:::

::: {{.subguide-intro}}

# Start here

{questions}

<div class="subguide-scope-grid">
<section><strong>What this book does</strong><p>{node["scope"]}</p></section>
<section><strong>What it hands off</strong><p>{node["outside_scope"]}</p></section>
</div>

## Contents

{contents or '- The book begins on the next page.'}

:::
'''
    connections = f'''::: {{.subguide-handoff data-subguide="{node_id}"}}

# Where next?

You do not need to complete the shelf in order. Stay here while this is the
primary problem; move when another title becomes more accurate.

{handoffs}

![Connections from {node_id} — {node["title"]}](build/diagrams/subguide_graph_{node_id}.png)

## Tools, forms, and stable references

{resource_map}

:::
'''
    endmatter = (
        f'::: {{.sources-and-limits data-subguide="{node_id}"}}\n\n'
        + source_endmatter(ordered_sources)
        + "\n\n:::"
    )
    return "\n\n".join((cover, canonical_content, connections, endmatter, ":::")) + "\n"

def canonical_blocks(node_id: str) -> list[tuple[str, str]]:
    if node_id == "O":
        return [
            ("01-how-to-use.md", chapter_without_definitions("01-how-to-use.md")),
            ("01b-body-owner-manual.md", chapter_without_definitions("01b-body-owner-manual.md")),
        ]
    if node_id == "A":
        return [
            ("02-situation-a.md", chapter_without_definitions("02-situation-a.md")),
        ]
    if node_id == "D":
        return [
            ("03-situations-b-g.md", mixed_sections("D")),
            (
                "03g-safe-place-routing.md",
                chapter_without_definitions("03g-safe-place-routing.md"),
            ),
        ]
    if node_id == "B":
        return [
            ("03-situations-b-g.md", mixed_sections("B")),
            ("04-calm-guide.md", chapter_without_definitions("04-calm-guide.md")),
        ]
    if node_id == "P":
        return [
            ("07-professional-support.md", chapter_without_definitions("07-professional-support.md")),
        ]
    if node_id == "C":
        return [
            ("03-situations-b-g.md", mixed_sections("C")),
            ("05-self-ambulance.md", chapter_without_definitions("05-self-ambulance.md")),
        ]
    if node_id == "H":
        return [
            ("03-situations-b-g.md", mixed_sections("H")),
            (
                "03h-environmental-hazards.md",
                chapter_without_definitions("03h-environmental-hazards.md"),
            ),
            ("06b-natural-disasters.md", chapter_without_definitions("06b-natural-disasters.md")),
        ]
    if node_id == "Z":
        return [
            ("06-zombie-guide.md", chapter_without_definitions("06-zombie-guide.md")),
        ]
    if node_id == "S":
        return [
            ("04b-social-field-guide.md", chapter_without_definitions("04b-social-field-guide.md")),
        ]
    if node_id == "T":
        return [
            ("07a-templates.md", chapter_without_definitions("07a-templates.md")),
        ]
    if node_id == "R":
        return [
            ("08-appendix.md", chapter_without_definitions("08-appendix.md")),
            ("09-version-history.md", chapter_without_definitions("09-version-history.md")),
            ("10-sources.md", chapter_without_definitions("10-sources.md")),
        ]
    raise RuntimeError(f"node {node_id} is not a released standalone edition")


def build_node(node_id: str) -> dict:
    manifest = json.loads(
        (DATA_DIR / "subguides.json").read_text(encoding="utf-8")
    )
    node = next(item for item in manifest["nodes"] if item["id"] == node_id)
    inventory = json.loads(
        (DATA_DIR / "source_inventory.json").read_text(encoding="utf-8")
    )
    if inventory.get("status") != "canonical-source-registry":
        raise RuntimeError("source registry is not canonical")
    source_lookup = {
        (item["chapter"], item["footnote_key"]): item
        for item in inventory["footnote_sources"]
    }
    ordered_sources: list[dict] = []
    content_parts: list[str] = []
    for chapter, block in canonical_blocks(node_id):
        block = BG.expand_reference_macros(block)
        block = inject_heading_ids(block, chapter)
        content_parts.append(
            replace_refs(
                remove_footnote_definitions(block),
                chapter,
                source_lookup,
                ordered_sources,
            )
        )
    canonical_content = "\n\n".join(content_parts).strip()
    canonical_content = BG.expand_visualization_macros(
        canonical_content, BG.visualization_lookup()
    )
    canonical_content = decorate_figure_references(canonical_content, set())
    contents = mini_toc(canonical_content)
    visual_files = sorted(set(IMAGE_RE.findall(canonical_content)))
    resource_map, resource_metadata = edition_resource_map(node, visual_files)

    out_dir = BUILD / node_id
    out_dir.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, dict] = {}
    for layout in LAYOUTS:
        outputs[layout] = {}
        for monochrome in (False, True):
            mode = "mono" if monochrome else "color"
            stem = variant_stem(node["slug"], layout, monochrome)
            markdown = build_markdown(
                node,
                canonical_content,
                ordered_sources,
                layout=layout,
                contents=contents,
                resource_map=resource_map,
            )
            markdown = BG.expand_visualization_macros(
                markdown, BG.visualization_lookup()
            )
            md_path = out_dir / f"{stem}.md"
            md_path.write_text(
                "---\n"
                f'title: "{node["id"]} — {node["title"]}"\n'
                f'version: "{VERSION}"\n'
                'lang: "en"\n'
                "---\n\n"
                + markdown,
                encoding="utf-8",
            )
            css_path = out_dir / f"{stem}.css"
            css_path.write_text(
                identity_css(node, layout=layout, monochrome=monochrome),
                encoding="utf-8",
            )
            html_path = out_dir / f"{stem}.html"
            run(
                [
                    shutil.which("pandoc") or "pandoc",
                    str(md_path),
                    "--from=markdown+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs+link_attributes",
                    "--to=html5",
                    "--standalone",
                    "--template",
                    str(SRC / "template.html"),
                    "--toc",
                    "--toc-depth=2",
                    "--mathml",
                    "--embed-resources",
                    f"--css={css_path.name}",
                    "--resource-path",
                    os.pathsep.join(
                        (str(out_dir), str(ROOT / "build"), str(SRC), str(ROOT))
                    ),
                    "--metadata",
                    f"guide-version={VERSION}",
                    "--metadata",
                    f"print-mode={mode}",
                    "--metadata",
                    f"print-layout={layout}",
                    "--metadata",
                    "home-anchor=top",
                    "--metadata",
                    f"build-revision={git_revision()}",
                    "--metadata",
                    f"build-date={build_date()}",
                    "--metadata",
                    f'subguide-title={node["id"]} — {node["title"]}',
                    "--metadata",
                    "canonical-url=https://be.fkr.dev",
                    "--output",
                    str(html_path),
                ]
            )
            pdf_path = out_dir / f"{stem}.pdf"
            run(
                [
                    "node",
                    str(ROOT / "bin" / "chrome_pdf.mjs"),
                    str(html_path),
                    str(pdf_path),
                    VERSION,
                ]
            )
            outputs[layout][mode] = {
                "html": str(html_path.relative_to(ROOT)),
                "pdf": str(pdf_path.relative_to(ROOT)),
                "pdf_pages": pdf_pages(pdf_path),
                "html_sha256": file_sha256(html_path),
                "pdf_sha256": file_sha256(pdf_path),
            }

    result = {
        "release": VERSION,
        "node": node_id,
        "slug": node["slug"],
        "canonical_content_sha256": hashlib.sha256(
            canonical_content.encode()
        ).hexdigest(),
        "source_ids": [item["id"] for item in ordered_sources],
        "source_count": len(ordered_sources),
        "canonical_visuals": visual_files,
        "canonical_visual_count": len(visual_files),
        "encapsulation": {
            "scope": node["scope"],
            "outside_scope": node["outside_scope"],
            "aliases": node["aliases"],
            **resource_metadata,
        },
        "outputs": outputs,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"  [OK] {node_id} standalone: {len(ordered_sources)} local sources, "
        f"{len(visual_files)} canonical visuals, 6 editions"
    )
    return result


def build_hub(results: dict[str, dict]) -> None:
    manifest = json.loads(
        (DATA_DIR / "subguides.json").read_text(encoding="utf-8")
    )
    cards = []
    for node in manifest["nodes"]:
        pattern_path = f'assets/patterns/{node["id"]}-{node["pattern"]}.svg'
        if node["id"] in results:
            action = (
                f'<a class="hub-open" href="{node["id"]}/{node["slug"]}.html">'
                'Open this book →</a>'
            )
        else:
            action = '<span class="hub-master">Read in the complete master guide</span>'
        cards.append(
            f'''<article class="hub-node" data-subguide="{node["id"]}">
<img class="hub-node-pattern" src="{pattern_path}" alt="{node["id"]} {node["pattern"].replace("-", " ")} identity pattern">
<div class="hub-node-heading"><span>{node["id"]}</span><h2>{node["title"]}</h2></div>
<p>{node["promise"]}</p>
{action}
</article>'''
        )
    markdown = f'''---
title: "Bathroom Emergency Guide — The Eleven Books"
version: "{VERSION}"
lang: "en"
---

::: {{#top .standalone-subguide data-subguide="O" data-pattern="dot-field"}}

::: {{.subguide-cover}}

<div class="subguide-family-mark">Bathroom Emergency Guide / v{VERSION}</div>
<div class="subguide-code">11</div>

# The Eleven Books

<div class="subguide-promise">Choose the title that sounds closest. Read until one useful action becomes possible.</div>

:::

::: {{.emergency-gate}}

**Actual emergency?** Use emergency services before choosing a book. In Germany,
call **112** for life, medical, or fire danger and **110** for an active police
threat.

:::

# Pick a book

![Bathroom Emergency Guide book connections](build/diagrams/subguide_graph_overview.png)

The lines only show where one book can hand over to another. They are not a
reading order and there will be no quiz.

<div class="hub-directory" aria-label="Eleven colour books">
{chr(10).join(cards)}
</div>

## A shelf, not a hierarchy

Green observes the body. Amber handles responsibility. Teal lowers the volume.
Red handles first aid. Blue finds safety. Orange reads the environment. Olive
keeps systems alive. Indigo finds professional leverage. Purple handles other
people. Grey stores facts. Copper helps you find everything again.

Every book is complete enough to start alone and honest enough to hand off.

:::
'''
    out = BUILD
    out.mkdir(parents=True, exist_ok=True)
    md_path = out / "index.md"
    md_path.write_text(markdown, encoding="utf-8")
    css_path = out / "index.css"
    css_path.write_text(
        identity_css(manifest["nodes"][0], layout="a4", monochrome=False),
        encoding="utf-8",
    )
    html_path = out / "index.html"
    run(
        [
            shutil.which("pandoc") or "pandoc",
            str(md_path),
            "--from=markdown+yaml_metadata_block+fenced_divs+link_attributes",
            "--to=html5",
            "--standalone",
            "--template",
            str(SRC / "template.html"),
            "--toc",
            "--toc-depth=2",
            "--embed-resources",
            f"--css={css_path.name}",
            "--resource-path",
            os.pathsep.join((str(out), str(ROOT / "build"), str(SRC), str(ROOT))),
            "--metadata",
            f"guide-version={VERSION}",
            "--metadata",
            "print-mode=color",
            "--metadata",
            "print-layout=a4",
            "--metadata",
            "home-anchor=top",
            "--output",
            str(html_path),
        ]
    )
    hub_manifest = {
        "release": VERSION,
        "standalone_nodes": sorted(results),
        "master_only_nodes": [
            node["id"] for node in manifest["nodes"] if node["id"] not in results
        ],
        "html": str(html_path.relative_to(ROOT)),
        "html_sha256": file_sha256(html_path),
    }
    (out / "manifest.json").write_text(
        json.dumps(hub_manifest, indent=2) + "\n", encoding="utf-8"
    )
    print("  [OK] eleven-book shelf → build/subguides/index.html")


def main() -> int:
    parser = argparse.ArgumentParser()
    manifest = json.loads((DATA_DIR / "subguides.json").read_text(encoding="utf-8"))
    released = manifest["standalone_nodes"]
    parser.add_argument("--node", choices=[*released, "all"], default="all")
    args = parser.parse_args()
    node_ids = released if args.node == "all" else [args.node]
    # A clean build must not retain output names from an older book identity.
    # Preserve generated pattern assets, which are produced before this step,
    # while replacing every selected book directory and root hub file.
    for node_id in node_ids:
        shutil.rmtree(BUILD / node_id, ignore_errors=True)
    if args.node == "all":
        for name in ("index.md", "index.css", "index.html", "manifest.json"):
            (BUILD / name).unlink(missing_ok=True)
    results = {node_id: build_node(node_id) for node_id in node_ids}
    if args.node == "all":
        build_hub(results)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
