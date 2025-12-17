#!/usr/bin/env python3
"""
Upload images with PROPER COCO keypoint format to RoboFlow.
The COCO format includes skeleton definition in categories.
"""

import os
import json
import shutil
from pathlib import Path
from PIL import Image
from roboflow import Roboflow

API_KEY = "rDWynPrytSysASUlyGvK"
PROJECT_NAME = "basketball-shooting-keypointsv1"

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "training_data" / "raw"
UPLOAD_DIR = BASE_DIR / "training_data" / "coco_upload"

# 18 Keypoints - MUST match what RoboFlow expects
KEYPOINTS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle", "basketball"
]

# Skeleton connections (1-indexed for COCO format)
SKELETON = [
    [1, 2], [1, 3], [2, 4], [3, 5],  # Head: nose to eyes, eyes to ears
    [6, 7],  # Shoulders
    [6, 8], [8, 10],  # Left arm
    [7, 9], [9, 11],  # Right arm
    [6, 12], [7, 13],  # Shoulders to hips
    [12, 13],  # Hips
    [12, 14], [14, 16],  # Left leg
    [13, 15], [15, 17],  # Right leg
    [10, 18], [11, 18]  # Wrists to basketball
]


def get_all_images():
    images = []
    for phase in ["load", "set", "release", "follow_through"]:
        phase_dir = RAW_DIR / phase
        if phase_dir.exists():
            for img in sorted(phase_dir.glob("*.*")):
                if img.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    images.append({"path": img, "filename": img.name, "phase": phase})
    return images


def estimate_keypoints(phase: str, width: int, height: int) -> list:
    """Returns keypoints as [x, y, v] where v=2 means visible."""
    cx, cy = width / 2, height / 2
    sx, sy = width / 100, height / 100
    
    if phase == "load":
        return [
            [cx, cy - 35*sy, 2], [cx - 3*sx, cy - 38*sy, 2], [cx + 3*sx, cy - 38*sy, 2],
            [cx - 6*sx, cy - 36*sy, 2], [cx + 6*sx, cy - 36*sy, 2],
            [cx - 15*sx, cy - 25*sy, 2], [cx + 15*sx, cy - 25*sy, 2],
            [cx - 12*sx, cy - 10*sy, 2], [cx + 12*sx, cy - 10*sy, 2],
            [cx - 5*sx, cy - 15*sy, 2], [cx + 5*sx, cy - 15*sy, 2],
            [cx - 12*sx, cy + 5*sy, 2], [cx + 12*sx, cy + 5*sy, 2],
            [cx - 12*sx, cy + 25*sy, 2], [cx + 12*sx, cy + 25*sy, 2],
            [cx - 12*sx, cy + 45*sy, 2], [cx + 12*sx, cy + 45*sy, 2],
            [cx, cy - 10*sy, 2]
        ]
    elif phase == "set":
        return [
            [cx, cy - 35*sy, 2], [cx - 3*sx, cy - 38*sy, 2], [cx + 3*sx, cy - 38*sy, 2],
            [cx - 6*sx, cy - 36*sy, 2], [cx + 6*sx, cy - 36*sy, 2],
            [cx - 15*sx, cy - 25*sy, 2], [cx + 15*sx, cy - 25*sy, 2],
            [cx - 8*sx, cy - 35*sy, 2], [cx + 8*sx, cy - 35*sy, 2],
            [cx - 3*sx, cy - 45*sy, 2], [cx + 3*sx, cy - 45*sy, 2],
            [cx - 12*sx, cy + 5*sy, 2], [cx + 12*sx, cy + 5*sy, 2],
            [cx - 12*sx, cy + 25*sy, 2], [cx + 12*sx, cy + 25*sy, 2],
            [cx - 12*sx, cy + 45*sy, 2], [cx + 12*sx, cy + 45*sy, 2],
            [cx, cy - 48*sy, 2]
        ]
    elif phase == "release":
        return [
            [cx, cy - 30*sy, 2], [cx - 3*sx, cy - 33*sy, 2], [cx + 3*sx, cy - 33*sy, 2],
            [cx - 6*sx, cy - 31*sy, 2], [cx + 6*sx, cy - 31*sy, 2],
            [cx - 15*sx, cy - 20*sy, 2], [cx + 15*sx, cy - 20*sy, 2],
            [cx - 5*sx, cy - 38*sy, 2], [cx + 5*sx, cy - 38*sy, 2],
            [cx - 2*sx, cy - 50*sy, 2], [cx + 2*sx, cy - 50*sy, 2],
            [cx - 12*sx, cy + 10*sy, 2], [cx + 12*sx, cy + 10*sy, 2],
            [cx - 10*sx, cy + 28*sy, 2], [cx + 10*sx, cy + 28*sy, 2],
            [cx - 10*sx, cy + 48*sy, 2], [cx + 10*sx, cy + 48*sy, 2],
            [cx, cy - 55*sy, 2]
        ]
    else:  # follow_through
        return [
            [cx, cy - 28*sy, 2], [cx - 3*sx, cy - 31*sy, 2], [cx + 3*sx, cy - 31*sy, 2],
            [cx - 6*sx, cy - 29*sy, 2], [cx + 6*sx, cy - 29*sy, 2],
            [cx - 15*sx, cy - 18*sy, 2], [cx + 15*sx, cy - 18*sy, 2],
            [cx - 3*sx, cy - 40*sy, 2], [cx + 3*sx, cy - 40*sy, 2],
            [cx, cy - 52*sy, 2], [cx + 2*sx, cy - 52*sy, 2],
            [cx - 12*sx, cy + 12*sy, 2], [cx + 12*sx, cy + 12*sy, 2],
            [cx - 8*sx, cy + 30*sy, 2], [cx + 8*sx, cy + 30*sy, 2],
            [cx - 8*sx, cy + 50*sy, 2], [cx + 8*sx, cy + 50*sy, 2],
            [cx + 10*sx, cy - 70*sy, 2]
        ]


def create_full_coco_dataset(images: list) -> dict:
    """Create a complete COCO dataset with all images and annotations."""
    
    coco = {
        "info": {
            "description": "Basketball Shooting Form Keypoints Dataset",
            "version": "1.0",
            "year": 2024
        },
        "licenses": [{"id": 1, "name": "CC BY 4.0", "url": ""}],
        "categories": [{
            "id": 1,
            "name": "Shooting Form",
            "supercategory": "person",
            "keypoints": KEYPOINTS,
            "skeleton": SKELETON
        }],
        "images": [],
        "annotations": []
    }
    
    for idx, img_info in enumerate(images):
        with Image.open(img_info["path"]) as img:
            width, height = img.size
        
        # Image entry
        coco["images"].append({
            "id": idx + 1,
            "file_name": img_info["filename"],
            "width": width,
            "height": height
        })
        
        # Keypoints
        keypoints = estimate_keypoints(img_info["phase"], width, height)
        keypoints_flat = []
        num_kp = 0
        for kp in keypoints:
            keypoints_flat.extend([int(kp[0]), int(kp[1]), int(kp[2])])
            if kp[2] > 0:
                num_kp += 1
        
        # Bounding box
        visible = [kp for kp in keypoints if kp[2] > 0]
        x_coords = [kp[0] for kp in visible]
        y_coords = [kp[1] for kp in visible]
        x_min = max(0, min(x_coords) - 20)
        y_min = max(0, min(y_coords) - 20)
        x_max = min(width, max(x_coords) + 20)
        y_max = min(height, max(y_coords) + 20)
        bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
        
        # Annotation entry
        coco["annotations"].append({
            "id": idx + 1,
            "image_id": idx + 1,
            "category_id": 1,
            "keypoints": keypoints_flat,
            "num_keypoints": num_kp,
            "bbox": bbox,
            "area": bbox[2] * bbox[3],
            "iscrowd": 0
        })
    
    return coco


def main():
    print("=" * 60)
    print("🏀 Upload COCO Keypoint Dataset to RoboFlow")
    print("=" * 60)
    
    images = get_all_images()
    total = len(images)
    
    # Split: 70% train, 20% valid, 10% test
    import random
    random.seed(42)
    random.shuffle(images)
    
    train_end = int(total * 0.7)
    valid_end = int(total * 0.9)
    
    train_images = images[:train_end]
    valid_images = images[train_end:valid_end]
    test_images = images[valid_end:]
    
    print(f"\n📊 Dataset split:")
    print(f"   Train: {len(train_images)}")
    print(f"   Valid: {len(valid_images)}")
    print(f"   Test: {len(test_images)}")
    
    # Create upload directories
    for split in ["train", "valid", "test"]:
        (UPLOAD_DIR / split).mkdir(parents=True, exist_ok=True)
    
    # Process each split
    splits = [
        ("train", train_images),
        ("valid", valid_images),
        ("test", test_images)
    ]
    
    print("\n📁 Creating COCO datasets...")
    
    for split_name, split_images in splits:
        split_dir = UPLOAD_DIR / split_name
        
        # Copy images
        for img in split_images:
            shutil.copy(img["path"], split_dir / img["filename"])
        
        # Create COCO JSON
        coco = create_full_coco_dataset(split_images)
        with open(split_dir / "_annotations.coco.json", "w") as f:
            json.dump(coco, f, indent=2)
        
        print(f"   ✅ {split_name}: {len(split_images)} images")
    
    # Initialize RoboFlow
    print("\n🔗 Connecting to RoboFlow...")
    rf = Roboflow(api_key=API_KEY)
    project = rf.workspace().project(PROJECT_NAME)
    print(f"   Project: {project.name}")
    
    # Upload each split
    print("\n📤 Uploading to RoboFlow...")
    
    for split_name, split_images in splits:
        split_dir = UPLOAD_DIR / split_name
        annotation_file = split_dir / "_annotations.coco.json"
        
        print(f"\n   Uploading {split_name} ({len(split_images)} images)...")
        
        for idx, img_info in enumerate(split_images):
            img_path = split_dir / img_info["filename"]
            try:
                project.single_upload(
                    image_path=str(img_path),
                    annotation_path=str(annotation_file),
                    split=split_name
                )
                print(f"      ✅ [{idx+1}/{len(split_images)}] {img_info['filename']}")
            except Exception as e:
                print(f"      ❌ [{idx+1}/{len(split_images)}] {img_info['filename']} - {str(e)[:40]}")
    
    print("\n" + "=" * 60)
    print("✅ UPLOAD COMPLETE")
    print(f"🔗 https://app.roboflow.com/tbf-inc/{PROJECT_NAME}")
    print("=" * 60)


if __name__ == "__main__":
    main()




