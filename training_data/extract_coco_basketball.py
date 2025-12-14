#!/usr/bin/env python3
"""
Extract basketball/sports ball images from COCO dataset
"""

import json
import os
import shutil
from pathlib import Path
from collections import defaultdict

# Paths
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
COCO_DIR = BASE_DIR / "temp_downloads/coco"
ANNOTATIONS_FILE = COCO_DIR / "annotations/instances_train2017.json"

def extract_sports_ball_images():
    """Extract images containing sports balls from COCO"""
    print("\n🔍 Analyzing COCO annotations for sports balls...")
    
    if not ANNOTATIONS_FILE.exists():
        print(f"⚠️ Annotations file not found: {ANNOTATIONS_FILE}")
        return []
    
    # Load annotations
    with open(ANNOTATIONS_FILE, 'r') as f:
        coco_data = json.load(f)
    
    # Find sports ball category ID
    sports_ball_id = None
    basketball_keywords = ['ball', 'sports', 'basketball']
    
    print("\n📋 COCO Categories:")
    for cat in coco_data['categories']:
        print(f"  - {cat['name']} (ID: {cat['id']})")
        if cat['name'] == 'sports ball':
            sports_ball_id = cat['id']
    
    if sports_ball_id is None:
        print("⚠️ Sports ball category not found in COCO")
        return []
    
    print(f"\n✓ Found 'sports ball' category (ID: {sports_ball_id})")
    
    # Find all images with sports balls
    images_with_balls = set()
    ball_annotations = []
    
    for ann in coco_data['annotations']:
        if ann['category_id'] == sports_ball_id:
            images_with_balls.add(ann['image_id'])
            ball_annotations.append(ann)
    
    print(f"✓ Found {len(images_with_balls)} images with sports balls")
    print(f"✓ Total {len(ball_annotations)} sports ball instances")
    
    # Map image IDs to filenames
    image_mapping = {}
    for img in coco_data['images']:
        if img['id'] in images_with_balls:
            image_mapping[img['id']] = img['file_name']
    
    print(f"\n📊 Image Statistics:")
    print(f"  - Total images in COCO train2017: {len(coco_data['images'])}")
    print(f"  - Images with sports balls: {len(image_mapping)}")
    
    # Save the list of images to download
    images_to_download = list(image_mapping.values())
    
    output_file = BASE_DIR / "coco_sports_ball_images.txt"
    with open(output_file, 'w') as f:
        for img_name in images_to_download:
            f.write(f"{img_name}\n")
    
    print(f"\n✓ Saved list to: {output_file}")
    print(f"  Total: {len(images_to_download)} images")
    
    # Save detailed annotation info
    ball_info = {
        'category_id': sports_ball_id,
        'total_images': len(images_with_balls),
        'total_annotations': len(ball_annotations),
        'images': [
            {
                'image_id': img_id,
                'file_name': image_mapping[img_id]
            }
            for img_id in images_with_balls
        ]
    }
    
    with open(BASE_DIR / "coco_sports_ball_info.json", 'w') as f:
        json.dump(ball_info, f, indent=2)
    
    return images_to_download

def main():
    print("🏀 COCO Basketball Image Extractor")
    print("=" * 60)
    
    images = extract_sports_ball_images()
    
    if images:
        print(f"\n✅ Extraction complete!")
        print(f"\nTo download these images:")
        print(f"  1. Download from: http://images.cocodataset.org/zips/train2017.zip")
        print(f"  2. Extract and filter using coco_sports_ball_images.txt")
        print(f"  3. Note: This is a 19GB download for all train2017 images")
        print(f"\nAlternative: Use COCO API to download only required images")
    else:
        print("\n⚠️ No images extracted. Check COCO annotations.")

if __name__ == "__main__":
    main()
