#!/bin/bash

# Clean Restart Script for Desktop App
# This script stops all processes, clears cache, and restarts the desktop app

set -e

echo "🧹 Cleaning up and restarting desktop app..."
echo ""

# Navigate to project directory
cd "/Volumes/Softwaare Program/SOFTWARE/MULTI-PLATFORM/SHOTIQAI/basketball-analysis"

echo "1️⃣  Stopping all running processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "tauri dev" 2>/dev/null || true
sleep 2
echo "✅ Processes stopped"
echo ""

echo "2️⃣  Clearing Next.js cache..."
rm -rf .next
echo "✅ Cache cleared"
echo ""

echo "3️⃣  Checking ports..."
if lsof -i :3000 > /dev/null 2>&1; then
  echo "⚠️  Port 3000 still in use"
else
  echo "✅ Port 3000 is free"
fi

if lsof -i :3001 > /dev/null 2>&1; then
  echo "⚠️  Port 3001 still in use"
else
  echo "✅ Port 3001 is free"
fi

if lsof -i :3002 > /dev/null 2>&1; then
  echo "⚠️  Port 3002 still in use"
else
  echo "✅ Port 3002 is free"
fi
echo ""

echo "4️⃣  Starting desktop app..."
echo "⏱️  This will take 1-2 minutes (Rust compilation)"
echo ""
echo "📝 When the app opens:"
echo "   1. Right-click → Inspect Element"
echo "   2. Go to Console tab"
echo "   3. Run: document.cookie = 'user-session=; path=/; max-age=0'; localStorage.clear(); location.reload();"
echo ""
echo "🚀 Starting now..."
echo ""

# Set temp directory for Rust compilation
export TMPDIR="/Volumes/Softwaare Program/rust-temp"

# Create temp directory if it doesn't exist
mkdir -p "$TMPDIR"

# Start the desktop app
npm run tauri:dev
