#!/usr/bin/env python3
"""
Bathroom Emergency Guide — Build Script v3.2
Assembles chapters, converts to all output formats, and properly merges
the cover page with scoped CSS so it doesn't break the guide layout.
"""

import os
import re
import sys
import shutil
import subprocess
from pathlib import Path

# ── Project paths ──────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
SRC = PROJECT_ROOT / "src"
SRC_CHAPTERS = SRC / "chapters"
SRC_STYLE = SRC / "style.css"
SRC_STYLE_MONO = SRC / "style-mono.css"
SRC_COVER = SRC / "cover.html"
BUILD = PROJECT_ROOT / "build"
BUILD_MD = BUILD / "md"
BUILD_HTML = BUILD / "html"
BUILD_PDF = BUILD / "pdf"
BUILD_LATEX = BUILD / "latex"
BUILD_DOCX = BUILD / "docx"
BUILD_DIAGRAMS = BUILD / "diagrams"

CHAPTERS_ORDERED = [
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

VERSION = "3.2.0"


def log(msg: str, level: str = "INFO"):
    prefix = {"INFO": "  [OK]", "WARN": "  [WARN]", "FAIL": "  [FAIL]", "STEP": ""}
    print(f"{prefix.get(level, '')} {msg}")


def ensure_dirs():
    for d in [BUILD_MD, BUILD_HTML, BUILD_PDF, BUILD_LATEX, BUILD_DOCX]:
        d.mkdir(parents=True, exist_ok=True)


# ── Step 1: Assemble markdown ─────────────────────────────────
def assemble_markdown() -> Path:
    log("[1/7] Assembling chapters...", "STEP")
    out = BUILD_MD / "guide.md"
    parts = []
    for ch_name in CHAPTERS_ORDERED:
        ch_path = SRC_CHAPTERS / ch_name
        if ch_path.exists():
            parts.append(ch_path.read_text(encoding="utf-8"))
            parts.append("\n\n---\n")
        else:
            log(f"Missing chapter: {ch_path}", "WARN")
    out.write_text("".join(parts), encoding="utf-8")
    # Fix image paths: build/diagrams/ -> ../diagrams/ (relative from build/md/)
    content = out.read_text(encoding="utf-8")
    content = content.replace("build/diagrams/", "../diagrams/")
    out.write_text(content, encoding="utf-8")
    log(f"{out}")
    return out


# ── Step 2: Build HTML via pandoc ─────────────────────────────
def build_html(assembled_md: Path, css_path: Path, output_name: str = "guide.html") -> Path:
    log("[2/7] Building HTML...", "STEP")
    out = BUILD_HTML / output_name

    if not shutil.which("pandoc"):
        log("pandoc not found, skipping HTML", "WARN")
        return out

    cmd = [
        "pandoc", str(assembled_md),
        "-f", "markdown+yaml_metadata_block+tex_math_dollars",
        "-t", "html5",
        "--standalone",
        "--mathjax=https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js",
        "--css=style.css",
        "--resource-path", f"{BUILD_MD}:{BUILD}:{SRC}",
        "--embed-resources",
        "--metadata", "title=Bathroom Emergency Guide",
        "-o", str(out),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        log(f"pandoc error: {result.stderr}", "FAIL")
        return out

    # Copy CSS alongside HTML for reference
    if css_path.exists():
        shutil.copy2(css_path, BUILD_HTML / css_path.name)

    log(f"{out}")
    return out


# ── Step 3: Scope cover CSS for merging ────────────────────────
def scope_cover_css(raw_css: str) -> str:
    """
    Transform the cover page's CSS so all selectors are scoped to .cover-page.
    This prevents cover styles from overriding guide styles when merged.

    Key transformations:
    - *, *::before, *::after { margin:0; padding:0 } → REMOVE entirely
    - @page { margin: 0 } → @page :first { margin: 0 }
    - Remove duplicate @page :first
    - Remove @import url(...) for Google Fonts
    - html, body { ... } → .cover-page { ... }
    - body { ... } → .cover-page { ... }
    - body::before → .cover-page::before
    - body::after → .cover-page::after
    - body.scanline-overlay::before → .cover-page.scanline-overlay::before
    - :root variables → REMOVE entirely (guide CSS already defines all needed variables)
    """
    css = raw_css

    # 1. Remove the global reset that kills all margins/padding
    css = re.sub(
        r'\*\s*,\s*\*::before\s*,\s*\*::after\s*\{[^}]*margin\s*:\s*0[^}]*padding\s*:\s*0[^}]*\}',
        '/* Global reset removed — guide CSS handles this */',
        css,
        flags=re.DOTALL,
    )

    # 2. Remove @import for Google Fonts (WeasyPrint can't fetch external URLs)
    css = re.sub(
        r"@import\s+url\('[^']+'\)\s*;",
        "/* Google Fonts import removed — using system fonts */",
        css,
    )

    # 3. Replace @page { margin: 0; size: A4; } with @page :first { margin: 0; }
    # First, remove any existing @page :first block (may contain nested @-rules)
    # We need a function to match balanced braces for this
    def remove_atpage_first(css_text):
        """Remove @page :first { ... } blocks including nested braces."""
        result = []
        i = 0
        while i < len(css_text):
            # Look for @page :first
            m = re.match(r'@page\s+:first\s*\{', css_text[i:])
            if m:
                # Found start, now find matching closing brace
                depth = 1
                j = i + m.end()
                while j < len(css_text) and depth > 0:
                    if css_text[j] == '{':
                        depth += 1
                    elif css_text[j] == '}':
                        depth -= 1
                    j += 1
                # Skip this entire block
                i = j
            else:
                result.append(css_text[i])
                i += 1
        return ''.join(result)

    css = remove_atpage_first(css)

    # Replace @page { size: A4; margin: 0; } with @page :first { margin: 0; }
    # But only the @page with margin: 0 — the guide's @page with margin: 2cm 2.5cm must survive
    def replace_atpage(m):
        body = m.group(1)
        if 'margin: 0' in body or 'margin:0' in body:
            return '@page :first {\n    margin: 0;\n}'
        return m.group(0)  # keep other @page rules

    css = re.sub(r'@page\s*\{([^}]+)\}', replace_atpage, css, flags=re.DOTALL)

    # 4. Replace html, body selectors → .cover-page
    css = re.sub(r'html\s*,\s*body\s*\{', '.cover-page {', css)

    # 5. Replace body { → .cover-page {
    # But be careful: "body {" not "body::" or "body."
    css = re.sub(r'(?<!\.)body\s*\{', '.cover-page {', css)

    # 6. Replace body::before → .cover-page::before
    css = re.sub(r'body\s*::before', '.cover-page::before', css)
    # Also handle body.scanline-overlay::before
    css = re.sub(r'body\.scanline-overlay::before', '.cover-page.scanline-overlay::before', css)

    # 7. Replace body::after → .cover-page::after
    css = re.sub(r'body\s*::after', '.cover-page::after', css)

    # 8. Remove :root variables block (guide CSS already defines all needed variables;
    #    cover's :root would override monochrome CSS variables when building mono variant)
    css = re.sub(
        r':root\s*\{[^}]*\}',
        '/* :root variables removed — guide CSS defines all needed variables */',
        css,
        flags=re.DOTALL,
    )

    return css


def mono_cover_css(scoped_css: str) -> str:
    """
    Transform scoped cover CSS to monochrome/grayscale.
    Replaces all hardcoded colors in the cover CSS with grayscale equivalents.
    This is applied AFTER scope_cover_css() so selectors are already .cover-page scoped.
    """
    css = scoped_css

    # Color → grayscale mapping for the cover page
    color_replacements = {
        # Primary blues/cyans → dark grays
        '#2563EB': '#1a1a1a',
        '#3B82F6': '#333333',
        '#06B6D4': '#444444',
        # Magenta → medium gray
        '#EC4899': '#555555',
        # Teal → medium-dark gray
        '#14B8A6': '#555555',
        # Amber → medium gray
        '#F59E0B': '#666666',
        # Dark backgrounds → lighter for mono
        '#0F172A': '#1a1a1a',
        '#0B1120': '#111111',
        '#0D1526': '#151515',
        # Surface colors
        '#1E293B': '#2a2a2a',
        '#334155': '#3a3a3a',
        # Text colors
        '#E2E8F0': '#d0d0d0',
        '#94A3B8': '#999999',
        '#64748B': '#777777',
        # White stays white
        '#FFFFFF': '#FFFFFF',
    }

    for color, mono in color_replacements.items():
        # Case-insensitive replacement for hex colors
        css = re.sub(re.escape(color), mono, css, flags=re.IGNORECASE)

    # Replace rgba() color values with grayscale equivalents
    # Cyan glow: rgba(6, 182, 212, ...) → rgba(80, 80, 80, ...)
    css = re.sub(r'rgba\(\s*6\s*,\s*182\s*,\s*212\s*,', 'rgba(80, 80, 80,', css)
    # Blue glow: rgba(37, 99, 235, ...) → rgba(50, 50, 50, ...)
    css = re.sub(r'rgba\(\s*37\s*,\s*99\s*,\s*235\s*,', 'rgba(50, 50, 50,', css)
    # Magenta glow: rgba(236, 72, 153, ...) → rgba(90, 90, 90, ...)
    css = re.sub(r'rgba\(\s*236\s*,\s*72\s*,\s*153\s*,', 'rgba(90, 90, 90,', css)
    # Black with alpha: keep as-is (already grayscale)

    # Replace gradient backgrounds with grayscale
    # linear-gradient(170deg, #0F172A 0%, #0B1120 40%, #0D1526 70%, #0F172A 100%)
    # → linear-gradient(170deg, #1a1a1a 0%, #111111 40%, #151515 70%, #1a1a1a 100%)
    # Already handled by hex replacements above

    # Replace the gradient text on cover title
    # linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 40%, #06B6D4 100%)
    # → linear-gradient(180deg, #FFFFFF 0%, #d0d0d0 40%, #444444 100%)
    # Already handled by hex replacements above

    # Remove glow/shadow effects that use colored light
    # text-shadow with colored glow → simple gray shadow
    css = re.sub(
        r'text-shadow:\s*[^;]+;',
        'text-shadow: 0 0 20px rgba(100,100,100,0.3), 0 0 40px rgba(80,80,80,0.15);',
        css,
    )

    # Remove box-shadow glow effects on icon-frame (replace with simple gray)
    css = re.sub(
        r'0 0 20px var\(--cyan-glow\)',
        '0 0 10px rgba(80,80,80,0.3)',
        css,
    )
    css = re.sub(
        r'0 0 40px rgba\([^)]+\)',
        '0 0 20px rgba(60,60,60,0.2)',
        css,
    )

    # Replace cyan glow variable references
    css = css.replace('var(--cyan-glow)', 'rgba(80, 80, 80, 0.3)')
    css = css.replace('var(--cyan-dim)', 'rgba(80, 80, 80, 0.15)')

    return css


def extract_cover_body(html: str) -> str:
    """Extract the inner HTML from <body>...</body> of the cover page."""
    m = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
    return m.group(1).strip() if m else ""


def extract_cover_style(html: str) -> str:
    """Extract the CSS from <style>...</style> of the cover page."""
    m = re.search(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
    return m.group(1).strip() if m else ""


def fix_cover_image_paths(html_body: str) -> str:
    """
    In the combined HTML (living in build/html/), image paths to diagrams
    must be relative to build/html/, so build/diagrams/ → ../diagrams/
    """
    html_body = html_body.replace("build/diagrams/", "../diagrams/")
    return html_body


def merge_cover_with_guide(guide_html_path: Path, cover_html_path: Path, output_path: Path, css_path: Path = None, monochrome: bool = False):
    """
    Create a merged HTML file with the cover page as page 1 and guide content
    on subsequent pages. Cover CSS is fully scoped to .cover-page to prevent
    it from breaking the guide layout.

    If monochrome=True, the cover CSS is also transformed to grayscale.
    """
    label = " (monochrome)" if monochrome else ""
    log(f"[3/7] Merging cover page with guide content{label}...", "STEP")

    if not cover_html_path.exists():
        log(f"Cover not found: {cover_html_path}, copying guide without cover", "WARN")
        shutil.copy2(guide_html_path, output_path)
        return

    guide_html = guide_html_path.read_text(encoding="utf-8")
    cover_html = cover_html_path.read_text(encoding="utf-8")

    # Extract and scope cover CSS
    raw_cover_css = extract_cover_style(cover_html)
    scoped_cover_css = scope_cover_css(raw_cover_css)

    # Apply monochrome transformation if requested
    if monochrome:
        scoped_cover_css = mono_cover_css(scoped_cover_css)

    # Extract and fix cover body content
    cover_body = extract_cover_body(cover_html)
    cover_body = fix_cover_image_paths(cover_body)

    # If a different CSS file is provided (e.g., monochrome), replace the embedded CSS
    if css_path and css_path.exists():
        custom_css = css_path.read_text(encoding="utf-8")
        # Replace the guide's embedded <style> content with the custom CSS
        # The guide HTML has the CSS in <style type="text/css">...</style>
        guide_html = re.sub(
            r'(<style type="text/css">)(.*?)(</style>)',
            rf'\1\n{re.escape(custom_css)}\n\3',
            guide_html,
            count=1,
            flags=re.DOTALL,
        )

    # Add scoped cover CSS as a separate <style> block in <head>
    # Insert before </head>
    cover_label = "monochrome" if monochrome else "colored"
    cover_style_block = f"\n<style>\n/* ── Cover Page Styles (scoped to .cover-page, {cover_label}) ── */\n{scoped_cover_css}\n</style>\n"
    guide_html = guide_html.replace("</head>", f"{cover_style_block}</head>")

    # Insert cover page as first element in <body>
    # The .cover-page div wraps all cover content with page-break-after: always
    cover_div = (
        f'<div class="cover-page" style="page-break-after: always;">'
        f'\n{cover_body}\n'
        f'</div>\n'
    )
    guide_html = guide_html.replace("<body>", f"<body>\n{cover_div}", 1)

    output_path.write_text(guide_html, encoding="utf-8")
    log(f"{output_path}")


# ── Step 4: Build PDF via WeasyPrint ──────────────────────────
def build_pdf(combined_html: Path, output_name: str = "guide.pdf") -> Path:
    log("[4/7] Building PDF...", "STEP")
    out = BUILD_PDF / output_name

    if not shutil.which("weasyprint"):
        log("weasyprint not found, trying pandoc fallback", "WARN")
        # Fallback: pandoc → LaTeX → PDF
        assembled_md = BUILD_MD / "guide.md"
        if shutil.which("pandoc") and assembled_md.exists():
            cmd = [
                "pandoc", str(assembled_md),
                "-f", "markdown+yaml_metadata_block+tex_math_dollars",
                "--pdf-engine=xelatex",
                "-V", "geometry:margin=2.5cm",
                "-V", "fontsize=11pt",
                "-V", "mainfont=DejaVu Sans",
                "-V", "monofont=DejaVu Sans Mono",
                "-o", str(out),
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                log(f"{out} (Pandoc/LaTeX)")
                return out
        log("PDF generation failed — install weasyprint: pip install weasyprint", "FAIL")
        return out

    result = subprocess.run(
        ["weasyprint", str(combined_html), str(out)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        log(f"WeasyPrint error: {result.stderr[:500]}", "FAIL")
    else:
        log(f"{out}")
    return out


# ── Step 5: Build LaTeX ──────────────────────────────────────
def build_latex(assembled_md: Path) -> Path:
    log("[5/7] Building LaTeX...", "STEP")
    out = BUILD_LATEX / "guide.tex"

    if not shutil.which("pandoc"):
        log("pandoc not found, skipping LaTeX", "WARN")
        return out

    cmd = [
        "pandoc", str(assembled_md),
        "-f", "markdown+yaml_metadata_block+tex_math_dollars",
        "-t", "latex",
        "--resource-path", f"{BUILD_MD}:{BUILD}:{SRC}",
        "-V", "geometry:margin=2.5cm",
        "-V", "fontsize=11pt",
        "-o", str(out),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        log(f"pandoc LaTeX error: {result.stderr}", "FAIL")
    else:
        log(f"{out}")
    return out


# ── Step 6: Build DOCX ───────────────────────────────────────
def build_docx(assembled_md: Path) -> Path:
    log("[6/7] Building DOCX...", "STEP")
    out = BUILD_DOCX / "guide.docx"

    if not shutil.which("pandoc"):
        log("pandoc not found, skipping DOCX", "WARN")
        return out

    cmd = [
        "pandoc", str(assembled_md),
        "-f", "markdown+yaml_metadata_block+tex_math_dollars",
        "-t", "docx",
        "--resource-path", f"{BUILD_MD}:{BUILD}:{SRC}",
        "-o", str(out),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        log(f"pandoc DOCX error: {result.stderr}", "FAIL")
    else:
        log(f"{out}")
    return out


# ── Step 7: Build monochrome variant ──────────────────────────
def build_monochrome(assembled_md: Path):
    """Build monochrome HTML and PDF using style-mono.css."""
    log("[7/7] Building monochrome variants...", "STEP")

    if not SRC_STYLE_MONO.exists():
        log(f"Monochrome CSS not found: {SRC_STYLE_MONO}", "WARN")
        return

    # Build HTML with mono CSS
    mono_html = build_html(assembled_md, SRC_STYLE_MONO, "guide_mono.html")

    # Merge cover with monochrome styling (monochrome=True applies mono cover CSS)
    mono_combined = BUILD_HTML / "guide_mono_with_cover.html"
    merge_cover_with_guide(mono_html, SRC_COVER, mono_combined, css_path=SRC_STYLE_MONO, monochrome=True)

    # Build mono PDF
    build_pdf(mono_combined, "guide_mono.pdf")


# ── Main ──────────────────────────────────────────────────────
def main():
    fmt = sys.argv[1] if len(sys.argv) > 1 else "all"

    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  Bathroom Emergency Guide — Builder v{VERSION}")
    print(f"  Format: {fmt}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()

    ensure_dirs()

    # Step 1: Always assemble markdown
    assembled_md = assemble_markdown()

    if fmt in ("all", "html", "pdf"):
        # Step 2: Build base HTML
        guide_html = build_html(assembled_md, SRC_STYLE)

    if fmt in ("all", "pdf"):
        # Step 3: Merge cover + guide
        combined_html = BUILD_HTML / "guide_with_cover.html"
        merge_cover_with_guide(guide_html, SRC_COVER, combined_html)

        # Step 4: Build PDF
        build_pdf(combined_html)

    if fmt in ("all", "latex"):
        # Step 5: Build LaTeX
        build_latex(assembled_md)

    if fmt in ("all", "docx"):
        # Step 6: Build DOCX
        build_docx(assembled_md)

    if fmt == "all":
        # Step 7: Build monochrome variants
        build_monochrome(assembled_md)
    elif fmt == "mono":
        build_monochrome(assembled_md)

    if fmt == "md":
        log(f"Markdown assembled at {assembled_md}")

    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  Build complete.")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")


if __name__ == "__main__":
    main()
