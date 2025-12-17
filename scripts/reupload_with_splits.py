#!/usr/bin/env python3
"""
Re-upload images with proper train/valid/test splits
"""

import requests
import base64
import random
from pathlib import Path

API_KEY = "rDWynPrytSysASUlyGvK"
PROJECT = "basketball-shooting-keypoints"

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "training_data" / "raw"


def get_all_images():
    images = []
    for phase in ["load", "set", "release", "follow_through"]:
        phase_dir = RAW_DIR / phase
        if phase_dir.exists():
            for img in sorted(phase_dir.glob("*.*")):
                if img.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    images.append({"path": img, "phase": phase})
    return images


def upload_image(img_path: Path, split: str) -> bool:
    try:
        with open(img_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")
        
        url = f"https://api.roboflow.com/dataset/{PROJECT}/upload"
        params = {
            "api_key": API_KEY,
            "name": f"{split}_{img_path.name}",  # Rename to avoid duplicate
            "split": split
        }
        
        response = requests.post(url, params=params, data=img_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=60)
        
        return response.status_code == 200
    except:
        return False


def main():
    print("=" * 60)
    print("🏀 Re-upload with Train/Valid/Test Splits")
    print("=" * 60)
    
    images = get_all_images()
    random.shuffle(images)
    
    total = len(images)
    train_count = int(total * 0.7)
    valid_count = int(total * 0.2)
    
    train_imgs = images[:train_count]
    valid_imgs = images[train_count:train_count + valid_count]
    test_imgs = images[train_count + valid_count:]
    
    print(f"\n📊 Split: {len(train_imgs)} train, {len(valid_imgs)} valid, {len(test_imgs)} test")
    
    # Upload validation set
    print(f"\n📤 Uploading {len(valid_imgs)} VALIDATION images...")
    for i, img in enumerate(valid_imgs):
        if upload_image(img["path"], "valid"):
            print(f"  ✅ [valid {i+1}/{len(valid_imgs)}] {img['path'].name}")
        else:
            print(f"  ❌ [valid {i+1}/{len(valid_imgs)}] {img['path'].name}")
    
    # Upload test set
    print(f"\n📤 Uploading {len(test_imgs)} TEST images...")
    for i, img in enumerate(test_imgs):
        if upload_image(img["path"], "test"):
            print(f"  ✅ [test {i+1}/{len(test_imgs)}] {img['path'].name}")
        else:
            print(f"  ❌ [test {i+1}/{len(test_imgs)}] {img['path'].name}")
    
    print("\n✅ Done! Now generate a new version and train.")


if __name__ == "__main__":
    main()




