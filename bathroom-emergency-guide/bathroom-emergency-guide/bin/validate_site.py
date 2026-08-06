#!/usr/bin/env python3
"""Validate the self-contained landing, deployment, download, and Pages contract."""
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from project_meta import VERSION

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "build" / "site"
DEPLOYMENT = ROOT / "DEPLOYMENT.md"
SUBGUIDES = ROOT / "src" / "data" / "subguides.json"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        for attr in ("href", "src"):
            value = values.get(attr)
            if value:
                self.references.append((attr, value))


def local_target(page: Path, reference: str) -> Path | None:
    if reference.startswith(("mailto:", "tel:", "data:", "javascript:")):
        return None
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = unquote(parsed.path)
    target = (page.parent / path).resolve()
    if path.endswith("/"):
        target = target / "index.html"
    return target


core_pages = {
    "landing": SITE / "index.html",
    "deployment": SITE / "deploy" / "index.html",
    "downloads": SITE / "downloads" / "index.html",
    "not-found": SITE / "404.html",
}
for label, page in core_pages.items():
    check(page.exists() and page.stat().st_size > 0, f"{label} page missing or empty")

for path in (
    SITE / ".nojekyll",
    SITE / "assets" / "site.css",
    SITE / "assets" / "site.js",
    SITE / "assets" / "mark.svg",
    SITE / "site.webmanifest",
    SITE / "robots.txt",
    SITE / "guide" / "index.html",
    SITE / "routes" / "index.html",
    SITE / "files" / "guide.pdf",
    SITE / "files" / "guide_mono.pdf",
    SITE / "files" / "guide_a4half.pdf",
    SITE / "files" / "guide_a4half_mono.pdf",
    SITE / "files" / "guide_largeprint.pdf",
    SITE / "files" / "guide_largeprint_mono.pdf",
    SITE / "docs" / "README.md",
    SITE / "docs" / "DEPLOYMENT.md",
    SITE / "docs" / "CHANGELOG.md",
    SITE / "meta" / "release.json",
):
    check(path.exists(), f"Pages package artifact missing: {path.relative_to(ROOT)}")

landing_markers = (
    f"Release {VERSION}",
    "Useful before heroic.",
    "Choose your next move.",
    "A shelf, not a diagnostic maze.",
    "A PDF on a shelf is not resilience.",
    "The source trail stays attached.",
    "data-theme-toggle",
    "No tracking",
    "href=\"guide/\"",
    "href=\"routes/\"",
    "href=\"downloads/\"",
    "href=\"deploy/\"",
    "bathroom_emergency@fkr.dev",
    "Open feedback template",
    "figures, including local references",
)
deployment_markers = (
    "Minimum viable deployment",
    "data-deployment-planner",
    "Local-only by design",
    "Classify before you print.",
    "GitHub Pages deployment is prepared, not presumed.",
    "data-copy-plan",
    "data-reset-plan",
    "../files/guide.pdf",
    "../docs/DEPLOYMENT.md",
)
download_markers = (
    f"Release {VERSION} download catalogue",
    "Master editions",
    "The eleven individual books",
    "Source, evidence, and maintenance",
    "data-download-filter=\"master\"",
    "../files/guide.pdf",
    "../routes/O/green-book-body-owners-manual.pdf",
    "../routes/A/amber-book-responsibility.pdf",
    "../routes/B/teal-book-calm-guide.pdf",
    "../routes/C/red-book-self-ambulance.pdf",
    "../routes/D/blue-book-safety-no-place.pdf",
    "../routes/H/orange-book-natural-disasters.pdf",
    "../routes/Z/olive-book-zombie-guide.pdf",
    "../routes/P/indigo-book-professional-support.pdf",
    "../routes/S/purple-book-social-field-guide.pdf",
    "../routes/T/grey-book-templates-forms.pdf",
    "../routes/R/copper-book-reference.pdf",
    "../routes/T/grey-book-templates-forms.html#beg-t-f-005",
    "Feedback template",
    "../meta/release.json",
)
for page, markers in (
    (core_pages["landing"], landing_markers),
    (core_pages["deployment"], deployment_markers),
    (core_pages["downloads"], download_markers),
):
    if not page.exists():
        continue
    text = page.read_text(encoding="utf-8")
    for marker in markers:
        check(marker in text, f"{page.relative_to(ROOT)} marker missing: {marker}")
    check("<main id=\"main\">" in text, f"{page.relative_to(ROOT)} lacks main landmark")
    check("class=\"skip-link\"" in text, f"{page.relative_to(ROOT)} lacks skip link")
    check("aria-label=\"Primary\"" in text, f"{page.relative_to(ROOT)} lacks primary navigation label")

# Core pages must be internally navigable without network assets.
for label, page in core_pages.items():
    if not page.exists():
        continue
    parser = LinkParser()
    parser.feed(page.read_text(encoding="utf-8"))
    for attr, reference in parser.references:
        target = local_target(page, reference)
        if target is None:
            continue
        check(
            target == SITE or SITE in target.parents,
            f"{label} {attr} escapes Pages package: {reference}",
        )
        check(target.exists(), f"{label} broken local {attr}: {reference}")

if SUBGUIDES.exists():
    subguides = json.loads(SUBGUIDES.read_text(encoding="utf-8"))
    by_id = {node["id"]: node for node in subguides["nodes"]}
    for node_id in subguides["standalone_nodes"]:
        node = by_id[node_id]
        base = SITE / "routes" / node_id
        for suffix in (".html", ".pdf", "_a4half.pdf", "_largeprint.pdf"):
            check(
                (base / f'{node["slug"]}{suffix}').exists(),
                f"Pages package missing {node_id} route artifact: {node['slug']}{suffix}",
            )

meta_path = SITE / "meta" / "release.json"
if meta_path.exists():
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    reference_registry = json.loads(
        (ROOT / "src" / "data" / "reference_ids.json").read_text(encoding="utf-8")
    )
    expected_active_references = len(reference_registry.get("ids", {})) - len(
        reference_registry.get("retired_resource_keys", [])
    )
    check(meta.get("release") == VERSION, "site release metadata version drifted")
    check(meta.get("published_by_this_build") is False, "site metadata falsely claims publication")
    check(meta.get("deployment_performed_by_this_build") is False, "site metadata falsely claims deployment")
    metrics = meta.get("metrics", {})
    check(metrics.get("chapters") == 17, "site chapter metric drifted")
    check(metrics.get("standalone") == 11, "site standalone metric drifted")
    check(
        metrics.get("references") == expected_active_references,
        "site active stable-reference metric drifted",
    )
    check(metrics.get("figures") == 49, "site public figure metric drifted")
    check(metrics.get("authored_visuals") == 41, "site authored-visual metric drifted")
    check(metrics.get("standalone_pdf_editions") == 66, "site standalone PDF metric drifted")

check(
    not list((SITE / "routes" / "T").glob("templates-blue-book*")),
    "Pages package retained obsolete templates-blue-book output aliases",
)

css = SITE / "assets" / "site.css"
js = SITE / "assets" / "site.js"
if css.exists():
    text = css.read_text(encoding="utf-8")
    for marker in ("prefers-reduced-motion", "prefers-color-scheme", "@media print", ".route-grid", ".planner-layout"):
        check(marker in text, f"site stylesheet marker missing: {marker}")
if js.exists():
    text = js.read_text(encoding="utf-8")
    for marker in ("localStorage", "data-deployment-planner", "data-download-filter", "navigator.clipboard"):
        check(marker in text, f"site script marker missing: {marker}")
    check("fetch(" not in text and "XMLHttpRequest" not in text, "site script introduces a network request")

check(DEPLOYMENT.exists(), "deployment instructions missing")
if DEPLOYMENT.exists():
    text = DEPLOYMENT.read_text(encoding="utf-8").lower()
    for marker in (
        "minimum viable deployment",
        "canonical deployment-field index",
        "object- and person-specific safe places",
        "physical installation concepts",
        "additional deployables",
        "build from source",
        "maintenance cycle",
        "privacy",
        "bathroom_emergency@fkr.dev",
    ):
        check(marker in text, f"deployment marker missing: {marker}")

if errors:
    raise SystemExit("Landing/deployment validation failed:\n- " + "\n- ".join(errors))
print(
    "Landing/deployment validation passed: responsive project, deployment, "
    "downloads, guide, route, offline-asset, privacy, and Pages-package contracts are present."
)
