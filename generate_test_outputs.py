#!/usr/bin/env python3
"""
Generate Annotated Skeleton Overlays for Test Images

This script:
1. Loads 5 perfect test images
2. Runs MediaPipe pose detection
3. Creates skeleton overlays with landmarks
4. Adds angle measurements and form assessments
5. Saves annotated outputs
6. Creates comparison images (original vs annotated)

Author: Basketball Analysis Team
Date: December 13, 2025
"""

import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path
import json
from typing import Dict, List, Tuple, Optional

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Paths
TEST_IMAGES_DIR = Path("/home/ubuntu/Uploads/basketball_test_results/proper_test_images")
OUTPUT_DIR = Path("/home/ubuntu/Uploads/basketball_test_results/annotated_outputs")


def calculate_angle(p1, p2, p3) -> Optional[float]:
    """Calculate angle between three points in degrees."""
    try:
        a = np.array([p1.x, p1.y])
        b = np.array([p2.x, p2.y])
        c = np.array([p3.x, p3.y])
        
        ba = a - b
        bc = c - b
        
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        
        return np.degrees(angle)
    except:
        return None


def analyze_shooting_form(landmarks) -> Dict:
    """
    Analyze shooting form and return biomechanical metrics.
    
    Returns:
        Dictionary with angles and form assessment
    """
    analysis = {
        "elbow_angle": None,
        "shoulder_angle": None,
        "knee_angle": None,
        "hip_angle": None,
        "release_angle": None,
        "form_score": 0,
        "feedback": []
    }
    
    try:
        # Right arm (shooting arm)
        right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        right_elbow = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ELBOW]
        right_wrist = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST]
        right_hip = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]
        right_knee = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_KNEE]
        right_ankle = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ANKLE]
        
        # Calculate elbow angle
        elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        if elbow_angle:
            analysis["elbow_angle"] = elbow_angle
            if 80 <= elbow_angle <= 110:
                analysis["form_score"] += 25
                analysis["feedback"].append("✅ Excellent elbow angle")
            elif 70 <= elbow_angle <= 120:
                analysis["form_score"] += 15
                analysis["feedback"].append("✓ Good elbow angle")
            else:
                analysis["feedback"].append("⚠ Elbow angle needs adjustment")
        
        # Calculate knee angle
        knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
        if knee_angle:
            analysis["knee_angle"] = knee_angle
            if 100 <= knee_angle <= 140:
                analysis["form_score"] += 25
                analysis["feedback"].append("✅ Good knee flexion")
            elif 90 <= knee_angle <= 150:
                analysis["form_score"] += 15
                analysis["feedback"].append("✓ Acceptable knee flexion")
            else:
                analysis["feedback"].append("⚠ Knee flexion needs work")
        
        # Calculate shoulder-hip alignment (release angle)
        if right_wrist.y < right_shoulder.y:  # Wrist above shoulder = shooting
            analysis["release_angle"] = abs(right_wrist.y - right_shoulder.y) * 180
            analysis["form_score"] += 25
            analysis["feedback"].append("✅ Good release point")
        else:
            analysis["feedback"].append("⚠ Release point too low")
        
        # Hip alignment
        left_hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
        hip_alignment = abs(right_hip.y - left_hip.y)
        if hip_alignment < 0.05:  # Normalized coordinates
            analysis["form_score"] += 25
            analysis["feedback"].append("✅ Level hips")
        else:
            analysis["feedback"].append("⚠ Hip alignment needs correction")
        
    except Exception as e:
        print(f"   Warning: Error analyzing form: {e}")
    
    return analysis


def create_annotated_image(image_path: Path, output_path: Path) -> Dict:
    """
    Create annotated image with skeleton overlay and measurements.
    
    Args:
        image_path: Path to input image
        output_path: Path to save annotated image
        
    Returns:
        Dictionary with analysis results
    """
    print(f"\nProcessing: {image_path.name}")
    
    # Load image
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"   ❌ Failed to load image")
        return {"error": "Failed to load image"}
    
    image_height, image_width = image.shape[:2]
    print(f"   Image size: {image_width}x{image_height}")
    
    # Run pose detection
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        min_detection_confidence=0.5
    ) as pose:
        results = pose.process(image_rgb)
    
    if not results.pose_landmarks:
        print(f"   ❌ No pose detected")
        return {"error": "No pose detected"}
    
    print(f"   ✅ Pose detected")
    
    # Analyze shooting form
    analysis = analyze_shooting_form(results.pose_landmarks)
    print(f"   Form score: {analysis['form_score']}/100")
    
    # Create annotated image
    annotated_image = image.copy()
    
    # Draw skeleton
    mp_drawing.draw_landmarks(
        annotated_image,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
    )
    
    # Add angle annotations
    landmarks = results.pose_landmarks.landmark
    
    # Annotate elbow angle
    if analysis["elbow_angle"]:
        right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW]
        x = int(right_elbow.x * image_width)
        y = int(right_elbow.y * image_height)
        
        cv2.putText(
            annotated_image,
            f"Elbow: {analysis['elbow_angle']:.1f}°",
            (x + 10, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )
    
    # Annotate knee angle
    if analysis["knee_angle"]:
        right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE]
        x = int(right_knee.x * image_width)
        y = int(right_knee.y * image_height)
        
        cv2.putText(
            annotated_image,
            f"Knee: {analysis['knee_angle']:.1f}°",
            (x + 10, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )
    
    # Add form score overlay
    cv2.rectangle(annotated_image, (10, 10), (400, 150), (0, 0, 0), -1)
    cv2.rectangle(annotated_image, (10, 10), (400, 150), (0, 255, 0), 2)
    
    cv2.putText(
        annotated_image,
        f"Form Score: {analysis['form_score']}/100",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )
    
    # Add feedback (top 3)
    for i, feedback in enumerate(analysis['feedback'][:3], 1):
        cv2.putText(
            annotated_image,
            feedback,
            (20, 40 + i * 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1
        )
    
    # Save annotated image
    cv2.imwrite(str(output_path), annotated_image)
    print(f"   ✅ Saved to: {output_path.name}")
    
    return {
        "image": image_path.name,
        "size": f"{image_width}x{image_height}",
        "analysis": analysis
    }


def create_comparison_image(original_path: Path, annotated_path: Path, comparison_path: Path):
    """Create side-by-side comparison of original and annotated images."""
    original = cv2.imread(str(original_path))
    annotated = cv2.imread(str(annotated_path))
    
    if original is None or annotated is None:
        print(f"   ❌ Failed to create comparison")
        return
    
    # Resize to same height
    h1, w1 = original.shape[:2]
    h2, w2 = annotated.shape[:2]
    
    target_height = 600
    original_resized = cv2.resize(original, (int(w1 * target_height / h1), target_height))
    annotated_resized = cv2.resize(annotated, (int(w2 * target_height / h2), target_height))
    
    # Create side-by-side comparison
    comparison = np.hstack([original_resized, annotated_resized])
    
    # Add labels
    cv2.putText(
        comparison,
        "ORIGINAL",
        (50, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (255, 255, 255),
        3
    )
    
    cv2.putText(
        comparison,
        "ANNOTATED",
        (original_resized.shape[1] + 50, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (255, 255, 255),
        3
    )
    
    cv2.imwrite(str(comparison_path), comparison)
    print(f"   ✅ Comparison saved: {comparison_path.name}")


def main():
    """Main execution"""
    print("="*60)
    print("GENERATING ANNOTATED TEST OUTPUTS")
    print("="*60)
    print(f"Input: {TEST_IMAGES_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print("="*60)
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Find test images
    test_images = sorted(TEST_IMAGES_DIR.glob("test_*.jpg")) + sorted(TEST_IMAGES_DIR.glob("test_*.png"))
    
    if len(test_images) == 0:
        print("\n❌ No test images found!")
        return
    
    print(f"\nFound {len(test_images)} test images")
    
    # Process each image
    results = []
    for img_path in test_images:
        # Create output paths
        stem = img_path.stem
        annotated_path = OUTPUT_DIR / f"{stem}_annotated.png"
        comparison_path = OUTPUT_DIR / f"{stem}_comparison.png"
        
        # Generate annotated image
        result = create_annotated_image(img_path, annotated_path)
        results.append(result)
        
        # Create comparison
        if annotated_path.exists():
            create_comparison_image(img_path, annotated_path, comparison_path)
    
    # Save results summary
    summary_file = OUTPUT_DIR / "analysis_summary.json"
    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ GENERATION COMPLETE")
    print("="*60)
    print(f"Annotated images: {len(results)}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Summary: {summary_file}")
    print("="*60)


if __name__ == "__main__":
    main()
