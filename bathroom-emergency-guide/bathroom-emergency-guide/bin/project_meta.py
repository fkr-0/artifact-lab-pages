#!/usr/bin/env python3
"""Shared release/build metadata for deterministic guide tooling."""
from __future__ import annotations

import json
import os
import subprocess
import base64
import io
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
VERSION: str = PACKAGE["version"]
RELEASE_DATE = "2026-08-06"
SOURCE_REVIEW_DATE = "2026-08-06"


def git_revision() -> str:
    override = os.environ.get("GUIDE_REVISION")
    if override:
        return override
    result = subprocess.run(
        ["git", "rev-parse", "--short=12", "HEAD"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    return result.stdout.strip() if result.returncode == 0 else "uncommitted"


def build_date() -> str:
    epoch = os.environ.get("SOURCE_DATE_EPOCH")
    if epoch:
        return datetime.fromtimestamp(int(epoch), timezone.utc).date().isoformat()
    return datetime.now(timezone.utc).date().isoformat()


def _footer_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Use a bundled/system-neutral font when available, then degrade safely."""
    for candidate in (
        "DejaVuSansMono.ttf",
        "DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ):
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def revision_footer_css(*, title: str, layout: str, mode: str) -> str:
    """Return print CSS with a raster footer that cannot corrupt text order.

    Chromium inserts fixed textual footers into PDF extraction order, sometimes
    between two wrapped heading lines. The visible revision furniture is
    therefore rasterized for print. Equivalent provenance remains available in
    HTML metadata and the release manifest.
    """
    width = 1200 if layout == "a4half" else 2200
    height = 120
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    accent = "#111111" if mode == "mono" else "#0d7355"
    draw.rectangle((0, 0, width, 10), fill=accent)
    draw.rectangle((18, 25, 74, 81), outline=accent, width=4)
    for offset in range(24, 74, 14):
        draw.line((offset, 27, offset - 26, 79), fill=accent, width=3)

    layout_label = {"a4": "A4", "a4half": "A4/2", "largeprint": "LARGE PRINT"}[layout]
    first = f"Bathroom Emergency {VERSION} · {title}"
    second = f"{layout_label} / {mode} · {git_revision()} · {build_date()} · https://be.fkr.dev"
    lines = [first, second] if layout == "a4half" else [f"{first} · {second}"]
    max_width = width - 112
    size = 28 if layout == "a4half" else 30
    while size >= 15:
        font = _footer_font(size)
        if all(draw.textbbox((0, 0), line, font=font)[2] <= max_width for line in lines):
            break
        size -= 1
    font = _footer_font(size)
    if len(lines) == 1:
        box = draw.textbbox((0, 0), lines[0], font=font)
        y = (height - (box[3] - box[1])) // 2 - 1
        draw.text((96, y), lines[0], fill="#1c2925", font=font)
    else:
        draw.text((96, 24), lines[0], fill="#1c2925", font=font)
        draw.text((96, 65), lines[1], fill="#4d5d57", font=font)

    payload = io.BytesIO()
    image.save(payload, format="PNG", optimize=True)
    encoded = base64.b64encode(payload.getvalue()).decode("ascii")
    return "\n".join(
        (
            "@media print {",
            "  .revision-footer {",
            f'    background: #fff url("data:image/png;base64,{encoded}") no-repeat center / 100% 100% !important;',
            "  }",
            "  .revision-footer > * { display: none !important; }",
            "}",
        )
    )
