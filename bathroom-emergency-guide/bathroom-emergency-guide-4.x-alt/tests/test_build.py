# tests/test_build.py
import json
import os
import subprocess
import pytest

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")


def test_build_script_exists():
    assert os.path.exists(os.path.join(PROJECT_ROOT, "bin", "build_guide.py"))


def test_build_md_for_single_subguide():
    """Build just the markdown assembly for one subguide."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--subguide", "calm", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    assert os.path.exists(os.path.join(PROJECT_ROOT, "build", "calm", "guide.md"))


def test_build_md_for_combined():
    """Build the combined markdown."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    assert os.path.exists(os.path.join(PROJECT_ROOT, "build", "combined", "guide.md"))


def test_subguide_md_includes_sources():
    """Each subguide's markdown must end with its own sources."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--subguide", "calm", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    md_path = os.path.join(PROJECT_ROOT, "build", "calm", "guide.md")
    content = open(md_path).read()
    assert "Sources" in content, "Subguide markdown should include sources"


def test_subguide_md_includes_emergency_gate():
    """Red-flag invariant: every standalone subguide includes the emergency gate."""
    result = subprocess.run(
        ["python3", "bin/build_guide.py", "--subguide", "calm", "--target", "md"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    )
    md_path = os.path.join(PROJECT_ROOT, "build", "calm", "guide.md")
    content = open(md_path).read()
    assert "112" in content, "Emergency gate with 112 must appear in every subguide"
