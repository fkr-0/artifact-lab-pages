#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$ROOT/build/diagrams"
mkdir -p "$OUT"

echo "Bathroom Emergency Guide — diagram build"
python3 "$ROOT/src/diagrams/generate_pixel_art.py" "$OUT"
python3 "$ROOT/src/diagrams/generate_flowgraph.py" "$OUT"
echo "  refreshed all referenced diagrams"
