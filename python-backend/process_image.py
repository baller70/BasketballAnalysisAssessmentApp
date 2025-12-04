#!/usr/bin/env python3
"""
Standalone script to process a basketball image with pose detection and skeleton overlay
"""
import cv2
import numpy as np
import mediapipe as mp
import sys
import os
import base64

# MediaPipe keypoint names
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

SKELETON_CONNECTIONS = [
    ('left_shoulder', 'right_shoulder'),
    ('left_shoulder', 'left_hip'),
    ('right_shoulder', 'right_hip'),
    ('left_hip', 'right_hip'),
    ('left_shoulder', 'left_elbow'),
    ('left_elbow', 'left_wrist'),
    ('right_shoulder', 'right_elbow'),
    ('right_elbow', 'right_wrist'),
    ('left_hip', 'left_knee'),
    ('left_knee', 'left_ankle'),
    ('right_hip', 'right_knee'),
    ('right_knee', 'right_ankle'),
]

VISIBLE_KEYPOINTS = [
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
]

CALLOUT_CONFIG = [
    {'label': 'WRISTS', 'keypoint': 'right_wrist', 'offset': (80, -10)},
    {'label': 'ELBOWS', 'keypoint': 'right_elbow', 'offset': (90, 0)},
    {'label': 'SHOULDERS', 'keypoint': 'right_shoulder', 'offset': (100, 10)},
    {'label': 'CORE/ABS', 'keypoint': 'core', 'offset': (110, 0)},
    {'label': 'HIPS', 'keypoint': 'right_hip', 'offset': (90, 10)},
    {'label': 'KNEES', 'keypoint': 'right_knee', 'offset': (80, 0)},
    {'label': 'ANKLES', 'keypoint': 'right_ankle', 'offset': (70, 10)},
]


def detect_pose(image_path):
    """Detect pose in image using MediaPipe"""
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True, model_complexity=2, min_detection_confidence=0.5)
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    pose.close()
    
    if not results.pose_landmarks:
        return image, []
    
    keypoints = []
    for idx, landmark in enumerate(results.pose_landmarks.landmark):
        keypoints.append({
            'name': MEDIAPIPE_KEYPOINT_NAMES[idx] if idx < len(MEDIAPIPE_KEYPOINT_NAMES) else f"kp_{idx}",
            'x': landmark.x, 'y': landmark.y, 'z': landmark.z or 0,
            'visibility': landmark.visibility or 0
        })
    
    return image, keypoints


def get_pos(keypoints, name, w, h, min_conf=0.3):
    """Get pixel position of keypoint"""
    for kp in keypoints:
        if kp['name'] == name and kp['visibility'] >= min_conf:
            return (int(kp['x'] * w), int(kp['y'] * h))
    return None


def midpoint(p1, p2):
    if p1 is None or p2 is None:
        return None
    return ((p1[0] + p2[0]) // 2, (p1[1] + p2[1]) // 2)


def draw_skeleton_with_callouts(image, keypoints):
    """Draw skeleton and callouts"""
    result = image.copy()
    h, w = result.shape[:2]
    
    skeleton_color = (0, 255, 255)  # Yellow/cyan
    joint_color = (0, 200, 255)     # Orange
    label_color = (255, 255, 255)   # White
    
    # Draw skeleton lines
    for from_name, to_name in SKELETON_CONNECTIONS:
        from_pos, to_pos = get_pos(keypoints, from_name, w, h), get_pos(keypoints, to_name, w, h)
        if from_pos and to_pos:
            cv2.line(result, from_pos, to_pos, skeleton_color, 3, cv2.LINE_AA)
    
    # Draw joints
    for name in VISIBLE_KEYPOINTS:
        pos = get_pos(keypoints, name, w, h)
        if pos:
            cv2.circle(result, pos, 8, joint_color, -1, cv2.LINE_AA)
            cv2.circle(result, pos, 8, skeleton_color, 2, cv2.LINE_AA)
    
    # Draw callouts
    for callout in CALLOUT_CONFIG:
        if callout['keypoint'] == 'core':
            lh, rh = get_pos(keypoints, 'left_hip', w, h), get_pos(keypoints, 'right_hip', w, h)
            ls, rs = get_pos(keypoints, 'left_shoulder', w, h), get_pos(keypoints, 'right_shoulder', w, h)
            anchor = midpoint(midpoint(lh, rh), midpoint(ls, rs))
        else:
            anchor = get_pos(keypoints, callout['keypoint'], w, h)
        
        if anchor is None:
            continue
        
        ox, oy = callout['offset']
        lx, ly = anchor[0] + ox, anchor[1] + oy
        
        cv2.line(result, anchor, (lx, ly), label_color, 2, cv2.LINE_AA)
        
        label = callout['label']
        font, scale, thick = cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
        (tw, th), _ = cv2.getTextSize(label, font, scale, thick)
        pad = 6
        cv2.rectangle(result, (lx-pad, ly-th-pad), (lx+tw+pad, ly+pad), (0, 0, 0), -1)
        cv2.rectangle(result, (lx-pad, ly-th-pad), (lx+tw+pad, ly+pad), label_color, 2)
        cv2.putText(result, label, (lx, ly), font, scale, label_color, thick, cv2.LINE_AA)
    
    return result


if __name__ == '__main__':
    input_path = sys.argv[1] if len(sys.argv) > 1 else 'test_input.jpg'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'output_annotated.png'
    
    print(f"Processing: {input_path}")
    image, keypoints = detect_pose(input_path)
    print(f"Detected {len(keypoints)} keypoints")
    
    annotated = draw_skeleton_with_callouts(image, keypoints)
    cv2.imwrite(output_path, annotated)
    print(f"Saved annotated image to: {output_path}")

