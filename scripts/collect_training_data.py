#!/usr/bin/env python3
"""
Basketball Shooting Form Training Data Collector

This script helps collect and prepare training images for the RoboFlow model.
It can:
1. Extract frames from YouTube videos
2. Download images from URLs
3. Process and organize images by shooting phase
4. Validate image quality
"""

import os
import sys
import cv2
import json
import hashlib
import requests
from pathlib import Path
from typing import List, Optional, Tuple
from datetime import datetime
from urllib.parse import urlparse
import subprocess

# Base paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
PROCESSED_DIR = TRAINING_DIR / "processed"
REJECTED_DIR = TRAINING_DIR / "rejected"

# Shooting phases
PHASES = ["load", "set", "release", "follow_through"]

# Minimum image requirements
MIN_WIDTH = 640
MIN_HEIGHT = 480
MIN_ASPECT_RATIO = 0.5  # Minimum width/height ratio
MAX_ASPECT_RATIO = 2.0  # Maximum width/height ratio


def setup_directories():
    """Create all necessary directories."""
    for phase in PHASES:
        (RAW_DIR / phase).mkdir(parents=True, exist_ok=True)
        (PROCESSED_DIR / phase).mkdir(parents=True, exist_ok=True)
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
    print("✅ Directories created")


def generate_filename(source: str, phase: str) -> str:
    """Generate unique filename based on source and timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    hash_suffix = hashlib.md5(source.encode()).hexdigest()[:8]
    return f"{phase}_{timestamp}_{hash_suffix}"


def validate_image(image_path: Path) -> Tuple[bool, str]:
    """
    Validate image meets quality requirements.
    Returns (is_valid, reason)
    """
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return False, "Cannot read image"
        
        height, width = img.shape[:2]
        
        # Check minimum size
        if width < MIN_WIDTH or height < MIN_HEIGHT:
            return False, f"Too small: {width}x{height} (min {MIN_WIDTH}x{MIN_HEIGHT})"
        
        # Check aspect ratio
        aspect = width / height
        if aspect < MIN_ASPECT_RATIO or aspect > MAX_ASPECT_RATIO:
            return False, f"Bad aspect ratio: {aspect:.2f}"
        
        # Check if image is too dark or too bright
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_brightness = gray.mean()
        if mean_brightness < 30:
            return False, f"Too dark: brightness {mean_brightness:.1f}"
        if mean_brightness > 240:
            return False, f"Too bright: brightness {mean_brightness:.1f}"
        
        # Check for excessive blur
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            return False, f"Too blurry: variance {laplacian_var:.1f}"
        
        return True, "OK"
    
    except Exception as e:
        return False, f"Error: {str(e)}"


def download_image(url: str, phase: str) -> Optional[Path]:
    """Download image from URL and save to raw directory."""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Training Data Collection)'
        })
        response.raise_for_status()
        
        # Determine extension
        content_type = response.headers.get('content-type', '')
        if 'jpeg' in content_type or 'jpg' in content_type:
            ext = '.jpg'
        elif 'png' in content_type:
            ext = '.png'
        elif 'webp' in content_type:
            ext = '.webp'
        else:
            # Try to get from URL
            parsed = urlparse(url)
            ext = Path(parsed.path).suffix or '.jpg'
        
        filename = generate_filename(url, phase) + ext
        filepath = RAW_DIR / phase / filename
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        # Validate
        is_valid, reason = validate_image(filepath)
        if not is_valid:
            # Move to rejected
            rejected_path = REJECTED_DIR / filename
            filepath.rename(rejected_path)
            print(f"  ❌ Rejected: {reason}")
            return None
        
        print(f"  ✅ Downloaded: {filename}")
        return filepath
        
    except Exception as e:
        print(f"  ❌ Error downloading: {e}")
        return None


def extract_frames_from_video(video_path: str, phase: str, frame_interval: int = 30) -> List[Path]:
    """
    Extract frames from video file.
    
    Args:
        video_path: Path to video file
        phase: Shooting phase for these frames
        frame_interval: Extract every Nth frame
    
    Returns:
        List of saved frame paths
    """
    saved_frames = []
    
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"❌ Cannot open video: {video_path}")
            return []
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"📹 Video: {fps:.1f} FPS, {total_frames} frames")
        
        frame_count = 0
        saved_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                filename = f"{phase}_{Path(video_path).stem}_f{frame_count:05d}.jpg"
                filepath = RAW_DIR / phase / filename
                
                cv2.imwrite(str(filepath), frame)
                
                # Validate
                is_valid, reason = validate_image(filepath)
                if is_valid:
                    saved_frames.append(filepath)
                    saved_count += 1
                else:
                    filepath.rename(REJECTED_DIR / filename)
            
            frame_count += 1
        
        cap.release()
        print(f"  ✅ Extracted {saved_count} valid frames")
        return saved_frames
        
    except Exception as e:
        print(f"❌ Error extracting frames: {e}")
        return []


def download_youtube_video(url: str, output_dir: Path) -> Optional[Path]:
    """Download YouTube video using yt-dlp."""
    try:
        output_template = str(output_dir / "%(title)s.%(ext)s")
        
        cmd = [
            "yt-dlp",
            "-f", "best[height<=720]",  # Limit to 720p for faster processing
            "-o", output_template,
            "--no-playlist",
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ yt-dlp error: {result.stderr}")
            return None
        
        # Find downloaded file
        for ext in ['.mp4', '.webm', '.mkv']:
            files = list(output_dir.glob(f"*{ext}"))
            if files:
                return files[0]
        
        return None
        
    except FileNotFoundError:
        print("❌ yt-dlp not installed. Run: pip install yt-dlp")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def process_image(src_path: Path, phase: str) -> Optional[Path]:
    """
    Process image: resize, normalize, save to processed directory.
    """
    try:
        img = cv2.imread(str(src_path))
        if img is None:
            return None
        
        height, width = img.shape[:2]
        
        # Resize to standard size while maintaining aspect ratio
        target_size = 800
        if width > height:
            new_width = target_size
            new_height = int(height * (target_size / width))
        else:
            new_height = target_size
            new_width = int(width * (target_size / height))
        
        resized = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
        
        # Save processed image
        filename = src_path.stem + ".jpg"
        dest_path = PROCESSED_DIR / phase / filename
        cv2.imwrite(str(dest_path), resized, [cv2.IMWRITE_JPEG_QUALITY, 95])
        
        return dest_path
        
    except Exception as e:
        print(f"❌ Error processing {src_path}: {e}")
        return None


def get_collection_stats() -> dict:
    """Get current collection statistics."""
    stats = {
        "total": 0,
        "by_phase": {},
        "raw": 0,
        "processed": 0,
        "rejected": 0
    }
    
    for phase in PHASES:
        raw_count = len(list((RAW_DIR / phase).glob("*.*")))
        processed_count = len(list((PROCESSED_DIR / phase).glob("*.*")))
        stats["by_phase"][phase] = {
            "raw": raw_count,
            "processed": processed_count
        }
        stats["raw"] += raw_count
        stats["processed"] += processed_count
    
    stats["rejected"] = len(list(REJECTED_DIR.glob("*.*")))
    stats["total"] = stats["raw"]
    
    return stats


def print_stats():
    """Print collection statistics."""
    stats = get_collection_stats()
    
    print("\n" + "="*50)
    print("📊 COLLECTION STATISTICS")
    print("="*50)
    print(f"\n📁 Total Images: {stats['total']}")
    print(f"   ✅ Processed: {stats['processed']}")
    print(f"   ❌ Rejected: {stats['rejected']}")
    print("\n📋 By Shooting Phase:")
    
    for phase, counts in stats["by_phase"].items():
        status = "✅" if counts["raw"] >= 25 else "⚠️"
        print(f"   {status} {phase.upper()}: {counts['raw']} raw, {counts['processed']} processed")
    
    # Check if minimum met
    min_per_phase = 25
    phases_complete = sum(1 for p in stats["by_phase"].values() if p["raw"] >= min_per_phase)
    
    print(f"\n🎯 Progress: {phases_complete}/4 phases have minimum {min_per_phase} images")
    
    if stats["total"] >= 100:
        print("✅ Minimum dataset (100 images) reached!")
    else:
        print(f"⚠️ Need {100 - stats['total']} more images for minimum dataset")
    
    print("="*50 + "\n")


def interactive_classify():
    """Interactive tool to classify images by shooting phase."""
    import tkinter as tk
    from tkinter import messagebox
    from PIL import Image, ImageTk
    
    # Find unclassified images
    unclassified = list(RAW_DIR.glob("*.*"))
    if not unclassified:
        print("No unclassified images found.")
        return
    
    print(f"Found {len(unclassified)} unclassified images")
    
    root = tk.Tk()
    root.title("Classify Shooting Phase")
    root.geometry("900x700")
    
    current_idx = [0]
    
    # Image display
    img_label = tk.Label(root)
    img_label.pack(pady=10)
    
    # Info label
    info_label = tk.Label(root, text="", font=("Arial", 12))
    info_label.pack()
    
    def show_image(idx):
        if idx >= len(unclassified):
            messagebox.showinfo("Done", "All images classified!")
            root.destroy()
            return
        
        img_path = unclassified[idx]
        img = Image.open(img_path)
        img.thumbnail((800, 500))
        photo = ImageTk.PhotoImage(img)
        img_label.config(image=photo)
        img_label.image = photo
        info_label.config(text=f"Image {idx+1}/{len(unclassified)}: {img_path.name}")
    
    def classify(phase):
        idx = current_idx[0]
        src = unclassified[idx]
        dest = RAW_DIR / phase / src.name
        src.rename(dest)
        print(f"  Classified as {phase}: {src.name}")
        current_idx[0] += 1
        show_image(current_idx[0])
    
    def reject():
        idx = current_idx[0]
        src = unclassified[idx]
        dest = REJECTED_DIR / src.name
        src.rename(dest)
        print(f"  Rejected: {src.name}")
        current_idx[0] += 1
        show_image(current_idx[0])
    
    def skip():
        current_idx[0] += 1
        show_image(current_idx[0])
    
    # Buttons
    btn_frame = tk.Frame(root)
    btn_frame.pack(pady=20)
    
    tk.Button(btn_frame, text="1. LOAD\n(Ball below chin)", command=lambda: classify("load"), 
              width=15, height=3, bg="#4CAF50", fg="white").grid(row=0, column=0, padx=5)
    tk.Button(btn_frame, text="2. SET\n(Ball at forehead)", command=lambda: classify("set"),
              width=15, height=3, bg="#2196F3", fg="white").grid(row=0, column=1, padx=5)
    tk.Button(btn_frame, text="3. RELEASE\n(Ball leaving hands)", command=lambda: classify("release"),
              width=15, height=3, bg="#FF9800", fg="white").grid(row=0, column=2, padx=5)
    tk.Button(btn_frame, text="4. FOLLOW_THROUGH\n(Arms extended)", command=lambda: classify("follow_through"),
              width=15, height=3, bg="#9C27B0", fg="white").grid(row=0, column=3, padx=5)
    
    tk.Button(btn_frame, text="❌ REJECT\n(Bad image)", command=reject,
              width=15, height=2, bg="#f44336", fg="white").grid(row=1, column=1, pady=10)
    tk.Button(btn_frame, text="⏭️ SKIP\n(Decide later)", command=skip,
              width=15, height=2, bg="#607D8B", fg="white").grid(row=1, column=2, pady=10)
    
    # Keyboard shortcuts
    root.bind('1', lambda e: classify("load"))
    root.bind('2', lambda e: classify("set"))
    root.bind('3', lambda e: classify("release"))
    root.bind('4', lambda e: classify("follow_through"))
    root.bind('r', lambda e: reject())
    root.bind('s', lambda e: skip())
    root.bind('<space>', lambda e: skip())
    
    show_image(0)
    root.mainloop()


# ============================================
# CURATED IMAGE SOURCES
# ============================================

# High-quality shooting form images from free/open sources
CURATED_IMAGE_URLS = {
    "load": [
        # Add URLs of images showing LOAD phase
        # (ball below chin, knees bent, preparing to shoot)
    ],
    "set": [
        # Add URLs of images showing SET phase
        # (ball at forehead/set point, aiming)
    ],
    "release": [
        # Add URLs of images showing RELEASE phase
        # (ball leaving hands)
    ],
    "follow_through": [
        # Add URLs of images showing FOLLOW_THROUGH phase
        # (arms fully extended, ball released)
    ]
}

# YouTube videos with good shooting form footage
YOUTUBE_SOURCES = [
    # Shooting form tutorials and breakdowns
    "https://www.youtube.com/watch?v=example1",  # Replace with real URLs
    "https://www.youtube.com/watch?v=example2",
]


def main():
    """Main CLI interface."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Basketball Shooting Form Training Data Collector")
    parser.add_argument("command", choices=["setup", "stats", "download", "extract", "process", "classify"],
                       help="Command to run")
    parser.add_argument("--url", help="URL to download from")
    parser.add_argument("--video", help="Video file path")
    parser.add_argument("--phase", choices=PHASES, help="Shooting phase")
    parser.add_argument("--interval", type=int, default=15, help="Frame extraction interval")
    
    args = parser.parse_args()
    
    if args.command == "setup":
        setup_directories()
        print_stats()
        
    elif args.command == "stats":
        print_stats()
        
    elif args.command == "download":
        if not args.url or not args.phase:
            print("Usage: --url <URL> --phase <PHASE>")
            return
        setup_directories()
        download_image(args.url, args.phase)
        
    elif args.command == "extract":
        if not args.video or not args.phase:
            print("Usage: --video <PATH> --phase <PHASE>")
            return
        setup_directories()
        extract_frames_from_video(args.video, args.phase, args.interval)
        
    elif args.command == "process":
        setup_directories()
        print("Processing raw images...")
        for phase in PHASES:
            for img_path in (RAW_DIR / phase).glob("*.*"):
                process_image(img_path, phase)
        print_stats()
        
    elif args.command == "classify":
        setup_directories()
        try:
            interactive_classify()
        except ImportError:
            print("GUI classification requires: pip install pillow")
            print("Use manual classification instead.")


if __name__ == "__main__":
    main()





