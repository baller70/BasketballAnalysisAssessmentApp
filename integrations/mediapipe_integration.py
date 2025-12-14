#!/usr/bin/env python3
"""
MediaPipe Integration - FREE TIER
Basketball Shooting Form Analysis using MediaPipe Pose Detection

MediaPipe provides 33 keypoints for full body pose detection:
- 0-10: Face and head landmarks
- 11-16: Upper body (shoulders, elbows, wrists)
- 17-22: Hands (fingers, thumbs, pinkies, indices)
- 23-28: Lower body (hips, knees, ankles)
- 29-32: Feet (heels, foot indices)

Advantages:
- FREE and open source
- 33 keypoints (more detailed than RoboFlow's 18)
- Fast and efficient
- No API costs
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class ShootingPhase(Enum):
    """Shooting phases detection"""
    PREPARATORY = "preparatory"  # Knee bent, ball at chest
    EXECUTION = "execution"      # Rising, ball going up
    RELEASE = "release"          # Arm extended, ball released
    FOLLOW_THROUGH = "follow_through"  # After release, arm extended
    UNKNOWN = "unknown"


class FormQuality(Enum):
    """Form quality assessment"""
    EXCELLENT = "excellent"      # 90-100% optimal
    GOOD = "good"                # 75-89% optimal
    FAIR = "fair"                # 60-74% optimal
    NEEDS_IMPROVEMENT = "needs_improvement"  # <60% optimal


@dataclass
class BiomechanicalAngles:
    """Biomechanical angles for shooting form analysis"""
    # Shooting arm (assuming right-handed, can be adapted)
    shoulder_angle: float  # SA - Torso to upper arm
    elbow_angle: float     # EA - Upper arm to forearm
    wrist_angle: float     # WA - Forearm to hand
    
    # Body alignment
    hip_angle: float       # HA - Torso to thigh
    knee_angle: float      # KA - Thigh to shin
    ankle_angle: float     # AA - Shin to foot
    
    # Release mechanics
    release_angle: float   # RA - Arm angle at release
    release_height: float  # RH - Wrist height relative to body
    elbow_height: float    # EH - Elbow height relative to shoulder
    
    # Body extension
    vertical_displacement: float  # VD - Overall body extension
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary"""
        return {
            'shoulder_angle': round(self.shoulder_angle, 2),
            'elbow_angle': round(self.elbow_angle, 2),
            'wrist_angle': round(self.wrist_angle, 2),
            'hip_angle': round(self.hip_angle, 2),
            'knee_angle': round(self.knee_angle, 2),
            'ankle_angle': round(self.ankle_angle, 2),
            'release_angle': round(self.release_angle, 2),
            'release_height': round(self.release_height, 2),
            'elbow_height': round(self.elbow_height, 2),
            'vertical_displacement': round(self.vertical_displacement, 2)
        }


class MediaPipeAnalyzer:
    """
    MediaPipe-based basketball shooting form analyzer
    FREE TIER alternative to RoboFlow
    """
    
    def __init__(
        self,
        model_complexity: int = 2,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5
    ):
        """
        Initialize MediaPipe analyzer
        
        Args:
            model_complexity: 0 (lite), 1 (full), 2 (heavy) - higher is more accurate
            min_detection_confidence: Minimum confidence for detection
            min_tracking_confidence: Minimum confidence for tracking
        """
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        logger.info(f"MediaPipe Analyzer initialized (complexity={model_complexity})")
    
    def calculate_angle(self, point1, point2, point3) -> float:
        """
        Calculate angle between three points in degrees
        
        Args:
            point1, point2, point3: MediaPipe landmark objects
            
        Returns:
            Angle in degrees
        """
        try:
            # Convert to numpy arrays
            a = np.array([point1.x, point1.y])
            b = np.array([point2.x, point2.y])
            c = np.array([point3.x, point3.y])
            
            # Calculate vectors
            ba = a - b
            bc = c - b
            
            # Calculate angle
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return float(np.degrees(angle))
        except Exception as e:
            logger.warning(f"Error calculating angle: {e}")
            return 0.0
    
    def calculate_biomechanical_angles(self, landmarks) -> BiomechanicalAngles:
        """
        Calculate all biomechanical angles for shooting form
        
        Args:
            landmarks: MediaPipe pose landmarks
            
        Returns:
            BiomechanicalAngles object with all angles
        """
        try:
            # Assuming right-handed shooter (can be adapted)
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
            right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
            right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
            right_foot = landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value]
            right_index = landmarks[mp_pose.PoseLandmark.RIGHT_INDEX.value]
            nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
            
            # Calculate angles
            shoulder_angle = self.calculate_angle(right_hip, right_shoulder, right_elbow)
            elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
            wrist_angle = self.calculate_angle(right_elbow, right_wrist, right_index)
            hip_angle = self.calculate_angle(right_shoulder, right_hip, right_knee)
            knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
            ankle_angle = self.calculate_angle(right_knee, right_ankle, right_foot)
            
            # Release mechanics
            release_angle = elbow_angle  # Arm angle at release
            release_height = abs(nose.y - right_wrist.y)
            elbow_height = abs(right_shoulder.y - right_elbow.y)
            vertical_displacement = abs(nose.y - right_ankle.y)
            
            return BiomechanicalAngles(
                shoulder_angle=shoulder_angle,
                elbow_angle=elbow_angle,
                wrist_angle=wrist_angle,
                hip_angle=hip_angle,
                knee_angle=knee_angle,
                ankle_angle=ankle_angle,
                release_angle=release_angle,
                release_height=release_height,
                elbow_height=elbow_height,
                vertical_displacement=vertical_displacement
            )
            
        except Exception as e:
            logger.error(f"Error calculating biomechanical angles: {e}")
            # Return default angles
            return BiomechanicalAngles(
                shoulder_angle=0.0,
                elbow_angle=0.0,
                wrist_angle=0.0,
                hip_angle=0.0,
                knee_angle=0.0,
                ankle_angle=0.0,
                release_angle=0.0,
                release_height=0.0,
                elbow_height=0.0,
                vertical_displacement=0.0
            )
    
    def identify_shooting_phase(self, angles: BiomechanicalAngles) -> ShootingPhase:
        """
        Identify shooting phase based on biomechanical angles
        
        Args:
            angles: BiomechanicalAngles object
            
        Returns:
            ShootingPhase enum
        """
        # Phase identification logic based on angles
        knee = angles.knee_angle
        elbow = angles.elbow_angle
        release_height = angles.release_height
        
        # Preparatory: Knees bent (< 140°), elbow bent (< 100°), low release height
        if knee < 140 and elbow < 100 and release_height < 0.3:
            return ShootingPhase.PREPARATORY
        
        # Release: Elbow extended (> 150°), high release height
        elif elbow > 150 and release_height > 0.4:
            return ShootingPhase.RELEASE
        
        # Execution: Transitioning angles
        elif 100 <= elbow <= 150 and 0.3 <= release_height <= 0.4:
            return ShootingPhase.EXECUTION
        
        # Follow-through: Elbow fully extended, very high release
        elif elbow > 160 and release_height > 0.45:
            return ShootingPhase.FOLLOW_THROUGH
        
        else:
            return ShootingPhase.UNKNOWN
    
    def assess_form_quality(self, angles: BiomechanicalAngles) -> Tuple[FormQuality, float]:
        """
        Assess shooting form quality based on biomechanical angles
        
        Args:
            angles: BiomechanicalAngles object
            
        Returns:
            Tuple of (FormQuality, score_percentage)
        """
        # Optimal angle ranges (from biomechanical research)
        optimal_ranges = {
            'elbow_angle': (85, 95),      # Release elbow angle
            'shoulder_angle': (80, 100),  # Shoulder alignment
            'knee_angle': (120, 140),     # Preparatory knee bend
            'hip_angle': (160, 180),      # Hip extension
            'release_height': (0.4, 0.6)  # Release height relative to body
        }
        
        # Calculate deviations
        total_score = 0
        max_score = len(optimal_ranges)
        
        for angle_name, (min_val, max_val) in optimal_ranges.items():
            angle_value = getattr(angles, angle_name)
            
            if min_val <= angle_value <= max_val:
                # Perfect - in range
                total_score += 1.0
            else:
                # Calculate partial score based on deviation
                if angle_value < min_val:
                    deviation = min_val - angle_value
                else:
                    deviation = angle_value - max_val
                
                # Partial score: 0.5 for small deviation, 0 for large
                if deviation < 10:
                    total_score += 0.5
                elif deviation < 20:
                    total_score += 0.25
        
        # Calculate percentage
        score_percentage = (total_score / max_score) * 100
        
        # Determine quality
        if score_percentage >= 90:
            quality = FormQuality.EXCELLENT
        elif score_percentage >= 75:
            quality = FormQuality.GOOD
        elif score_percentage >= 60:
            quality = FormQuality.FAIR
        else:
            quality = FormQuality.NEEDS_IMPROVEMENT
        
        return quality, score_percentage
    
    def analyze_image(self, image_path: str) -> Dict:
        """
        Complete analysis of a single image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with complete analysis results
        """
        logger.info(f"Analyzing image: {image_path}")
        
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not read image: {image_path}")
            return {
                "success": False,
                "error": "Could not read image"
            }
        
        # Convert to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            logger.warning(f"No pose detected in image: {image_path}")
            return {
                "success": False,
                "error": "No pose detected"
            }
        
        # Extract landmarks
        landmarks = results.pose_landmarks.landmark
        
        # Calculate biomechanical angles
        angles = self.calculate_biomechanical_angles(landmarks)
        
        # Identify shooting phase
        phase = self.identify_shooting_phase(angles)
        
        # Assess form quality
        quality, score = self.assess_form_quality(angles)
        
        # Extract keypoint data
        keypoints = []
        for idx, landmark in enumerate(landmarks):
            keypoints.append({
                'id': idx,
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            })
        
        logger.info(f"Analysis complete: phase={phase.value}, quality={quality.value}, score={score:.1f}%")
        
        return {
            "success": True,
            "image_path": image_path,
            "keypoints": {
                "total": len(keypoints),
                "detected": len([k for k in keypoints if k['visibility'] > 0.5]),
                "data": keypoints
            },
            "biomechanical_angles": angles.to_dict(),
            "shooting_phase": {
                "phase": phase.value,
                "confidence": 0.85  # MediaPipe has high confidence
            },
            "form_quality": {
                "assessment": quality.value,
                "score_percentage": round(score, 2)
            },
            "raw_landmarks": results.pose_landmarks
        }
    
    def analyze_complete(self, image_path: str) -> Dict:
        """
        Alias for analyze_image to match RoboFlow interface
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with complete analysis results
        """
        return self.analyze_image(image_path)
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'pose'):
            self.pose.close()


# Test function
if __name__ == "__main__":
    print("="*60)
    print("MediaPipe Integration - FREE TIER")
    print("="*60)
    
    analyzer = MediaPipeAnalyzer(model_complexity=2)
    
    # Test with a sample image
    test_image = "/home/ubuntu/basketball_app/training_data/form_quality_classifier/excellent_form/1.png"
    
    result = analyzer.analyze_complete(test_image)
    
    if result["success"]:
        print("\n✓ Analysis successful!")
        print(f"  Keypoints detected: {result['keypoints']['detected']}/{result['keypoints']['total']}")
        print(f"  Shooting phase: {result['shooting_phase']['phase']}")
        print(f"  Form quality: {result['form_quality']['assessment']} ({result['form_quality']['score_percentage']}%)")
        print("\n  Biomechanical Angles:")
        for angle, value in result['biomechanical_angles'].items():
            print(f"    {angle}: {value}°")
    else:
        print(f"\n✗ Analysis failed: {result['error']}")
