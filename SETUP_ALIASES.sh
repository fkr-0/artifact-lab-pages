# Artifacts Server Aliases
# Add to your ~/.bashrc or ~/.zshrc

# Path to artifacts directory
export ARTIFACTS_DIR="/home/user/work/code/artifacts"
export ARTIFACTS_PORT="${ARTIFACTS_PORT:-8080}"

# Source the server functions
if [[ -f "$ARTIFACTS_DIR/artifacts-server.sh" ]]; then
    source "$ARTIFACTS_DIR/artifacts-server.sh"
fi

# Quick aliases
alias artifacts='cd $ARTIFACTS_DIR'
alias nexus='artifacts-open'
alias nexus-stop='artifacts-stop'
alias nexus-status='artifacts-status'
