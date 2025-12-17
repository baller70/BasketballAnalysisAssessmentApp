#!/usr/bin/env python3
"""
Image Review Server - Approve or Reject Training Images

A simple web interface to review collected training images.
Approved images stay, rejected images get deleted.
"""

import os
import json
import shutil
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import mimetypes

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
EXPORT_DIR = TRAINING_DIR / "roboflow_export" / "images"

PORT = 8888

# Get all images from phase folders
def get_all_images():
    images = []
    phases = ["load", "set", "release", "follow_through"]
    
    for phase in phases:
        phase_dir = RAW_DIR / phase
        if phase_dir.exists():
            for img in sorted(phase_dir.glob("*.*")):
                if img.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                    images.append({
                        "path": str(img),
                        "filename": img.name,
                        "phase": phase,
                        "relative": f"raw/{phase}/{img.name}"
                    })
    
    return images

class ReviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/":
            self.serve_review_page()
        elif parsed.path == "/api/images":
            self.serve_images_json()
        elif parsed.path.startswith("/image/"):
            self.serve_image()
        elif parsed.path == "/api/stats":
            self.serve_stats()
        else:
            self.send_error(404)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/api/reject":
            self.handle_reject()
        elif parsed.path == "/api/approve":
            self.handle_approve()
        else:
            self.send_error(404)
    
    def serve_review_page(self):
        html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏀 Training Image Review</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            min-height: 100vh;
        }
        .header {
            background: #16213e;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #e94560;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header h1 { color: #e94560; margin-bottom: 10px; }
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
        }
        .stat {
            background: #0f3460;
            padding: 10px 20px;
            border-radius: 8px;
        }
        .stat-value { font-size: 24px; font-weight: bold; color: #e94560; }
        .stat-label { font-size: 12px; color: #888; }
        
        .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
        }
        .controls button {
            padding: 10px 25px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        .btn-approve-all { background: #00b894; color: white; }
        .btn-filter { background: #0f3460; color: white; }
        .btn-filter.active { background: #e94560; }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .image-card {
            background: #16213e;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .image-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(233, 69, 96, 0.3);
        }
        .image-card.rejected {
            opacity: 0.3;
            pointer-events: none;
        }
        
        .image-wrapper {
            position: relative;
            height: 300px;
            background: #0f3460;
        }
        .image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .phase-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: #e94560;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .phase-badge.load { background: #6c5ce7; }
        .phase-badge.set { background: #00b894; }
        .phase-badge.release { background: #fdcb6e; color: #333; }
        .phase-badge.follow_through { background: #e17055; }
        
        .card-actions {
            padding: 15px;
            display: flex;
            gap: 10px;
        }
        .card-actions button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            transition: background 0.2s;
        }
        .btn-reject {
            background: #e94560;
            color: white;
        }
        .btn-reject:hover { background: #c73e54; }
        .btn-keep {
            background: #00b894;
            color: white;
        }
        .btn-keep:hover { background: #00a381; }
        
        .filename {
            padding: 0 15px 15px;
            font-size: 11px;
            color: #666;
            word-break: break-all;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px;
            color: #666;
        }
        .empty-state h2 { color: #00b894; margin-bottom: 10px; }
        
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #00b894;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: none;
            animation: slideIn 0.3s ease;
        }
        .toast.error { background: #e94560; }
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏀 Training Image Review</h1>
        <p>Review and approve images for RoboFlow training</p>
        <div class="stats">
            <div class="stat">
                <div class="stat-value" id="total-count">-</div>
                <div class="stat-label">Total Images</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="remaining-count">-</div>
                <div class="stat-label">Remaining</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="rejected-count">0</div>
                <div class="stat-label">Rejected</div>
            </div>
        </div>
        <div class="controls">
            <button class="btn-filter active" data-phase="all">All</button>
            <button class="btn-filter" data-phase="load">Load</button>
            <button class="btn-filter" data-phase="set">Set</button>
            <button class="btn-filter" data-phase="release">Release</button>
            <button class="btn-filter" data-phase="follow_through">Follow Through</button>
        </div>
    </div>
    
    <div class="container">
        <div class="image-grid" id="image-grid"></div>
        <div class="empty-state" id="empty-state" style="display:none;">
            <h2>✅ All Done!</h2>
            <p>All images have been reviewed.</p>
        </div>
    </div>
    
    <div class="toast" id="toast"></div>
    
    <script>
        let images = [];
        let currentFilter = 'all';
        let rejectedCount = 0;
        
        async function loadImages() {
            const res = await fetch('/api/images');
            images = await res.json();
            updateStats();
            renderImages();
        }
        
        function updateStats() {
            const remaining = images.filter(img => !img.rejected).length;
            document.getElementById('total-count').textContent = images.length;
            document.getElementById('remaining-count').textContent = remaining;
            document.getElementById('rejected-count').textContent = rejectedCount;
        }
        
        function renderImages() {
            const grid = document.getElementById('image-grid');
            const emptyState = document.getElementById('empty-state');
            
            let filtered = images;
            if (currentFilter !== 'all') {
                filtered = images.filter(img => img.phase === currentFilter);
            }
            filtered = filtered.filter(img => !img.rejected);
            
            if (filtered.length === 0) {
                grid.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            grid.innerHTML = filtered.map((img, idx) => `
                <div class="image-card" id="card-${idx}" data-path="${img.path}">
                    <div class="image-wrapper">
                        <img src="/image/${encodeURIComponent(img.relative)}" loading="lazy" alt="${img.filename}">
                        <span class="phase-badge ${img.phase}">${img.phase.replace('_', ' ')}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-reject" onclick="rejectImage('${img.path}', ${idx})">❌ Reject</button>
                        <button class="btn-keep" onclick="keepImage(${idx})">✅ Keep</button>
                    </div>
                    <div class="filename">${img.filename}</div>
                </div>
            `).join('');
        }
        
        async function rejectImage(path, idx) {
            const card = document.getElementById(`card-${idx}`);
            card.classList.add('rejected');
            
            const res = await fetch('/api/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            
            if (res.ok) {
                rejectedCount++;
                images = images.filter(img => img.path !== path);
                showToast('Image deleted', false);
                updateStats();
                setTimeout(() => renderImages(), 300);
            } else {
                card.classList.remove('rejected');
                showToast('Failed to delete', true);
            }
        }
        
        function keepImage(idx) {
            const card = document.getElementById(`card-${idx}`);
            card.style.display = 'none';
            showToast('Image approved ✓', false);
            setTimeout(() => renderImages(), 100);
        }
        
        function showToast(message, isError) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast' + (isError ? ' error' : '');
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 2000);
        }
        
        // Filter buttons
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.phase;
                renderImages();
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                // Reject first visible
                const firstCard = document.querySelector('.image-card:not(.rejected)');
                if (firstCard) {
                    const path = firstCard.dataset.path;
                    const idx = firstCard.id.split('-')[1];
                    rejectImage(path, idx);
                }
            }
        });
        
        loadImages();
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_images_json(self):
        images = get_all_images()
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(images).encode())
    
    def serve_image(self):
        # Extract path after /image/
        path = self.path[7:]  # Remove /image/
        path = path.replace("%2F", "/").replace("%20", " ")
        
        full_path = TRAINING_DIR / path
        
        if full_path.exists():
            mime_type, _ = mimetypes.guess_type(str(full_path))
            self.send_response(200)
            self.send_header("Content-type", mime_type or "image/jpeg")
            self.end_headers()
            with open(full_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)
    
    def serve_stats(self):
        images = get_all_images()
        stats = {
            "total": len(images),
            "by_phase": {}
        }
        for img in images:
            phase = img["phase"]
            stats["by_phase"][phase] = stats["by_phase"].get(phase, 0) + 1
        
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(stats).encode())
    
    def handle_reject(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode())
        
        path = Path(data["path"])
        
        if path.exists():
            # Delete the image
            path.unlink()
            
            # Also delete from export folder if exists
            export_path = EXPORT_DIR / path.name
            if export_path.exists():
                export_path.unlink()
            
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode())
        else:
            self.send_error(404)
    
    def handle_approve(self):
        # Just acknowledge - image stays where it is
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True}).encode())
    
    def log_message(self, format, *args):
        pass  # Suppress logging


def main():
    print("=" * 50)
    print("🏀 Image Review Server")
    print("=" * 50)
    
    images = get_all_images()
    print(f"\n📁 Found {len(images)} images to review")
    
    phases = {}
    for img in images:
        p = img["phase"]
        phases[p] = phases.get(p, 0) + 1
    
    for phase, count in phases.items():
        print(f"   {phase}: {count}")
    
    print(f"\n🌐 Starting server at http://localhost:{PORT}")
    print("   Press Ctrl+C to stop\n")
    
    server = HTTPServer(("localhost", PORT), ReviewHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
        server.shutdown()


if __name__ == "__main__":
    main()




