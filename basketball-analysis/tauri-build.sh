#!/bin/bash
set -e

echo "🏀 Building SHOTIQ Basketball Analysis for Desktop..."
echo ""

# Set environment variable for static export
export TAURI_BUILD=true

# Run the Next.js build
echo "📦 Building Next.js with static export..."
npm run build

echo ""
echo "✅ Next.js build complete!"
echo ""

# Verify the out folder was created
if [ -d "out" ]; then
    echo "✅ Static export successful - 'out' folder created"
    ls -lh out/ | head -10
else
    echo "❌ ERROR: 'out' folder not created!"
    exit 1
fi
