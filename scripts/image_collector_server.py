#!/usr/bin/env python3
"""
Local Image Collector Server

This starts a simple web server that:
1. Opens a browser with links to image sources
2. Provides a bookmarklet to save images with one click
3. Automatically organizes saved images

Usage:
    python image_collector_server.py
    
Then open: http://localhost:8888
"""

import os
import sys
import json
import base64
import hashlib
from pathlib import Path
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import webbrowser

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"

PORT = 8888

# HTML template for the collector interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>🏀 Basketball Training Data Collector</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            background: #1a1a2e;
            color: #eee;
        }
        h1 { color: #ff6b35; text-align: center; }
        h2 { color: #4ecdc4; border-bottom: 2px solid #4ecdc4; padding-bottom: 10px; }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-card h3 { margin: 0; color: #4ecdc4; }
        .stat-card .count { font-size: 48px; font-weight: bold; color: #ff6b35; }
        .stat-card.complete { border: 2px solid #4ecdc4; }
        
        .upload-zone {
            border: 3px dashed #4ecdc4;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            background: #16213e;
            cursor: pointer;
            transition: all 0.3s;
        }
        .upload-zone:hover { background: #1a2744; border-color: #ff6b35; }
        .upload-zone.dragover { background: #1a2744; border-color: #ff6b35; }
        
        .phase-selector {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .phase-btn {
            padding: 15px 25px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s;
        }
        .phase-btn.load { background: #e74c3c; color: white; }
        .phase-btn.set { background: #3498db; color: white; }
        .phase-btn.release { background: #f39c12; color: white; }
        .phase-btn.follow_through { background: #9b59b6; color: white; }
        .phase-btn.selected { transform: scale(1.1); box-shadow: 0 0 20px rgba(255,255,255,0.3); }
        
        .sources {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .source-card {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
        }
        .source-card h3 { color: #4ecdc4; margin-top: 0; }
        .source-card a {
            color: #ff6b35;
            text-decoration: none;
        }
        .source-card a:hover { text-decoration: underline; }
        
        .instructions {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .instructions ol { padding-left: 20px; }
        .instructions li { margin: 10px 0; }
        
        .preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin: 20px 0;
        }
        .preview-item {
            position: relative;
            aspect-ratio: 3/4;
            border-radius: 8px;
            overflow: hidden;
        }
        .preview-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .preview-item .delete-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 14px;
        }
        
        #status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            background: #4ecdc4;
            color: #1a1a2e;
            border-radius: 10px;
            font-weight: bold;
            display: none;
        }
        
        input[type="file"] { display: none; }
        
        .url-input {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .url-input input {
            flex: 1;
            padding: 15px;
            border: 2px solid #4ecdc4;
            border-radius: 10px;
            background: #16213e;
            color: white;
            font-size: 16px;
        }
        .url-input button {
            padding: 15px 30px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>🏀 Basketball Training Data Collector</h1>
    
    <div class="stats" id="stats">
        <div class="stat-card">
            <h3>LOAD</h3>
            <div class="count" id="count-load">0</div>
            <small>/25 needed</small>
        </div>
        <div class="stat-card">
            <h3>SET</h3>
            <div class="count" id="count-set">0</div>
            <small>/25 needed</small>
        </div>
        <div class="stat-card">
            <h3>RELEASE</h3>
            <div class="count" id="count-release">0</div>
            <small>/25 needed</small>
        </div>
        <div class="stat-card">
            <h3>FOLLOW THROUGH</h3>
            <div class="count" id="count-follow_through">0</div>
            <small>/25 needed</small>
        </div>
        <div class="stat-card">
            <h3>TOTAL</h3>
            <div class="count" id="count-total">0</div>
            <small>/100 minimum</small>
        </div>
    </div>
    
    <h2>📥 Add Images</h2>
    
    <p>Select shooting phase first:</p>
    <div class="phase-selector">
        <button class="phase-btn load" onclick="selectPhase('load')">🔴 LOAD<br><small>Ball below chin</small></button>
        <button class="phase-btn set" onclick="selectPhase('set')">🔵 SET<br><small>Ball at forehead</small></button>
        <button class="phase-btn release" onclick="selectPhase('release')">🟠 RELEASE<br><small>Ball leaving hands</small></button>
        <button class="phase-btn follow_through" onclick="selectPhase('follow_through')">🟣 FOLLOW THROUGH<br><small>Arms extended</small></button>
    </div>
    
    <div class="upload-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
        <h3>📁 Drop images here or click to select</h3>
        <p>Supports: JPG, PNG, WebP</p>
        <input type="file" id="fileInput" multiple accept="image/*">
    </div>
    
    <div class="url-input">
        <input type="text" id="imageUrl" placeholder="Or paste image URL here...">
        <button onclick="downloadFromUrl()">Download</button>
    </div>
    
    <h2>🔗 Image Sources</h2>
    <div class="sources">
        <div class="source-card">
            <h3>📺 YouTube (Best Quality)</h3>
            <p>Pause videos and screenshot:</p>
            <ul>
                <li><a href="https://www.youtube.com/results?search_query=basketball+shooting+form+tutorial" target="_blank">Shooting Form Tutorials</a></li>
                <li><a href="https://www.youtube.com/results?search_query=NBA+shooting+slow+motion" target="_blank">NBA Slow Motion</a></li>
                <li><a href="https://www.youtube.com/results?search_query=stephen+curry+shooting+form" target="_blank">Curry Shooting Form</a></li>
            </ul>
        </div>
        <div class="source-card">
            <h3>📷 Google Images</h3>
            <p>Right-click → Save Image As:</p>
            <ul>
                <li><a href="https://www.google.com/search?q=basketball+player+shooting+form&tbm=isch" target="_blank">Shooting Form</a></li>
                <li><a href="https://www.google.com/search?q=NBA+free+throw&tbm=isch" target="_blank">Free Throw</a></li>
                <li><a href="https://www.google.com/search?q=basketball+jump+shot+side+view&tbm=isch" target="_blank">Jump Shot Side View</a></li>
            </ul>
        </div>
        <div class="source-card">
            <h3>🏀 NBA/Sports Sites</h3>
            <ul>
                <li><a href="https://www.nba.com/photos" target="_blank">NBA Photos</a></li>
                <li><a href="https://www.gettyimages.com/photos/basketball-shooting" target="_blank">Getty Images</a></li>
                <li><a href="https://www.shutterstock.com/search/basketball-shooting" target="_blank">Shutterstock</a></li>
            </ul>
        </div>
        <div class="source-card">
            <h3>📱 Free Stock Photos</h3>
            <ul>
                <li><a href="https://unsplash.com/s/photos/basketball-player" target="_blank">Unsplash</a></li>
                <li><a href="https://www.pexels.com/search/basketball%20player/" target="_blank">Pexels</a></li>
                <li><a href="https://pixabay.com/images/search/basketball%20player/" target="_blank">Pixabay</a></li>
            </ul>
        </div>
    </div>
    
    <div class="instructions">
        <h3>📋 Instructions</h3>
        <ol>
            <li><strong>Select a phase</strong> from the buttons above</li>
            <li><strong>Find images</strong> from the sources listed</li>
            <li><strong>Save good images:</strong>
                <ul>
                    <li>Drag & drop files onto the upload zone</li>
                    <li>Or paste image URL and click Download</li>
                    <li>Or use Cmd+Shift+4 (Mac) to screenshot and drop</li>
                </ul>
            </li>
            <li>Images are automatically saved to the correct folder</li>
        </ol>
        
        <h4>✅ Good Images:</h4>
        <ul>
            <li>Full body visible (head to at least knees)</li>
            <li>Player actively shooting</li>
            <li>Clear view of form</li>
            <li>Side or front angle</li>
        </ul>
        
        <h4>❌ Avoid:</h4>
        <ul>
            <li>Dunking, passing, dribbling</li>
            <li>Multiple overlapping players</li>
            <li>Shot from behind</li>
            <li>Heavy blur or poor lighting</li>
        </ul>
    </div>
    
    <h2>🖼️ Recent Uploads</h2>
    <div class="preview-grid" id="previews"></div>
    
    <div id="status"></div>
    
    <script>
        let selectedPhase = 'load';
        
        function selectPhase(phase) {
            selectedPhase = phase;
            document.querySelectorAll('.phase-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.querySelector('.phase-btn.' + phase).classList.add('selected');
            showStatus('Selected: ' + phase.toUpperCase());
        }
        
        function showStatus(message) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.style.display = 'block';
            setTimeout(() => { status.style.display = 'none'; }, 2000);
        }
        
        // File upload
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', () => {
            handleFiles(fileInput.files);
        });
        
        function handleFiles(files) {
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    uploadFile(file);
                }
            }
        }
        
        function uploadFile(file) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('phase', selectedPhase);
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showStatus('✅ Saved: ' + data.filename);
                    updateStats();
                    loadPreviews();
                } else {
                    showStatus('❌ ' + data.error);
                }
            })
            .catch(err => {
                showStatus('❌ Upload failed');
            });
        }
        
        function downloadFromUrl() {
            const url = document.getElementById('imageUrl').value.trim();
            if (!url) return;
            
            fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, phase: selectedPhase })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showStatus('✅ Downloaded: ' + data.filename);
                    document.getElementById('imageUrl').value = '';
                    updateStats();
                    loadPreviews();
                } else {
                    showStatus('❌ ' + data.error);
                }
            });
        }
        
        function updateStats() {
            fetch('/stats')
            .then(res => res.json())
            .then(data => {
                document.getElementById('count-load').textContent = data.load || 0;
                document.getElementById('count-set').textContent = data.set || 0;
                document.getElementById('count-release').textContent = data.release || 0;
                document.getElementById('count-follow_through').textContent = data.follow_through || 0;
                document.getElementById('count-total').textContent = data.total || 0;
                
                // Highlight complete phases
                ['load', 'set', 'release', 'follow_through'].forEach(phase => {
                    const card = document.getElementById('count-' + phase).parentElement;
                    if ((data[phase] || 0) >= 25) {
                        card.classList.add('complete');
                    } else {
                        card.classList.remove('complete');
                    }
                });
            });
        }
        
        function loadPreviews() {
            fetch('/recent')
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('previews');
                container.innerHTML = '';
                
                data.images.forEach(img => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `
                        <img src="/image/${img.phase}/${img.filename}" alt="${img.filename}">
                        <button class="delete-btn" onclick="deleteImage('${img.phase}', '${img.filename}')">&times;</button>
                    `;
                    container.appendChild(div);
                });
            });
        }
        
        function deleteImage(phase, filename) {
            if (!confirm('Delete this image?')) return;
            
            fetch('/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase: phase, filename: filename })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showStatus('🗑️ Deleted');
                    updateStats();
                    loadPreviews();
                }
            });
        }
        
        // Initialize
        selectPhase('load');
        updateStats();
        loadPreviews();
        
        // Auto-refresh stats every 5 seconds
        setInterval(updateStats, 5000);
    </script>
</body>
</html>
"""


class CollectorHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == '/' or parsed.path == '':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode())
            
        elif parsed.path == '/stats':
            stats = self.get_stats()
            self.send_json(stats)
            
        elif parsed.path == '/recent':
            images = self.get_recent_images()
            self.send_json({'images': images})
            
        elif parsed.path.startswith('/image/'):
            self.serve_image(parsed.path[7:])
            
        else:
            self.send_error(404)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        
        if parsed.path == '/upload':
            self.handle_upload(content_length)
            
        elif parsed.path == '/download':
            body = self.rfile.read(content_length).decode()
            data = json.loads(body)
            self.handle_download(data.get('url'), data.get('phase', 'load'))
            
        elif parsed.path == '/delete':
            body = self.rfile.read(content_length).decode()
            data = json.loads(body)
            self.handle_delete(data.get('phase'), data.get('filename'))
            
        else:
            self.send_error(404)
    
    def handle_upload(self, content_length):
        import cgi
        
        content_type = self.headers.get('Content-Type')
        
        # Parse multipart form data
        if 'multipart/form-data' in content_type:
            # Simple boundary parsing
            boundary = content_type.split('boundary=')[1]
            body = self.rfile.read(content_length)
            
            # Extract phase and file
            parts = body.split(f'--{boundary}'.encode())
            phase = 'load'
            image_data = None
            filename = None
            
            for part in parts:
                if b'name="phase"' in part:
                    phase = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode()
                elif b'name="image"' in part:
                    # Get filename
                    if b'filename="' in part:
                        start = part.find(b'filename="') + 10
                        end = part.find(b'"', start)
                        filename = part[start:end].decode()
                    # Get image data
                    data_start = part.find(b'\r\n\r\n') + 4
                    image_data = part[data_start:].rstrip(b'\r\n--')
            
            if image_data:
                result = self.save_image(image_data, phase, filename)
                self.send_json(result)
            else:
                self.send_json({'success': False, 'error': 'No image data'})
        else:
            self.send_json({'success': False, 'error': 'Invalid content type'})
    
    def handle_download(self, url, phase):
        import requests
        
        if not url:
            self.send_json({'success': False, 'error': 'No URL provided'})
            return
        
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            if 'image' not in response.headers.get('content-type', ''):
                self.send_json({'success': False, 'error': 'URL is not an image'})
                return
            
            result = self.save_image(response.content, phase)
            self.send_json(result)
            
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)})
    
    def save_image(self, data, phase, original_filename=None):
        try:
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            hash_suffix = hashlib.md5(data).hexdigest()[:8]
            filename = f"{phase}_{timestamp}_{hash_suffix}.jpg"
            
            # Save to appropriate folder
            save_dir = RAW_DIR / phase
            save_dir.mkdir(parents=True, exist_ok=True)
            
            filepath = save_dir / filename
            with open(filepath, 'wb') as f:
                f.write(data)
            
            return {'success': True, 'filename': filename, 'phase': phase}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_delete(self, phase, filename):
        try:
            filepath = RAW_DIR / phase / filename
            if filepath.exists():
                filepath.unlink()
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': 'File not found'})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)})
    
    def get_stats(self):
        stats = {'total': 0}
        for phase in ['load', 'set', 'release', 'follow_through']:
            phase_dir = RAW_DIR / phase
            count = len(list(phase_dir.glob('*.jpg'))) if phase_dir.exists() else 0
            stats[phase] = count
            stats['total'] += count
        return stats
    
    def get_recent_images(self, limit=20):
        images = []
        for phase in ['load', 'set', 'release', 'follow_through']:
            phase_dir = RAW_DIR / phase
            if phase_dir.exists():
                for f in sorted(phase_dir.glob('*.jpg'), key=lambda x: x.stat().st_mtime, reverse=True)[:limit//4]:
                    images.append({'phase': phase, 'filename': f.name})
        return images[:limit]
    
    def serve_image(self, path):
        try:
            filepath = RAW_DIR / path
            if filepath.exists():
                self.send_response(200)
                self.send_header('Content-type', 'image/jpeg')
                self.end_headers()
                with open(filepath, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404)
        except:
            self.send_error(500)
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        # Suppress logging for cleaner output
        pass


def main():
    # Create directories
    for phase in ['load', 'set', 'release', 'follow_through']:
        (RAW_DIR / phase).mkdir(parents=True, exist_ok=True)
    
    print("="*60)
    print("🏀 Basketball Training Data Collector")
    print("="*60)
    print(f"\n🌐 Starting server at: http://localhost:{PORT}")
    print("\n📋 Instructions:")
    print("  1. Open http://localhost:8888 in your browser")
    print("  2. Select a shooting phase (LOAD, SET, RELEASE, FOLLOW THROUGH)")
    print("  3. Find images from the source links")
    print("  4. Drag & drop images or paste URLs")
    print("\n⌨️  Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    # Open browser
    webbrowser.open(f'http://localhost:{PORT}')
    
    # Start server
    server = HTTPServer(('localhost', PORT), CollectorHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
        
        # Print final stats
        stats = {'total': 0}
        for phase in ['load', 'set', 'release', 'follow_through']:
            phase_dir = RAW_DIR / phase
            count = len(list(phase_dir.glob('*.jpg'))) if phase_dir.exists() else 0
            stats[phase] = count
            stats['total'] += count
        
        print("\n📊 Final Collection Stats:")
        for phase, count in stats.items():
            if phase != 'total':
                status = "✅" if count >= 25 else "⚠️"
                print(f"  {status} {phase.upper()}: {count}/25")
        print(f"\n  📁 Total: {stats['total']}/100")


if __name__ == "__main__":
    main()





