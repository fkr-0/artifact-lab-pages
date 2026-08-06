import pytest


def test_subguides_has_all_manifest_entries():
    from src.diagrams.palette import SUBGUIDES
    expected = {"calm", "ambulance", "responsibility", "safety", "zombie",
                "support", "appendix", "body", "social", "disaster", "templates"}
    assert set(SUBGUIDES.keys()) == expected


def test_each_subguide_has_required_fields():
    from src.diagrams.palette import SUBGUIDES
    for key, sg in SUBGUIDES.items():
        assert sg.accent.startswith("#"), f"{key}.accent not a hex color"
        assert sg.accent_dim.startswith("#"), f"{key}.accent_dim not a hex color"
        assert sg.accent_glow.startswith("rgba"), f"{key}.accent_glow not rgba"
        assert sg.secondary.startswith("#"), f"{key}.secondary not a hex color"
        assert len(sg.name) > 0, f"{key}.name is empty"
        assert sg.pattern in {"wave", "cross", "diamond", "shield", "crosshatch",
                               "dots", "solid", "pulse", "zigzag", "speech"}


def test_hex_to_rgba():
    from src.diagrams.palette import hex_to_rgba
    assert hex_to_rgba("#FF0000") == (255, 0, 0, 255)
    assert hex_to_rgba("#00FF00", 128) == (0, 255, 0, 128)
    assert hex_to_rgba("1E2228") == (30, 34, 40, 255)


def test_shared_constants_exist():
    from src.diagrams.palette import PAPER, INK, MUTED
    assert PAPER.startswith("#")
    assert INK.startswith("#")
    assert MUTED.startswith("#")
