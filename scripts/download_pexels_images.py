#!/usr/bin/env python3
"""
Download Basketball Images from Pexels

Pexels offers a free API with generous limits.
Get your free API key at: https://www.pexels.com/api/

Usage:
    export PEXELS_API_KEY="your_key_here"
    python download_pexels_images.py

Or without API key - uses direct scraping (slower, less reliable)
"""

import os
import sys
import time
import json
import hashlib
import requests
from pathlib import Path
from urllib.parse import quote

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"

# API key
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")

# Search queries
SEARCH_QUERIES = [
    "basketball player shooting",
    "basketball free throw",
    "basketball jump shot",
    "basketball shot",
    "basketball game shooting",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


def search_pexels_api(query: str, per_page: int = 30) -> list:
    """Search Pexels using official API."""
    if not PEXELS_API_KEY:
        print("  ⚠️ No Pexels API key - skipping API search")
        return []
    
    try:
        url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": PEXELS_API_KEY}
        params = {
            "query": query,
            "per_page": per_page,
            "orientation": "portrait",
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        photos = data.get("photos", [])
        
        urls = []
        for photo in photos:
            # Get large size (good quality, reasonable file size)
            src = photo.get("src", {})
            url = src.get("large") or src.get("original")
            if url:
                urls.append(url)
        
        return urls
    
    except Exception as e:
        print(f"  ❌ Pexels API error: {e}")
        return []


def search_pexels_web(query: str, page: int = 1) -> list:
    """Fallback: scrape Pexels website (no API key needed)."""
    try:
        # Pexels web search URL
        encoded_query = quote(query)
        url = f"https://www.pexels.com/search/{encoded_query}/?orientation=portrait"
        
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        # Parse image URLs from page
        # Note: This is fragile and may break if Pexels changes their HTML
        urls = []
        import re
        
        # Look for image URLs in the page
        pattern = r'https://images\.pexels\.com/photos/\d+/[^"\'>\s]+\.jpe?g[^"\'>\s]*'
        matches = re.findall(pattern, response.text)
        
        # Get unique URLs and clean them
        seen = set()
        for url in matches:
            # Get base URL without size parameters
            base_url = url.split('?')[0]
            if base_url not in seen and 'w=640' not in url:  # Skip thumbnails
                seen.add(base_url)
                # Request larger size
                urls.append(f"{base_url}?auto=compress&cs=tinysrgb&w=800")
        
        return urls[:30]  # Limit results
    
    except Exception as e:
        print(f"  ❌ Web scrape error: {e}")
        return []


def download_image(url: str, folder: str, index: int) -> bool:
    """Download a single image."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        content = response.content
        
        # Check size
        if len(content) < 10000:
            return False
        
        # Generate filename
        hash_suffix = hashlib.md5(url.encode()).hexdigest()[:8]
        filename = f"pexels_{index:03d}_{hash_suffix}.jpg"
        
        filepath = RAW_DIR / folder / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        print(f"  ✅ {filename}")
        return True
    
    except Exception as e:
        print(f"  ❌ Failed: {str(e)[:40]}")
        return False


def main():
    print("="*60)
    print("🏀 Pexels Basketball Image Downloader")
    print("="*60)
    
    if PEXELS_API_KEY:
        print(f"✅ Using Pexels API")
    else:
        print("⚠️ No PEXELS_API_KEY set - using web scraping (limited)")
        print("   Get a free key at: https://www.pexels.com/api/")
    
    # Create directories
    unclassified_dir = RAW_DIR / "unclassified"
    unclassified_dir.mkdir(parents=True, exist_ok=True)
    
    all_urls = []
    
    # Search for images
    print("\n🔍 Searching Pexels...")
    for query in SEARCH_QUERIES:
        print(f"\n  Query: '{query}'")
        
        if PEXELS_API_KEY:
            urls = search_pexels_api(query, per_page=20)
        else:
            urls = search_pexels_web(query)
        
        print(f"  Found: {len(urls)} images")
        all_urls.extend(urls)
        time.sleep(1)  # Rate limiting
    
    # Remove duplicates
    all_urls = list(set(all_urls))
    print(f"\n📊 Total unique URLs: {len(all_urls)}")
    
    # Download images
    print("\n📥 Downloading images...")
    downloaded = 0
    
    for i, url in enumerate(all_urls):
        if download_image(url, "unclassified", i):
            downloaded += 1
        time.sleep(0.5)  # Rate limiting
    
    # Summary
    print("\n" + "="*60)
    print("📊 DOWNLOAD SUMMARY")
    print("="*60)
    print(f"  ✅ Downloaded: {downloaded} images")
    print(f"  📂 Location: {unclassified_dir}")
    
    unclassified_count = len(list(unclassified_dir.glob("*.jpg")))
    print(f"  📁 Total in unclassified: {unclassified_count}")
    
    print("\n📝 Next Steps:")
    print("  1. Open training_data/raw/unclassified/ in Finder")
    print("  2. Review each image")
    print("  3. Move good shooting images to phase folders")
    print("  4. Delete non-shooting images")
    print("="*60)


if __name__ == "__main__":
    main()





