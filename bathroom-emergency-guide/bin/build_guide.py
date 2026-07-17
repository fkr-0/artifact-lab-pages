#!/usr/bin/env python3
"""Build Bathroom Emergency Guide v4.0.

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
STYLE_MONO = SRC / "style-mono.css"
VERSION = "4.0.0"

CHAPTERS = [
    "00-cover.md",
    "01-how-to-use.md",
    "02-situation-a.md",
    "03-situations-b-g.md",
    "04-calm-guide.md",
    "05-self-ambulance.md",
    "06-zombie-guide.md",
    "07-professional-support.md",
    "08-appendix.md",
    "09-version-history.md",
    "10-sources.md",
]


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


def assemble() -> Path:
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
        body = strip_frontmatter(path.read_text(encoding="utf-8")).strip()
        slug = path.stem
        classes = "chapter document-cover" if index == 0 else "chapter"
        parts.extend([
            f"::: {{#{slug} .{classes.replace(' ', ' .')}}}",
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


def combined_css(monochrome: bool) -> Path:
    content = STYLE.read_text(encoding="utf-8")
    name = "guide-mono.css" if monochrome else "guide.css"
    if monochrome:
        content += "\n\n" + STYLE_MONO.read_text(encoding="utf-8")
    output = BUILD_HTML / name
    output.write_text(content, encoding="utf-8")
    return output


def build_html(markdown: Path, *, monochrome: bool = False) -> Path:
    pandoc = require("pandoc")
    css = combined_css(monochrome)
    output = BUILD_HTML / ("guide_mono.html" if monochrome else "guide.html")
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
        "--output",
        str(output),
    ]
    run(command)
    html = output.read_text(encoding="utf-8")
    if "cdn.jsdelivr" in html or re.search(r"<script[^>]+mathjax", html, re.IGNORECASE):
        raise BuildError("HTML unexpectedly contains a remote MathJax dependency")
    if "<math" not in html:
        raise BuildError("Pandoc emitted no native MathML; formulas would be unverified")
    note(f"built {'mono' if monochrome else 'color'} HTML → {output.relative_to(ROOT)}")
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


def build_pdf(html: Path, *, monochrome: bool = False, backend: str = "auto") -> Path:
    output = BUILD_PDF / ("guide_mono.pdf" if monochrome else "guide.pdf")
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
    valid = {"all", "html", "pdf", "chrome", "weasyprint", "mono", "md", "latex", "docx"}
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
        build_latex(markdown)
        build_docx(markdown)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BuildError as exc:
        print(f"BUILD FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
