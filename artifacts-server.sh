#!/usr/bin/env bash
#
# artifacts-server.sh
# Shell functions for hosting and viewing the Artifacts collection
#
# Source this file to add functions to your shell:
#   source artifacts-server.sh
#

# Default configuration
ARTIFACTS_PORT="${ARTIFACTS_PORT:-8080}"
ARTIFACTS_HOST="${ARTIFACTS_HOST:-localhost}"
ARTIFACTS_DIR="${ARTIFACTS_DIR:-/home/user/work/code/artifacts}"

# PID file for tracking the server
ARTIFACTS_PID_FILE="${ARTIFACTS_DIR}/.artifacts-server.pid"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ============================================
# artifacts-start
# Start the HTTP server for artifacts
# ============================================
artifacts-start() {
    local port="${1:-$ARTIFACTS_PORT}"
    local dir="${2:-$ARTIFACTS_DIR}"

    # Check if already running
    if artifacts-running; then
        echo -e "${YELLOW}⚠ Artifacts server already running on port $(artifacts-port)${NC}"
        artifacts-status
        return 0
    fi

    # Check directory exists
    if [[ ! -d "$dir" ]]; then
        echo -e "${RED}✗ Error: Directory not found: $dir${NC}"
        return 1
    fi

    # Start server in background
    echo -e "${CYAN}🚀 Starting Artifacts server...${NC}"
    cd "$dir" || return 1

    # Use Python 3 http.server
    python3 -m http.server "$port" > /dev/null 2>&1 &
    local server_pid=$!

    # Save PID
    echo $server_pid > "$ARTIFACTS_PID_FILE"

    # Wait a moment for server to start
    sleep 0.5

    # Verify it's running
    if kill -0 $server_pid 2>/dev/null; then
        echo -e "${GREEN}✓ Artifacts server started${NC}"
        echo -e "${CYAN}  URL: http://${ARTIFACTS_HOST}:${port}${NC}"
        echo -e "${CYAN}  Dir: ${dir}${NC}"
        echo -e "${CYAN}  PID: ${server_pid}${NC}"
    else
        echo -e "${RED}✗ Failed to start server${NC}"
        rm -f "$ARTIFACTS_PID_FILE"
        return 1
    fi
}

# ============================================
# artifacts-stop
# Stop the HTTP server
# ============================================
artifacts-stop() {
    if ! artifacts-running; then
        echo -e "${YELLOW}⚠ No artifacts server running${NC}"
        return 0
    fi

    local pid=$(cat "$ARTIFACTS_PID_FILE" 2>/dev/null)
    echo -e "${CYAN}🛑 Stopping Artifacts server (PID: ${pid})...${NC}"

    kill "$pid" 2>/dev/null
    rm -f "$ARTIFACTS_PID_FILE"

    # Verify it stopped
    sleep 0.5
    if artifacts-running; then
        echo -e "${YELLOW}⚠ Server still running, forcing kill...${NC}"
        kill -9 "$pid" 2>/dev/null
        rm -f "$ARTIFACTS_PID_FILE"
    fi

    echo -e "${GREEN}✓ Server stopped${NC}"
}

# ============================================
# artifacts-restart
# Restart the HTTP server
# ============================================
artifacts-restart() {
    artifacts-stop
    sleep 0.5
    artifacts-start "$@"
}

# ============================================
# artifacts-open
# Open artifacts in Firefox private window
# ============================================
artifacts-open() {
    local port="${1:-$ARTIFACTS_PORT}"
    local url="http://${ARTIFACTS_HOST}:${port}/app-hub-v11/index.html"

    # Start server if not running
    if ! artifacts-running; then
        echo -e "${CYAN}🚀 Starting server before opening...${NC}"
        artifacts-start "$port" || return 1
        sleep 1
    fi

    echo -e "${CYAN}🌐 Opening in Firefox Private Window...${NC}"
    echo -e "${CYAN}  URL: ${url}${NC}"

    # Open Firefox in private mode
    if command -v firefox &>/dev/null; then
        firefox --private-window "$url" &>/dev/null &
    elif command -v firefox-esr &>/dev/null; then
        firefox-esr --private-window "$url" &>/dev/null &
    else
        echo -e "${RED}✗ Firefox not found. Please install Firefox or use your browser:${NC}"
        echo -e "  ${url}"
        return 1
    fi

    echo -e "${GREEN}✓ Firefox opened${NC}"
}

# ============================================
# artifacts-view
# Alias for artifacts-open
# ============================================
artifacts-view() {
    artifacts-open "$@"
}

# ============================================
# artifacts-status
# Show server status
# ============================================
artifacts-status() {
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  ARTIFACTS SERVER STATUS${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"

    if artifacts-running; then
        local pid=$(cat "$ARTIFACTS_PID_FILE" 2>/dev/null)
        local port=$(artifacts-port)
        echo -e " ${GREEN}●${NC} Status: ${GREEN}Running${NC}"
        echo -e " ${CYAN}○${NC} PID:    ${pid}"
        echo -e " ${CYAN}○${NC} Port:   ${port}"
        echo -e " ${CYAN}○${NC} URL:    ${GREEN}http://${ARTIFACTS_HOST}:${port}/app-hub-v11/index.html${NC}"
        echo -e " ${CYAN}○${NC} Dir:    ${ARTIFACTS_DIR}"
    else
        echo -e " ${RED}●${NC} Status: ${RED}Stopped${NC}"
        echo -e " ${CYAN}○${NC} Dir:    ${ARTIFACTS_DIR}"
    fi

    echo -e "${MAGENTA}═══════════════════════════════════════${NC}"
}

# ============================================
# artifacts-running
# Check if server is running (internal)
# ============================================
artifacts-running() {
    if [[ ! -f "$ARTIFACTS_PID_FILE" ]]; then
        return 1
    fi

    local pid=$(cat "$ARTIFACTS_PID_FILE" 2>/dev/null)
    kill -0 "$pid" 2>/dev/null
}

# ============================================
# artifacts-port
# Get the current server port
# ============================================
artifacts-port() {
    if artifacts-running; then
        local pid=$(cat "$ARTIFACTS_PID_FILE" 2>/dev/null)
        # Get port from lsof or netstat
        if command -v lsof &>/dev/null; then
            lsof -p "$pid" -a -i 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1
        elif command -v netstat &>/dev/null; then
            netstat -tlnp 2>/dev/null | grep "$pid" | awk '{print $4}' | cut -d: -f2 | head -1
        else
            echo "$ARTIFACTS_PORT"
        fi
    else
        echo "N/A"
    fi
}

# ============================================
# artifacts-help
# Show help
# ============================================
artifacts-help() {
    cat <<'EOF'
${MAGENTA}═══════════════════════════════════════════════════════════${NC}
${MAGENTA}  ARTIFACTS SERVER - Command Reference${NC}
${MAGENTA}═══════════════════════════════════════════════════════════${NC}

${CYAN}Server Commands:${NC}
  artifacts-start [port]      Start HTTP server (default: 8080)
  artifacts-stop              Stop the server
  artifacts-restart [port]    Restart the server
  artifacts-status            Show server status

${CYAN}Browser Commands:${NC}
  artifacts-open [port]       Start server & open in Firefox private
  artifacts-view [port]       Alias for artifacts-open

${CYN}Quick Start:${NC}
  $ artifacts-start           # Start server on port 8080
  $ artifacts-open            # Open Firefox to NEXUS Portal

${CYAN}Or do it all at once:${NC}
  $ artifacts-open            # Auto-starts if needed

${CYAN}Environment Variables:${NC}
  ARTIFACTS_PORT              Server port (default: 8080)
  ARTIFACTS_DIR               Artifacts directory
  ARTIFACTS_HOST              Hostname (default: localhost)

${CYAN}Examples:${NC}
  $ artifacts-start 3000              # Use custom port
  $ ARTIFACTS_PORT=9000 artifacts-open
  $ artifacts-open                    # Auto-start, then open Firefox

${MAGENTA}═══════════════════════════════════════════════════════════${NC}
EOF
}

# ============================================
# Auto-show help on source
# ============================================
if [[ "${1:-}" == "help" ]] || [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    artifacts-help
    return 0
fi

# Show welcome message on source
echo -e "${GREEN}✓ Artifacts server functions loaded${NC}"
echo -e "${CYAN}  Type 'artifacts-help' for commands${NC}"
echo -e "${CYAN}  Type 'artifacts-open' to start${NC}"
