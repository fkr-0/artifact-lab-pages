#!/usr/bin/env python3
"""Renderer-based density and blank-page checks for standard A4 editions."""

from __future__ import annotations

import hashlib
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PDFS = (
    ROOT / "build" / "pdf" / "guide.pdf",
    ROOT / "build" / "pdf" / "guide_mono.pdf",
)
QA = ROOT / "build" / "qa" / "density"
EXPECTED_WIDTH_PT = 210 / 25.4 * 72
EXPECTED_HEIGHT_PT = 297 / 25.4 * 72
MARKERS = (
    "How to Use the Eleven Books",
    "The Green Book — Body Owner’s Manual",
    "The Amber Book — Responsibility",
    "Five Different Kinds of “Too Much”",
    "The Blue Book — Safety & No Place",
    "Orange Book — The Environment May Be Unsafe",
    "The Teal Book — Calm Guide",
    "The Purple Book — Social Field Guide",
    "The Red Book — Self Ambulance",
    "The Olive Book — Zombie Guide",
    "The Orange Book — Natural Disasters",
    "The Indigo Book — Professional Support",
    "The Grey Book — Templates & Forms",
    "The Copper Book — Reference",
    "Version History",
    "Sources and Evidence Notes",
)


class DensityError(RuntimeError):
    pass


def require(binary: str) -> str:
    found = shutil.which(binary)
    if not found:
        raise DensityError(f"required command not found: {binary}")
    return found


def run(command: list[str]) -> str:
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise DensityError(f"{' '.join(command)}\n{detail}")
    return result.stdout


def pdf_info(path: Path) -> tuple[int, float, float]:
    info = run([require("pdfinfo"), str(path)])
    pages = re.search(r"^Pages:\s+(\d+)", info, re.MULTILINE)
    size = re.search(r"^Page size:\s+([0-9.]+) x ([0-9.]+) pts", info, re.MULTILINE)
    if not pages or not size:
        raise DensityError(f"could not parse pdfinfo for {path.name}")
    if not re.search(r"^Tagged:\s+yes", info, re.MULTILINE):
        raise DensityError(f"PDF is not tagged: {path.name}")
    return int(pages.group(1)), float(size.group(1)), float(size.group(2))


def text_pages(path: Path) -> list[str]:
    text = run([require("pdftotext"), "-layout", str(path), "-"])
    if "\ufffd" in text:
        raise DensityError(f"replacement glyph found in {path.name}")
    pages = text.split("\f")
    while pages and not pages[-1].strip():
        pages.pop()
    return pages


def normalized_text(pages: list[str]) -> str:
    return re.sub(r"\s+", " ", " ".join(pages)).strip()


def dark_mask(image: Image.Image) -> Image.Image:
    gray = image.convert("L")
    return gray.point(lambda pixel: 255 if pixel < 242 else 0)


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


def body_metrics(image: Image.Image) -> tuple[float, float]:
    gray = image.convert("L")
    width, height = gray.size
    body = gray.crop((int(width * 0.05), int(height * 0.07), int(width * 0.95), int(height * 0.93)))
    body_width, body_height = body.size
    pixels = body.load()
    active_rows: list[int] = []
    ink = 0
    row_threshold = max(2, int(body_width * 0.004))
    for y in range(body_height):
        count = sum(1 for x in range(body_width) if pixels[x, y] < 238)
        ink += count
        if count > row_threshold:
            active_rows.append(y)
    span = (active_rows[-1] - active_rows[0] + 1) / body_height if active_rows else 0.0
    occupancy = ink / (body_width * body_height)
    return span, occupancy


def marker_pages(pages: list[str]) -> list[int]:
    found: list[int] = []
    normalized = [re.sub(r"\s+", " ", page).lower() for page in pages]
    for marker in MARKERS:
        for index, page in enumerate(normalized, start=1):
            if marker.lower() in page:
                found.append(index)
                break
        else:
            raise DensityError(f"required chapter marker missing: {marker}")
    return found


def contact_sheet(images: dict[int, Path], output: Path) -> None:
    items: list[tuple[int, Image.Image]] = []
    for page, path in sorted(images.items()):
        image = Image.open(path).convert("RGB")
        image.thumbnail((235, 335), Image.Resampling.LANCZOS)
        items.append((page, ImageOps.expand(image, border=1, fill="black")))
    columns, cell_width, cell_height = 4, 255, 375
    rows = (len(items) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (page, image) in enumerate(items):
        x = (index % columns) * cell_width + (cell_width - image.width) // 2
        y = (index // columns) * cell_height + 24
        sheet.paste(image, (x, y))
        draw.rectangle((x, y - 20, x + 48, y - 3), fill="black")
        draw.text((x + 5, y - 18), f"p.{page}", fill="white")
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def verify(path: Path) -> dict[str, object]:
    if not path.exists():
        raise DensityError(f"missing PDF: {path}")
    page_count, width_pt, height_pt = pdf_info(path)
    if page_count < 60:
        raise DensityError(f"standard A4 PDF is suspiciously short: {page_count} pages")
    if abs(width_pt - EXPECTED_WIDTH_PT) > 1.5 or abs(height_pt - EXPECTED_HEIGHT_PT) > 1.5:
        raise DensityError(f"wrong A4 geometry for {path.name}: {width_pt:.2f} x {height_pt:.2f}")

    extracted = text_pages(path)
    if len(extracted) != page_count:
        raise DensityError(f"text extraction returned {len(extracted)} pages for {page_count}-page {path.name}")
    chapter_pages = marker_pages(extracted)

    with tempfile.TemporaryDirectory(prefix="bathroom-guide-density-") as tmp:
        tmp_path = Path(tmp)
        prefix = tmp_path / "page"
        run([require("pdftoppm"), "-png", "-r", "84", str(path), str(prefix)])
        rendered = sorted(tmp_path.glob("page-*.png"))
        if len(rendered) != page_count:
            raise DensityError(f"renderer returned {len(rendered)} pages for {path.name}; expected {page_count}")

        blank: list[int] = []
        edge: list[int] = []
        extreme: list[int] = []
        metrics: list[tuple[int, float, float]] = []
        paths: dict[int, Path] = {}
        for index, image_path in enumerate(rendered, start=1):
            image = Image.open(image_path)
            mask = dark_mask(image)
            count = dark_count(mask)
            text = re.sub(r"\s+", " ", extracted[index - 1]).strip()
            span, occupancy = body_metrics(image)
            metrics.append((index, span, occupancy))
            paths[index] = image_path
            if not mask.getbbox() or (len(text) < 40 and count < 700):
                blank.append(index)
            if edge_dark_count(mask):
                edge.append(index)
            if occupancy > 0.32:
                extreme.append(index)

        if blank:
            raise DensityError(f"blank or near-blank pages in {path.name}: {blank}")
        if edge:
            raise DensityError(f"content touches physical page edge in {path.name}: {edge}")
        if extreme:
            raise DensityError(f"extreme body density in {path.name}: {extreme}")

        sparse = sorted(metrics, key=lambda item: (item[1], item[2]))[:6]
        dense = sorted(metrics, key=lambda item: item[2], reverse=True)[:6]
        selected = {1, page_count, *chapter_pages, *(page for page, _span, _occ in sparse), *(page for page, _span, _occ in dense)}
        selected_paths = {page: paths[page] for page in sorted(selected)}
        contact = QA / f"{path.stem}-density-contact.png"
        contact_sheet(selected_paths, contact)

    occupancies = [occupancy for _page, _span, occupancy in metrics]
    spans = [span for _page, span, _occupancy in metrics]
    return {
        "path": path,
        "pages": page_count,
        "text": normalized_text(extracted),
        "median_occupancy": sorted(occupancies)[len(occupancies) // 2],
        "max_occupancy": max(occupancies),
        "median_span": sorted(spans)[len(spans) // 2],
        "sparse": sparse,
        "contact": contact,
    }


def main() -> int:
    results = [verify(path) for path in PDFS]
    if results[0]["pages"] != results[1]["pages"]:
        raise DensityError("standard color/mono page counts differ")
    color_hash = hashlib.sha256(str(results[0]["text"]).encode()).hexdigest()
    mono_hash = hashlib.sha256(str(results[1]["text"]).encode()).hexdigest()
    if color_hash != mono_hash:
        raise DensityError("standard color/mono extracted text differs")
    for result in results:
        sparse_text = ", ".join(
            f"p.{page} span={span:.2f} ink={occupancy:.3f}"
            for page, span, occupancy in result["sparse"]
        )
        print(
            f"Density verified: {Path(result['path']).relative_to(ROOT)} — "
            f"{result['pages']} pages, median span {result['median_span']:.2f}, "
            f"median ink {result['median_occupancy']:.3f}, max ink {result['max_occupancy']:.3f}"
        )
        print(f"  sparsest review pages: {sparse_text}")
        print(f"  contact sheet: {Path(result['contact']).relative_to(ROOT)}")
    print("Standard A4 color/mono density, blank-page, edge, and text-parity verification passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except DensityError as exc:
        print(f"DENSITY VERIFICATION FAILED: {exc}")
        raise SystemExit(1)
