#!/usr/bin/env python3
"""
Download more LOAD phase basketball images specifically.
"""

import os
import time
import hashlib
import requests
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "training_data" / "raw"
UNCLASSIFIED_DIR = RAW_DIR / "unclassified"

PEXELS_API_KEY = "1YOjyRmXxeA5s4q1d7CuxepcnFEgMEhmopApbn3MTS7zPf0vUJsrsQSu"
UNSPLASH_ACCESS_KEY = "OMJeP8It444nadmsbi5VpbFDfBo9RP0FBwHTLjhulsg"

# Specific queries for LOAD phase (ball below chin, knees bent, preparing)
LOAD_QUERIES = [
    "basketball player preparing shot",
    "basketball shooting stance",
    "basketball player dip shot",
    "basketball triple threat",
    "basketball player catching ball",
    "basketball free throw preparation",
    "basketball warm up shot",
    "basketball player ready shoot",
]

def search_pexels(query, per_page=30, page=1):
    try:
        url = "https://api.pexels.com/v1/search"
        headers = {"Authorization": PEXELS_API_KEY}
        params = {"query": query, "per_page": per_page, "page": page}
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return [p["src"]["large"] for p in response.json().get("photos", [])]
    except:
        return []

def search_unsplash(query, per_page=30, page=1):
    try:
        url = "https://api.unsplash.com/search/photos"
        headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
        params = {"query": query, "per_page": per_page, "page": page}
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return [p["urls"]["regular"] for p in response.json().get("results", [])]
    except:
        return []

def download_image(url, idx):
    try:
        response = requests.get(url, timeout=30)
        if response.ok and len(response.content) > 20000:
            h = hashlib.md5(url.encode()).hexdigest()[:8]
            filename = f"load_extra_{idx:03d}_{h}.jpg"
            filepath = UNCLASSIFIED_DIR / filename
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"  ✅ {filename}")
            return True
    except:
        pass
    return False

def main():
    print("🏀 Downloading more LOAD phase images...")
    UNCLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    
    urls = []
    for q in LOAD_QUERIES:
        print(f"  🔍 {q}")
        urls.extend(search_pexels(q, 15))
        urls.extend(search_unsplash(q, 15))
        time.sleep(0.5)
    
    urls = list(set(urls))
    print(f"\n📊 Found {len(urls)} unique images")
    
    downloaded = 0
    for i, url in enumerate(urls[:50]):
        if download_image(url, i):
            downloaded += 1
        time.sleep(0.3)
    
    print(f"\n✅ Downloaded {downloaded} images")
    print("   Now run auto_classify_images.py to sort them")

if __name__ == "__main__":
    main()




