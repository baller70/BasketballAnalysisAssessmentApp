#!/usr/bin/env python3
"""
Fast Parallel Basketball Image Collector
Uses concurrent downloads with threading to speed up collection
"""

import os
import time
import json
import requests
from pathlib import Path
from datetime import datetime
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from tqdm import tqdm
from PIL import Image
import io

from api_credentials import (
    PIXABAY_API_KEY, PEXELS_API_KEY, UNSPLASH_ACCESS_KEY
)

BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
RAW_DIR = BASE_DIR / "raw_images"
METADATA_DIR = BASE_DIR / "metadata"

# Increase limits for parallel downloads
PARALLEL_DOWNLOADS = 10  # Concurrent downloads
BATCH_SIZE = 50  # Images per batch

# API configurations
APIS = {
    'pixabay': {
        'url': 'https://pixabay.com/api/',
        'key': PIXABAY_API_KEY,
        'per_page': 200,
        'target': 400
    },
    'pexels': {
        'url': 'https://api.pexels.com/v1/search',
        'key': PEXELS_API_KEY,
        'per_page': 80,
        'target': 400
    },
    'unsplash': {
        'url': 'https://api.unsplash.com/search/photos',
        'key': UNSPLASH_ACCESS_KEY,
        'per_page': 30,
        'target': 400
    }
}

# Search queries
QUERIES = {
    'pixabay': [
        'basketball shooting back view',
        'basketball from behind',
        'amateur basketball player',
        'youth basketball training',
        'street basketball game',
        'recreational basketball'
    ],
    'pexels': [
        'basketball back angle',
        'basketball player behind',
        'pickup basketball game',
        'beginner basketball shooting',
        'basketball training',
        'basketball practice court'
    ],
    'unsplash': [
        'basketball rear view',
        'basketball training session',
        'college basketball player',
        'casual basketball',
        'basketball workout',
        'basketball shooting form'
    ]
}


class FastCollector:
    def __init__(self, api_name: str):
        self.api_name = api_name
        self.config = APIS[api_name]
        self.output_dir = RAW_DIR / api_name
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.metadata = []
        self.downloaded_count = 0
        self.failed_count = 0
        self.lock = Lock()
        
    def get_search_results(self, query: str) -> List[Dict]:
        """Fetch search results from API"""
        results = []
        
        if self.api_name == 'pixabay':
            params = {
                'key': self.config['key'],
                'q': query,
                'image_type': 'photo',
                'per_page': self.config['per_page'],
                'min_width': 1280,
                'min_height': 720,
                'safesearch': 'false',
                'order': 'popular'
            }
            
            try:
                response = requests.get(self.config['url'], params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                for hit in data.get('hits', []):
                    results.append({
                        'id': hit['id'],
                        'url': hit.get('largeImageURL') or hit.get('webformatURL'),
                        'query': query,
                        'metadata': {
                            'tags': hit.get('tags', ''),
                            'user': hit.get('user', ''),
                            'likes': hit.get('likes', 0),
                            'views': hit.get('views', 0)
                        }
                    })
            except Exception as e:
                print(f"❌ Pixabay search error for '{query}': {str(e)}")
        
        elif self.api_name == 'pexels':
            headers = {'Authorization': self.config['key']}
            params = {
                'query': query,
                'per_page': self.config['per_page'],
                'orientation': 'landscape',
                'size': 'large'
            }
            
            try:
                response = requests.get(self.config['url'], headers=headers, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                for photo in data.get('photos', []):
                    results.append({
                        'id': photo['id'],
                        'url': photo['src'].get('original') or photo['src'].get('large2x'),
                        'query': query,
                        'metadata': {
                            'photographer': photo.get('photographer', ''),
                            'alt': photo.get('alt', '')
                        }
                    })
            except Exception as e:
                print(f"❌ Pexels search error for '{query}': {str(e)}")
        
        elif self.api_name == 'unsplash':
            headers = {'Authorization': f'Client-ID {self.config["key"]}'}
            params = {
                'query': query,
                'per_page': self.config['per_page'],
                'orientation': 'landscape'
            }
            
            try:
                response = requests.get(self.config['url'], headers=headers, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                for photo in data.get('results', []):
                    results.append({
                        'id': photo['id'],
                        'url': photo['urls'].get('raw') or photo['urls'].get('full'),
                        'query': query,
                        'metadata': {
                            'description': photo.get('description', ''),
                            'user': photo['user'].get('name', ''),
                            'likes': photo.get('likes', 0)
                        }
                    })
            except Exception as e:
                print(f"❌ Unsplash search error for '{query}': {str(e)}")
        
        return results
    
    def download_image(self, item: Dict) -> bool:
        """Download single image"""
        try:
            response = requests.get(item['url'], timeout=30, stream=True)
            response.raise_for_status()
            
            img = Image.open(io.BytesIO(response.content))
            width, height = img.size
            
            # Quality filter
            if width >= 1080 or height >= 1080:
                filename = f"{self.api_name}_{item['query'].replace(' ', '_')}_{item['id']}.jpg"
                filepath = self.output_dir / filename
                
                img.save(filepath, quality=95)
                
                with self.lock:
                    self.metadata.append({
                        'id': item['id'],
                        'filepath': str(filepath),
                        'query': item['query'],
                        'width': width,
                        'height': height,
                        'downloaded_at': datetime.now().isoformat(),
                        **item['metadata']
                    })
                    self.downloaded_count += 1
                
                return True
            
            return False
            
        except Exception as e:
            with self.lock:
                self.failed_count += 1
            return False
    
    def collect(self):
        """Main collection method with parallel downloads"""
        print(f"\n{'='*60}")
        print(f"🚀 {self.api_name.upper()} - Fast Parallel Collection")
        print(f"{'='*60}")
        
        all_items = []
        queries = QUERIES.get(self.api_name, [])
        
        # Gather all search results first
        print(f"🔍 Gathering search results from {len(queries)} queries...")
        for query in queries:
            items = self.get_search_results(query)
            all_items.extend(items)
            print(f"   {query}: {len(items)} images found")
            time.sleep(1)  # Small delay between searches
        
        print(f"\n📥 Total images to download: {len(all_items)}")
        
        # Limit to target
        target = self.config['target']
        all_items = all_items[:target]
        
        # Parallel download
        print(f"⚡ Downloading {len(all_items)} images with {PARALLEL_DOWNLOADS} parallel workers...")
        
        with ThreadPoolExecutor(max_workers=PARALLEL_DOWNLOADS) as executor:
            futures = [executor.submit(self.download_image, item) for item in all_items]
            
            for future in tqdm(as_completed(futures), total=len(futures), desc="Downloading"):
                future.result()
        
        print(f"\n✅ {self.api_name.upper()} Complete:")
        print(f"   Downloaded: {self.downloaded_count}")
        print(f"   Failed: {self.failed_count}")
        print(f"   Success Rate: {(self.downloaded_count/(self.downloaded_count+self.failed_count)*100):.1f}%")
        
        # Save metadata
        metadata_file = METADATA_DIR / f"{self.api_name}_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump({
                'api': self.api_name,
                'total_downloaded': self.downloaded_count,
                'total_failed': self.failed_count,
                'collection_date': datetime.now().isoformat(),
                'images': self.metadata
            }, f, indent=2)


def main():
    start_time = datetime.now()
    
    print("="*80)
    print("🚀 FAST PARALLEL BASKETBALL IMAGE COLLECTION")
    print("="*80)
    print(f"Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Parallel Downloads: {PARALLEL_DOWNLOADS} workers")
    print("="*80)
    
    results = {}
    
    for api_name in ['pixabay', 'pexels', 'unsplash']:
        try:
            collector = FastCollector(api_name)
            collector.collect()
            results[api_name] = collector.downloaded_count
        except Exception as e:
            print(f"❌ {api_name} collection failed: {str(e)}")
            results[api_name] = 0
    
    end_time = datetime.now()
    duration = end_time - start_time
    total = sum(results.values())
    
    print("\n" + "="*80)
    print("🎉 FAST COLLECTION COMPLETE")
    print("="*80)
    print(f"Duration: {duration}")
    print(f"Total Downloaded: {total} images")
    print(f"\nBreakdown:")
    for api, count in results.items():
        print(f"  {api.capitalize():12} {count:4} images")
    print("="*80)


if __name__ == "__main__":
    main()
