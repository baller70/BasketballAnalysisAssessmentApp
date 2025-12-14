#!/usr/bin/env python3
"""
Basketball Training Image Collection from 4 APIs
Collects 1,500+ basketball images focused on:
- Back view angles
- Form quality (good, needs work, poor)
- Amateur/training scenarios
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from tqdm import tqdm
from PIL import Image
import io

from api_credentials import (
    PIXABAY_API_KEY, PEXELS_API_KEY, UNSPLASH_ACCESS_KEY,
    KAGGLE_API_KEY, RATE_LIMIT_DELAY
)

# Directory structure
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
RAW_DIR = BASE_DIR / "raw_images"
METADATA_DIR = BASE_DIR / "metadata"
LOG_DIR = BASE_DIR / "logs"

# Create directories
for dir_path in [RAW_DIR, METADATA_DIR, LOG_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# API subdirectories
API_DIRS = {
    'pixabay': RAW_DIR / 'pixabay',
    'pexels': RAW_DIR / 'pexels',
    'unsplash': RAW_DIR / 'unsplash',
    'kaggle': RAW_DIR / 'kaggle'
}

for api_dir in API_DIRS.values():
    api_dir.mkdir(parents=True, exist_ok=True)


class ImageCollector:
    """Base class for image collection with rate limiting and metadata tracking"""
    
    def __init__(self, api_name: str):
        self.api_name = api_name
        self.delay = RATE_LIMIT_DELAY.get(api_name, 1)
        self.metadata = []
        self.downloaded_count = 0
        self.failed_count = 0
        self.last_request_time = 0
        
    def rate_limit_wait(self):
        """Implement rate limiting between requests"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.delay:
            wait_time = self.delay - time_since_last
            time.sleep(wait_time)
        self.last_request_time = time.time()
    
    def download_image(self, url: str, filepath: Path, metadata: dict) -> bool:
        """Download image and save metadata"""
        try:
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()
            
            # Verify it's an image
            img = Image.open(io.BytesIO(response.content))
            width, height = img.size
            
            # Only save high-resolution images (1080p+ preference)
            if width >= 1080 or height >= 1080:
                img.save(filepath, quality=95)
                
                # Save metadata
                metadata.update({
                    'downloaded_at': datetime.now().isoformat(),
                    'filepath': str(filepath),
                    'width': width,
                    'height': height,
                    'api_source': self.api_name
                })
                self.metadata.append(metadata)
                self.downloaded_count += 1
                return True
            else:
                return False
                
        except Exception as e:
            self.failed_count += 1
            print(f"❌ Failed to download {url}: {str(e)}")
            return False
    
    def save_metadata(self):
        """Save collected metadata to JSON"""
        metadata_file = METADATA_DIR / f"{self.api_name}_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump({
                'api': self.api_name,
                'total_downloaded': self.downloaded_count,
                'total_failed': self.failed_count,
                'collection_date': datetime.now().isoformat(),
                'images': self.metadata
            }, f, indent=2)
        print(f"📝 Saved metadata to {metadata_file}")


class PixabayCollector(ImageCollector):
    """Pixabay API image collector"""
    
    def __init__(self):
        super().__init__('pixabay')
        self.base_url = "https://pixabay.com/api/"
        self.api_key = PIXABAY_API_KEY
        
    def search_and_download(self, queries: List[str], per_query: int = 100):
        """Search and download images from Pixabay"""
        print(f"\n{'='*60}")
        print(f"🎨 PIXABAY API - Starting Collection")
        print(f"{'='*60}")
        
        for query in queries:
            print(f"\n🔍 Searching: {query}")
            
            # Search parameters
            params = {
                'key': self.api_key,
                'q': query,
                'image_type': 'photo',
                'per_page': 200,  # Max allowed
                'page': 1,
                'min_width': 1920,
                'min_height': 1080,
                'safesearch': 'false',
                'order': 'popular'
            }
            
            self.rate_limit_wait()
            
            try:
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                total_hits = data.get('totalHits', 0)
                hits = data.get('hits', [])
                
                print(f"   Found {total_hits} results, downloading up to {per_query}...")
                
                for i, hit in enumerate(tqdm(hits[:per_query], desc=f"   {query}")):
                    # Try to get highest quality image
                    image_url = hit.get('largeImageURL') or hit.get('webformatURL')
                    if not image_url:
                        continue
                    
                    filename = f"pixabay_{query.replace(' ', '_')}_{hit['id']}.jpg"
                    filepath = API_DIRS['pixabay'] / filename
                    
                    metadata = {
                        'id': hit['id'],
                        'query': query,
                        'url': hit.get('pageURL', ''),
                        'tags': hit.get('tags', ''),
                        'user': hit.get('user', ''),
                        'likes': hit.get('likes', 0),
                        'views': hit.get('views', 0),
                        'downloads': hit.get('downloads', 0)
                    }
                    
                    self.download_image(image_url, filepath, metadata)
                    self.rate_limit_wait()
                    
            except Exception as e:
                print(f"❌ Error searching Pixabay for '{query}': {str(e)}")
        
        print(f"\n✅ Pixabay Collection Complete:")
        print(f"   Downloaded: {self.downloaded_count}")
        print(f"   Failed: {self.failed_count}")
        self.save_metadata()


class PexelsCollector(ImageCollector):
    """Pexels API image collector"""
    
    def __init__(self):
        super().__init__('pexels')
        self.base_url = "https://api.pexels.com/v1/search"
        self.api_key = PEXELS_API_KEY
        
    def search_and_download(self, queries: List[str], per_query: int = 100):
        """Search and download images from Pexels"""
        print(f"\n{'='*60}")
        print(f"📷 PEXELS API - Starting Collection")
        print(f"{'='*60}")
        
        headers = {'Authorization': self.api_key}
        
        for query in queries:
            print(f"\n🔍 Searching: {query}")
            
            page = 1
            downloaded_for_query = 0
            
            while downloaded_for_query < per_query:
                params = {
                    'query': query,
                    'per_page': 80,  # Max allowed
                    'page': page,
                    'orientation': 'landscape',
                    'size': 'large'
                }
                
                self.rate_limit_wait()
                
                try:
                    response = requests.get(self.base_url, headers=headers, params=params, timeout=30)
                    response.raise_for_status()
                    data = response.json()
                    
                    photos = data.get('photos', [])
                    if not photos:
                        break
                    
                    print(f"   Page {page}: {len(photos)} photos")
                    
                    for photo in tqdm(photos, desc=f"   {query} (page {page})"):
                        if downloaded_for_query >= per_query:
                            break
                        
                        # Get original size
                        image_url = photo['src'].get('original') or photo['src'].get('large2x')
                        
                        filename = f"pexels_{query.replace(' ', '_')}_{photo['id']}.jpg"
                        filepath = API_DIRS['pexels'] / filename
                        
                        metadata = {
                            'id': photo['id'],
                            'query': query,
                            'url': photo.get('url', ''),
                            'photographer': photo.get('photographer', ''),
                            'photographer_url': photo.get('photographer_url', ''),
                            'alt': photo.get('alt', '')
                        }
                        
                        if self.download_image(image_url, filepath, metadata):
                            downloaded_for_query += 1
                        
                        self.rate_limit_wait()
                    
                    page += 1
                    
                except Exception as e:
                    print(f"❌ Error searching Pexels for '{query}': {str(e)}")
                    break
        
        print(f"\n✅ Pexels Collection Complete:")
        print(f"   Downloaded: {self.downloaded_count}")
        print(f"   Failed: {self.failed_count}")
        self.save_metadata()


class UnsplashCollector(ImageCollector):
    """Unsplash API image collector"""
    
    def __init__(self):
        super().__init__('unsplash')
        self.base_url = "https://api.unsplash.com/search/photos"
        self.api_key = UNSPLASH_ACCESS_KEY
        
    def search_and_download(self, queries: List[str], per_query: int = 100):
        """Search and download images from Unsplash"""
        print(f"\n{'='*60}")
        print(f"🌅 UNSPLASH API - Starting Collection")
        print(f"{'='*60}")
        
        headers = {'Authorization': f'Client-ID {self.api_key}'}
        
        for query in queries:
            print(f"\n🔍 Searching: {query}")
            
            page = 1
            downloaded_for_query = 0
            
            while downloaded_for_query < per_query:
                params = {
                    'query': query,
                    'per_page': 30,  # Max allowed for free tier
                    'page': page,
                    'orientation': 'landscape'
                }
                
                self.rate_limit_wait()
                
                try:
                    response = requests.get(self.base_url, headers=headers, params=params, timeout=30)
                    response.raise_for_status()
                    data = response.json()
                    
                    results = data.get('results', [])
                    if not results:
                        break
                    
                    print(f"   Page {page}: {len(results)} photos")
                    
                    for photo in tqdm(results, desc=f"   {query} (page {page})"):
                        if downloaded_for_query >= per_query:
                            break
                        
                        # Get highest quality
                        image_url = photo['urls'].get('raw') or photo['urls'].get('full')
                        
                        filename = f"unsplash_{query.replace(' ', '_')}_{photo['id']}.jpg"
                        filepath = API_DIRS['unsplash'] / filename
                        
                        metadata = {
                            'id': photo['id'],
                            'query': query,
                            'url': photo['links'].get('html', ''),
                            'description': photo.get('description', ''),
                            'alt_description': photo.get('alt_description', ''),
                            'user': photo['user'].get('name', ''),
                            'user_portfolio': photo['user'].get('portfolio_url', ''),
                            'likes': photo.get('likes', 0)
                        }
                        
                        if self.download_image(image_url, filepath, metadata):
                            downloaded_for_query += 1
                        
                        self.rate_limit_wait()
                    
                    page += 1
                    
                except Exception as e:
                    print(f"❌ Error searching Unsplash for '{query}': {str(e)}")
                    break
        
        print(f"\n✅ Unsplash Collection Complete:")
        print(f"   Downloaded: {self.downloaded_count}")
        print(f"   Failed: {self.failed_count}")
        self.save_metadata()


class KaggleCollector(ImageCollector):
    """Kaggle dataset collector"""
    
    def __init__(self):
        super().__init__('kaggle')
        self.setup_kaggle_auth()
        
    def setup_kaggle_auth(self):
        """Setup Kaggle API authentication"""
        kaggle_dir = Path.home() / '.kaggle'
        kaggle_dir.mkdir(exist_ok=True)
        
        kaggle_json = kaggle_dir / 'kaggle.json'
        with open(kaggle_json, 'w') as f:
            json.dump({
                'username': 'user',  # Will use API token
                'key': KAGGLE_API_KEY
            }, f)
        
        os.chmod(kaggle_json, 0o600)
    
    def search_and_download(self, dataset_keywords: List[str], limit: int = 300):
        """Search and download from Kaggle datasets"""
        print(f"\n{'='*60}")
        print(f"🏀 KAGGLE API - Starting Collection")
        print(f"{'='*60}")
        
        try:
            from kaggle.api.kaggle_api_extended import KaggleApi
            api = KaggleApi()
            api.authenticate()
            
            for keyword in dataset_keywords:
                print(f"\n🔍 Searching datasets: {keyword}")
                
                try:
                    # Search for datasets
                    datasets = api.dataset_list(search=keyword)
                    
                    print(f"   Found {len(datasets)} datasets")
                    
                    for dataset in datasets[:5]:  # Top 5 datasets per keyword
                        print(f"\n   📦 Dataset: {dataset.ref}")
                        
                        try:
                            # Download dataset
                            download_path = API_DIRS['kaggle'] / dataset.ref.replace('/', '_')
                            download_path.mkdir(exist_ok=True)
                            
                            api.dataset_download_files(
                                dataset.ref,
                                path=str(download_path),
                                unzip=True
                            )
                            
                            # Extract images from downloaded files
                            self._extract_images_from_dataset(download_path, keyword)
                            
                            if self.downloaded_count >= limit:
                                break
                            
                        except Exception as e:
                            print(f"   ❌ Failed to download {dataset.ref}: {str(e)}")
                    
                    if self.downloaded_count >= limit:
                        break
                        
                except Exception as e:
                    print(f"❌ Error searching Kaggle for '{keyword}': {str(e)}")
            
        except ImportError:
            print("❌ Kaggle package not installed. Install with: pip install kaggle")
        
        print(f"\n✅ Kaggle Collection Complete:")
        print(f"   Downloaded: {self.downloaded_count}")
        print(f"   Failed: {self.failed_count}")
        self.save_metadata()
    
    def _extract_images_from_dataset(self, dataset_path: Path, keyword: str):
        """Extract and copy images from downloaded dataset"""
        image_extensions = {'.jpg', '.jpeg', '.png'}
        
        for img_path in dataset_path.rglob('*'):
            if img_path.suffix.lower() in image_extensions:
                try:
                    img = Image.open(img_path)
                    width, height = img.size
                    
                    if width >= 640 and height >= 480:  # Minimum size for Kaggle
                        new_filename = f"kaggle_{keyword.replace(' ', '_')}_{img_path.stem}{img_path.suffix}"
                        new_path = API_DIRS['kaggle'] / new_filename
                        
                        img.save(new_path, quality=95)
                        
                        metadata = {
                            'query': keyword,
                            'original_path': str(img_path),
                            'width': width,
                            'height': height
                        }
                        
                        metadata.update({
                            'downloaded_at': datetime.now().isoformat(),
                            'filepath': str(new_path),
                            'api_source': 'kaggle'
                        })
                        
                        self.metadata.append(metadata)
                        self.downloaded_count += 1
                        
                except Exception as e:
                    self.failed_count += 1


# Search queries optimized for basketball training scenarios
SEARCH_QUERIES = {
    'pixabay': [
        'basketball shooting back view',
        'basketball from behind',
        'amateur basketball',
        'youth basketball shooting',
        'street basketball',
        'recreational basketball'
    ],
    'pexels': [
        'basketball back angle',
        'basketball player behind',
        'pickup basketball',
        'beginner basketball shooting',
        'basketball training session',
        'basketball practice'
    ],
    'unsplash': [
        'basketball rear view',
        'basketball training',
        'college basketball',
        'casual basketball',
        'basketball workout',
        'basketball form'
    ],
    'kaggle': [
        'basketball dataset',
        'basketball training',
        'basketball players'
    ]
}


def main():
    """Main collection orchestrator"""
    start_time = datetime.now()
    
    print("="*80)
    print("🏀 BASKETBALL TRAINING IMAGE COLLECTION")
    print("="*80)
    print(f"Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTarget: 1,500+ images from 4 APIs")
    print(f"Focus: Back view angles, form quality variation")
    print("="*80)
    
    # Collection configuration
    targets = {
        'pixabay': 400,
        'pexels': 400,
        'unsplash': 400,
        'kaggle': 300
    }
    
    collectors_results = {}
    
    # 1. Pixabay Collection
    try:
        pixabay = PixabayCollector()
        per_query = targets['pixabay'] // len(SEARCH_QUERIES['pixabay'])
        pixabay.search_and_download(SEARCH_QUERIES['pixabay'], per_query)
        collectors_results['pixabay'] = pixabay.downloaded_count
    except Exception as e:
        print(f"❌ Pixabay collection failed: {str(e)}")
        collectors_results['pixabay'] = 0
    
    # 2. Pexels Collection
    try:
        pexels = PexelsCollector()
        per_query = targets['pexels'] // len(SEARCH_QUERIES['pexels'])
        pexels.search_and_download(SEARCH_QUERIES['pexels'], per_query)
        collectors_results['pexels'] = pexels.downloaded_count
    except Exception as e:
        print(f"❌ Pexels collection failed: {str(e)}")
        collectors_results['pexels'] = 0
    
    # 3. Unsplash Collection
    try:
        unsplash = UnsplashCollector()
        per_query = targets['unsplash'] // len(SEARCH_QUERIES['unsplash'])
        unsplash.search_and_download(SEARCH_QUERIES['unsplash'], per_query)
        collectors_results['unsplash'] = unsplash.downloaded_count
    except Exception as e:
        print(f"❌ Unsplash collection failed: {str(e)}")
        collectors_results['unsplash'] = 0
    
    # 4. Kaggle Collection
    try:
        kaggle = KaggleCollector()
        kaggle.search_and_download(SEARCH_QUERIES['kaggle'], targets['kaggle'])
        collectors_results['kaggle'] = kaggle.downloaded_count
    except Exception as e:
        print(f"❌ Kaggle collection failed: {str(e)}")
        collectors_results['kaggle'] = 0
    
    # Final Summary
    end_time = datetime.now()
    duration = end_time - start_time
    total_downloaded = sum(collectors_results.values())
    
    print("\n" + "="*80)
    print("🎉 COLLECTION COMPLETE")
    print("="*80)
    print(f"End Time: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Duration: {duration}")
    print(f"\n📊 Results by API:")
    for api, count in collectors_results.items():
        target = targets.get(api, 0)
        percentage = (count / target * 100) if target > 0 else 0
        print(f"   {api.capitalize():12} {count:4} / {target:4} ({percentage:.1f}%)")
    
    print(f"\n✅ Total Images Downloaded: {total_downloaded}")
    print(f"🎯 Target Achievement: {(total_downloaded / 1500 * 100):.1f}%")
    
    # Save summary report
    summary_file = LOG_DIR / f"collection_summary_{start_time.strftime('%Y%m%d_%H%M%S')}.json"
    with open(summary_file, 'w') as f:
        json.dump({
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': duration.total_seconds(),
            'results': collectors_results,
            'total_downloaded': total_downloaded,
            'target': 1500,
            'achievement_percentage': (total_downloaded / 1500 * 100)
        }, f, indent=2)
    
    print(f"\n📝 Summary saved to: {summary_file}")
    print("="*80)


if __name__ == "__main__":
    main()
