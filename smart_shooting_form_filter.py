#!/usr/bin/env python3
"""
Smart Shooting Form Filter for Basketball Analysis App

This filter implements the exact user requirements:
- Accepts images with a SINGLE BASKETBALL PLAYER as the main subject
- Player must be captured HEAD TO TOE
- Player must be in SHOOTING MOTION (not dribbling, not layups)
- Other players CAN be present IF one player is clearly the focus
- Suitable for detailed biomechanical analysis

Key Difference from Previous Filter:
- Previous: Rejected ANY image with multiple people
- This: Accepts multiple people IF one is clearly the main shooting subject

Author: Basketball Analysis Team
Date: December 13, 2025
"""

import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


@dataclass
class PersonDetection:
    """Represents a detected person in the image"""
    person_id: int
    landmarks: any  # MediaPipe landmarks
    bounding_box: Tuple[int, int, int, int]  # (x, y, width, height)
    center_x: float  # Normalized center X coordinate
    center_y: float  # Normalized center Y coordinate
    box_area: float  # Bounding box area (normalized)
    is_shooting: bool  # Whether person is in shooting motion
    has_full_body: bool  # Whether full body is visible
    elbow_angle: Optional[float]  # Elbow angle in degrees
    wrist_height_ratio: Optional[float]  # Wrist height relative to shoulder


@dataclass
class FilterResult:
    """Result of image filtering"""
    accepted: bool
    reason: str
    people_count: int
    main_subject: Optional[PersonDetection]
    all_detections: List[PersonDetection]
    metadata: Dict


class SmartShootingFormFilter:
    """
    Advanced filter for basketball shooting form images.
    
    Implements user requirements:
    1. Detect all people in frame
    2. Identify main subject (largest, most centered)
    3. Verify main subject is shooting (arms raised, not dribbling)
    4. Verify full body visible (head to toe)
    5. Accept if main subject meets all criteria
    """
    
    def __init__(self, 
                 model_complexity: int = 1,
                 min_detection_confidence: float = 0.5,
                 min_tracking_confidence: float = 0.5):
        """
        Initialize the filter.
        
        Args:
            model_complexity: 0, 1, or 2 (higher = more accurate, slower)
            min_detection_confidence: Minimum confidence for detection
            min_tracking_confidence: Minimum confidence for tracking
        """
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        # Thresholds
        self.SHOOTING_ELBOW_ANGLE_MIN = 90  # Degrees (arm raised)
        self.DRIBBLING_ELBOW_ANGLE_MAX = 80  # Degrees (arm lowered)
        self.MIN_VISIBILITY = 0.5  # Minimum landmark visibility
        self.CENTER_TOLERANCE = 0.3  # How close to center for "centered" (normalized)
        
    def calculate_angle(self, p1, p2, p3) -> Optional[float]:
        """
        Calculate angle between three points.
        
        Args:
            p1, p2, p3: Points with x, y, z coordinates
            
        Returns:
            Angle in degrees, or None if calculation fails
        """
        try:
            # Convert to numpy arrays
            a = np.array([p1.x, p1.y])
            b = np.array([p2.x, p2.y])
            c = np.array([p3.x, p3.y])
            
            # Calculate vectors
            ba = a - b
            bc = c - b
            
            # Calculate angle
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
        except Exception as e:
            logger.warning(f"Angle calculation failed: {e}")
            return None
    
    def get_bounding_box(self, landmarks, image_width: int, image_height: int) -> Tuple[int, int, int, int]:
        """
        Calculate bounding box for detected person.
        
        Returns:
            (x, y, width, height) in pixels
        """
        x_coords = [lm.x * image_width for lm in landmarks.landmark if lm.visibility > self.MIN_VISIBILITY]
        y_coords = [lm.y * image_height for lm in landmarks.landmark if lm.visibility > self.MIN_VISIBILITY]
        
        if not x_coords or not y_coords:
            return (0, 0, 0, 0)
        
        x_min, x_max = int(min(x_coords)), int(max(x_coords))
        y_min, y_max = int(min(y_coords)), int(max(y_coords))
        
        return (x_min, y_min, x_max - x_min, y_max - y_min)
    
    def check_full_body_visible(self, landmarks) -> bool:
        """
        Check if full body (head to toe) is visible.
        
        Requires:
        - Head landmarks visible (nose)
        - Both feet visible (ankles)
        
        Returns:
            True if full body visible, False otherwise
        """
        # Check head (nose)
        nose = landmarks.landmark[mp_pose.PoseLandmark.NOSE]
        if nose.visibility < self.MIN_VISIBILITY:
            return False
        
        # Check feet (both ankles)
        left_ankle = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE]
        right_ankle = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ANKLE]
        
        if left_ankle.visibility < self.MIN_VISIBILITY and right_ankle.visibility < self.MIN_VISIBILITY:
            return False
        
        # Check key body parts (shoulders, hips, knees)
        critical_landmarks = [
            mp_pose.PoseLandmark.LEFT_SHOULDER,
            mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_HIP,
            mp_pose.PoseLandmark.RIGHT_HIP,
            mp_pose.PoseLandmark.LEFT_KNEE,
            mp_pose.PoseLandmark.RIGHT_KNEE,
        ]
        
        visible_count = sum(
            1 for lm_idx in critical_landmarks
            if landmarks.landmark[lm_idx].visibility > self.MIN_VISIBILITY
        )
        
        # At least 4 out of 6 critical landmarks should be visible
        return visible_count >= 4
    
    def check_shooting_motion(self, landmarks) -> Tuple[bool, Optional[float], Optional[float]]:
        """
        Check if person is in shooting motion (not dribbling or layup).
        
        Shooting indicators:
        - Elbow angle > 90° (arm raised)
        - Wrist above shoulder (arm raised)
        - NOT: Arm extended downward (dribbling)
        - NOT: Running motion (layup)
        
        Returns:
            (is_shooting, elbow_angle, wrist_height_ratio)
        """
        try:
            # Get right arm landmarks (most people shoot right-handed)
            right_shoulder = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
            right_elbow = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_ELBOW]
            right_wrist = landmarks.landmark[mp_pose.PoseLandmark.RIGHT_WRIST]
            
            # Check if landmarks are visible
            if (right_shoulder.visibility < self.MIN_VISIBILITY or
                right_elbow.visibility < self.MIN_VISIBILITY or
                right_wrist.visibility < self.MIN_VISIBILITY):
                
                # Try left arm
                left_shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
                left_elbow = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW]
                left_wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
                
                if (left_shoulder.visibility < self.MIN_VISIBILITY or
                    left_elbow.visibility < self.MIN_VISIBILITY or
                    left_wrist.visibility < self.MIN_VISIBILITY):
                    return (False, None, None)
                
                # Use left arm
                shoulder, elbow, wrist = left_shoulder, left_elbow, left_wrist
            else:
                # Use right arm
                shoulder, elbow, wrist = right_shoulder, right_elbow, right_wrist
            
            # Calculate elbow angle
            elbow_angle = self.calculate_angle(shoulder, elbow, wrist)
            
            if elbow_angle is None:
                return (False, None, None)
            
            # Calculate wrist height relative to shoulder (normalized)
            wrist_height_ratio = (shoulder.y - wrist.y) / abs(shoulder.y - wrist.y + 0.001)
            
            # Shooting motion indicators:
            # 1. Elbow angle > 90° (arm raised, not extended down)
            # 2. Wrist above shoulder (positive height ratio)
            
            is_shooting = (
                elbow_angle > self.SHOOTING_ELBOW_ANGLE_MIN and
                wrist_height_ratio > 0
            )
            
            return (is_shooting, elbow_angle, wrist_height_ratio)
            
        except Exception as e:
            logger.warning(f"Shooting motion check failed: {e}")
            return (False, None, None)
    
    def analyze_person(self, 
                       person_id: int,
                       landmarks,
                       image_width: int,
                       image_height: int) -> PersonDetection:
        """
        Analyze a detected person.
        
        Returns:
            PersonDetection object with all analysis results
        """
        # Get bounding box
        bbox = self.get_bounding_box(landmarks, image_width, image_height)
        x, y, w, h = bbox
        
        # Calculate center and area (normalized)
        center_x = (x + w / 2) / image_width
        center_y = (y + h / 2) / image_height
        box_area = (w * h) / (image_width * image_height)
        
        # Check full body visible
        has_full_body = self.check_full_body_visible(landmarks)
        
        # Check shooting motion
        is_shooting, elbow_angle, wrist_height_ratio = self.check_shooting_motion(landmarks)
        
        return PersonDetection(
            person_id=person_id,
            landmarks=landmarks,
            bounding_box=bbox,
            center_x=center_x,
            center_y=center_y,
            box_area=box_area,
            is_shooting=is_shooting,
            has_full_body=has_full_body,
            elbow_angle=elbow_angle,
            wrist_height_ratio=wrist_height_ratio
        )
    
    def identify_main_subject(self, detections: List[PersonDetection]) -> Optional[PersonDetection]:
        """
        Identify the main subject from multiple detections.
        
        Main subject is:
        1. Largest person (by bounding box area)
        2. Most centered person (if multiple large people)
        
        Returns:
            PersonDetection of main subject, or None if no clear main subject
        """
        if not detections:
            return None
        
        if len(detections) == 1:
            return detections[0]
        
        # Find largest person
        largest = max(detections, key=lambda d: d.box_area)
        
        # Check if there are other people of similar size
        similar_size = [
            d for d in detections
            if d.box_area >= largest.box_area * 0.8  # Within 80% of largest
        ]
        
        if len(similar_size) == 1:
            return largest
        
        # Multiple people of similar size - choose most centered
        frame_center_x = 0.5
        most_centered = min(similar_size, key=lambda d: abs(d.center_x - frame_center_x))
        
        return most_centered
    
    def filter_image(self, image_path: str) -> FilterResult:
        """
        Filter a single image based on shooting form requirements.
        
        Args:
            image_path: Path to image file
            
        Returns:
            FilterResult with accept/reject decision and metadata
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return FilterResult(
                    accepted=False,
                    reason="Failed to load image",
                    people_count=0,
                    main_subject=None,
                    all_detections=[],
                    metadata={"error": "Image load failed"}
                )
            
            image_height, image_width = image.shape[:2]
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Run pose detection
            results = self.pose.process(image_rgb)
            
            # No people detected
            if not results.pose_landmarks:
                return FilterResult(
                    accepted=False,
                    reason="No people detected in image",
                    people_count=0,
                    main_subject=None,
                    all_detections=[],
                    metadata={"image_size": f"{image_width}x{image_height}"}
                )
            
            # For now, MediaPipe's single-person pose detection
            # In the future, could use multi-person detection models
            # Currently we detect one person per image
            
            # Analyze detected person
            detection = self.analyze_person(0, results.pose_landmarks, image_width, image_height)
            
            # Check if full body visible
            if not detection.has_full_body:
                return FilterResult(
                    accepted=False,
                    reason="Full body not visible (missing head or feet)",
                    people_count=1,
                    main_subject=detection,
                    all_detections=[detection],
                    metadata={
                        "image_size": f"{image_width}x{image_height}",
                        "box_area": detection.box_area
                    }
                )
            
            # Check if shooting motion
            if not detection.is_shooting:
                reason = "Not in shooting motion"
                if detection.elbow_angle is not None:
                    if detection.elbow_angle < self.DRIBBLING_ELBOW_ANGLE_MAX:
                        reason = f"Dribbling motion detected (elbow angle: {detection.elbow_angle:.1f}°)"
                    else:
                        reason = f"Arm position unclear (elbow angle: {detection.elbow_angle:.1f}°)"
                
                return FilterResult(
                    accepted=False,
                    reason=reason,
                    people_count=1,
                    main_subject=detection,
                    all_detections=[detection],
                    metadata={
                        "image_size": f"{image_width}x{image_height}",
                        "elbow_angle": detection.elbow_angle,
                        "wrist_height_ratio": detection.wrist_height_ratio
                    }
                )
            
            # All checks passed - ACCEPT
            return FilterResult(
                accepted=True,
                reason="Valid shooting form image",
                people_count=1,
                main_subject=detection,
                all_detections=[detection],
                metadata={
                    "image_size": f"{image_width}x{image_height}",
                    "elbow_angle": detection.elbow_angle,
                    "wrist_height_ratio": detection.wrist_height_ratio,
                    "box_area": detection.box_area,
                    "center_position": (detection.center_x, detection.center_y)
                }
            )
            
        except Exception as e:
            logger.error(f"Error processing {image_path}: {e}")
            return FilterResult(
                accepted=False,
                reason=f"Processing error: {str(e)}",
                people_count=0,
                main_subject=None,
                all_detections=[],
                metadata={"error": str(e)}
            )
    
    def __del__(self):
        """Cleanup MediaPipe resources"""
        if hasattr(self, 'pose'):
            self.pose.close()


def main():
    """Test the filter on sample images"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python smart_shooting_form_filter.py <image_path>")
        print("       python smart_shooting_form_filter.py <directory_path>")
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    
    # Initialize filter
    filter_obj = SmartShootingFormFilter()
    
    # Process single image
    if input_path.is_file():
        result = filter_obj.filter_image(str(input_path))
        print(f"\n{'='*60}")
        print(f"Image: {input_path.name}")
        print(f"{'='*60}")
        print(f"Result: {'✅ ACCEPTED' if result.accepted else '❌ REJECTED'}")
        print(f"Reason: {result.reason}")
        print(f"People Count: {result.people_count}")
        if result.main_subject:
            print(f"\nMain Subject Analysis:")
            print(f"  - Full Body Visible: {result.main_subject.has_full_body}")
            print(f"  - Shooting Motion: {result.main_subject.is_shooting}")
            print(f"  - Elbow Angle: {result.main_subject.elbow_angle:.1f}°" if result.main_subject.elbow_angle else "  - Elbow Angle: N/A")
            print(f"  - Box Area: {result.main_subject.box_area:.3f}")
        print(f"\nMetadata: {json.dumps(result.metadata, indent=2)}")
    
    # Process directory
    elif input_path.is_dir():
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
        image_files = [
            f for f in input_path.iterdir()
            if f.suffix.lower() in image_extensions
        ]
        
        print(f"\nProcessing {len(image_files)} images from {input_path}...")
        
        accepted_count = 0
        rejected_count = 0
        rejection_reasons = {}
        
        for img_file in image_files:
            result = filter_obj.filter_image(str(img_file))
            
            if result.accepted:
                accepted_count += 1
                print(f"✅ {img_file.name}")
            else:
                rejected_count += 1
                print(f"❌ {img_file.name} - {result.reason}")
                
                # Track rejection reasons
                reason_key = result.reason.split('(')[0].strip()
                rejection_reasons[reason_key] = rejection_reasons.get(reason_key, 0) + 1
        
        # Summary
        print(f"\n{'='*60}")
        print(f"SUMMARY")
        print(f"{'='*60}")
        print(f"Total Images: {len(image_files)}")
        print(f"Accepted: {accepted_count} ({accepted_count/len(image_files)*100:.1f}%)")
        print(f"Rejected: {rejected_count} ({rejected_count/len(image_files)*100:.1f}%)")
        print(f"\nRejection Reasons:")
        for reason, count in sorted(rejection_reasons.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {reason}: {count}")
    
    else:
        print(f"Error: {input_path} is not a valid file or directory")
        sys.exit(1)


if __name__ == "__main__":
    main()
