#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/build_diagrams.sh"
"$SCRIPT_DIR/build_guide.sh" all
python3 "$SCRIPT_DIR/validate_guide.py"
