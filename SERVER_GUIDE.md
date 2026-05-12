# Artifacts Server - Quick Start Guide

## Two Ways to Use

### Method 1: Standalone Script (Quickest)

```bash
# From anywhere, run:
./artifacts-serve

# Or with custom port:
./artifacts-serve 3000
```

This will:

1. Start the Python HTTP server
2. Open Firefox in private mode to NEXUS Portal v8
3. Keep running until you press Ctrl+C

### Method 2: Shell Functions (More Control)

```bash
# Source the functions into your shell
source artifacts-server.sh

# Start the server
artifacts-start

# Open Firefox private window
artifacts-open

# Check status
artifacts-status

# Stop server when done
artifacts-stop
```

## Setup Aliases (Optional)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Auto-source on shell init
source ~/work/code/artifacts/artifacts-server.sh

# Quick aliases
alias nexus='artifacts-open'
alias nexus-stop='artifacts-stop'
```

Then just type:

```bash
nexus        # Opens NEXUS Portal
nexus-stop   # Stops server
```

## Environment Variables

```bash
export ARTIFACTS_PORT=9000      # Custom port
export ARTIFACTS_DIR=/path/to   # Custom directory
```

## Files Created

| File                  | Description                                 |
| --------------------- | ------------------------------------------- |
| `artifacts-serve`     | Standalone script (runs & opens Firefox)    |
| `artifacts-server.sh` | Shell functions (start, stop, status, etc.) |
| `SETUP_ALIASES.sh`    | Alias config for ~/.bashrc                  |

## Usage Examples

```bash
# Quick start - one command
./artifacts-serve

# Using functions
source artifacts-server.sh
artifacts-start 3000
artifacts-open

# Check if running
artifacts-status

# Stop server
artifacts-stop

# Restart with new port
artifacts-restart 9000
```

## Troubleshooting

**Port already in use:**

```bash
# Use a different port
./artifacts-serve 3000
```

**Firefox not found:**
The script will show the URL to open manually.

**Server won't stop:**

```bash
# Force stop
kill $(cat .artifacts-server.pid)
rm .artifacts-server.pid
```

## URLs

- **NEXUS Portal:** <http://localhost:8080/app-hub/v8-portal.html>
- **Field Recorder:** <http://localhost:8080/app-hub/v7.html>
- **Ethic Brawl:** <http://localhost:8080/ethic-brawl/>
- **Groove Station:** <http://localhost:8080/peernet-orca/>
