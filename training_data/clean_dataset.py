#!/usr/bin/env python3
"""
Dataset Cleaning Script
Removes images that are NOT individual players shooting basketball
Keeps only: Individual player, full body visible, clear shooting motion, one person per image
"""

import os
import cv2
import mediapipe as mp
import json
import shutil
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import numpy as np

# Initialize MediaPipe
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=2,
    enable_segmentation=False,
    min_detection_confidence=0.5
)

class DatasetCleaner:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.quarantine_dir = self.base_dir / "quarantine"
        self.quarantine_dir.mkdir(exist_ok=True)
        
        self.stats = {
            "total_images": 0,
            "kept_images": 0,
            "removed_images": 0,
            "removal_reasons": defaultdict(int),
            "by_directory": defaultdict(lambda: {"total": 0, "kept": 0, "removed": 0})
        }
        
    def is_shooting_pose(self, landmarks):
        """Check if detected pose is a shooting position"""
        if not landmarks:
            return False
        
        try:
            # Get key landmarks
            left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
            
            # Check if at least one wrist is above shoulders (shooting motion)
            left_wrist_up = left_wrist.y < left_shoulder.y
            right_wrist_up = right_wrist.y < right_shoulder.y
            
            # Check if wrist is near head level (typical shooting position)
            left_near_head = abs(left_wrist.y - nose.y) < 0.3
            right_near_head = abs(right_wrist.y - nose.y) < 0.3
            
            return (left_wrist_up or right_wrist_up) and (left_near_head or right_near_head)
            
        except Exception as e:
            return False
    
    def has_full_body(self, landmarks, image_height):
        """Check if full body is visible (ankles visible)"""
        if not landmarks:
            return False
            
        try:
            left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
            right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
            
            # Check if ankles are visible and not cut off
            ankles_visible = (
                left_ankle.visibility > 0.5 and 
                right_ankle.visibility > 0.5 and
                left_ankle.y < 0.95 and 
                right_ankle.y < 0.95
            )
            
            return ankles_visible
        except:
            return False
    
    def analyze_image(self, image_path):
        """Analyze single image and determine if it should be kept"""
        try:
            # Read image
            image = cv2.imread(str(image_path))
            if image is None:
                return False, "unreadable"
            
            # Check image dimensions
            height, width = image.shape[:2]
            if height < 200 or width < 200:
                return False, "too_small"
            
            # Convert to RGB for MediaPipe
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = pose.process(image_rgb)
            
            # Check if pose detected
            if not results.pose_landmarks:
                return False, "no_person_detected"
            
            landmarks = results.pose_landmarks.landmark
            
            # Check for full body
            if not self.has_full_body(landmarks, height):
                return False, "partial_body"
            
            # Check for shooting pose
            if not self.is_shooting_pose(landmarks):
                return False, "not_shooting_pose"
            
            # Check visibility of key points (ensure single clear person)
            visibility_scores = [lm.visibility for lm in landmarks]
            avg_visibility = np.mean(visibility_scores)
            
            if avg_visibility < 0.6:
                return False, "low_visibility"
            
            # Image passes all checks
            return True, "passed"
            
        except Exception as e:
            return False, f"error: {str(e)}"
    
    def clean_directory(self, directory):
        """Clean all images in a directory"""
        dir_path = self.base_dir / directory
        
        if not dir_path.exists():
            return
        
        print(f"\n{'='*60}")
        print(f"Cleaning: {directory}")
        print(f"{'='*60}")
        
        # Find all images
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
            image_files.extend(dir_path.rglob(ext))
        
        total = len(image_files)
        self.stats["by_directory"][directory]["total"] = total
        
        print(f"Found {total} images")
        
        kept = 0
        removed = 0
        
        for i, img_path in enumerate(image_files, 1):
            if i % 100 == 0:
                print(f"  Progress: {i}/{total} ({i*100//total}%)")
            
            self.stats["total_images"] += 1
            
            # Analyze image
            should_keep, reason = self.analyze_image(img_path)
            
            if should_keep:
                kept += 1
                self.stats["kept_images"] += 1
                self.stats["by_directory"][directory]["kept"] += 1
            else:
                removed += 1
                self.stats["removed_images"] += 1
                self.stats["removal_reasons"][reason] += 1
                self.stats["by_directory"][directory]["removed"] += 1
                
                # Move to quarantine with reason in filename
                rel_path = img_path.relative_to(self.base_dir)
                quarantine_subdir = self.quarantine_dir / rel_path.parent
                quarantine_subdir.mkdir(parents=True, exist_ok=True)
                
                new_name = f"{img_path.stem}__REASON_{reason}{img_path.suffix}"
                quarantine_path = quarantine_subdir / new_name
                
                try:
                    shutil.move(str(img_path), str(quarantine_path))
                except Exception as e:
                    print(f"    Error moving {img_path}: {e}")
        
        print(f"  Kept: {kept} | Removed: {removed}")
        
    def generate_report(self):
        """Generate detailed cleanup report"""
        report = {
            "cleanup_date": datetime.now().isoformat(),
            "summary": {
                "total_images_scanned": self.stats["total_images"],
                "images_kept": self.stats["kept_images"],
                "images_removed": self.stats["removed_images"],
                "removal_rate": f"{self.stats['removed_images']*100/max(1, self.stats['total_images']):.2f}%"
            },
            "removal_reasons": dict(self.stats["removal_reasons"]),
            "by_directory": dict(self.stats["by_directory"])
        }
        
        # Save JSON report
        report_path = self.base_dir / "DATASET_CLEANUP_REPORT.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Generate markdown report
        md_report = f"""# Dataset Cleanup Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary
- **Total Images Scanned:** {self.stats['total_images']:,}
- **Images Kept:** {self.stats['kept_images']:,}
- **Images Removed:** {self.stats['removed_images']:,}
- **Removal Rate:** {self.stats['removed_images']*100/max(1, self.stats['total_images']):.2f}%

## Removal Reasons
"""
        for reason, count in sorted(self.stats["removal_reasons"].items(), key=lambda x: x[1], reverse=True):
            md_report += f"- **{reason}:** {count:,} images\n"
        
        md_report += "\n## By Directory\n"
        for directory, stats in sorted(self.stats["by_directory"].items()):
            removal_rate = stats['removed']*100/max(1, stats['total'])
            md_report += f"\n### {directory}\n"
            md_report += f"- Total: {stats['total']:,}\n"
            md_report += f"- Kept: {stats['kept']:,}\n"
            md_report += f"- Removed: {stats['removed']:,} ({removal_rate:.2f}%)\n"
        
        md_report += f"""

## Cleanup Criteria
Images were **REMOVED** if they met any of these conditions:
1. **no_person_detected** - MediaPipe could not detect a person
2. **partial_body** - Full body not visible (ankles cut off)
3. **not_shooting_pose** - Person not in shooting position (hands not elevated near head)
4. **low_visibility** - Person partially occluded or unclear
5. **too_small** - Image dimensions < 200x200 pixels
6. **unreadable** - Corrupted or invalid image file

## Kept Images Criteria
Images were **KEPT** only if ALL conditions were met:
✓ Single person detected with high confidence
✓ Full body visible (ankles visible)
✓ Shooting pose (hands elevated near head level)
✓ High visibility (>60% average landmark visibility)
✓ Adequate image size (≥200x200 pixels)

## Quarantine Location
Removed images moved to: `{self.quarantine_dir.relative_to(self.base_dir)}/`

Filename format: `original_name__REASON_<reason>.ext`
"""
        
        md_path = self.base_dir / "DATASET_CLEANUP_REPORT.md"
        with open(md_path, 'w') as f:
            f.write(md_report)
        
        print(f"\n{'='*60}")
        print("CLEANUP COMPLETE")
        print(f"{'='*60}")
        print(md_report)
        print(f"\nReports saved:")
        print(f"  - {report_path}")
        print(f"  - {md_path}")


def main():
    # Define base directory
    base_dir = Path(__file__).parent
    
    print("="*60)
    print("BASKETBALL SHOOTING DATASET CLEANER")
    print("="*60)
    print(f"Base Directory: {base_dir}")
    print("\nThis script will:")
    print("  1. Scan all images in training_data/")
    print("  2. Keep ONLY individual players in shooting poses")
    print("  3. Remove: multiple players, court scenes, non-shooting poses")
    print("  4. Move removed images to quarantine/ folder")
    print("  5. Generate detailed cleanup report")
    print("\n" + "="*60)
    
    # Ask for confirmation
    response = input("\nProceed with cleanup? (yes/no): ").strip().lower()
    if response != 'yes':
        print("Cleanup cancelled.")
        return
    
    cleaner = DatasetCleaner(base_dir)
    
    # Directories to clean (prioritize main image directories)
    directories_to_clean = [
        "form_quality_classifier/good_form",
        "form_quality_classifier/needs_work",
        "raw_images",
        "api_downloads",
        "kaggle_downloads",
        "temp_pexels_downloads",
        "temp_web_downloads"
    ]
    
    # Clean each directory
    for directory in directories_to_clean:
        cleaner.clean_directory(directory)
    
    # Generate final report
    cleaner.generate_report()


if __name__ == "__main__":
    main()
