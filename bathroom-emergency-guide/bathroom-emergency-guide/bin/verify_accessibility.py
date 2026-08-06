#!/usr/bin/env python3
"""Verify structured accessibility data and large-print output parity."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
ACCESS_PATH = ROOT / "src" / "data" / "accessibility_profiles.json"
STYLE_PATH = ROOT / "src" / "style-large-print.css"
QA = ROOT / "build" / "qa" / "largeprint"
HTMLS = [
    ROOT / "build" / "html" / "guide_largeprint.html",
    ROOT / "build" / "html" / "guide_largeprint_mono.html",
]
PDFS = [
    ROOT / "build" / "pdf" / "guide_largeprint.pdf",
    ROOT / "build" / "pdf" / "guide_largeprint_mono.pdf",
]
REQUIRED_MARKERS = (
    "The Blue Book — Safety & No Place",
    "G1 — A person or active threat makes the place unsafe",
    "G2 — There is no weather-safe place to sleep tonight",
    "G3 — A place exists, but it cannot safely support the person",
    "G4 — The place is physically safe",
    "Communication and access card",
    "Minimal written emergency card",
    "The safe-place handoff",
)
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


class StructureParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_main = False
        self.images: list[dict[str, str | None]] = []
        self.headings: list[int] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "main":
            self.in_main = True
        if self.in_main and tag == "img":
            self.images.append(values)
        if self.in_main and re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))

    def handle_endtag(self, tag: str) -> None:
        if tag == "main":
            self.in_main = False


def pdf_info(path: Path) -> str:
    result = subprocess.run(["pdfinfo", str(path)], capture_output=True, text=True)
    check(result.returncode == 0, f"pdfinfo could not read {path.name}")
    return result.stdout


def pdf_pages_text(path: Path) -> list[str]:
    result = subprocess.run(["pdftotext", "-layout", str(path), "-"], capture_output=True, text=True)
    check(result.returncode == 0, f"pdftotext could not read {path.name}")
    pages = result.stdout.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()  # pdftotext terminates a valid final page with a form feed.
    return pages


def normalize_text(text: str) -> str:
    """Normalize layout extraction without erasing meaningful word hyphens."""
    text = re.sub(r"(?<=\w)-\s+(?=\w)", "-", text)
    return re.sub(r"\s+", " ", text).strip()


def dark_mask(image: Image.Image) -> Image.Image:
    return image.convert("L").point(lambda pixel: 255 if pixel < 242 else 0)


def dark_count(mask: Image.Image) -> int:
    return mask.histogram()[255]


def edge_dark_count(mask: Image.Image, band: int = 2) -> int:
    width, height = mask.size
    strips = (
        mask.crop((0, 0, width, band)),
        mask.crop((0, height - band, width, height)),
        mask.crop((0, 0, band, height)),
        mask.crop((width - band, 0, width, height)),
    )
    return sum(dark_count(strip) for strip in strips)


def contact_sheet(images: dict[int, Path], output: Path) -> None:
    thumbs: list[tuple[int, Image.Image]] = []
    for page, path in sorted(images.items()):
        image = Image.open(path).convert("RGB")
        image.thumbnail((300, 430), Image.Resampling.LANCZOS)
        thumbs.append((page, ImageOps.expand(image, border=1, fill="black")))
    columns, cell_width, cell_height = 4, 320, 470
    rows = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (page, image) in enumerate(thumbs):
        x = (index % columns) * cell_width + (cell_width - image.width) // 2
        y = (index // columns) * cell_height + 27
        sheet.paste(image, (x, y))
        draw.rectangle((x, 4 + (index // columns) * cell_height, x + 52, 22 + (index // columns) * cell_height), fill="black")
        draw.text((x + 5, 6 + (index // columns) * cell_height), f"p.{page}", fill="white")
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def verify_rendered_pages(path: Path, pages: list[str], page_count: int) -> None:
    selected = {1, 2, max(1, page_count // 4), max(1, page_count // 2), max(1, page_count * 3 // 4), page_count}
    for marker in REQUIRED_MARKERS:
        normalized_marker = normalize_text(marker).lower()
        for index, page in enumerate(pages, start=1):
            if normalized_marker in normalize_text(page).lower():
                selected.add(index)
                break
    with tempfile.TemporaryDirectory(prefix="bathroom-guide-largeprint-") as tmp:
        tmp_path = Path(tmp)
        result = subprocess.run(
            [shutil.which("pdftoppm") or "pdftoppm", "-png", "-r", "72", str(path), str(tmp_path / "page")],
            capture_output=True, text=True,
        )
        check(result.returncode == 0, f"could not render {path.name}: {(result.stderr or result.stdout).strip()}")
        rendered = sorted(tmp_path.glob("page-*.png"))
        check(len(rendered) == page_count, f"renderer returned {len(rendered)} pages for {path.name}; expected {page_count}")
        edge_collisions: list[int] = []
        narrow_margins: list[int] = []
        selected_images: dict[int, Path] = {}
        for index, image_path in enumerate(rendered, start=1):
            image = Image.open(image_path)
            mask = dark_mask(image)
            bbox = mask.getbbox()
            if edge_dark_count(mask):
                edge_collisions.append(index)
            if bbox:
                left, _top, right, _bottom = bbox
                if left < 5 or right > image.width - 5:
                    narrow_margins.append(index)
            if index in selected:
                selected_images[index] = image_path
        check(not edge_collisions, f"content touches physical edge in {path.name}: {edge_collisions[:12]}")
        check(not narrow_margins, f"content enters five-pixel safety band in {path.name}: {narrow_margins[:12]}")
        contact_sheet(selected_images, QA / f"{path.stem}-contact.png")


try:
    access = json.loads(ACCESS_PATH.read_text(encoding="utf-8"))
except (FileNotFoundError, json.JSONDecodeError) as exc:
    access = {}
    errors.append(f"accessibility registry unavailable: {exc}")

check(access.get("release") == VERSION, "accessibility registry release mismatch")
profiles = access.get("profiles", [])
check(len(profiles) == 6, f"expected six accessibility profiles, found {len(profiles)}")
required_profile_ids = {
    "blind-low-vision", "deaf-hard-of-hearing", "speech-language",
    "cognitive-overload", "mobility-fatigue-pain", "sensory-panic-neurodivergent",
}
check({item.get("id") for item in profiles} == required_profile_ids, "accessibility profile set drifted")
for profile in profiles:
    pid = profile.get("id", "<missing>")
    for field in ("barrier", "adaptation", "handoff", "failure_escalation"):
        check(bool(profile.get(field)), f"accessibility profile {pid} lacks {field}")
for card in ("emergency", "safe_place", "communication"):
    check(bool(access.get("minimal_cards", {}).get(card)), f"minimal accessibility card missing: {card}")

try:
    style = STYLE_PATH.read_text(encoding="utf-8")
except FileNotFoundError:
    style = ""
    errors.append("large-print stylesheet is missing")
check("font-size: 13.25pt" in style, "large-print root font size is not the reviewed value")
check("grid-template-columns: 1fr" in style, "large-print route cards are not single-column")
check("LARGE PRINT / TEXT ROUTE FOLLOWS" in style, "large-print figure text-route marker missing")

for html_path in HTMLS:
    if not html_path.exists():
        errors.append(f"missing large-print HTML: {html_path.name}")
        continue
    html = html_path.read_text(encoding="utf-8")
    check(VERSION in html, f"{html_path.name} lacks version {VERSION}")
    parser = StructureParser()
    parser.feed(html)
    check(bool(parser.images), f"{html_path.name} contains no parsed guide images")
    for index, attrs in enumerate(parser.images, start=1):
        alt = attrs.get("alt")
        check(bool(alt and alt.strip()), f"{html_path.name} image {index} lacks alt text")
    for previous, current in zip(parser.headings, parser.headings[1:]):
        check(current <= previous + 1, f"{html_path.name} heading jump h{previous}→h{current}")

texts: list[str] = []
regular_pages = None
regular_info = pdf_info(ROOT / "build" / "pdf" / "guide.pdf") if (ROOT / "build" / "pdf" / "guide.pdf").exists() else ""
match = re.search(r"Pages:\s+(\d+)", regular_info)
if match:
    regular_pages = int(match.group(1))
for pdf_path in PDFS:
    if not pdf_path.exists():
        errors.append(f"missing large-print PDF: {pdf_path.name}")
        continue
    info = pdf_info(pdf_path)
    check("Tagged:          yes" in info, f"{pdf_path.name} is not tagged")
    check("A4" in info or "594" in info, f"{pdf_path.name} is not A4")
    pages_match = re.search(r"Pages:\s+(\d+)", info)
    page_count = int(pages_match.group(1)) if pages_match else 0
    if pages_match and regular_pages is not None:
        check(page_count > regular_pages, f"{pdf_path.name} is not longer than standard A4 despite larger type")
    pages = pdf_pages_text(pdf_path)
    check(len(pages) == page_count, f"text extractor returned {len(pages)} pages for {pdf_path.name}; expected {page_count}")
    normalized = [normalize_text(page) for page in pages]
    blank_pages = [index for index, page in enumerate(normalized, start=1) if not page]
    check(not blank_pages, f"{pdf_path.name} has blank extracted pages: {blank_pages[:8]}")
    document = " ".join(normalized).lower()
    for marker in REQUIRED_MARKERS:
        check(normalize_text(marker).lower() in document, f"{pdf_path.name} missing required marker: {marker}")
    texts.append(re.sub(r"\s+", "", "".join(pages)))
    verify_rendered_pages(pdf_path, pages, page_count)

if len(texts) == 2:
    check(texts[0] == texts[1], "large-print color and monochrome PDF text differ")

for figure in ("safe_place_route_map.png", "communication_access_card.png"):
    check((ROOT / "build" / "diagrams" / figure).exists(), f"accessibility figure missing: {figure}")

if errors:
    print("Accessibility verification failed:")
    for error in errors:
        print(f"  - {error}")
    raise SystemExit(1)
print(f"Accessibility verified: {len(profiles)} profiles, image alternatives, heading order, full-page edge safety, contact sheets, and color/mono large-print A4 parity at {VERSION}.")
