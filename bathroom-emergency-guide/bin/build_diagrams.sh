#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Bathroom Emergency Guide — Diagram Builder v2.0
# Generates pixel art sprites + all PNG diagrams to build/diagrams/
# ──────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIAGRAM_DIR="$PROJECT_ROOT/build/diagrams"

mkdir -p "$DIAGRAM_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Bathroom Emergency Guide — Diagrams v2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Generate pixel art sprites (must run first — diagrams reference them)
echo ""
echo "[1/2] Generating pixel art sprites..."
python3 "$PROJECT_ROOT/src/diagrams/generate_pixel_art.py" "$DIAGRAM_DIR"

# Step 2: Generate enhanced diagrams (with pixel art decorations)
echo ""
echo "[2/2] Generating diagrams with pixel art enhancements..."
python3 "$PROJECT_ROOT/src/diagrams/generate_all.py" "$DIAGRAM_DIR"

echo ""
echo "Diagrams saved to: $DIAGRAM_DIR"
ls -la "$DIAGRAM_DIR"/*.png 2>/dev/null | awk '{print "  " $NF}'
echo ""
echo "Done."
