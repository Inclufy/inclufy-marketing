#!/bin/bash
# ═══════════════════════════════════════════════════════════
# AMOS E2E Test Runner
# ═══════════════════════════════════════════════════════════
#
# Usage:
#   ./e2e/run-tests.sh                  # Full test suite
#   ./e2e/run-tests.sh --capture-only   # Only capture flows
#   ./e2e/run-tests.sh --tabs-only      # Only tab navigation
#   ./e2e/run-tests.sh --events-only    # Only event/campaign creation
#   ./e2e/run-tests.sh --social-setup   # Only social channel setup
#
# Prerequisites:
#   - Maestro CLI installed
#   - iOS Simulator running with AMOS app
#   - Node.js 18+

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$SCRIPT_DIR/agent"

# Ensure Java and Maestro are on PATH
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH:$HOME/.maestro/bin"

echo ""
echo "══════════════════════════════════════════════"
echo "  AMOS E2E Test Runner"
echo "══════════════════════════════════════════════"
echo ""

# Check Maestro
if ! command -v "$HOME/.maestro/bin/maestro" &>/dev/null; then
  echo "❌ Maestro not found. Installing..."
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi

echo "✅ Maestro: $(~/.maestro/bin/maestro --version 2>&1 | head -1)"

# Check simulator
BOOTED=$(xcrun simctl list devices booted 2>/dev/null | grep -c "Booted" || true)
if [ "$BOOTED" -eq 0 ]; then
  echo "❌ No iOS Simulator is running. Please start one first."
  exit 1
fi
echo "✅ iOS Simulator running"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+."
  exit 1
fi
echo "✅ Node.js: $(node --version)"

# Install agent dependencies if needed
if [ ! -d "$AGENT_DIR/node_modules" ]; then
  echo ""
  echo "📦 Installing agent dependencies..."
  cd "$AGENT_DIR" && npm install
  cd "$SCRIPT_DIR/.."
fi

# Run orchestrator
echo ""
echo "🚀 Starting test orchestrator..."
echo ""

cd "$AGENT_DIR"
npx tsx test-orchestrator.ts "$@"
