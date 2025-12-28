#!/bin/bash

# ============================================
# SHOTIQ AI - Development Server Launcher
# ============================================
# This script ensures you always start the CORRECT, MOST UPDATED version
# of the basketball analysis application.
#
# PRIMARY APP: basketball-analysis/ (Feature-complete, production-ready)
# ============================================

set -e  # Exit on error

echo "🏀 Starting SHOTIQ AI Basketball Analysis Application..."
echo ""
echo "📂 Application Directory: basketball-analysis/"
echo "🔧 Node Version Required: 20.x"
echo ""

# Navigate to the correct directory
cd "$(dirname "$0")/basketball-analysis"

# Load NVM and use Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🔄 Switching to Node.js 20..."
nvm use 20 2>/dev/null || {
    echo "⚠️  Node.js 20 not found. Installing..."
    nvm install 20
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time setup)..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting development server..."
echo "📍 URL: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the dev server
npm run dev
