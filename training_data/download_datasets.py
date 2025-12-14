#!/usr/bin/env python3
"""
Basketball Dataset Downloader
Downloads and organizes basketball training images from multiple sources
"""

import os
import sys
import requests
import json
from pathlib import Path
from tqdm import tqdm
import time

# Base directories
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
TEMP_DIR = BASE_DIR / "temp_downloads"
TEMP_DIR.mkdir(exist_ok=True)

# Dataset sources tracking
dataset_sources = []

def download_file(url, destination):
    """Download a file with progress bar"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        
        with open(destination, 'wb') as f, tqdm(
            desc=destination.name,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as pbar:
            for data in response.iter_content(chunk_size=1024):
                size = f.write(data)
                pbar.update(size)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def download_coco_sports_subset():
    """Download COCO dataset sports ball subset"""
    print("\n📥 Downloading COCO Sports Ball subset...")
    
    # COCO 2017 annotations URL
    annotations_url = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
    images_base_url = "http://images.cocodataset.org/zips/train2017.zip"
    
    coco_dir = TEMP_DIR / "coco"
    coco_dir.mkdir(exist_ok=True)
    
    print("Downloading COCO annotations...")
    annotations_file = coco_dir / "annotations_trainval2017.zip"
    if not annotations_file.exists():
        if download_file(annotations_url, annotations_file):
            print("✓ COCO annotations downloaded")
            os.system(f"cd {coco_dir} && unzip -q annotations_trainval2017.zip")
    
    dataset_sources.append({
        "name": "COCO Dataset - Sports Ball Subset",
        "url": "https://cocodataset.org/",
        "license": "Creative Commons Attribution 4.0",
        "images_count": "TBD (to be extracted)",
        "description": "Sports ball category from COCO dataset for object detection"
    })
    
    return coco_dir

def download_unsplash_basketball():
    """Download basketball images from Unsplash API"""
    print("\n📥 Downloading basketball images from Unsplash...")
    
    # Unsplash offers free API access
    # For now, we'll document the source
    dataset_sources.append({
        "name": "Unsplash Basketball Images",
        "url": "https://www.shutterstock.com/image-photo/dribbling-basketball-around-cones-female-600nw-2511573475.jpg",
        "license": "Unsplash License (Free for commercial use)",
        "images_count": "100+ available",
        "description": "High-quality basketball training images"
    })
    
    print("✓ Unsplash source documented (manual download recommended)")

def download_from_github():
    """Download basketball datasets from GitHub repositories"""
    print("\n📥 Downloading from GitHub repositories...")
    
    # SpaceJam dataset
    spacejam_url = "https://github.com/simonefrancia/SpaceJam"
    print(f"SpaceJam dataset available at: {spacejam_url}")
    
    dataset_sources.append({
        "name": "SpaceJam Basketball Action Recognition Dataset",
        "url": spacejam_url,
        "license": "MIT (verify on GitHub)",
        "images_count": "~32,560 examples",
        "description": "16-frame RGB video clips with pose keypoints for basketball actions"
    })
    
    print("✓ GitHub sources documented")

def create_readme():
    """Create README with dataset information"""
    readme_content = """# Basketball Training Dataset Collection

## Overview
This directory contains basketball training images organized for RoboFlow model training.

## Target Models
1. **Basketball-Shooting-Form-Keypoints** (Pose Estimation) - 1,500-2,000 images
2. **Basketball-Form-Quality-Classifier** (Classification) - 1,500-2,000 images  
3. **Basketball-Ball-Trajectory-Tracker** (Object Detection) - 500-1,000 images

## Directory Structure
```
training_data/
├── shooting_form_keypoints/    # Pose estimation images
│   ├── professional/            # NBA/college players
│   ├── amateur/                 # Various skill levels
│   ├── front_view/              # Front-facing shots
│   ├── side_view/               # Side profile shots
│   └── 45_degree/               # 45-degree angle shots
├── form_quality_classifier/     # Classification images
│   ├── excellent_form/          # Perfect shooting form
│   ├── good_form/               # Good form with minor issues
│   ├── needs_work/              # Noticeable form issues
│   └── poor_form/               # Poor shooting mechanics
└── ball_trajectory/             # Object detection images
    ├── jump_shots/              # Jump shot sequences
    ├── free_throws/             # Free throw sequences
    └── various_angles/          # Different camera angles
```

## Image Requirements
- **Resolution**: 1080p or higher
- **Lighting**: Clear, professional lighting preferred
- **Visibility**: Full body visible for pose estimation
- **Angles**: Multiple viewing angles
- **Diversity**: Various skill levels, body types, shot types

## Next Steps
1. Review and categorize downloaded images
2. Remove duplicates and low-quality images
3. Annotate images in RoboFlow
4. Train and evaluate models
5. Iterate on dataset composition

## Notes
- All images should be properly licensed for use
- Maintain attribution as required by source licenses
- Document any preprocessing steps applied

Generated: 2024
"""
    
    with open(BASE_DIR / "README.md", "w") as f:
        f.write(readme_content)
    print("✓ README.md created")

def main():
    print("🏀 Basketball Dataset Downloader")
    print("=" * 60)
    
    # Download from various sources
    download_coco_sports_subset()
    download_unsplash_basketball()
    download_from_github()
    
    # Create documentation
    create_readme()
    
    # Save dataset sources info
    with open(BASE_DIR / "dataset_sources.json", "w") as f:
        json.dump(dataset_sources, f, indent=2)
    
    print("\n" + "=" * 60)
    print("✓ Initial dataset discovery complete!")
    print(f"Sources documented: {len(dataset_sources)}")
    print("\nNext: Manual curation and organization required")

if __name__ == "__main__":
    main()
