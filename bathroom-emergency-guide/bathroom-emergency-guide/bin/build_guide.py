#!/usr/bin/env python3
"""Build the current Bathroom Emergency Guide release.

The build has one source of truth and no network dependency:
- chapter YAML is removed during assembly;
- chapters receive semantic fenced-div wrappers;
- Pandoc emits native MathML instead of CDN-loaded MathJax;
- one template drives screen, color-print, and mono-print output;
- Chrome and WeasyPrint consume the same HTML and print CSS.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from project_meta import VERSION, build_date, git_revision, revision_footer_css
from build_reference_index import decorate_figure_references, inject_heading_ids

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
CHAPTER_DIR = SRC / "chapters"
BUILD = ROOT / "build"
BUILD_MD = BUILD / "md"
BUILD_HTML = BUILD / "html"
BUILD_PDF = BUILD / "pdf"
BUILD_LATEX = BUILD / "latex"
BUILD_DOCX = BUILD / "docx"
TEMPLATE = SRC / "template.html"
STYLE = SRC / "style.css"
STYLE_SUBGUIDES = SRC / "style-subguides.css"
STYLE_MONO = SRC / "style-mono.css"
STYLE_A4_HALF = SRC / "style-a4-half.css"
STYLE_LARGE_PRINT = SRC / "style-large-print.css"
VISUALIZATION_CATALOG = SRC / "data" / "visualization_catalog.json"
SOURCE_INVENTORY = SRC / "data" / "source_inventory.json"
GENERATED = BUILD / "generated"

CHAPTERS = [
    "00-cover.md",
    "01-how-to-use.md",
    "01b-body-owner-manual.md",
    "02-situation-a.md",
    "03-situations-b-g.md",
    "03g-safe-place-routing.md",
    "03h-environmental-hazards.md",
    "04-calm-guide.md",
    "04b-social-field-guide.md",
    "05-self-ambulance.md",
    "06-zombie-guide.md",
    "06b-natural-disasters.md",
    "07-professional-support.md",
    "07a-templates.md",
    "08-appendix.md",
    "09-version-history.md",
    "10-sources.md",
]

CHAPTER_OWNERS = {
    "00-cover.md": "O",
    "01-how-to-use.md": "O",
    "01b-body-owner-manual.md": "O",
    "02-situation-a.md": "A",
    "03-situations-b-g.md": "D",
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


class BuildError(RuntimeError):
    pass


def note(message: str) -> None:
    print(f"  {message}")


def run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        env={**os.environ, "PYTHONUTF8": "1"},
    )
    if check and result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise BuildError(f"{' '.join(command)}\n{detail}")
    return result


def require(binary: str) -> str:
    found = shutil.which(binary)
    if not found:
        raise BuildError(f"Required command not found: {binary}")
    return found


def ensure_directories() -> None:
    for directory in (BUILD_MD, BUILD_HTML, BUILD_PDF, BUILD_LATEX, BUILD_DOCX):
        directory.mkdir(parents=True, exist_ok=True)


def strip_frontmatter(text: str) -> str:
    """Remove exactly one leading YAML metadata block."""
    return re.sub(r"\A---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)


def visualization_lookup() -> dict[str, dict]:
    import json

    try:
        catalog = json.loads(VISUALIZATION_CATALOG.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BuildError(f"Could not read visualization catalog: {exc}") from exc
    return {item["id"]: item for item in catalog.get("visualizations", [])}


def expand_visualization_macros(text: str, lookup: dict[str, dict]) -> str:
    """Expand one catalog entry into consistent cross-format figure markup."""

    pattern = re.compile(r"\{\{visualization:([a-z0-9-]+)\}\}")

    def replace(match: re.Match[str]) -> str:
        item_id = match.group(1)
        item = lookup.get(item_id)
        if item is None:
            raise BuildError(f"Unknown visualization macro: {item_id}")
        return "\n".join(
            (
                f'::: {{.quantitative-figure data-visualization-id="{item_id}"}}',
                "",
                f'![{item["title"]}]({item["png"]})',
                "",
                "::: {.chart-note}",
                f'**What to notice:** {item["takeaway"]}',
                "",
                f'**Limit:** {item["limit"]}',
                ":::",
                "",
                ":::",
            )
        )

    expanded = pattern.sub(replace, text)
    if "{{visualization:" in expanded:
        raise BuildError("Unexpanded visualization macro remains")
    return expanded


def expand_reference_macros(text: str) -> str:
    """Insert generated, source-backed indexes into the final reference guide."""
    mapping = {
        "global-content-index": "global-content-index.md",
        "diagram-index-generated": "diagram-index.md",
        "professional-contact-index": "contact-index.md",
        "deployment-field-index": "deployment-index.md",
        "glossary-index": "glossary-index.md",
        "detachable-form-index": "form-index.md",
        "writable-template-index": "template-index.md",
        "route-identity-index": "route-identity-index.md",
        "support-form-map": "support-form-map.md",
        "coverage-matrix": "coverage-matrix.md",
    }
    for macro, filename in mapping.items():
        token = "{{" + macro + "}}"
        if token not in text:
            continue
        path = GENERATED / filename
        if not path.exists():
            raise BuildError(f"Generated reference fragment missing: {path}")
        text = text.replace(token, path.read_text(encoding="utf-8").strip())
    if re.search(r"\{\{(?:global-content-index|diagram-index-generated|professional-contact-index|deployment-field-index|glossary-index|detachable-form-index|writable-template-index|route-identity-index|support-form-map|coverage-matrix)\}\}", text):
        raise BuildError("Unexpanded reference-index macro remains")
    return text


def source_inventory_records() -> list[dict]:
    import json

    try:
        inventory = json.loads(SOURCE_INVENTORY.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BuildError(f"Could not read source inventory: {exc}") from exc
    if inventory.get("status") != "canonical-source-registry":
        raise BuildError("Canonical source-registry status drifted")
    return inventory.get("footnote_sources", [])


def expand_subguide_source_macros(text: str, records: list[dict]) -> str:
    """Render compact book-level source notes from the generated inventory."""

    pattern = re.compile(r"\{\{subguide-sources:([A-Z])\}\}")
    chapter_order = {name: index for index, name in enumerate(CHAPTERS)}

    def replace(match: re.Match[str]) -> str:
        node = match.group(1)
        selected = [item for item in records if node in item.get("subguides", [])]
        selected.sort(key=lambda item: (chapter_order.get(item["chapter"], 999), min(item.get("used_at_lines", [9999])), item["id"]))
        if not selected:
            return "\n".join((
                f'::: {{.sources-and-limits data-subguide="{node}"}}',
                "",
                f"## Source notes — {node}",
                "",
                "This book contains organizational templates rather than independent medical claims. Clinical and operational claims remain sourced beside the corresponding guide sections and in the Copper Book.",
                "",
                ":::"
            ))
        groups = (("Operational guidance", "operational"), ("Research and evidence", "research"), ("Models and explanations", "explanatory"))
        parts = [f'::: {{.sources-and-limits data-subguide="{node}"}}', "", f"## Source notes — {node}", "", "Generated from the current chapter-footnote inventory. Stable IDs come from the canonical source registry used by the complete guide and individual books.", ""]
        for title, kind in groups:
            subset = [item for item in selected if item["kind"] == kind]
            if not subset:
                continue
            parts.extend([f"### {title}", ""])
            for item in subset:
                parts.extend([f"- **`{item['id']}`** — {item['text']}", ""])
        parts.append(":::")
        return "\n".join(parts)

    expanded = pattern.sub(replace, text)
    if "{{subguide-sources:" in expanded:
        raise BuildError("Unexpanded subguide source macro remains")
    return expanded


def assemble() -> Path:
    visualizations = visualization_lookup()
    source_records = source_inventory_records()
    seen_figure_refs: set[str] = set()
    parts = [
        "---",
        'title: "Bathroom Emergency Guide"',
        f'version: "{VERSION}"',
        'lang: "en"',
        "---",
        "",
    ]
    for index, filename in enumerate(CHAPTERS):
        path = CHAPTER_DIR / filename
        if not path.exists():
            raise BuildError(f"Missing chapter: {path}")
        body = strip_frontmatter(path.read_text(encoding="utf-8"))
        body = expand_visualization_macros(body, visualizations)
        body = expand_subguide_source_macros(body, source_records)
        body = expand_reference_macros(body)
        body = inject_heading_ids(body, filename)
        body = decorate_figure_references(body, seen_figure_refs).strip()
        slug = path.stem
        classes = "chapter document-cover" if index == 0 else "chapter"
        parts.extend([
            f'::: {{#{slug} .{classes.replace(" ", " .")} data-subguide="{CHAPTER_OWNERS[filename]}"}}',
            "",
            body,
            "",
            ":::",
            "",
        ])

    output = BUILD_MD / "guide.md"
    output.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
    note(f"assembled {len(CHAPTERS)} chapters → {output.relative_to(ROOT)}")
    return output


def variant_stem(*, monochrome: bool, layout: str) -> str:
    parts = ["guide"]
    if layout != "a4":
        parts.append(layout)
    if monochrome:
        parts.append("mono")
    return "_".join(parts)


def combined_css(monochrome: bool, *, layout: str = "a4") -> Path:
    content = STYLE.read_text(encoding="utf-8")
    content += "\n\n" + STYLE_SUBGUIDES.read_text(encoding="utf-8")
    if layout == "a4half":
        content += "\n\n" + STYLE_A4_HALF.read_text(encoding="utf-8")
    if layout == "largeprint":
        content += "\n\n" + STYLE_LARGE_PRINT.read_text(encoding="utf-8")
    if monochrome:
        content += "\n\n" + STYLE_MONO.read_text(encoding="utf-8")
    content += "\n\n" + revision_footer_css(
        title="Complete guide",
        layout=layout,
        mode="mono" if monochrome else "color",
    )
    name = variant_stem(monochrome=monochrome, layout=layout).replace("_", "-") + ".css"
    output = BUILD_HTML / name
    output.write_text(content, encoding="utf-8")
    return output


def build_html(markdown: Path, *, monochrome: bool = False, layout: str = "a4") -> Path:
    pandoc = require("pandoc")
    css = combined_css(monochrome, layout=layout)
    output = BUILD_HTML / f"{variant_stem(monochrome=monochrome, layout=layout)}.html"
    command = [
        pandoc,
        str(markdown),
        "--from=markdown+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs+link_attributes",
        "--to=html5",
        "--standalone",
        "--template",
        str(TEMPLATE),
        "--toc",
        "--toc-depth=2",
        "--mathml",
        "--embed-resources",
        f"--css={css.name}",
        "--resource-path",
        os.pathsep.join((str(BUILD_MD), str(BUILD), str(SRC), str(ROOT))),
        "--metadata",
        f"guide-version={VERSION}",
        "--metadata",
        f"print-mode={'mono' if monochrome else 'color'}",
        "--metadata",
        f"print-layout={layout}",
        "--metadata",
        f"build-revision={git_revision()}",
        "--metadata",
        f"build-date={build_date()}",
        "--metadata",
        "subguide-title=Complete guide",
        "--metadata",
        "canonical-url=https://be.fkr.dev",
        "--output",
        str(output),
    ]
    run(command)
    html = output.read_text(encoding="utf-8")
    if "cdn.jsdelivr" in html or re.search(r"<script[^>]+mathjax", html, re.IGNORECASE):
        raise BuildError("HTML unexpectedly contains a remote MathJax dependency")
    if "<math" not in html:
        raise BuildError("Pandoc emitted no native MathML; formulas would be unverified")
    note(
        f"built {'mono' if monochrome else 'color'} {layout} HTML → "
        f"{output.relative_to(ROOT)}"
    )
    return output


def chrome_available() -> bool:
    node = shutil.which("node")
    script = ROOT / "bin" / "chrome_pdf.mjs"
    if not node or not script.exists():
        return False
    probe = run([node, "-e", "import('playwright').then(()=>process.exit(0)).catch(()=>process.exit(1))"], check=False)
    return probe.returncode == 0


def build_chrome_pdf(html: Path, output: Path) -> bool:
    if not chrome_available():
        return False
    result = run(
        [require("node"), str(ROOT / "bin" / "chrome_pdf.mjs"), str(html), str(output), VERSION],
        check=False,
    )
    if result.returncode:
        note(f"Chrome PDF unavailable: {(result.stderr or result.stdout).strip()}")
        return False
    note(f"built Chrome PDF → {output.relative_to(ROOT)}")
    return True


def build_weasy_pdf(html: Path, output: Path) -> bool:
    weasyprint = shutil.which("weasyprint")
    if not weasyprint:
        return False
    result = run([weasyprint, str(html), str(output)], check=False)
    if result.returncode:
        note(f"WeasyPrint PDF unavailable: {(result.stderr or result.stdout).strip()}")
        return False
    note(f"built WeasyPrint PDF → {output.relative_to(ROOT)}")
    return True


def build_pdf(
    html: Path,
    *,
    monochrome: bool = False,
    layout: str = "a4",
    backend: str = "auto",
) -> Path:
    output = BUILD_PDF / f"{variant_stem(monochrome=monochrome, layout=layout)}.pdf"
    if backend in {"auto", "chrome"} and build_chrome_pdf(html, output):
        return output
    if backend in {"auto", "weasyprint"} and build_weasy_pdf(html, output):
        return output
    raise BuildError(f"No working PDF backend for {output.name}")


def build_latex(markdown: Path) -> None:
    if not shutil.which("pandoc"):
        return
    output = BUILD_LATEX / "guide.tex"
    run([
        require("pandoc"),
        str(markdown),
        "--from=markdown+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs",
        "--to=latex",
        "--resource-path",
        os.pathsep.join((str(BUILD_MD), str(BUILD), str(SRC), str(ROOT))),
        "--output",
        str(output),
    ])
    note(f"built LaTeX → {output.relative_to(ROOT)}")


def build_docx(markdown: Path) -> None:
    if not shutil.which("pandoc"):
        return
    output = BUILD_DOCX / "guide.docx"
    run([
        require("pandoc"),
        str(markdown),
        "--from=markdown+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs",
        "--to=docx",
        "--resource-path",
        os.pathsep.join((str(BUILD_MD), str(BUILD), str(SRC), str(ROOT))),
        "--output",
        str(output),
    ])
    note(f"built DOCX → {output.relative_to(ROOT)}")


def main() -> int:
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    valid = {
        "all",
        "html",
        "pdf",
        "chrome",
        "weasyprint",
        "mono",
        "a4half",
        "a4half-html",
        "a4half-mono",
        "largeprint",
        "largeprint-html",
        "largeprint-mono",
        "md",
        "latex",
        "docx",
    }
    if target not in valid:
        print(f"Unknown target {target!r}; choose from: {', '.join(sorted(valid))}", file=sys.stderr)
        return 2

    ensure_directories()
    markdown = assemble()
    if target == "md":
        return 0
    if target == "latex":
        build_latex(markdown)
        return 0
    if target == "docx":
        build_docx(markdown)
        return 0

    if target in {"a4half", "a4half-html", "a4half-mono"}:
        color_html = build_html(markdown, layout="a4half")
        mono_html = build_html(markdown, monochrome=True, layout="a4half")
        if target == "a4half-html":
            return 0
        if target == "a4half":
            build_pdf(color_html, layout="a4half")
        if target in {"a4half", "a4half-mono"}:
            build_pdf(mono_html, monochrome=True, layout="a4half")
        return 0

    if target in {"largeprint", "largeprint-html", "largeprint-mono"}:
        color_html = build_html(markdown, layout="largeprint")
        mono_html = build_html(markdown, monochrome=True, layout="largeprint")
        if target == "largeprint-html":
            return 0
        if target == "largeprint":
            build_pdf(color_html, layout="largeprint")
        if target in {"largeprint", "largeprint-mono"}:
            build_pdf(mono_html, monochrome=True, layout="largeprint")
        return 0

    color_html = build_html(markdown)
    mono_html = build_html(markdown, monochrome=True)

    if target == "html":
        return 0

    backend = "auto"
    if target in {"chrome", "weasyprint"}:
        backend = target
    if target in {"all", "pdf", "chrome", "weasyprint"}:
        build_pdf(color_html, backend=backend)
    if target in {"all", "mono"}:
        build_pdf(mono_html, monochrome=True, backend=backend)
    if target == "mono":
        return 0

    if target == "all":
        a4half_html = build_html(markdown, layout="a4half")
        a4half_mono_html = build_html(markdown, monochrome=True, layout="a4half")
        build_pdf(a4half_html, layout="a4half", backend=backend)
        build_pdf(
            a4half_mono_html,
            monochrome=True,
            layout="a4half",
            backend=backend,
        )
        large_html = build_html(markdown, layout="largeprint")
        large_mono_html = build_html(markdown, monochrome=True, layout="largeprint")
        build_pdf(large_html, layout="largeprint", backend=backend)
        build_pdf(
            large_mono_html,
            monochrome=True,
            layout="largeprint",
            backend=backend,
        )
        build_latex(markdown)
        build_docx(markdown)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BuildError as exc:
        print(f"BUILD FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
