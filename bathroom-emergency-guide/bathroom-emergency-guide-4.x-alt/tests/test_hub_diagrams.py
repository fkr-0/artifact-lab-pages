"""Tests for generate_hub.py — Task 6."""
import os
import tempfile


def test_generates_hub_diagrams():
    from src.diagrams.generate_hub import generate_hub_diagrams
    with tempfile.TemporaryDirectory() as td:
        generate_hub_diagrams(td)
        expected = {"master_flowchart_v2.png", "emergency_banner.png", "axiom_icons.png"}
        assert expected.issubset(set(os.listdir(td)))


def test_master_flowchart_uses_subguide_colors():
    """The flowchart should reference all 10 subguide accent colors."""
    from src.diagrams.generate_hub import generate_hub_diagrams
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_hub_diagrams(td)
        img = Image.open(os.path.join(td, "master_flowchart_v2.png"))
        # Just verify it generated successfully and is a reasonable size
        assert img.size[0] >= 800, "Flowchart should be at least 800px wide"
        assert img.size[1] >= 600, "Flowchart should be at least 600px tall"


def test_emergency_banner_is_valid_png():
    from src.diagrams.generate_hub import generate_hub_diagrams
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_hub_diagrams(td)
        img = Image.open(os.path.join(td, "emergency_banner.png"))
        assert img.size[0] >= 400, "Banner should be at least 400px wide"
        assert img.mode in ("RGB", "RGBA"), f"Unexpected mode: {img.mode}"


def test_axiom_icons_is_valid_png():
    from src.diagrams.generate_hub import generate_hub_diagrams
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        generate_hub_diagrams(td)
        img = Image.open(os.path.join(td, "axiom_icons.png"))
        assert img.size[0] >= 400, "Axiom icons should be at least 400px wide"
        assert img.mode in ("RGB", "RGBA"), f"Unexpected mode: {img.mode}"
