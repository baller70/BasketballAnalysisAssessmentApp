#!/usr/bin/env python3
"""
Download basketball shooting images from Pexels and Unsplash
Focus on amateur, back view, and varied skill level images
"""

import os
import requests
import time
from pathlib import Path
import hashlib

# Directories
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
TEMP_DIR = BASE_DIR / "temp_web_downloads"
BACK_VIEW_DIR = TEMP_DIR / "back_view_candidates"
POOR_FORM_DIR = TEMP_DIR / "poor_form_candidates"
NEEDS_WORK_DIR = TEMP_DIR / "needs_work_candidates"
GOOD_FORM_DIR = TEMP_DIR / "good_form_candidates"
GENERAL_DIR = TEMP_DIR / "general_basketball"

for dir_path in [BACK_VIEW_DIR, POOR_FORM_DIR, NEEDS_WORK_DIR, GOOD_FORM_DIR, GENERAL_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Pexels API (free tier - 200 requests/hour)
# Note: Pexels doesn't require API key for basic access, but rate limited
PEXELS_QUERIES = [
    ("basketball shooting back view", 30),
    ("basketball player shooting from behind", 30),
    ("basketball shooting form", 50),
    ("amateur basketball player shooting", 40),
    ("youth basketball shooting", 40),
    ("basketball free throw", 30),
    ("basketball jump shot", 30),
    ("basketball layup", 20),
]

# Unsplash queries
UNSPLASH_QUERIES = [
    "basketball shot back view",
    "basketball player shooting behind",
    "basketball jump shot",
    "basketball free throw",
    "amateur basketball",
    "youth basketball",
]

def download_from_pexels(query, num_images=30):
    """Download images from Pexels"""
    base_url = "https://api.pexels.com/v1/search"
    
    # Note: For free usage without API key, we'll use direct image URLs
    # from our previous search results
    print(f"Query: {query}")
    print(f"Note: Pexels API requires authentication for programmatic access.")
    print(f"Using manually curated URLs from previous search.")
    
    return 0

def download_pexels_curated():
    """Download curated Pexels images from our search results"""
    
    # Additional Pexels URLs from various basketball searches
    pexels_urls = {
        "back_view": [
            "https://images.pexels.com/photos/8084839/pexels-photo-8084839.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/8084768/pexels-photo-8084768.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/13104621/pexels-photo-13104621.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/8979891/pexels-photo-8979891.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        ],
        "general": [
            # Add more general basketball shooting images
            # These would need to be manually sourced from Pexels search
        ],
    }
    
    total_downloaded = 0
    
    for category, urls in pexels_urls.items():
        if category == "back_view":
            target_dir = BACK_VIEW_DIR
        else:
            target_dir = GENERAL_DIR
        
        for url in urls:
            if download_image(url, target_dir, f"pexels_{category}"):
                total_downloaded += 1
    
    return total_downloaded

def download_image(url, save_dir, prefix="image"):
    """Download an image from URL"""
    try:
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        ext = '.jpg'
        if '.png' in url.lower():
            ext = '.png'
        elif '.jpeg' in url.lower() or '.jpg' in url.lower():
            ext = '.jpg'
        
        filename = f"{prefix}_{url_hash}{ext}"
        filepath = save_dir / filename
        
        if filepath.exists():
            print(f"  ✓ Already exists: {filename}")
            return filepath
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"  ✓ Downloaded: {filename}")
        time.sleep(1)
        return filepath
        
    except Exception as e:
        print(f"  ✗ Failed: {str(e)[:50]}")
        return None

def search_and_download_from_web():
    """
    Alternative approach: Use web scraping or manual curation
    Since we need specific amateur/poor form images, manual curation is better
    """
    print("\n" + "=" * 60)
    print("RECOMMENDATION: Manual Image Curation")
    print("=" * 60)
    print("""
For best results in categorizing shooting form quality, consider:

1. ROBOFLOW UNIVERSE DATASETS:
   - Visit: https://universe.roboflow.com/search?q=basketball
   - Download pre-labeled basketball datasets
   - Contains thousands of annotated images
   
2. PEXELS MANUAL SEARCH:
   - Visit: https://images.pexels.com/photos/14611877/pexels-photo-14611877.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1
   - 800,000+ free images
   - Search terms: "amateur basketball", "youth basketball", "basketball shooting"
   - Download high-quality images manually
   
3. UNSPLASH:
   - Visit: https://images.pexels.com/photos/8084768/pexels-photo-8084768.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500
   - 100+ free high-quality images
   - Good for professional form examples
   
4. SPACEJAM DATASET (GitHub):
   - https://github.com/simonefrancia/SpaceJam
   - 32,560 action recognition examples
   - Includes joint coordinates for pose analysis
   
5. KAGGLE BASKETBALL DATASETS:
   - Already configured with API token
   - Basketball tracking datasets available
   - Good for varied angles and amateur players
""")

def main():
    print("=" * 60)
    print("DOWNLOADING STOCK BASKETBALL IMAGES")
    print("=" * 60)
    
    print("\n1. Downloading curated Pexels images...")
    pexels_count = download_pexels_curated()
    
    print(f"\n✓ Downloaded {pexels_count} curated images")
    
    # Show recommendations
    search_and_download_from_web()
    
    # Summary
    print("\n" + "=" * 60)
    print("NEXT STEPS")
    print("=" * 60)
    print("""
1. Run YouTube frame extraction:
   python extract_youtube_frames.py
   
2. Download Roboflow Universe datasets:
   - Visit https://universe.roboflow.com/search?q=basketball
   - Download datasets with varied skill levels
   
3. Manually curate images:
   - Review all downloaded images
   - Categorize by form quality: Poor, Needs Work, Good, Excellent
   - Remove images without clear shooting form
   
4. Organize into training folders:
   - Run organize_dataset.py after curation
""")

if __name__ == "__main__":
    main()
