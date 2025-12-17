#!/usr/bin/env python3
"""
Download Basketball Training Images using Pexels and Unsplash APIs

Uses official APIs with provided keys to download high-quality images.
"""

import os
import sys
import time
import hashlib
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
UNCLASSIFIED_DIR = RAW_DIR / "unclassified"

# API Keys
PEXELS_API_KEY = "1YOjyRmXxeA5s4q1d7CuxepcnFEgMEhmopApbn3MTS7zPf0vUJsrsQSu"
UNSPLASH_ACCESS_KEY = "OMJeP8It444nadmsbi5VpbFDfBo9RP0FBwHTLjhulsg"
PIXABAY_API_KEY = "47169617-1cb0dc6bce738ca63ad762207"

# Target
TARGET_IMAGES = 300  # Get extra to account for rejections

# Search queries for basketball shooting - MORE SPECIFIC
SEARCH_QUERIES = [
    "basketball free throw shooting",
    "basketball jump shot side view",
    "basketball shooting follow through",
    "basketball player set shot",
    "basketball shooting practice",
    "basketball shooting drill form",
    "basketball training shooting technique",
    "basketball shot release",
    "basketball player aiming basket",
    "basketball shooting stance",
    "basketball warm up shooting",
    "basketball practice shot",
    "youth basketball shooting form",
    "basketball shooting motion",
    "basketball release point shot",
]

HEADERS = {
    "User-Agent": "BasketballFormAnalysis/1.0"
}


def download_image(url: str, filename: str) -> bool:
    """Download a single image."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        content = response.content
        
        # Check minimum size (at least 20KB for quality)
        if len(content) < 20000:
            return False
        
        filepath = UNCLASSIFIED_DIR / filename
        with open(filepath, "wb") as f:
            f.write(content)
        
        return True
    except Exception as e:
        return False


def search_pexels(query: str, per_page: int = 30, page: int = 1) -> list:
    """Search Pexels API for images."""
    try:
        url = "https://api.pexels.com/v1/search"
        headers = {
            "Authorization": PEXELS_API_KEY,
            **HEADERS
        }
        params = {
            "query": query,
            "per_page": per_page,
            "page": page,
            "orientation": "portrait",
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        photos = data.get("photos", [])
        
        results = []
        for photo in photos:
            src = photo.get("src", {})
            # Get large size (good quality)
            image_url = src.get("large") or src.get("original")
            if image_url:
                results.append({
                    "url": image_url,
                    "id": photo.get("id"),
                    "source": "pexels"
                })
        
        return results
    
    except Exception as e:
        print(f"    ⚠️ Pexels error: {e}")
        return []


def search_unsplash(query: str, per_page: int = 30, page: int = 1) -> list:
    """Search Unsplash API for images."""
    try:
        url = "https://api.unsplash.com/search/photos"
        headers = {
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
            **HEADERS
        }
        params = {
            "query": query,
            "per_page": per_page,
            "page": page,
            "orientation": "portrait",
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        photos = data.get("results", [])
        
        results = []
        for photo in photos:
            urls = photo.get("urls", {})
            # Get regular size (good balance of quality and speed)
            image_url = urls.get("regular") or urls.get("full")
            if image_url:
                results.append({
                    "url": image_url,
                    "id": photo.get("id"),
                    "source": "unsplash"
                })
        
        return results
    
    except Exception as e:
        print(f"    ⚠️ Unsplash error: {e}")
        return []


def search_pixabay(query: str, per_page: int = 30, page: int = 1) -> list:
    """Search Pixabay API for images."""
    try:
        url = "https://pixabay.com/api/"
        params = {
            "key": PIXABAY_API_KEY,
            "q": query,
            "per_page": per_page,
            "page": page,
            "image_type": "photo",
            "orientation": "vertical",
            "safesearch": "true",
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        hits = data.get("hits", [])
        
        results = []
        for hit in hits:
            # Get largeImageURL for good quality
            image_url = hit.get("largeImageURL") or hit.get("webformatURL")
            if image_url:
                results.append({
                    "url": image_url,
                    "id": hit.get("id"),
                    "source": "pixabay"
                })
        
        return results
    
    except Exception as e:
        print(f"    ⚠️ Pixabay error: {e}")
        return []


def main():
    print("="*60)
    print("🏀 Basketball Image Downloader (Pexels + Unsplash APIs)")
    print("="*60)
    
    # Create directories
    UNCLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    
    # Count existing
    existing = len(list(UNCLASSIFIED_DIR.glob("*.*")))
    print(f"\n📁 Existing images: {existing}")
    print(f"🎯 Target: {TARGET_IMAGES} images")
    
    if existing >= TARGET_IMAGES:
        print("\n✅ Already have enough images!")
        return
    
    all_images = []
    seen_ids = set()
    
    # Search all 3 APIs
    for query in SEARCH_QUERIES:
        print(f"\n🔍 Searching: '{query}'")
        
        # Pexels
        print("  📷 Pexels...")
        pexels_results = search_pexels(query, per_page=30)
        for img in pexels_results:
            if img["id"] not in seen_ids:
                seen_ids.add(img["id"])
                all_images.append(img)
        print(f"     Found {len(pexels_results)} images")
        
        time.sleep(0.5)  # Rate limiting
        
        # Unsplash
        print("  📷 Unsplash...")
        unsplash_results = search_unsplash(query, per_page=30)
        for img in unsplash_results:
            if img["id"] not in seen_ids:
                seen_ids.add(img["id"])
                all_images.append(img)
        print(f"     Found {len(unsplash_results)} images")
        
        time.sleep(0.5)
        
        # Pixabay
        print("  📷 Pixabay...")
        pixabay_results = search_pixabay(query, per_page=30)
        for img in pixabay_results:
            if img["id"] not in seen_ids:
                seen_ids.add(img["id"])
                all_images.append(img)
        print(f"     Found {len(pixabay_results)} images")
        
        time.sleep(0.5)
    
    print(f"\n📊 Total unique images found: {len(all_images)}")
    
    # Download images
    print("\n📥 Downloading images...")
    downloaded = 0
    failed = 0
    
    for i, img in enumerate(all_images):
        if existing + downloaded >= TARGET_IMAGES:
            break
        
        hash_suffix = hashlib.md5(str(img["id"]).encode()).hexdigest()[:8]
        filename = f"{img['source']}_{downloaded:03d}_{hash_suffix}.jpg"
        
        if download_image(img["url"], filename):
            downloaded += 1
            print(f"  ✅ [{downloaded}/{TARGET_IMAGES - existing}] {filename}")
        else:
            failed += 1
        
        # Rate limiting
        if i % 10 == 0:
            time.sleep(1)
    
    # Final count
    final_count = len(list(UNCLASSIFIED_DIR.glob("*.*")))
    
    print("\n" + "="*60)
    print("📊 DOWNLOAD COMPLETE")
    print("="*60)
    print(f"  ✅ Downloaded: {downloaded}")
    print(f"  ❌ Failed: {failed}")
    print(f"  📁 Total images: {final_count}")
    print(f"  📂 Location: {UNCLASSIFIED_DIR}")
    
    if final_count >= 100:
        print("\n✅ Minimum 100 images achieved!")
    else:
        print(f"\n⚠️ Have {final_count} images, need {100 - final_count} more")
    
    print("="*60)


if __name__ == "__main__":
    main()




