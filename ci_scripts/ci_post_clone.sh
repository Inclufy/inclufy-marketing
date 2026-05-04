#!/bin/sh
# =============================================================================
# Xcode Cloud post-clone hook — AMOS (InclufyGO Marketing app)
#
# Runs once per Xcode Cloud build, after the repo is cloned and before
# xcodebuild starts archiving. Adopts the hardening already proven on
# Finance + ProjeXtPal:
#   - Defensive Node detection (don't `brew install` if it's already there)
#   - npm ci -> npm install fallback for lockfile drift
#   - Sentry source-map auto-upload disabled when no org/token configured
#   - expo prebuild without --clean (preserve committed ios/ entitlements)
#   - Diagnostic logging for Podfile.lock / RN version mismatch
#   - Phase markers for build-log readability
# =============================================================================
set -e
set -x

phase() {
  set +x
  echo ""
  echo "::group::$1"
  echo "=== [Phase] $1 ==="
  set -x
}

phase "ci_post_clone start (AMOS)"
date
sw_vers || true
xcodebuild -version || true

cd "$CI_PRIMARY_REPOSITORY_PATH"
echo "Working directory: $(pwd)"
ls -la

phase "Node + npm setup"
# Xcode Cloud images often pre-install Node. Only fall back to Homebrew if
# it isn't on PATH. `brew install` on an already-installed formula sometimes
# exits non-zero on Xcode Cloud which kills the script under `set -e`.
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "Node already installed: $(node --version) | npm: $(npm --version)"
else
  echo "Installing Node.js via Homebrew"
  brew install node || { echo "brew install node failed"; exit 1; }
  echo "Node: $(node --version) | npm: $(npm --version)"
fi

phase "npm dependencies"
# Try `npm ci` first (strict lockfile match, fastest). Fall back to
# `npm install` if the lockfile is out of sync.
if ! CI=1 npm ci; then
  echo "WARN: npm ci failed (likely lockfile drift) - falling back to npm install"
  CI=1 npm install
fi

# Public Supabase env vars (non-secret) - passed through if configured
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}"

# Sentry source-map upload defense - without org/token configured,
# sentry-cli fails the build with "An organization ID or slug is required".
if [ -z "${SENTRY_ORG:-}" ] || [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  export SENTRY_DISABLE_AUTO_UPLOAD=true
  export SENTRY_ALLOW_FAILURE=true
  echo "Sentry source-map upload disabled (no SENTRY_ORG / SENTRY_AUTH_TOKEN)"
fi

phase "Expo prebuild (preserve committed ios/)"
# DO NOT use --clean: ios/ is committed with hand-edited entitlements,
# custom Podfile, signing config. --clean wipes those.
npx expo prebuild --platform ios --no-install

phase "CocoaPods install"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
echo "react-native version in package.json:"
grep '"react-native"' "$CI_PRIMARY_REPOSITORY_PATH/package.json" || true
echo "First few RN-pinned pods in Podfile.lock:"
grep -E "FBLazyVector|RCTDeprecation|React-Core-prebuilt" Podfile.lock | head -5 || true
pod install

phase "ci_post_clone.sh complete"
set +x
