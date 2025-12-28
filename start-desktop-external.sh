#!/bin/bash

# ============================================
# SHOTIQ AI - Desktop App Launcher
# Configured for External Drive
# ============================================
# This script uses the external drive for Rust temporary files
# to avoid "No space left on device" errors
# ============================================

echo "🖥️  Starting SHOTIQ AI Basketball Analysis Desktop App..."
echo "💾 Using external drive for temporary files"
echo ""

# Set temporary directory to external drive
export TMPDIR="/Volumes/Softwaare Program/rust-temp"
export CARGO_TARGET_DIR="/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis/src-tauri/target"

# Create temp directory if it doesn't exist
mkdir -p "$TMPDIR"

echo "📍 Temporary files: $TMPDIR"
echo "📍 Build output: $CARGO_TARGET_DIR"
echo ""

# Navigate to the basketball-analysis directory
cd "$(dirname "$0")/basketball-analysis" || {
    echo "❌ Error: Could not find basketball-analysis directory"
    exit 1
}

echo "📂 Working directory: $(pwd)"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

echo "✅ Node version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: Rust is not installed or not in PATH"
    exit 1
fi

echo "✅ Rust version: $(rustc --version)"
echo "✅ Cargo version: $(cargo --version)"
echo ""

# Check available space on external drive
AVAILABLE=$(df -h "/Volumes/Softwaare Program" | tail -1 | awk '{print $4}')
echo "💾 Available space on external drive: $AVAILABLE"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install || {
        echo "❌ Error: npm install failed"
        exit 1
    }
    echo ""
fi

echo "🚀 Starting Tauri desktop app..."
echo ""
echo "⏱️  First run: 1-2 minutes (Rust compilation)"
echo "⏱️  Later runs: ~30 seconds"
echo ""
echo "💡 All temporary files will be stored on the external drive"
echo "💡 This avoids filling up your internal drive"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Tauri with external drive configuration
npm run tauri:dev
