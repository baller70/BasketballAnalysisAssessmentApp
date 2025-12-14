#!/usr/bin/env python3
"""
Extract frames from YouTube basketball videos showing different shooting forms
"""

import os
import cv2
import yt_dlp
from pathlib import Path
import subprocess
import time

# Directories
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
TEMP_DIR = BASE_DIR / "temp_web_downloads"
VIDEO_DIR = TEMP_DIR / "videos"
POOR_FORM_FRAMES = TEMP_DIR / "poor_form_candidates"
NEEDS_WORK_FRAMES = TEMP_DIR / "needs_work_candidates"
GOOD_FORM_FRAMES = TEMP_DIR / "good_form_candidates"

for dir_path in [VIDEO_DIR, POOR_FORM_FRAMES, NEEDS_WORK_FRAMES, GOOD_FORM_FRAMES]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Video sources
BAD_FORM_VIDEOS = [
    ("https://www.youtube.com/watch?v=5tJVE4SsIGM", "worst_habits", "poor"),  # WORST Shooting Habits
    ("https://www.youtube.com/watch?v=eufoIsQH9SU", "ugliest_forms", "poor"),  # UGLIEST SHOOTING FORMS
    ("https://www.youtube.com/watch?v=UTbRhDBAtMw", "nba_ugly", "poor"),  # NBA UGLIEST SHOOTING FORMS
    ("https://www.youtube.com/watch?v=JqR-SLQDMwI", "shot_doctor", "needs_work"),  # Shot Doctor - 12 Common Problems
    ("https://www.youtube.com/watch?v=MEQCDqTtIVg", "increasingly_ugly", "poor"),  # Shooting forms increasingly ugly
]

AMATEUR_FORM_VIDEOS = [
    ("https://www.youtube.com/watch?v=wxpdmz2UoOA", "perfect_drills", "needs_work"),  # Drills for PERFECT Shooting Form
    ("https://www.youtube.com/watch?v=J6_-SaW_GUE", "beginners", "needs_work"),  # How to Shoot for Beginners
    ("https://www.youtube.com/watch?v=eR1JX6Oo2xE", "youth_mistakes", "needs_work"),  # Common Youth Shooting Mistake
    ("https://www.youtube.com/watch?v=8EMflyWAcYc", "common_mistakes", "needs_work"),  # Top 3 Most Common Mistakes
    ("https://www.youtube.com/watch?v=W2Xkw0oDl7g", "shooting_mistakes", "needs_work"),  # Top 6 Shooting Mistakes
]

GOOD_FORM_VIDEOS = [
    ("https://www.youtube.com/watch?v=1zx4Y6czDY4", "perfect_form_drills", "good"),  # 3 MUST DO Drills for Perfect Form
    ("https://www.youtube.com/watch?v=fttAr9-Yo9g", "true_fundamentals", "good"),  # TRUE Fundamentals of Shooting Form
    ("https://www.youtube.com/watch?v=EztEhywHzko", "form_shooting", "good"),  # Form Shooting technique
]

def download_video(url, video_name):
    """Download video using yt-dlp"""
    try:
        output_path = VIDEO_DIR / f"{video_name}.mp4"
        
        if output_path.exists():
            print(f"✓ Video already downloaded: {video_name}")
            return output_path
        
        ydl_opts = {
            'format': 'best[ext=mp4][height<=720]/best[ext=mp4]',  # Limit to 720p
            'outtmpl': str(VIDEO_DIR / f'{video_name}.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }
        
        print(f"Downloading: {video_name}...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        print(f"✓ Downloaded: {video_name}")
        return output_path
        
    except Exception as e:
        print(f"✗ Failed to download {url}: {e}")
        return None

def extract_frames(video_path, category, video_name, frames_per_second=0.5, max_frames=50):
    """Extract frames from video at specified intervals"""
    try:
        # Determine output directory
        if category == "poor":
            output_dir = POOR_FORM_FRAMES
        elif category == "needs_work":
            output_dir = NEEDS_WORK_FRAMES
        elif category == "good":
            output_dir = GOOD_FORM_FRAMES
        else:
            output_dir = TEMP_DIR / "other_frames"
            output_dir.mkdir(exist_ok=True)
        
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            print(f"✗ Could not open video: {video_path}")
            return 0
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"  Video: {duration:.1f}s, {fps:.1f} fps, {total_frames} frames")
        
        # Calculate frame interval
        frame_interval = int(fps / frames_per_second) if fps > 0 else 30
        
        frame_count = 0
        saved_count = 0
        
        while saved_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Save every Nth frame
            if frame_count % frame_interval == 0:
                output_file = output_dir / f"{video_name}_frame_{saved_count:04d}.jpg"
                cv2.imwrite(str(output_file), frame)
                saved_count += 1
                print(f"  ✓ Extracted frame {saved_count}/{max_frames}", end='\r')
            
            frame_count += 1
        
        cap.release()
        print(f"\n  ✓ Extracted {saved_count} frames from {video_name}")
        return saved_count
        
    except Exception as e:
        print(f"✗ Failed to extract frames from {video_path}: {e}")
        return 0

def main():
    print("=" * 60)
    print("EXTRACTING FRAMES FROM YOUTUBE VIDEOS")
    print("=" * 60)
    
    all_videos = BAD_FORM_VIDEOS + AMATEUR_FORM_VIDEOS + GOOD_FORM_VIDEOS
    
    total_poor = 0
    total_needs_work = 0
    total_good = 0
    
    for i, (url, video_name, category) in enumerate(all_videos, 1):
        print(f"\n[{i}/{len(all_videos)}] Processing: {video_name} ({category})")
        print("-" * 60)
        
        # Download video
        video_path = download_video(url, video_name)
        if not video_path or not video_path.exists():
            print(f"✗ Skipping frame extraction for {video_name}")
            continue
        
        # Extract frames
        frames_extracted = extract_frames(video_path, category, video_name, 
                                        frames_per_second=0.5, max_frames=50)
        
        if category == "poor":
            total_poor += frames_extracted
        elif category == "needs_work":
            total_needs_work += frames_extracted
        elif category == "good":
            total_good += frames_extracted
        
        time.sleep(1)  # Brief pause between videos
    
    # Summary
    print("\n" + "=" * 60)
    print("EXTRACTION SUMMARY")
    print("=" * 60)
    print(f"Poor form frames: {total_poor}")
    print(f"Needs work frames: {total_needs_work}")
    print(f"Good form frames: {total_good}")
    print(f"Total frames extracted: {total_poor + total_needs_work + total_good}")
    print(f"\nFrames saved to: {TEMP_DIR}")
    print("\nNEXT STEP: Manually review and filter frames to keep only")
    print("images showing actual shooting form (remove instructional text,")
    print("coaches talking, etc.)")

if __name__ == "__main__":
    main()
