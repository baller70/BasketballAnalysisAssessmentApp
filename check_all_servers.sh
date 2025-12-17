#!/bin/bash

echo "🏀 Basketball Analysis App - All Servers Status"
echo "================================================"
echo ""

# Check Next.js
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js Frontend: http://localhost:3000"
else
    echo "❌ Next.js Frontend: Not responding"
fi

# Check Python backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Python Backend: http://localhost:8000"
    curl -s http://localhost:8000/health | head -1
else
    echo "❌ Python Backend: Not responding"
fi

# Check hybrid server
if pgrep -f "hybrid_pose_detection.py" > /dev/null; then
    HYBRID_PID=$(pgrep -f "hybrid_pose_detection.py" | head -1)
    echo "✅ Hybrid Pose Detection: http://localhost:5001 (PID: $HYBRID_PID)"
else
    echo "❌ Hybrid Pose Detection: Not running"
fi

echo ""
echo "📄 Logs:"
echo "  Next.js: tail -f /home/ubuntu/basketball_analysis_abacus/nextjs_space/next.log"
echo "  Backend: tail -f /home/ubuntu/basketball_analysis_abacus/python-backend/backend.log"
echo "  Hybrid: tail -f /home/ubuntu/basketball_analysis_abacus/python-scraper/hybrid_server.log"
