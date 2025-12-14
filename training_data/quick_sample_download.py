#!/usr/bin/env python3
"""Quick sample downloader for demonstration"""
import requests
import json
from pathlib import Path

BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
SAMPLES_DIR = BASE_DIR / "sample_images"
SAMPLES_DIR.mkdir(exist_ok=True)

# Sample COCO images (directly accessible)
coco_samples = [
    "000000000009.jpg", "000000000025.jpg", "000000000030.jpg",
    "000000000034.jpg", "000000000036.jpg", "000000000042.jpg",
    "000000000049.jpg", "000000000061.jpg", "000000000064.jpg",
    "000000000071.jpg"
]

print("📥 Downloading sample COCO images...")
downloaded = 0
base_url = "http://images.cocodataset.org/train2017"

for img_name in coco_samples:
    try:
        url = f"{base_url}/{img_name}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            save_path = SAMPLES_DIR / f"coco_{img_name}"
            with open(save_path, 'wb') as f:
                f.write(response.content)
            downloaded += 1
            print(f"  ✓ {img_name}")
    except Exception as e:
        print(f"  ✗ {img_name}: {e}")

print(f"\n✓ Downloaded {downloaded} sample images to {SAMPLES_DIR}")
