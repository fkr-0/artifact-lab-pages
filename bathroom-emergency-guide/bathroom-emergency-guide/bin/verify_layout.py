#!/usr/bin/env python3
"""Render and verify the 105 x 297 mm A4/2 field-strip PDFs.

The checks are intentionally renderer-based: page geometry, blank pages, edge
collisions, text extraction, representative-page contact sheets, and required
content markers are verified after Chromium has produced the PDFs.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PDFS = (
    ROOT / "build" / "pdf" / "guide_a4half.pdf",
    ROOT / "build" / "pdf" / "guide_a4half_mono.pdf",
)
QA = ROOT / "build" / "qa" / "a4half"
EXPECTED_WIDTH_PT = 105 / 25.4 * 72
EXPECTED_HEIGHT_PT = 297 / 25.4 * 72
REQUIRED_MARKERS = (
    "How to Use the Eleven Books",
    "The Green Book — Body Owner’s Manual",
    "The gastrointestinal chapter you did not ask for",
    "Pain: communication, not a verdict",
    "The Amber Book — Responsibility",
    "Five Different Kinds of “Too Much”",
    "The Teal Book — Calm Guide",
    "The Red Book — Self Ambulance",
    "The Blue Book — Safety & No Place",
    "Orange Book — The Environment May Be Unsafe",
    "The Orange Book — Natural Disasters",
    "Essential medication and powered-device failure",
    "The Olive Book — Zombie Guide",
    "The Indigo Book — Professional Support",
    "The Purple Book — Social Field Guide",
    "The Grey Book — Templates & Forms",
    "The Copper Book — Reference",
)


class VerificationError(RuntimeError):
    pass


def run(command: list[str]) -> str:
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise VerificationError(f"{' '.join(command)}\n{detail}")
    return result.stdout


def require(binary: str) -> str:
    found = shutil.which(binary)
    if not found:
        raise VerificationError(f"required command not found: {binary}")
    return found


def pdf_info(path: Path) -> tuple[int, float, float]:
    output = run([require("pdfinfo"), str(path)])
    pages_match = re.search(r"^Pages:\s+(\d+)", output, re.MULTILINE)
    size_match = re.search(
        r"^Page size:\s+([0-9.]+) x ([0-9.]+) pts",
        output,
        re.MULTILINE,
    )
    if not pages_match or not size_match:
        raise VerificationError(f"could not parse pdfinfo for {path}")
    if not re.search(r"^Tagged:\s+yes", output, re.MULTILINE):
        raise VerificationError(f"PDF is not tagged: {path.name}")
    return int(pages_match.group(1)), float(size_match.group(1)), float(size_match.group(2))


def text_pages(path: Path) -> list[str]:
    text = run([require("pdftotext"), "-layout", str(path), "-"])
    if "\ufffd" in text:
        raise VerificationError(f"replacement glyph found in extracted text: {path.name}")
    return text.split("\f")


def dark_mask(image: Image.Image) -> Image.Image:
    gray = image.convert("L")
    return gray.point(lambda pixel: 255 if pixel < 242 else 0)


def dark_count(mask: Image.Image) -> int:
    histogram = mask.histogram()
    return histogram[255]


def edge_dark_count(mask: Image.Image, band: int = 2) -> int:
    width, height = mask.size
    strips = (
        mask.crop((0, 0, width, band)),
        mask.crop((0, height - band, width, height)),
        mask.crop((0, 0, band, height)),
        mask.crop((width - band, 0, width, height)),
    )
    return sum(dark_count(strip) for strip in strips)


def marker_pages(pages: list[str]) -> list[int]:
    found: list[int] = []
    for marker in REQUIRED_MARKERS:
        for index, page in enumerate(pages, start=1):
            if marker.lower() in re.sub(r"\s+", " ", page).lower():
                found.append(index)
                break
        else:
            raise VerificationError(f"required marker missing from A4/2 text: {marker}")
    return found


def contact_sheet(images: dict[int, Path], output: Path) -> None:
    thumbs: list[tuple[int, Image.Image]] = []
    for page, path in sorted(images.items()):
        image = Image.open(path).convert("RGB")
        image.thumbnail((230, 650), Image.Resampling.LANCZOS)
        framed = ImageOps.expand(image, border=1, fill="black")
        thumbs.append((page, framed))

    columns = 4
    cell_width = 250
    cell_height = 690
    rows = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    for index, (page, image) in enumerate(thumbs):
        x = (index % columns) * cell_width + (cell_width - image.width) // 2
        y = (index // columns) * cell_height + 24
        sheet.paste(image, (x, y))
        label_y = 3 + (index // columns) * cell_height
        draw = ImageDraw.Draw(sheet)
        draw.rectangle((x, label_y, x + 46, label_y + 17), fill="black")
        draw.text((x + 5, label_y + 2), f"p.{page}", fill="white")
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def verify_pdf(path: Path, *, quiet: bool) -> dict[str, object]:
    if not path.exists():
        raise VerificationError(f"missing A4/2 PDF: {path}")

    pages, width_pt, height_pt = pdf_info(path)
    if pages < 60:
        raise VerificationError(f"A4/2 PDF is suspiciously short: {pages} pages")
    if abs(width_pt - EXPECTED_WIDTH_PT) > 1.5 or abs(height_pt - EXPECTED_HEIGHT_PT) > 1.5:
        raise VerificationError(
            f"wrong A4/2 geometry for {path.name}: {width_pt:.2f} x {height_pt:.2f} pt"
        )

    extracted = text_pages(path)
    marker_page_numbers = marker_pages(extracted)
    selected = {
        1,
        2,
        max(1, pages // 4),
        max(1, pages // 2),
        max(1, (pages * 3) // 4),
        pages,
        *marker_page_numbers,
    }

    with tempfile.TemporaryDirectory(prefix="bathroom-guide-a4half-") as tmp:
        tmp_path = Path(tmp)
        prefix = tmp_path / "page"
        run([require("pdftoppm"), "-png", "-r", "96", str(path), str(prefix)])
        rendered = sorted(tmp_path.glob("page-*.png"))
        if len(rendered) != pages:
            raise VerificationError(
                f"renderer returned {len(rendered)} pages for {path.name}; expected {pages}"
            )

        selected_images: dict[int, Path] = {}
        blank_pages: list[int] = []
        edge_collisions: list[int] = []
        narrow_margin_pages: list[int] = []

        for index, image_path in enumerate(rendered, start=1):
            image = Image.open(image_path)
            mask = dark_mask(image)
            bbox = mask.getbbox()
            count = dark_count(mask)
            text = extracted[index - 1].strip() if index - 1 < len(extracted) else ""
            if not bbox or (len(text) < 12 and count < 450):
                blank_pages.append(index)
                continue
            if edge_dark_count(mask):
                edge_collisions.append(index)
            left, _top, right, _bottom = bbox
            if left < 6 or right > image.width - 6:
                narrow_margin_pages.append(index)
            if index in selected:
                selected_images[index] = image_path

        if blank_pages:
            raise VerificationError(f"blank or near-blank pages in {path.name}: {blank_pages}")
        if edge_collisions:
            raise VerificationError(f"content touches physical page edge in {path.name}: {edge_collisions}")
        if narrow_margin_pages:
            raise VerificationError(
                f"content enters six-pixel safety band in {path.name}: {narrow_margin_pages}"
            )

        contact = QA / f"{path.stem}-contact.png"
        contact_sheet(selected_images, contact)

    result = {
        "path": str(path.relative_to(ROOT)),
        "pages": pages,
        "size_pt": [round(width_pt, 2), round(height_pt, 2)],
        "contact_sheet": str(contact.relative_to(ROOT)),
        "markers": marker_page_numbers,
    }
    if not quiet:
        print(
            f"Layout verified: {path.relative_to(ROOT)} — {pages} pages, "
            f"{width_pt:.2f} x {height_pt:.2f} pt, no blanks or edge collisions"
        )
        print(f"  contact sheet: {contact.relative_to(ROOT)}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    for pdf in PDFS:
        verify_pdf(pdf, quiet=args.quiet)
    if not args.quiet:
        print("A4/2 color and monochrome layout verification passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except VerificationError as exc:
        print(f"LAYOUT VERIFICATION FAILED: {exc}")
        raise SystemExit(1)
