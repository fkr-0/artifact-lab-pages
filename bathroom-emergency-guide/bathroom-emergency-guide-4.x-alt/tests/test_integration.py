# tests/test_integration.py
import os
import tempfile
import subprocess

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")

def test_generate_all_produces_expected_files():
    """Running generate_all should produce patterns, mascots, and hub diagrams."""
    with tempfile.TemporaryDirectory() as td:
        result = subprocess.run(
            ["python3", "-m", "src.diagrams.generate_all", td],
            cwd=PROJECT_ROOT, capture_output=True, text=True
        )
        assert result.returncode == 0, f"Failed: {result.stderr}"
        files = set(os.listdir(td))
        # Patterns
        for pattern in ["wave", "cross", "diamond", "shield", "crosshatch",
                        "dots", "solid", "pulse", "zigzag", "speech"]:
            assert f"pattern_{pattern}.png" in files, f"Missing pattern_{pattern}.png"
        # Mascots
        for key in ["calm", "ambulance", "responsibility", "safety", "zombie",
                    "support", "appendix", "body", "social", "disaster"]:
            assert f"mascot_{key}.png" in files, f"Missing mascot_{key}.png"
        # Hub diagrams
        assert "master_flowchart_v2.png" in files
        assert "emergency_banner.png" in files
        assert "axiom_icons.png" in files

def test_full_md_build():
    """End-to-end: generate diagrams then build combined markdown."""
    result = subprocess.run(
        ["python3", "-m", "src.diagrams.generate_all", "build/diagrams"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Diagram gen failed: {result.stderr}"
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    md_path = os.path.join(PROJECT_ROOT, "build", "combined", "guide.md")
    assert os.path.exists(md_path)
    content = open(md_path).read()
    assert len(content) > 1000, "Combined markdown seems too short"
