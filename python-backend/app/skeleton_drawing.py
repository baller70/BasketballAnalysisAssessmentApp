"""
Skeleton overlay drawing utilities using OpenCV
"""
import cv2
import numpy as np
from typing import List, Tuple, Dict, Optional
from .models import Keypoint, SkeletonConfig


# Skeleton connections (excluding head/face, hands, feet details)
SKELETON_CONNECTIONS: List[Tuple[str, str]] = [
    # Torso
    ('left_shoulder', 'right_shoulder'),
    ('left_shoulder', 'left_hip'),
    ('right_shoulder', 'right_hip'),
    ('left_hip', 'right_hip'),
    # Left arm
    ('left_shoulder', 'left_elbow'),
    ('left_elbow', 'left_wrist'),
    # Right arm
    ('right_shoulder', 'right_elbow'),
    ('right_elbow', 'right_wrist'),
    # Left leg
    ('left_hip', 'left_knee'),
    ('left_knee', 'left_ankle'),
    # Right leg
    ('right_hip', 'right_knee'),
    ('right_knee', 'right_ankle'),
]

# Keypoints to display as joints
VISIBLE_KEYPOINTS = [
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
]

# Callout configuration
CALLOUT_CONFIG: List[Dict] = [
    {'label': 'WRISTS', 'keypoint': 'right_wrist', 'offset': (60, -10)},
    {'label': 'ELBOWS', 'keypoint': 'right_elbow', 'offset': (70, 0)},
    {'label': 'SHOULDERS', 'keypoint': 'right_shoulder', 'offset': (80, 10)},
    {'label': 'CORE/ABS', 'keypoint': 'core', 'offset': (90, 0)},  # Special handling
    {'label': 'HIPS', 'keypoint': 'right_hip', 'offset': (70, 10)},
    {'label': 'KNEES', 'keypoint': 'right_knee', 'offset': (60, 0)},
    {'label': 'ANKLES', 'keypoint': 'right_ankle', 'offset': (50, 10)},
]


def hex_to_bgr(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to BGR tuple"""
    hex_color = hex_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return (b, g, r)  # OpenCV uses BGR


def get_keypoint_pos(keypoints: List[Keypoint], name: str, img_w: int, img_h: int, min_conf: float = 0.3) -> Optional[Tuple[int, int]]:
    """Get pixel position of a keypoint"""
    for kp in keypoints:
        if kp.name == name and kp.visibility >= min_conf:
            return (int(kp.x * img_w), int(kp.y * img_h))
    return None


def get_midpoint(p1: Optional[Tuple[int, int]], p2: Optional[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
    """Calculate midpoint between two points"""
    if p1 is None or p2 is None:
        return None
    return ((p1[0] + p2[0]) // 2, (p1[1] + p2[1]) // 2)


def draw_skeleton(
    image: np.ndarray,
    keypoints: List[Keypoint],
    config: SkeletonConfig
) -> np.ndarray:
    """
    Draw skeleton overlay on image
    
    Args:
        image: BGR image as numpy array
        keypoints: List of detected keypoints
        config: Skeleton drawing configuration
        
    Returns:
        Image with skeleton overlay
    """
    result = image.copy()
    h, w = result.shape[:2]
    
    skeleton_color = hex_to_bgr(config.skeleton_color)
    joint_color = hex_to_bgr(config.joint_color)
    label_color = hex_to_bgr(config.label_color)
    
    # Draw skeleton lines
    for from_name, to_name in SKELETON_CONNECTIONS:
        from_pos = get_keypoint_pos(keypoints, from_name, w, h)
        to_pos = get_keypoint_pos(keypoints, to_name, w, h)
        
        if from_pos and to_pos:
            cv2.line(result, from_pos, to_pos, skeleton_color, config.line_thickness, cv2.LINE_AA)
    
    # Draw joint circles
    for name in VISIBLE_KEYPOINTS:
        pos = get_keypoint_pos(keypoints, name, w, h)
        if pos:
            cv2.circle(result, pos, config.joint_radius, joint_color, -1, cv2.LINE_AA)
            cv2.circle(result, pos, config.joint_radius, skeleton_color, 1, cv2.LINE_AA)
    
    # Draw callouts if enabled
    if config.show_callouts:
        draw_callouts(result, keypoints, w, h, label_color, config.callout_labels)
    
    return result


def draw_callouts(
    image: np.ndarray,
    keypoints: List[Keypoint],
    img_w: int,
    img_h: int,
    label_color: Tuple[int, int, int],
    labels_to_show: List[str]
) -> None:
    """Draw callout labels with leader lines"""
    for callout in CALLOUT_CONFIG:
        if callout['label'] not in labels_to_show:
            continue
            
        # Get anchor position
        if callout['keypoint'] == 'core':
            # Special handling for core - midpoint between hips, moved up
            left_hip = get_keypoint_pos(keypoints, 'left_hip', img_w, img_h)
            right_hip = get_keypoint_pos(keypoints, 'right_hip', img_w, img_h)
            left_shoulder = get_keypoint_pos(keypoints, 'left_shoulder', img_w, img_h)
            right_shoulder = get_keypoint_pos(keypoints, 'right_shoulder', img_w, img_h)
            
            hip_mid = get_midpoint(left_hip, right_hip)
            shoulder_mid = get_midpoint(left_shoulder, right_shoulder)
            anchor = get_midpoint(hip_mid, shoulder_mid)
        else:
            anchor = get_keypoint_pos(keypoints, callout['keypoint'], img_w, img_h)
        
        if anchor is None:
            continue
        
        # Calculate label position
        offset_x, offset_y = callout['offset']
        label_x = anchor[0] + offset_x
        label_y = anchor[1] + offset_y
        
        # Draw leader line
        cv2.line(image, anchor, (label_x, label_y), label_color, 1, cv2.LINE_AA)
        
        # Get text size for background
        label = callout['label']
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.4
        thickness = 1
        (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        # Draw label background
        padding = 4
        bg_x1 = label_x - padding
        bg_y1 = label_y - text_h - padding
        bg_x2 = label_x + text_w + padding
        bg_y2 = label_y + padding
        
        cv2.rectangle(image, (bg_x1, bg_y1), (bg_x2, bg_y2), (0, 0, 0), -1)
        cv2.rectangle(image, (bg_x1, bg_y1), (bg_x2, bg_y2), label_color, 1)
        
        # Draw label text
        cv2.putText(image, label, (label_x, label_y), font, font_scale, label_color, thickness, cv2.LINE_AA)

