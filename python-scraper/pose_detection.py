"""
Pre-trained YOLOv8-pose endpoint for basketball shooting form analysis.
Uses COCO-trained model that works on any person - robust for all shooting styles.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# Lazy load model
_model = None

def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        _model = YOLO('yolov8n-pose.pt')
    return _model

# COCO keypoint names
KEYPOINT_NAMES = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

@app.route('/api/detect-pose', methods=['POST'])
def detect_pose():
    """Detect pose keypoints from image using pre-trained YOLOv8-pose."""
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_width, img_height = image.width, image.height
        img_center_x = img_width / 2
        img_center_y = img_height / 2
        
        # Run inference
        model = get_model()
        results = model(image, verbose=False)
        
        if not results or len(results) == 0:
            return jsonify({'error': 'No person detected'}), 404
        
        result = results[0]
        
        if result.keypoints is None or len(result.keypoints) == 0:
            return jsonify({'error': 'No pose detected'}), 404
        
        # SMART SELECTION: Find the MAIN SUBJECT (shooter), not background people
        # Score each detected person based on:
        # 1. Bounding box size (larger = more likely the subject)
        # 2. Position (closer to center = more likely the subject)
        # 3. Keypoint confidence (higher = better detection)
        
        best_person_idx = 0
        best_score = -1
        
        num_people = len(result.keypoints)
        print(f"🔍 Detected {num_people} people in image")
        
        for idx in range(num_people):
            score = 0
            
            # Get bounding box for this person
            if result.boxes is not None and idx < len(result.boxes):
                box = result.boxes[idx]
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                box_width = x2 - x1
                box_height = y2 - y1
                box_area = box_width * box_height
                box_center_x = (x1 + x2) / 2
                box_center_y = (y1 + y2) / 2
                
                # Score by size (normalized by image area)
                size_score = (box_area / (img_width * img_height)) * 100
                
                # Score by position (closer to center is better)
                dist_from_center = np.sqrt(
                    ((box_center_x - img_center_x) / img_width) ** 2 +
                    ((box_center_y - img_center_y) / img_height) ** 2
                )
                position_score = (1 - dist_from_center) * 50
                
                # Score by height ratio (taller people in frame are more likely subjects)
                height_ratio = box_height / img_height
                height_score = height_ratio * 30
                
                # Bonus for being in the left-center area (where shooter typically is)
                if box_center_x < img_width * 0.6:
                    position_score += 20
                
                score = size_score + position_score + height_score
                
                print(f"  Person {idx}: box=({x1:.0f},{y1:.0f})-({x2:.0f},{y2:.0f}), "
                      f"size={size_score:.1f}, pos={position_score:.1f}, height={height_score:.1f}, "
                      f"TOTAL={score:.1f}")
            
            # Add keypoint confidence score
            if hasattr(result.keypoints[idx], 'conf'):
                conf = result.keypoints[idx].conf[0].cpu().numpy()
                avg_conf = float(np.mean(conf))
                score += avg_conf * 20
            
            if score > best_score:
                best_score = score
                best_person_idx = idx
        
        print(f"✅ Selected person {best_person_idx} with score {best_score:.1f}")
        
        # Get the BEST person's keypoints
        keypoints_data = result.keypoints[best_person_idx]
        
        # Extract x, y coordinates and confidence
        if hasattr(keypoints_data, 'xy'):
            xy = keypoints_data.xy[0].cpu().numpy()  # Shape: (17, 2)
        else:
            xy = keypoints_data.data[0, :, :2].cpu().numpy()
        
        if hasattr(keypoints_data, 'conf'):
            conf = keypoints_data.conf[0].cpu().numpy()  # Shape: (17,)
        else:
            conf = keypoints_data.data[0, :, 2].cpu().numpy()
        
        # Format keypoints as dict
        keypoints = {}
        for i, name in enumerate(KEYPOINT_NAMES):
            keypoints[name] = {
                'x': float(xy[i][0]),
                'y': float(xy[i][1]),
                'confidence': float(conf[i]) if i < len(conf) else 0.0
            }
        
        # Get bounding box for selected person
        bounding_box = None
        if result.boxes is not None and best_person_idx < len(result.boxes):
            box = result.boxes[best_person_idx]
            bounding_box = {
                'x1': float(box.xyxy[0][0]),
                'y1': float(box.xyxy[0][1]),
                'x2': float(box.xyxy[0][2]),
                'y2': float(box.xyxy[0][3])
            }
        
        # Calculate average confidence
        avg_confidence = float(np.mean(conf))
        
        return jsonify({
            'success': True,
            'keypoints': keypoints,
            'confidence': avg_confidence,
            'bounding_box': bounding_box,
            'image_size': {'width': image.width, 'height': image.height},
            'people_detected': num_people,
            'selected_person': best_person_idx
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-form', methods=['POST'])
def analyze_form():
    """Analyze shooting form based on keypoints and provide feedback."""
    try:
        data = request.json
        keypoints = data.get('keypoints', {})
        
        if not keypoints:
            return jsonify({'error': 'No keypoints provided'}), 400
        
        feedback = []
        scores = {}
        
        # Analyze elbow angle (should be ~90 degrees at set point)
        if all(k in keypoints for k in ['right_shoulder', 'right_elbow', 'right_wrist']):
            elbow_angle = calculate_angle(
                keypoints['right_shoulder'],
                keypoints['right_elbow'],
                keypoints['right_wrist']
            )
            scores['elbow_angle'] = elbow_angle
            
            if elbow_angle < 70:
                feedback.append({
                    'type': 'warning',
                    'area': 'elbow',
                    'message': f'Elbow angle too tight ({elbow_angle:.0f}°). Try to open up to ~90°.'
                })
            elif elbow_angle > 120:
                feedback.append({
                    'type': 'warning', 
                    'area': 'elbow',
                    'message': f'Elbow flared out ({elbow_angle:.0f}°). Tuck it in closer to ~90°.'
                })
            else:
                feedback.append({
                    'type': 'success',
                    'area': 'elbow',
                    'message': f'Good elbow angle ({elbow_angle:.0f}°)!'
                })
        
        # Analyze knee bend
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
                    'message': 'Bend your knees more for power!'
                })
            elif knee_angle < 120:
                feedback.append({
                    'type': 'info',
                    'area': 'knees',
                    'message': 'Good knee bend for power generation.'
                })
        
        # Analyze alignment (shoulder over hip over ankle)
        if all(k in keypoints for k in ['right_shoulder', 'right_hip', 'right_ankle']):
            shoulder_x = keypoints['right_shoulder']['x']
            hip_x = keypoints['right_hip']['x']
            ankle_x = keypoints['right_ankle']['x']
            
            alignment_diff = abs(shoulder_x - ankle_x)
            scores['alignment'] = alignment_diff
            
            if alignment_diff > 50:
                feedback.append({
                    'type': 'warning',
                    'area': 'alignment',
                    'message': 'Body not aligned. Stack shoulders over hips over feet.'
                })
        
        # Calculate overall score (0-100)
        overall_score = 70  # Base score
        if 'elbow_angle' in scores:
            if 80 <= scores['elbow_angle'] <= 100:
                overall_score += 15
            elif 70 <= scores['elbow_angle'] <= 110:
                overall_score += 10
        
        if 'knee_angle' in scores and scores['knee_angle'] < 160:
            overall_score += 10
        
        if 'alignment' in scores and scores['alignment'] < 30:
            overall_score += 5
        
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
    
    v1 = (p1['x'] - p2['x'], p1['y'] - p2['y'])
    v2 = (p3['x'] - p2['x'], p3['y'] - p2['y'])
    
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
    mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
    
    if mag1 * mag2 == 0:
        return 0
    
    cos_angle = dot / (mag1 * mag2)
    cos_angle = max(-1, min(1, cos_angle))  # Clamp to [-1, 1]
    
    angle = math.acos(cos_angle)
    return math.degrees(angle)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'yolov8n-pose'})


if __name__ == '__main__':
    port = int(os.environ.get('POSE_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)




