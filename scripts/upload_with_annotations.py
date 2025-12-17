#!/usr/bin/env python3
"""
Upload images WITH keypoint annotations to RoboFlow
"""

import os
import json
import glob
from pathlib import Path
from datetime import datetime
from roboflow import Roboflow
from PIL import Image

API_KEY = "rDWynPrytSysASUlyGvK"
PROJECT_NAME = "basketball-shooting-keypoints"

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "training_data" / "raw"
UPLOAD_DIR = BASE_DIR / "training_data" / "annotated_upload"

# 18 Keypoints for basketball shooting
KEYPOINTS = [
    "nose",
    "left_eye", 
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
    "basketball"
]

# Skeleton connections
SKELETON = [
    [0, 1], [0, 2], [1, 3], [2, 4],  # Head
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],  # Arms
    [5, 11], [6, 12], [11, 12],  # Torso
    [11, 13], [13, 15], [12, 14], [14, 16],  # Legs
    [9, 17], [10, 17]  # Wrists to basketball
]


def get_all_images():
    """Get all images organized by phase."""
    images = []
    for phase in ["load", "set", "release", "follow_through"]:
        phase_dir = RAW_DIR / phase
        if phase_dir.exists():
            for img in sorted(phase_dir.glob("*.*")):
                if img.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    images.append({"path": img, "filename": img.name, "phase": phase})
    return images


def estimate_keypoints(phase: str, width: int, height: int) -> list:
    """Estimate keypoint positions based on shooting phase."""
    cx, cy = width / 2, height / 2
    sx, sy = width / 100, height / 100
    
    if phase == "load":
        return [
            [cx, cy - 35*sy, 2],
            [cx - 3*sx, cy - 38*sy, 2],
            [cx + 3*sx, cy - 38*sy, 2],
            [cx - 6*sx, cy - 36*sy, 2],
            [cx + 6*sx, cy - 36*sy, 2],
            [cx - 15*sx, cy - 25*sy, 2],
            [cx + 15*sx, cy - 25*sy, 2],
            [cx - 12*sx, cy - 10*sy, 2],
            [cx + 12*sx, cy - 10*sy, 2],
            [cx - 5*sx, cy - 15*sy, 2],
            [cx + 5*sx, cy - 15*sy, 2],
            [cx - 12*sx, cy + 5*sy, 2],
            [cx + 12*sx, cy + 5*sy, 2],
            [cx - 12*sx, cy + 25*sy, 2],
            [cx + 12*sx, cy + 25*sy, 2],
            [cx - 12*sx, cy + 45*sy, 2],
            [cx + 12*sx, cy + 45*sy, 2],
            [cx, cy - 10*sy, 2],
        ]
    elif phase == "set":
        return [
            [cx, cy - 35*sy, 2],
            [cx - 3*sx, cy - 38*sy, 2],
            [cx + 3*sx, cy - 38*sy, 2],
            [cx - 6*sx, cy - 36*sy, 2],
            [cx + 6*sx, cy - 36*sy, 2],
            [cx - 15*sx, cy - 25*sy, 2],
            [cx + 15*sx, cy - 25*sy, 2],
            [cx - 8*sx, cy - 35*sy, 2],
            [cx + 8*sx, cy - 35*sy, 2],
            [cx - 3*sx, cy - 45*sy, 2],
            [cx + 3*sx, cy - 45*sy, 2],
            [cx - 12*sx, cy + 5*sy, 2],
            [cx + 12*sx, cy + 5*sy, 2],
            [cx - 12*sx, cy + 25*sy, 2],
            [cx + 12*sx, cy + 25*sy, 2],
            [cx - 12*sx, cy + 45*sy, 2],
            [cx + 12*sx, cy + 45*sy, 2],
            [cx, cy - 48*sy, 2],
        ]
    elif phase == "release":
        return [
            [cx, cy - 30*sy, 2],
            [cx - 3*sx, cy - 33*sy, 2],
            [cx + 3*sx, cy - 33*sy, 2],
            [cx - 6*sx, cy - 31*sy, 2],
            [cx + 6*sx, cy - 31*sy, 2],
            [cx - 15*sx, cy - 20*sy, 2],
            [cx + 15*sx, cy - 20*sy, 2],
            [cx - 5*sx, cy - 38*sy, 2],
            [cx + 5*sx, cy - 38*sy, 2],
            [cx - 2*sx, cy - 50*sy, 2],
            [cx + 2*sx, cy - 50*sy, 2],
            [cx - 12*sx, cy + 10*sy, 2],
            [cx + 12*sx, cy + 10*sy, 2],
            [cx - 10*sx, cy + 28*sy, 2],
            [cx + 10*sx, cy + 28*sy, 2],
            [cx - 10*sx, cy + 48*sy, 2],
            [cx + 10*sx, cy + 48*sy, 2],
            [cx, cy - 55*sy, 2],
        ]
    else:  # follow_through
        return [
            [cx, cy - 28*sy, 2],
            [cx - 3*sx, cy - 31*sy, 2],
            [cx + 3*sx, cy - 31*sy, 2],
            [cx - 6*sx, cy - 29*sy, 2],
            [cx + 6*sx, cy - 29*sy, 2],
            [cx - 15*sx, cy - 18*sy, 2],
            [cx + 15*sx, cy - 18*sy, 2],
            [cx - 3*sx, cy - 40*sy, 2],
            [cx + 3*sx, cy - 40*sy, 2],
            [cx, cy - 52*sy, 2],
            [cx + 2*sx, cy - 52*sy, 2],
            [cx - 12*sx, cy + 12*sy, 2],
            [cx + 12*sx, cy + 12*sy, 2],
            [cx - 8*sx, cy + 30*sy, 2],
            [cx + 8*sx, cy + 30*sy, 2],
            [cx - 8*sx, cy + 50*sy, 2],
            [cx + 8*sx, cy + 50*sy, 2],
            [cx + 10*sx, cy - 70*sy, 1],
        ]


def create_single_coco_annotation(img_info: dict, img_id: int) -> dict:
    """Create COCO annotation for a single image."""
    with Image.open(img_info["path"]) as img:
        width, height = img.size
    
    keypoints = estimate_keypoints(img_info["phase"], width, height)
    
    # Flatten keypoints
    keypoints_flat = []
    num_kp = 0
    for kp in keypoints:
        keypoints_flat.extend([int(kp[0]), int(kp[1]), int(kp[2])])
        if kp[2] > 0:
            num_kp += 1
    
    # Bounding box
    visible = [kp for kp in keypoints if kp[2] > 0]
    if visible:
        x_coords = [kp[0] for kp in visible]
        y_coords = [kp[1] for kp in visible]
        x_min, x_max = max(0, min(x_coords) - 20), min(width, max(x_coords) + 20)
        y_min, y_max = max(0, min(y_coords) - 20), min(height, max(y_coords) + 20)
        bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
    else:
        bbox = [0, 0, width, height]
    
    return {
        "info": {"description": "Basketball Shooting Keypoints", "version": "1.0"},
        "licenses": [{"id": 1, "name": "Private"}],
        "categories": [{
            "id": 1,
            "name": "shooter",
            "supercategory": "person",
            "keypoints": KEYPOINTS,
            "skeleton": SKELETON
        }],
        "images": [{
            "id": img_id,
            "file_name": img_info["filename"],
            "width": width,
            "height": height
        }],
        "annotations": [{
            "id": 1,
            "image_id": img_id,
            "category_id": 1,
            "keypoints": keypoints_flat,
            "num_keypoints": num_kp,
            "bbox": bbox,
            "area": bbox[2] * bbox[3],
            "iscrowd": 0
        }]
    }


def main():
    print("=" * 60)
    print("🏀 Upload Images + Annotations to RoboFlow")
    print("=" * 60)
    
    # Get images
    images = get_all_images()
    print(f"\n📁 Found {len(images)} images")
    
    # Create upload directory
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Initialize RoboFlow
    print("\n🔗 Connecting to RoboFlow...")
    rf = Roboflow(api_key=API_KEY)
    project = rf.workspace().project(PROJECT_NAME)
    print(f"   ✅ Connected to: {PROJECT_NAME}")
    
    # Upload each image with its annotation
    print(f"\n📤 Uploading with annotations...")
    success = 0
    failed = 0
    
    for idx, img_info in enumerate(images):
        try:
            # Create individual COCO annotation file
            coco = create_single_coco_annotation(img_info, idx + 1)
            
            annotation_path = UPLOAD_DIR / f"{img_info['filename']}.json"
            with open(annotation_path, "w") as f:
                json.dump(coco, f)
            
            # Upload with annotation
            project.single_upload(
                image_path=str(img_info["path"]),
                annotation_path=str(annotation_path),
                split="train"
            )
            
            success += 1
            print(f"  ✅ [{idx+1}/{len(images)}] {img_info['filename']} ({img_info['phase']})")
            
        except Exception as e:
            failed += 1
            print(f"  ❌ [{idx+1}/{len(images)}] {img_info['filename']} - {str(e)[:50]}")
    
    print("\n" + "=" * 60)
    print("📊 COMPLETE")
    print("=" * 60)
    print(f"  ✅ Success: {success}")
    print(f"  ❌ Failed: {failed}")
    print(f"\n🔗 View: https://app.roboflow.com/tbf-inc/{PROJECT_NAME}")


if __name__ == "__main__":
    main()




