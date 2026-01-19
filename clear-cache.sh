#!/bin/bash

echo "🧹 Clearing all caches for Fashoma..."

# Navigate to project directory
cd "$(dirname "$0")"

# Clear Metro bundler cache
echo "Clearing Metro cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf /tmp/metro-* 2>/dev/null
rm -rf /tmp/haste-map-* 2>/dev/null

# Clear watchman if available
if command -v watchman &> /dev/null; then
    echo "Clearing watchman cache..."
    watchman watch-del-all 2>/dev/null
fi

# Clear iOS build cache (if exists)
if [ -d "ios" ]; then
    echo "Clearing iOS cache..."
    rm -rf ios/build 2>/dev/null
fi

# Clear Android build cache (if exists)
if [ -d "android" ]; then
    echo "Clearing Android cache..."
    rm -rf android/build 2>/dev/null
    rm -rf android/app/build 2>/dev/null
fi

echo "✅ Cache cleared successfully!"
echo ""
echo "Now run: npx expo start -c"
