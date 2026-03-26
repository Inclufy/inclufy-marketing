#!/bin/sh
set -e

echo "=== Xcode Cloud ci_post_clone.sh (AMOS) ==="

# Navigate to project root
cd "$CI_PRIMARY_REPOSITORY_PATH"
echo "Working directory: $(pwd)"

# Fix Xcode Cloud setting CI=TRUE (uppercase) — Expo expects lowercase boolean
export CI=1

# Install Node.js
echo "=== Installing Node.js ==="
brew install node || true
echo "Node: $(node --version) | npm: $(npm --version)"

# Install dependencies
echo "=== Installing npm dependencies ==="
npm ci

# Write .env.local so Expo inlines the values at build time
echo "=== Writing .env.local ==="
cat > .env.local << 'ENVEOF'
EXPO_PUBLIC_SUPABASE_URL=https://mpxkugfqzmxydxnlxqoj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGt1Z2Zxem14eWR4bmx4cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzY5MDEsImV4cCI6MjA4MjA1MjkwMX0.17YXD9I9fZulQGoGZFFFzQ-f-LW4E1lsT3SSpDC_GA0
ENVEOF

# Set buildNumber from Xcode Cloud build number
echo "=== Setting buildNumber to $CI_BUILD_NUMBER ==="
if [ -n "$CI_BUILD_NUMBER" ]; then
  node -e "
    const fs = require('fs');
    const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    app.expo.ios.buildNumber = String(process.env.CI_BUILD_NUMBER);
    fs.writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');
    console.log('Set buildNumber to', app.expo.ios.buildNumber);
  "
fi

# Run expo prebuild
echo "=== Running Expo prebuild ==="
npx expo prebuild --platform ios --no-install

# Disable Explicitly Built Modules (Xcode 26 breaks Expo SDK 52 pods)
echo "=== Patching Podfile for Xcode 26 compatibility ==="
if grep -q "post_install do |installer|" ios/Podfile; then
  ruby -i -e '
    content = ARGF.read
    injection = <<~RUBY
    # Xcode 26: disable Explicitly Built Modules for all pods
    installer.pods_project.build_configurations.each do |config|
      config.build_settings["SWIFT_ENABLE_EXPLICIT_MODULES"] = "NO"
    end
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings["SWIFT_ENABLE_EXPLICIT_MODULES"] = "NO"
      end
    end
    RUBY
    content.sub!("post_install do |installer|\n", "post_install do |installer|\n#{injection}")
    print content
  ' ios/Podfile
  echo "Podfile patched successfully"
else
  echo "WARNING: post_install block not found in Podfile, skipping patch"
fi

# Install CocoaPods
echo "=== Installing CocoaPods ==="
cd ios && pod install

echo "=== ci_post_clone.sh complete ==="
