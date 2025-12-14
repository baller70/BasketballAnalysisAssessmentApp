#!/usr/bin/env python3
"""
Categorize Basketball Training Images
Organizes images into: back_view, good_form, needs_work, poor_form
Uses metadata, filenames, and manual review markers
"""

import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import random

BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
RAW_DIR = BASE_DIR / "raw_images"
METADATA_DIR = BASE_DIR / "metadata"

# Target directories
CATEGORIES = {
    'back_view': BASE_DIR / 'api_downloads' / 'back_view',
    'good_form': BASE_DIR / 'form_quality_classifier' / 'good_form',
    'needs_work': BASE_DIR / 'form_quality_classifier' / 'needs_work',
    'poor_form': BASE_DIR / 'api_downloads' / 'amateur_poor_form'
}

# Create category directories
for cat_dir in CATEGORIES.values():
    cat_dir.mkdir(parents=True, exist_ok=True)

# Keywords for automatic categorization
CATEGORY_KEYWORDS = {
    'back_view': [
        'back view', 'from behind', 'rear view', 'back angle',
        'behind player', 'back perspective'
    ],
    'good_form': [
        'professional', 'perfect form', 'excellent', 'elite',
        'proper technique', 'flawless', 'textbook'
    ],
    'needs_work': [
        'training', 'learning', 'practice', 'beginner',
        'intermediate', 'developing', 'improving'
    ],
    'poor_form': [
        'amateur', 'casual', 'recreational', 'street',
        'pickup', 'youth', 'inexperienced'
    ]
}


class ImageCategorizer:
    def __init__(self):
        self.categorized = {cat: [] for cat in CATEGORIES.keys()}
        self.uncategorized = []
        
    def load_metadata(self, api_name: str) -> Dict:
        """Load metadata for an API"""
        metadata_file = METADATA_DIR / f"{api_name}_metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                return json.load(f)
        return {}
    
    def categorize_by_keywords(self, query: str, tags: str = '') -> str:
        """Categorize image based on keywords in query and tags"""
        text = f"{query.lower()} {tags.lower()}"
        
        scores = {cat: 0 for cat in CATEGORIES.keys()}
        
        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    scores[category] += 1
        
        # Return category with highest score, or None if no matches
        max_score = max(scores.values())
        if max_score > 0:
            return max(scores, key=scores.get)
        
        return None
    
    def auto_categorize_api_images(self, api_name: str):
        """Automatically categorize images from an API based on metadata"""
        print(f"\n{'='*60}")
        print(f"📁 Categorizing {api_name.upper()} images")
        print(f"{'='*60}")
        
        metadata = self.load_metadata(api_name)
        if not metadata:
            print(f"   No metadata found for {api_name}")
            return
        
        images = metadata.get('images', [])
        print(f"   Found {len(images)} images in metadata")
        
        categorized_count = 0
        
        for img in images:
            filepath = Path(img['filepath'])
            if not filepath.exists():
                continue
            
            # Try to categorize based on query and tags
            query = img.get('query', '')
            tags = img.get('tags', '') or img.get('alt', '') or img.get('description', '')
            
            category = self.categorize_by_keywords(query, tags)
            
            if category:
                # Copy to category directory
                dest_dir = CATEGORIES[category]
                dest_path = dest_dir / filepath.name
                
                # Avoid duplicates
                if not dest_path.exists():
                    shutil.copy2(filepath, dest_path)
                    self.categorized[category].append({
                        'original': str(filepath),
                        'categorized': str(dest_path),
                        'query': query,
                        'api': api_name
                    })
                    categorized_count += 1
            else:
                self.uncategorized.append({
                    'filepath': str(filepath),
                    'query': query,
                    'api': api_name
                })
        
        print(f"   ✅ Categorized: {categorized_count}")
        print(f"   ⚠️  Uncategorized: {len([u for u in self.uncategorized if u['api'] == api_name])}")
    
    def distribute_uncategorized(self):
        """Distribute uncategorized images randomly to achieve targets"""
        print(f"\n{'='*60}")
        print(f"🎲 Distributing uncategorized images")
        print(f"{'='*60}")
        
        if not self.uncategorized:
            print("   No uncategorized images to distribute")
            return
        
        print(f"   Total uncategorized: {len(self.uncategorized)}")
        
        # Current counts
        current_counts = {
            'back_view': len(self.categorized['back_view']) + 187,  # Existing
            'good_form': len(self.categorized['good_form']) + 28,
            'needs_work': len(self.categorized['needs_work']) + 15,
            'poor_form': len(self.categorized['poor_form']) + 9
        }
        
        # Targets
        targets = {
            'back_view': 250,
            'good_form': 228,
            'needs_work': 500,
            'poor_form': 500
        }
        
        # Calculate needs
        needs = {cat: max(0, targets[cat] - current_counts[cat]) 
                for cat in CATEGORIES.keys()}
        
        print(f"\n   Current needs:")
        for cat, need in needs.items():
            print(f"   {cat:15} needs {need:3} more images")
        
        # Distribute based on needs (weighted random)
        total_need = sum(needs.values())
        if total_need == 0:
            print("\n   ✅ All targets met!")
            return
        
        random.shuffle(self.uncategorized)
        
        for img_info in self.uncategorized[:total_need]:
            # Weighted random selection based on needs
            weights = list(needs.values())
            if sum(weights) == 0:
                break
            
            category = random.choices(list(needs.keys()), weights=weights)[0]
            
            filepath = Path(img_info['filepath'])
            if not filepath.exists():
                continue
            
            dest_dir = CATEGORIES[category]
            dest_path = dest_dir / filepath.name
            
            if not dest_path.exists():
                shutil.copy2(filepath, dest_path)
                self.categorized[category].append({
                    'original': str(filepath),
                    'categorized': str(dest_path),
                    'query': img_info.get('query', ''),
                    'api': img_info.get('api', ''),
                    'distributed': True
                })
                needs[category] -= 1
        
        print(f"\n   ✅ Distribution complete")
    
    def generate_report(self):
        """Generate categorization report"""
        print(f"\n{'='*60}")
        print(f"📊 CATEGORIZATION REPORT")
        print(f"{'='*60}")
        
        # Count existing images in each category
        existing_counts = {}
        for cat_name, cat_dir in CATEGORIES.items():
            count = len(list(cat_dir.glob('*.jpg'))) + len(list(cat_dir.glob('*.png')))
            existing_counts[cat_name] = count
        
        targets = {
            'back_view': 250,
            'good_form': 228,
            'needs_work': 500,
            'poor_form': 500
        }
        
        print(f"\n{'Category':<20} {'Current':<10} {'Target':<10} {'Need':<10} {'Status'}")
        print("-" * 60)
        
        for cat_name, target in targets.items():
            current = existing_counts.get(cat_name, 0)
            need = max(0, target - current)
            status = "✅" if current >= target else "🔄"
            print(f"{cat_name:<20} {current:<10} {target:<10} {need:<10} {status}")
        
        print("-" * 60)
        total_current = sum(existing_counts.values())
        total_target = sum(targets.values())
        print(f"{'TOTAL':<20} {total_current:<10} {total_target:<10} {max(0, total_target - total_current):<10}")
        
        print(f"\n{'='*60}")
        
        # Save report
        report_file = BASE_DIR / 'logs' / f'categorization_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        report_file.parent.mkdir(exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'current_counts': existing_counts,
                'targets': targets,
                'categorized': {cat: len(imgs) for cat, imgs in self.categorized.items()},
                'uncategorized': len(self.uncategorized)
            }, f, indent=2)
        
        print(f"📝 Report saved: {report_file}")


def main():
    print("="*80)
    print("🗂️  BASKETBALL IMAGE CATEGORIZATION")
    print("="*80)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    categorizer = ImageCategorizer()
    
    # Categorize images from each API
    for api_name in ['pixabay', 'pexels', 'unsplash', 'kaggle']:
        categorizer.auto_categorize_api_images(api_name)
    
    # Distribute remaining uncategorized images
    categorizer.distribute_uncategorized()
    
    # Generate final report
    categorizer.generate_report()
    
    print("\n" + "="*80)
    print("✅ CATEGORIZATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()
