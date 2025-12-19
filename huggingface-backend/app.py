"""
BASKETBALL SHOOTING FORM ANALYSIS API
Hugging Face Spaces Deployment

Hybrid pose detection combining:
- YOLOv8x-pose for primary pose estimation
- MediaPipe for secondary verification
- OpenCV for basketball detection
- Biomechanical angle analysis
- VIDEO analysis with frame-by-frame tracking
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import cv2
import io
import os
import ssl
import math
import torch
import tempfile

# Fix SSL issues for model downloads
ssl._create_default_https_context = ssl._create_unverified_context

# Fix PyTorch 2.6+ weights_only issue for YOLO models
import torch.serialization
try:
    from ultralytics.nn.tasks import DetectionModel, PoseModel
    torch.serialization.add_safe_globals([DetectionModel, PoseModel])
except:
    pass  # Older versions don't need this

app = Flask(__name__)

# Configure CORS from environment variable
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
allowed_origins = [origin.strip() for origin in allowed_origins]
CORS(app, origins=allowed_origins)

# Lazy load models to reduce startup time
_yolo_detect = None
_yolo_pose = None
_mediapipe_pose = None


def get_yolo_detector():
    """YOLOv8 for person detection."""
    global _yolo_detect
    if _yolo_detect is None:
        from ultralytics import YOLO
        _yolo_detect = YOLO('yolov8n.pt')
    return _yolo_detect


def get_yolo_pose():
    """YOLOv8-pose for pose estimation."""
    global _yolo_pose
    if _yolo_pose is None:
        from ultralytics import YOLO
        _yolo_pose = YOLO('yolov8x-pose.pt')
    return _yolo_pose


def get_mediapipe_pose():
    """MediaPipe for secondary pose estimation."""
    global _mediapipe_pose
    if _mediapipe_pose is None:
        import mediapipe as mp
        _mediapipe_pose = mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.3
        )
    return _mediapipe_pose


# Keypoint names
YOLO_KEYPOINTS = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

MEDIAPIPE_KEYPOINTS = {
    0: 'nose', 11: 'left_shoulder', 12: 'right_shoulder',
    13: 'left_elbow', 14: 'right_elbow', 15: 'left_wrist', 16: 'right_wrist',
    23: 'left_hip', 24: 'right_hip', 25: 'left_knee', 26: 'right_knee',
    27: 'left_ankle', 28: 'right_ankle'
}

# ============================================================
# ELITE SHOOTER REFERENCE DATA
# Ideal angles and ranges from professional shooters
# ============================================================
ELITE_SHOOTER_REFERENCE = {
    'elbow_angle': {
        'ideal': 90,
        'range': (85, 100),
        'at_release': 165,
        'release_range': (155, 175),
        'description': 'Elbow Angle',
        'elite_example': 'Steph Curry: 88° at set, 168° at release'
    },
    'knee_angle': {
        'ideal': 145,
        'range': (135, 160),
        'description': 'Knee Bend',
        'elite_example': 'Klay Thompson: 142° knee bend'
    },
    'shoulder_tilt': {
        'ideal': 0,
        'range': (-5, 5),
        'description': 'Shoulder Alignment',
        'elite_example': 'Ray Allen: Near-perfect 0° tilt'
    },
    'hip_tilt': {
        'ideal': 0,
        'range': (-8, 8),
        'description': 'Hip Alignment',
        'elite_example': 'Kevin Durant: Stable hip base'
    },
    'wrist_angle': {
        'ideal': 70,
        'range': (60, 80),
        'at_release': 45,
        'description': 'Wrist Cock',
        'elite_example': 'Steph Curry: 72° wrist cock'
    },
    'follow_through': {
        'ideal': 45,
        'range': (30, 60),
        'description': 'Follow Through',
        'elite_example': 'Kobe Bryant: Perfect 45° follow through'
    }
}

# ============================================================
# PREMIUM COLOR SCHEME - Professional Sports Analysis Look
# ============================================================
ANNOTATION_COLORS = {
    'good': (0, 200, 100),       # Teal green - BGR
    'warning': (0, 180, 255),    # Orange - BGR  
    'bad': (80, 80, 255),        # Soft red - BGR
    'highlight': (0, 215, 255),  # Gold - BGR
    'accent': (255, 180, 0),     # Cyan accent - BGR
    'text_bg': (30, 30, 35),     # Near black background
    'card_bg': (45, 45, 50),     # Card background
    'white': (255, 255, 255),
    'light_gray': (200, 200, 200),
    'mid_gray': (140, 140, 140),
    'skeleton': (255, 140, 0),   # Bright cyan for skeleton
    'skeleton_joint': (0, 255, 255),  # Yellow joints
    'black': (0, 0, 0)
}

# Fix order for sequential reveal (in shooting motion order)
FIX_ORDER = [
    {'key': 'knee', 'name': 'Knee Bend', 'phase': 'SETUP'},
    {'key': 'hip', 'name': 'Hip Alignment', 'phase': 'SETUP'},
    {'key': 'elbow', 'name': 'Elbow Angle', 'phase': 'RISE'},
    {'key': 'shoulder', 'name': 'Shoulder Alignment', 'phase': 'RELEASE'},
]


def get_angle_feedback(angle_name, value):
    """
    Get feedback for an angle compared to elite shooter reference.
    Returns detailed feedback with status and comparison data.
    """
    key_map = {
        'left_elbow_angle': 'elbow_angle',
        'right_elbow_angle': 'elbow_angle',
        'left_knee_angle': 'knee_angle',
        'right_knee_angle': 'knee_angle',
        'shoulder_tilt': 'shoulder_tilt',
        'hip_tilt': 'hip_tilt'
    }
    
    ref_key = key_map.get(angle_name)
    if not ref_key or ref_key not in ELITE_SHOOTER_REFERENCE:
        return None
    
    ref = ELITE_SHOOTER_REFERENCE[ref_key]
    ideal = ref['ideal']
    min_val, max_val = ref['range']
    
    # Determine status
    if min_val <= value <= max_val:
        status = 'good'
        feedback = 'EXCELLENT - In elite range'
    elif abs(value - ideal) <= 15:
        status = 'warning'
        if value < min_val:
            feedback = f'ADJUST - {int(min_val - value)}° below optimal'
        else:
            feedback = f'ADJUST - {int(value - max_val)}° above optimal'
    else:
        status = 'bad'
        if value < min_val:
            feedback = f'FIX THIS - {int(min_val - value)}° too low'
        else:
            feedback = f'FIX THIS - {int(value - max_val)}° too high'
    
    return {
        'status': status,
        'ideal': ideal,
        'range': ref['range'],
        'feedback': feedback,
        'description': ref['description'],
        'elite_example': ref['elite_example']
    }


def draw_rounded_rect(img, pt1, pt2, color, thickness=-1, radius=15):
    """Draw a rectangle with rounded corners."""
    x1, y1 = pt1
    x2, y2 = pt2
    
    if thickness == -1:  # Filled
        # Draw filled rounded rectangle
        cv2.rectangle(img, (x1 + radius, y1), (x2 - radius, y2), color, -1)
        cv2.rectangle(img, (x1, y1 + radius), (x2, y2 - radius), color, -1)
        cv2.circle(img, (x1 + radius, y1 + radius), radius, color, -1)
        cv2.circle(img, (x2 - radius, y1 + radius), radius, color, -1)
        cv2.circle(img, (x1 + radius, y2 - radius), radius, color, -1)
        cv2.circle(img, (x2 - radius, y2 - radius), radius, color, -1)
    else:  # Border only
        cv2.line(img, (x1 + radius, y1), (x2 - radius, y1), color, thickness)
        cv2.line(img, (x1 + radius, y2), (x2 - radius, y2), color, thickness)
        cv2.line(img, (x1, y1 + radius), (x1, y2 - radius), color, thickness)
        cv2.line(img, (x2, y1 + radius), (x2, y2 - radius), color, thickness)
        cv2.ellipse(img, (x1 + radius, y1 + radius), (radius, radius), 180, 0, 90, color, thickness)
        cv2.ellipse(img, (x2 - radius, y1 + radius), (radius, radius), 270, 0, 90, color, thickness)
        cv2.ellipse(img, (x1 + radius, y2 - radius), (radius, radius), 90, 0, 90, color, thickness)
        cv2.ellipse(img, (x2 - radius, y2 - radius), (radius, radius), 0, 0, 90, color, thickness)


def draw_premium_skeleton(img, keypoints, highlight_joint=None):
    """
    Draw a premium-looking skeleton with glow effects.
    Skeleton lines are pushed outward from body for cleaner look.
    """
    h, w = img.shape[:2]
    
    # Create overlay for glow effect
    overlay = img.copy()
    
    # Draw connections with glow
    for start, end in SKELETON_CONNECTIONS:
        if start in keypoints and end in keypoints:
            pt1 = (int(keypoints[start]['x']), int(keypoints[start]['y']))
            pt2 = (int(keypoints[end]['x']), int(keypoints[end]['y']))
            
            # Glow layer (thicker, semi-transparent)
            cv2.line(overlay, pt1, pt2, ANNOTATION_COLORS['skeleton'], 8)
            # Main line
            cv2.line(img, pt1, pt2, ANNOTATION_COLORS['skeleton'], 3)
            # Bright center line
            cv2.line(img, pt1, pt2, ANNOTATION_COLORS['white'], 1)
    
    # Blend glow
    cv2.addWeighted(overlay, 0.3, img, 0.7, 0, img)
    
    # Draw joints with premium look
    for name, kp in keypoints.items():
        x, y = int(kp['x']), int(kp['y'])
        
        # Determine if this joint should be highlighted
        is_highlighted = False
        if highlight_joint:
            if highlight_joint == 'elbow' and 'elbow' in name:
                is_highlighted = True
            elif highlight_joint == 'knee' and 'knee' in name:
                is_highlighted = True
            elif highlight_joint == 'shoulder' and 'shoulder' in name:
                is_highlighted = True
            elif highlight_joint == 'hip' and 'hip' in name:
                is_highlighted = True
        
        if is_highlighted:
            # Large glowing highlight
            cv2.circle(img, (x, y), 25, ANNOTATION_COLORS['highlight'], 3)
            cv2.circle(img, (x, y), 30, ANNOTATION_COLORS['highlight'], 2)
            cv2.circle(img, (x, y), 35, ANNOTATION_COLORS['highlight'], 1)
            cv2.circle(img, (x, y), 12, ANNOTATION_COLORS['highlight'], -1)
            cv2.circle(img, (x, y), 8, ANNOTATION_COLORS['white'], -1)
        else:
            # Standard joint
            cv2.circle(img, (x, y), 10, ANNOTATION_COLORS['skeleton_joint'], -1)
            cv2.circle(img, (x, y), 12, ANNOTATION_COLORS['white'], 2)


def draw_premium_fix_card(img, fix_number, title, your_value, elite_value, 
                          feedback, status, elite_example, position='left',
                          y_offset=0, highlighted=False):
    """
    Draw a large, premium-looking fix card with all information.
    Designed to be clearly readable when zoomed.
    
    Args:
        y_offset: Vertical offset for stacking multiple cards
        highlighted: If True, draw with extra emphasis (glowing border)
    """
    h, w = img.shape[:2]
    
    # Card dimensions - LARGE for readability
    card_width = 380
    card_height = 220
    padding = 20
    
    # Position card on left or right side of frame
    if position == 'left':
        card_x = 30
    else:
        card_x = w - card_width - 30
    
    # Apply y_offset and center vertically
    base_y = h // 2 - card_height // 2
    card_y = base_y + y_offset
    
    # Keep card in frame
    card_y = max(20, min(card_y, h - card_height - 20))
    
    # Get status color
    status_color = ANNOTATION_COLORS.get(status, ANNOTATION_COLORS['white'])
    
    # If highlighted, draw a glow effect behind the card
    if highlighted:
        # Draw glow layers
        for glow_size in [12, 8, 4]:
            glow_alpha = 0.3 - (glow_size * 0.02)
            glow_color = tuple(int(c * 0.7) for c in status_color)
            draw_rounded_rect(img, 
                             (card_x - glow_size, card_y - glow_size), 
                             (card_x + card_width + glow_size, card_y + card_height + glow_size),
                             glow_color, 3, radius=12 + glow_size)
    
    # Draw card background with rounded corners
    draw_rounded_rect(img, (card_x, card_y), (card_x + card_width, card_y + card_height),
                      ANNOTATION_COLORS['card_bg'], -1, radius=12)
    
    # Draw status-colored left border
    cv2.rectangle(img, (card_x, card_y + 10), (card_x + 6, card_y + card_height - 10),
                  status_color, -1)
    
    # Draw card border - thicker if highlighted
    border_thickness = 3 if highlighted else 2
    border_color = status_color if highlighted else (80, 80, 85)
    draw_rounded_rect(img, (card_x, card_y), (card_x + card_width, card_y + card_height),
                      border_color, border_thickness, radius=12)
    
    # Fix number badge
    badge_size = 45
    badge_x = card_x + padding
    badge_y = card_y + padding
    cv2.circle(img, (badge_x + badge_size//2, badge_y + badge_size//2), 
               badge_size//2, status_color, -1)
    cv2.putText(img, str(fix_number), (badge_x + 14, badge_y + 32),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, ANNOTATION_COLORS['white'], 2)
    
    # Title
    title_x = badge_x + badge_size + 15
    title_y = badge_y + 20
    cv2.putText(img, title.upper(), (title_x, title_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, ANNOTATION_COLORS['white'], 2)
    
    # Status feedback
    cv2.putText(img, feedback, (title_x, title_y + 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 1)
    
    # Divider line
    divider_y = card_y + 85
    cv2.line(img, (card_x + padding, divider_y), 
             (card_x + card_width - padding, divider_y), (70, 70, 75), 1)
    
    # Your value vs Elite value - large and clear
    value_y = divider_y + 40
    
    # Your value
    cv2.putText(img, "YOUR ANGLE", (card_x + padding, value_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, ANNOTATION_COLORS['mid_gray'], 1)
    cv2.putText(img, f"{int(your_value)}°", (card_x + padding, value_y + 35),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, ANNOTATION_COLORS['white'], 2)
    
    # Elite value
    elite_x = card_x + card_width // 2 + 20
    cv2.putText(img, "ELITE TARGET", (elite_x, value_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, ANNOTATION_COLORS['mid_gray'], 1)
    cv2.putText(img, f"{int(elite_value)}°", (elite_x, value_y + 35),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, ANNOTATION_COLORS['highlight'], 2)
    
    # Elite example at bottom
    example_y = card_y + card_height - 25
    cv2.putText(img, elite_example, (card_x + padding, example_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, ANNOTATION_COLORS['mid_gray'], 1)
    
    return card_x, card_y, card_width, card_height


def draw_connection_line(img, card_pos, joint_pos, color):
    """Draw a sleek connection line from card to joint."""
    card_x, card_y, card_w, card_h = card_pos
    joint_x, joint_y = joint_pos
    
    # Determine which side of card to connect from
    if joint_x > card_x + card_w:
        start_x = card_x + card_w
        start_y = card_y + card_h // 2
    else:
        start_x = card_x
        start_y = card_y + card_h // 2
    
    # Draw curved connection line
    mid_x = (start_x + joint_x) // 2
    
    # Draw line segments for a sleek look
    cv2.line(img, (start_x, start_y), (mid_x, start_y), color, 2)
    cv2.line(img, (mid_x, start_y), (mid_x, joint_y), color, 2)
    cv2.line(img, (mid_x, joint_y), (joint_x, joint_y), color, 2)
    
    # Arrow head at joint
    cv2.circle(img, (joint_x, joint_y), 8, color, -1)
    cv2.circle(img, (joint_x, joint_y), 12, color, 2)


def zoom_to_region(frame, center, zoom_factor=1.8, output_size=None):
    """
    Zoom into a specific region of the frame.
    Returns a cropped and scaled version focused on the center point.
    """
    h, w = frame.shape[:2]
    if output_size is None:
        output_size = (w, h)
    
    # Calculate crop region
    crop_w = int(w / zoom_factor)
    crop_h = int(h / zoom_factor)
    
    # Center the crop on the target point
    cx, cy = center
    x1 = max(0, cx - crop_w // 2)
    y1 = max(0, cy - crop_h // 2)
    x2 = min(w, x1 + crop_w)
    y2 = min(h, y1 + crop_h)
    
    # Adjust if we hit edges
    if x2 - x1 < crop_w:
        x1 = max(0, x2 - crop_w)
    if y2 - y1 < crop_h:
        y1 = max(0, y2 - crop_h)
    
    # Crop and resize
    cropped = frame[y1:y2, x1:x2]
    zoomed = cv2.resize(cropped, output_size, interpolation=cv2.INTER_LINEAR)
    
    return zoomed


def get_joint_center(keypoints, joint_type, side='right'):
    """Get the center position for a joint type."""
    if joint_type == 'elbow':
        key = f'{side}_elbow'
    elif joint_type == 'knee':
        key = f'{side}_knee'
    elif joint_type == 'shoulder':
        # Use midpoint between shoulders
        if 'left_shoulder' in keypoints and 'right_shoulder' in keypoints:
            x = (keypoints['left_shoulder']['x'] + keypoints['right_shoulder']['x']) / 2
            y = (keypoints['left_shoulder']['y'] + keypoints['right_shoulder']['y']) / 2
            return (int(x), int(y))
        key = f'{side}_shoulder'
    elif joint_type == 'hip':
        # Use midpoint between hips
        if 'left_hip' in keypoints and 'right_hip' in keypoints:
            x = (keypoints['left_hip']['x'] + keypoints['right_hip']['x']) / 2
            y = (keypoints['left_hip']['y'] + keypoints['right_hip']['y']) / 2
            return (int(x), int(y))
        key = f'{side}_hip'
    else:
        return None
    
    if key in keypoints:
        return (int(keypoints[key]['x']), int(keypoints[key]['y']))
    return None


def draw_single_fix_frame(frame, keypoints, angles, fix_info, fix_number):
    """
    Draw a single fix annotation with zoom effect.
    This creates one frame showing ONE fix clearly.
    """
    h, w = frame.shape[:2]
    frame_copy = frame.copy()
    
    joint_type = fix_info['key']
    
    # Get the joint position
    joint_center = get_joint_center(keypoints, joint_type)
    if not joint_center:
        return frame_copy
    
    # Get angle value and feedback
    angle_key = None
    if joint_type == 'elbow':
        angle_key = 'right_elbow_angle' if 'right_elbow_angle' in angles else 'left_elbow_angle'
    elif joint_type == 'knee':
        angle_key = 'right_knee_angle' if 'right_knee_angle' in angles else 'left_knee_angle'
    elif joint_type == 'shoulder':
        angle_key = 'shoulder_tilt'
    elif joint_type == 'hip':
        angle_key = 'hip_tilt'
    
    if not angle_key or angle_key not in angles:
        return frame_copy
    
    angle_value = angles[angle_key]
    feedback = get_angle_feedback(angle_key, angle_value)
    if not feedback:
        return frame_copy
    
    # Draw premium skeleton with this joint highlighted
    draw_premium_skeleton(frame_copy, keypoints, highlight_joint=joint_type)
    
    # Zoom into the joint area
    zoomed = zoom_to_region(frame_copy, joint_center, zoom_factor=1.6, output_size=(w, h))
    
    # Recalculate joint position in zoomed frame
    # (This is approximate - the zoom centers on the joint)
    zoomed_joint = (w // 2, h // 2)
    
    # Draw the premium fix card
    card_pos = draw_premium_fix_card(
        zoomed,
        fix_number=fix_number,
        title=fix_info['name'],
        your_value=angle_value,
        elite_value=feedback['ideal'],
        feedback=feedback['feedback'],
        status=feedback['status'],
        elite_example=feedback['elite_example'],
        position='left' if joint_center[0] > w // 2 else 'right'
    )
    
    # Draw connection line from card to joint
    draw_connection_line(zoomed, card_pos, zoomed_joint, 
                        ANNOTATION_COLORS[feedback['status']])
    
    return zoomed


def draw_intro_frame(frame, keypoints, angles, all_fixes):
    """
    Draw an intro/summary frame showing all fixes at once.
    This is the "starter screen" before sequential reveal.
    """
    h, w = frame.shape[:2]
    frame_copy = frame.copy()
    
    # Draw premium skeleton
    draw_premium_skeleton(frame_copy, keypoints)
    
    # Add dark overlay for better text visibility
    overlay = frame_copy.copy()
    cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.3, frame_copy, 0.7, 0, frame_copy)
    
    # Title
    title = "SHOOTING FORM ANALYSIS"
    (tw, th), _ = cv2.getTextSize(title, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 2)
    cv2.putText(frame_copy, title, ((w - tw) // 2, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, ANNOTATION_COLORS['highlight'], 2)
    
    # Subtitle
    subtitle = f"{len(all_fixes)} areas to review"
    (sw, sh), _ = cv2.getTextSize(subtitle, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 1)
    cv2.putText(frame_copy, subtitle, ((w - sw) // 2, 85),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, ANNOTATION_COLORS['light_gray'], 1)
    
    # List fixes at bottom
    fix_y = h - 30 - len(all_fixes) * 35
    for i, fix in enumerate(all_fixes):
        angle_key = None
        if fix['key'] == 'elbow':
            angle_key = 'right_elbow_angle' if 'right_elbow_angle' in angles else 'left_elbow_angle'
        elif fix['key'] == 'knee':
            angle_key = 'right_knee_angle' if 'right_knee_angle' in angles else 'left_knee_angle'
        elif fix['key'] == 'shoulder':
            angle_key = 'shoulder_tilt'
        elif fix['key'] == 'hip':
            angle_key = 'hip_tilt'
        
        status = 'good'
        if angle_key and angle_key in angles:
            feedback = get_angle_feedback(angle_key, angles[angle_key])
            if feedback:
                status = feedback['status']
        
        color = ANNOTATION_COLORS[status]
        
        # Fix number circle
        cv2.circle(frame_copy, (50, fix_y + i * 35), 12, color, -1)
        cv2.putText(frame_copy, str(i + 1), (45, fix_y + i * 35 + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, ANNOTATION_COLORS['white'], 1)
        
        # Fix name
        cv2.putText(frame_copy, fix['name'], (75, fix_y + i * 35 + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, ANNOTATION_COLORS['white'], 1)
    
    return frame_copy


def draw_annotated_frame(frame, keypoints, angles, phase=None, ball_pos=None, 
                         show_annotations=True, annotation_focus=None):
    """
    Draw skeleton with premium annotations.
    For video playback - shows skeleton with optional single focus annotation.
    """
    frame_copy = frame.copy()
    h, w = frame_copy.shape[:2]
    
    # Draw premium skeleton
    draw_premium_skeleton(frame_copy, keypoints, highlight_joint=annotation_focus)
    
    # Draw basketball with premium look
    if ball_pos:
        cx, cy, radius = ball_pos
        # Glow effect
        overlay = frame_copy.copy()
        cv2.circle(overlay, (cx, cy), radius + 15, ANNOTATION_COLORS['highlight'], 3)
        cv2.addWeighted(overlay, 0.4, frame_copy, 0.6, 0, frame_copy)
        # Main circle
        cv2.circle(frame_copy, (cx, cy), radius, ANNOTATION_COLORS['highlight'], 3)
        cv2.circle(frame_copy, (cx, cy), radius - 3, ANNOTATION_COLORS['white'], 1)
    
    # Draw phase label with premium style
    if phase:
        phase_colors = {
            'SETUP': ANNOTATION_COLORS['accent'],
            'RISE': ANNOTATION_COLORS['warning'],
            'RELEASE': ANNOTATION_COLORS['good'],
            'FOLLOW_THROUGH': ANNOTATION_COLORS['highlight']
        }
        color = phase_colors.get(phase, ANNOTATION_COLORS['white'])
        
        # Phase badge
        badge_w, badge_h = 180, 40
        draw_rounded_rect(frame_copy, (15, 15), (15 + badge_w, 15 + badge_h),
                         ANNOTATION_COLORS['card_bg'], -1, radius=8)
        draw_rounded_rect(frame_copy, (15, 15), (15 + badge_w, 15 + badge_h),
                         color, 2, radius=8)
        cv2.putText(frame_copy, phase.replace('_', ' '), (30, 43),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    if not show_annotations:
        return frame_copy
    
    # If there's a specific focus, show just that one with zoom
    if annotation_focus:
        return draw_single_fix_frame(frame, keypoints, angles, 
                                     {'key': annotation_focus, 'name': annotation_focus.title()}, 1)
    
    return frame_copy


def generate_annotation_sequence(frame, keypoints, angles, ball_pos=None):
    """
    Generate a PREMIUM sequence of frames for animated annotation reveal.
    Sequential reveal with zoom into each fix area.
    
    Flow:
    1. Intro screen (2 sec) - Overview with all fixes listed
    2. Fix 1 - Zoomed view (3 sec)
    3. Fix 2 - Zoomed view (3 sec)
    4. Fix 3 - Zoomed view (3 sec)
    5. Fix 4 - Zoomed view (3 sec)
    6. Full view (2 sec) - All together
    
    Returns: List of frames for video playback at 10fps
    """
    frames = []
    fps = 10
    
    # Determine which fixes apply (have valid angles)
    active_fixes = []
    for fix in FIX_ORDER:
        angle_key = None
        if fix['key'] == 'elbow':
            angle_key = 'right_elbow_angle' if 'right_elbow_angle' in angles else 'left_elbow_angle'
        elif fix['key'] == 'knee':
            angle_key = 'right_knee_angle' if 'right_knee_angle' in angles else 'left_knee_angle'
        elif fix['key'] == 'shoulder':
            angle_key = 'shoulder_tilt'
        elif fix['key'] == 'hip':
            angle_key = 'hip_tilt'
        
        if angle_key and angle_key in angles:
            active_fixes.append(fix)
    
    # 1. INTRO SCREEN (2 seconds = 20 frames)
    intro_frame = draw_intro_frame(frame, keypoints, angles, active_fixes)
    for _ in range(fps * 2):
        frames.append(intro_frame.copy())
    
    # 2. SEQUENTIAL FIX REVEALS (3 seconds each)
    for i, fix in enumerate(active_fixes):
        fix_frame = draw_single_fix_frame(frame, keypoints, angles, fix, i + 1)
        for _ in range(fps * 3):
            frames.append(fix_frame.copy())
    
    # 3. FULL VIEW - skeleton only (2 seconds)
    full_frame = frame.copy()
    draw_premium_skeleton(full_frame, keypoints)
    
    # Add "Analysis Complete" badge
    h, w = full_frame.shape[:2]
    badge_text = "ANALYSIS COMPLETE"
    (tw, th), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
    badge_x = (w - tw - 40) // 2
    badge_y = h - 60
    draw_rounded_rect(full_frame, (badge_x, badge_y), (badge_x + tw + 40, badge_y + 45),
                     ANNOTATION_COLORS['card_bg'], -1, radius=10)
    draw_rounded_rect(full_frame, (badge_x, badge_y), (badge_x + tw + 40, badge_y + 45),
                     ANNOTATION_COLORS['good'], 2, radius=10)
    cv2.putText(full_frame, badge_text, (badge_x + 20, badge_y + 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, ANNOTATION_COLORS['good'], 2)
    
    for _ in range(fps * 2):
        frames.append(full_frame.copy())
    
    return frames


def generate_video_with_pauses(frames, keypoints_list, angles_list, phases, target_fps=10):
    """
    Generate video frames with the annotation walkthrough sequence:
    
    SEQUENCE:
    1. STARTER SCREEN: Full frame with ALL annotations + skeleton (this is frame 0, paused until user plays)
    2. FOR EACH ANNOTATION:
       a. Show annotation label/card (4-5 seconds) - full frame with that annotation highlighted
       b. Quick pan & zoom to body part (3 seconds) - zoom into the joint area
    3. FINAL CLEAN RUN: Play full video with skeleton only (no annotations)
    """
    output_frames = []
    h, w = frames[0].shape[:2] if frames else (720, 1280)
    output_size = (w, h)
    
    # Timing (in frames at target_fps)
    annotation_duration = int(target_fps * 4.5)  # 4.5 seconds on annotation
    zoom_duration = int(target_fps * 3)  # 3 seconds zoomed on body part
    quick_transition = int(target_fps * 0.3)  # 0.3 second quick transition
    
    # Use a representative frame for the annotation walkthrough (middle of video)
    base_frame_idx = len(frames) // 2
    base_frame = frames[base_frame_idx] if frames else None
    base_keypoints = keypoints_list[base_frame_idx] if base_frame_idx < len(keypoints_list) else {}
    base_angles = angles_list[base_frame_idx] if base_frame_idx < len(angles_list) else {}
    
    if base_frame is None:
        return output_frames
    
    # ============================================================
    # Determine which fixes to show based on detected angles
    # ============================================================
    fixes_to_show = []
    for fix_info in FIX_ORDER:
        joint_type = fix_info['key']
        angle_key = None
        if joint_type == 'elbow':
            angle_key = 'right_elbow_angle' if 'right_elbow_angle' in base_angles else 'left_elbow_angle'
        elif joint_type == 'knee':
            angle_key = 'right_knee_angle' if 'right_knee_angle' in base_angles else 'left_knee_angle'
        elif joint_type == 'shoulder':
            angle_key = 'shoulder_tilt'
        elif joint_type == 'hip':
            angle_key = 'hip_tilt'
        
        if angle_key and angle_key in base_angles:
            feedback = get_angle_feedback(angle_key, base_angles[angle_key])
            if feedback:
                fixes_to_show.append({
                    **fix_info,
                    'angle_key': angle_key,
                    'angle_value': base_angles[angle_key],
                    'feedback': feedback
                })
    
    # ============================================================
    # STEP 1: STARTER SCREEN
    # Full frame with ALL annotations + skeleton visible
    # This is the first frame - video starts paused on this
    # ============================================================
    starter_frame = base_frame.copy()
    draw_premium_skeleton(starter_frame, base_keypoints)
    
    # Draw ALL fix cards on the starter frame
    card_positions = []
    for fix_idx, fix in enumerate(fixes_to_show):
        fix_number = fix_idx + 1
        joint_type = fix['key']
        joint_center = get_joint_center(base_keypoints, joint_type)
        
        if not joint_center:
            continue
        
        feedback = fix['feedback']
        
        # Determine card position (alternate left/right based on joint position)
        position = 'left' if joint_center[0] > w // 2 else 'right'
        # Offset each card vertically to prevent overlap
        y_offset = fix_idx * 120
        
        card_pos = draw_premium_fix_card(
            starter_frame,
            fix_number,
            fix['name'],
            fix['angle_value'],
            feedback['ideal'],
            feedback['feedback'],
            feedback['status'],
            feedback['elite_example'],
            position=position,
            y_offset=y_offset
        )
        
        # Draw connection line from card to joint
        draw_connection_line(starter_frame, card_pos, joint_center, 
                            ANNOTATION_COLORS.get(feedback['status'], ANNOTATION_COLORS['white']))
        
        card_positions.append({
            'fix': fix,
            'card_pos': card_pos,
            'joint_center': joint_center,
            'feedback': feedback
        })
    
    # Add title text to starter frame
    title_text = "FORM ANALYSIS - Press Play"
    text_size = cv2.getTextSize(title_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)[0]
    title_x = (w - text_size[0]) // 2
    # Draw title background
    cv2.rectangle(starter_frame, (title_x - 15, 10), (title_x + text_size[0] + 15, 55),
                  ANNOTATION_COLORS['card_bg'], -1)
    cv2.putText(starter_frame, title_text, (title_x, 42),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, ANNOTATION_COLORS['accent'], 2)
    
    # Add starter frame (this will be frame 0 - video starts paused here)
    output_frames.append(starter_frame)
    
    # ============================================================
    # STEP 2: FOR EACH ANNOTATION
    # a. Show annotation (4-5 seconds)
    # b. Quick pan & zoom to body part (3 seconds)
    # ============================================================
    
    for fix_idx, card_data in enumerate(card_positions):
        fix = card_data['fix']
        joint_center = card_data['joint_center']
        feedback = card_data['feedback']
        card_pos = card_data['card_pos']
        fix_number = fix_idx + 1
        joint_type = fix['key']
        
        # Create frame with THIS annotation highlighted
        highlight_frame = base_frame.copy()
        draw_premium_skeleton(highlight_frame, base_keypoints, highlight_joint=joint_type)
        
        # Draw only THIS fix card (highlighted)
        card_pos = draw_premium_fix_card(
            highlight_frame,
            fix_number,
            fix['name'],
            fix['angle_value'],
            feedback['ideal'],
            feedback['feedback'],
            feedback['status'],
            feedback['elite_example'],
            position='left' if joint_center[0] > w // 2 else 'right',
            highlighted=True  # Make this card stand out
        )
        
        # Draw connection line
        draw_connection_line(highlight_frame, card_pos, joint_center, 
                            ANNOTATION_COLORS.get(feedback['status'], ANNOTATION_COLORS['white']))
        
        # Add annotation number indicator
        indicator_text = f"FIX {fix_number} of {len(card_positions)}"
        cv2.rectangle(highlight_frame, (w - 200, 10), (w - 10, 45),
                      ANNOTATION_COLORS['card_bg'], -1)
        cv2.putText(highlight_frame, indicator_text, (w - 190, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, ANNOTATION_COLORS['accent'], 2)
        
        # PART A: Show annotation label (4-5 seconds)
        for _ in range(annotation_duration):
            output_frames.append(highlight_frame.copy())
        
        # PART B: Quick pan & zoom to body part (3 seconds)
        # Quick zoom in transition (0.3 seconds)
        for t in range(quick_transition):
            progress = t / quick_transition
            zoom = 1.0 + (1.8 * progress)  # Zoom from 1.0x to 2.8x quickly
            zoomed = zoom_to_region(highlight_frame, joint_center, zoom_factor=zoom, output_size=output_size)
            output_frames.append(zoomed)
        
        # Hold zoomed on body part (most of the 3 seconds)
        hold_duration = zoom_duration - (2 * quick_transition)
        for _ in range(hold_duration):
            zoomed = zoom_to_region(highlight_frame, joint_center, zoom_factor=2.8, output_size=output_size)
            output_frames.append(zoomed)
        
        # Quick zoom out transition (0.3 seconds)
        for t in range(quick_transition):
            progress = t / quick_transition
            zoom = 2.8 - (1.8 * progress)  # Zoom from 2.8x to 1.0x quickly
            zoomed = zoom_to_region(highlight_frame, joint_center, zoom_factor=max(1.0, zoom), output_size=output_size)
            output_frames.append(zoomed)
    
    # ============================================================
    # STEP 3: FINAL CLEAN RUN
    # Play the full video with skeleton only (no annotations)
    # ============================================================
    
    for i, frame in enumerate(frames):
        keypoints = keypoints_list[i] if i < len(keypoints_list) else {}
        phase = phases[i] if i < len(phases) else None
        
        # Draw frame with skeleton only (no annotations)
        clean_frame = frame.copy()
        draw_premium_skeleton(clean_frame, keypoints)
        
        # Add phase badge (small, unobtrusive)
        if phase:
            phase_colors = {
                'SETUP': ANNOTATION_COLORS['accent'],
                'RISE': ANNOTATION_COLORS['warning'],
                'RELEASE': ANNOTATION_COLORS['good'],
                'FOLLOW_THROUGH': ANNOTATION_COLORS['highlight']
            }
            color = phase_colors.get(phase, ANNOTATION_COLORS['white'])
            badge_w, badge_h = 150, 35
            draw_rounded_rect(clean_frame, (15, 15), (15 + badge_w, 15 + badge_h),
                             ANNOTATION_COLORS['card_bg'], -1, radius=8)
            draw_rounded_rect(clean_frame, (15, 15), (15 + badge_w, 15 + badge_h),
                             color, 2, radius=8)
            cv2.putText(clean_frame, phase.replace('_', ' '), (25, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        output_frames.append(clean_frame)
    
    return output_frames


def find_shooter_bbox(image_np):
    """Find the main shooter in the image."""
    h, w = image_np.shape[:2]
    model = get_yolo_detector()
    results = model(image_np, classes=[0], verbose=False)
    
    if not results or len(results[0].boxes) == 0:
        return None
    
    best_box = None
    best_score = -1
    
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        box_w, box_h = x2 - x1, y2 - y1
        area = box_w * box_h
        
        area_score = (area / (w * h)) * 100
        left_score = 30 if x1 < w * 0.4 else 0
        height_score = 30 if box_h > h * 0.5 else 0
        
        score = area_score + left_score + height_score
        
        if score > best_score:
            best_score = score
            best_box = (int(x1), int(y1), int(x2), int(y2))
    
    return best_box


def detect_pose_yolo(image_np, bbox=None):
    """Detect pose using YOLOv8x-pose."""
    h, w = image_np.shape[:2]
    model = get_yolo_pose()
    results = model(image_np, verbose=False)
    
    if not results or results[0].keypoints is None:
        return None
    
    best_idx = 0
    best_score = -1
    
    for idx in range(len(results[0].keypoints)):
        if results[0].boxes is not None and idx < len(results[0].boxes):
            box = results[0].boxes[idx]
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            area = (x2 - x1) * (y2 - y1)
            score = area / (w * h)
            
            if x1 < w * 0.4:
                score += 0.3
            
            if bbox:
                overlap = calculate_iou((x1, y1, x2, y2), bbox)
                score += overlap * 0.5
            
            if score > best_score:
                best_score = score
                best_idx = idx
    
    kpts = results[0].keypoints[best_idx]
    xy = kpts.xy[0].cpu().numpy()
    conf = kpts.conf[0].cpu().numpy() if hasattr(kpts, 'conf') else np.ones(17)
    
    keypoints = {}
    for i, name in enumerate(YOLO_KEYPOINTS):
        keypoints[name] = {
            'x': float(xy[i][0]),
            'y': float(xy[i][1]),
            'confidence': float(conf[i]),
            'source': 'yolo'
        }
    
    return keypoints


def detect_pose_mediapipe(image_np, bbox=None):
    """Detect pose using MediaPipe."""
    h, w = image_np.shape[:2]
    
    if bbox:
        x1, y1, x2, y2 = bbox
        pad = 20
        x1, y1 = max(0, x1-pad), max(0, y1-pad)
        x2, y2 = min(w, x2+pad), min(h, y2+pad)
        cropped = image_np[y1:y2, x1:x2]
        crop_h, crop_w = cropped.shape[:2]
    else:
        cropped = image_np
        x1, y1 = 0, 0
        crop_h, crop_w = h, w
    
    pose = get_mediapipe_pose()
    image_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    
    if not results.pose_landmarks:
        return None
    
    keypoints = {}
    for idx, name in MEDIAPIPE_KEYPOINTS.items():
        lm = results.pose_landmarks.landmark[idx]
        keypoints[name] = {
            'x': float(x1 + lm.x * crop_w),
            'y': float(y1 + lm.y * crop_h),
            'confidence': float(lm.visibility),
            'source': 'mediapipe'
        }
    
    return keypoints


def find_basketball(image_np, wrist_positions=None):
    """Find the basketball near the wrists - improved detection."""
    h, w = image_np.shape[:2]
    
    if not wrist_positions or len(wrist_positions) == 0:
        return None
    
    wrist_xs = [wp[0] for wp in wrist_positions]
    wrist_ys = [wp[1] for wp in wrist_positions]
    wrist_center_x = sum(wrist_xs) / len(wrist_xs)
    wrist_center_y = sum(wrist_ys) / len(wrist_ys)
    
    # Search ABOVE the wrists (ball is typically held above hands during shot)
    # Expand search area and shift upward
    search_radius_x = int(w * 0.15)
    search_radius_y = int(h * 0.15)
    
    # Shift search area UP from wrist center (ball is above hands)
    search_center_y = wrist_center_y - int(h * 0.05)
    
    search_x1 = max(0, int(wrist_center_x - search_radius_x))
    search_y1 = max(0, int(search_center_y - search_radius_y))
    search_x2 = min(w, int(wrist_center_x + search_radius_x))
    search_y2 = min(h, int(search_center_y + search_radius_y))
    
    search_region = image_np[search_y1:search_y2, search_x1:search_x2]
    
    if search_region.size == 0:
        return None
    
    hsv = cv2.cvtColor(search_region, cv2.COLOR_BGR2HSV)
    
    # Basketball orange color range - more specific to avoid skin
    # Basketballs are typically more saturated and darker orange than skin
    lower_ball = np.array([5, 120, 80])   # More saturated, darker
    upper_ball = np.array([20, 255, 220])
    ball_mask = cv2.inRange(hsv, lower_ball, upper_ball)
    
    # Also try to detect the distinctive basketball texture (dark lines)
    # by looking for areas with high local contrast
    gray = cv2.cvtColor(search_region, cv2.COLOR_BGR2GRAY)
    
    # Exclude skin tones more aggressively
    # Skin tends to be less saturated and in a specific hue range
    lower_skin = np.array([0, 20, 70])
    upper_skin = np.array([25, 150, 255])
    skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Remove skin from ball mask
    ball_mask = cv2.bitwise_and(ball_mask, cv2.bitwise_not(skin_mask))
    
    kernel = np.ones((5, 5), np.uint8)
    ball_mask = cv2.morphologyEx(ball_mask, cv2.MORPH_CLOSE, kernel)
    ball_mask = cv2.morphologyEx(ball_mask, cv2.MORPH_OPEN, kernel)
    
    contours, _ = cv2.findContours(ball_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None
    
    # Find the most circular contour (basketballs are round)
    best_contour = None
    best_score = 0
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 500:  # Minimum area threshold
            continue
        
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue
        
        # Circularity: 4*pi*area / perimeter^2 (1.0 = perfect circle)
        circularity = 4 * np.pi * area / (perimeter * perimeter)
        
        # Score based on circularity and size
        # Prefer larger, more circular objects
        score = circularity * np.sqrt(area)
        
        if score > best_score and circularity > 0.4:  # Must be reasonably circular
            best_score = score
            best_contour = contour
    
    if best_contour is None:
        return None
    
    (rel_cx, rel_cy), radius = cv2.minEnclosingCircle(best_contour)
    
    cx = int(search_x1 + rel_cx)
    cy = int(search_y1 + rel_cy)
    
    # Basketball size constraints relative to image
    min_radius = int(h * 0.035)
    max_radius = int(h * 0.08)
    radius = max(min_radius, min(int(radius * 1.1), max_radius))  # Slightly expand
    
    return (cx, cy, radius)


def fuse_keypoints(yolo_kp, mp_kp, ball_pos=None, image_np=None):
    """Fuse keypoints from multiple models."""
    fused = {}
    all_names = set()
    
    if yolo_kp:
        all_names.update(yolo_kp.keys())
    if mp_kp:
        all_names.update(mp_kp.keys())
    
    for name in all_names:
        yolo_pt = yolo_kp.get(name) if yolo_kp else None
        mp_pt = mp_kp.get(name) if mp_kp else None
        
        if yolo_pt and mp_pt:
            w1 = yolo_pt['confidence']
            w2 = mp_pt['confidence']
            total_w = w1 + w2
            
            if total_w > 0:
                fused[name] = {
                    'x': (yolo_pt['x'] * w1 + mp_pt['x'] * w2) / total_w,
                    'y': (yolo_pt['y'] * w1 + mp_pt['y'] * w2) / total_w,
                    'confidence': (w1 + w2) / 2,
                    'source': 'fused'
                }
            else:
                fused[name] = yolo_pt
        elif yolo_pt:
            fused[name] = yolo_pt
        elif mp_pt:
            fused[name] = mp_pt
    
    # Add foot keypoints
    if image_np is not None:
        h, w = image_np.shape[:2]
        
        for side in ['left', 'right']:
            ankle = fused.get(f'{side}_ankle')
            
            if ankle and ankle['confidence'] > 0.3:
                ankle_x = ankle['x']
                ankle_y = ankle['y']
                
                if side == 'left':
                    foot_x = ankle_x + int(w * 0.035)
                    foot_y = ankle_y + int(h * 0.073)
                else:
                    foot_x = ankle_x + int(w * 0.02)
                    foot_y = ankle_y + int(h * 0.055)
                
                foot_x = max(0, min(foot_x, w - 1))
                foot_y = max(0, min(foot_y, h - 1))
                
                fused[f'{side}_foot'] = {
                    'x': float(foot_x),
                    'y': float(foot_y),
                    'confidence': ankle['confidence'] * 0.9,
                    'source': 'estimated'
                }
    
    return fused


def calculate_shooting_angles(keypoints):
    """Calculate biomechanical angles."""
    angles = {}
    
    for side in ['left', 'right']:
        shoulder = keypoints.get(f'{side}_shoulder')
        elbow = keypoints.get(f'{side}_elbow')
        wrist = keypoints.get(f'{side}_wrist')
        
        if shoulder and elbow and wrist:
            angle = calculate_angle(shoulder, elbow, wrist)
            angles[f'{side}_elbow_angle'] = angle
    
    for side in ['left', 'right']:
        hip = keypoints.get(f'{side}_hip')
        knee = keypoints.get(f'{side}_knee')
        ankle = keypoints.get(f'{side}_ankle')
        
        if hip and knee and ankle:
            angle = calculate_angle(hip, knee, ankle)
            angles[f'{side}_knee_angle'] = angle
    
    left_shoulder = keypoints.get('left_shoulder')
    right_shoulder = keypoints.get('right_shoulder')
    if left_shoulder and right_shoulder:
        dx = right_shoulder['x'] - left_shoulder['x']
        dy = right_shoulder['y'] - left_shoulder['y']
        angles['shoulder_tilt'] = math.degrees(math.atan2(dy, dx))
    
    left_hip = keypoints.get('left_hip')
    right_hip = keypoints.get('right_hip')
    if left_hip and right_hip:
        dx = right_hip['x'] - left_hip['x']
        dy = right_hip['y'] - left_hip['y']
        angles['hip_tilt'] = math.degrees(math.atan2(dy, dx))
    
    return angles


def calculate_angle(p1, p2, p3):
    """Calculate angle at p2 given three points."""
    v1 = (p1['x'] - p2['x'], p1['y'] - p2['y'])
    v2 = (p3['x'] - p2['x'], p3['y'] - p2['y'])
    
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
    mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
    
    if mag1 * mag2 == 0:
        return 0
    
    cos_angle = max(-1, min(1, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


def calculate_iou(box1, box2):
    """Calculate Intersection over Union."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    
    return inter / union if union > 0 else 0


def analyze_shooting_form(keypoints, angles):
    """Analyze shooting form and provide feedback."""
    feedback = []
    score = 70
    
    elbow_angle = angles.get('left_elbow_angle') or angles.get('right_elbow_angle')
    if elbow_angle:
        if 80 <= elbow_angle <= 100:
            feedback.append({
                'type': 'success',
                'area': 'elbow',
                'message': f'Excellent elbow angle ({elbow_angle:.0f}°). Perfect L-shape!'
            })
            score += 15
        elif 70 <= elbow_angle <= 110:
            feedback.append({
                'type': 'success',
                'area': 'elbow',
                'message': f'Good elbow angle ({elbow_angle:.0f}°).'
            })
            score += 10
        elif elbow_angle < 70:
            feedback.append({
                'type': 'warning',
                'area': 'elbow',
                'message': f'Elbow too tight ({elbow_angle:.0f}°). Open up to ~90°.'
            })
        else:
            feedback.append({
                'type': 'warning',
                'area': 'elbow',
                'message': f'Elbow flared out ({elbow_angle:.0f}°). Tuck in to ~90°.'
            })
    
    knee_angle = angles.get('left_knee_angle') or angles.get('right_knee_angle')
    if knee_angle:
        if knee_angle < 150:
            feedback.append({
                'type': 'success',
                'area': 'knees',
                'message': f'Good knee bend ({knee_angle:.0f}°) for power.'
            })
            score += 10
        elif knee_angle > 170:
            feedback.append({
                'type': 'warning',
                'area': 'knees',
                'message': 'Knees too straight. Bend more for power!'
            })
    
    shoulder_tilt = angles.get('shoulder_tilt', 0)
    if abs(shoulder_tilt) < 10:
        feedback.append({
            'type': 'success',
            'area': 'alignment',
            'message': 'Shoulders level. Good balance!'
        })
        score += 5
    
    return feedback, min(100, score)


# =============================================================================
# VIDEO ANALYSIS FUNCTIONS
# =============================================================================

# Skeleton connections for drawing
SKELETON_CONNECTIONS = [
    ('left_shoulder', 'right_shoulder'),
    ('left_shoulder', 'left_elbow'),
    ('left_elbow', 'left_wrist'),
    ('right_shoulder', 'right_elbow'),
    ('right_elbow', 'right_wrist'),
    ('left_shoulder', 'left_hip'),
    ('right_shoulder', 'right_hip'),
    ('left_hip', 'right_hip'),
    ('left_hip', 'left_knee'),
    ('left_knee', 'left_ankle'),
    ('right_hip', 'right_knee'),
    ('right_knee', 'right_ankle'),
    ('nose', 'left_shoulder'),
    ('nose', 'right_shoulder'),
]


def extract_video_frames(video_path, target_fps=10):
    """Extract frames from video at target FPS."""
    cap = cv2.VideoCapture(video_path)
    
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / original_fps if original_fps > 0 else 0
    
    frame_interval = max(1, int(original_fps / target_fps))
    
    frames = []
    frame_indices = []
    frame_idx = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_idx % frame_interval == 0:
            frames.append(frame)
            frame_indices.append(frame_idx)
        
        frame_idx += 1
    
    cap.release()
    
    return frames, {
        'original_fps': original_fps,
        'target_fps': target_fps,
        'total_frames': total_frames,
        'extracted_frames': len(frames),
        'duration': duration,
        'width': width,
        'height': height,
        'frame_indices': frame_indices
    }


def detect_pose_in_frame(frame):
    """Detect pose in a single video frame using YOLOv8."""
    model = get_yolo_pose()
    results = model(frame, verbose=False)
    
    keypoints = {}
    
    if len(results) > 0 and results[0].keypoints is not None:
        kpts = results[0].keypoints
        if len(kpts.data) > 0:
            person_kpts = kpts.data[0].cpu().numpy()
            
            for idx, name in enumerate(YOLO_KEYPOINTS):
                if idx < len(person_kpts):
                    x, y, conf = person_kpts[idx]
                    if conf > 0.3:
                        keypoints[name] = {
                            'x': float(x),
                            'y': float(y),
                            'confidence': float(conf)
                        }
    
    return keypoints


def analyze_frame_biomechanics(keypoints):
    """Analyze biomechanics for a single frame."""
    metrics = {}
    
    # Elbow angle (shooting arm - check both, use higher confidence)
    for side in ['right', 'left']:
        if all(k in keypoints for k in [f'{side}_shoulder', f'{side}_elbow', f'{side}_wrist']):
            metrics[f'{side}_elbow_angle'] = calculate_angle(
                keypoints[f'{side}_shoulder'],
                keypoints[f'{side}_elbow'],
                keypoints[f'{side}_wrist']
            )
    
    # Use right arm as primary (most shooters are right-handed)
    if 'right_elbow_angle' in metrics:
        metrics['elbow_angle'] = metrics['right_elbow_angle']
    elif 'left_elbow_angle' in metrics:
        metrics['elbow_angle'] = metrics['left_elbow_angle']
    
    # Knee angle
    for side in ['right', 'left']:
        if all(k in keypoints for k in [f'{side}_hip', f'{side}_knee', f'{side}_ankle']):
            metrics[f'{side}_knee_angle'] = calculate_angle(
                keypoints[f'{side}_hip'],
                keypoints[f'{side}_knee'],
                keypoints[f'{side}_ankle']
            )
    
    if 'right_knee_angle' in metrics:
        metrics['knee_angle'] = metrics['right_knee_angle']
    elif 'left_knee_angle' in metrics:
        metrics['knee_angle'] = metrics['left_knee_angle']
    
    # Wrist height relative to shoulder
    for side in ['right', 'left']:
        if f'{side}_wrist' in keypoints and f'{side}_shoulder' in keypoints:
            metrics['wrist_height'] = keypoints[f'{side}_shoulder']['y'] - keypoints[f'{side}_wrist']['y']
            break
    
    # Hip height (for jump detection)
    if 'right_hip' in keypoints:
        metrics['hip_y'] = keypoints['right_hip']['y']
    elif 'left_hip' in keypoints:
        metrics['hip_y'] = keypoints['left_hip']['y']
    
    return metrics


def detect_shot_phase(frame_metrics, prev_phase=None):
    """
    Detect which phase of the shot the player is in.
    
    Phases:
    1. SETUP - Ball at chest/waist, knees bent
    2. RISE - Legs extending, ball rising
    3. RELEASE - Ball at/above head, elbow extending
    4. FOLLOW_THROUGH - Ball released, arm extended
    """
    if not frame_metrics:
        return prev_phase or 'SETUP'
    
    elbow = frame_metrics.get('elbow_angle', 90)
    knee = frame_metrics.get('knee_angle', 160)
    wrist_height = frame_metrics.get('wrist_height', 0)
    
    # Phase detection logic
    if elbow < 70 and knee < 150:
        return 'SETUP'
    elif elbow < 100 and wrist_height > 0:
        return 'RISE'
    elif elbow > 140 and wrist_height > 50:
        return 'RELEASE'
    elif elbow > 160:
        return 'FOLLOW_THROUGH'
    
    return prev_phase or 'RISE'


def draw_skeleton_on_frame(frame, keypoints, phase=None, ball_pos=None):
    """Draw skeleton overlay on frame."""
    frame_copy = frame.copy()
    h, w = frame_copy.shape[:2]
    
    # Draw connections
    for start, end in SKELETON_CONNECTIONS:
        if start in keypoints and end in keypoints:
            pt1 = (int(keypoints[start]['x']), int(keypoints[start]['y']))
            pt2 = (int(keypoints[end]['x']), int(keypoints[end]['y']))
            cv2.line(frame_copy, pt1, pt2, (0, 200, 255), 3)  # Orange lines
    
    # Draw keypoints
    for name, kp in keypoints.items():
        x, y = int(kp['x']), int(kp['y'])
        # Color based on body part
        if 'wrist' in name or 'elbow' in name:
            color = (0, 255, 0)  # Green for arms
        elif 'knee' in name or 'ankle' in name or 'hip' in name:
            color = (255, 0, 0)  # Blue for legs
        else:
            color = (0, 200, 255)  # Orange for others
        
        cv2.circle(frame_copy, (x, y), 8, color, -1)
        cv2.circle(frame_copy, (x, y), 10, (255, 255, 255), 2)
    
    # Draw basketball if detected
    if ball_pos:
        cx, cy, radius = ball_pos
        cv2.circle(frame_copy, (cx, cy), radius, (0, 165, 255), 3)
    
    # Draw phase label
    if phase:
        phase_colors = {
            'SETUP': (100, 100, 255),
            'RISE': (100, 255, 255),
            'RELEASE': (100, 255, 100),
            'FOLLOW_THROUGH': (255, 100, 100)
        }
        color = phase_colors.get(phase, (255, 255, 255))
        cv2.putText(frame_copy, f"Phase: {phase}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
    
    return frame_copy


def detect_shooting_motion(all_phases, all_metrics, all_keypoints):
    """
    Detect when the actual shooting motion occurs in the video.
    Returns the frame range of the shot (start, end) and key frames.
    
    A shooting motion is characterized by:
    1. Wrist rising above shoulder
    2. Elbow angle transitioning from bent to extended
    3. Phase sequence: SETUP -> RISE -> RELEASE -> FOLLOW_THROUGH
    """
    if not all_phases or len(all_phases) < 5:
        return None
    
    # Find the shooting sequence by looking for phase transitions
    shot_sequences = []
    current_sequence = {'start': None, 'phases': []}
    
    for i, phase in enumerate(all_phases):
        if phase == 'SETUP' and current_sequence['start'] is None:
            current_sequence['start'] = i
            current_sequence['phases'] = ['SETUP']
        elif current_sequence['start'] is not None:
            if phase not in current_sequence['phases']:
                current_sequence['phases'].append(phase)
            
            # Complete sequence found
            if phase == 'FOLLOW_THROUGH' and len(current_sequence['phases']) >= 3:
                current_sequence['end'] = i
                shot_sequences.append(current_sequence.copy())
                current_sequence = {'start': None, 'phases': []}
    
    # If no complete sequence found, look for partial (RISE -> RELEASE)
    if not shot_sequences:
        for i in range(len(all_phases) - 2):
            if all_phases[i] == 'RISE' and all_phases[i+1] == 'RELEASE':
                # Found a shot - look for boundaries
                start = max(0, i - 3)
                end = min(len(all_phases) - 1, i + 5)
                shot_sequences.append({'start': start, 'end': end, 'phases': all_phases[start:end+1]})
                break
    
    # If still nothing, use the frames with highest wrist position
    if not shot_sequences:
        wrist_heights = []
        for i, metrics in enumerate(all_metrics):
            wh = metrics.get('wrist_height', 0)
            wrist_heights.append((i, wh))
        
        if wrist_heights:
            # Find peak wrist height
            peak_frame = max(wrist_heights, key=lambda x: x[1])[0]
            start = max(0, peak_frame - 5)
            end = min(len(all_phases) - 1, peak_frame + 5)
            shot_sequences.append({'start': start, 'end': end, 'phases': []})
    
    if not shot_sequences:
        return None
    
    # Use the first detected shot sequence
    shot = shot_sequences[0]
    return shot


def extract_3_key_frames(frames, all_keypoints, all_metrics, all_phases, shot_range):
    """
    Extract exactly 3 key frames from the shooting motion:
    1. SETUP/LOAD - Ball at chest, knees bent
    2. RELEASE - Ball at highest point, arm extended  
    3. FOLLOW_THROUGH - After release
    
    Returns list of 3 frames with their indices and analysis.
    """
    start = shot_range['start']
    end = shot_range['end']
    shot_frames = list(range(start, end + 1))
    
    if len(shot_frames) < 3:
        # Not enough frames, use what we have
        indices = shot_frames
        while len(indices) < 3:
            indices.append(indices[-1])
    else:
        # Find the 3 key moments
        setup_frame = start
        release_frame = start
        followthrough_frame = end
        
        # Find SETUP - lowest elbow angle (most bent)
        min_elbow = float('inf')
        for i in shot_frames[:len(shot_frames)//2]:  # First half
            elbow = all_metrics[i].get('elbow_angle', 180)
            if elbow < min_elbow:
                min_elbow = elbow
                setup_frame = i
        
        # Find RELEASE - highest elbow angle (most extended) with high wrist
        max_elbow = 0
        for i in shot_frames:
            elbow = all_metrics[i].get('elbow_angle', 0)
            wrist_h = all_metrics[i].get('wrist_height', 0)
            if elbow > max_elbow and wrist_h > 0:
                max_elbow = elbow
                release_frame = i
        
        # FOLLOW_THROUGH - a few frames after release
        followthrough_frame = min(release_frame + 3, end)
        
        indices = [setup_frame, release_frame, followthrough_frame]
    
    # Build the 3 key frames
    key_frames = []
    labels = ['SETUP', 'RELEASE', 'FOLLOW_THROUGH']
    
    for idx, frame_idx in enumerate(indices):
        if frame_idx < len(frames):
            key_frames.append({
                'frame_index': frame_idx,
                'label': labels[idx],
                'frame': frames[frame_idx],
                'keypoints': all_keypoints[frame_idx],
                'metrics': all_metrics[frame_idx],
                'phase': all_phases[frame_idx] if frame_idx < len(all_phases) else labels[idx]
            })
    
    return key_frames


def analyze_video_frames(video_path, target_fps=10):
    """
    Main video analysis function.
    Returns frame-by-frame analysis and generates annotated frames.
    Also extracts 3 key screenshots from the shooting motion.
    """
    # Extract frames
    frames, video_info = extract_video_frames(video_path, target_fps)
    
    if not frames:
        return None, "Could not extract frames from video"
    
    # Enforce 10 second limit
    if video_info['duration'] > 10.5:  # Small buffer for encoding
        return None, "Video must be 10 seconds or less"
    
    # Analyze each frame
    all_keypoints = []
    all_metrics = []
    all_phases = []
    all_balls = []
    annotated_frames = []
    prev_phase = None
    
    all_angles = []
    
    for frame in frames:
        # Detect pose
        keypoints = detect_pose_in_frame(frame)
        all_keypoints.append(keypoints)
        
        # Find basketball
        wrist_positions = []
        if 'left_wrist' in keypoints:
            wrist_positions.append((keypoints['left_wrist']['x'], keypoints['left_wrist']['y']))
        if 'right_wrist' in keypoints:
            wrist_positions.append((keypoints['right_wrist']['x'], keypoints['right_wrist']['y']))
        
        ball = find_basketball(frame, wrist_positions if wrist_positions else None)
        all_balls.append(ball)
        
        # Analyze biomechanics
        metrics = analyze_frame_biomechanics(keypoints)
        all_metrics.append(metrics)
        
        # Detect phase
        phase = detect_shot_phase(metrics, prev_phase)
        all_phases.append(phase)
        prev_phase = phase
        
        # Calculate angles for this frame
        angles = calculate_shooting_angles(keypoints)
        all_angles.append(angles)
    
    # Generate premium annotated frames with pauses at key moments
    annotated_frames = generate_video_with_pauses(
        frames, all_keypoints, all_angles, all_phases, target_fps
    )
    
    # Detect the shooting motion in the video
    shot_range = detect_shooting_motion(all_phases, all_metrics, all_keypoints)
    
    # Extract 3 key frames from the shot
    key_frames = []
    if shot_range:
        key_frames = extract_3_key_frames(
            frames, all_keypoints, all_metrics, all_phases, shot_range
        )
    else:
        # Fallback: use evenly spaced frames
        n = len(frames)
        indices = [0, n//2, n-1] if n >= 3 else list(range(n))
        labels = ['SETUP', 'RELEASE', 'FOLLOW_THROUGH']
        for idx, frame_idx in enumerate(indices):
            if frame_idx < len(frames):
                key_frames.append({
                    'frame_index': frame_idx,
                    'label': labels[idx] if idx < len(labels) else 'FRAME',
                    'frame': frames[frame_idx],
                    'keypoints': all_keypoints[frame_idx],
                    'metrics': all_metrics[frame_idx],
                    'phase': all_phases[frame_idx] if frame_idx < len(all_phases) else 'UNKNOWN'
                })
    
    # Find phase transitions
    phase_timestamps = []
    current_phase = None
    for i, phase in enumerate(all_phases):
        if phase != current_phase:
            timestamp = i / target_fps
            phase_timestamps.append({
                'phase': phase,
                'frame': i,
                'timestamp': round(timestamp, 2)
            })
            current_phase = phase
    
    # Calculate summary metrics
    elbow_angles = [m.get('elbow_angle') for m in all_metrics if m.get('elbow_angle')]
    knee_angles = [m.get('knee_angle') for m in all_metrics if m.get('knee_angle')]
    
    # Find release frame (max elbow extension)
    release_frame = 0
    max_elbow = 0
    for i, m in enumerate(all_metrics):
        if m.get('elbow_angle', 0) > max_elbow:
            max_elbow = m.get('elbow_angle', 0)
            release_frame = i
    
    # Encode raw frames (without overlays) for frontend toggle control
    raw_frames_base64 = []
    for frame in frames:
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        raw_frames_base64.append(base64.b64encode(buffer).decode('utf-8'))
    
    return {
        'video_info': video_info,
        'frame_count': len(frames),
        'phases': phase_timestamps,
        'metrics': {
            'elbow_angle_range': {
                'min': round(min(elbow_angles), 1) if elbow_angles else None,
                'max': round(max(elbow_angles), 1) if elbow_angles else None,
                'at_release': round(all_metrics[release_frame].get('elbow_angle', 0), 1) if release_frame < len(all_metrics) else None
            },
            'knee_angle_range': {
                'min': round(min(knee_angles), 1) if knee_angles else None,
                'max': round(max(knee_angles), 1) if knee_angles else None
            },
            'release_frame': release_frame,
            'release_timestamp': round(release_frame / target_fps, 2)
        },
        'frame_data': [
            {
                'frame': i,
                'timestamp': round(i / target_fps, 2),
                'phase': all_phases[i],
                'metrics': {k: round(v, 1) if isinstance(v, float) else v for k, v in all_metrics[i].items()},
                'angles': all_angles[i],  # Include angles for each frame
                'keypoint_count': len(all_keypoints[i]),
                'ball_detected': all_balls[i] is not None,
                'ball': {'x': all_balls[i][0], 'y': all_balls[i][1], 'radius': all_balls[i][2]} if all_balls[i] else None
            }
            for i in range(len(frames))
        ],
        'annotated_frames': annotated_frames,  # Pre-rendered with zoom sequence
        'raw_frames': raw_frames_base64,  # Raw frames for toggle control
        'all_keypoints': all_keypoints,  # Keypoints for each frame (for frontend drawing)
        'all_angles': all_angles,  # Angles for each frame
        'key_frames': key_frames,  # The 3 key screenshots
        'shot_range': shot_range
    }, None


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model': 'hybrid',
        'components': ['yolov8x-pose', 'mediapipe', 'opencv-ball-detection', 'video-analysis'],
        'version': '1.1.0'
    })


@app.route('/api/detect-pose', methods=['POST'])
def detect_pose():
    """Hybrid pose detection endpoint."""
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode image
        image_data = base64.b64decode(data['image'])
        pil_image = Image.open(io.BytesIO(image_data))
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        image_np = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        h, w = image_np.shape[:2]
        
        # Step 1: Find the shooter
        bbox = find_shooter_bbox(image_np)
        
        # Step 2: Run YOLOv8-pose
        yolo_keypoints = detect_pose_yolo(image_np, bbox)
        
        # Step 3: Run MediaPipe
        mp_keypoints = detect_pose_mediapipe(image_np, bbox)
        
        # Step 4: Find basketball
        wrist_positions = []
        if yolo_keypoints:
            if 'left_wrist' in yolo_keypoints:
                wrist_positions.append((yolo_keypoints['left_wrist']['x'], yolo_keypoints['left_wrist']['y']))
            if 'right_wrist' in yolo_keypoints:
                wrist_positions.append((yolo_keypoints['right_wrist']['x'], yolo_keypoints['right_wrist']['y']))
        
        ball = find_basketball(image_np, wrist_positions if wrist_positions else None)
        
        # Step 5: Fuse results
        keypoints = fuse_keypoints(yolo_keypoints, mp_keypoints, ball, image_np)
        
        if not keypoints:
            return jsonify({'error': 'Could not detect pose'}), 404
        
        # Step 6: Calculate angles
        angles = calculate_shooting_angles(keypoints)
        
        # Calculate confidence
        confidences = [kp['confidence'] for kp in keypoints.values()]
        avg_confidence = np.mean(confidences)
        
        return jsonify({
            'success': True,
            'keypoints': keypoints,
            'confidence': float(avg_confidence),
            'angles': angles,
            'bounding_box': {'x1': bbox[0], 'y1': bbox[1], 'x2': bbox[2], 'y2': bbox[3]} if bbox else None,
            'basketball': {'x': ball[0], 'y': ball[1], 'radius': ball[2]} if ball else None,
            'image_size': {'width': w, 'height': h},
            'method': 'hybrid'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-form', methods=['POST'])
def analyze_form():
    """Analyze shooting form and provide feedback."""
    try:
        data = request.json
        keypoints = data.get('keypoints', {})
        angles = data.get('angles', {})
        
        if not angles and keypoints:
            angles = calculate_shooting_angles(keypoints)
        
        feedback, score = analyze_shooting_form(keypoints, angles)
        
        return jsonify({
            'success': True,
            'feedback': feedback,
            'overall_score': score,
            'angles': angles
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/annotate-image', methods=['POST'])
def annotate_image():
    """
    Generate an animated annotation video from a single image.
    
    Expects JSON with:
    - image: base64 encoded image
    - keypoints: detected keypoints
    - angles: calculated angles
    - ball: basketball position (optional)
    
    Returns:
    - Animated frames showing progressive annotation reveal
    - Single fully annotated image
    - Angle feedback with elite comparisons
    """
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode image
        image_data = base64.b64decode(data['image'])
        pil_image = Image.open(io.BytesIO(image_data))
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        image_np = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        keypoints = data.get('keypoints', {})
        angles = data.get('angles', {})
        ball = data.get('ball')
        ball_pos = (ball['x'], ball['y'], ball.get('radius', 30)) if ball else None
        
        # If no angles provided, calculate them
        if not angles and keypoints:
            angles = calculate_shooting_angles(keypoints)
        
        # Generate animated annotation sequence
        animated_frames = generate_annotation_sequence(image_np, keypoints, angles, ball_pos)
        
        # Encode frames to base64
        animated_frames_b64 = []
        for frame in animated_frames:
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            animated_frames_b64.append(base64.b64encode(buffer).decode('utf-8'))
        
        # Generate single fully annotated image
        full_annotated = draw_annotated_frame(image_np, keypoints, angles, 
                                               ball_pos=ball_pos, show_annotations=True)
        _, buffer = cv2.imencode('.jpg', full_annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
        full_annotated_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Get feedback for all angles
        angle_feedback = {}
        for angle_name, angle_value in angles.items():
            feedback = get_angle_feedback(angle_name, angle_value)
            if feedback:
                angle_feedback[angle_name] = feedback
        
        return jsonify({
            'success': True,
            'animated_frames_base64': animated_frames_b64,
            'annotated_image_base64': full_annotated_b64,
            'frame_count': len(animated_frames),
            'fps': 10,  # Playback at 10fps
            'duration': len(animated_frames) / 10,  # Duration in seconds
            'angles': {k: round(v, 1) for k, v in angles.items()},
            'angle_feedback': angle_feedback,
            'elite_reference': ELITE_SHOOTER_REFERENCE
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-video', methods=['POST'])
def analyze_video():
    """
    Analyze a video of a basketball shot.
    
    Expects JSON with:
    - video: base64 encoded video file
    - fps: target FPS for analysis (default: 10)
    
    Returns:
    - Frame-by-frame analysis
    - Phase detection
    - Annotated frames as base64 images with pause at key moments
    - 3 key screenshots from the shooting motion (SETUP, RELEASE, FOLLOW_THROUGH)
    """
    try:
        data = request.json
        
        if not data or 'video' not in data:
            return jsonify({'error': 'No video provided'}), 400
        
        # Decode video
        video_data = data['video']
        if ',' in video_data:
            video_data = video_data.split(',')[1]
        
        video_bytes = base64.b64decode(video_data)
        
        # Save to temp file (OpenCV needs file path)
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
            tmp.write(video_bytes)
            video_path = tmp.name
        
        # Get target FPS
        target_fps = data.get('fps', 10)
        
        # Analyze video
        result, error = analyze_video_frames(video_path, target_fps)
        
        # Clean up temp file
        try:
            os.unlink(video_path)
        except:
            pass
        
        if error:
            return jsonify({'error': error}), 400
        
        # Get phase timestamps for pause insertion
        phase_frames = {}
        for phase_info in result.get('phases', []):
            phase_frames[phase_info['phase']] = phase_info['frame']
        
        # Convert annotated frames to base64 with pause frames at key moments
        annotated_frames_b64 = []
        pause_duration = 20  # Number of duplicate frames for pause (2 seconds at 10fps)
        
        for i, frame in enumerate(result['annotated_frames']):
            # Encode the frame
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            annotated_frames_b64.append(frame_b64)
            
            # Check if this is a key phase frame - add pause
            for phase_name, phase_frame in phase_frames.items():
                if i == phase_frame and phase_name in ['SETUP', 'RELEASE', 'FOLLOW_THROUGH']:
                    # Add pause frames (duplicate this frame)
                    for _ in range(pause_duration):
                        annotated_frames_b64.append(frame_b64)
        
        # Convert the 3 key frames to base64 with full annotations
        key_screenshots = []
        for kf in result.get('key_frames', []):
            # Calculate angles for this frame
            angles = calculate_shooting_angles(kf['keypoints'])
            
            # Draw fully annotated frame with Hudl-style labels
            frame_with_annotations = draw_annotated_frame(
                kf['frame'], 
                kf['keypoints'],
                angles,
                phase=kf['label'],
                ball_pos=None,
                show_annotations=True
            )
            _, buffer = cv2.imencode('.jpg', frame_with_annotations, [cv2.IMWRITE_JPEG_QUALITY, 90])
            
            # Get feedback for each angle
            angle_feedback = {}
            for angle_name, angle_value in angles.items():
                feedback = get_angle_feedback(angle_name, angle_value)
                if feedback:
                    angle_feedback[angle_name] = feedback
            
            key_screenshots.append({
                'label': kf['label'],
                'frame_index': kf['frame_index'],
                'phase': kf['phase'],
                'metrics': {k: round(v, 1) if isinstance(v, (int, float)) else v 
                           for k, v in kf['metrics'].items()},
                'angles': {k: round(v, 1) for k, v in angles.items()},
                'angle_feedback': angle_feedback,
                'keypoints': kf['keypoints'],
                'image_base64': base64.b64encode(buffer).decode('utf-8')
            })
        
        # Remove raw frames from response (too large)
        del result['annotated_frames']
        del result['all_keypoints']
        if 'key_frames' in result:
            del result['key_frames']
        
        # Add base64 frames
        result['annotated_frames_base64'] = annotated_frames_b64
        result['key_screenshots'] = key_screenshots  # The 3 key frames for session
        result['success'] = True
        
        return jsonify(result)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    print(f"🏀 Starting Basketball Analysis API on port {port}")
    print(f"   Components: YOLOv8x-pose + MediaPipe + OpenCV")
    app.run(host='0.0.0.0', port=port, debug=False)

