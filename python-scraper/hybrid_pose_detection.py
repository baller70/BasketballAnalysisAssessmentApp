"""
HYBRID BASKETBALL SHOOTING POSE DETECTION

Combines multiple state-of-the-art models for best accuracy:

1. YOLOv8x - Person detection (find the shooter in crowded scenes)
2. YOLOv8x-pose - Initial pose estimation with 17 keypoints
3. MediaPipe Pose - Secondary estimation for verification
4. OpenCV - Basketball detection + hand refinement
5. Custom basketball shooting angle analysis

The hybrid approach:
- Run multiple models
- Fuse results with confidence weighting
- Use basketball position to anchor the shooting hand
- Calculate biomechanical angles for form analysis
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
ssl._create_default_https_context = ssl._create_unverified_context

app = Flask(__name__)
CORS(app)

# Lazy load models
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
        _yolo_pose = YOLO('yolov8x-pose.pt')  # Using largest for best accuracy
    return _yolo_pose


def get_mediapipe_pose():
    """MediaPipe for secondary pose estimation."""
    global _mediapipe_pose
    if _mediapipe_pose is None:
        import mediapipe as mp
        _mediapipe_pose = mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=2,  # Highest accuracy
            enable_segmentation=False,
            min_detection_confidence=0.3
        )
    return _mediapipe_pose


# Keypoint names for each model
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
    """
    Find the main shooter in the image.
    Returns bounding box of the largest person on the left side.
    """
    h, w = image_np.shape[:2]
    model = get_yolo_detector()
    results = model(image_np, classes=[0], verbose=False)  # class 0 = person
    
    if not results or len(results[0].boxes) == 0:
        return None
    
    best_box = None
    best_score = -1
    
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        box_w, box_h = x2 - x1, y2 - y1
        area = box_w * box_h
        
        # Score: size + left position + full body
        area_score = (area / (w * h)) * 100
        left_score = 30 if x1 < w * 0.4 else 0
        height_score = 30 if box_h > h * 0.5 else 0
        
        score = area_score + left_score + height_score
        
        if score > best_score:
            best_score = score
            best_box = (int(x1), int(y1), int(x2), int(y2))
    
    return best_box


def detect_pose_yolo(image_np, bbox=None):
    """
    Detect pose using YOLOv8x-pose.
    Returns keypoints dict with x, y, confidence.
    """
    h, w = image_np.shape[:2]
    model = get_yolo_pose()
    results = model(image_np, verbose=False)
    
    if not results or results[0].keypoints is None:
        return None
    
    # Find best person (largest or closest to bbox)
    best_idx = 0
    best_score = -1
    
    for idx in range(len(results[0].keypoints)):
        if results[0].boxes is not None and idx < len(results[0].boxes):
            box = results[0].boxes[idx]
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            area = (x2 - x1) * (y2 - y1)
            score = area / (w * h)
            
            # Bonus for left side
            if x1 < w * 0.4:
                score += 0.3
            
            # Bonus for matching our detected bbox
            if bbox:
                overlap = calculate_iou(
                    (x1, y1, x2, y2),
                    bbox
                )
                score += overlap * 0.5
            
            if score > best_score:
                best_score = score
                best_idx = idx
    
    # Extract keypoints
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
    """
    Detect pose using MediaPipe.
    Returns keypoints dict with x, y, confidence.
    """
    h, w = image_np.shape[:2]
    
    # Crop to bbox for better detection
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


def find_basketball(image_np, wrist_positions=None, player_height=None):
    """
    Find the basketball - MUST be near the wrists (hands holding it).
    Look for BROWN-ORANGE color (not yellow) with BLACK STRIPES.
    
    Returns (x, y, radius) or None.
    """
    h, w = image_np.shape[:2]
    print(f"🏀 Finding basketball in image {w}x{h}")
    print(f"🖐️ Wrist positions: {wrist_positions}")
    
    # If no wrists detected, can't find ball reliably
    if not wrist_positions or len(wrist_positions) == 0:
        print("No wrist positions - cannot locate ball")
        return None
    
    # Calculate the search area - TIGHT around the wrists
    wrist_xs = [wp[0] for wp in wrist_positions]
    wrist_ys = [wp[1] for wp in wrist_positions]
    wrist_center_x = sum(wrist_xs) / len(wrist_xs)
    wrist_center_y = sum(wrist_ys) / len(wrist_ys)
    
    print(f"🎯 Wrist center: ({wrist_center_x:.0f}, {wrist_center_y:.0f})")
    
    # TIGHT search area - just around the hands
    search_radius = int(h * 0.10)  # 10% of image height (smaller)
    search_x1 = max(0, int(wrist_center_x - search_radius))
    search_y1 = max(0, int(wrist_center_y - search_radius))
    search_x2 = min(w, int(wrist_center_x + search_radius))
    search_y2 = min(h, int(wrist_center_y + search_radius))
    
    print(f"🔍 Search area: ({search_x1},{search_y1}) to ({search_x2},{search_y2})")
    
    # Extract the search region
    search_region = image_np[search_y1:search_y2, search_x1:search_x2]
    
    if search_region.size == 0:
        print("Empty search region")
        return None
    
    # Convert to HSV
    hsv = cv2.cvtColor(search_region, cv2.COLOR_BGR2HSV)
    
    # BASKETBALL COLOR: Brown-orange leather
    # Hue: 8-18 (TRUE orange/brown, NOT yellow which is 20+)
    # Saturation: 80-200 (not too saturated like yellow jerseys)
    # Value: 100-200 (medium brightness, not super bright)
    lower_ball = np.array([8, 80, 100])
    upper_ball = np.array([18, 200, 200])
    ball_mask = cv2.inRange(hsv, lower_ball, upper_ball)
    
    ball_count = cv2.countNonZero(ball_mask)
    print(f"🟤 Basketball-brown pixels: {ball_count}")
    
    # Also look for black stripes (to distinguish from skin/other orange)
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([180, 255, 60])
    black_mask = cv2.inRange(hsv, lower_black, upper_black)
    
    # Clean up ball mask
    kernel = np.ones((3, 3), np.uint8)
    ball_mask = cv2.morphologyEx(ball_mask, cv2.MORPH_CLOSE, kernel)
    ball_mask = cv2.morphologyEx(ball_mask, cv2.MORPH_OPEN, kernel)
    
    # Find contours
    contours, _ = cv2.findContours(ball_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print("No basketball-colored contours found")
        return None
    
    print(f"📦 Found {len(contours)} potential ball contours")
    
    # Score each contour
    best_contour = None
    best_score = -1
    
    for c in contours:
        area = cv2.contourArea(c)
        if area < 300:  # Too small
            continue
        
        # Get bounding box
        x, y, bw, bh = cv2.boundingRect(c)
        
        # Check for black stripes inside this region
        roi_black = black_mask[y:y+bh, x:x+bw]
        if roi_black.size > 0:
            black_ratio = cv2.countNonZero(roi_black) / roi_black.size
            has_stripes = 0.03 < black_ratio < 0.25
        else:
            has_stripes = False
        
        # Check circularity (ball should be roundish)
        perimeter = cv2.arcLength(c, True)
        circularity = 4 * np.pi * area / (perimeter ** 2) if perimeter > 0 else 0
        
        # Score
        score = 0.0
        score += min(area / 3000, 1.0) * 0.3  # Size (capped)
        score += circularity * 0.3            # Roundness
        if has_stripes:
            score += 0.4                       # Has black stripes = strong signal
        
        print(f"  Contour: area={area}, circ={circularity:.2f}, stripes={has_stripes}, score={score:.2f}")
        
        if score > best_score:
            best_score = score
            best_contour = c
    
    if best_contour is None:
        print("No valid basketball contour found")
        return None
    
    # Get ball position from best contour
    (rel_cx, rel_cy), radius = cv2.minEnclosingCircle(best_contour)
    
    # Also calculate radius from actual contour area (more accurate)
    actual_area = cv2.contourArea(best_contour)
    radius_from_area = int(np.sqrt(actual_area / np.pi))
    
    # Use the smaller of the two (minEnclosingCircle can be too big)
    radius = min(int(radius), radius_from_area + 10)
    
    # Convert to full image coordinates
    cx = int(search_x1 + rel_cx)
    cy = int(search_y1 + rel_cy)
    
    # Basketball is roughly 9.4 inches = ~6-8% of a person's height
    # For typical image, radius should be 3-6% of image height
    min_radius = int(h * 0.03)
    max_radius = int(h * 0.07)
    radius = max(min_radius, min(radius, max_radius))
    
    print(f"✅ Basketball at ({cx}, {cy}) radius {radius} (area-based: {radius_from_area})")
    return (cx, cy, radius)


def fuse_keypoints(yolo_kp, mp_kp, ball_pos=None, image_np=None):
    """
    Fuse keypoints from multiple models using confidence weighting.
    Also adds foot keypoints based on ankle positions.
    """
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
            # Weighted average based on confidence
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
    
    # Add foot keypoints - from ankle, go toward RIGHT and DOWN
    if image_np is not None:
        h, w = image_np.shape[:2]
        
        # Right foot: 3 inches down
        down_offset_right = int(h * 0.055)
        # Left foot: 4 inches down
        down_offset_left = int(h * 0.073)
        # Right foot: normal offset toward right
        right_offset = int(w * 0.02)
        # Left foot: more inward (more toward right)
        left_foot_offset = int(w * 0.035)
        
        for side in ['left', 'right']:
            ankle = fused.get(f'{side}_ankle')
            
            if ankle and ankle['confidence'] > 0.3:
                ankle_x = ankle['x']
                ankle_y = ankle['y']
                
                # Go toward right - left foot goes more inward and further down
                if side == 'left':
                    foot_x = ankle_x + left_foot_offset
                    foot_y = ankle_y + down_offset_left
                else:
                    foot_x = ankle_x + right_offset
                    foot_y = ankle_y + down_offset_right
                
                # Clamp to image bounds
                foot_x = max(0, min(foot_x, w - 1))
                foot_y = max(0, min(foot_y, h - 1))
                
                fused[f'{side}_foot'] = {
                    'x': float(foot_x),
                    'y': float(foot_y),
                    'confidence': ankle['confidence'] * 0.9,
                    'source': 'estimated'
                }
    
    # NOTE: Do NOT move wrist to ball position - wrist should stay at the wrist
    # The ball is held by the hands, but the wrist keypoint marks the wrist joint
    
    return fused


def calculate_shooting_angles(keypoints):
    """
    Calculate biomechanical angles for shooting form analysis.
    """
    angles = {}
    
    # Elbow angle (shooting arm)
    # Try left first (common in rear views), then right
    for side in ['left', 'right']:
        shoulder = keypoints.get(f'{side}_shoulder')
        elbow = keypoints.get(f'{side}_elbow')
        wrist = keypoints.get(f'{side}_wrist')
        
        if shoulder and elbow and wrist:
            angle = calculate_angle(shoulder, elbow, wrist)
            angles[f'{side}_elbow_angle'] = angle
    
    # Knee angle
    for side in ['left', 'right']:
        hip = keypoints.get(f'{side}_hip')
        knee = keypoints.get(f'{side}_knee')
        ankle = keypoints.get(f'{side}_ankle')
        
        if hip and knee and ankle:
            angle = calculate_angle(hip, knee, ankle)
            angles[f'{side}_knee_angle'] = angle
    
    # Shoulder alignment (horizontal)
    left_shoulder = keypoints.get('left_shoulder')
    right_shoulder = keypoints.get('right_shoulder')
    if left_shoulder and right_shoulder:
        dx = right_shoulder['x'] - left_shoulder['x']
        dy = right_shoulder['y'] - left_shoulder['y']
        angles['shoulder_tilt'] = math.degrees(math.atan2(dy, dx))
    
    # Hip alignment
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
    """
    Analyze shooting form and provide feedback.
    """
    feedback = []
    score = 70  # Base score
    
    # Check elbow angle
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
    
    # Check knee bend
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
    
    # Check alignment
    shoulder_tilt = angles.get('shoulder_tilt', 0)
    if abs(shoulder_tilt) < 10:
        feedback.append({
            'type': 'success',
            'area': 'alignment',
            'message': 'Shoulders level. Good balance!'
        })
        score += 5
    
    return feedback, min(100, score)


@app.route('/api/detect-pose', methods=['POST'])
def detect_pose():
    """
    Hybrid pose detection endpoint.
    Combines YOLOv8-pose + MediaPipe + basketball detection.
    """
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode image - strip data URL prefix if present
        image_str = data['image']
        if ',' in image_str:
            # Remove data URL prefix like "data:image/jpeg;base64,"
            image_str = image_str.split(',', 1)[1]
        
        image_data = base64.b64decode(image_str)
        pil_image = Image.open(io.BytesIO(image_data))
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        image_np = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        h, w = image_np.shape[:2]
        
        print(f"📸 Hybrid detection on {w}x{h} image")
        
        # Step 1: Find the shooter
        bbox = find_shooter_bbox(image_np)
        print(f"👤 Shooter bbox: {bbox}")
        
        # Step 2: Run YOLOv8-pose
        yolo_keypoints = detect_pose_yolo(image_np, bbox)
        print(f"🔵 YOLO detected: {len(yolo_keypoints) if yolo_keypoints else 0} keypoints")
        
        # Step 3: Run MediaPipe
        mp_keypoints = detect_pose_mediapipe(image_np, bbox)
        print(f"🟢 MediaPipe detected: {len(mp_keypoints) if mp_keypoints else 0} keypoints")
        
        # Step 4: Find basketball (use wrist positions to help locate it)
        wrist_positions = []
        if yolo_keypoints:
            if 'left_wrist' in yolo_keypoints:
                wrist_positions.append((yolo_keypoints['left_wrist']['x'], yolo_keypoints['left_wrist']['y']))
            if 'right_wrist' in yolo_keypoints:
                wrist_positions.append((yolo_keypoints['right_wrist']['x'], yolo_keypoints['right_wrist']['y']))
        
        ball = find_basketball(image_np, wrist_positions if wrist_positions else None)
        print(f"🏀 Basketball: {ball}")
        
        # Step 5: Fuse results (pass image for foot detection)
        keypoints = fuse_keypoints(yolo_keypoints, mp_keypoints, ball, image_np)
        
        if not keypoints:
            return jsonify({'error': 'Could not detect pose'}), 404
        
        print(f"✅ Fused: {len(keypoints)} keypoints")
        
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
        
        if not keypoints:
            # Calculate angles from keypoints
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


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'hybrid',
        'components': ['yolov8x-pose', 'mediapipe', 'opencv-ball-detection']
    })


if __name__ == '__main__':
    port = int(os.environ.get('POSE_PORT', 5001))
    print(f"🏀 Starting HYBRID Pose Detection on port {port}")
    print(f"   Components: YOLOv8x-pose + MediaPipe + OpenCV")
    app.run(host='0.0.0.0', port=port, debug=True)




