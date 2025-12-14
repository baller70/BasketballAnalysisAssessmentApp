#!/usr/bin/env python3
"""
Basketball Image Dataset Expansion Script
Downloads 1,500+ images from Pexels, Unsplash, and Kaggle APIs
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import hashlib

# API Configuration
PEXELS_API_KEY = "1YOjyRmXxeA5s4q1d7CuxepcnFEgMEhmopApbn3MTS7zPf0vUJsrsQSu"
UNSPLASH_ACCESS_KEY = "OMJeP8It444nadmsbi5VpbFDfBo9RP0FBwHTLjhulsg"
UNSPLASH_SECRET_KEY = "gGzB9BbRQfOWfNljeWyj3nBD7X_rEexlqf2sdvFjk_E"

# Rate limits
PEXELS_RATE_LIMIT = 200  # requests per hour
UNSPLASH_RATE_LIMIT = 50  # requests per hour
REQUEST_DELAY = 2  # seconds between requests

# Output directories
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
DOWNLOAD_DIR = BASE_DIR / "api_downloads"
METADATA_DIR = DOWNLOAD_DIR / "metadata"

# Search strategies
BACK_VIEW_QUERIES = {
    "pexels": [
        "basketball shooting back view",
        "basketball player from behind",
        "basketball rear view shooting",
        "basketball back angle shot",
        "basketball player back perspective"
    ],
    "unsplash": [
        "basketball back angle",
        "basketball player behind",
        "basketball back shot",
        "basketball from back",
        "basketball rear angle"
    ]
}

AMATEUR_QUERIES = {
    "pexels": [
        "amateur basketball",
        "youth basketball shooting",
        "street basketball",
        "pickup basketball game",
        "recreational basketball",
        "beginner basketball",
        "casual basketball",
        "playground basketball",
        "neighborhood basketball",
        "park basketball"
    ],
    "unsplash": [
        "recreational basketball",
        "beginner basketball player",
        "casual basketball game",
        "amateur basketball shooting",
        "youth basketball practice",
        "street basketball player",
        "pickup basketball",
        "community basketball"
    ]
}

GOOD_FORM_QUERIES = {
    "pexels": [
        "college basketball shooting",
        "high school basketball player",
        "basketball training shooting",
        "basketball practice form",
        "basketball shooting technique"
    ],
    "unsplash": [
        "basketball training",
        "basketball practice shooting",
        "basketball shooting form",
        "basketball player shooting"
    ]
}


class ImageDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.downloaded_urls = set()
        self.stats = {
            "pexels": {"total": 0, "back_view": 0, "amateur": 0, "good_form": 0},
            "unsplash": {"total": 0, "back_view": 0, "amateur": 0, "good_form": 0},
            "kaggle": {"total": 0, "datasets": 0}
        }
        self.metadata_log = []
        
        # Create directories
        DOWNLOAD_DIR.mkdir(exist_ok=True)
        METADATA_DIR.mkdir(exist_ok=True)
        (DOWNLOAD_DIR / "back_view").mkdir(exist_ok=True)
        (DOWNLOAD_DIR / "amateur_poor_form").mkdir(exist_ok=True)
        (DOWNLOAD_DIR / "good_form").mkdir(exist_ok=True)
        
    def get_image_hash(self, url: str) -> str:
        """Generate unique hash for image URL"""
        return hashlib.md5(url.encode()).hexdigest()[:12]
    
    def download_image(self, url: str, category: str, source: str, metadata: Dict) -> Optional[str]:
        """Download a single image and save metadata"""
        try:
            # Check if already downloaded
            img_hash = self.get_image_hash(url)
            if url in self.downloaded_urls or img_hash in str(self.downloaded_urls):
                print(f"  ⏭️  Skipping duplicate: {img_hash}")
                return None
            
            # Download image
            response = self.session.get(url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Determine file extension
            content_type = response.headers.get('content-type', '')
            ext = 'jpg'
            if 'png' in content_type:
                ext = 'png'
            elif 'webp' in content_type:
                ext = 'webp'
            
            # Save image
            filename = f"{source}_{img_hash}.{ext}"
            filepath = DOWNLOAD_DIR / category / filename
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Check file size
            file_size = filepath.stat().st_size
            if file_size < 10000:  # Less than 10KB, probably error
                filepath.unlink()
                print(f"  ❌ File too small: {filename}")
                return None
            
            # Save metadata
            metadata_entry = {
                "filename": filename,
                "category": category,
                "source": source,
                "url": url,
                "size_bytes": file_size,
                "downloaded_at": datetime.now().isoformat(),
                **metadata
            }
            self.metadata_log.append(metadata_entry)
            
            # Save individual metadata file
            with open(METADATA_DIR / f"{filename}.json", 'w') as f:
                json.dump(metadata_entry, f, indent=2)
            
            self.downloaded_urls.add(url)
            print(f"  ✅ Downloaded: {filename} ({file_size / 1024:.1f} KB)")
            return str(filepath)
            
        except Exception as e:
            print(f"  ❌ Error downloading {url}: {e}")
            return None
    
    def search_pexels(self, query: str, per_page: int = 80) -> List[Dict]:
        """Search Pexels API for images"""
        print(f"🔍 Searching Pexels: '{query}'")
        headers = {"Authorization": PEXELS_API_KEY}
        all_results = []
        
        try:
            # Get multiple pages
            for page in range(1, 4):  # 3 pages max
                url = f"https://api.pexels.com/v1/search?query={query}&per_page={per_page}&page={page}&orientation=portrait"
                response = self.session.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                photos = data.get('photos', [])
                
                if not photos:
                    break
                
                for photo in photos:
                    all_results.append({
                        'url': photo['src']['large2x'],  # High resolution
                        'photographer': photo['photographer'],
                        'photo_id': photo['id'],
                        'alt': photo.get('alt', ''),
                        'width': photo['width'],
                        'height': photo['height']
                    })
                
                print(f"  📄 Page {page}: Found {len(photos)} images")
                time.sleep(REQUEST_DELAY)
                
                # Check if there are more pages
                if len(photos) < per_page:
                    break
            
            print(f"  ✓ Total found: {len(all_results)} images")
            return all_results
            
        except Exception as e:
            print(f"  ❌ Pexels search error: {e}")
            return []
    
    def search_unsplash(self, query: str, per_page: int = 30) -> List[Dict]:
        """Search Unsplash API for images"""
        print(f"🔍 Searching Unsplash: '{query}'")
        headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
        all_results = []
        
        try:
            # Get multiple pages (Unsplash has 50 req/hour limit)
            for page in range(1, 3):  # 2 pages max to conserve quota
                url = f"https://api.unsplash.com/search/photos?query={query}&per_page={per_page}&page={page}&orientation=portrait"
                response = self.session.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                results = data.get('results', [])
                
                if not results:
                    break
                
                for photo in results:
                    all_results.append({
                        'url': photo['urls']['full'],  # High resolution
                        'photographer': photo['user']['name'],
                        'photo_id': photo['id'],
                        'alt': photo.get('alt_description', ''),
                        'width': photo['width'],
                        'height': photo['height'],
                        'likes': photo.get('likes', 0)
                    })
                
                print(f"  📄 Page {page}: Found {len(results)} images")
                time.sleep(REQUEST_DELAY * 2)  # Slower for Unsplash
                
                # Check if there are more pages
                if len(results) < per_page:
                    break
            
            print(f"  ✓ Total found: {len(all_results)} images")
            return all_results
            
        except Exception as e:
            print(f"  ❌ Unsplash search error: {e}")
            return []
    
    def download_category(self, category: str, queries: Dict[str, List[str]], target: int):
        """Download images for a specific category"""
        print(f"\n{'='*80}")
        print(f"📥 DOWNLOADING: {category.upper().replace('_', ' ')}")
        print(f"🎯 Target: {target} images")
        print(f"{'='*80}\n")
        
        downloaded = 0
        
        # Search Pexels
        print("🟢 PEXELS API")
        for query in queries.get("pexels", []):
            if downloaded >= target:
                break
            
            results = self.search_pexels(query)
            for result in results:
                if downloaded >= target:
                    break
                
                metadata = {
                    "query": query,
                    "photographer": result.get('photographer'),
                    "photo_id": result.get('photo_id'),
                    "alt": result.get('alt', ''),
                    "dimensions": f"{result.get('width')}x{result.get('height')}"
                }
                
                if self.download_image(result['url'], category, "pexels", metadata):
                    downloaded += 1
                    self.stats["pexels"]["total"] += 1
                    self.stats["pexels"][category] += 1
                
                time.sleep(REQUEST_DELAY)
        
        print(f"\n✓ Pexels complete: {self.stats['pexels'][category]} images\n")
        
        # Search Unsplash
        print("🔵 UNSPLASH API")
        for query in queries.get("unsplash", []):
            if downloaded >= target:
                break
            
            results = self.search_unsplash(query)
            for result in results:
                if downloaded >= target:
                    break
                
                metadata = {
                    "query": query,
                    "photographer": result.get('photographer'),
                    "photo_id": result.get('photo_id'),
                    "alt": result.get('alt', ''),
                    "dimensions": f"{result.get('width')}x{result.get('height')}",
                    "likes": result.get('likes', 0)
                }
                
                if self.download_image(result['url'], category, "unsplash", metadata):
                    downloaded += 1
                    self.stats["unsplash"]["total"] += 1
                    self.stats["unsplash"][category] += 1
                
                time.sleep(REQUEST_DELAY * 2)
        
        print(f"\n✓ Unsplash complete: {self.stats['unsplash'][category]} images\n")
        print(f"{'='*80}")
        print(f"✅ CATEGORY COMPLETE: {downloaded} / {target} images downloaded")
        print(f"{'='*80}\n")
    
    def save_final_report(self):
        """Save comprehensive download report"""
        report = {
            "download_date": datetime.now().isoformat(),
            "statistics": self.stats,
            "total_images": sum(source['total'] for source in self.stats.values()),
            "images_by_category": {
                "back_view": self.stats['pexels'].get('back_view', 0) + self.stats['unsplash'].get('back_view', 0),
                "amateur_poor_form": self.stats['pexels'].get('amateur_poor_form', 0) + self.stats['unsplash'].get('amateur_poor_form', 0),
                "good_form": self.stats['pexels'].get('good_form', 0) + self.stats['unsplash'].get('good_form', 0)
            },
            "metadata_entries": len(self.metadata_log)
        }
        
        # Save statistics
        with open(DOWNLOAD_DIR / "download_statistics.json", 'w') as f:
            json.dump(report, f, indent=2)
        
        # Save full metadata log
        with open(DOWNLOAD_DIR / "metadata_log.json", 'w') as f:
            json.dump(self.metadata_log, f, indent=2)
        
        print("\n" + "="*80)
        print("📊 FINAL STATISTICS")
        print("="*80)
        print(f"Total Images Downloaded: {report['total_images']}")
        print(f"\nBy Source:")
        print(f"  Pexels:   {self.stats['pexels']['total']}")
        print(f"  Unsplash: {self.stats['unsplash']['total']}")
        print(f"\nBy Category:")
        print(f"  Back View:        {report['images_by_category']['back_view']}")
        print(f"  Amateur/Poor:     {report['images_by_category']['amateur_poor_form']}")
        print(f"  Good Form:        {report['images_by_category']['good_form']}")
        print("="*80)
        
        return report


def main():
    """Main execution function"""
    print("\n" + "="*80)
    print("🏀 BASKETBALL DATASET EXPANSION - API IMAGE DOWNLOADER")
    print("="*80)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    downloader = ImageDownloader()
    
    # Download back view images (target: 300)
    downloader.download_category("back_view", BACK_VIEW_QUERIES, target=300)
    
    # Download amateur/poor form images (target: 1000)
    downloader.download_category("amateur_poor_form", AMATEUR_QUERIES, target=1000)
    
    # Download good form images (target: 250)
    downloader.download_category("good_form", GOOD_FORM_QUERIES, target=250)
    
    # Save final report
    report = downloader.save_final_report()
    
    print(f"\n✅ Download complete!")
    print(f"📁 Images saved to: {DOWNLOAD_DIR}")
    print(f"📄 Metadata saved to: {METADATA_DIR}")
    print(f"\nEnd Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    return report


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Download interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
