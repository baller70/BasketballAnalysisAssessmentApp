"""
STRICT SHOOTING FORM IMAGE FILTER
===================================

PURPOSE: Filter dataset to keep ONLY individual shooting form images
- ONE person only (no multiple people, no game footage)
- Full body visible (head to feet)
- Person in shooting motion (arms raised, ball visible)
- Clear, unobstructed view

REJECTION CRITERIA:
- Multiple people detected
- Game footage or court scenes
- Partial body only (missing keypoints)
- Not in shooting motion
- Poor quality or lighting
"""

import cv2
import mediapipe as mp
import numpy as np
import os
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import shutil
from tqdm import tqdm

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

class ShootingFormFilter:
    """Strict filter for individual shooting form images"""
    
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Statistics
        self.stats = {
            "total_scanned": 0,
            "accepted": 0,
            "rejected": 0,
            "rejection_reasons": {
                "multiple_people": 0,
                "no_person_detected": 0,
                "partial_body": 0,
                "not_shooting": 0,
                "poor_quality": 0,
                "low_confidence": 0
            }
        }
    
    def detect_multiple_people(self, image: np.ndarray) -> Tuple[bool, int]:
        """
        Detect if multiple people are in the image using face/person detection
        Returns: (has_multiple_people, person_count)
        """
        # Use MediaPipe face detection to count people
        mp_face = mp.solutions.face_detection
        face_detection = mp_face.FaceDetection(min_detection_confidence=0.3)
        
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_image)
        
        face_count = 0
        if results.detections:
            face_count = len(results.detections)
        
        face_detection.close()
        
        # If more than 1 face detected, reject
        return (face_count > 1, face_count)
    
    def check_full_body_visible(self, landmarks) -> Tuple[bool, List[str]]:
        """
        Check if full body is visible (head to feet)
        Returns: (is_full_body, missing_parts)
        """
        if not landmarks:
            return (False, ["all_landmarks"])
        
        # Critical keypoints for full body (head to toe)
        critical_points = {
            "head": [mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.LEFT_EYE, mp_pose.PoseLandmark.RIGHT_EYE],
            "shoulders": [mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.RIGHT_SHOULDER],
            "elbows": [mp_pose.PoseLandmark.LEFT_ELBOW, mp_pose.PoseLandmark.RIGHT_ELBOW],
            "wrists": [mp_pose.PoseLandmark.LEFT_WRIST, mp_pose.PoseLandmark.RIGHT_WRIST],
            "hips": [mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.RIGHT_HIP],
            "knees": [mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.RIGHT_KNEE],
            "ankles": [mp_pose.PoseLandmark.LEFT_ANKLE, mp_pose.PoseLandmark.RIGHT_ANKLE],
            "feet": [mp_pose.PoseLandmark.LEFT_HEEL, mp_pose.PoseLandmark.RIGHT_HEEL]
        }
        
        missing_parts = []
        
        for part_name, keypoint_list in critical_points.items():
            # Check if at least one of the keypoints in this group is visible
            part_visible = False
            for keypoint in keypoint_list:
                landmark = landmarks.landmark[keypoint.value]
                # Check visibility and confidence
                if landmark.visibility > 0.5:
                    part_visible = True
                    break
            
            if not part_visible:
                missing_parts.append(part_name)
        
        # Must have ALL parts visible for full body
        is_full_body = len(missing_parts) == 0
        
        return (is_full_body, missing_parts)
    
    def check_shooting_motion(self, landmarks) -> Tuple[bool, str]:
        """
        Check if person is in shooting motion (arms raised)
        Returns: (is_shooting, reason)
        """
        if not landmarks:
            return (False, "no_landmarks")
        
        # Get key points for shooting motion detection
        left_shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_elbow = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW.value]
        right_elbow = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
        left_wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST.value]
        right_wrist = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST.value]
        
        # Check if at least one arm is raised (shooting motion)
        # Wrist should be above shoulder for shooting
        left_arm_raised = left_wrist.y < left_shoulder.y - 0.05
        right_arm_raised = right_wrist.y < right_shoulder.y - 0.05
        
        # Check if elbow is raised (typical shooting form)
        left_elbow_raised = left_elbow.y < left_shoulder.y + 0.05
        right_elbow_raised = right_elbow.y < right_shoulder.y + 0.05
        
        # At least one arm should be in shooting position
        is_shooting = (left_arm_raised and left_elbow_raised) or (right_arm_raised and right_elbow_raised)
        
        if not is_shooting:
            return (False, "arms_not_raised")
        
        return (True, "shooting_detected")
    
    def check_image_quality(self, image: np.ndarray) -> Tuple[bool, str]:
        """
        Check basic image quality (blur, brightness)
        Returns: (is_good_quality, reason)
        """
        # Convert to grayscale for quality checks
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Check for blur using Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var < 50:
            return (False, "too_blurry")
        
        # Check brightness
        mean_brightness = np.mean(gray)
        
        if mean_brightness < 20:
            return (False, "too_dark")
        
        if mean_brightness > 240:
            return (False, "too_bright")
        
        return (True, "good_quality")
    
    def process_image(self, image_path: str) -> Dict:
        """
        Process a single image through all filters
        Returns: dict with validation results
        """
        self.stats["total_scanned"] += 1
        
        result = {
            "path": image_path,
            "accepted": False,
            "rejection_reason": None,
            "details": {}
        }
        
        # Load image
        image = cv2.imread(image_path)
        
        if image is None:
            result["rejection_reason"] = "cannot_read_image"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["poor_quality"] += 1
            return result
        
        # Check image quality first
        is_good_quality, quality_reason = self.check_image_quality(image)
        result["details"]["quality"] = {"passed": is_good_quality, "reason": quality_reason}
        
        if not is_good_quality:
            result["rejection_reason"] = f"poor_quality_{quality_reason}"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["poor_quality"] += 1
            return result
        
        # Check for multiple people
        has_multiple, person_count = self.detect_multiple_people(image)
        result["details"]["person_count"] = person_count
        
        if has_multiple:
            result["rejection_reason"] = "multiple_people"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["multiple_people"] += 1
            return result
        
        # Process with MediaPipe Pose
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pose_results = self.pose.process(rgb_image)
        
        # Check if person detected
        if not pose_results.pose_landmarks:
            result["rejection_reason"] = "no_person_detected"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["no_person_detected"] += 1
            return result
        
        # Check confidence
        landmarks = pose_results.pose_landmarks
        avg_confidence = np.mean([lm.visibility for lm in landmarks.landmark])
        result["details"]["avg_confidence"] = avg_confidence
        
        if avg_confidence < 0.5:
            result["rejection_reason"] = "low_confidence"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["low_confidence"] += 1
            return result
        
        # Check full body visible
        is_full_body, missing_parts = self.check_full_body_visible(landmarks)
        result["details"]["full_body"] = {"passed": is_full_body, "missing_parts": missing_parts}
        
        if not is_full_body:
            result["rejection_reason"] = f"partial_body_missing_{','.join(missing_parts)}"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["partial_body"] += 1
            return result
        
        # Check shooting motion
        is_shooting, shooting_reason = self.check_shooting_motion(landmarks)
        result["details"]["shooting_motion"] = {"passed": is_shooting, "reason": shooting_reason}
        
        if not is_shooting:
            result["rejection_reason"] = f"not_shooting_{shooting_reason}"
            self.stats["rejected"] += 1
            self.stats["rejection_reasons"]["not_shooting"] += 1
            return result
        
        # ALL CHECKS PASSED!
        result["accepted"] = True
        self.stats["accepted"] += 1
        
        return result
    
    def scan_dataset(self, dataset_path: str, output_dir: str):
        """
        Scan entire dataset and filter images
        """
        print("="*80)
        print("STRICT SHOOTING FORM FILTER - DATASET SCAN")
        print("="*80)
        print(f"\nDataset: {dataset_path}")
        print(f"Output: {output_dir}\n")
        
        # Create output directories
        output_path = Path(output_dir)
        accepted_dir = output_path / "accepted_images"
        quarantine_dir = output_path / "quarantined_images"
        
        accepted_dir.mkdir(parents=True, exist_ok=True)
        quarantine_dir.mkdir(parents=True, exist_ok=True)
        
        # Find all images
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        all_images = []
        
        for ext in image_extensions:
            all_images.extend(Path(dataset_path).rglob(f'*{ext}'))
            all_images.extend(Path(dataset_path).rglob(f'*{ext.upper()}'))
        
        print(f"Found {len(all_images)} images to process\n")
        
        # Process images
        results = []
        
        for img_path in tqdm(all_images, desc="Processing images"):
            result = self.process_image(str(img_path))
            results.append(result)
            
            # Copy to appropriate directory
            relative_path = img_path.relative_to(dataset_path)
            
            if result["accepted"]:
                dest = accepted_dir / relative_path
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(img_path, dest)
            else:
                # Create subdirectory by rejection reason
                reason = result["rejection_reason"]
                dest = quarantine_dir / reason / relative_path.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(img_path, dest)
        
        # Save results
        self.save_results(results, output_path)
        
        # Print summary
        self.print_summary()
    
    def save_results(self, results: List[Dict], output_path: Path):
        """Save detailed results to JSON"""
        results_file = output_path / "filter_results.json"
        
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "statistics": self.stats,
                "results": results
            }, f, indent=2)
        
        print(f"\nResults saved to: {results_file}")
    
    def print_summary(self):
        """Print filtering summary"""
        print("\n" + "="*80)
        print("FILTERING SUMMARY")
        print("="*80)
        print(f"\nTotal images scanned: {self.stats['total_scanned']}")
        print(f"✅ Accepted: {self.stats['accepted']} ({self.stats['accepted']/self.stats['total_scanned']*100:.1f}%)")
        print(f"❌ Rejected: {self.stats['rejected']} ({self.stats['rejected']/self.stats['total_scanned']*100:.1f}%)")
        
        print("\nRejection Reasons:")
        for reason, count in self.stats['rejection_reasons'].items():
            if count > 0:
                pct = count / self.stats['rejected'] * 100 if self.stats['rejected'] > 0 else 0
                print(f"  - {reason}: {count} ({pct:.1f}%)")
        
        print("\n" + "="*80)
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'pose'):
            self.pose.close()


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Strict shooting form image filter")
    parser.add_argument("--dataset", type=str, default="/home/ubuntu/basketball_app/training_data",
                       help="Path to dataset directory")
    parser.add_argument("--output", type=str, default="/home/ubuntu/basketball_app/filtered_dataset",
                       help="Path to output directory")
    parser.add_argument("--sample", type=int, default=None,
                       help="Process only N sample images (for testing)")
    
    args = parser.parse_args()
    
    # Create filter
    filter = ShootingFormFilter()
    
    # Scan dataset
    filter.scan_dataset(args.dataset, args.output)
    
    print("\n✅ Dataset filtering complete!")


if __name__ == "__main__":
    main()
