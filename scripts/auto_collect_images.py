#!/usr/bin/env python3
"""
Auto-Collect Basketball Shooting Form Images

This script searches for and collects basketball shooting form images
from free sources (Unsplash, Pexels, Pixabay).

Requirements:
    pip install requests pillow

Usage:
    python auto_collect_images.py --count 100
"""

import os
import sys
import json
import time
import random
import hashlib
import requests
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime

# Base paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"

# API Keys (free tier)
# Get your own keys from:
# - https://unsplash.com/developers
# - https://www.pexels.com/api/
# - https://pixabay.com/api/docs/

UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")
PIXABAY_API_KEY = os.environ.get("PIXABAY_API_KEY", "")

# Search queries for basketball shooting
SEARCH_QUERIES = [
    "basketball player shooting",
    "basketball free throw",
    "basketball shot form",
    "basketball jump shot",
    "basketball three point shot",
    "NBA player shooting",
    "basketball shooter",
    "basketball set shot",
]

# Headers for requests
HEADERS = {
    "User-Agent": "BasketballFormAnalysis/1.0 (Training Data Collection)"
}


class ImageCollector:
    def __init__(self):
        self.downloaded = set()
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self._load_downloaded_hashes()
    
    def _load_downloaded_hashes(self):
        """Load hashes of already downloaded images to avoid duplicates."""
        for phase_dir in RAW_DIR.iterdir():
            if phase_dir.is_dir():
                for img_path in phase_dir.glob("*.*"):
                    try:
                        with open(img_path, "rb") as f:
                            hash_val = hashlib.md5(f.read()).hexdigest()
                            self.downloaded.add(hash_val)
                    except:
                        pass
        print(f"📁 Found {len(self.downloaded)} existing images")
    
    def _is_duplicate(self, content: bytes) -> bool:
        """Check if image content is duplicate."""
        hash_val = hashlib.md5(content).hexdigest()
        if hash_val in self.downloaded:
            return True
        self.downloaded.add(hash_val)
        return False
    
    def _save_image(self, content: bytes, source: str) -> Optional[Path]:
        """Save image to raw/unclassified directory."""
        if self._is_duplicate(content):
            print("  ⏭️ Duplicate, skipping")
            return None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        hash_suffix = hashlib.md5(source.encode()).hexdigest()[:8]
        filename = f"unclassified_{timestamp}_{hash_suffix}.jpg"
        
        # Save to raw directory (not in any phase folder yet)
        filepath = RAW_DIR / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        print(f"  ✅ Saved: {filename}")
        return filepath
    
    def search_unsplash(self, query: str, count: int = 10) -> List[str]:
        """Search Unsplash for images."""
        if not UNSPLASH_ACCESS_KEY:
            print("⚠️ UNSPLASH_ACCESS_KEY not set")
            return []
        
        try:
            url = "https://api.unsplash.com/search/photos"
            params = {
                "query": query,
                "per_page": min(count, 30),
                "orientation": "portrait"  # Better for full-body shots
            }
            headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
            
            response = self.session.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return [photo["urls"]["regular"] for photo in data.get("results", [])]
        
        except Exception as e:
            print(f"❌ Unsplash error: {e}")
            return []
    
    def search_pexels(self, query: str, count: int = 10) -> List[str]:
        """Search Pexels for images."""
        if not PEXELS_API_KEY:
            print("⚠️ PEXELS_API_KEY not set")
            return []
        
        try:
            url = "https://api.pexels.com/v1/search"
            params = {
                "query": query,
                "per_page": min(count, 80),
                "orientation": "portrait"
            }
            headers = {"Authorization": PEXELS_API_KEY}
            
            response = self.session.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return [photo["src"]["large"] for photo in data.get("photos", [])]
        
        except Exception as e:
            print(f"❌ Pexels error: {e}")
            return []
    
    def search_pixabay(self, query: str, count: int = 10) -> List[str]:
        """Search Pixabay for images."""
        if not PIXABAY_API_KEY:
            print("⚠️ PIXABAY_API_KEY not set")
            return []
        
        try:
            url = "https://pixabay.com/api/"
            params = {
                "key": PIXABAY_API_KEY,
                "q": query,
                "per_page": min(count, 200),
                "image_type": "photo",
                "orientation": "vertical",
                "safesearch": "true"
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return [hit["largeImageURL"] for hit in data.get("hits", [])]
        
        except Exception as e:
            print(f"❌ Pixabay error: {e}")
            return []
    
    def download_image(self, url: str) -> Optional[Path]:
        """Download image from URL."""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            if len(response.content) < 10000:  # Too small
                print("  ⏭️ Image too small")
                return None
            
            return self._save_image(response.content, url)
        
        except Exception as e:
            print(f"  ❌ Download failed: {e}")
            return None
    
    def collect_from_all_sources(self, query: str, count_per_source: int = 10) -> int:
        """Collect images from all available sources."""
        print(f"\n🔍 Searching for: '{query}'")
        
        downloaded = 0
        
        # Unsplash
        urls = self.search_unsplash(query, count_per_source)
        print(f"  📷 Unsplash: {len(urls)} results")
        for url in urls:
            if self.download_image(url):
                downloaded += 1
            time.sleep(0.5)  # Rate limiting
        
        # Pexels
        urls = self.search_pexels(query, count_per_source)
        print(f"  📷 Pexels: {len(urls)} results")
        for url in urls:
            if self.download_image(url):
                downloaded += 1
            time.sleep(0.5)
        
        # Pixabay
        urls = self.search_pixabay(query, count_per_source)
        print(f"  📷 Pixabay: {len(urls)} results")
        for url in urls:
            if self.download_image(url):
                downloaded += 1
            time.sleep(0.5)
        
        return downloaded


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Auto-collect basketball shooting form images")
    parser.add_argument("--count", type=int, default=100, help="Target number of images")
    parser.add_argument("--query", type=str, help="Custom search query")
    
    args = parser.parse_args()
    
    # Check for API keys
    has_keys = UNSPLASH_ACCESS_KEY or PEXELS_API_KEY or PIXABAY_API_KEY
    if not has_keys:
        print("""
⚠️ No API keys found! Set at least one of these environment variables:
   
   export UNSPLASH_ACCESS_KEY="your_key"
   export PEXELS_API_KEY="your_key"
   export PIXABAY_API_KEY="your_key"

Get free API keys from:
   - Unsplash: https://unsplash.com/developers
   - Pexels: https://www.pexels.com/api/
   - Pixabay: https://pixabay.com/api/docs/
""")
        return
    
    collector = ImageCollector()
    total_downloaded = 0
    
    # Use custom query or cycle through predefined queries
    queries = [args.query] if args.query else SEARCH_QUERIES
    
    print(f"\n🎯 Target: {args.count} images")
    print(f"📋 Queries: {len(queries)}")
    print("="*50)
    
    while total_downloaded < args.count:
        for query in queries:
            if total_downloaded >= args.count:
                break
            
            remaining = args.count - total_downloaded
            count_per_source = min(10, remaining // 3 + 1)
            
            downloaded = collector.collect_from_all_sources(query, count_per_source)
            total_downloaded += downloaded
            
            print(f"\n📊 Progress: {total_downloaded}/{args.count} images")
            
            # Brief pause between queries
            time.sleep(2)
        
        # If we've cycled through all queries and still need more
        if total_downloaded < args.count:
            print("\n⚠️ Exhausted search queries. Try adding more custom queries.")
            break
    
    print("\n" + "="*50)
    print(f"✅ Collection complete! Downloaded {total_downloaded} images")
    print(f"\n📁 Images saved to: {RAW_DIR}")
    print("\n📝 Next steps:")
    print("   1. Review images manually for quality")
    print("   2. Run: python collect_training_data.py classify")
    print("   3. Move good images to appropriate phase folders")
    print("="*50)


if __name__ == "__main__":
    main()





