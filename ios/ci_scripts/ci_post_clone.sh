#!/bin/sh
set -e

echo "=== Xcode Cloud ci_post_clone.sh (AMOS) ==="

# Navigate to project root
cd "$CI_PRIMARY_REPOSITORY_PATH"
echo "Working directory: $(pwd)"

# Install Node.js
echo "=== Installing Node.js ==="
brew install node
echo "Node: $(node --version) | npm: $(npm --version)"

# Install dependencies
echo "=== Installing npm dependencies ==="
npm ci

# Set Supabase env vars
echo "=== Setting environment variables ==="
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}"

# Run expo prebuild
echo "=== Running Expo prebuild ==="
npx expo prebuild --platform ios --no-install

# Install CocoaPods
echo "=== Installing CocoaPods ==="
cd ios
pod install

echo "=== ci_post_clone.sh complete ==="
