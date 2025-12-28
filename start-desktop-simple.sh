#!/bin/bash

# Simple Desktop Launcher - No NVM required
# Just uses whatever Node.js is in your PATH

echo "🖥️  Starting SHOTIQ AI Basketball Analysis Desktop App..."
echo ""

# Navigate to the basketball-analysis directory
cd "$(dirname "$0")/basketball-analysis" || {
    echo "❌ Error: Could not find basketball-analysis directory"
    exit 1
}

echo "📍 Directory: $(pwd)"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

echo "✅ Node version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install || {
        echo "❌ Error: npm install failed"
        exit 1
    }
fi

echo "🚀 Starting Tauri desktop app..."
echo ""
echo "⏱️  First run: 1-2 minutes (Rust compilation)"
echo "⏱️  Later runs: ~30 seconds"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Tauri
npm run tauri:dev
