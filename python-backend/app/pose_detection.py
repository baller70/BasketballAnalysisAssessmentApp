"""
Pose detection using MediaPipe
"""
import os
import cv2
import mediapipe as mp
import numpy as np
from typing import List, Tuple, Optional
from .models import Keypoint


# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Get model complexity from environment (default: 2 = most accurate)
MODEL_COMPLEXITY = int(os.getenv("MEDIAPIPE_MODEL_COMPLEXITY", "2"))
MIN_DETECTION_CONFIDENCE = float(os.getenv("MEDIAPIPE_MIN_DETECTION_CONFIDENCE", "0.5"))
MIN_TRACKING_CONFIDENCE = float(os.getenv("MEDIAPIPE_MIN_TRACKING_CONFIDENCE", "0.5"))


# MediaPipe landmark names mapping
LANDMARK_NAMES = {
    0: "nose",
    1: "left_eye_inner",
    2: "left_eye",
    3: "left_eye_outer",
    4: "right_eye_inner",
    5: "right_eye",
    6: "right_eye_outer",
    7: "left_ear",
    8: "right_ear",
    9: "mouth_left",
    10: "mouth_right",
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    17: "left_pinky",
    18: "right_pinky",
    19: "left_index",
    20: "right_index",
    21: "left_thumb",
    22: "right_thumb",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
    29: "left_heel",
    30: "right_heel",
    31: "left_foot_index",
    32: "right_foot_index",
}


def detect_pose_from_image(
    image_bytes: bytes,
) -> Tuple[List[Keypoint], float, int, int]:
    """
    Detect pose from image bytes using MediaPipe
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Tuple of (keypoints, confidence, image_width, image_height)
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Failed to decode image")
    
    # Get image dimensions
    image_height, image_width = image.shape[:2]
    
    # Convert BGR to RGB (MediaPipe uses RGB)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Run pose detection
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=MODEL_COMPLEXITY,
        min_detection_confidence=MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
    ) as pose:
        results = pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return [], 0.0, image_width, image_height
        
        # Extract keypoints
        keypoints = []
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            keypoint = Keypoint(
                x=landmark.x,
                y=landmark.y,
                z=landmark.z,
                visibility=landmark.visibility,
                name=LANDMARK_NAMES.get(idx, f"landmark_{idx}"),
            )
            keypoints.append(keypoint)
        
        # Calculate average confidence
        confidence = sum(kp.visibility for kp in keypoints) / len(keypoints)
        
        return keypoints, confidence, image_width, image_height


def draw_pose_on_image(
    image: np.ndarray,
    keypoints: List[Keypoint],
    line_thickness: int = 2,
    point_radius: int = 5,
) -> np.ndarray:
    """
    Draw pose keypoints and connections on image
    
    Args:
        image: Input image as numpy array
        keypoints: List of detected keypoints
        line_thickness: Thickness of connection lines
        point_radius: Radius of keypoint circles
        
    Returns:
        Annotated image
    """
    # Create a copy to avoid modifying original
    annotated_image = image.copy()
    
    # Draw connections
    connections = mp_pose.POSE_CONNECTIONS
    for connection in connections:
        start_idx, end_idx = connection
        if start_idx < len(keypoints) and end_idx < len(keypoints):
            start_kp = keypoints[start_idx]
            end_kp = keypoints[end_idx]
            
            # Only draw if both keypoints are visible enough
            if start_kp.visibility > 0.5 and end_kp.visibility > 0.5:
                height, width = image.shape[:2]
                start_point = (int(start_kp.x * width), int(start_kp.y * height))
                end_point = (int(end_kp.x * width), int(end_kp.y * height))
                
                cv2.line(
                    annotated_image,
                    start_point,
                    end_point,
                    (0, 255, 0),  # Green
                    line_thickness,
                )
    
    # Draw keypoints
    height, width = image.shape[:2]
    for keypoint in keypoints:
        if keypoint.visibility > 0.5:
            center = (int(keypoint.x * width), int(keypoint.y * height))
            cv2.circle(
                annotated_image,
                center,
                point_radius,
                (255, 0, 0),  # Blue
                -1,  # Filled
            )
    
    return annotated_image
