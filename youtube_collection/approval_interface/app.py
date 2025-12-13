#!/usr/bin/env python3
"""
Basketball Image Approval Interface
Flask backend for reviewing and approving basketball shooting images
"""

import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_from_directory

app = Flask(__name__)

# Configuration
IMAGES_DIR = "/home/ubuntu/basketball_app/youtube_collection/extracted_frames"
APPROVED_DIR = "/home/ubuntu/basketball_app/youtube_collection/approved_images"
DATA_FILE = "/home/ubuntu/basketball_app/youtube_collection/approval_interface/approval_data.json"

# Initialize approval data
def load_approval_data():
    """Load approval data from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    else:
        # Create initial data structure
        images = []
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif']:
            for img_path in Path(IMAGES_DIR).glob(ext):
                if 'metadata' not in img_path.name.lower():
                    images.append({
                        "id": len(images) + 1,
                        "filename": img_path.name,
                        "filepath": str(img_path),
                        "status": "pending",  # pending, approved, rejected
                        "reviewed_at": None
                    })
        
        data = {
            "created_at": datetime.now().isoformat(),
            "total_images": len(images),
            "images": images,
            "statistics": {
                "pending": len(images),
                "approved": 0,
                "rejected": 0
            }
        }
        
        save_approval_data(data)
        return data

def save_approval_data(data):
    """Save approval data to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def update_statistics(data):
    """Update statistics in data"""
    stats = {
        "pending": len([img for img in data["images"] if img["status"] == "pending"]),
        "approved": len([img for img in data["images"] if img["status"] == "approved"]),
        "rejected": len([img for img in data["images"] if img["status"] == "rejected"])
    }
    data["statistics"] = stats
    return data

@app.route('/')
def index():
    """Main approval interface"""
    return render_template('approval.html')

@app.route('/api/images')
def get_images():
    """Get all images with approval status"""
    data = load_approval_data()
    return jsonify(data)

@app.route('/api/images/<int:image_id>')
def get_image(image_id):
    """Get a specific image by ID"""
    data = load_approval_data()
    image = next((img for img in data["images"] if img["id"] == image_id), None)
    if image:
        return jsonify(image)
    return jsonify({"error": "Image not found"}), 404

@app.route('/api/images/<int:image_id>/approve', methods=['POST'])
def approve_image(image_id):
    """Approve an image"""
    data = load_approval_data()
    image = next((img for img in data["images"] if img["id"] == image_id), None)
    
    if not image:
        return jsonify({"error": "Image not found"}), 404
    
    # Update status
    image["status"] = "approved"
    image["reviewed_at"] = datetime.now().isoformat()
    
    # Copy to approved directory
    os.makedirs(APPROVED_DIR, exist_ok=True)
    src = image["filepath"]
    dst = os.path.join(APPROVED_DIR, image["filename"])
    shutil.copy2(src, dst)
    
    # Update statistics and save
    data = update_statistics(data)
    save_approval_data(data)
    
    return jsonify({
        "success": True,
        "image": image,
        "statistics": data["statistics"]
    })

@app.route('/api/images/<int:image_id>/reject', methods=['POST'])
def reject_image(image_id):
    """Reject an image"""
    data = load_approval_data()
    image = next((img for img in data["images"] if img["id"] == image_id), None)
    
    if not image:
        return jsonify({"error": "Image not found"}), 404
    
    # Update status
    image["status"] = "rejected"
    image["reviewed_at"] = datetime.now().isoformat()
    
    # Update statistics and save
    data = update_statistics(data)
    save_approval_data(data)
    
    return jsonify({
        "success": True,
        "image": image,
        "statistics": data["statistics"]
    })

@app.route('/api/images/<int:image_id>/reset', methods=['POST'])
def reset_image(image_id):
    """Reset an image to pending status"""
    data = load_approval_data()
    image = next((img for img in data["images"] if img["id"] == image_id), None)
    
    if not image:
        return jsonify({"error": "Image not found"}), 404
    
    # Update status
    image["status"] = "pending"
    image["reviewed_at"] = None
    
    # Remove from approved directory if exists
    approved_path = os.path.join(APPROVED_DIR, image["filename"])
    if os.path.exists(approved_path):
        os.remove(approved_path)
    
    # Update statistics and save
    data = update_statistics(data)
    save_approval_data(data)
    
    return jsonify({
        "success": True,
        "image": image,
        "statistics": data["statistics"]
    })

@app.route('/api/statistics')
def get_statistics():
    """Get approval statistics"""
    data = load_approval_data()
    return jsonify(data["statistics"])

@app.route('/api/export')
def export_approved():
    """Export list of approved images"""
    data = load_approval_data()
    approved = [img for img in data["images"] if img["status"] == "approved"]
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "total_approved": len(approved),
        "approved_images": approved,
        "approved_directory": APPROVED_DIR
    }
    
    return jsonify(export_data)

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images from the images directory"""
    return send_from_directory(IMAGES_DIR, filename)

if __name__ == '__main__':
    # Create output directory
    os.makedirs(APPROVED_DIR, exist_ok=True)
    
    # Initialize data
    load_approval_data()
    
    # Run server
    print("\n" + "="*60)
    print("🏀 BASKETBALL IMAGE APPROVAL INTERFACE")
    print("="*60)
    print("\n📍 Server running at: http://localhost:5000")
    print("\n💡 Instructions:")
    print("   1. Open http://localhost:5000 in your browser")
    print("   2. Review each image")
    print("   3. Click APPROVE or REJECT")
    print("   4. Use keyboard shortcuts: A (approve), R (reject)")
    print("\n" + "="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
