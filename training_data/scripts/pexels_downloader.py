#!/usr/bin/env python3
"""
Pexels API Basketball Image Downloader
Downloads basketball images from Pexels with specific search queries
"""

import os
import requests
import time
import hashlib
from pathlib import Path
from typing import List, Dict, Tuple
import json
from datetime import datetime

class PexelsDownloader:
    def __init__(self, api_key: str, output_dir: str):
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.base_url = "https://api.pexels.com/v1"
        self.headers = {"Authorization": api_key}
        self.download_stats = {
            "total_downloaded": 0,
            "failed_downloads": 0,
            "duplicates_skipped": 0,
            "queries_processed": 0
        }
        self.downloaded_hashes = set()
        
        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def search_photos(self, query: str, per_page: int = 80, page: int = 1) -> Dict:
        """Search Pexels for photos"""
        url = f"{self.base_url}/search"
        params = {
            "query": query,
            "per_page": per_page,
            "page": page,
            "orientation": "landscape",  # Better for basketball action shots
            "size": "large"  # Get high quality images
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error searching Pexels: {e}")
            return {"photos": [], "total_results": 0}
    
    def get_image_hash(self, image_data: bytes) -> str:
        """Calculate MD5 hash of image to detect duplicates"""
        return hashlib.md5(image_data).hexdigest()
    
    def download_image(self, url: str, filename: str) -> Tuple[bool, str]:
        """Download a single image and return success status and hash"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Calculate hash to check for duplicates
            image_hash = self.get_image_hash(response.content)
            
            if image_hash in self.downloaded_hashes:
                self.download_stats["duplicates_skipped"] += 1
                return False, "duplicate"
            
            # Save image
            filepath = self.output_dir / filename
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            # Add hash to set
            self.downloaded_hashes.add(image_hash)
            self.download_stats["total_downloaded"] += 1
            
            return True, image_hash
            
        except Exception as e:
            print(f"❌ Error downloading {filename}: {e}")
            self.download_stats["failed_downloads"] += 1
            return False, "error"
    
    def download_from_query(self, query: str, max_images: int = 100, 
                           category_prefix: str = "") -> int:
        """Download images from a specific search query"""
        print(f"\n🔍 Searching Pexels for: '{query}'")
        print(f"📊 Target: {max_images} images")
        
        downloaded = 0
        page = 1
        max_pages = 10  # Pexels API limit
        
        while downloaded < max_images and page <= max_pages:
            # Search for photos
            results = self.search_photos(query, per_page=80, page=page)
            
            if not results.get("photos"):
                print(f"⚠️  No more results for query: '{query}'")
                break
            
            total_results = results.get("total_results", 0)
            print(f"📷 Found {total_results} total results (Page {page})")
            
            # Download each photo
            for photo in results["photos"]:
                if downloaded >= max_images:
                    break
                
                # Use the 'large' size for better quality
                image_url = photo["src"].get("large2x", photo["src"]["large"])
                photo_id = photo["id"]
                photographer = photo["photographer"].replace(" ", "_")
                
                # Create filename with category prefix
                filename = f"{category_prefix}{photo_id}_{photographer}.jpg"
                
                success, result = self.download_image(image_url, filename)
                
                if success:
                    downloaded += 1
                    if downloaded % 10 == 0:
                        print(f"✅ Downloaded: {downloaded}/{max_images}")
                
                # Rate limiting - be respectful to API
                time.sleep(0.5)
            
            page += 1
            time.sleep(1)  # Additional delay between pages
        
        self.download_stats["queries_processed"] += 1
        print(f"✅ Completed query '{query}': {downloaded} images downloaded")
        return downloaded
    
    def download_back_view_images(self, target_count: int = 300) -> int:
        """Download back view basketball images"""
        print("\n" + "="*60)
        print("📥 DOWNLOADING BACK VIEW BASKETBALL IMAGES")
        print("="*60)
        
        queries = [
            "basketball shooting back view",
            "basketball player from behind",
            "basketball back angle",
            "basketball rear view",
            "basketball player back court",
            "basketball shooting behind"
        ]
        
        images_per_query = target_count // len(queries)
        total_downloaded = 0
        
        for query in queries:
            downloaded = self.download_from_query(
                query, 
                max_images=images_per_query,
                category_prefix="back_view_"
            )
            total_downloaded += downloaded
            
            if total_downloaded >= target_count:
                break
        
        return total_downloaded
    
    def download_amateur_images(self, target_count: int = 700) -> int:
        """Download amateur/recreational basketball images"""
        print("\n" + "="*60)
        print("📥 DOWNLOADING AMATEUR/RECREATIONAL BASKETBALL IMAGES")
        print("="*60)
        
        queries = [
            "amateur basketball",
            "youth basketball",
            "recreational basketball",
            "street basketball",
            "pickup basketball",
            "beginner basketball",
            "playground basketball",
            "backyard basketball",
            "casual basketball game",
            "neighborhood basketball"
        ]
        
        images_per_query = target_count // len(queries)
        total_downloaded = 0
        
        for query in queries:
            downloaded = self.download_from_query(
                query, 
                max_images=images_per_query,
                category_prefix="amateur_"
            )
            total_downloaded += downloaded
            
            if total_downloaded >= target_count:
                break
        
        return total_downloaded
    
    def save_stats(self):
        """Save download statistics to JSON file"""
        stats_file = self.output_dir / "pexels_download_stats.json"
        stats = {
            **self.download_stats,
            "download_date": datetime.now().isoformat(),
            "output_directory": str(self.output_dir)
        }
        
        with open(stats_file, 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\n" + "="*60)
        print("📊 DOWNLOAD STATISTICS")
        print("="*60)
        print(f"✅ Total Downloaded: {stats['total_downloaded']}")
        print(f"❌ Failed Downloads: {stats['failed_downloads']}")
        print(f"🔄 Duplicates Skipped: {stats['duplicates_skipped']}")
        print(f"🔍 Queries Processed: {stats['queries_processed']}")
        print(f"💾 Stats saved to: {stats_file}")


def main():
    import sys
    
    # Configuration
    API_KEY = "1YOjyRmXxeA5s4q1d7CuxepcnFEgMEhmopApbn3MTS7zPf0vUJsrsQSu"
    OUTPUT_DIR = "/home/ubuntu/basketball_app/training_data/temp_pexels_downloads"
    
    # Parse command line arguments
    mode = sys.argv[1] if len(sys.argv) > 1 else "both"
    
    # Initialize downloader
    downloader = PexelsDownloader(API_KEY, OUTPUT_DIR)
    
    # Test API connection
    print("🔌 Testing Pexels API connection...")
    test_result = downloader.search_photos("basketball", per_page=1, page=1)
    
    if test_result.get("photos"):
        print("✅ API connection successful!")
        print(f"📊 Total basketball images available: {test_result.get('total_results', 0)}")
    else:
        print("❌ API connection failed!")
        return
    
    back_view_count = 0
    amateur_count = 0
    
    # Download based on mode
    if mode in ["back", "both"]:
        # Download back view images (target: 300)
        back_view_count = downloader.download_back_view_images(target_count=300)
        print(f"\n✅ Downloaded {back_view_count} back view images")
    
    if mode in ["amateur", "both"]:
        # Download amateur images (target: 700)
        amateur_count = downloader.download_amateur_images(target_count=700)
        print(f"\n✅ Downloaded {amateur_count} amateur/recreational images")
    
    # Save statistics
    downloader.save_stats()
    
    print("\n" + "="*60)
    print("✅ PEXELS DOWNLOAD COMPLETE!")
    print("="*60)
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print(f"📷 Total images: {back_view_count + amateur_count}")


if __name__ == "__main__":
    main()
