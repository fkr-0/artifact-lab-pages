"""Shared color tokens for all subguide generators and CSS."""
from __future__ import annotations
from dataclasses import dataclass

# Diagram palette — warm-toned for print/PNG output. HTML uses separate tokens in src/styles/tokens.css.
PAPER = "#fbfaf4"
INK = "#14201d"
MUTED = "#52645e"
WHITE = "#ffffff"
DECISION = "#0d7355"


def hex_to_rgba(h: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = h.lstrip("#")
    return (int(h[:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


def _glow(hex_color: str, opacity: float = 0.06) -> str:
    r, g, b, _ = hex_to_rgba(hex_color)
    return f"rgba({r},{g},{b},{opacity})"


def _dim(hex_color: str, factor: float = 0.8) -> str:
    r, g, b, _ = hex_to_rgba(hex_color)
    return f"#{int(r*factor):02x}{int(g*factor):02x}{int(b*factor):02x}"


def _secondary(hex_color: str) -> str:
    r, g, b, _ = hex_to_rgba(hex_color)
    avg = (r + g + b) // 3
    return f"#{(r+avg)//2:02x}{(g+avg)//2:02x}{(b+avg)//2:02x}"


@dataclass(frozen=True)
class SubguidePalette:
    name: str
    accent: str
    accent_dim: str
    accent_glow: str
    secondary: str
    pattern: str


SUBGUIDES: dict[str, SubguidePalette] = {
    "calm": SubguidePalette(
        name="The Teal Book", accent="#2E8B7A", accent_dim=_dim("#2E8B7A"),
        accent_glow=_glow("#2E8B7A"), secondary=_secondary("#2E8B7A"), pattern="wave"),
    "ambulance": SubguidePalette(
        name="The Red Book", accent="#C23D2E", accent_dim=_dim("#C23D2E"),
        accent_glow=_glow("#C23D2E"), secondary=_secondary("#C23D2E"), pattern="cross"),
    "responsibility": SubguidePalette(
        name="The Amber Book", accent="#D4880A", accent_dim=_dim("#D4880A"),
        accent_glow=_glow("#D4880A"), secondary=_secondary("#D4880A"), pattern="diamond"),
    "safety": SubguidePalette(
        name="The Blue Book", accent="#2563EB", accent_dim=_dim("#2563EB"),
        accent_glow=_glow("#2563EB"), secondary=_secondary("#2563EB"), pattern="shield"),
    "zombie": SubguidePalette(
        name="The Olive Book", accent="#4A6741", accent_dim=_dim("#4A6741"),
        accent_glow=_glow("#4A6741"), secondary=_secondary("#4A6741"), pattern="crosshatch"),
    "support": SubguidePalette(
        name="The Indigo Book", accent="#6366F1", accent_dim=_dim("#6366F1"),
        accent_glow=_glow("#6366F1"), secondary=_secondary("#6366F1"), pattern="dots"),
    "appendix": SubguidePalette(
        name="The Appendix", accent="#B5763B", accent_dim=_dim("#B5763B"),
        accent_glow=_glow("#B5763B"), secondary=_secondary("#B5763B"), pattern="solid"),
    "body": SubguidePalette(
        name="The Green Book", accent="#16A34A", accent_dim=_dim("#16A34A"),
        accent_glow=_glow("#16A34A"), secondary=_secondary("#16A34A"), pattern="pulse"),
    "social": SubguidePalette(
        name="The Purple Book", accent="#9333EA", accent_dim=_dim("#9333EA"),
        accent_glow=_glow("#9333EA"), secondary=_secondary("#9333EA"), pattern="speech"),
    "disaster": SubguidePalette(
        name="The Orange Book", accent="#EA580C", accent_dim=_dim("#EA580C"),
        accent_glow=_glow("#EA580C"), secondary=_secondary("#EA580C"), pattern="zigzag"),
    "templates": SubguidePalette(
        name="The Grey Book", accent="#6B7280", accent_dim=_dim("#6B7280"),
        accent_glow=_glow("#6B7280"), secondary=_secondary("#6B7280"), pattern="solid"),
}
