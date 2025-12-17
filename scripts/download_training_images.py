#!/usr/bin/env python3
"""
Download Basketball Shooting Form Training Images

This script downloads curated, high-quality basketball shooting images
from free sources that don't require API keys.

Usage:
    python download_training_images.py
"""

import os
import sys
import time
import hashlib
import requests
from pathlib import Path
from urllib.parse import urlparse, quote
from concurrent.futures import ThreadPoolExecutor, as_completed

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"

# Request settings
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Curated image URLs from Wikimedia Commons and other free sources
# These are specifically basketball shooting form images
CURATED_IMAGES = {
    "load": [
        # Player preparing to shoot - ball low, knees bent
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Basketball_player_shooting.jpg/640px-Basketball_player_shooting.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Basketball_-_Pair_of_shooters.jpg/640px-Basketball_-_Pair_of_shooters.jpg",
    ],
    "set": [
        # Ball at set point - forehead level
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Basketball_Free_Throw.jpg/480px-Basketball_Free_Throw.jpg",
    ],
    "release": [
        # Ball leaving hands
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Basketball_game.jpg/640px-Basketball_game.jpg",
    ],
    "follow_through": [
        # Arms extended after release
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Basketball_shot.jpg/480px-Basketball_shot.jpg",
    ],
}

# Wikimedia Commons search queries
WIKIMEDIA_SEARCHES = [
    "basketball+shooting",
    "basketball+free+throw",
    "basketball+player+shooting",
    "NBA+shooting",
    "basketball+jump+shot",
]


def download_image(url: str, phase: str, index: int) -> bool:
    """Download a single image."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        response.raise_for_status()
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type and "octet-stream" not in content_type:
            print(f"  ⚠️ Not an image: {content_type}")
            return False
        
        # Check size
        if len(response.content) < 5000:
            print(f"  ⚠️ Image too small")
            return False
        
        # Generate filename
        ext = ".jpg"
        if "png" in content_type:
            ext = ".png"
        elif "webp" in content_type:
            ext = ".webp"
        
        hash_suffix = hashlib.md5(url.encode()).hexdigest()[:8]
        filename = f"{phase}_{index:03d}_{hash_suffix}{ext}"
        filepath = RAW_DIR / phase / filename
        
        # Save
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(response.content)
        
        print(f"  ✅ {filename}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed: {str(e)[:50]}")
        return False


def search_wikimedia(query: str, limit: int = 50) -> list:
    """Search Wikimedia Commons for images."""
    try:
        # Use Wikimedia Commons API
        api_url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {query}",
            "gsrlimit": limit,
            "prop": "imageinfo",
            "iiprop": "url|size",
            "iiurlwidth": 800,
        }
        
        response = requests.get(api_url, params=params, headers=HEADERS, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        urls = []
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            imageinfo = page.get("imageinfo", [{}])[0]
            url = imageinfo.get("thumburl") or imageinfo.get("url")
            if url and imageinfo.get("width", 0) >= 400:
                urls.append(url)
        
        return urls
        
    except Exception as e:
        print(f"  ❌ Search error: {e}")
        return []


def search_unsplash_source(query: str, count: int = 30) -> list:
    """Get images from Unsplash Source (no API key needed)."""
    # Unsplash Source provides random images for a search term
    urls = []
    for i in range(count):
        # Each URL with different sig returns different image
        url = f"https://source.unsplash.com/800x1000/?{quote(query)}&sig={i}"
        urls.append(url)
    return urls


def classify_image_phase(url: str) -> str:
    """
    Attempt to classify image phase based on URL/filename.
    Returns 'unclassified' if can't determine.
    """
    url_lower = url.lower()
    
    if any(x in url_lower for x in ["free_throw", "freethrow", "setup", "prepare"]):
        return "load"
    elif any(x in url_lower for x in ["aim", "target", "set_point"]):
        return "set"
    elif any(x in url_lower for x in ["release", "shoot", "shot"]):
        return "release"
    elif any(x in url_lower for x in ["follow", "finish", "complete"]):
        return "follow_through"
    
    return "unclassified"


def main():
    print("="*60)
    print("🏀 Basketball Shooting Form - Image Downloader")
    print("="*60)
    
    # Ensure directories exist
    for phase in ["load", "set", "release", "follow_through", "unclassified"]:
        (RAW_DIR / phase).mkdir(parents=True, exist_ok=True)
    
    total_downloaded = 0
    
    # 1. Download curated images first
    print("\n📥 Downloading curated images...")
    for phase, urls in CURATED_IMAGES.items():
        print(f"\n  {phase.upper()}:")
        for i, url in enumerate(urls):
            if download_image(url, phase, i):
                total_downloaded += 1
            time.sleep(0.5)
    
    # 2. Search Wikimedia Commons
    print("\n🔍 Searching Wikimedia Commons...")
    wikimedia_urls = []
    for query in WIKIMEDIA_SEARCHES:
        print(f"  Searching: {query}")
        urls = search_wikimedia(query, 20)
        wikimedia_urls.extend(urls)
        time.sleep(1)
    
    # Remove duplicates
    wikimedia_urls = list(set(wikimedia_urls))
    print(f"  Found {len(wikimedia_urls)} unique images")
    
    # Download Wikimedia images
    print("\n📥 Downloading Wikimedia images...")
    for i, url in enumerate(wikimedia_urls[:50]):  # Limit to 50
        phase = classify_image_phase(url)
        if download_image(url, phase, total_downloaded + i):
            total_downloaded += 1
        time.sleep(0.3)
    
    # 3. Get Unsplash images (no API needed)
    print("\n🔍 Getting Unsplash images...")
    unsplash_queries = [
        "basketball player shooting",
        "basketball free throw",
        "basketball jump shot",
    ]
    
    for query in unsplash_queries:
        print(f"  Query: {query}")
        urls = search_unsplash_source(query, 10)
        
        for i, url in enumerate(urls):
            if download_image(url, "unclassified", total_downloaded + i):
                total_downloaded += 1
            time.sleep(1)  # Unsplash rate limiting
    
    # Print summary
    print("\n" + "="*60)
    print("📊 DOWNLOAD SUMMARY")
    print("="*60)
    
    for phase in ["load", "set", "release", "follow_through", "unclassified"]:
        phase_dir = RAW_DIR / phase
        count = len(list(phase_dir.glob("*.*"))) if phase_dir.exists() else 0
        print(f"  {phase.upper()}: {count} images")
    
    print(f"\n  📁 Total downloaded: {total_downloaded}")
    print(f"  📂 Location: {RAW_DIR}")
    
    print("\n📝 Next Steps:")
    print("  1. Review 'unclassified' folder manually")
    print("  2. Move images to correct phase folders")
    print("  3. Delete bad/irrelevant images")
    print("  4. Run: python collect_training_data.py stats")
    print("="*60)


if __name__ == "__main__":
    main()





