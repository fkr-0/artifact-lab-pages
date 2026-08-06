#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$ROOT/build/diagrams"
mkdir -p "$OUT"

echo "Bathroom Emergency Guide — diagram build"
python3 "$ROOT/src/diagrams/generate_all.py" "$OUT"
echo "  refreshed orientation, safety, and evidence diagrams"
