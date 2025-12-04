"""
MediaPipe Pose Detection Service
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import List, Tuple, Optional
from .models import Keypoint


# MediaPipe BlazePose landmark names (33 keypoints)
MEDIAPIPE_KEYPOINT_NAMES = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer',
    'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
    'left_index', 'right_index', 'left_thumb', 'right_thumb',
    'left_hip', 'right_hip', 'left_knee', 'right_knee',
    'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index'
]

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose


class PoseDetector:
    """MediaPipe Pose Detector wrapper"""
    
    def __init__(self, model_complexity: int = 2):
        """
        Initialize the pose detector
        
        Args:
            model_complexity: 0=Lite, 1=Full, 2=Heavy (most accurate)
        """
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def detect(self, image: np.ndarray) -> Tuple[List[Keypoint], float, bool]:
        """
        Detect pose in an image
        
        Args:
            image: BGR image as numpy array
            
        Returns:
            Tuple of (keypoints, confidence, is_shooting_pose)
        """
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return [], 0.0, False
        
        # Extract keypoints
        keypoints: List[Keypoint] = []
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            keypoints.append(Keypoint(
                name=MEDIAPIPE_KEYPOINT_NAMES[idx] if idx < len(MEDIAPIPE_KEYPOINT_NAMES) else f"keypoint_{idx}",
                x=landmark.x,
                y=landmark.y,
                z=landmark.z if landmark.z else 0,
                visibility=landmark.visibility if landmark.visibility else 0
            ))
        
        # Calculate average confidence
        visible_keypoints = [kp for kp in keypoints if kp.visibility > 0.1]
        confidence = sum(kp.visibility for kp in visible_keypoints) / len(visible_keypoints) if visible_keypoints else 0
        
        # Check if it's a shooting pose
        is_shooting_pose = self._check_shooting_pose(keypoints)
        
        return keypoints, confidence, is_shooting_pose
    
    def _check_shooting_pose(self, keypoints: List[Keypoint]) -> bool:
        """Check if the detected pose is a shooting pose"""
        kp_map = {kp.name: kp for kp in keypoints}
        
        left_wrist = kp_map.get('left_wrist')
        right_wrist = kp_map.get('right_wrist')
        left_shoulder = kp_map.get('left_shoulder')
        right_shoulder = kp_map.get('right_shoulder')
        
        # Check if either arm is raised (wrist Y < shoulder Y means wrist is higher)
        left_arm_raised = (
            left_wrist and left_shoulder and
            left_wrist.visibility > 0.3 and left_shoulder.visibility > 0.3 and
            left_wrist.y < left_shoulder.y
        )
        
        right_arm_raised = (
            right_wrist and right_shoulder and
            right_wrist.visibility > 0.3 and right_shoulder.visibility > 0.3 and
            right_wrist.y < right_shoulder.y
        )
        
        return left_arm_raised or right_arm_raised
    
    def close(self):
        """Release resources"""
        self.pose.close()


# Global detector instance
_detector: Optional[PoseDetector] = None


def get_detector() -> PoseDetector:
    """Get or create the global pose detector"""
    global _detector
    if _detector is None:
        _detector = PoseDetector(model_complexity=2)
    return _detector


def detect_pose_from_image(image: np.ndarray) -> Tuple[List[Keypoint], float, bool]:
    """
    Detect pose from an image
    
    Args:
        image: BGR image as numpy array
        
    Returns:
        Tuple of (keypoints, confidence, is_shooting_pose)
    """
    detector = get_detector()
    return detector.detect(image)

