#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Bathroom Emergency Guide — Document Builder v2.5
# Delegates to bin/build_guide.py for all build operations.
#
# Usage:
#   ./build_guide.sh           # build all formats
#   ./build_guide.sh html      # HTML only
#   ./build_guide.sh pdf       # PDF only
#   ./build_guide.sh latex     # LaTeX only
#   ./build_guide.sh docx      # DOCX only
#   ./build_guide.sh md        # assembled markdown only
#   ./build_guide.sh mono      # monochrome variants only
# ──────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORMAT="${1:-all}"

exec python3 "$SCRIPT_DIR/build_guide.py" "$FORMAT"
