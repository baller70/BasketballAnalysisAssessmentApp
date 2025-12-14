#!/usr/bin/env python3
"""
Simple HTTP server for the image approval interface
"""

import http.server
import socketserver
import json
from pathlib import Path
import os

PORT = 8080

class ImageApprovalHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/images-list':
            # Send list of images
            images_dir = Path('images')
            if images_dir.exists():
                images = []
                for img_file in sorted(images_dir.glob('*')):
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                        images.append({
                            'filename': img_file.name,
                            'path': f'images/{img_file.name}'
                        })
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(images).encode())
            else:
                self.send_response(404)
                self.end_headers()
        else:
            # Serve static files
            super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__))
    
    with socketserver.TCPServer(("", PORT), ImageApprovalHandler) as httpd:
        print("=" * 60)
        print("🏀 Basketball Image Approval System")
        print("=" * 60)
        print(f"\n✅ Server running at: http://localhost:{PORT}")
        print(f"\n📁 Serving from: {os.getcwd()}")
        print(f"\n🖼️  Total images: {len(list(Path('images').glob('*')))}")
        print("\n⚠️  Note: Press Ctrl+C to stop the server")
        print("=" * 60)
        print("\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Server stopped")
