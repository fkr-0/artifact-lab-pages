#!/usr/bin/env python3
"""Write a deterministic inventory of release artifacts and build provenance."""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path

from project_meta import VERSION, build_date, git_revision

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
OUT = BUILD / "release" / "manifest.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def version_line(binary: str, *args: str) -> str | None:
    command = shutil.which(binary)
    if not command:
        return None
    result = subprocess.run([command, *args], text=True, capture_output=True)
    text = (result.stdout or result.stderr).strip().splitlines()
    return text[0] if text else None


def build() -> Path:
    files = []
    for path in sorted(BUILD.rglob("*")):
        if not path.is_file() or path == OUT:
            continue
        if any(part in {"qa", "release"} for part in path.relative_to(BUILD).parts):
            continue
        if path.suffix.lower() not in {".html", ".pdf", ".docx", ".tex", ".md", ".json", ".svg", ".png", ".css", ".js"}:
            continue
        files.append({
            "path": str(path.relative_to(ROOT)),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
        })
    standalone = json.loads((ROOT / "src/data/subguides.json").read_text(encoding="utf-8"))["standalone_nodes"]
    manifest = {
        "schema_version": 1,
        "project": "bathroom-emergency-guide",
        "release": VERSION,
        "revision": git_revision(),
        "build_date": build_date(),
        "deployment_performed": False,
        "publish_performed": False,
        "standalone_nodes": standalone,
        "master_layouts": ["a4", "a4half", "largeprint"],
        "print_modes": ["color", "mono"],
        "toolchain": {
            "python": version_line("python3", "--version"),
            "node": version_line("node", "--version"),
            "npm": version_line("npm", "--version"),
            "pandoc": version_line("pandoc", "--version"),
            "weasyprint": version_line("weasyprint", "--version"),
            "pdfinfo": version_line("pdfinfo", "-v"),
        },
        "artifacts": files,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  [OK] release manifest: {len(files)} hashed artifacts → {OUT.relative_to(ROOT)}")
    return OUT


if __name__ == "__main__":
    build()
