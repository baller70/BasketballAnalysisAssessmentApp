#!/bin/bash

# Basketball Image Collection - Full Pipeline
# Runs all steps from setup to user approval

set -e  # Exit on error

echo "===================================================================="
echo "  🏀 BASKETBALL IMAGE COLLECTION PIPELINE"
echo "===================================================================="
echo ""
echo "🎯 Goal: Collect 500-1,000 images for RoboFlow training"
echo ""

# Check Python version
echo "🔍 Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION"
echo ""

# Check required packages
echo "🔍 Checking required packages..."
if ! python3 -c "import requests" 2>/dev/null; then
    echo "❌ requests not installed"
    echo "Installing: pip install requests"
    pip install requests
fi

if ! python3 -c "import anthropic" 2>/dev/null; then
    echo "❌ anthropic not installed"
    echo "Installing: pip install anthropic"
    pip install anthropic
fi

if ! python3 -c "import dotenv" 2>/dev/null; then
    echo "❌ python-dotenv not installed"
    echo "Installing: pip install python-dotenv"
    pip install python-dotenv
fi

echo "✅ All required packages installed"
echo ""

# Step 1: Setup API Keys
echo "===================================================================="
echo "  STEP 1: API KEY SETUP"
echo "===================================================================="
echo ""

if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Running setup..."
    python3 setup_api_keys.py
else
    echo "✅ .env file found"
    echo ""
    read -p "Do you want to update API keys? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 setup_api_keys.py
    fi
fi

echo ""

# Step 2: Collect Images
echo "===================================================================="
echo "  STEP 2: IMAGE COLLECTION"
echo "===================================================================="
echo ""

if [ -d "raw_images" ] && [ "$(ls -A raw_images)" ]; then
    IMAGE_COUNT=$(ls -1 raw_images/*.jpg 2>/dev/null | wc -l)
    echo "⚠️ Found $IMAGE_COUNT existing images in raw_images/"
    echo ""
    read -p "Do you want to collect MORE images? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Skipping collection..."
    else
        echo "🚀 Starting collection..."
        python3 multi_source_collector.py
    fi
else
    echo "🚀 Starting collection..."
    python3 multi_source_collector.py
fi

echo ""

# Step 3: Vision AI Filtering
echo "===================================================================="
echo "  STEP 3: VISION AI PRE-FILTERING"
echo "===================================================================="
echo ""

if [ -d "filtered_images" ] && [ "$(ls -A filtered_images)" ]; then
    FILTERED_COUNT=$(ls -1 filtered_images/*.jpg 2>/dev/null | wc -l)
    echo "⚠️ Found $FILTERED_COUNT filtered images"
    echo ""
    read -p "Do you want to re-run Vision AI filter? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Skipping filtering..."
    else
        echo "🤖 Starting Vision AI filtering (this may take 20-40 minutes)..."
        python3 vision_ai_filter.py
    fi
else
    echo "🤖 Starting Vision AI filtering (this may take 20-40 minutes)..."
    python3 vision_ai_filter.py
fi

echo ""

# Step 4: Progress Report
echo "===================================================================="
echo "  STEP 4: PROGRESS REPORT"
echo "===================================================================="
echo ""

python3 progress_tracker.py

echo ""

# Step 5: Open Approval Interface
echo "===================================================================="
echo "  STEP 5: USER APPROVAL INTERFACE"
echo "===================================================================="
echo ""

echo "🎉 Pipeline complete! Now it's time for user approval."
echo ""
echo "To open the approval interface:"
echo ""
echo "Option 1: Direct (if browser supports local files):"
echo "  open approval_interface/index.html"
echo ""
echo "Option 2: With local server (recommended):"
echo "  cd approval_interface/"
echo "  python3 -m http.server 8000"
echo "  Then visit: http://localhost:8000/"
echo ""
echo "⌨️ Keyboard shortcuts:"
echo "  - A or → : Approve image"
echo "  - R or ← : Reject image"
echo "  - Shift+Click : Multi-select"
echo "  - Esc : Close preview"
echo ""

read -p "Open approval interface now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting local server on port 8000..."
    echo "🌐 Visit: http://localhost:8000/"
    echo ""
    echo "Press Ctrl+C to stop the server when done."
    cd approval_interface/
    python3 -m http.server 8000
fi

echo ""
echo "===================================================================="
echo "  ✅ PIPELINE COMPLETE"
echo "===================================================================="
echo ""
echo "Next steps:"
echo "  1. Approve images in the web interface"
echo "  2. Run: python3 progress_tracker.py (to check status)"
echo "  3. Once you have 500-1,000 approved images:"
echo "     - Upload to RoboFlow"
echo "     - Annotate keypoints"
echo "     - Train models"
echo ""
echo "🎉 Happy training!"
echo ""
