#!/usr/bin/env python3
"""
Generate comprehensive statistics for basketball training dataset
"""
import os
import json
from pathlib import Path
from collections import defaultdict
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np

BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
OUTPUT_DIR = BASE_DIR / "statistics"
OUTPUT_DIR.mkdir(exist_ok=True)

class DatasetStatistics:
    def __init__(self):
        self.stats = {
            "total_images": 0,
            "by_category": defaultdict(int),
            "by_subcategory": defaultdict(int),
            "resolutions": [],
            "aspect_ratios": [],
            "file_sizes": [],
            "formats": defaultdict(int)
        }
    
    def analyze_image(self, image_path, category, subcategory):
        """Analyze single image"""
        try:
            # Basic stats
            self.stats["total_images"] += 1
            self.stats["by_category"][category] += 1
            self.stats["by_subcategory"][f"{category}/{subcategory}"] += 1
            
            # File size
            file_size = image_path.stat().st_size / (1024 * 1024)  # MB
            self.stats["file_sizes"].append(file_size)
            
            # Image format
            ext = image_path.suffix.lower()
            self.stats["formats"][ext] += 1
            
            # Image properties
            img = Image.open(image_path)
            width, height = img.size
            
            self.stats["resolutions"].append((width, height))
            self.stats["aspect_ratios"].append(width / height)
            
            return True
        except Exception as e:
            print(f"Error analyzing {image_path}: {e}")
            return False
    
    def analyze_dataset(self):
        """Analyze entire dataset"""
        print("Analyzing Basketball Training Dataset")
        print("="*60)
        
        categories = ["shooting_form_keypoints", "form_quality_classifier", "ball_trajectory"]
        
        for category in categories:
            category_path = BASE_DIR / category
            if not category_path.exists():
                continue
            
            for subcategory_path in category_path.iterdir():
                if not subcategory_path.is_dir():
                    continue
                
                subcategory = subcategory_path.name
                print(f"Analyzing {category}/{subcategory}...")
                
                for img_file in subcategory_path.glob("*"):
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        self.analyze_image(img_file, category, subcategory)
        
        print(f"\n✓ Analyzed {self.stats['total_images']} images")
    
    def generate_summary(self):
        """Generate text summary"""
        summary = []
        summary.append("="*60)
        summary.append("BASKETBALL TRAINING DATASET STATISTICS")
        summary.append("="*60)
        summary.append("")
        
        # Total images
        summary.append(f"Total Images: {self.stats['total_images']:,}")
        summary.append("")
        
        # By category
        summary.append("Images by Category:")
        for category, count in sorted(self.stats["by_category"].items()):
            percentage = (count / self.stats["total_images"]) * 100
            summary.append(f"  {category}: {count:,} ({percentage:.1f}%)")
        summary.append("")
        
        # By subcategory
        summary.append("Images by Subcategory:")
        for subcategory, count in sorted(self.stats["by_subcategory"].items()):
            summary.append(f"  {subcategory}: {count:,}")
        summary.append("")
        
        # Resolution stats
        if self.stats["resolutions"]:
            widths = [r[0] for r in self.stats["resolutions"]]
            heights = [r[1] for r in self.stats["resolutions"]]
            
            summary.append("Resolution Statistics:")
            summary.append(f"  Average: {np.mean(widths):.0f}x{np.mean(heights):.0f}")
            summary.append(f"  Median: {np.median(widths):.0f}x{np.median(heights):.0f}")
            summary.append(f"  Min: {min(widths)}x{min(heights)}")
            summary.append(f"  Max: {max(widths)}x{max(heights)}")
            summary.append("")
        
        # Aspect ratio stats
        if self.stats["aspect_ratios"]:
            summary.append("Aspect Ratio Statistics:")
            summary.append(f"  Average: {np.mean(self.stats['aspect_ratios']):.2f}")
            summary.append(f"  Median: {np.median(self.stats['aspect_ratios']):.2f}")
            summary.append("")
        
        # File size stats
        if self.stats["file_sizes"]:
            total_size = sum(self.stats["file_sizes"])
            summary.append("File Size Statistics:")
            summary.append(f"  Total: {total_size:.2f} MB ({total_size/1024:.2f} GB)")
            summary.append(f"  Average: {np.mean(self.stats['file_sizes']):.2f} MB")
            summary.append(f"  Median: {np.median(self.stats['file_sizes']):.2f} MB")
            summary.append("")
        
        # File formats
        summary.append("File Formats:")
        for fmt, count in sorted(self.stats["formats"].items()):
            percentage = (count / self.stats["total_images"]) * 100
            summary.append(f"  {fmt}: {count:,} ({percentage:.1f}%)")
        summary.append("")
        
        summary.append("="*60)
        
        return "\\n".join(summary)
    
    def save_results(self):
        """Save statistics to files"""
        # Save summary text
        summary_text = self.generate_summary()
        with open(OUTPUT_DIR / "dataset_statistics.txt", "w") as f:
            f.write(summary_text)
        
        print(summary_text)
        
        # Save JSON
        json_stats = {
            "total_images": self.stats["total_images"],
            "by_category": dict(self.stats["by_category"]),
            "by_subcategory": dict(self.stats["by_subcategory"]),
            "formats": dict(self.stats["formats"]),
            "resolution_stats": {
                "average_width": float(np.mean([r[0] for r in self.stats["resolutions"]])),
                "average_height": float(np.mean([r[1] for r in self.stats["resolutions"]])),
            } if self.stats["resolutions"] else {},
            "file_size_stats": {
                "total_mb": float(sum(self.stats["file_sizes"])),
                "average_mb": float(np.mean(self.stats["file_sizes"])),
            } if self.stats["file_sizes"] else {}
        }
        
        with open(OUTPUT_DIR / "dataset_statistics.json", "w") as f:
            json.dump(json_stats, f, indent=2)
        
        print(f"\n✓ Statistics saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    stats = DatasetStatistics()
    stats.analyze_dataset()
    stats.save_results()
