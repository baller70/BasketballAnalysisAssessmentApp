#!/usr/bin/env python3
"""
Vision AI Dataset Cleaner for Basketball Shooting Images
Scans entire dataset and filters images based on pose detection quality
For future use when cleaning the full 886-image training dataset
"""

import os
import cv2
import mediapipe as mp
import json
import shutil
from pathlib import Path
from typing import List, Dict
import argparse
from tqdm import tqdm
import time

mp_pose = mp.solutions.pose


class DatasetCleaner:
    """Clean basketball dataset by verifying pose detection quality"""
    
    def __init__(self, min_landmarks: int = 20, min_confidence: float = 0.3):
        """
        Initialize dataset cleaner
        
        Args:
            min_landmarks: Minimum visible landmarks required (out of 33)
            min_confidence: Minimum detection confidence (0.0-1.0)
        """
        self.min_landmarks = min_landmarks
        self.min_confidence = min_confidence
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            min_detection_confidence=min_confidence
        )
    
    def test_image(self, image_path: str) -> Dict:
        """
        Test if image passes quality requirements
        
        Args:
            image_path: Path to image
            
        Returns:
            Dictionary with test results
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "path": image_path,
                    "passed": False,
                    "reason": "Could not load image",
                    "visible_landmarks": 0
                }
            
            # Convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(image_rgb)
            
            if not results.pose_landmarks:
                return {
                    "path": image_path,
                    "passed": False,
                    "reason": "No pose detected",
                    "visible_landmarks": 0
                }
            
            # Count visible landmarks
            visible_count = sum(
                1 for lm in results.pose_landmarks.landmark 
                if lm.visibility > 0.5
            )
            
            # Check if meets requirements
            passed = visible_count >= self.min_landmarks
            
            return {
                "path": image_path,
                "passed": passed,
                "reason": "Pass" if passed else f"Only {visible_count}/{self.min_landmarks} landmarks visible",
                "visible_landmarks": visible_count,
                "total_landmarks": len(results.pose_landmarks.landmark)
            }
            
        except Exception as e:
            return {
                "path": image_path,
                "passed": False,
                "reason": str(e),
                "visible_landmarks": 0
            }
    
    def scan_directory(self, directory: str, recursive: bool = True) -> List[str]:
        """
        Find all images in directory
        
        Args:
            directory: Directory to scan
            recursive: Whether to scan subdirectories
            
        Returns:
            List of image paths
        """
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
        images = []
        
        if recursive:
            for root, dirs, files in os.walk(directory):
                for file in files:
                    if Path(file).suffix.lower() in image_extensions:
                        images.append(os.path.join(root, file))
        else:
            for file in os.listdir(directory):
                if Path(file).suffix.lower() in image_extensions:
                    images.append(os.path.join(directory, file))
        
        return sorted(images)
    
    def clean_dataset(self, input_dir: str, output_dir: str = None, 
                     copy_passed: bool = True, save_report: bool = True):
        """
        Clean entire dataset by filtering images
        
        Args:
            input_dir: Directory with images to clean
            output_dir: Directory to copy passing images (if copy_passed=True)
            copy_passed: Whether to copy passing images to output_dir
            save_report: Whether to save detailed report
        """
        print("=" * 80)
        print("🧹 BASKETBALL DATASET CLEANER")
        print("=" * 80)
        print(f"\n📁 Input Directory: {input_dir}")
        print(f"✓ Minimum Landmarks: {self.min_landmarks}/33")
        print(f"✓ Detection Confidence: {self.min_confidence}")
        
        # Find all images
        print("\n🔍 Scanning for images...")
        images = self.scan_directory(input_dir)
        print(f"📸 Found {len(images)} images")
        
        if len(images) == 0:
            print("⚠️  No images found!")
            return
        
        # Test all images
        print("\n⚙️  Testing images...")
        results = []
        passed_count = 0
        failed_count = 0
        
        for image_path in tqdm(images, desc="Processing"):
            result = self.test_image(image_path)
            results.append(result)
            
            if result["passed"]:
                passed_count += 1
            else:
                failed_count += 1
            
            # Small delay to avoid overwhelming MediaPipe
            time.sleep(0.01)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 CLEANING RESULTS")
        print("=" * 80)
        print(f"✅ Passed: {passed_count}/{len(images)} ({passed_count/len(images)*100:.1f}%)")
        print(f"❌ Failed: {failed_count}/{len(images)} ({failed_count/len(images)*100:.1f}%)")
        
        # Show failure reasons
        failure_reasons = {}
        for result in results:
            if not result["passed"]:
                reason = result["reason"]
                failure_reasons[reason] = failure_reasons.get(reason, 0) + 1
        
        if failure_reasons:
            print("\n❌ Failure Breakdown:")
            for reason, count in sorted(failure_reasons.items(), key=lambda x: x[1], reverse=True):
                print(f"   {reason}: {count} images")
        
        # Copy passing images
        if copy_passed and output_dir:
            print(f"\n📦 Copying passing images to: {output_dir}")
            os.makedirs(output_dir, exist_ok=True)
            
            copied = 0
            for result in tqdm([r for r in results if r["passed"]], desc="Copying"):
                source = result["path"]
                filename = Path(source).name
                dest = os.path.join(output_dir, filename)
                
                try:
                    shutil.copy2(source, dest)
                    copied += 1
                except Exception as e:
                    print(f"⚠️  Failed to copy {filename}: {e}")
            
            print(f"✅ Copied {copied} images")
        
        # Save report
        if save_report:
            report_path = os.path.join(
                output_dir or input_dir, 
                "dataset_cleaning_report.json"
            )
            
            report_data = {
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
                "input_directory": input_dir,
                "output_directory": output_dir,
                "total_images": len(images),
                "passed": passed_count,
                "failed": failed_count,
                "pass_rate": round(passed_count / len(images) * 100, 2),
                "min_landmarks": self.min_landmarks,
                "min_confidence": self.min_confidence,
                "failure_reasons": failure_reasons,
                "results": results
            }
            
            with open(report_path, 'w') as f:
                json.dump(report_data, f, indent=2)
            
            print(f"\n💾 Report saved to: {report_path}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        if passed_count / len(images) < 0.5:
            print("   ⚠️  Less than 50% of images passed")
            print("   Consider lowering min_landmarks or min_confidence")
        elif passed_count / len(images) > 0.9:
            print("   ✅ Excellent pass rate!")
            print("   Consider raising standards for higher quality dataset")
        else:
            print("   ✅ Good balance of quality and quantity")
        
        print("\n" + "=" * 80)
    
    def __del__(self):
        """Clean up MediaPipe resources"""
        if hasattr(self, 'pose'):
            self.pose.close()


def main():
    """Command-line interface for dataset cleaner"""
    parser = argparse.ArgumentParser(
        description="Clean basketball shooting dataset using pose detection"
    )
    parser.add_argument(
        "input_dir",
        help="Directory containing images to clean"
    )
    parser.add_argument(
        "--output-dir",
        help="Directory to copy passing images (optional)",
        default=None
    )
    parser.add_argument(
        "--min-landmarks",
        type=int,
        default=20,
        help="Minimum visible landmarks required (default: 20/33)"
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.3,
        help="Minimum detection confidence (default: 0.3)"
    )
    parser.add_argument(
        "--no-copy",
        action="store_true",
        help="Don't copy passing images"
    )
    parser.add_argument(
        "--no-report",
        action="store_true",
        help="Don't save cleaning report"
    )
    
    args = parser.parse_args()
    
    # Create cleaner
    cleaner = DatasetCleaner(
        min_landmarks=args.min_landmarks,
        min_confidence=args.min_confidence
    )
    
    # Clean dataset
    cleaner.clean_dataset(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        copy_passed=not args.no_copy,
        save_report=not args.no_report
    )


if __name__ == "__main__":
    # Example usage
    print("""
🧹 BASKETBALL DATASET CLEANER
==============================

USAGE EXAMPLES:

1. Clean entire training dataset:
   python vision_ai_dataset_cleaner.py /home/ubuntu/basketball_app/training_data/raw_images --output-dir ./cleaned_images

2. Test with stricter requirements:
   python vision_ai_dataset_cleaner.py ./raw_images --output-dir ./cleaned --min-landmarks 28 --min-confidence 0.5

3. Just analyze without copying:
   python vision_ai_dataset_cleaner.py ./raw_images --no-copy

4. Quick test:
   python vision_ai_dataset_cleaner.py ./test_images --min-landmarks 15

PARAMETERS:
- min-landmarks: Minimum visible landmarks (default: 20/33)
  * 15-20: Lenient (more images pass)
  * 20-25: Balanced (recommended)
  * 25-30: Strict (highest quality)
  * 30-33: Very strict (perfect poses only)

- min-confidence: Detection confidence (default: 0.3)
  * 0.1-0.3: Lenient
  * 0.3-0.5: Balanced (recommended)
  * 0.5-0.7: Strict
  * 0.7-0.9: Very strict
""")
    
    # Check if command-line arguments provided
    import sys
    if len(sys.argv) > 1:
        main()
    else:
        print("\n⚠️  No arguments provided. See usage examples above.")
        print("    Or run: python vision_ai_dataset_cleaner.py --help")
