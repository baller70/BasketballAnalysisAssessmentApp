#!/usr/bin/env python3
"""
Script to download basketball shooting images from web sources
Focuses on back view and poor/amateur form images
"""

import os
import requests
import time
from pathlib import Path
from urllib.parse import urlparse
import hashlib

# Create download directories
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
TEMP_DIR = BASE_DIR / "temp_web_downloads"
BACK_VIEW_DIR = TEMP_DIR / "back_view_candidates"
POOR_FORM_DIR = TEMP_DIR / "poor_form_candidates"
NEEDS_WORK_DIR = TEMP_DIR / "needs_work_candidates"
GOOD_FORM_DIR = TEMP_DIR / "good_form_candidates"

for dir_path in [TEMP_DIR, BACK_VIEW_DIR, POOR_FORM_DIR, NEEDS_WORK_DIR, GOOD_FORM_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Free Pexels images (back view)
BACK_VIEW_IMAGES = [
    "https://images.pexels.com/photos/8084839/pexels-photo-8084839.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/8084768/pexels-photo-8084768.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/13104621/pexels-photo-13104621.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/8979891/pexels-photo-8979891.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
]

# YouTube thumbnails from bad form videos (for reference - need to extract actual frames)
BAD_FORM_VIDEOS = [
    "https://www.youtube.com/watch?v=5tJVE4SsIGM",  # WORST Shooting Habits
    "https://www.youtube.com/watch?v=eufoIsQH9SU",  # UGLIEST SHOOTING FORMS
    "https://www.youtube.com/watch?v=UTbRhDBAtMw",  # NBA UGLIEST SHOOTING FORMS
    "https://www.youtube.com/watch?v=JqR-SLQDMwI",  # Shot Doctor - 12 Common Problems
    "https://www.youtube.com/watch?v=MEQCDqTtIVg",  # Shooting forms increasingly ugly
]

# Amateur/learning form videos (for "needs work" category)
AMATEUR_FORM_VIDEOS = [
    "https://www.youtube.com/watch?v=wxpdmz2UoOA",  # Drills for PERFECT Shooting Form
    "https://www.youtube.com/watch?v=J6_-SaW_GUE",  # How to Shoot for Beginners
    "https://www.youtube.com/watch?v=eR1JX6Oo2xE",  # Common Youth Shooting Mistake
    "https://www.youtube.com/watch?v=8EMflyWAcYc",  # Top 3 Most Common Mistakes
    "https://www.youtube.com/watch?v=W2Xkw0oDl7g",  # Top 6 Shooting Mistakes
]

def download_image(url, save_dir, prefix="image"):
    """Download an image from URL"""
    try:
        # Generate filename from URL hash to avoid duplicates
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        ext = Path(urlparse(url).path).suffix or '.jpg'
        filename = f"{prefix}_{url_hash}{ext}"
        filepath = save_dir / filename
        
        # Skip if already downloaded
        if filepath.exists():
            print(f"✓ Already downloaded: {filename}")
            return filepath
        
        # Download with user agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"✓ Downloaded: {filename} ({len(response.content)} bytes)")
        time.sleep(1)  # Be polite
        return filepath
        
    except Exception as e:
        print(f"✗ Failed to download {url}: {e}")
        return None

def main():
    print("=" * 60)
    print("DOWNLOADING BASKETBALL SHOOTING IMAGES")
    print("=" * 60)
    
    # Download back view images
    print("\n1. Downloading back view images from Pexels...")
    back_view_count = 0
    for url in BACK_VIEW_IMAGES:
        if download_image(url, BACK_VIEW_DIR, "back_view"):
            back_view_count += 1
    
    print(f"\n✓ Downloaded {back_view_count} back view images")
    
    # Note about videos
    print("\n" + "=" * 60)
    print("VIDEO SOURCES IDENTIFIED")
    print("=" * 60)
    print(f"\nBad Form Videos: {len(BAD_FORM_VIDEOS)}")
    for i, video in enumerate(BAD_FORM_VIDEOS, 1):
        print(f"  {i}. {video}")
    
    print(f"\nAmateur Form Videos: {len(AMATEUR_FORM_VIDEOS)}")
    for i, video in enumerate(AMATEUR_FORM_VIDEOS, 1):
        print(f"  {i}. {video}")
    
    print("\nNote: YouTube videos require frame extraction using yt-dlp or similar.")
    print("Run extract_youtube_frames.py to process these videos.")
    
    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"Back view images: {back_view_count}")
    print(f"Videos to process: {len(BAD_FORM_VIDEOS) + len(AMATEUR_FORM_VIDEOS)}")
    print(f"\nSaved to: {TEMP_DIR}")

if __name__ == "__main__":
    main()
