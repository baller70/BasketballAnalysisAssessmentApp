#!/bin/bash
# Start both local backend servers for basketball analysis

echo "=============================================="
echo "Starting Basketball Analysis Backend Servers"
echo "=============================================="

# Kill any existing processes on ports 5001 and 5002
echo "Cleaning up existing processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5002 | xargs kill -9 2>/dev/null
sleep 1

# Navigate to python-scraper directory
cd "$(dirname "$0")/python-scraper"

# Start hybrid pose detection server (port 5001) in background
echo ""
echo "Starting Image Analysis Server (port 5001)..."
python3 hybrid_pose_detection.py &
PID1=$!
sleep 2

# Start video analysis server (port 5002) in background
echo ""
echo "Starting Video Analysis Server (port 5002)..."
python3 video_analysis.py &
PID2=$!
sleep 2

echo ""
echo "=============================================="
echo "Backend Servers Running:"
echo "  - Image Analysis: http://localhost:5001"
echo "  - Video Analysis: http://localhost:5002"
echo "=============================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $PID1 $PID2




