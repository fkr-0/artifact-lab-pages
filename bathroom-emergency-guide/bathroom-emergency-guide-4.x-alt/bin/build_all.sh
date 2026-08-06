#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Building diagrams ==="
python3 -m src.diagrams.generate_all "$PROJECT_DIR/build/diagrams"

echo "=== Building combined guide (all layouts, color + mono) ==="
python3 "$SCRIPT_DIR/build_guide.py" --target all

echo "=== Building standalone subguides (all layouts, color + mono) ==="
for sg in calm ambulance responsibility safety zombie support appendix body social disaster templates; do
    python3 "$SCRIPT_DIR/build_guide.py" --subguide "$sg" --target all
done

echo "=== Build complete ==="
echo "Outputs:"
find "$PROJECT_DIR/build" -name '*.pdf' -type f | sort | while read -r f; do
    echo "  $(du -h "$f" | cut -f1) $f"
done
