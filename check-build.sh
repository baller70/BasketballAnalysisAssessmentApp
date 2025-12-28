#!/bin/bash

echo "🔍 Checking Desktop App Build Status..."
echo ""

BUILD_LOG="/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis/build.log"
DMG_DIR="/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis/src-tauri/target/release/bundle/dmg"

# Check if build is running
if ps aux | grep -q "[t]auri build"; then
    echo "⏳ Build is RUNNING..."
    echo ""
    echo "📝 Latest build output:"
    tail -10 "$BUILD_LOG"
    echo ""
    echo "💡 Run this script again in a few minutes to check progress"
else
    echo "🛑 Build process not running"
    echo ""
    
    # Check if .dmg exists
    if [ -d "$DMG_DIR" ] && [ "$(ls -A $DMG_DIR 2>/dev/null)" ]; then
        echo "✅ BUILD COMPLETE!"
        echo ""
        echo "📦 Your .dmg installer is ready:"
        ls -lh "$DMG_DIR"/*.dmg 2>/dev/null
        echo ""
        echo "📍 Location:"
        echo "$DMG_DIR"
        echo ""
        echo "🚀 To open the folder:"
        echo "open \"$DMG_DIR\""
    else
        echo "❌ Build failed or not started yet"
        echo ""
        echo "📝 Last 20 lines of build log:"
        tail -20 "$BUILD_LOG"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
