"""Tests for generate_mascots.py — mascot sprite generator."""
import os
import tempfile


def test_generates_all_manifest_mascots():
    from src.diagrams.generate_mascots import generate_all_mascots
    with tempfile.TemporaryDirectory() as td:
        generate_all_mascots(td)
        files = set(os.listdir(td))
        expected = {f"mascot_{name}.png" for name in
                    ["calm", "ambulance", "responsibility", "safety", "zombie",
                     "support", "appendix", "body", "social", "disaster", "templates"]}
        assert files == expected


def test_mascot_dimensions():
    from src.diagrams.generate_mascots import generate_all_mascots
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_all_mascots(td)
        for f in os.listdir(td):
            img = Image.open(os.path.join(td, f))
            assert img.size == (32, 32), f"{f} should be 32x32, got {img.size}"
            assert img.mode == "RGBA"


def test_mascots_use_subguide_accent():
    """Each mascot should contain pixels of its subguide's accent color."""
    from src.diagrams.generate_mascots import generate_all_mascots
    from src.diagrams.palette import SUBGUIDES, hex_to_rgba
    from PIL import Image
    import numpy as np
    with tempfile.TemporaryDirectory() as td:
        generate_all_mascots(td)
        for key, sg in SUBGUIDES.items():
            img = Image.open(os.path.join(td, f"mascot_{key}.png"))
            arr = np.array(img)
            accent = hex_to_rgba(sg.accent)
            # Check that at least some pixels match the accent color
            matches = np.all(arr == accent, axis=2)
            assert matches.any(), f"mascot_{key} has no pixels in accent color {sg.accent}"
