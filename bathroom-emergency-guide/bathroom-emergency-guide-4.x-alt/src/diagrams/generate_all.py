"""Generate all diagrams for the v4-alt bathroom emergency guide."""
from __future__ import annotations

import os
import sys

from .generate_patterns import generate_all_patterns
from .generate_mascots import generate_all_mascots
from .generate_hub import generate_hub_diagrams
from .generate_subguide_diagrams import generate_subguide_diagrams


def generate_all(output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    print("=== Patterns ===")
    generate_all_patterns(output_dir)
    print("=== Mascots ===")
    generate_all_mascots(output_dir)
    print("=== Hub Diagrams ===")
    generate_hub_diagrams(output_dir)
    print("=== Subguide Diagrams ===")
    generate_subguide_diagrams(output_dir)
    print(f"=== Done: {len(os.listdir(output_dir))} files in {output_dir} ===")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), "..", "..", "build", "diagrams")
    generate_all(out)
