#!/usr/bin/env python3
"""
Extract Training Frames from YouTube Videos

This script downloads basketball shooting tutorial videos and extracts
frames at specific moments showing shooting form phases.

Usage:
    python extract_youtube_frames.py
"""

import os
import sys
import cv2
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
import tempfile
import json

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
TEMP_DIR = BASE_DIR / "temp_videos"

# Shooting phases
PHASES = ["load", "set", "release", "follow_through"]

# Curated YouTube videos with good shooting form content
# Format: (url, description, timestamps for each phase if known)
YOUTUBE_VIDEOS = [
    # Shooting form tutorials - show all phases clearly
    {
        "url": "https://www.youtube.com/watch?v=_vMROjZWxbQ",
        "title": "Perfect Shooting Form",
        "channel": "ShotMechanics",
        "quality": "high",
    },
    {
        "url": "https://www.youtube.com/watch?v=GaGbv-8BEDs",  
        "title": "How to Shoot a Basketball",
        "channel": "ILoveBasketballTV",
        "quality": "high",
    },
    {
        "url": "https://www.youtube.com/watch?v=xz4K-5EFk9Y",
        "title": "Basketball Shooting Form",
        "channel": "ProShotSystem",
        "quality": "high",
    },
    {
        "url": "https://www.youtube.com/watch?v=SSo_EIwHSd4",
        "title": "NBA Shooting Form Breakdown",
        "channel": "ByAnyMeans",
        "quality": "high",
    },
    # Slow motion compilations
    {
        "url": "https://www.youtube.com/watch?v=JdRt-KPXgzs",
        "title": "Stephen Curry Shooting Form Slow Motion",
        "channel": "Various",
        "quality": "high",
    },
]


def download_video(url: str, output_dir: Path) -> Path:
    """Download YouTube video using yt-dlp."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Output template
    output_template = str(output_dir / "%(title)s.%(ext)s")
    
    cmd = [
        "yt-dlp",
        "-f", "best[height<=720][ext=mp4]/best[height<=720]/best",
        "-o", output_template,
        "--no-playlist",
        "--restrict-filenames",
        url
    ]
    
    print(f"  📥 Downloading...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"  ❌ Download failed: {result.stderr[:200]}")
        return None
    
    # Find the downloaded file
    for f in output_dir.glob("*.*"):
        if f.suffix.lower() in [".mp4", ".webm", ".mkv"]:
            print(f"  ✅ Downloaded: {f.name}")
            return f
    
    return None


def extract_frames(video_path: Path, output_dir: Path, interval: int = 30, max_frames: int = 100) -> int:
    """
    Extract frames from video at regular intervals.
    
    Args:
        video_path: Path to video file
        output_dir: Directory to save frames
        interval: Extract every Nth frame
        max_frames: Maximum frames to extract
    
    Returns:
        Number of frames extracted
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"  ❌ Cannot open video")
        return 0
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"  📹 Video: {fps:.1f} FPS, {total_frames} frames, {total_frames/fps:.1f}s duration")
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    frame_count = 0
    saved_count = 0
    video_name = video_path.stem[:30]  # Limit filename length
    
    while saved_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % interval == 0:
            # Basic quality check
            if frame is not None:
                height, width = frame.shape[:2]
                
                # Skip if too small
                if width < 400 or height < 300:
                    frame_count += 1
                    continue
                
                # Check brightness
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                brightness = gray.mean()
                if brightness < 30 or brightness > 240:
                    frame_count += 1
                    continue
                
                # Check blur
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                if laplacian_var < 50:
                    frame_count += 1
                    continue
                
                # Save frame
                filename = f"unclassified_{video_name}_f{frame_count:05d}.jpg"
                filepath = output_dir / filename
                cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                saved_count += 1
        
        frame_count += 1
    
    cap.release()
    print(f"  ✅ Extracted {saved_count} frames")
    return saved_count


def detect_person_in_frame(frame) -> bool:
    """Basic detection if frame likely contains a person shooting."""
    # Use simple heuristics - actual person detection would need a model
    # For now, just check if frame has reasonable content
    
    if frame is None:
        return False
    
    # Check for skin tones (rough approximation)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # Skin tone range in HSV
    lower_skin = (0, 20, 70)
    upper_skin = (20, 255, 255)
    
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    skin_ratio = cv2.countNonZero(mask) / (frame.shape[0] * frame.shape[1])
    
    # If 5-40% of image is skin-toned, likely has person
    return 0.05 < skin_ratio < 0.40


def smart_frame_extraction(video_path: Path, output_dir: Path, target_frames: int = 50) -> int:
    """
    Smart extraction that tries to get frames with people in them.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return 0
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Calculate interval to cover whole video
    interval = max(1, total_frames // (target_frames * 3))
    
    output_dir.mkdir(parents=True, exist_ok=True)
    video_name = video_path.stem[:30]
    
    saved_count = 0
    frame_count = 0
    
    print(f"  🔍 Smart extraction (checking every {interval} frames)...")
    
    while saved_count < target_frames and frame_count < total_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count)
        ret, frame = cap.read()
        
        if not ret:
            break
        
        # Check if frame likely has person
        if detect_person_in_frame(frame):
            # Quality checks
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            brightness = gray.mean()
            blur = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            if 40 < brightness < 220 and blur > 100:
                filename = f"unclassified_{video_name}_f{frame_count:05d}.jpg"
                filepath = output_dir / filename
                cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                saved_count += 1
        
        frame_count += interval
    
    cap.release()
    print(f"  ✅ Smart extracted {saved_count} frames with people")
    return saved_count


def main():
    print("="*60)
    print("🏀 YouTube Frame Extraction for Training Data")
    print("="*60)
    
    # Create directories
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    unclassified_dir = RAW_DIR / "unclassified"
    unclassified_dir.mkdir(parents=True, exist_ok=True)
    
    total_frames = 0
    successful_videos = 0
    
    for i, video_info in enumerate(YOUTUBE_VIDEOS):
        print(f"\n[{i+1}/{len(YOUTUBE_VIDEOS)}] {video_info['title']}")
        print(f"    Channel: {video_info['channel']}")
        
        try:
            # Download video
            video_path = download_video(video_info["url"], TEMP_DIR)
            
            if video_path and video_path.exists():
                # Extract frames
                frames = smart_frame_extraction(
                    video_path, 
                    unclassified_dir,
                    target_frames=30  # ~30 frames per video
                )
                
                total_frames += frames
                if frames > 0:
                    successful_videos += 1
                
                # Clean up video file to save space
                try:
                    video_path.unlink()
                except:
                    pass
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    # Clean up temp directory
    try:
        shutil.rmtree(TEMP_DIR)
    except:
        pass
    
    # Print summary
    print("\n" + "="*60)
    print("📊 EXTRACTION SUMMARY")
    print("="*60)
    print(f"  📹 Videos processed: {successful_videos}/{len(YOUTUBE_VIDEOS)}")
    print(f"  🖼️ Total frames extracted: {total_frames}")
    print(f"  📂 Location: {unclassified_dir}")
    
    # Count by phase
    print("\n  📋 Images by folder:")
    for phase in PHASES + ["unclassified"]:
        phase_dir = RAW_DIR / phase
        count = len(list(phase_dir.glob("*.jpg"))) if phase_dir.exists() else 0
        status = "✅" if count >= 25 else "⚠️"
        print(f"     {status} {phase}: {count}")
    
    print("\n📝 Next Steps:")
    print("  1. Open training_data/raw/unclassified/")
    print("  2. Review each image")
    print("  3. Move good images to correct phase folder:")
    print("     - load/ (ball below chin)")
    print("     - set/ (ball at forehead)")
    print("     - release/ (ball leaving hands)")
    print("     - follow_through/ (arms extended)")
    print("  4. Delete bad/irrelevant images")
    print("  5. Run: python collect_training_data.py stats")
    print("="*60)


if __name__ == "__main__":
    main()





