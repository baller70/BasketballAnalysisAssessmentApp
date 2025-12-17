"""
Basketball Shooting Pose Detection

This uses a basketball-specific approach:
1. Find the basketball (orange blob in upper portion)
2. Find the shooting hand (skin blob near basketball)
3. Trace the arm down to shoulder
4. Find the rest of the body based on human proportions

Works even when standard pose models fail on action shots.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import cv2
import io
import os

app = Flask(__name__)
CORS(app)


def find_basketball(image_np):
    """Find the basketball in the image (orange blob, typically in upper half for shooting)."""
    h, w = image_np.shape[:2]
    hsv = cv2.cvtColor(image_np, cv2.COLOR_BGR2HSV)
    
    # Basketball orange color
    lower_orange = np.array([5, 100, 100])
    upper_orange = np.array([25, 255, 255])
    mask = cv2.inRange(hsv, lower_orange, upper_orange)
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Find best basketball candidate (round-ish, in upper portion)
    best_ball = None
    best_score = -1
    
    for c in contours:
        area = cv2.contourArea(c)
        if area < 100:  # Too small
            continue
        
        M = cv2.moments(c)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            
            # Prefer upper portion of image
            y_score = 1 - (cy / h)
            
            # Check roundness
            perimeter = cv2.arcLength(c, True)
            circularity = 4 * np.pi * area / (perimeter ** 2) if perimeter > 0 else 0
            
            score = y_score * 50 + circularity * 30 + (area / 1000) * 20
            
            if score > best_score:
                best_score = score
                x, y, bw, bh = cv2.boundingRect(c)
                best_ball = {'x': cx, 'y': cy, 'w': bw, 'h': bh}
    
    return best_ball


def find_skin_blobs(image_np, region=None):
    """Find skin-colored regions in the image."""
    if region:
        x1, y1, x2, y2 = region
        img_region = image_np[y1:y2, x1:x2]
    else:
        img_region = image_np
        x1, y1 = 0, 0
    
    hsv = cv2.cvtColor(img_region, cv2.COLOR_BGR2HSV)
    
    # Skin color range (works for various skin tones)
    lower_skin = np.array([0, 20, 70])
    upper_skin = np.array([25, 255, 255])
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    blobs = []
    for c in contours:
        area = cv2.contourArea(c)
        if area < 50:
            continue
        
        M = cv2.moments(c)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"]) + x1
            cy = int(M["m01"] / M["m00"]) + y1
            blobs.append({'x': cx, 'y': cy, 'area': area})
    
    return sorted(blobs, key=lambda b: b['area'], reverse=True)


def find_shooting_hand(image_np, ball_pos):
    """Find the shooting hand near the basketball."""
    if not ball_pos:
        return None
    
    h, w = image_np.shape[:2]
    
    # Search region around the ball
    search_radius = 50
    x1 = max(0, ball_pos['x'] - search_radius)
    y1 = max(0, ball_pos['y'] - search_radius)
    x2 = min(w, ball_pos['x'] + search_radius)
    y2 = min(h, ball_pos['y'] + search_radius)
    
    skin_blobs = find_skin_blobs(image_np, (x1, y1, x2, y2))
    
    if skin_blobs:
        # Return the largest skin blob near the ball
        return skin_blobs[0]
    
    return None


def estimate_body_from_hand(hand_pos, image_shape):
    """
    Estimate body keypoints based on shooting hand position.
    Uses human body proportions.
    """
    h, w = image_shape[:2]
    hx, hy = hand_pos['x'], hand_pos['y']
    
    # Estimate body proportions (shooting pose)
    # Wrist is slightly below hand
    wrist = {'x': hx - 5, 'y': hy + 15, 'confidence': 0.8}
    
    # Elbow is below and slightly to the side
    elbow_offset_x = -25 if hx < w/2 else 25  # Depends on which side
    elbow = {'x': hx + elbow_offset_x, 'y': hy + 60, 'confidence': 0.75}
    
    # Shoulder below elbow
    shoulder = {'x': elbow['x'] - 5, 'y': hy + 120, 'confidence': 0.7}
    
    # Head/nose based on shoulder
    nose = {'x': shoulder['x'] + 10, 'y': shoulder['y'] - 30, 'confidence': 0.6}
    
    # Other shoulder
    other_shoulder = {'x': shoulder['x'] - 35, 'y': shoulder['y'] + 10, 'confidence': 0.65}
    
    # Hips below shoulders
    hip_y = shoulder['y'] + 80
    right_hip = {'x': shoulder['x'] - 5, 'y': hip_y, 'confidence': 0.7}
    left_hip = {'x': other_shoulder['x'] + 5, 'y': hip_y, 'confidence': 0.7}
    
    # Knees
    knee_y = hip_y + 60
    right_knee = {'x': right_hip['x'] + 5, 'y': knee_y, 'confidence': 0.65}
    left_knee = {'x': left_hip['x'], 'y': knee_y, 'confidence': 0.65}
    
    # Ankles
    ankle_y = knee_y + 50
    right_ankle = {'x': right_knee['x'] - 3, 'y': ankle_y, 'confidence': 0.6}
    left_ankle = {'x': left_knee['x'], 'y': ankle_y, 'confidence': 0.6}
    
    # Guide hand (other wrist/elbow)
    other_wrist = {'x': other_shoulder['x'] + 30, 'y': other_shoulder['y'] - 20, 'confidence': 0.5}
    other_elbow = {'x': other_shoulder['x'] + 15, 'y': other_shoulder['y'] - 5, 'confidence': 0.55}
    
    return {
        'nose': nose,
        'right_shoulder': shoulder,
        'right_elbow': elbow,
        'right_wrist': wrist,
        'left_shoulder': other_shoulder,
        'left_elbow': other_elbow,
        'left_wrist': other_wrist,
        'right_hip': right_hip,
        'left_hip': left_hip,
        'right_knee': right_knee,
        'left_knee': left_knee,
        'right_ankle': right_ankle,
        'left_ankle': left_ankle,
    }


def refine_with_skin_detection(keypoints, image_np):
    """Refine keypoint positions by finding actual skin near estimated positions."""
    h, w = image_np.shape[:2]
    
    for name, kp in keypoints.items():
        if 'wrist' in name or 'elbow' in name or 'shoulder' in name:
            # Search for skin near this position
            search_radius = 25
            x1 = max(0, int(kp['x']) - search_radius)
            y1 = max(0, int(kp['y']) - search_radius)
            x2 = min(w, int(kp['x']) + search_radius)
            y2 = min(h, int(kp['y']) + search_radius)
            
            skin = find_skin_blobs(image_np, (x1, y1, x2, y2))
            if skin:
                # Move keypoint to largest skin blob
                kp['x'] = skin[0]['x']
                kp['y'] = skin[0]['y']
                kp['confidence'] = min(0.85, kp['confidence'] + 0.1)
    
    return keypoints


@app.route('/api/detect-pose', methods=['POST'])
def detect_pose():
    """Detect pose using basketball-specific approach."""
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
        
        print(f"📸 Image: {w}x{h}")
        
        # Step 1: Find the basketball
        ball = find_basketball(image_np)
        if ball:
            print(f"🏀 Ball found at ({ball['x']}, {ball['y']})")
        else:
            print("🏀 No ball found, searching top of image for hand")
        
        # Step 2: Find shooting hand
        if ball:
            hand = find_shooting_hand(image_np, ball)
        else:
            # Look for skin in top portion
            top_region = (0, 0, w, int(h * 0.3))
            skin = find_skin_blobs(image_np, top_region)
            hand = skin[0] if skin else None
        
        if hand:
            print(f"🖐️ Hand found at ({hand['x']}, {hand['y']})")
        else:
            return jsonify({'error': 'Could not detect shooter'}), 404
        
        # Step 3: Estimate body from hand position
        keypoints = estimate_body_from_hand(hand, image_np.shape)
        
        # Step 4: Refine with actual skin detection
        keypoints = refine_with_skin_detection(keypoints, image_np)
        
        # Clamp all coordinates to image bounds
        for name, kp in keypoints.items():
            kp['x'] = max(0, min(w, kp['x']))
            kp['y'] = max(0, min(h, kp['y']))
        
        avg_conf = np.mean([kp['confidence'] for kp in keypoints.values()])
        
        print(f"✅ Generated {len(keypoints)} keypoints, avg conf: {avg_conf:.2f}")
        
        return jsonify({
            'success': True,
            'keypoints': keypoints,
            'confidence': float(avg_conf),
            'ball_position': ball,
            'hand_position': {'x': hand['x'], 'y': hand['y']},
            'image_size': {'width': w, 'height': h},
            'method': 'basketball-specific'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-form', methods=['POST'])
def analyze_form():
    """Analyze shooting form."""
    data = request.json
    keypoints = data.get('keypoints', {})
    
    feedback = []
    
    # Calculate elbow angle
    if all(k in keypoints for k in ['right_shoulder', 'right_elbow', 'right_wrist']):
        angle = calculate_angle(
            keypoints['right_shoulder'],
            keypoints['right_elbow'],
            keypoints['right_wrist']
        )
        
        if angle < 75:
            feedback.append({'type': 'warning', 'area': 'elbow', 'message': f'Elbow too tight ({angle:.0f}°)'})
        elif angle > 115:
            feedback.append({'type': 'warning', 'area': 'elbow', 'message': f'Elbow flared ({angle:.0f}°)'})
        else:
            feedback.append({'type': 'success', 'area': 'elbow', 'message': f'Good elbow angle ({angle:.0f}°)'})
    
    score = 75 + len([f for f in feedback if f['type'] == 'success']) * 10
    
    return jsonify({
        'success': True,
        'feedback': feedback,
        'overall_score': min(100, score)
    })


def calculate_angle(p1, p2, p3):
    """Calculate angle at p2."""
    import math
    v1 = (p1['x'] - p2['x'], p1['y'] - p2['y'])
    v2 = (p3['x'] - p2['x'], p3['y'] - p2['y'])
    
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
    mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
    
    if mag1 * mag2 == 0:
        return 90
    
    cos_angle = max(-1, min(1, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'basketball-specific'})


if __name__ == '__main__':
    port = int(os.environ.get('POSE_PORT', 5001))
    print(f"🏀 Starting Basketball Pose Detection on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
