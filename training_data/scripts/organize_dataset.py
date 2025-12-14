#!/usr/bin/env python3
"""
Organize basketball training dataset into structured folders
"""
import os
import shutil
from pathlib import Path
import json
from collections import defaultdict
import hashlib
from PIL import Image
import imagehash

# Directories
RAW_DIR = Path("/home/ubuntu/basketball_app/training_data/raw_downloads")
ORGANIZED_DIR = Path("/home/ubuntu/basketball_app/training_data")

# Target structure
STRUCTURE = {
    "shooting_form_keypoints": ["professional", "amateur", "front_view", "side_view", "45_degree"],
    "form_quality_classifier": ["excellent_form", "good_form", "needs_work", "poor_form"],
    "ball_trajectory": ["jump_shots", "free_throws", "various_angles"]
}

class DatasetOrganizer:
    def __init__(self):
        self.stats = defaultdict(int)
        self.duplicates = set()
        self.image_hashes = {}
        
    def calculate_image_hash(self, image_path):
        """Calculate perceptual hash of image for duplicate detection"""
        try:
            img = Image.open(image_path)
            return str(imagehash.average_hash(img))
        except Exception as e:
            print(f"Error hashing {image_path}: {e}")
            return None
    
    def is_duplicate(self, image_path):
        """Check if image is a duplicate"""
        img_hash = self.calculate_image_hash(image_path)
        if img_hash is None:
            return False
        
        if img_hash in self.image_hashes:
            self.duplicates.add(image_path)
            return True
        
        self.image_hashes[img_hash] = image_path
        return False
    
    def get_image_quality(self, image_path):
        """Assess image quality (resolution, aspect ratio)"""
        try:
            img = Image.open(image_path)
            width, height = img.size
            
            # Quality criteria
            is_high_res = min(width, height) >= 720  # At least 720p
            is_good_aspect = 0.5 <= width/height <= 2.0  # Not too stretched
            
            return {
                "width": width,
                "height": height,
                "is_high_quality": is_high_res and is_good_aspect
            }
        except Exception as e:
            print(f"Error checking quality of {image_path}: {e}")
            return None
    
    def categorize_image(self, image_path, source_dataset):
        """Determine which category an image belongs to"""
        path_str = str(image_path).lower()
        
        # Basketball-specific images
        if "basketball" in path_str or "shooting" in path_str:
            # Prefer shooting form keypoints
            if any(keyword in path_str for keyword in ["shooting", "form", "pose", "player"]):
                return "shooting_form_keypoints/professional"
            elif "ball" in path_str:
                return "ball_trajectory/various_angles"
        
        # Pose estimation images -> shooting form keypoints
        if source_dataset == "pose_estimation":
            return "shooting_form_keypoints/amateur"
        
        # Basketball tracking -> ball trajectory
        if source_dataset == "basketball_tracking":
            return "ball_trajectory/jump_shots"
        
        # NBA players -> form quality
        if source_dataset == "nba_players":
            return "shooting_form_keypoints/professional"
        
        # DeepSport/shooting simulation -> various
        if source_dataset in ["archive (3)", "deepsport"]:
            return "shooting_form_keypoints/professional"
        
        # Sports balls -> ball trajectory
        if "basketball" in path_str and source_dataset == "sports_balls":
            return "ball_trajectory/various_angles"
        
        # Default
        return "shooting_form_keypoints/amateur"
    
    def organize_dataset(self):
        """Main organization function"""
        print("Basketball Dataset Organizer")
        print("="*60)
        
        # Find all images
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
        all_images = []
        
        for root, dirs, files in os.walk(RAW_DIR):
            for file in files:
                if Path(file).suffix.lower() in image_extensions:
                    all_images.append(Path(root) / file)
        
        print(f"Found {len(all_images)} total images")
        
        # Process images
        processed = 0
        skipped_duplicates = 0
        skipped_low_quality = 0
        
        for img_path in all_images:
            # Check for duplicates
            if self.is_duplicate(img_path):
                skipped_duplicates += 1
                continue
            
            # Check quality
            quality = self.get_image_quality(img_path)
            if quality and not quality["is_high_quality"]:
                # Still include lower quality images, but track them
                pass
            
            # Determine source dataset
            source_dataset = img_path.parts[7] if len(img_path.parts) > 7 else "unknown"
            
            # Categorize
            category = self.categorize_image(img_path, source_dataset)
            
            # Copy to organized location
            dest_dir = ORGANIZED_DIR / category
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            # Create unique filename
            base_name = f"{source_dataset}_{img_path.stem}"
            dest_path = dest_dir / f"{base_name}{img_path.suffix}"
            
            # Handle naming conflicts
            counter = 1
            while dest_path.exists():
                dest_path = dest_dir / f"{base_name}_{counter}{img_path.suffix}"
                counter += 1
            
            # Copy file
            try:
                shutil.copy2(img_path, dest_path)
                self.stats[category] += 1
                processed += 1
                
                if processed % 100 == 0:
                    print(f"Processed {processed} images...")
            except Exception as e:
                print(f"Error copying {img_path}: {e}")
        
        # Print summary
        print("\n" + "="*60)
        print("ORGANIZATION SUMMARY")
        print("="*60)
        print(f"Total images found: {len(all_images)}")
        print(f"Successfully processed: {processed}")
        print(f"Skipped (duplicates): {skipped_duplicates}")
        print(f"Skipped (low quality): {skipped_low_quality}")
        
        print("\nImages per category:")
        for category, count in sorted(self.stats.items()):
            print(f"  {category}: {count}")
        
        return self.stats

if __name__ == "__main__":
    organizer = DatasetOrganizer()
    stats = organizer.organize_dataset()
    
    # Save stats to JSON
    stats_file = ORGANIZED_DIR / "organization_stats.json"
    with open(stats_file, "w") as f:
        json.dump(dict(stats), f, indent=2)
    
    print(f"\nStats saved to: {stats_file}")
