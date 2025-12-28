#!/bin/bash

# ============================================
# SHOTIQ AI - Desktop App Launcher (Tauri)
# ============================================
# This script launches the desktop version of the basketball analysis app
#
# Usage: ./start-desktop.sh
# ============================================

echo "🖥️  Starting SHOTIQ AI Basketball Analysis Desktop App..."
echo ""
echo "📂 Application Directory: basketball-analysis/"
echo "🔧 Node Version Required: 20.x"
echo "🦀 Rust Version Required: 1.70+"
echo ""

# Navigate to the correct directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/basketball-analysis"

echo "📍 Current directory: $(pwd)"
echo ""

# Load NVM if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "🔄 Loading NVM..."
    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
    
    echo "🔄 Switching to Node.js 20..."
    nvm use 20 || {
        echo "⚠️  Node.js 20 not found. Installing..."
        nvm install 20
    }
else
    echo "⚠️  NVM not found, using system Node.js"
fi

# Verify Node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not available"
    echo "Please install Node.js 20 or configure NVM"
    exit 1
fi

echo "✅ Node version: $(node --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time setup)..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting Tauri desktop application..."
echo "📍 This will:"
echo "   1. Start Next.js dev server (http://localhost:3000)"
echo "   2. Launch desktop window"
echo "   3. Enable hot-reload"
echo ""
echo "⏱️  First run takes 1-2 minutes (Rust compilation)"
echo "⏱️  Subsequent runs are much faster (~30 seconds)"
echo ""
echo "Press Ctrl+C to stop the app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the Tauri dev server
npm run tauri:dev
