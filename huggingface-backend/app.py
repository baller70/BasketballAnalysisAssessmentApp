"""
BASKETBALL SHOOTING FORM ANALYSIS API
Hugging Face Spaces Deployment

Hybrid pose detection combining:
- YOLOv8x-pose for primary pose estimation
- MediaPipe for secondary verification
- OpenCV for basketball detection
- Biomechanical angle analysis
"""

from flask import Flask, request, jsonify
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
# API ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model': 'hybrid',
        'components': ['yolov8x-pose', 'mediapipe', 'opencv-ball-detection'],
        'version': '1.0.0'
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


# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    print(f"🏀 Starting Basketball Analysis API on port {port}")
    print(f"   Components: YOLOv8x-pose + MediaPipe + OpenCV")
    app.run(host='0.0.0.0', port=port, debug=False)

