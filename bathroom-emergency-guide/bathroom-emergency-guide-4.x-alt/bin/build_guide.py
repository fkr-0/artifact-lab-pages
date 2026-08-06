"""Build Bathroom Emergency Guide v4-alt.

Manifest-driven build supporting per-subguide and combined output
in A4 (color/mono), A4/2 (color/mono), and large-print (color/mono) PDF.

Usage:
    python build_guide.py [--subguide NAME] [--target md|html|pdf|all]
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
BUILD = ROOT / "build"
MANIFEST_PATH = SRC / "data" / "subguide_manifest.json"
TEMPLATE = SRC / "template.html"
STYLES_DIR = SRC / "styles"
HUB_DIR = SRC / "hub"
EMERGENCY_GATE_FILE = HUB_DIR / "00-cover.md"
VERSION = "4.0.0-alt.3"

LAYOUTS = ("a4", "a4half", "largeprint")


class BuildError(RuntimeError):
    pass


def note(msg: str) -> None:
    print(f"  {msg}")


def git_short_hash() -> str:
    try:
        r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                           capture_output=True, text=True, cwd=ROOT)
        return r.stdout.strip() if r.returncode == 0 else "dev"
    except FileNotFoundError:
        return "dev"


def build_date() -> str:
    return datetime.date.today().isoformat()


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                            env={**os.environ, "PYTHONUTF8": "1"})
    if check and result.returncode:
        raise BuildError(f"{' '.join(cmd)}\n{(result.stderr or result.stdout).strip()}")
    return result


def require(binary: str) -> str:
    found = shutil.which(binary)
    if not found:
        raise BuildError(f"Required: {binary}")
    return found


def strip_frontmatter(text: str) -> str:
    return re.sub(r"\A---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


SUBGUIDE_ABBREVS = {
    "calm": "calm", "ambulance": "amb", "responsibility": "resp",
    "safety": "safe", "zombie": "zomb", "support": "supp",
    "appendix": "app", "body": "body", "social": "soc",
    "disaster": "dis", "templates": "tmpl",
}


def inject_section_refs(text: str, subguide_key: str) -> str:
    abbr = SUBGUIDE_ABBREVS.get(subguide_key, subguide_key[:4])
    h1_n = 0
    h2_n = 0
    h3_n = 0
    lines = text.split("\n")
    out = []
    for line in lines:
        if line.startswith("# ") and not line.startswith("# "):
            pass
        if re.match(r"^# [^#]", line):
            h1_n += 1
            h2_n = 0
            h3_n = 0
            ref = f"[{abbr}.{h1_n}]"
            out.append(f"{line} {{.ref-tagged}}")
            out.append(f"::: {{.section-ref}}\n{ref}\n:::")
        elif re.match(r"^## [^#]", line):
            h2_n += 1
            h3_n = 0
            ref = f"[{abbr}.{h1_n}.{h2_n}]"
            out.append(f"{line} {{.ref-tagged}}")
            out.append(f"::: {{.section-ref}}\n{ref}\n:::")
        elif re.match(r"^### [^#]", line):
            h3_n += 1
            ref = f"[{abbr}.{h1_n}.{h2_n}.{h3_n}]"
            out.append(line)
            out.append(f"::: {{.section-ref}}\n{ref}\n:::")
        else:
            out.append(line)
    return "\n".join(out)


def variant_stem(key: str, *, monochrome: bool, layout: str) -> str:
    parts = ["guide"]
    if layout != "a4":
        parts.append(layout)
    if monochrome:
        parts.append("mono")
    return "_".join(parts)


def assemble_subguide(key: str, manifest: dict) -> Path:
    entry = manifest[key]
    out_dir = BUILD / key
    out_dir.mkdir(parents=True, exist_ok=True)

    parts = [
        "---",
        f'title: "{entry["title"]}"',
        f'version: "{VERSION}"',
        'lang: "en"',
        "---",
        "",
    ]

    gate_text = strip_frontmatter(EMERGENCY_GATE_FILE.read_text(encoding="utf-8")).strip()
    parts.extend(["::: {.emergency-gate}", "", gate_text, "", ":::", ""])

    chapter_bodies = []
    for ch_path in entry["chapters"]:
        full_path = SRC / ch_path
        if not full_path.exists():
            raise BuildError(f"Missing chapter: {full_path}")
        chapter_bodies.append(strip_frontmatter(full_path.read_text(encoding="utf-8")).strip())

    all_chapter_text = "\n\n".join(chapter_bodies)
    tagged = inject_section_refs(all_chapter_text, key)

    parts.extend([f"::: {{.chapter .subguide-{key}}}", "", tagged, "", ":::", ""])

    src_path = SRC / entry["sources"]
    if src_path.exists():
        body = strip_frontmatter(src_path.read_text(encoding="utf-8")).strip()
        parts.extend(["::: {.sources}", "", body, "", ":::", ""])

    ver_path = SRC / entry["version"]
    if ver_path.exists():
        body = strip_frontmatter(ver_path.read_text(encoding="utf-8")).strip()
        parts.extend(["::: {.version-info}", "", body, "", ":::", ""])

    rev_line = f"v{VERSION} · {git_short_hash()} · {build_date()}"
    parts.extend([
        '::: {.revision-stamp role="doc-notice"}',
        "", rev_line, "",
        ":::", "",
    ])

    output = out_dir / "guide.md"
    output.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
    note(f"assembled {key} → {output.relative_to(ROOT)}")
    return output


def assemble_combined(manifest: dict) -> Path:
    out_dir = BUILD / "combined"
    out_dir.mkdir(parents=True, exist_ok=True)

    parts = [
        "---",
        'title: "Bathroom Emergency Guide"',
        f'version: "{VERSION}"',
        'lang: "en"',
        "---",
        "",
    ]

    for hub_file in sorted(HUB_DIR.glob("*.md")):
        body = strip_frontmatter(hub_file.read_text(encoding="utf-8")).strip()
        slug = hub_file.stem
        parts.extend([f"::: {{#{slug} .hub}}", "", body, "", ":::", ""])

    order = ["calm", "ambulance", "responsibility", "safety", "zombie",
             "support", "appendix", "body", "social", "disaster", "templates"]
    for key in order:
        if key not in manifest:
            continue
        entry = manifest[key]
        chapter_bodies = []
        for ch_path in entry["chapters"]:
            full_path = SRC / ch_path
            if not full_path.exists():
                raise BuildError(f"Missing: {full_path}")
            chapter_bodies.append(strip_frontmatter(full_path.read_text(encoding="utf-8")).strip())
        all_text = "\n\n".join(chapter_bodies)
        tagged = inject_section_refs(all_text, key)
        parts.extend([f"::: {{.chapter .subguide-{key}}}", "", tagged, "", ":::", ""])
        src_path = SRC / entry["sources"]
        if src_path.exists():
            body = strip_frontmatter(src_path.read_text(encoding="utf-8")).strip()
            parts.extend([f"::: {{.sources .subguide-{key}}}", "", body, "", ":::", ""])

    rev_line = f"v{VERSION} · {git_short_hash()} · {build_date()}"
    parts.extend([
        '::: {.revision-stamp role="doc-notice"}',
        "", rev_line, "",
        ":::", "",
    ])

    output = out_dir / "guide.md"
    output.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
    note(f"assembled combined → {output.relative_to(ROOT)}")
    return output


def combined_css(subguide_key: str | None = None, *,
                 monochrome: bool = False, layout: str = "a4") -> Path:
    tokens = (STYLES_DIR / "tokens.css").read_text(encoding="utf-8")
    base = (STYLES_DIR / "base.css").read_text(encoding="utf-8")

    theme = ""
    if subguide_key:
        theme_file = STYLES_DIR / f"theme-{subguide_key}.css"
        if theme_file.exists():
            theme = theme_file.read_text(encoding="utf-8")

    extra = ""
    if layout == "a4half":
        extra += "\n\n" + (STYLES_DIR / "print-a4half.css").read_text(encoding="utf-8")
    if layout == "largeprint":
        extra += "\n\n" + (STYLES_DIR / "print-largeprint.css").read_text(encoding="utf-8")
    if monochrome:
        extra += "\n\n" + (STYLES_DIR / "print-mono.css").read_text(encoding="utf-8")

    out_dir = BUILD / (subguide_key or "combined")
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = variant_stem(subguide_key or "combined", monochrome=monochrome, layout=layout)
    css_path = out_dir / f"{stem}.css"
    css_path.write_text(f"{tokens}\n\n{theme}\n\n{base}{extra}", encoding="utf-8")
    return css_path


def build_html(markdown: Path, subguide_key: str | None = None, *,
               monochrome: bool = False, layout: str = "a4") -> Path:
    pandoc = require("pandoc")
    css = combined_css(subguide_key, monochrome=monochrome, layout=layout)
    out_dir = BUILD / (subguide_key or "combined")
    stem = variant_stem(subguide_key or "combined", monochrome=monochrome, layout=layout)
    output = out_dir / f"{stem}.html"
    cmd = [
        pandoc, str(markdown),
        "--from=markdown+yaml_metadata_block+tex_math_dollars+footnotes+fenced_divs+link_attributes",
        "--to=html5", "--standalone",
        "--template", str(TEMPLATE),
        "--toc", "--toc-depth=2", "--mathml", "--embed-resources",
        f"--css={css.name}",
        "--resource-path", os.pathsep.join([str(out_dir), str(BUILD), str(SRC), str(ROOT)]),
        "--metadata", f"guide-version={VERSION}",
        "--metadata", f"print-mode={'mono' if monochrome else 'color'}",
        "--metadata", f"print-layout={layout}",
        "--output", str(output),
    ]
    run(cmd)
    note(f"built {'mono' if monochrome else 'color'} {layout} HTML → {output.relative_to(ROOT)}")
    return output


def chrome_available() -> bool:
    node = shutil.which("node")
    script = ROOT / "bin" / "chrome_pdf.mjs"
    if not node or not script.exists():
        return False
    probe = run([node, "-e",
                 "import('playwright').then(()=>process.exit(0)).catch(()=>process.exit(1))"],
                check=False)
    return probe.returncode == 0


def build_pdf(html: Path, subguide_key: str | None = None, *,
              monochrome: bool = False, layout: str = "a4") -> Path:
    if not chrome_available():
        raise BuildError("Playwright/Chrome not available for PDF rendering")
    out_dir = BUILD / (subguide_key or "combined")
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = variant_stem(subguide_key or "combined", monochrome=monochrome, layout=layout)
    pdf_path = out_dir / f"{stem}.pdf"
    result = run(
        [require("node"), str(ROOT / "bin" / "chrome_pdf.mjs"),
         str(html), str(pdf_path), VERSION, layout],
        check=False,
    )
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise BuildError(f"Chrome PDF failed: {detail}")
    note(f"built {'mono' if monochrome else 'color'} {layout} PDF → {pdf_path.relative_to(ROOT)}")
    return pdf_path


def build_all_variants(markdown: Path, subguide_key: str | None = None) -> None:
    for layout in LAYOUTS:
        for monochrome in (False, True):
            html = build_html(markdown, subguide_key, monochrome=monochrome, layout=layout)
            build_pdf(html, subguide_key, monochrome=monochrome, layout=layout)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build Bathroom Emergency Guide v4-alt (manifest-driven)."
    )
    parser.add_argument("--subguide", type=str, default=None,
                        help="Build a single subguide (e.g. 'calm')")
    parser.add_argument("--target", type=str, default="all",
                        choices=["md", "html", "pdf", "all"])
    parser.add_argument("--layout", type=str, default="a4",
                        choices=["a4", "a4half", "largeprint", "all"])
    parser.add_argument("--mono", action="store_true",
                        help="Build monochrome variant")
    args = parser.parse_args()

    manifest = load_manifest()

    if args.subguide:
        if args.subguide not in manifest:
            print(f"Unknown subguide: {args.subguide}", file=sys.stderr)
            return 2
        md = assemble_subguide(args.subguide, manifest)
        if args.target == "md":
            return 0
        if args.target == "all":
            build_all_variants(md, args.subguide)
            return 0
        layouts = LAYOUTS if args.layout == "all" else (args.layout,)
        monos = (False, True) if args.target == "pdf" and not args.mono else (args.mono,)
        for layout in layouts:
            for mono in monos:
                html = build_html(md, args.subguide, monochrome=mono, layout=layout)
                if args.target in ("pdf", "all"):
                    build_pdf(html, args.subguide, monochrome=mono, layout=layout)
        return 0
    else:
        md = assemble_combined(manifest)
        if args.target == "md":
            return 0
        if args.target == "all":
            build_all_variants(md)
            return 0
        layouts = LAYOUTS if args.layout == "all" else (args.layout,)
        monos = (False, True) if args.target == "pdf" and not args.mono else (args.mono,)
        for layout in layouts:
            for mono in monos:
                html = build_html(md, monochrome=mono, layout=layout)
                if args.target in ("pdf", "all"):
                    build_pdf(html, monochrome=mono, layout=layout)
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BuildError as exc:
        print(f"BUILD FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
