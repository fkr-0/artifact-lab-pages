#!/usr/bin/env python3
from pathlib import Path
import json
import re

try:
    import cairosvg
except Exception:
    cairosvg = None

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / "config" / "brand.json").read_text())

def replacements(cfg):
    name = cfg["brand_name"]
    return {
        "{{BRAND_NAME}}": name,
        "{{BRAND_NAME_UPPER}}": name.upper(),
        "{{BRAND_SLUG}}": cfg["brand_slug"],
        "{{BRAND_LINE}}": cfg["brand_line"],
        "{{BRAND_DESCRIPTOR}}": cfg["descriptor"],
        "{{BRAND_DOMAIN}}": cfg["domain"],
        "{{BRAND_EMAIL}}": cfg["email"],
        "{{DOC_PREFIX}}": cfg["doc_prefix"],
    }

def render_text(src: Path, dst: Path, reps: dict):
    txt = src.read_text()
    for k, v in reps.items():
        txt = txt.replace(k, v)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(txt)

def main():
    reps = replacements(config)
    generated = ROOT / "generated"
    generated.mkdir(exist_ok=True)

    for src in (ROOT / "templates" / "configurable").glob("*.template.*"):
        out_name = src.name.replace(".template", "")
        dst = generated / out_name
        render_text(src, dst, reps)
        if cairosvg is not None and dst.suffix.lower() == ".svg":
            cairosvg.svg2png(url=str(dst), write_to=str(dst.with_suffix(".png")))

    # Selected text templates
    mappings = {
        ROOT / "templates" / "letterhead" / "letterhead.template.html": generated / "letterhead.html",
        ROOT / "templates" / "comms" / "email_template.md": generated / "email_template.md",
        ROOT / "templates" / "markdown" / "document_template.md": generated / "document_template.md",
        ROOT / "brand" / "Configurable_Brand_System.md": generated / "brand_system.md",
    }
    for src, dst in mappings.items():
        if src.exists():
            render_text(src, dst, reps)
    print(f"Rendered configurable outputs to {generated}")

if __name__ == "__main__":
    main()
