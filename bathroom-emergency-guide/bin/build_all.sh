#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Bathroom Emergency Guide — Full Build Pipeline
# Generates diagrams + assembles + converts to all formats
#
# Usage:
#   ./build_all.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════╗"
echo "║  Bathroom Emergency Guide — Full Build ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Step 1: Diagrams
"$SCRIPT_DIR/build_diagrams.sh"
echo ""

# Step 2: Document (all formats)
"$SCRIPT_DIR/build_guide.sh" all

echo ""
echo "Build pipeline complete. Check build/ for outputs."
