#!/usr/bin/env python3
"""
Dataset Cleaning Script for Basketball Shooting Form Analysis

This script:
1. Scans all images in training_data/
2. Applies smart shooting form filter
3. Organizes rejected images into quarantine by rejection reason
4. Generates comprehensive cleaning report
5. Preserves accepted images for training

Author: Basketball Analysis Team
Date: December 13, 2025
"""

import os
import shutil
from pathlib import Path
from typing import Dict, List
import json
from datetime import datetime
from tqdm import tqdm
import logging
from smart_shooting_form_filter import SmartShootingFormFilter, FilterResult

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dataset_cleaning.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Paths
TRAINING_DATA_DIR = Path("/home/ubuntu/basketball_app/training_data")
QUARANTINE_DIR = Path("/home/ubuntu/basketball_app/training_data_quarantine")
REPORT_DIR = Path("/home/ubuntu/basketball_app/dataset_cleaning_reports")

# Quarantine subdirectories by rejection reason
REJECTION_CATEGORIES = {
    "no_people_detected": "No people detected in image",
    "partial_body": "Full body not visible (missing head or feet)",
    "dribbling_motion": "Dribbling motion detected",
    "not_shooting": "Not in shooting motion",
    "arm_position_unclear": "Arm position unclear",
    "processing_error": "Processing error",
    "failed_to_load": "Failed to load image"
}


class DatasetCleaner:
    """
    Cleans basketball shooting form dataset.
    
    Applies smart filter to identify valid shooting form images
    and quarantine images that don't meet requirements.
    """
    
    def __init__(self, 
                 training_dir: Path = TRAINING_DATA_DIR,
                 quarantine_dir: Path = QUARANTINE_DIR,
                 report_dir: Path = REPORT_DIR):
        """
        Initialize dataset cleaner.
        
        Args:
            training_dir: Directory containing training images
            quarantine_dir: Directory for rejected images
            report_dir: Directory for cleaning reports
        """
        self.training_dir = training_dir
        self.quarantine_dir = quarantine_dir
        self.report_dir = report_dir
        
        # Create directories
        self.quarantine_dir.mkdir(parents=True, exist_ok=True)
        self.report_dir.mkdir(parents=True, exist_ok=True)
        
        # Create quarantine subdirectories
        for category in REJECTION_CATEGORIES.keys():
            (self.quarantine_dir / category).mkdir(parents=True, exist_ok=True)
        
        # Initialize filter
        self.filter = SmartShootingFormFilter(
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Statistics
        self.stats = {
            "total_images": 0,
            "accepted": 0,
            "rejected": 0,
            "rejection_reasons": {cat: 0 for cat in REJECTION_CATEGORIES.keys()},
            "processing_errors": 0,
            "start_time": None,
            "end_time": None,
            "duration_seconds": 0
        }
        
        # Detailed results
        self.accepted_images = []
        self.rejected_images = []
    
    def categorize_rejection(self, result: FilterResult) -> str:
        """
        Categorize rejection reason into predefined categories.
        
        Args:
            result: FilterResult from filter
            
        Returns:
            Category key for organizing rejected images
        """
        reason_lower = result.reason.lower()
        
        if "no people detected" in reason_lower:
            return "no_people_detected"
        elif "full body not visible" in reason_lower or "missing head or feet" in reason_lower:
            return "partial_body"
        elif "dribbling motion" in reason_lower:
            return "dribbling_motion"
        elif "not in shooting motion" in reason_lower:
            return "not_shooting"
        elif "arm position unclear" in reason_lower:
            return "arm_position_unclear"
        elif "processing error" in reason_lower:
            return "processing_error"
        elif "failed to load" in reason_lower:
            return "failed_to_load"
        else:
            # Default to "not_shooting" for unknown reasons
            return "not_shooting"
    
    def clean_dataset(self, dry_run: bool = False) -> Dict:
        """
        Clean the entire dataset.
        
        Args:
            dry_run: If True, don't move files, just analyze
            
        Returns:
            Dictionary with cleaning statistics
        """
        logger.info("="*60)
        logger.info("BASKETBALL DATASET CLEANING")
        logger.info("="*60)
        logger.info(f"Training Directory: {self.training_dir}")
        logger.info(f"Quarantine Directory: {self.quarantine_dir}")
        logger.info(f"Report Directory: {self.report_dir}")
        logger.info(f"Dry Run: {dry_run}")
        logger.info("="*60)
        
        # Record start time
        self.stats["start_time"] = datetime.now().isoformat()
        start_timestamp = datetime.now()
        
        # Find all images
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
        image_files = [
            f for f in self.training_dir.rglob('*')
            if f.is_file() and f.suffix.lower() in image_extensions
        ]
        
        self.stats["total_images"] = len(image_files)
        logger.info(f"\nFound {len(image_files)} images to process\n")
        
        if len(image_files) == 0:
            logger.warning("No images found in training directory!")
            return self.stats
        
        # Process each image
        for img_file in tqdm(image_files, desc="Processing images", unit="img"):
            try:
                # Apply filter
                result = self.filter.filter_image(str(img_file))
                
                if result.accepted:
                    # Keep image in training_data
                    self.stats["accepted"] += 1
                    self.accepted_images.append({
                        "path": str(img_file.relative_to(self.training_dir)),
                        "reason": result.reason,
                        "metadata": result.metadata
                    })
                else:
                    # Quarantine image
                    self.stats["rejected"] += 1
                    category = self.categorize_rejection(result)
                    self.stats["rejection_reasons"][category] += 1
                    
                    self.rejected_images.append({
                        "path": str(img_file.relative_to(self.training_dir)),
                        "reason": result.reason,
                        "category": category,
                        "metadata": result.metadata
                    })
                    
                    # Move to quarantine (if not dry run)
                    if not dry_run:
                        dest_dir = self.quarantine_dir / category
                        dest_file = dest_dir / img_file.name
                        
                        # Handle filename conflicts
                        if dest_file.exists():
                            stem = img_file.stem
                            suffix = img_file.suffix
                            counter = 1
                            while dest_file.exists():
                                dest_file = dest_dir / f"{stem}_{counter}{suffix}"
                                counter += 1
                        
                        shutil.move(str(img_file), str(dest_file))
                
            except Exception as e:
                logger.error(f"Error processing {img_file}: {e}")
                self.stats["processing_errors"] += 1
        
        # Record end time
        self.stats["end_time"] = datetime.now().isoformat()
        end_timestamp = datetime.now()
        self.stats["duration_seconds"] = (end_timestamp - start_timestamp).total_seconds()
        
        # Generate report
        self.generate_report(dry_run)
        
        logger.info("\n" + "="*60)
        logger.info("CLEANING COMPLETE")
        logger.info("="*60)
        logger.info(f"Total Images: {self.stats['total_images']}")
        logger.info(f"Accepted: {self.stats['accepted']} ({self.stats['accepted']/self.stats['total_images']*100:.1f}%)")
        logger.info(f"Rejected: {self.stats['rejected']} ({self.stats['rejected']/self.stats['total_images']*100:.1f}%)")
        logger.info(f"Processing Errors: {self.stats['processing_errors']}")
        logger.info(f"Duration: {self.stats['duration_seconds']:.1f} seconds")
        logger.info("="*60)
        
        return self.stats
    
    def generate_report(self, dry_run: bool = False):
        """
        Generate comprehensive cleaning report.
        
        Args:
            dry_run: Whether this was a dry run
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = self.report_dir / f"cleaning_report_{timestamp}.json"
        report_md_file = self.report_dir / f"cleaning_report_{timestamp}.md"
        
        # JSON report
        report_data = {
            "dry_run": dry_run,
            "statistics": self.stats,
            "accepted_images": self.accepted_images,
            "rejected_images": self.rejected_images
        }
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        logger.info(f"\nJSON report saved to: {report_file}")
        
        # Markdown report
        md_content = self.generate_markdown_report(dry_run)
        with open(report_md_file, 'w') as f:
            f.write(md_content)
        
        logger.info(f"Markdown report saved to: {report_md_file}")
        
        # Also save as DATASET_CLEANING_REPORT.md (latest)
        latest_report = Path("/home/ubuntu/basketball_app/DATASET_CLEANING_REPORT.md")
        with open(latest_report, 'w') as f:
            f.write(md_content)
        
        logger.info(f"Latest report saved to: {latest_report}")
    
    def generate_markdown_report(self, dry_run: bool) -> str:
        """Generate markdown-formatted report"""
        total = self.stats["total_images"]
        accepted = self.stats["accepted"]
        rejected = self.stats["rejected"]
        errors = self.stats["processing_errors"]
        
        md = f"""# Basketball Dataset Cleaning Report

## Executive Summary

**Date**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Dry Run**: {'Yes' if dry_run else 'No'}  
**Duration**: {self.stats['duration_seconds']:.1f} seconds  

### Overall Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Images | {total:,} | 100.0% |
| ✅ Accepted | {accepted:,} | {accepted/total*100:.1f}% |
| ❌ Rejected | {rejected:,} | {rejected/total*100:.1f}% |
| ⚠️ Processing Errors | {errors:,} | {errors/total*100:.1f}% |

---

## Acceptance Criteria

Images were accepted if they met ALL of the following criteria:

1. ✅ **Single basketball player** as main subject (head to toe visible)
2. ✅ **Shooting motion detected** (arms raised, elbow angle > 90°)
3. ✅ **Full body visible** (head, shoulders, hips, feet with visibility > 0.5)
4. ✅ **NOT dribbling** (ball above waist, arm not extended downward)
5. ✅ **NOT layup motion** (vertical alignment, not running)
6. ✅ **Suitable for biomechanical analysis** (clear pose landmarks)

---

## Rejection Breakdown

### By Category

| Category | Count | Percentage | Description |
|----------|-------|------------|-------------|
"""
        
        # Sort rejection reasons by count
        sorted_reasons = sorted(
            self.stats["rejection_reasons"].items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        for category, count in sorted_reasons:
            if count > 0:
                pct = count / rejected * 100 if rejected > 0 else 0
                desc = REJECTION_CATEGORIES.get(category, category)
                md += f"| {category.replace('_', ' ').title()} | {count:,} | {pct:.1f}% | {desc} |\n"
        
        md += """
---

## Detailed Analysis

### Accepted Images Characteristics

"""
        if len(self.accepted_images) > 0:
            # Calculate average metrics from accepted images
            elbow_angles = [
                img["metadata"].get("elbow_angle", 0)
                for img in self.accepted_images
                if img["metadata"].get("elbow_angle") is not None
            ]
            
            box_areas = [
                img["metadata"].get("box_area", 0)
                for img in self.accepted_images
                if img["metadata"].get("box_area") is not None
            ]
            
            if elbow_angles:
                avg_elbow = sum(elbow_angles) / len(elbow_angles)
                md += f"- **Average Elbow Angle**: {avg_elbow:.1f}°\n"
            
            if box_areas:
                avg_area = sum(box_areas) / len(box_areas)
                md += f"- **Average Bounding Box Area**: {avg_area:.3f} (normalized)\n"
            
            md += f"- **Total Accepted**: {len(self.accepted_images):,} images\n"
        else:
            md += "- No images were accepted\n"
        
        md += """
### Sample Accepted Images

"""
        # Show first 10 accepted images
        for img in self.accepted_images[:10]:
            path = img["path"]
            elbow = img["metadata"].get("elbow_angle")
            elbow_str = f"{elbow:.1f}°" if elbow is not None else "N/A"
            md += f"- ✅ `{path}` - Elbow: {elbow_str}\n"
        
        if len(self.accepted_images) > 10:
            md += f"\n*(and {len(self.accepted_images) - 10:,} more)*\n"
        
        md += """
### Sample Rejected Images

"""
        # Show first 10 rejected images from each category
        for category, count in sorted_reasons:
            if count > 0:
                md += f"\n#### {category.replace('_', ' ').title()} ({count:,} images)\n\n"
                
                category_images = [
                    img for img in self.rejected_images
                    if img["category"] == category
                ]
                
                for img in category_images[:5]:
                    path = img["path"]
                    reason = img["reason"]
                    md += f"- ❌ `{path}` - {reason}\n"
                
                if len(category_images) > 5:
                    md += f"\n*(and {len(category_images) - 5:,} more)*\n"
        
        md += """
---

## Recommendations

### For Accepted Images ({accepted:,} images)

1. **Use for Training**: These images meet all requirements for shooting form analysis
2. **Verify Quality**: Spot-check random sample to ensure filter accuracy
3. **Create Test Set**: Select diverse images for model validation

### For Rejected Images ({rejected:,} images)

1. **Review Quarantine**: Manually review quarantined images for false rejections
2. **Improve Dataset**: Consider re-capturing images that don't meet criteria
3. **Adjust Filter**: If too many false rejections, tune filter parameters

### Next Steps

1. ✅ Review this report
2. ✅ Spot-check accepted images (sample of 50-100)
3. ✅ Manually review edge cases in quarantine
4. ✅ Select 5 perfect test images for skeleton overlay testing
5. ✅ Update configuration files with image requirements
6. ✅ Generate visual requirements guide

---

## Technical Details

### Filter Configuration

- **Model Complexity**: 1 (MediaPipe Pose)
- **Min Detection Confidence**: 0.5
- **Min Tracking Confidence**: 0.5
- **Shooting Elbow Angle Min**: 90°
- **Dribbling Elbow Angle Max**: 80°
- **Min Landmark Visibility**: 0.5

### File Organization

**Training Data**: `/home/ubuntu/basketball_app/training_data/`  
**Quarantine**: `/home/ubuntu/basketball_app/training_data_quarantine/`  
**Reports**: `/home/ubuntu/basketball_app/dataset_cleaning_reports/`

### Quarantine Structure

```
training_data_quarantine/
├── no_people_detected/
├── partial_body/
├── dribbling_motion/
├── not_shooting/
├── arm_position_unclear/
├── processing_error/
└── failed_to_load/
```

---

## Appendix: Image Requirements

### User's Exact Specification

"an image featuring a single basketball player, captured from head to toe, focusing solely on their shooting form. The player should be the main object in the frame, with no other players or distractions, except in cases where other players are present in the scene; in such cases, center the focus on the designated player for analysis. If the image is a game photo, ensure it depicts only a single player actively engaged in shooting the basketball, not dribbling or performing layups. The composition must highlight the player's shooting posture, stance, and arm mechanics, suitable for detailed analysis of shooting technique."

### Key Requirements

1. Single basketball player (head to toe)
2. Shooting form focus (arms raised)
3. Player as main object in frame
4. Other players acceptable IF focus is on one designated player
5. Game photos must show ONLY shooting (NOT dribbling, NOT layups)
6. Highlights: shooting posture, stance, arm mechanics

---

**Report Generated**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Script Version**: 1.0  
**Filter**: SmartShootingFormFilter v1.0
"""
        
        return md.format(accepted=accepted, rejected=rejected, total=total)


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean basketball shooting form dataset")
    parser.add_argument("--dry-run", action="store_true", help="Analyze without moving files")
    parser.add_argument("--training-dir", type=str, default=str(TRAINING_DATA_DIR), 
                        help="Training data directory")
    parser.add_argument("--quarantine-dir", type=str, default=str(QUARANTINE_DIR),
                        help="Quarantine directory")
    parser.add_argument("--report-dir", type=str, default=str(REPORT_DIR),
                        help="Report directory")
    
    args = parser.parse_args()
    
    # Initialize cleaner
    cleaner = DatasetCleaner(
        training_dir=Path(args.training_dir),
        quarantine_dir=Path(args.quarantine_dir),
        report_dir=Path(args.report_dir)
    )
    
    # Clean dataset
    stats = cleaner.clean_dataset(dry_run=args.dry_run)
    
    # Print summary
    print("\n" + "="*60)
    print("CLEANING SUMMARY")
    print("="*60)
    print(f"Total Images: {stats['total_images']:,}")
    print(f"Accepted: {stats['accepted']:,} ({stats['accepted']/stats['total_images']*100:.1f}%)")
    print(f"Rejected: {stats['rejected']:,} ({stats['rejected']/stats['total_images']*100:.1f}%)")
    print(f"Duration: {stats['duration_seconds']:.1f} seconds")
    print("="*60)


if __name__ == "__main__":
    main()
