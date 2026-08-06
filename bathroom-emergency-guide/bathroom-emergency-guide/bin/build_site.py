#!/usr/bin/env python3
"""Build a self-contained, GitHub Pages-ready project and deployment site."""
from __future__ import annotations

import html
import json
import os
import shutil
from pathlib import Path

from project_meta import VERSION, build_date, git_revision

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
OUT = BUILD / "site"
DATA = ROOT / "src" / "data"

MASTER_FILES = (
    "guide.html",
    "guide_mono.html",
    "guide_a4half.html",
    "guide_a4half_mono.html",
    "guide_largeprint.html",
    "guide_largeprint_mono.html",
)
MASTER_PDFS = tuple(name.replace(".html", ".pdf") for name in MASTER_FILES)


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def copy(path: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)


def route_cards(nodes: list[dict], released: set[str], prefix: str) -> str:
    cards: list[str] = []
    for node in nodes:
        node_id = node["id"]
        is_released = node_id in released
        status = "Individual book" if is_released else "Complete guide"
        href = (
            f'{prefix}routes/{esc(node_id)}/{esc(node["slug"])}.html'
            if is_released
            else f"{prefix}guide/"
        )
        cards.append(
            f'''<a class="route-card" href="{href}" style="--route:{esc(node['colour'])}" data-route="{esc(node_id)}">
  <span class="route-code">{esc(node_id)}</span>
  <span class="route-status">{status}</span>
  <strong>{esc(node['title'])}</strong>
  <span>{esc(node['promise'])}</span>
  <span class="route-open">Open book <span aria-hidden="true">↗</span></span>
</a>'''
        )
    return "\n".join(cards)


def nav(prefix: str, active: str) -> str:
    items = (
        ("home", "Project", f"{prefix}index.html"),
        ("guide", "Guide", f"{prefix}guide/"),
        ("routes", "Books", f"{prefix}routes/"),
        ("downloads", "Downloads", f"{prefix}downloads/"),
        ("deploy", "Deploy", f"{prefix}deploy/"),
    )
    links = "".join(
        f'<a href="{href}"{(" aria-current=\"page\"" if key == active else "")}>{label}</a>'
        for key, label, href in items
    )
    return f'''<header class="site-header">
  <a class="brand" href="{prefix}index.html" aria-label="Bathroom Emergency Guide home">
    <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
    <span><strong>Bathroom Emergency</strong><small>Guide & deployment kit</small></span>
  </a>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
  <nav id="site-nav" class="site-nav" aria-label="Primary">{links}</nav>
  <button class="theme-toggle" type="button" data-theme-toggle aria-label="Change colour theme"><span aria-hidden="true">◐</span><span class="theme-label">Theme</span></button>
</header>'''


def emergency_strip() -> str:
    return '''<aside class="emergency-strip" aria-label="Emergency notice">
  <span class="pulse-dot" aria-hidden="true"></span>
  <strong>Immediate danger in Germany?</strong>
  <span>Call <a href="tel:112">112</a> for fire, rescue, or life danger; <a href="tel:110">110</a> for active crime or threat.</span>
  <span class="emergency-limit">Do not read a website first.</span>
</aside>'''


def page_head(title: str, description: str, prefix: str) -> str:
    return f'''<!doctype html>
<html lang="en" data-theme="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="#112923">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="{prefix}assets/mark.svg" type="image/svg+xml">
  <link rel="manifest" href="{prefix}site.webmanifest">
  <link rel="stylesheet" href="{prefix}assets/site.css">
  <script defer src="{prefix}assets/site.js"></script>
  <title>{esc(title)}</title>
</head>'''


def footer(prefix: str, revision: str, date: str) -> str:
    return f'''<footer class="site-footer">
  <div>
    <a class="brand footer-brand" href="{prefix}index.html"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span><strong>Bathroom Emergency</strong><small>Useful before heroic.</small></span></a>
    <p>Observation, routing, first actions, preparation, and handoff. Not diagnosis, certification, or a substitute for emergency services.</p>
  </div>
  <div class="footer-links">
    <a href="{prefix}guide/">Complete guide</a>
    <a href="{prefix}downloads/">Downloads</a>
    <a href="{prefix}deploy/">Deployment planner</a>
    <a href="{prefix}docs/CHANGELOG.md">Changelog</a>
    <a href="mailto:bathroom_emergency@fkr.dev">Feedback</a>
  </div>
  <div class="build-stamp"><span>Release {esc(VERSION)}</span><span>{esc(revision)}</span><span>Built {esc(date)}</span></div>
</footer>'''


def landing_page(nodes: list[dict], released: set[str], metrics: dict, revision: str, date: str) -> str:
    return f'''{page_head("Bathroom Emergency Guide — useful before heroic", "A sourced, printable, locally deployable decision guide for bathroom-sized emergencies.", "")}
<body>
<a class="skip-link" href="#main">Skip to content</a>
{nav("", "home")}
{emergency_strip()}
<main id="main">
  <section class="hero shell">
    <div class="hero-copy">
      <div class="eyebrow"><span>Release {esc(VERSION)}</span><span>Offline-capable</span><span>No tracking</span></div>
      <h1>Useful<br><em>before</em> heroic.</h1>
      <p class="lede">A calm, sourced field guide for moments when the room is small, attention is narrow, and the next useful action should not depend on remembering an entire course, website, or phone tree.</p>
      <div class="hero-actions">
        <a class="button primary" href="guide/">Open the complete guide <span aria-hidden="true">→</span></a>
        <a class="button secondary" href="deploy/">Plan a local installation</a>
      </div>
      <p class="microcopy">The online guide supports decisions; it never creates a reading queue before emergency help.</p>
    </div>
    <div class="instrument" aria-label="Decision model preview">
      <div class="instrument-head"><span>Small-room observatory</span><span class="status-live">Ready</span></div>
      <ol>
        <li><span>01</span><div><strong>Notice</strong><small>Body · room · attention</small></div></li>
        <li><span>02</span><div><strong>Route</strong><small>Choose the system that can change the problem</small></div></li>
        <li><span>03</span><div><strong>Act</strong><small>One next action · one backup · one handoff</small></div></li>
      </ol>
      <div class="instrument-foot"><span>Local facts stay local</span><span>Print remains first-class</span></div>
    </div>
  </section>

  <section class="metrics shell" aria-label="Release metrics">
    <div><strong>{metrics['chapters']}</strong><span>canonical chapters</span></div>
    <div><strong>{metrics['standalone']}</strong><span>individual colour books</span></div>
    <div><strong>{metrics['references']}</strong><span>stable public references</span></div>
    <div><strong>{metrics['figures']}</strong><span>figures, including local references</span></div>
  </section>

  <section class="shell section-block" aria-labelledby="next-move">
    <div class="section-heading"><div><span class="eyebrow">Start where the task is</span><h2 id="next-move">Choose your next move.</h2></div><p>No account, app, or network request is required. The release is built as HTML, PDF, editable source, and eleven books that can leave the shelf one at a time.</p></div>
    <div class="action-grid">
      <a class="action-card action-guide" href="guide/"><span class="action-index">01</span><div><strong>Use the guide now</strong><p>Open the responsive complete edition and route from the actual problem.</p></div><span aria-hidden="true">↗</span></a>
      <a class="action-card action-routes" href="routes/"><span class="action-index">02</span><div><strong>Open one book</strong><p>Pick by colour and title: body, responsibility, calm, first aid, safety, disaster, continuity, professional support, social life, figures and templates, or reference.</p></div><span aria-hidden="true">↗</span></a>
      <a class="action-card action-download" href="downloads/"><span class="action-index">03</span><div><strong>Print or download</strong><p>Choose A4, narrow A4/2, large print, colour, or monochrome.</p></div><span aria-hidden="true">↗</span></a>
      <a class="action-card action-deploy" href="deploy/"><span class="action-index">04</span><div><strong>Install it properly</strong><p>Verify local routes, protect private fields, test the room, and assign maintenance.</p></div><span aria-hidden="true">↗</span></a>
    </div>
  </section>

  <section class="route-section section-block" aria-labelledby="route-heading">
    <div class="shell">
      <div class="section-heading inverse"><div><span class="eyebrow">Eleven books, no compulsory reading order</span><h2 id="route-heading">A shelf, not a diagnostic maze.</h2></div><p>Choose the title that sounds closest. Each book can start alone and point to another when the problem changes departments.</p></div>
      <div class="route-grid">{route_cards(nodes, released, "")}</div>
      <div class="section-cta"><a class="text-link light" href="routes/">Browse the eleven-book shelf <span aria-hidden="true">→</span></a></div>
    </div>
  </section>

  <section class="shell section-block split-section" aria-labelledby="deployment-heading">
    <div>
      <span class="eyebrow">Deployment is a maintained object</span>
      <h2 id="deployment-heading">A PDF on a shelf is not resilience.</h2>
      <p class="lede-small">A useful installation has verified local facts, readable physical form, protected private fields, working supplies, a tested route, and a named maintenance owner.</p>
      <a class="button primary" href="deploy/">Open the deployment planner</a>
    </div>
    <ol class="deployment-steps">
      <li><span>01</span><div><strong>Choose the readable edition</strong><small>A4 · A4/2 · large print · colour or monochrome</small></div></li>
      <li><span>02</span><div><strong>Verify local truth</strong><small>Address · access · services · safe places · backups</small></div></li>
      <li><span>03</span><div><strong>Protect and test</strong><small>Privacy · glare · reach · page turning · route drill</small></div></li>
      <li><span>04</span><div><strong>Maintain the installation</strong><small>Owner · revision · supplies · next review date</small></div></li>
    </ol>
  </section>

  <section class="proof-section section-block" aria-labelledby="proof-heading">
    <div class="shell proof-grid">
      <div><span class="eyebrow">Evidence with boundaries</span><h2 id="proof-heading">The source trail stays attached.</h2><p>Protocols, studies, associations, models, and mnemonics are labelled by what they can honestly establish. Local values remain visible deployment fields rather than plausible inventions.</p></div>
      <div class="proof-cards">
        <article><strong>One source tree</strong><span>HTML, PDF, individual books, figures, templates, indexes, and deployment pages are generated together.</span></article>
        <article><strong>Stable addresses</strong><span>Typed references such as <code>[BEG:T:F:003]</code> survive page and chapter movement.</span></article>
        <article><strong>Build evidence</strong><span>Geometry, blank pages, overflow, colour/mono parity, accessibility, and artifact hashes are validated.</span></article>
        <article><strong>Field evidence stays separate</strong><span>A successful build does not pretend that a real wet room or novice first-aid session was tested.</span></article>
      </div>
    </div>
  </section>

  <section class="shell contact-band">
    <div><span class="eyebrow">Correct the guide in public, protect people in private</span><h2>Found a failed route or a better installation?</h2></div>
    <div><p>Use the feedback template to record the release, build revision, layout, stable reference, and what helped or failed. Never send medical records, credentials, hidden safe-place locations, or another person’s identifying information without permission.</p><div class="hero-actions"><a class="button primary" href="routes/T/grey-book-templates-forms.html#beg-t-f-005">Open feedback template</a><a class="button secondary" href="mailto:bathroom_emergency@fkr.dev?subject=Bathroom%20Emergency%20Guide%20feedback%20{VERSION}">Email feedback</a></div></div>
  </section>
</main>
{footer("", revision, date)}
</body>
</html>
'''


def deployment_page(revision: str, date: str) -> str:
    checklist = (
        ("edition", "Choose the readable edition", "Select A4, A4/2, or large print and verify the actual printer output."),
        ("facts", "Fill and verify local facts", "Address, access, service scope, hours, safe places, and one backup route."),
        ("privacy", "Separate shared and private fields", "Never expose credentials, hidden keys, medical detail, or violence-related safe places."),
        ("supplies", "Add working physical support", "Pencils, writing surface, light, charger, maintained power bank, and relevant kit."),
        ("drill", "Test one complete route", "Find the address, choose the route, reach a backup, and open the guide without QR-only dependence."),
        ("owner", "Assign maintenance", "Record version, local revision, owner, last check, next check, and replacement-copy location."),
    )
    checks = "\n".join(
        f'''<label class="planner-item"><input type="checkbox" value="{key}"><span class="custom-check" aria-hidden="true"></span><span><strong>{title}</strong><small>{detail}</small></span></label>'''
        for key, title, detail in checklist
    )
    return f'''{page_head("Deploy the Bathroom Emergency Guide", "Plan, install, test, maintain, and publish the Bathroom Emergency Guide safely.", "../")}
<body>
<a class="skip-link" href="#main">Skip to content</a>
{nav("../", "deploy")}
{emergency_strip()}
<main id="main">
  <section class="page-hero deploy-hero shell">
    <div><span class="eyebrow">Deployment planner</span><h1>Make it<br><em>usable here.</em></h1><p class="lede">A deployment is a maintained local interface—not “print PDF, place near toilet, achieve resilience.” This planner stores checklist state only in this browser.</p></div>
    <aside class="privacy-note"><strong>Local-only by design</strong><p>No form data is sent anywhere. Do not type sensitive addresses, codes, medical details, or safe-place locations into this website.</p></aside>
  </section>

  <section class="shell planner-layout" aria-labelledby="planner-heading">
    <div class="planner-panel" data-deployment-planner>
      <div class="planner-head"><div><span class="eyebrow">Minimum viable deployment</span><h2 id="planner-heading">Six checks before the copy is ready.</h2></div><div class="progress-ring" style="--progress:0" aria-label="Deployment progress"><span data-progress-number>0%</span></div></div>
      <div class="progress-track" aria-hidden="true"><span data-progress-bar></span></div>
      <div class="planner-list">{checks}</div>
      <div class="planner-actions"><button class="button primary" type="button" data-copy-plan>Copy checklist summary</button><button class="button ghost" type="button" data-reset-plan>Reset</button><span class="copy-status" role="status" aria-live="polite"></span></div>
    </div>
    <aside class="deploy-sidebar">
      <div class="sidebar-card"><span class="eyebrow">Roles</span><dl><div><dt>Author</dt><dd>Maintains generic content and evidence.</dd></div><div><dt>Deployer</dt><dd>Verifies, installs, and maintains one local copy.</dd></div><div><dt>Reader</dt><dd>Uses the guide; does not inherit maintenance.</dd></div><div><dt>Helper</dt><dd>Calls, writes, carries, observes, or hands off with consent.</dd></div></dl></div>
      <a class="sidebar-card link-card" href="../docs/DEPLOYMENT.md"><span>Canonical manual</span><strong>Read the complete deployment specification</strong><span aria-hidden="true">↗</span></a>
    </aside>
  </section>

  <section class="shell section-block" aria-labelledby="format-heading">
    <div class="section-heading"><div><span class="eyebrow">Choose for the actual room and reader</span><h2 id="format-heading">The best edition is the one that remains readable.</h2></div><p>Print one representative page before committing to a complete copy. Monochrome is a tested mode, not an instruction to accept a weak printer result.</p></div>
    <div class="format-grid">
      <article class="format-card"><span class="format-size portrait">A4</span><div><strong>Complete wall or folder copy</strong><p>Best general-purpose edition. Supports full tables, figures, and comfortable annotation.</p><div class="card-links"><a href="../files/guide.pdf">Colour PDF</a><a href="../files/guide_mono.pdf">Mono PDF</a></div></div></article>
      <article class="format-card"><span class="format-size strip">A4/2</span><div><strong>Narrow hanging or field strip</strong><p>105 × 297 mm. Test page turning, lowest-page reach, and figure legibility.</p><div class="card-links"><a href="../files/guide_a4half.pdf">Colour PDF</a><a href="../files/guide_a4half_mono.pdf">Mono PDF</a></div></div></article>
      <article class="format-card"><span class="format-size large">Aa</span><div><strong>Large print</strong><p>Use when standard text is not comfortably readable. Check the larger page count and storage method.</p><div class="card-links"><a href="../files/guide_largeprint.pdf">Colour PDF</a><a href="../files/guide_largeprint_mono.pdf">Mono PDF</a></div></div></article>
    </div>
  </section>

  <section class="privacy-section section-block" aria-labelledby="privacy-heading">
    <div class="shell">
      <div class="section-heading inverse"><div><span class="eyebrow">A shared wall is a publication surface</span><h2 id="privacy-heading">Classify before you print.</h2></div><p>The bathroom’s physical privacy does not make every field safe to display. Visitors, contractors, abusive people, cameras, and photographs can cross that boundary.</p></div>
      <div class="privacy-grid">
        <article><span class="privacy-class public">Shared-safe</span><strong>Usually suitable for visible pages</strong><ul><li>Guide version and maintainer</li><li>Public national emergency routes</li><li>Generic address fields when appropriate</li><li>Non-sensitive maintenance dates</li></ul></article>
        <article><span class="privacy-class contextual">Context-sensitive</span><strong>Expose only after local review</strong><ul><li>Mobility and access barriers</li><li>Care dependencies</li><li>Local support contacts</li><li>Animal or dependant arrangements</li></ul></article>
        <article><span class="privacy-class private">Private</span><strong>Keep off a shared wall copy</strong><ul><li>Medical detail and credentials</li><li>Hidden keys and alarm codes</li><li>Violence-related safe places</li><li>Security or escape plans</li></ul></article>
      </div>
    </div>
  </section>

  <section class="shell section-block" aria-labelledby="mount-heading">
    <div class="section-heading"><div><span class="eyebrow">Prototype the installation, not only the document</span><h2 id="mount-heading">Four physical patterns worth testing.</h2></div><p>Every pattern must be checked under actual light, moisture, reach, privacy, and one-handed page-turning conditions.</p></div>
    <div class="mount-grid">
      <article><span>01</span><strong>Clear sleeve</strong><p>Wipeable, removable, and easy to replace. Glare and condensation can still defeat it.</p></article>
      <article><span>02</span><strong>Clip-hung strip</strong><p>Efficient for A4/2. Keep clear of water, heat, flame, doors, and snag points.</p></article>
      <article><span>03</span><strong>Open folder or shallow box</strong><p>Separates master guide, Safety Book, local reference figures, private templates, and blanks.</p></article>
      <article><span>04</span><strong>Wall panel plus takeaways</strong><p>Keep shared-safe orientation visible and detachable private material protected.</p></article>
    </div>
  </section>

  <section class="shell section-block operator-section" aria-labelledby="pages-heading">
    <div class="operator-copy"><span class="eyebrow">Website operator</span><h2 id="pages-heading">GitHub Pages deployment is prepared, not presumed.</h2><p>The repository includes a dedicated Pages workflow that builds the entire release, validates it, and publishes <code>build/site</code>. A push or workflow run is still an explicit deployment event.</p><ol><li>Enable GitHub Pages with <strong>GitHub Actions</strong> as the source.</li><li>Review repository variables and optional custom-domain DNS.</li><li>Push the workflow or run it manually.</li><li>Verify the deployed landing, guide, book shelf, PDFs, planner, and 404 page.</li></ol></div>
    <div class="code-card"><div class="code-head"><span>Local preview</span><button type="button" data-copy-code>Copy</button></div><pre><code>npm ci
npx playwright install chromium
npm run build
python -m http.server 8080 -d build/site</code></pre><p>Open <code>http://localhost:8080</code>. The site has no remote runtime dependency.</p></div>
  </section>

  <section class="shell maintenance-band">
    <div><span class="eyebrow">Maintenance trigger</span><h2>Review after change, not only by calendar.</h2></div><p>Check immediately after moving, access or household-care changes, a failed route, a new local service, relevant incident, physical damage, or a privacy concern.</p>
  </section>
</main>
{footer("../", revision, date)}
</body>
</html>
'''


def downloads_page(nodes: list[dict], released: set[str], revision: str, date: str) -> str:
    route_downloads: list[str] = []
    for node in nodes:
        if node["id"] not in released:
            continue
        slug = node["slug"]
        route_downloads.append(
            f'''<article class="download-route" data-download-group="routes" style="--route:{esc(node['colour'])}"><span class="route-code">{esc(node['id'])}</span><div><strong>{esc(node['title'])}</strong><p>{esc(node['promise'])}</p><div class="card-links"><a href="../routes/{esc(node['id'])}/{esc(slug)}.html">HTML</a><a href="../routes/{esc(node['id'])}/{esc(slug)}.pdf">A4 PDF</a><a href="../routes/{esc(node['id'])}/{esc(slug)}_largeprint.pdf">Large print</a></div></div></article>'''
        )
    return f'''{page_head("Downloads — Bathroom Emergency Guide", "Download the complete guide, individual colour books, printable figures and templates, and release documentation.", "../")}
<body>
<a class="skip-link" href="#main">Skip to content</a>
{nav("../", "downloads")}
{emergency_strip()}
<main id="main">
  <section class="page-hero download-hero shell"><div><span class="eyebrow">Release {esc(VERSION)} download catalogue</span><h1>Take the guide<br><em>into the room.</em></h1><p class="lede">Choose by reading need and physical context. Every PDF family ships in colour and monochrome with page-count and semantic parity checks.</p></div><div class="download-summary"><strong>{len(released) * 6}</strong><span>standalone PDF editions</span><strong>6</strong><span>master layout/mode editions</span></div></section>

  <section class="shell download-controls" aria-label="Download filters"><button class="filter-chip active" type="button" data-download-filter="all">Everything</button><button class="filter-chip" type="button" data-download-filter="master">Complete guide</button><button class="filter-chip" type="button" data-download-filter="routes">Individual books</button><button class="filter-chip" type="button" data-download-filter="source">Source & evidence</button></section>

  <section class="shell download-section" data-download-group="master" aria-labelledby="master-downloads"><div class="section-heading"><div><span class="eyebrow">Complete guide</span><h2 id="master-downloads">Master editions</h2></div><p>HTML is best for responsive reading. PDF is best for a controlled print layout and offline distribution.</p></div>
    <div class="download-matrix">
      <article><span class="matrix-label">A4</span><strong>General purpose</strong><p>Complete standard-width edition; page count, geometry, density, and colour/mono parity are validated at build time.</p><div class="download-buttons"><a class="button small primary" href="../files/guide.pdf">Colour PDF</a><a class="button small secondary" href="../files/guide_mono.pdf">Mono PDF</a><a class="button small ghost" href="../guide/">HTML</a></div></article>
      <article><span class="matrix-label">A4/2</span><strong>Narrow field strip</strong><p>105 × 297 mm for hanging, narrow folders, and constrained surfaces.</p><div class="download-buttons"><a class="button small primary" href="../files/guide_a4half.pdf">Colour PDF</a><a class="button small secondary" href="../files/guide_a4half_mono.pdf">Mono PDF</a><a class="button small ghost" href="../files/guide_a4half.html">HTML</a></div></article>
      <article><span class="matrix-label">Large</span><strong>Large print</strong><p>Materially larger typography with the same colour/mono semantic content.</p><div class="download-buttons"><a class="button small primary" href="../files/guide_largeprint.pdf">Colour PDF</a><a class="button small secondary" href="../files/guide_largeprint_mono.pdf">Mono PDF</a><a class="button small ghost" href="../files/guide_largeprint.html">HTML</a></div></article>
    </div>
  </section>

  <section class="route-download-section download-section" data-download-group="routes" aria-labelledby="route-downloads"><div class="shell"><div class="section-heading inverse"><div><span class="eyebrow">Take only the book you need</span><h2 id="route-downloads">The eleven individual books</h2></div><p>Each book contains A4, A4/2, and large-print colour/monochrome editions plus its own source notes.</p></div><div class="download-route-grid">{''.join(route_downloads)}</div></div></section>

  <section class="shell download-section" data-download-group="source" aria-labelledby="source-downloads"><div class="section-heading"><div><span class="eyebrow">Inspect and reproduce</span><h2 id="source-downloads">Source, evidence, and maintenance</h2></div><p>The build remains inspectable. Generated release metadata in this package records the version, revision, coverage, and available books.</p></div><div class="source-grid"><a href="../docs/README.md"><strong>README</strong><span>Architecture, build system, output matrix, and validation gates.</span></a><a href="../docs/DEPLOYMENT.md"><strong>Deployment manual</strong><span>Local fields, privacy, physical installation, maintenance, and domain contract.</span></a><a href="../routes/T/grey-book-templates-forms.html#beg-t-f-005"><strong>Feedback template</strong><span>Record a failed route, confusing figure, missing local fact, print defect, or useful adaptation.</span></a><a href="../docs/CHANGELOG.md"><strong>Changelog</strong><span>Release-by-release implementation and content history.</span></a><a href="../meta/release.json"><strong>Site release metadata</strong><span>Version, revision, metrics, book families, and build date.</span></a></div></section>
</main>
{footer("../", revision, date)}
</body>
</html>
'''


def not_found_page(revision: str, date: str) -> str:
    return f'''{page_head("Page not found — Bathroom Emergency Guide", "The requested Bathroom Emergency Guide page was not found.", "")}
<body class="not-found">
{nav("", "")}
<main id="main" class="shell not-found-main"><span class="error-code">404</span><h1>This page fell off the shelf.</h1><p>The link may target an older build or a book that moved. Return to the project page, the eleven-book shelf, or the download catalogue.</p><div class="hero-actions"><a class="button primary" href="index.html">Project home</a><a class="button secondary" href="routes/">Book shelf</a><a class="button ghost" href="downloads/">Downloads</a></div></main>
{footer("", revision, date)}
</body>
</html>
'''


SITE_CSS = r'''
:root {
  color-scheme: light dark;
  --ink:#14211d; --ink-soft:#42524c; --paper:#f5f2e9; --surface:#fffdf7;
  --surface-2:#e9eee9; --line:#c8d0c9; --line-strong:#8fa098;
  --forest:#123b31; --forest-2:#0c2c25; --green:#0d7355; --green-bright:#27ae7b;
  --blue:#2457a6; --red:#b42318; --orange:#b54708; --violet:#6f3ab2;
  --shadow:0 20px 60px rgba(18,59,49,.10); --radius:1.1rem;
  --font-sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --font-serif:Iowan Old Style,Palatino Linotype,Book Antiqua,Palatino,Georgia,serif;
  --font-mono:"SFMono-Regular",Consolas,"Liberation Mono",monospace;
}
@media (prefers-color-scheme:dark) {
  :root[data-theme="auto"] { --ink:#edf5f1; --ink-soft:#b6c6bf; --paper:#0d1512; --surface:#14201c; --surface-2:#192923; --line:#33463f; --line-strong:#62776e; --forest:#123b31; --forest-2:#081f1a; --shadow:0 20px 70px rgba(0,0,0,.28); }
}
:root[data-theme="dark"] { --ink:#edf5f1; --ink-soft:#b6c6bf; --paper:#0d1512; --surface:#14201c; --surface-2:#192923; --line:#33463f; --line-strong:#62776e; --forest:#123b31; --forest-2:#081f1a; --shadow:0 20px 70px rgba(0,0,0,.28); }
:root[data-theme="light"] { color-scheme:light; }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; color:var(--ink); background:var(--paper); font-family:var(--font-sans); line-height:1.55; text-rendering:optimizeLegibility; }
a { color:inherit; text-decoration-thickness:.08em; text-underline-offset:.18em; }
button,input { font:inherit; }
button,a { -webkit-tap-highlight-color:transparent; }
img,svg { max-width:100%; }
code,pre { font-family:var(--font-mono); }
.shell { width:min(1180px,calc(100% - 2rem)); margin-inline:auto; }
.skip-link { position:fixed; z-index:1000; top:.5rem; left:.5rem; transform:translateY(-160%); padding:.65rem 1rem; color:white; background:#000; border-radius:.4rem; }
.skip-link:focus { transform:none; }
.site-header { position:sticky; z-index:100; top:0; display:grid; grid-template-columns:auto 1fr auto; align-items:center; min-height:74px; padding:.7rem max(1rem,calc((100% - 1180px)/2)); border-bottom:1px solid color-mix(in srgb,var(--line) 75%,transparent); background:color-mix(in srgb,var(--paper) 88%,transparent); backdrop-filter:blur(16px); }
.brand { display:inline-flex; align-items:center; gap:.7rem; text-decoration:none; }
.brand strong,.brand small { display:block; line-height:1.1; }
.brand strong { font-size:.92rem; letter-spacing:-.02em; }
.brand small { margin-top:.18rem; color:var(--ink-soft); font-size:.68rem; }
.brand-mark { position:relative; display:grid; place-items:center; width:34px; height:34px; border:1px solid var(--line-strong); border-radius:50%; }
.brand-mark span { position:absolute; width:15px; height:3px; border-radius:3px; background:var(--green); }
.brand-mark span:nth-child(1) { transform:translateY(-5px); }
.brand-mark span:nth-child(2) { width:20px; transform:rotate(-45deg); background:var(--blue); }
.brand-mark span:nth-child(3) { transform:translateY(5px); background:var(--red); }
.site-nav { justify-self:center; display:flex; gap:.25rem; padding:.25rem; border:1px solid var(--line); border-radius:999px; background:var(--surface); }
.site-nav a { padding:.45rem .78rem; border-radius:999px; color:var(--ink-soft); font-size:.84rem; font-weight:650; text-decoration:none; }
.site-nav a:hover,.site-nav a[aria-current="page"] { color:var(--ink); background:var(--surface-2); }
.theme-toggle,.nav-toggle { border:1px solid var(--line); color:var(--ink); background:var(--surface); cursor:pointer; }
.theme-toggle { justify-self:end; display:flex; gap:.4rem; align-items:center; padding:.48rem .72rem; border-radius:999px; font-size:.78rem; font-weight:700; }
.nav-toggle { display:none; padding:.45rem .75rem; border-radius:.55rem; }
.emergency-strip { display:flex; align-items:center; justify-content:center; gap:.65rem 1rem; min-height:42px; padding:.55rem 1rem; color:#fff; background:var(--forest-2); font-size:.78rem; }
.emergency-strip a { font-size:1rem; font-weight:900; }
.pulse-dot { width:8px; height:8px; border-radius:50%; background:#ff675d; box-shadow:0 0 0 5px rgba(255,103,93,.14); }
.emergency-limit { color:#b9d4cb; }
.hero { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr); gap:clamp(2rem,7vw,7rem); align-items:center; min-height:720px; padding-block:clamp(4rem,10vw,8rem); }
.eyebrow { display:flex; flex-wrap:wrap; gap:.45rem .8rem; color:var(--green); font-family:var(--font-mono); font-size:.7rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
.hero .eyebrow span { padding:.25rem .48rem; border:1px solid color-mix(in srgb,var(--green) 42%,var(--line)); border-radius:999px; }
h1,h2,h3,p { margin-top:0; }
h1,h2 { font-family:var(--font-serif); font-weight:600; letter-spacing:-.045em; }
.hero h1,.page-hero h1 { margin:.8rem 0 1.5rem; font-size:clamp(4.2rem,10.5vw,8.5rem); line-height:.75; }
h1 em,h2 em { color:var(--green); font-weight:400; }
h2 { margin:.35rem 0 .8rem; font-size:clamp(2.5rem,6vw,5.2rem); line-height:.93; }
.lede { max-width:62ch; color:var(--ink-soft); font-size:clamp(1.05rem,2vw,1.3rem); }
.lede-small { max-width:54ch; color:var(--ink-soft); font-size:1.08rem; }
.hero-actions,.download-buttons,.planner-actions,.card-links { display:flex; flex-wrap:wrap; gap:.65rem; align-items:center; }
.button { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; min-height:46px; padding:.72rem 1rem; border:1px solid transparent; border-radius:.72rem; font-weight:760; line-height:1.15; text-decoration:none; cursor:pointer; }
.button.primary { color:#fff; background:var(--green); box-shadow:0 10px 25px rgba(13,115,85,.2); }
.button.primary:hover { background:#096547; }
.button.secondary { border-color:var(--line-strong); background:var(--surface); }
.button.ghost { border-color:var(--line); color:var(--ink-soft); background:transparent; }
.button.small { min-height:38px; padding:.55rem .72rem; font-size:.78rem; }
.microcopy { margin-top:.85rem; color:var(--ink-soft); font-size:.78rem; }
.instrument { overflow:hidden; border:1px solid var(--line-strong); border-radius:1.4rem; background:var(--surface); box-shadow:var(--shadow); transform:rotate(1.2deg); }
.instrument-head,.instrument-foot { display:flex; justify-content:space-between; gap:1rem; padding:.85rem 1rem; font-family:var(--font-mono); font-size:.68rem; letter-spacing:.06em; text-transform:uppercase; }
.instrument-head { color:#fff; background:var(--forest); }
.status-live::before { content:""; display:inline-block; width:7px; height:7px; margin-right:.35rem; border-radius:50%; background:#49dc9c; }
.instrument ol { margin:0; padding:1rem; list-style:none; }
.instrument li { display:grid; grid-template-columns:52px 1fr; align-items:center; gap:1rem; padding:1rem 0; border-bottom:1px solid var(--line); }
.instrument li:last-child { border-bottom:0; }
.instrument li>span { display:grid; place-items:center; width:46px; height:46px; border:1px solid var(--line); border-radius:50%; color:var(--green); font-family:var(--font-mono); font-size:.76rem; }
.instrument strong,.instrument small { display:block; }
.instrument strong { font-family:var(--font-serif); font-size:1.65rem; font-weight:600; }
.instrument small { color:var(--ink-soft); }
.instrument-foot { color:var(--ink-soft); background:var(--surface-2); }
.metrics { display:grid; grid-template-columns:repeat(4,1fr); margin-bottom:clamp(4rem,9vw,8rem); border-block:1px solid var(--line); }
.metrics div { padding:1.2rem; border-right:1px solid var(--line); }
.metrics div:last-child { border-right:0; }
.metrics strong,.metrics span { display:block; }
.metrics strong { font-family:var(--font-serif); font-size:2.6rem; line-height:1; }
.metrics span { margin-top:.3rem; color:var(--ink-soft); font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; }
.section-block { padding-block:clamp(4.5rem,10vw,8rem); }
.section-heading { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr); gap:2rem; align-items:end; margin-bottom:2.2rem; }
.section-heading>p { color:var(--ink-soft); }
.section-heading.inverse,.inverse p { color:#e9f3ef; }
.section-heading.inverse .eyebrow { color:#71ddb1; }
.action-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; }
.action-card { display:grid; grid-template-columns:auto 1fr auto; gap:1rem; align-items:start; min-height:170px; padding:1.25rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); text-decoration:none; transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
.action-card:hover { transform:translateY(-4px); border-color:var(--line-strong); box-shadow:var(--shadow); }
.action-index { color:var(--green); font-family:var(--font-mono); font-size:.72rem; }
.action-card strong { display:block; margin-bottom:.35rem; font-family:var(--font-serif); font-size:1.65rem; }
.action-card p { color:var(--ink-soft); }
.action-guide { border-top:5px solid var(--green); }.action-routes { border-top:5px solid var(--blue); }.action-download { border-top:5px solid var(--orange); }.action-deploy { border-top:5px solid var(--violet); }
.route-section,.privacy-section,.route-download-section { color:#fff; background:var(--forest); }
.route-section { position:relative; overflow:hidden; }
.route-section::before { content:""; position:absolute; inset:0; opacity:.16; background-image:linear-gradient(135deg,transparent 0 48%,#fff 48% 50%,transparent 50%); background-size:32px 32px; }
.route-section>.shell { position:relative; }
.route-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:.75rem; }
.route-card { position:relative; display:flex; flex-direction:column; min-height:255px; padding:1rem; border:1px solid rgba(255,255,255,.22); border-top:5px solid var(--route); border-radius:.9rem; color:#fff; background:rgba(255,255,255,.06); text-decoration:none; transition:background .2s ease,transform .2s ease; }
.route-card:hover { transform:translateY(-4px); background:rgba(255,255,255,.11); }
.route-code { display:grid; place-items:center; width:42px; height:42px; margin-bottom:1.5rem; border:1px solid color-mix(in srgb,var(--route) 65%,white); border-radius:50%; color:#fff; background:color-mix(in srgb,var(--route) 72%,transparent); font-family:var(--font-mono); font-weight:900; }
.route-status { position:absolute; top:1rem; right:1rem; color:#b8d3ca; font-family:var(--font-mono); font-size:.58rem; letter-spacing:.06em; text-transform:uppercase; }
.route-card strong { margin-bottom:.5rem; font-family:var(--font-serif); font-size:1.3rem; line-height:1.05; }
.route-card>span:nth-of-type(3) { color:#c9dbd5; font-size:.82rem; }
.route-open { margin-top:auto; padding-top:1rem; font-size:.75rem; font-weight:800; }
.section-cta { margin-top:1.5rem; text-align:right; }
.text-link { font-weight:800; }.text-link.light { color:#fff; }
.split-section { display:grid; grid-template-columns:1fr 1fr; gap:clamp(2rem,8vw,8rem); align-items:start; }
.deployment-steps { margin:0; padding:0; list-style:none; border-top:1px solid var(--line); }
.deployment-steps li { display:grid; grid-template-columns:48px 1fr; gap:1rem; padding:1.2rem 0; border-bottom:1px solid var(--line); }
.deployment-steps li>span { color:var(--green); font-family:var(--font-mono); }
.deployment-steps strong,.deployment-steps small { display:block; }.deployment-steps small { color:var(--ink-soft); }
.proof-section { background:var(--surface-2); }
.proof-grid { display:grid; grid-template-columns:.75fr 1.25fr; gap:clamp(2rem,7vw,6rem); }
.proof-grid>div:first-child p { color:var(--ink-soft); }
.proof-cards { display:grid; grid-template-columns:repeat(2,1fr); gap:.8rem; }
.proof-cards article { min-height:170px; padding:1rem; border:1px solid var(--line); border-radius:.8rem; background:var(--surface); }
.proof-cards strong,.proof-cards span { display:block; }.proof-cards strong { margin-bottom:.55rem; font-family:var(--font-serif); font-size:1.35rem; }.proof-cards span { color:var(--ink-soft); font-size:.85rem; }
.contact-band,.maintenance-band { display:grid; grid-template-columns:1fr 1fr; gap:2rem; align-items:center; margin-block:5rem; padding:2rem; border:1px solid var(--line-strong); border-radius:1.2rem; background:var(--surface); box-shadow:var(--shadow); }
.contact-band h2,.maintenance-band h2 { font-size:clamp(2.2rem,4vw,3.8rem); }
.site-footer { display:grid; grid-template-columns:1.2fr .7fr auto; gap:3rem; padding:3rem max(1rem,calc((100% - 1180px)/2)); border-top:1px solid var(--line); background:var(--surface); }
.site-footer p { max-width:52ch; margin:1rem 0 0; color:var(--ink-soft); font-size:.8rem; }
.footer-links { display:grid; align-content:start; gap:.45rem; font-size:.82rem; }
.build-stamp { display:flex; flex-direction:column; gap:.3rem; align-items:flex-end; color:var(--ink-soft); font-family:var(--font-mono); font-size:.62rem; }
.page-hero { display:grid; grid-template-columns:1.25fr .75fr; gap:4rem; align-items:end; padding-block:clamp(4rem,9vw,7rem); }
.page-hero h1 { font-size:clamp(4rem,9vw,7.5rem); }
.privacy-note,.download-summary { padding:1.2rem; border:1px solid var(--line-strong); border-radius:1rem; background:var(--surface); box-shadow:var(--shadow); }
.privacy-note strong { color:var(--red); }.privacy-note p { margin:.5rem 0 0; color:var(--ink-soft); }
.planner-layout { display:grid; grid-template-columns:minmax(0,1fr) 310px; gap:1rem; align-items:start; margin-bottom:5rem; }
.planner-panel,.sidebar-card { border:1px solid var(--line); border-radius:1rem; background:var(--surface); box-shadow:var(--shadow); }
.planner-panel { padding:clamp(1rem,4vw,2rem); }
.planner-head { display:flex; justify-content:space-between; gap:1.5rem; align-items:start; }
.planner-head h2 { max-width:12ch; font-size:clamp(2.4rem,5vw,4.2rem); }
.progress-ring { display:grid; flex:0 0 auto; place-items:center; width:92px; height:92px; border-radius:50%; background:conic-gradient(var(--green) calc(var(--progress)*1%),var(--surface-2) 0); }
.progress-ring::before { content:""; grid-area:1/1; width:72px; height:72px; border-radius:50%; background:var(--surface); }
.progress-ring span { z-index:1; grid-area:1/1; font-family:var(--font-mono); font-size:.75rem; font-weight:800; }
.progress-track { overflow:hidden; height:6px; margin:1rem 0 1.4rem; border-radius:999px; background:var(--surface-2); }.progress-track span { display:block; width:0; height:100%; background:var(--green); transition:width .2s ease; }
.planner-list { border-top:1px solid var(--line); }
.planner-item { display:grid; grid-template-columns:auto auto 1fr; gap:.8rem; align-items:start; padding:1rem 0; border-bottom:1px solid var(--line); cursor:pointer; }
.planner-item input { position:absolute; opacity:0; pointer-events:none; }
.custom-check { display:grid; place-items:center; width:25px; height:25px; border:1px solid var(--line-strong); border-radius:.4rem; background:var(--paper); }
.planner-item input:checked+.custom-check { border-color:var(--green); background:var(--green); }.planner-item input:checked+.custom-check::after { content:"✓"; color:white; font-weight:900; }
.planner-item input:focus-visible+.custom-check { outline:3px solid color-mix(in srgb,var(--blue) 45%,transparent); outline-offset:2px; }
.planner-item strong,.planner-item small { display:block; }.planner-item small { margin-top:.2rem; color:var(--ink-soft); }
.planner-actions { margin-top:1.2rem; }.copy-status { color:var(--green); font-size:.78rem; }
.deploy-sidebar { display:grid; gap:1rem; }.sidebar-card { padding:1rem; }.sidebar-card dl { margin:1rem 0 0; }.sidebar-card dl div { padding:.65rem 0; border-top:1px solid var(--line); }.sidebar-card dt { font-weight:800; }.sidebar-card dd { margin:.15rem 0 0; color:var(--ink-soft); font-size:.8rem; }.link-card { position:relative; display:block; text-decoration:none; }.link-card>span:first-child { color:var(--green); font-family:var(--font-mono); font-size:.65rem; text-transform:uppercase; }.link-card strong { display:block; margin:.5rem 2rem .5rem 0; font-family:var(--font-serif); font-size:1.25rem; }.link-card>span:last-child { position:absolute; top:1rem; right:1rem; }
.format-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }.format-card { display:grid; grid-template-columns:100px 1fr; gap:1rem; min-height:220px; padding:1rem; border:1px solid var(--line); border-radius:1rem; background:var(--surface); }.format-size { display:grid; place-items:center; align-self:start; border:2px solid var(--ink); color:var(--ink); font-family:var(--font-serif); font-size:1.2rem; }.format-size.portrait { width:76px; height:108px; }.format-size.strip { width:45px; height:128px; }.format-size.large { width:86px; height:120px; font-size:2rem; }.format-card strong { font-family:var(--font-serif); font-size:1.25rem; }.format-card p { color:var(--ink-soft); font-size:.85rem; }.card-links a { font-size:.75rem; font-weight:800; }
.privacy-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }.privacy-grid article { padding:1.2rem; border:1px solid rgba(255,255,255,.2); border-radius:1rem; background:rgba(255,255,255,.06); }.privacy-grid strong { display:block; margin:.8rem 0; font-family:var(--font-serif); font-size:1.35rem; }.privacy-grid ul { padding-left:1.1rem; color:#cce0d9; font-size:.84rem; }.privacy-class { display:inline-flex; padding:.3rem .55rem; border-radius:999px; font-family:var(--font-mono); font-size:.62rem; font-weight:800; text-transform:uppercase; }.privacy-class.public { color:#9ff0c9; background:rgba(39,174,123,.15); }.privacy-class.contextual { color:#ffd2a2; background:rgba(181,71,8,.2); }.privacy-class.private { color:#ffc0bc; background:rgba(180,35,24,.2); }
.mount-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.8rem; }.mount-grid article { min-height:210px; padding:1rem; border:1px solid var(--line); border-radius:1rem; background:var(--surface); }.mount-grid article>span { color:var(--green); font-family:var(--font-mono); }.mount-grid strong { display:block; margin:2.8rem 0 .5rem; font-family:var(--font-serif); font-size:1.4rem; }.mount-grid p { color:var(--ink-soft); font-size:.84rem; }
.operator-section { display:grid; grid-template-columns:1fr .85fr; gap:4rem; align-items:center; }.operator-copy ol { padding-left:1.2rem; }.operator-copy li { margin:.5rem 0; }.code-card { overflow:hidden; border:1px solid var(--line-strong); border-radius:1rem; background:#081d18; color:#e9f7f1; box-shadow:var(--shadow); }.code-head { display:flex; justify-content:space-between; padding:.7rem 1rem; border-bottom:1px solid #26433a; color:#92b7aa; font-family:var(--font-mono); font-size:.7rem; }.code-head button { border:0; color:#a5e3cb; background:transparent; cursor:pointer; }.code-card pre { overflow:auto; margin:0; padding:1.2rem; font-size:.82rem; }.code-card p { margin:0; padding:0 1.2rem 1.2rem; color:#a9c7bc; font-size:.76rem; }
.download-summary { display:grid; grid-template-columns:auto 1fr; gap:.4rem 1rem; align-items:baseline; }.download-summary strong { color:var(--green); font-family:var(--font-serif); font-size:3rem; line-height:1; }.download-summary span { color:var(--ink-soft); }
.download-controls { display:flex; flex-wrap:wrap; gap:.55rem; padding-bottom:2rem; }.filter-chip { padding:.5rem .8rem; border:1px solid var(--line); border-radius:999px; color:var(--ink-soft); background:var(--surface); cursor:pointer; }.filter-chip.active { border-color:var(--green); color:white; background:var(--green); }
.download-section { padding-block:4rem; }.download-section[hidden] { display:none; }.download-matrix { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }.download-matrix article { padding:1.2rem; border:1px solid var(--line); border-radius:1rem; background:var(--surface); }.matrix-label { display:inline-flex; padding:.3rem .55rem; border-radius:.4rem; color:white; background:var(--green); font-family:var(--font-mono); font-size:.7rem; }.download-matrix strong { display:block; margin:1.8rem 0 .4rem; font-family:var(--font-serif); font-size:1.5rem; }.download-matrix p { color:var(--ink-soft); font-size:.84rem; }.download-route-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.8rem; }.download-route { display:grid; grid-template-columns:auto 1fr; gap:1rem; padding:1rem; border:1px solid rgba(255,255,255,.2); border-left:5px solid var(--route); border-radius:.9rem; background:rgba(255,255,255,.06); }.download-route .route-code { margin:0; }.download-route strong { font-family:var(--font-serif); font-size:1.35rem; }.download-route p { color:#c9dbd5; font-size:.82rem; }.download-route a { color:#fff; }.source-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.8rem; }.source-grid a { min-height:170px; padding:1rem; border:1px solid var(--line); border-radius:.9rem; background:var(--surface); text-decoration:none; }.source-grid strong,.source-grid span { display:block; }.source-grid strong { margin-bottom:.7rem; font-family:var(--font-serif); font-size:1.25rem; }.source-grid span { color:var(--ink-soft); font-size:.82rem; }
.not-found-main { min-height:65vh; padding-block:7rem; }.error-code { color:var(--green); font-family:var(--font-mono); font-size:1rem; }.not-found h1 { max-width:12ch; margin:.8rem 0; font-size:clamp(3.5rem,9vw,7rem); }.not-found p { max-width:55ch; color:var(--ink-soft); }
@media (max-width:980px) {
  .site-header { grid-template-columns:auto auto auto; }.site-nav { position:absolute; top:calc(100% + .4rem); right:1rem; left:1rem; display:none; flex-direction:column; border-radius:.8rem; box-shadow:var(--shadow); }.site-nav.open { display:flex; }.nav-toggle { display:block; justify-self:end; }.theme-toggle { margin-left:.45rem; }.theme-label { display:none; }
  .hero,.page-hero,.planner-layout,.operator-section,.proof-grid { grid-template-columns:1fr; }.hero { min-height:auto; }.instrument { max-width:620px; }.route-grid { grid-template-columns:repeat(2,1fr); }.format-grid,.privacy-grid { grid-template-columns:1fr; }.mount-grid { grid-template-columns:repeat(2,1fr); }.source-grid { grid-template-columns:repeat(2,1fr); }.site-footer { grid-template-columns:1fr 1fr; }.build-stamp { align-items:flex-start; }
}
@media (max-width:700px) {
  .emergency-strip { justify-content:flex-start; flex-wrap:wrap; }.emergency-limit { width:100%; padding-left:1.45rem; }
  .hero { padding-block:4rem; }.hero h1,.page-hero h1 { font-size:clamp(3.7rem,20vw,6rem); }.instrument { transform:none; }.instrument-foot { flex-direction:column; }
  .metrics { grid-template-columns:repeat(2,1fr); }.metrics div:nth-child(2) { border-right:0; }.metrics div:nth-child(-n+2) { border-bottom:1px solid var(--line); }
  .section-heading,.split-section,.contact-band,.maintenance-band { grid-template-columns:1fr; }.action-grid,.proof-cards,.download-matrix,.download-route-grid { grid-template-columns:1fr; }.route-grid { grid-template-columns:1fr; }.route-card { min-height:210px; }.mount-grid,.source-grid { grid-template-columns:1fr; }.format-card { grid-template-columns:80px 1fr; }.site-footer { grid-template-columns:1fr; }.planner-head { align-items:center; }.planner-head h2 { font-size:2.5rem; }.progress-ring { width:76px; height:76px; }.progress-ring::before { width:60px; height:60px; }
}
@media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
@media print { .site-header,.emergency-strip,.theme-toggle,.nav-toggle,.site-footer,.planner-actions,.download-controls { display:none!important; } body { background:#fff; color:#000; } .shell { width:100%; } }
'''


SITE_JS = r'''
(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const storedTheme = localStorage.getItem('beg-theme');
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'auto') root.dataset.theme = storedTheme;
  themeButton?.addEventListener('click', () => {
    const order = ['auto', 'light', 'dark'];
    const next = order[(order.indexOf(root.dataset.theme || 'auto') + 1) % order.length];
    root.dataset.theme = next;
    localStorage.setItem('beg-theme', next);
    themeButton.setAttribute('aria-label', `Colour theme: ${next}. Activate to change.`);
  });

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  navToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') || false;
    navToggle.setAttribute('aria-expanded', String(open));
  });

  const planner = document.querySelector('[data-deployment-planner]');
  if (planner) {
    const storageKey = 'beg-deployment-plan-v1';
    const boxes = [...planner.querySelectorAll('input[type="checkbox"]')];
    const ring = planner.querySelector('.progress-ring');
    const number = planner.querySelector('[data-progress-number]');
    const bar = planner.querySelector('[data-progress-bar]');
    const status = planner.querySelector('.copy-status');
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { saved = []; }
    boxes.forEach(box => { box.checked = saved.includes(box.value); });
    const update = () => {
      const checked = boxes.filter(box => box.checked);
      const progress = Math.round((checked.length / boxes.length) * 100);
      ring?.style.setProperty('--progress', String(progress));
      if (number) number.textContent = `${progress}%`;
      if (bar) bar.style.width = `${progress}%`;
      localStorage.setItem(storageKey, JSON.stringify(checked.map(box => box.value)));
    };
    boxes.forEach(box => box.addEventListener('change', update));
    planner.querySelector('[data-reset-plan]')?.addEventListener('click', () => {
      boxes.forEach(box => { box.checked = false; });
      update();
      if (status) status.textContent = 'Checklist reset.';
    });
    planner.querySelector('[data-copy-plan]')?.addEventListener('click', async () => {
      const lines = boxes.map(box => `${box.checked ? '✓' : '○'} ${box.closest('label')?.querySelector('strong')?.textContent || box.value}`);
      const text = `Bathroom Emergency Guide deployment checklist\nRelease ${document.querySelector('.build-stamp span')?.textContent?.replace('Release ', '') || ''}\n\n${lines.join('\n')}`;
      try { await navigator.clipboard.writeText(text); if (status) status.textContent = 'Checklist copied.'; }
      catch { if (status) status.textContent = 'Copy unavailable; select and copy manually.'; }
    });
    update();
  }

  const codeButton = document.querySelector('[data-copy-code]');
  codeButton?.addEventListener('click', async () => {
    const code = document.querySelector('.code-card code')?.textContent || '';
    try { await navigator.clipboard.writeText(code); codeButton.textContent = 'Copied'; }
    catch { codeButton.textContent = 'Select code'; }
  });

  const filters = [...document.querySelectorAll('[data-download-filter]')];
  const groups = [...document.querySelectorAll('[data-download-group]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.downloadFilter;
    filters.forEach(item => item.classList.toggle('active', item === button));
    groups.forEach(group => { group.hidden = value !== 'all' && group.dataset.downloadGroup !== value; });
  }));
})();
'''


MARK_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="t"><title id="t">Bathroom Emergency Guide mark</title><circle cx="32" cy="32" r="29" fill="#f5f2e9" stroke="#123b31" stroke-width="3"/><path d="M20 23h24M17 32h30M20 41h24" stroke="#0d7355" stroke-width="5" stroke-linecap="round"/><path d="M20 44 44 20" stroke="#2457a6" stroke-width="5" stroke-linecap="round"/></svg>'''


def build() -> Path:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    revision = git_revision()
    date = build_date()
    subguides = json.loads((DATA / "subguides.json").read_text(encoding="utf-8"))
    nodes = subguides["nodes"]
    released = set(subguides["standalone_nodes"])
    coverage = json.loads((DATA / "coverage_matrix.json").read_text(encoding="utf-8"))
    references = json.loads((DATA / "reference_ids.json").read_text(encoding="utf-8"))
    content_index = json.loads((DATA / "content_index.json").read_text(encoding="utf-8"))
    metrics = {
        "chapters": len(list((ROOT / "src" / "chapters").glob("*.md"))),
        "standalone": len(released),
        "references": len(references.get("ids", {}))
        - len(references.get("retired_resource_keys", [])),
        "figures": sum(1 for item in content_index["records"] if item.get("kind") == "G"),
        "authored_visuals": coverage["totals"]["reader_visuals"],
    }

    write(OUT / "index.html", landing_page(nodes, released, metrics, revision, date))
    write(OUT / "deploy" / "index.html", deployment_page(revision, date))
    write(OUT / "downloads" / "index.html", downloads_page(nodes, released, revision, date))
    write(OUT / "404.html", not_found_page(revision, date))
    write(OUT / "assets" / "site.css", SITE_CSS.strip() + "\n")
    write(OUT / "assets" / "site.js", SITE_JS.strip() + "\n")
    write(OUT / "assets" / "mark.svg", MARK_SVG + "\n")
    write(OUT / ".nojekyll", "")
    write(OUT / "robots.txt", "User-agent: *\nAllow: /\n")
    write(
        OUT / "site.webmanifest",
        json.dumps(
            {
                "name": "Bathroom Emergency Guide",
                "short_name": "Bathroom Emergency",
                "description": "A sourced, printable, locally deployable decision guide.",
                "start_url": "./",
                "display": "standalone",
                "background_color": "#f5f2e9",
                "theme_color": "#112923",
                "icons": [{"src": "assets/mark.svg", "sizes": "any", "type": "image/svg+xml"}],
            },
            indent=2,
        )
        + "\n",
    )

    # Self-contained guide and route package for GitHub Pages.
    copy(BUILD / "html" / "guide.html", OUT / "guide" / "index.html")
    shutil.copytree(BUILD / "subguides", OUT / "routes", dirs_exist_ok=True)
    for name in MASTER_FILES:
        copy(BUILD / "html" / name, OUT / "files" / name)
    for name in MASTER_PDFS:
        copy(BUILD / "pdf" / name, OUT / "files" / name)
    for name in ("README.md", "DEPLOYMENT.md", "CHANGELOG.md"):
        copy(ROOT / name, OUT / "docs" / name)

    release_meta = {
        "schema_version": 1,
        "project": "bathroom-emergency-guide",
        "release": VERSION,
        "revision": revision,
        "build_date": date,
        "published_by_this_build": False,
        "deployment_performed_by_this_build": False,
        "metrics": metrics | {
            "graph_nodes": coverage["totals"]["nodes"],
            "sources": coverage["totals"]["sources"],
            "standalone_pdf_editions": len(released) * 6,
        },
        "standalone_nodes": sorted(released),
        "pages_entrypoint": "index.html",
    }
    write(OUT / "meta" / "release.json", json.dumps(release_meta, indent=2, ensure_ascii=False) + "\n")

    custom_domain = os.environ.get("PAGES_CUSTOM_DOMAIN", "").strip()
    if custom_domain:
        write(OUT / "CNAME", custom_domain + "\n")

    print(f"  [OK] modern Pages site → {OUT.relative_to(ROOT)}")
    return OUT / "index.html"


if __name__ == "__main__":
    build()
