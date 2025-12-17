"""
Skeleton drawing utilities for pose visualization
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import List
from .models import Keypoint, SkeletonConfig


# MediaPipe pose connections
mp_pose = mp.solutions.pose
POSE_CONNECTIONS = mp_pose.POSE_CONNECTIONS


def draw_skeleton(
    image: np.ndarray,
    keypoints: List[Keypoint],
    config: SkeletonConfig = None,
) -> np.ndarray:
    """
    Draw skeleton on image using keypoints
    
    Args:
        image: Input image as numpy array
        keypoints: List of detected keypoints
        config: Drawing configuration (optional)
        
    Returns:
        Image with skeleton drawn
    """
    if config is None:
        config = SkeletonConfig()
    
    # Create a copy to avoid modifying original
    annotated_image = image.copy()
    height, width = image.shape[:2]
    
    # Draw connections if enabled
    if config.draw_connections:
        for connection in POSE_CONNECTIONS:
            start_idx, end_idx = connection
            if start_idx < len(keypoints) and end_idx < len(keypoints):
                start_kp = keypoints[start_idx]
                end_kp = keypoints[end_idx]
                
                # Only draw if both keypoints are visible enough
                if start_kp.visibility > 0.5 and end_kp.visibility > 0.5:
                    start_point = (int(start_kp.x * width), int(start_kp.y * height))
                    end_point = (int(end_kp.x * width), int(end_kp.y * height))
                    
                    cv2.line(
                        annotated_image,
                        start_point,
                        end_point,
                        config.line_color,
                        config.line_thickness,
                    )
    
    # Draw keypoints
    for keypoint in keypoints:
        if keypoint.visibility > 0.5:
            center = (int(keypoint.x * width), int(keypoint.y * height))
            cv2.circle(
                annotated_image,
                center,
                config.point_radius,
                config.point_color,
                -1,  # Filled
            )
    
    return annotated_image


def create_skeleton_overlay(
    image: np.ndarray,
    keypoints: List[Keypoint],
    background_alpha: float = 0.3,
    skeleton_color: tuple = (0, 255, 0),
) -> np.ndarray:
    """
    Create skeleton overlay with transparent background
    
    Args:
        image: Input image
        keypoints: Detected keypoints
        background_alpha: Opacity of background (0-1)
        skeleton_color: Color for skeleton lines
        
    Returns:
        Image with skeleton overlay
    """
    # Create a copy
    result = image.copy()
    
    # Create overlay
    overlay = np.zeros_like(image)
    
    # Draw skeleton on overlay
    config = SkeletonConfig(
        line_color=skeleton_color,
        point_color=skeleton_color,
        line_thickness=3,
        point_radius=6,
    )
    overlay = draw_skeleton(overlay, keypoints, config)
    
    # Blend original image with overlay
    # Make background semi-transparent, keep skeleton fully opaque
    mask = (overlay > 0).any(axis=2).astype(np.uint8) * 255
    mask_3ch = np.stack([mask, mask, mask], axis=2)
    
    # Darken background
    result = (image * background_alpha).astype(np.uint8)
    
    # Add skeleton
    result = np.where(mask_3ch > 0, overlay, result)
    
    return result
