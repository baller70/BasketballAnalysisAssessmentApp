#!/usr/bin/env python3
"""
Upload all training images to RoboFlow
"""

import requests
import base64
from pathlib import Path
import time

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


def upload_image(img_path: Path) -> bool:
    try:
        with open(img_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")
        
        url = f"https://api.roboflow.com/dataset/{PROJECT}/upload"
        params = {
            "api_key": API_KEY,
            "name": img_path.name,
            "split": "train"
        }
        
        response = requests.post(url, params=params, data=img_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=60)
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    print("=" * 60)
    print("🏀 Upload Training Images to RoboFlow")
    print("=" * 60)
    
    images = get_all_images()
    print(f"\n📁 Found {len(images)} images to upload")
    print(f"📤 Uploading to project: {PROJECT}\n")
    
    success = 0
    failed = 0
    
    for i, img in enumerate(images):
        if upload_image(img["path"]):
            success += 1
            print(f"  ✅ [{i+1}/{len(images)}] {img['path'].name} ({img['phase']})")
        else:
            failed += 1
            print(f"  ❌ [{i+1}/{len(images)}] {img['path'].name}")
        
        # Rate limiting
        if (i + 1) % 10 == 0:
            time.sleep(1)
    
    print("\n" + "=" * 60)
    print("📊 UPLOAD COMPLETE")
    print("=" * 60)
    print(f"  ✅ Success: {success}")
    print(f"  ❌ Failed: {failed}")
    print(f"\n🔗 View: https://app.roboflow.com/tbf-inc/{PROJECT}")


if __name__ == "__main__":
    main()




