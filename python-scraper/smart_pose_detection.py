"""
Smart Pose Detection for Basketball Shooting Analysis

This uses a hybrid approach:
1. YOLOv8 to detect the person's bounding box
2. MediaPipe Pose (optimized) for keypoint detection within that box
3. Fallback refinement using image processing

The key insight: Find the hands first (often near the ball), then trace the connected skeleton.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import cv2
import io
import os
import ssl

# Fix SSL issues
ssl._create_default_https_context = ssl._create_unverified_context

app = Flask(__name__)
CORS(app)

# Lazy load models
_yolo_model = None
_mp_pose = None

def get_yolo():
    global _yolo_model
    if _yolo_model is None:
        from ultralytics import YOLO
        _yolo_model = YOLO('yolov8n.pt')  # Object detection (not pose)
    return _yolo_model

def get_mediapipe_pose():
    global _mp_pose
    if _mp_pose is None:
        import mediapipe as mp
        _mp_pose = mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3
        )
    return _mp_pose

# MediaPipe landmark indices
MP_LANDMARKS = {
    0: "nose",
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
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle"
}


def find_main_person_bbox(image_np):
    """Use YOLO to find the main person (largest, most centered)."""
    model = get_yolo()
    results = model(image_np, classes=[0], verbose=False)  # class 0 = person
    
    if not results or len(results[0].boxes) == 0:
        return None
    
    boxes = results[0].boxes
    h, w = image_np.shape[:2]
    center_x, center_y = w / 2, h / 2
    
    best_box = None
    best_score = -1
    
    for box in boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        box_w = x2 - x1
        box_h = y2 - y1
        area = box_w * box_h
        
        # Score by size and position
        size_score = area / (w * h)
        
        box_cx = (x1 + x2) / 2
        box_cy = (y1 + y2) / 2
        dist = np.sqrt(((box_cx - center_x) / w) ** 2 + ((box_cy - center_y) / h) ** 2)
        position_score = 1 - dist
        
        # Prefer people in left half (shooters)
        if box_cx < w * 0.6:
            position_score += 0.3
            
        # Prefer taller boxes (full body)
        height_ratio = box_h / h
        if height_ratio > 0.5:
            size_score += 0.2
        
        score = size_score * 0.6 + position_score * 0.4
        
        if score > best_score:
            best_score = score
            best_box = (int(x1), int(y1), int(x2), int(y2))
    
    return best_box


def detect_pose_mediapipe(image_np, bbox=None):
    """Detect pose using MediaPipe, optionally within a bounding box."""
    pose = get_mediapipe_pose()
    
    h, w = image_np.shape[:2]
    
    # If we have a bounding box, crop and process
    if bbox:
        x1, y1, x2, y2 = bbox
        # Add padding
        pad = 20
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(w, x2 + pad)
        y2 = min(h, y2 + pad)
        
        cropped = image_np[y1:y2, x1:x2]
        crop_h, crop_w = cropped.shape[:2]
        
        # Enhance contrast for better detection
        cropped_pil = Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB))
        enhancer = ImageEnhance.Contrast(cropped_pil)
        cropped_pil = enhancer.enhance(1.3)
        cropped = cv2.cvtColor(np.array(cropped_pil), cv2.COLOR_RGB2BGR)
        
        cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
        results = pose.process(cropped_rgb)
        
        if results.pose_landmarks:
            keypoints = {}
            for idx, name in MP_LANDMARKS.items():
                lm = results.pose_landmarks.landmark[idx]
                # Convert back to original image coordinates
                orig_x = x1 + int(lm.x * crop_w)
                orig_y = y1 + int(lm.y * crop_h)
                keypoints[name] = {
                    'x': orig_x,
                    'y': orig_y,
                    'confidence': lm.visibility
                }
            return keypoints
    
    # Fallback: process full image
    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    
    if results.pose_landmarks:
        keypoints = {}
        for idx, name in MP_LANDMARKS.items():
            lm = results.pose_landmarks.landmark[idx]
            keypoints[name] = {
                'x': int(lm.x * w),
                'y': int(lm.y * h),
                'confidence': lm.visibility
            }
        return keypoints
    
    return None


def refine_keypoints_with_cv(image_np, keypoints):
    """
    Refine keypoint positions using computer vision techniques.
    Find the shooting hand in the TOP region of the image (where the ball is during a shot).
    """
    h, w = image_np.shape[:2]
    
    # For a shooting motion, the shooting hand is in the TOP portion of the image
    # Look at top 35% of the image
    top_cutoff = int(h * 0.35)
    top_region = image_np[0:top_cutoff, :]
    
    hsv_top = cv2.cvtColor(top_region, cv2.COLOR_BGR2HSV)
    
    # Find skin-tone blobs (the shooting hand)
    # Skin tone in HSV
    lower_skin = np.array([0, 20, 70])
    upper_skin = np.array([20, 255, 255])
    skin_mask = cv2.inRange(hsv_top, lower_skin, upper_skin)
    
    skin_contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Find the most likely shooting hand - skin blob in the upper portion
    best_hand = None
    best_score = 0
    
    for c in skin_contours:
        area = cv2.contourArea(c)
        if area < 100:  # Too small
            continue
        
        M = cv2.moments(c)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            
            # Score: prefer blobs that are:
            # 1. Higher up (smaller y)
            # 2. Reasonable size (hand-sized)
            # 3. In the left-center area (where shooter is)
            
            y_score = 1 - (cy / top_cutoff)  # Higher = better
            size_score = min(area / 500, 1)  # Reasonable size
            x_score = 1 if cx < w * 0.7 else 0.5  # Prefer left side
            
            score = y_score * 0.5 + size_score * 0.3 + x_score * 0.2
            
            if score > best_score:
                best_score = score
                best_hand = (cx, cy)
    
    if best_hand:
        hand_x, hand_y = best_hand
        print(f"🖐️ Found shooting hand at: ({hand_x}, {hand_y})")
        
        # Update right_wrist to be at the hand position
        if keypoints:
            # The wrist is slightly below the hand
            keypoints['right_wrist'] = {
                'x': hand_x,
                'y': hand_y + 10,
                'confidence': 0.85
            }
            
            # If we have shoulder, we can estimate elbow position
            if 'right_shoulder' in keypoints:
                shoulder = keypoints['right_shoulder']
                # Elbow is roughly between shoulder and wrist
                elbow_x = int((shoulder['x'] + hand_x) / 2 + 15)  # Slightly outward
                elbow_y = int((shoulder['y'] + hand_y) / 2)
                keypoints['right_elbow'] = {
                    'x': elbow_x,
                    'y': elbow_y,
                    'confidence': 0.8
                }
    
    return keypoints


def estimate_skeleton_from_partial(keypoints, image_shape):
    """
    If some keypoints are missing, estimate them based on body proportions.
    Human body has predictable ratios we can use.
    """
    h, w = image_shape[:2]
    
    # If we have shoulders but missing elbows, estimate elbow position
    if 'right_shoulder' in keypoints and 'right_wrist' in keypoints:
        if 'right_elbow' not in keypoints or keypoints['right_elbow']['confidence'] < 0.3:
            # Elbow is roughly midway between shoulder and wrist
            rs = keypoints['right_shoulder']
            rw = keypoints['right_wrist']
            keypoints['right_elbow'] = {
                'x': int((rs['x'] + rw['x']) / 2),
                'y': int((rs['y'] + rw['y']) / 2),
                'confidence': 0.5
            }
    
    # Similar for left arm
    if 'left_shoulder' in keypoints and 'left_wrist' in keypoints:
        if 'left_elbow' not in keypoints or keypoints['left_elbow']['confidence'] < 0.3:
            ls = keypoints['left_shoulder']
            lw = keypoints['left_wrist']
            keypoints['left_elbow'] = {
                'x': int((ls['x'] + lw['x']) / 2),
                'y': int((ls['y'] + lw['y']) / 2),
                'confidence': 0.5
            }
    
    # If we have hips and ankles but missing knees
    if 'right_hip' in keypoints and 'right_ankle' in keypoints:
        if 'right_knee' not in keypoints or keypoints['right_knee']['confidence'] < 0.3:
            rh = keypoints['right_hip']
            ra = keypoints['right_ankle']
            keypoints['right_knee'] = {
                'x': int((rh['x'] + ra['x']) / 2),
                'y': int((rh['y'] * 0.4 + ra['y'] * 0.6)),  # Knee closer to ankle
                'confidence': 0.5
            }
    
    if 'left_hip' in keypoints and 'left_ankle' in keypoints:
        if 'left_knee' not in keypoints or keypoints['left_knee']['confidence'] < 0.3:
            lh = keypoints['left_hip']
            la = keypoints['left_ankle']
            keypoints['left_knee'] = {
                'x': int((lh['x'] + la['x']) / 2),
                'y': int((lh['y'] * 0.4 + la['y'] * 0.6)),
                'confidence': 0.5
            }
    
    return keypoints


@app.route('/api/detect-pose', methods=['POST'])
def detect_pose():
    """Smart pose detection combining Roboflow + CV refinement."""
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
        
        print(f"📸 Processing image: {w}x{h}")
        
        # Try Roboflow hosted model first - using yolov8x-pose (best accuracy)
        try:
            from inference_sdk import InferenceHTTPClient
            CLIENT = InferenceHTTPClient(
                api_url="https://detect.roboflow.com",
                api_key="rDWynPrytSysASUlyGvK"
            )
            
            # Save original bytes directly to avoid re-encoding quality loss
            temp_path = "/tmp/pose_detect_temp.jpg"
            with open(temp_path, "wb") as f:
                f.write(image_data)
            
            result = CLIENT.infer(temp_path, model_id="yolov8x-pose-640")
            
            if result.get('predictions'):
                # Find the MAIN shooter - LARGEST bounding box (area is king)
                best_person = None
                best_score = -1
                
                for pred in result['predictions']:
                    px, py = pred['x'], pred['y']
                    pw, ph = pred['width'], pred['height']
                    conf = pred['confidence']
                    
                    x1 = px - pw/2
                    x2 = px + pw/2
                    y1 = py - ph/2
                    
                    # AREA IS THE PRIMARY FACTOR - the shooter should be the biggest person
                    area = pw * ph
                    image_area = w * h
                    area_ratio = area / image_area
                    
                    # Must have significant coverage to be the main subject
                    if area_ratio < 0.1:  # Less than 10% of image - skip
                        print(f"  Skip: area only {area_ratio*100:.1f}% of image")
                        continue
                    
                    # Score heavily weighted by area
                    area_score = area_ratio * 200
                    
                    # Bonus for detection starting near top (captures full body including shooting arm)
                    top_bonus = 30 if y1 < h * 0.15 else 0
                    
                    # Bonus for wide detection (full body width)  
                    width_bonus = 20 if pw > w * 0.4 else 0
                    
                    score = area_score + top_bonus + width_bonus + conf * 10
                    
                    print(f"  Person: x1={x1:.0f}, y1={y1:.0f}, size={pw:.0f}x{ph:.0f}, area={area_ratio*100:.1f}%, score={score:.1f}")
                    
                    if score > best_score:
                        best_score = score
                        best_person = pred
                
                if best_person:
                    keypoints = {}
                    for kp in best_person['keypoints']:
                        name = kp['class']
                        keypoints[name] = {
                            'x': kp['x'],
                            'y': kp['y'],
                            'confidence': kp['confidence']
                        }
                    
                    print(f"✅ Roboflow detected {len(keypoints)} keypoints")
                    
                    # Refine with CV
                    keypoints = refine_keypoints_with_cv(image_np, keypoints)
                    keypoints = estimate_skeleton_from_partial(keypoints, image_np.shape)
                    
                    avg_conf = np.mean([kp['confidence'] for kp in keypoints.values()])
                    
                    return jsonify({
                        'success': True,
                        'keypoints': keypoints,
                        'confidence': float(avg_conf),
                        'bounding_box': {
                            'x1': best_person['x'] - best_person['width']/2,
                            'y1': best_person['y'] - best_person['height']/2,
                            'x2': best_person['x'] + best_person['width']/2,
                            'y2': best_person['y'] + best_person['height']/2,
                        },
                        'image_size': {'width': w, 'height': h},
                        'method': 'roboflow'
                    })
        except Exception as e:
            print(f"⚠️ Roboflow failed: {e}, falling back to local detection")
        
        # Step 1: Find the main person (shooter)
        bbox = find_main_person_bbox(image_np)
        print(f"👤 Main person bbox: {bbox}")
        
        # Step 2: Detect pose with MediaPipe
        keypoints = detect_pose_mediapipe(image_np, bbox)
        
        if not keypoints:
            print("⚠️ MediaPipe failed, using YOLO pose as fallback...")
            # Fallback to YOLO pose
            from ultralytics import YOLO
            pose_model = YOLO('yolov8n-pose.pt')
            results = pose_model(image_np, verbose=False)
            
            if results and results[0].keypoints is not None:
                # Find best person
                best_idx = 0
                if len(results[0].keypoints) > 1 and bbox:
                    # Select person closest to our detected bbox center
                    bbox_cx = (bbox[0] + bbox[2]) / 2
                    bbox_cy = (bbox[1] + bbox[3]) / 2
                    min_dist = float('inf')
                    
                    for idx in range(len(results[0].keypoints)):
                        kpts = results[0].keypoints[idx]
                        if hasattr(kpts, 'xy'):
                            xy = kpts.xy[0].cpu().numpy()
                            center_x = np.mean(xy[:, 0])
                            center_y = np.mean(xy[:, 1])
                            dist = np.sqrt((center_x - bbox_cx)**2 + (center_y - bbox_cy)**2)
                            if dist < min_dist:
                                min_dist = dist
                                best_idx = idx
                
                kpts = results[0].keypoints[best_idx]
                xy = kpts.xy[0].cpu().numpy()
                conf = kpts.conf[0].cpu().numpy() if hasattr(kpts, 'conf') else np.ones(17)
                
                YOLO_NAMES = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
                             'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                             'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
                             'left_knee', 'right_knee', 'left_ankle', 'right_ankle']
                
                keypoints = {}
                for i, name in enumerate(YOLO_NAMES):
                    keypoints[name] = {
                        'x': float(xy[i][0]),
                        'y': float(xy[i][1]),
                        'confidence': float(conf[i])
                    }
        
        if not keypoints:
            return jsonify({'error': 'Could not detect pose'}), 404
        
        # Step 3: Refine keypoints using CV (find basketball, adjust wrist)
        keypoints = refine_keypoints_with_cv(image_np, keypoints)
        
        # Step 4: Estimate missing keypoints
        keypoints = estimate_skeleton_from_partial(keypoints, image_np.shape)
        
        # Calculate confidence
        confidences = [kp['confidence'] for kp in keypoints.values() if 'confidence' in kp]
        avg_confidence = np.mean(confidences) if confidences else 0.5
        
        print(f"✅ Detected {len(keypoints)} keypoints, avg confidence: {avg_confidence:.2f}")
        
        return jsonify({
            'success': True,
            'keypoints': keypoints,
            'confidence': float(avg_confidence),
            'bounding_box': {'x1': bbox[0], 'y1': bbox[1], 'x2': bbox[2], 'y2': bbox[3]} if bbox else None,
            'image_size': {'width': w, 'height': h}
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-form', methods=['POST'])
def analyze_form():
    """Analyze shooting form based on keypoints."""
    try:
        data = request.json
        keypoints = data.get('keypoints', {})
        
        if not keypoints:
            return jsonify({'error': 'No keypoints provided'}), 400
        
        feedback = []
        scores = {}
        
        # Calculate elbow angle
        if all(k in keypoints for k in ['right_shoulder', 'right_elbow', 'right_wrist']):
            angle = calculate_angle(
                keypoints['right_shoulder'],
                keypoints['right_elbow'],
                keypoints['right_wrist']
            )
            scores['elbow_angle'] = angle
            
            if angle < 75:
                feedback.append({
                    'type': 'warning',
                    'area': 'elbow',
                    'message': f'Elbow angle too tight ({angle:.0f}°). Open up to around 90° at set point.'
                })
            elif angle > 115:
                feedback.append({
                    'type': 'warning',
                    'area': 'elbow',
                    'message': f'Elbow flared out ({angle:.0f}°). Tuck elbow in closer to ~90°.'
                })
            else:
                feedback.append({
                    'type': 'success',
                    'area': 'elbow',
                    'message': f'Good elbow angle ({angle:.0f}°)! Proper L-shape.'
                })
        
        # Calculate knee bend
        if all(k in keypoints for k in ['right_hip', 'right_knee', 'right_ankle']):
            knee_angle = calculate_angle(
                keypoints['right_hip'],
                keypoints['right_knee'],
                keypoints['right_ankle']
            )
            scores['knee_angle'] = knee_angle
            
            if knee_angle > 170:
                feedback.append({
                    'type': 'warning',
                    'area': 'knees',
                    'message': 'Knees too straight. Bend more for power!'
                })
            elif knee_angle < 130:
                feedback.append({
                    'type': 'success',
                    'area': 'knees',
                    'message': f'Good knee bend ({knee_angle:.0f}°) for power generation.'
                })
        
        # Check shooting arm alignment
        if all(k in keypoints for k in ['right_shoulder', 'right_elbow', 'right_wrist']):
            shoulder_x = keypoints['right_shoulder']['x']
            elbow_x = keypoints['right_elbow']['x']
            wrist_x = keypoints['right_wrist']['x']
            
            # For right-handed shooter, wrist should be above/aligned with elbow
            if abs(wrist_x - elbow_x) < 30:
                feedback.append({
                    'type': 'success',
                    'area': 'arm_alignment',
                    'message': 'Shooting arm nicely aligned.'
                })
            else:
                feedback.append({
                    'type': 'info',
                    'area': 'arm_alignment',
                    'message': 'Keep shooting elbow under the ball.'
                })
        
        # Calculate overall score
        overall_score = 70
        if 'elbow_angle' in scores:
            if 80 <= scores['elbow_angle'] <= 100:
                overall_score += 15
            elif 70 <= scores['elbow_angle'] <= 110:
                overall_score += 10
        
        if 'knee_angle' in scores and scores['knee_angle'] < 160:
            overall_score += 10
        
        overall_score = min(100, overall_score)
        
        return jsonify({
            'success': True,
            'feedback': feedback,
            'scores': scores,
            'overall_score': overall_score
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def calculate_angle(p1, p2, p3):
    """Calculate angle at p2 given three points."""
    import math
    
    # Handle both dict and list formats
    if isinstance(p1, dict):
        v1 = (p1['x'] - p2['x'], p1['y'] - p2['y'])
        v2 = (p3['x'] - p2['x'], p3['y'] - p2['y'])
    else:
        v1 = (p1[0] - p2[0], p1[1] - p2[1])
        v2 = (p3[0] - p2[0], p3[1] - p2[1])
    
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
    mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
    
    if mag1 * mag2 == 0:
        return 0
    
    cos_angle = max(-1, min(1, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'smart-hybrid'})


if __name__ == '__main__':
    port = int(os.environ.get('POSE_PORT', 5001))
    print(f"🏀 Starting Smart Pose Detection on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)




