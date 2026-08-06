"""Tests for generate_patterns.py — Task 2."""
import os
import tempfile
import pytest


def test_generates_all_ten_patterns():
    from src.diagrams.generate_patterns import generate_all_patterns
    with tempfile.TemporaryDirectory() as td:
        generate_all_patterns(td)
        files = set(os.listdir(td))
        expected = {f"pattern_{name}.png" for name in
                    ["wave", "cross", "diamond", "shield", "crosshatch",
                     "dots", "solid", "pulse", "zigzag", "speech"]}
        assert files == expected


def test_pattern_files_are_valid_png():
    from src.diagrams.generate_patterns import generate_all_patterns
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_all_patterns(td)
        for f in os.listdir(td):
            img = Image.open(os.path.join(td, f))
            assert img.size == (128, 128), f"{f} is not 128x128"
            assert img.mode in ("RGBA", "RGB"), f"{f} has unexpected mode {img.mode}"


def test_patterns_are_structurally_distinct():
    """Each pattern must have a distinct pixel distribution (not just color swaps)."""
    from src.diagrams.generate_patterns import generate_all_patterns
    from PIL import Image
    import numpy as np
    with tempfile.TemporaryDirectory() as td:
        generate_all_patterns(td)
        signatures = {}
        for f in sorted(os.listdir(td)):
            img = Image.open(os.path.join(td, f)).convert("L")  # grayscale
            arr = np.array(img)
            # Binary threshold to compare structure, not color
            binary = (arr > 128).astype(int)
            sig = binary.tobytes()
            signatures[f] = sig
        # All signatures must be unique
        unique_sigs = set(signatures.values())
        assert len(unique_sigs) == 10, "Some patterns are identical in grayscale structure"
