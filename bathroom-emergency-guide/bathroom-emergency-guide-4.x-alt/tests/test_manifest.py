"""
Tests for src/data/subguide_manifest.json structure and file existence.
"""
import json
import os
import pytest

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "data", "subguide_manifest.json")


def test_manifest_loads_and_has_all_subguides():
    with open(MANIFEST_PATH) as f:
        m = json.load(f)
    expected = {"calm", "ambulance", "responsibility", "safety", "zombie",
                "support", "appendix", "body", "social", "disaster", "templates"}
    assert set(m.keys()) == expected


def test_manifest_entries_have_required_fields():
    with open(MANIFEST_PATH) as f:
        m = json.load(f)
    required = {"title", "accent", "pattern", "mascot", "chapters", "sources", "version", "tagline"}
    for key, entry in m.items():
        missing = required - set(entry.keys())
        assert not missing, f"{key} missing fields: {missing}"
        assert isinstance(entry["chapters"], list) and len(entry["chapters"]) > 0
        assert entry["accent"].startswith("#")


def test_manifest_chapter_files_exist():
    with open(MANIFEST_PATH) as f:
        m = json.load(f)
    src_root = os.path.join(os.path.dirname(__file__), "..", "src")
    for key, entry in m.items():
        for ch in entry["chapters"]:
            path = os.path.join(src_root, ch)
            assert os.path.exists(path), f"{key}: chapter file missing: {ch} (looked at {path})"


def test_hub_files_exist():
    hub_dir = os.path.join(os.path.dirname(__file__), "..", "src", "hub")
    for name in ["00-cover.md", "01-map.md", "02-directory.md"]:
        assert os.path.exists(os.path.join(hub_dir, name)), f"Hub file missing: {name}"
