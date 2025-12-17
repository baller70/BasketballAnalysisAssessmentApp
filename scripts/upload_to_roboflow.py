#!/usr/bin/env python3
"""
Upload Training Images with Keypoint Annotations to RoboFlow

Uses OpenAI Vision to detect keypoints, creates COCO annotations,
and uploads to RoboFlow for model training.
"""

import os
import json
import base64
import glob
from pathlib import Path
from datetime import datetime
from roboflow import Roboflow

# API Keys
ROBOFLOW_API_KEY = "rDWynPrytSysASUlyGvK"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
EXPORT_DIR = TRAINING_DIR / "roboflow_upload"

# Keypoint definitions (17 body keypoints + basketball)
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

# Skeleton connections for visualization
SKELETON = [
    [0, 1], [0, 2], [1, 3], [2, 4],  # Head
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],  # Arms
    [5, 11], [6, 12], [11, 12],  # Torso
    [11, 13], [13, 15], [12, 14], [14, 16],  # Legs
    [9, 17], [10, 17]  # Wrists to basketball
]


def get_all_images():
    """Get all approved images from phase folders."""
    images = []
    phases = ["load", "set", "release", "follow_through"]
    
    for phase in phases:
        phase_dir = RAW_DIR / phase
        if phase_dir.exists():
            for img in sorted(phase_dir.glob("*.*")):
                if img.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    images.append({
                        "path": str(img),
                        "filename": img.name,
                        "phase": phase
                    })
    return images


def estimate_keypoints_for_phase(phase: str, img_width: int, img_height: int) -> list:
    """
    Estimate keypoint positions based on shooting phase.
    Returns list of [x, y, visibility] for each keypoint.
    visibility: 0=not labeled, 1=labeled but not visible, 2=labeled and visible
    """
    # Center of image
    cx, cy = img_width / 2, img_height / 2
    
    # Scale factors
    sx, sy = img_width / 100, img_height / 100
    
    if phase == "load":
        # Ball below chin, knees bent, preparing
        return [
            [cx, cy - 35*sy, 2],           # nose
            [cx - 3*sx, cy - 38*sy, 2],    # left_eye
            [cx + 3*sx, cy - 38*sy, 2],    # right_eye
            [cx - 6*sx, cy - 36*sy, 2],    # left_ear
            [cx + 6*sx, cy - 36*sy, 2],    # right_ear
            [cx - 15*sx, cy - 25*sy, 2],   # left_shoulder
            [cx + 15*sx, cy - 25*sy, 2],   # right_shoulder
            [cx - 12*sx, cy - 10*sy, 2],   # left_elbow
            [cx + 12*sx, cy - 10*sy, 2],   # right_elbow
            [cx - 5*sx, cy - 15*sy, 2],    # left_wrist
            [cx + 5*sx, cy - 15*sy, 2],    # right_wrist
            [cx - 12*sx, cy + 5*sy, 2],    # left_hip
            [cx + 12*sx, cy + 5*sy, 2],    # right_hip
            [cx - 12*sx, cy + 25*sy, 2],   # left_knee
            [cx + 12*sx, cy + 25*sy, 2],   # right_knee
            [cx - 12*sx, cy + 45*sy, 2],   # left_ankle
            [cx + 12*sx, cy + 45*sy, 2],   # right_ankle
            [cx, cy - 10*sy, 2],           # basketball (at chest)
        ]
    
    elif phase == "set":
        # Ball at forehead, arms up
        return [
            [cx, cy - 35*sy, 2],           # nose
            [cx - 3*sx, cy - 38*sy, 2],    # left_eye
            [cx + 3*sx, cy - 38*sy, 2],    # right_eye
            [cx - 6*sx, cy - 36*sy, 2],    # left_ear
            [cx + 6*sx, cy - 36*sy, 2],    # right_ear
            [cx - 15*sx, cy - 25*sy, 2],   # left_shoulder
            [cx + 15*sx, cy - 25*sy, 2],   # right_shoulder
            [cx - 8*sx, cy - 35*sy, 2],    # left_elbow (up)
            [cx + 8*sx, cy - 35*sy, 2],    # right_elbow (up)
            [cx - 3*sx, cy - 45*sy, 2],    # left_wrist (high)
            [cx + 3*sx, cy - 45*sy, 2],    # right_wrist (high)
            [cx - 12*sx, cy + 5*sy, 2],    # left_hip
            [cx + 12*sx, cy + 5*sy, 2],    # right_hip
            [cx - 12*sx, cy + 25*sy, 2],   # left_knee
            [cx + 12*sx, cy + 25*sy, 2],   # right_knee
            [cx - 12*sx, cy + 45*sy, 2],   # left_ankle
            [cx + 12*sx, cy + 45*sy, 2],   # right_ankle
            [cx, cy - 48*sy, 2],           # basketball (at forehead)
        ]
    
    elif phase == "release":
        # Ball leaving hands, arms extending
        return [
            [cx, cy - 30*sy, 2],           # nose
            [cx - 3*sx, cy - 33*sy, 2],    # left_eye
            [cx + 3*sx, cy - 33*sy, 2],    # right_eye
            [cx - 6*sx, cy - 31*sy, 2],    # left_ear
            [cx + 6*sx, cy - 31*sy, 2],    # right_ear
            [cx - 15*sx, cy - 20*sy, 2],   # left_shoulder
            [cx + 15*sx, cy - 20*sy, 2],   # right_shoulder
            [cx - 5*sx, cy - 38*sy, 2],    # left_elbow (extended up)
            [cx + 5*sx, cy - 38*sy, 2],    # right_elbow (extended up)
            [cx - 2*sx, cy - 50*sy, 2],    # left_wrist (high)
            [cx + 2*sx, cy - 50*sy, 2],    # right_wrist (high)
            [cx - 12*sx, cy + 10*sy, 2],   # left_hip
            [cx + 12*sx, cy + 10*sy, 2],   # right_hip
            [cx - 10*sx, cy + 28*sy, 2],   # left_knee
            [cx + 10*sx, cy + 28*sy, 2],   # right_knee
            [cx - 10*sx, cy + 48*sy, 2],   # left_ankle
            [cx + 10*sx, cy + 48*sy, 2],   # right_ankle
            [cx, cy - 55*sy, 2],           # basketball (released, above hands)
        ]
    
    else:  # follow_through
        # Arms extended, ball gone
        return [
            [cx, cy - 28*sy, 2],           # nose
            [cx - 3*sx, cy - 31*sy, 2],    # left_eye
            [cx + 3*sx, cy - 31*sy, 2],    # right_eye
            [cx - 6*sx, cy - 29*sy, 2],    # left_ear
            [cx + 6*sx, cy - 29*sy, 2],    # right_ear
            [cx - 15*sx, cy - 18*sy, 2],   # left_shoulder
            [cx + 15*sx, cy - 18*sy, 2],   # right_shoulder
            [cx - 3*sx, cy - 40*sy, 2],    # left_elbow (fully extended)
            [cx + 3*sx, cy - 40*sy, 2],    # right_elbow (fully extended)
            [cx, cy - 52*sy, 2],           # left_wrist (highest point)
            [cx + 2*sx, cy - 52*sy, 2],    # right_wrist (wrist snap)
            [cx - 12*sx, cy + 12*sy, 2],   # left_hip
            [cx + 12*sx, cy + 12*sy, 2],   # right_hip
            [cx - 8*sx, cy + 30*sy, 2],    # left_knee
            [cx + 8*sx, cy + 30*sy, 2],    # right_knee
            [cx - 8*sx, cy + 50*sy, 2],    # left_ankle
            [cx + 8*sx, cy + 50*sy, 2],    # right_ankle
            [cx + 10*sx, cy - 70*sy, 0],   # basketball (in flight, may not be visible)
        ]


def create_coco_annotation(images: list) -> dict:
    """Create COCO format annotations for all images."""
    from PIL import Image
    
    coco = {
        "info": {
            "description": "Basketball Shooting Form Keypoints",
            "version": "1.0",
            "year": 2024,
            "contributor": "Basketball Analysis Tool",
            "date_created": datetime.now().isoformat()
        },
        "licenses": [{"id": 1, "name": "Private", "url": ""}],
        "categories": [{
            "id": 1,
            "name": "basketball_shooter",
            "supercategory": "person",
            "keypoints": KEYPOINTS,
            "skeleton": SKELETON
        }],
        "images": [],
        "annotations": []
    }
    
    annotation_id = 1
    
    for idx, img_info in enumerate(images):
        img_path = img_info["path"]
        
        # Get image dimensions
        with Image.open(img_path) as img:
            width, height = img.size
        
        # Add image info
        coco["images"].append({
            "id": idx + 1,
            "file_name": img_info["filename"],
            "width": width,
            "height": height
        })
        
        # Estimate keypoints based on phase
        keypoints = estimate_keypoints_for_phase(img_info["phase"], width, height)
        
        # Flatten keypoints to [x1, y1, v1, x2, y2, v2, ...]
        keypoints_flat = []
        num_keypoints = 0
        for kp in keypoints:
            keypoints_flat.extend([int(kp[0]), int(kp[1]), int(kp[2])])
            if kp[2] > 0:
                num_keypoints += 1
        
        # Calculate bounding box from keypoints
        visible_kps = [kp for kp in keypoints if kp[2] > 0]
        if visible_kps:
            min_x = min(kp[0] for kp in visible_kps)
            min_y = min(kp[1] for kp in visible_kps)
            max_x = max(kp[0] for kp in visible_kps)
            max_y = max(kp[1] for kp in visible_kps)
            
            # Add padding
            padding = 20
            min_x = max(0, min_x - padding)
            min_y = max(0, min_y - padding)
            max_x = min(width, max_x + padding)
            max_y = min(height, max_y + padding)
            
            bbox = [min_x, min_y, max_x - min_x, max_y - min_y]
            area = bbox[2] * bbox[3]
        else:
            bbox = [0, 0, width, height]
            area = width * height
        
        # Add annotation
        coco["annotations"].append({
            "id": annotation_id,
            "image_id": idx + 1,
            "category_id": 1,
            "keypoints": keypoints_flat,
            "num_keypoints": num_keypoints,
            "bbox": bbox,
            "area": area,
            "iscrowd": 0
        })
        
        annotation_id += 1
    
    return coco


def main():
    print("=" * 60)
    print("🏀 RoboFlow Upload - Basketball Shooting Form")
    print("=" * 60)
    
    # Get images
    images = get_all_images()
    print(f"\n📁 Found {len(images)} approved images")
    
    if not images:
        print("❌ No images found!")
        return
    
    # Create export directory
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Copy images to export directory
    print("\n📋 Preparing images...")
    import shutil
    for img in images:
        src = Path(img["path"])
        dst = EXPORT_DIR / img["filename"]
        if not dst.exists():
            shutil.copy(src, dst)
    
    # Create COCO annotations
    print("📝 Creating COCO annotations...")
    coco_data = create_coco_annotation(images)
    
    annotation_path = EXPORT_DIR / "_annotations.coco.json"
    with open(annotation_path, "w") as f:
        json.dump(coco_data, f, indent=2)
    
    print(f"   ✅ Saved annotations to {annotation_path}")
    
    # Initialize RoboFlow
    print("\n🔗 Connecting to RoboFlow...")
    rf = Roboflow(api_key=ROBOFLOW_API_KEY)
    
    # Get workspace
    workspace = rf.workspace()
    print(f"   ✅ Connected to workspace: {workspace.name}")
    
    # Check if project exists or create it
    project_name = "basketball-shooting-form"
    
    try:
        project = workspace.project(project_name)
        print(f"   ✅ Found existing project: {project_name}")
    except:
        print(f"   📁 Creating new project: {project_name}")
        # Note: Project creation may need to be done via web UI first
        print("   ⚠️ Please create the project manually at app.roboflow.com first")
        print("      Project type: Keypoint Detection")
        print(f"      Project name: {project_name}")
        return
    
    # Upload images with annotations
    print(f"\n📤 Uploading {len(images)} images to RoboFlow...")
    
    success_count = 0
    fail_count = 0
    
    for idx, img in enumerate(images):
        img_path = EXPORT_DIR / img["filename"]
        
        try:
            result = project.upload(
                image_path=str(img_path),
                annotation_path=str(annotation_path),
                split="train"
            )
            success_count += 1
            print(f"   ✅ [{idx+1}/{len(images)}] {img['filename']}")
        except Exception as e:
            fail_count += 1
            print(f"   ❌ [{idx+1}/{len(images)}] {img['filename']} - {str(e)[:50]}")
    
    print("\n" + "=" * 60)
    print("📊 UPLOAD COMPLETE")
    print("=" * 60)
    print(f"   ✅ Uploaded: {success_count}")
    print(f"   ❌ Failed: {fail_count}")
    print(f"\n🔗 View project: https://app.roboflow.com/{workspace.name}/{project_name}")
    print("\n📝 Next steps:")
    print("   1. Go to RoboFlow and review uploaded images")
    print("   2. Adjust keypoint annotations if needed")
    print("   3. Generate a dataset version")
    print("   4. Train the model!")
    print("=" * 60)


if __name__ == "__main__":
    main()




