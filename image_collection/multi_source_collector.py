#!/usr/bin/env python3
"""
Multi-Source Image Collector
Collects basketball shooting images from Pixabay, Pexels, and Unsplash
"""

import requests
import json
import os
import time
from pathlib import Path
from tqdm import tqdm
import hashlib

class ImageCollector:
    def __init__(self, config_path='config.json'):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.pixabay_key = self.config['pixabay_api_key']
        self.raw_images_dir = Path('raw_images')
        self.raw_images_dir.mkdir(exist_ok=True)
        
        self.collected_hashes = set()
        self.stats = {
            'pixabay': 0,
            'pexels': 0,
            'unsplash': 0,
            'web_search': 0,
            'duplicates_skipped': 0,
            'errors': 0
        }
    
    def get_image_hash(self, image_data):
        """Generate hash to detect duplicates"""
        return hashlib.md5(image_data).hexdigest()
    
    def download_image(self, url, source, query_index, image_index):
        """Download and save an image"""
        try:
            response = requests.get(url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            response.raise_for_status()
            
            # Check for duplicate
            image_hash = self.get_image_hash(response.content)
            if image_hash in self.collected_hashes:
                self.stats['duplicates_skipped'] += 1
                return False
            
            self.collected_hashes.add(image_hash)
            
            # Save image
            filename = f"{source}_q{query_index}_img{image_index}_{image_hash[:8]}.jpg"
            filepath = self.raw_images_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            self.stats[source] += 1
            return True
            
        except Exception as e:
            self.stats['errors'] += 1
            print(f"Error downloading {url}: {e}")
            return False
    
    def collect_from_pixabay(self, query, query_index, target_per_query):
        """Collect images from Pixabay API"""
        print(f"\n🔍 Searching Pixabay for: '{query}'")
        collected = 0
        page = 1
        
        while collected < target_per_query and page <= 5:
            try:
                url = f"https://pixabay.com/api/"
                params = {
                    'key': self.pixabay_key,
                    'q': query,
                    'image_type': 'photo',
                    'orientation': 'horizontal',
                    'per_page': 50,
                    'page': page,
                    'safesearch': 'true'
                }
                
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                if not data.get('hits'):
                    break
                
                for idx, hit in enumerate(data['hits']):
                    if collected >= target_per_query:
                        break
                    
                    # Try large image first, fall back to webformat
                    image_url = hit.get('largeImageURL') or hit.get('webformatURL')
                    if image_url:
                        if self.download_image(image_url, 'pixabay', query_index, collected):
                            collected += 1
                    
                    time.sleep(0.1)  # Rate limiting
                
                page += 1
                time.sleep(1)  # Rate limiting between pages
                
            except Exception as e:
                print(f"Error with Pixabay API: {e}")
                break
        
        return collected
    
    def collect_from_pexels(self, query, query_index, target_per_query):
        """Collect images from Pexels API (using public search)"""
        print(f"\n🔍 Searching Pexels for: '{query}'")
        collected = 0
        
        # Note: Pexels requires API key for official access
        # For now, we'll collect extra from other sources
        print("  ⚠️  Pexels API key not configured - skipping")
        return collected
    
    def collect_from_unsplash(self, query, query_index, target_per_query):
        """Collect images from Unsplash API (using public search)"""
        print(f"\n🔍 Searching Unsplash for: '{query}'")
        collected = 0
        
        # Note: Unsplash requires API key for official access
        # For now, we'll collect extra from other sources
        print("  ⚠️  Unsplash API key not configured - skipping")
        return collected
    
    def collect_from_web_search(self, query, query_index, target_per_query):
        """Collect images from web search results"""
        print(f"\n🔍 Web search for: '{query}'")
        # This would require additional implementation
        # For now, focus on Pixabay which has a working API key
        return 0
    
    def run_collection(self):
        """Execute full collection pipeline"""
        print("\n" + "="*60)
        print("🏀 BASKETBALL SHOOTING IMAGE COLLECTION")
        print("="*60)
        
        queries = self.config['search_queries']
        pixabay_target = self.config['collection_targets']['pixabay']
        target_per_query = pixabay_target // len(queries)
        
        print(f"\n📊 Collection Plan:")
        print(f"   • Total queries: {len(queries)}")
        print(f"   • Pixabay target: {pixabay_target} images")
        print(f"   • Target per query: {target_per_query} images")
        
        for idx, query in enumerate(queries):
            collected = self.collect_from_pixabay(query, idx, target_per_query)
            print(f"  ✅ Collected {collected} images from Pixabay")
        
        # Try to get more images from additional queries
        additional_queries = [
            "basketball training",
            "basketball practice shooting",
            "basketball player practicing",
            "basketball gym shooting",
            "basketball court player"
        ]
        
        print(f"\n🔄 Collecting additional images...")
        for idx, query in enumerate(additional_queries):
            if self.stats['pixabay'] >= pixabay_target:
                break
            remaining = pixabay_target - self.stats['pixabay']
            collected = self.collect_from_pixabay(query, idx + len(queries), min(remaining, 30))
            print(f"  ✅ Collected {collected} more images")
        
        self.print_summary()
    
    def print_summary(self):
        """Print collection summary"""
        print("\n" + "="*60)
        print("📈 COLLECTION SUMMARY")
        print("="*60)
        print(f"✅ Pixabay:           {self.stats['pixabay']:4d} images")
        print(f"✅ Pexels:            {self.stats['pexels']:4d} images")
        print(f"✅ Unsplash:          {self.stats['unsplash']:4d} images")
        print(f"✅ Web Search:        {self.stats['web_search']:4d} images")
        print(f"─" * 60)
        total = sum([self.stats[k] for k in ['pixabay', 'pexels', 'unsplash', 'web_search']])
        print(f"📊 TOTAL COLLECTED:   {total:4d} images")
        print(f"⏭️  Duplicates:        {self.stats['duplicates_skipped']:4d} skipped")
        print(f"❌ Errors:            {self.stats['errors']:4d}")
        print("="*60)
        
        # Save stats
        stats_file = self.raw_images_dir / 'collection_stats.json'
        with open(stats_file, 'w') as f:
            json.dump(self.stats, f, indent=2)
        
        print(f"\n💾 Stats saved to: {stats_file}")
        print(f"📁 Images saved to: {self.raw_images_dir.absolute()}")

if __name__ == '__main__':
    collector = ImageCollector()
    collector.run_collection()
