#!/usr/bin/env python3
"""
Prepare Images for RoboFlow Upload

This script:
1. Validates all collected images
2. Resizes to consistent dimensions
3. Organizes by shooting phase
4. Creates a manifest for RoboFlow upload
5. Generates annotation templates

Requirements:
    pip install opencv-python pillow

Usage:
    python prepare_for_roboflow.py
"""

import os
import json
import cv2
import shutil
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
EXPORT_DIR = TRAINING_DIR / "roboflow_export"

# Shooting phases
PHASES = ["load", "set", "release", "follow_through"]

# Target image dimensions for RoboFlow
TARGET_WIDTH = 640
TARGET_HEIGHT = 640

# Keypoint definitions for basketball shooting form
KEYPOINTS = [
    {"id": 0, "name": "nose", "color": "#FF0000"},
    {"id": 1, "name": "left_eye", "color": "#FF0000"},
    {"id": 2, "name": "right_eye", "color": "#FF0000"},
    {"id": 3, "name": "left_ear", "color": "#FF0000"},
    {"id": 4, "name": "right_ear", "color": "#FF0000"},
    {"id": 5, "name": "left_shoulder", "color": "#00FF00"},
    {"id": 6, "name": "right_shoulder", "color": "#00FF00"},
    {"id": 7, "name": "left_elbow", "color": "#0000FF"},
    {"id": 8, "name": "right_elbow", "color": "#0000FF"},
    {"id": 9, "name": "left_wrist", "color": "#FFFF00"},
    {"id": 10, "name": "right_wrist", "color": "#FFFF00"},
    {"id": 11, "name": "left_hip", "color": "#FF00FF"},
    {"id": 12, "name": "right_hip", "color": "#FF00FF"},
    {"id": 13, "name": "left_knee", "color": "#00FFFF"},
    {"id": 14, "name": "right_knee", "color": "#00FFFF"},
    {"id": 15, "name": "left_ankle", "color": "#FFA500"},
    {"id": 16, "name": "right_ankle", "color": "#FFA500"},
    {"id": 17, "name": "basketball", "color": "#FF8C00"},
]

# Skeleton connections for visualization
SKELETON = [
    [0, 1], [0, 2], [1, 3], [2, 4],  # Face
    [5, 6],  # Shoulders
    [5, 7], [7, 9],  # Left arm
    [6, 8], [8, 10],  # Right arm
    [5, 11], [6, 12],  # Torso
    [11, 12],  # Hips
    [11, 13], [13, 15],  # Left leg
    [12, 14], [14, 16],  # Right leg
]


def ensure_directories():
    """Create export directories."""
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    (EXPORT_DIR / "images").mkdir(exist_ok=True)
    (EXPORT_DIR / "annotations").mkdir(exist_ok=True)
    print("✅ Export directories created")


def validate_and_resize(src_path: Path, dest_path: Path) -> bool:
    """Validate image and resize to target dimensions."""
    try:
        img = cv2.imread(str(src_path))
        if img is None:
            return False
        
        # Get dimensions
        h, w = img.shape[:2]
        
        # Calculate resize to fit in target while maintaining aspect ratio
        scale = min(TARGET_WIDTH / w, TARGET_HEIGHT / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        
        # Create padded canvas
        canvas = np.zeros((TARGET_HEIGHT, TARGET_WIDTH, 3), dtype=np.uint8)
        
        # Calculate padding offsets
        x_offset = (TARGET_WIDTH - new_w) // 2
        y_offset = (TARGET_HEIGHT - new_h) // 2
        
        # Place resized image on canvas
        canvas[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized
        
        # Save
        cv2.imwrite(str(dest_path), canvas, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return True
    
    except Exception as e:
        print(f"  ❌ Error processing {src_path.name}: {e}")
        return False


def create_annotation_template(image_name: str, phase: str) -> Dict:
    """Create COCO-format annotation template."""
    return {
        "image": image_name,
        "phase": phase,
        "annotations": [
            {
                "category": "person",
                "keypoints": [
                    # Placeholder keypoints - to be filled in RoboFlow
                    {"name": kp["name"], "x": 0, "y": 0, "visibility": 0}
                    for kp in KEYPOINTS[:-1]  # Exclude basketball
                ],
                "bbox": [0, 0, 0, 0]  # To be filled
            },
            {
                "category": "basketball",
                "keypoints": [
                    {"name": "center", "x": 0, "y": 0, "visibility": 0}
                ],
                "bbox": [0, 0, 0, 0]
            }
        ],
        "metadata": {
            "phase": phase,
            "shooting_hand": "unknown",  # To be labeled
            "source": "training_collection"
        }
    }


def process_images() -> Dict:
    """Process all images and prepare for RoboFlow."""
    import numpy as np
    
    stats = {phase: 0 for phase in PHASES}
    manifest = []
    
    print("\n📸 Processing images...")
    
    for phase in PHASES:
        phase_dir = RAW_DIR / phase
        if not phase_dir.exists():
            continue
        
        for img_path in phase_dir.glob("*.*"):
            if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
                continue
            
            # Generate new filename
            new_name = f"{phase}_{stats[phase]:03d}.jpg"
            dest_path = EXPORT_DIR / "images" / new_name
            
            # Process image
            if validate_and_resize(img_path, dest_path):
                stats[phase] += 1
                
                # Create annotation template
                annotation = create_annotation_template(new_name, phase)
                annotation_path = EXPORT_DIR / "annotations" / f"{new_name.replace('.jpg', '.json')}"
                
                with open(annotation_path, "w") as f:
                    json.dump(annotation, f, indent=2)
                
                manifest.append({
                    "image": new_name,
                    "phase": phase,
                    "annotation": annotation_path.name
                })
                
                print(f"  ✅ {new_name}")
    
    return stats, manifest


def create_roboflow_config():
    """Create RoboFlow project configuration."""
    config = {
        "project_name": "basketball-shooting-form",
        "project_type": "keypoint-detection",
        "classes": ["person", "basketball"],
        "keypoints": KEYPOINTS,
        "skeleton": SKELETON,
        "phases": PHASES,
        "annotation_format": "coco-keypoints",
        "preprocessing": {
            "resize": {"width": TARGET_WIDTH, "height": TARGET_HEIGHT},
            "auto_orient": True
        },
        "augmentation": {
            "flip_horizontal": True,
            "brightness": {"min": 0.8, "max": 1.2},
            "blur": {"max": 1.5},
            "noise": {"max": 2}
        },
        "split": {
            "train": 70,
            "valid": 20,
            "test": 10
        }
    }
    
    config_path = EXPORT_DIR / "roboflow_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Config saved: {config_path}")
    return config


def create_readme():
    """Create README for RoboFlow upload."""
    readme = """# Basketball Shooting Form Training Data

## Dataset Information
- **Purpose**: Train keypoint detection model for basketball shooting form analysis
- **Format**: COCO Keypoints
- **Target Size**: 640x640 pixels

## Keypoints (18 total)
0. nose
1. left_eye
2. right_eye
3. left_ear
4. right_ear
5. left_shoulder
6. right_shoulder
7. left_elbow
8. right_elbow
9. left_wrist
10. right_wrist
11. left_hip
12. right_hip
13. left_knee
14. right_knee
15. left_ankle
16. right_ankle
17. basketball (center)

## Shooting Phases
- **LOAD**: Ball below chin, knees bent, preparing
- **SET**: Ball at set point, aiming
- **RELEASE**: Ball leaving hands
- **FOLLOW_THROUGH**: Arms extended, ball released

## How to Use in RoboFlow

1. Create new project: "Keypoint Detection"
2. Upload images from `images/` folder
3. Define custom skeleton using `roboflow_config.json`
4. Annotate each image with all 18 keypoints
5. Label shooting phase as class tag
6. Train model with default settings

## Annotation Tips
- Mark all visible keypoints precisely
- Mark occluded keypoints with "occluded" flag
- Always mark basketball position
- Use bounding box for person detection
"""
    
    readme_path = EXPORT_DIR / "README.md"
    with open(readme_path, "w") as f:
        f.write(readme)
    
    print(f"✅ README saved: {readme_path}")


def main():
    import numpy as np  # Import here for the validate_and_resize function
    
    print("="*50)
    print("🏀 Basketball Shooting Form - RoboFlow Prep")
    print("="*50)
    
    ensure_directories()
    
    # Process images
    stats, manifest = process_images()
    
    # Create config and readme
    create_roboflow_config()
    create_readme()
    
    # Save manifest
    manifest_path = EXPORT_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    
    # Print summary
    print("\n" + "="*50)
    print("📊 EXPORT SUMMARY")
    print("="*50)
    
    total = sum(stats.values())
    for phase, count in stats.items():
        status = "✅" if count >= 25 else "⚠️"
        print(f"  {status} {phase.upper()}: {count} images")
    
    print(f"\n  📁 Total: {total} images")
    print(f"  📂 Export location: {EXPORT_DIR}")
    
    if total >= 100:
        print("\n✅ Minimum dataset ready for RoboFlow!")
    else:
        print(f"\n⚠️ Need {100 - total} more images")
    
    print("\n📝 Next Steps:")
    print("  1. Go to https://app.roboflow.com")
    print("  2. Create new project: 'Keypoint Detection'")
    print("  3. Upload images from: roboflow_export/images/")
    print("  4. Define skeleton using: roboflow_export/roboflow_config.json")
    print("  5. Annotate all keypoints")
    print("  6. Train model!")
    print("="*50)


if __name__ == "__main__":
    # Make numpy available for validate_and_resize
    import numpy as np
    main()





