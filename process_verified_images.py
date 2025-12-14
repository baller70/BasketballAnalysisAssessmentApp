#!/usr/bin/env python3
"""
Process Verified Basketball Shooting Images with MediaPipe
Generates proper test outputs with skeleton overlays and angle measurements
"""

import os
import cv2
import mediapipe as mp
import numpy as np
import json
import shutil
from pathlib import Path
from typing import Dict, List, Tuple
import math

# MediaPipe setup
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def calculate_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
    """
    Calculate angle between three points
    
    Args:
        a, b, c: Points as (x, y) tuples
        
    Returns:
        Angle in degrees
    """
    radians = math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(a[1] - b[1], a[0] - b[0])
    angle = abs(radians * 180.0 / math.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle


def detect_pose_and_annotate(image_path: str, output_dir: str) -> Dict:
    """
    Detect pose and create annotated outputs
    
    Args:
        image_path: Path to input image
        output_dir: Directory for outputs
        
    Returns:
        Dictionary with analysis results
    """
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        return {"error": "Could not load image"}
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Initialize MediaPipe Pose
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        enable_segmentation=False,
        min_detection_confidence=0.5
    ) as pose:
        # Process image
        results = pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return {"error": "No pose detected"}
        
        # Create annotated image
        annotated_image = image.copy()
        
        # Draw pose landmarks
        mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
        )
        
        # Extract key landmarks
        landmarks = results.pose_landmarks.landmark
        height, width = image.shape[:2]
        
        # Get shooting arm keypoints (assuming right-handed shooter)
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
        right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
        
        # Convert to pixel coordinates
        shoulder_pos = (int(right_shoulder.x * width), int(right_shoulder.y * height))
        elbow_pos = (int(right_elbow.x * width), int(right_elbow.y * height))
        wrist_pos = (int(right_wrist.x * width), int(right_wrist.y * height))
        
        # Calculate elbow angle
        elbow_angle = calculate_angle(shoulder_pos, elbow_pos, wrist_pos)
        
        # Draw angle annotation
        cv2.putText(
            annotated_image,
            f"Elbow: {elbow_angle:.1f}°",
            (elbow_pos[0] + 20, elbow_pos[1]),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )
        
        # Get hip and knee for lower body
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
        right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
        right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
        
        hip_pos = (int(right_hip.x * width), int(right_hip.y * height))
        knee_pos = (int(right_knee.x * width), int(right_knee.y * height))
        ankle_pos = (int(right_ankle.x * width), int(right_ankle.y * height))
        
        # Calculate knee angle
        knee_angle = calculate_angle(hip_pos, knee_pos, ankle_pos)
        
        # Draw knee angle annotation
        cv2.putText(
            annotated_image,
            f"Knee: {knee_angle:.1f}°",
            (knee_pos[0] + 20, knee_pos[1]),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 0, 0),
            2
        )
        
        # Add form assessment
        form_quality = "Good"
        if 85 <= elbow_angle <= 110:
            form_quality = "Excellent"
        elif elbow_angle < 70 or elbow_angle > 130:
            form_quality = "Needs Work"
        
        cv2.putText(
            annotated_image,
            f"Form: {form_quality}",
            (50, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (0, 255, 0),
            3
        )
        
        # Save annotated image
        filename = Path(image_path).stem
        annotated_path = os.path.join(output_dir, f"{filename}_annotated.png")
        cv2.imwrite(annotated_path, annotated_image)
        
        # Create comparison image (side by side)
        comparison = np.hstack([image, annotated_image])
        comparison_path = os.path.join(output_dir, f"{filename}_comparison.png")
        cv2.imwrite(comparison_path, comparison)
        
        return {
            "image_path": image_path,
            "annotated_path": annotated_path,
            "comparison_path": comparison_path,
            "pose_detected": True,
            "elbow_angle": round(elbow_angle, 1),
            "knee_angle": round(knee_angle, 1),
            "form_quality": form_quality,
            "landmarks_detected": len(landmarks)
        }


def process_selected_images(image_numbers: List[int], top_10_dir: str, output_dir: str):
    """
    Process selected images with MediaPipe
    
    Args:
        image_numbers: List of image numbers to process (1-10)
        top_10_dir: Directory containing top 10 images
        output_dir: Directory for final outputs
    """
    os.makedirs(output_dir, exist_ok=True)
    
    results = []
    
    print("=" * 80)
    print("🏀 PROCESSING VERIFIED BASKETBALL SHOOTING IMAGES")
    print("=" * 80)
    
    for i, img_num in enumerate(image_numbers, 1):
        # Find image file
        image_file = f"{img_num:02d}_*.jpg"
        import glob
        matching_files = glob.glob(os.path.join(top_10_dir, image_file))
        
        if not matching_files:
            print(f"\n❌ Image #{img_num} not found")
            continue
        
        image_path = matching_files[0]
        print(f"\n[{i}/{len(image_numbers)}] Processing: {Path(image_path).name}")
        
        # Copy original to output directory
        output_original = os.path.join(output_dir, f"verified_test_{i}_original.jpg")
        shutil.copy2(image_path, output_original)
        print(f"   ✅ Copied original")
        
        # Process with MediaPipe
        result = detect_pose_and_annotate(image_path, output_dir)
        
        if "error" in result:
            print(f"   ❌ Error: {result['error']}")
            continue
        
        # Rename outputs to follow test naming convention
        old_annotated = result['annotated_path']
        old_comparison = result['comparison_path']
        
        new_annotated = os.path.join(output_dir, f"verified_test_{i}_annotated.png")
        new_comparison = os.path.join(output_dir, f"verified_test_{i}_comparison.png")
        
        os.rename(old_annotated, new_annotated)
        os.rename(old_comparison, new_comparison)
        
        result['annotated_path'] = new_annotated
        result['comparison_path'] = new_comparison
        result['original_path'] = output_original
        result['test_number'] = i
        
        results.append(result)
        
        print(f"   ✅ Pose detected - Elbow: {result['elbow_angle']}°, Knee: {result['knee_angle']}°")
        print(f"   ✅ Form: {result['form_quality']}")
    
    # Save results
    results_file = os.path.join(output_dir, "processing_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 80)
    print("✅ PROCESSING COMPLETE!")
    print("=" * 80)
    print(f"\n📁 Results saved to: {output_dir}")
    print(f"   - {len(results)} images processed successfully")
    print(f"   - Original images: verified_test_*_original.jpg")
    print(f"   - Annotated images: verified_test_*_annotated.png")
    print(f"   - Comparison images: verified_test_*_comparison.png")
    print(f"   - Processing results: processing_results.json")
    
    return results


def main():
    """Main function"""
    
    # Configuration
    top_10_dir = "/home/ubuntu/Uploads/basketball_test_results/verified_images/top_10"
    output_dir = "/home/ubuntu/Uploads/basketball_test_results/verified_images/final_5"
    
    # Selected images (based on filename and quality)
    # These are images with "shooting" or "basketball" in filename
    selected_images = [1, 3, 5, 7, 9]  # Images showing basketball shooting
    
    print("\n📝 Selected Images:")
    for num in selected_images:
        import glob
        matching_files = glob.glob(os.path.join(top_10_dir, f"{num:02d}_*.jpg"))
        if matching_files:
            print(f"   #{num}: {Path(matching_files[0]).name}")
    
    # Process images
    results = process_selected_images(selected_images, top_10_dir, output_dir)
    
    print(f"\n✅ Successfully processed {len(results)}/{len(selected_images)} images")


if __name__ == "__main__":
    main()
