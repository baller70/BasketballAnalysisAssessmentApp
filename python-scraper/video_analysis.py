"""
VIDEO BASKETBALL SHOOTING FORM ANALYSIS
Local mockup for testing before Hugging Face deployment

Analyzes video of basketball shots:
- Frame-by-frame pose detection (YOLOv8x-pose + MediaPipe)
- Shot phase detection (setup, rise, release, follow-through)
- Motion tracking across frames
- Generates annotated video with skeleton overlay
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import cv2
import io
import os
import tempfile
import math
import ssl

# Fix SSL issues for model downloads
ssl._create_default_https_context = ssl._create_unverified_context

app = Flask(__name__)
CORS(app, origins=['*'], supports_credentials=True, allow_headers=['Content-Type', 'Authorization'], methods=['GET', 'POST', 'OPTIONS'])

# Lazy load models
_yolo_pose = None
_mediapipe_pose = None

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
            static_image_mode=False,  # Video mode for tracking
            model_complexity=1,  # Faster for video
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    return _mediapipe_pose


# Keypoint names for YOLO
YOLO_KEYPOINTS = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

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


def extract_frames(video_path, target_fps=10):
    """Extract frames from video at target FPS."""
    cap = cv2.VideoCapture(video_path)
    
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / original_fps if original_fps > 0 else 0
    
    # Calculate frame skip interval
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
        'frame_indices': frame_indices
    }


def detect_pose_in_frame(frame):
    """Detect pose in a single frame using YOLOv8."""
    model = get_yolo_pose()
    results = model(frame, verbose=False)
    
    keypoints = {}
    
    if len(results) > 0 and results[0].keypoints is not None:
        kpts = results[0].keypoints
        if len(kpts.data) > 0:
            # Get the first person detected
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


def calculate_angle(p1, p2, p3):
    """Calculate angle at p2 between p1-p2-p3."""
    v1 = np.array([p1['x'] - p2['x'], p1['y'] - p2['y']])
    v2 = np.array([p3['x'] - p2['x'], p3['y'] - p2['y']])
    
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    return np.degrees(angle)


def analyze_frame_biomechanics(keypoints):
    """Analyze biomechanics for a single frame."""
    metrics = {}
    
    # Elbow angle (shooting arm - assume right hand shooter)
    if all(k in keypoints for k in ['right_shoulder', 'right_elbow', 'right_wrist']):
        metrics['elbow_angle'] = calculate_angle(
            keypoints['right_shoulder'],
            keypoints['right_elbow'],
            keypoints['right_wrist']
        )
    
    # Knee angle (right leg)
    if all(k in keypoints for k in ['right_hip', 'right_knee', 'right_ankle']):
        metrics['knee_angle'] = calculate_angle(
            keypoints['right_hip'],
            keypoints['right_knee'],
            keypoints['right_ankle']
        )
    
    # Wrist height relative to shoulder
    if 'right_wrist' in keypoints and 'right_shoulder' in keypoints:
        metrics['wrist_height'] = keypoints['right_shoulder']['y'] - keypoints['right_wrist']['y']
    
    # Hip height (for jump detection)
    if 'right_hip' in keypoints:
        metrics['hip_y'] = keypoints['right_hip']['y']
    
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


def draw_skeleton_on_frame(frame, keypoints, phase=None):
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


def create_annotated_video(frames, all_keypoints, all_phases, output_path, fps=10):
    """Create video with skeleton overlay."""
    if not frames:
        return None
    
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    for i, frame in enumerate(frames):
        keypoints = all_keypoints[i] if i < len(all_keypoints) else {}
        phase = all_phases[i] if i < len(all_phases) else None
        
        annotated = draw_skeleton_on_frame(frame, keypoints, phase)
        out.write(annotated)
    
    out.release()
    return output_path


def analyze_video(video_path, target_fps=10):
    """
    Main video analysis function.
    Returns frame-by-frame analysis and generates annotated video.
    """
    # Extract frames
    frames, video_info = extract_frames(video_path, target_fps)
    
    if not frames:
        return None, "Could not extract frames from video"
    
    # Analyze each frame
    all_keypoints = []
    all_metrics = []
    all_phases = []
    prev_phase = None
    
    for frame in frames:
        # Detect pose
        keypoints = detect_pose_in_frame(frame)
        all_keypoints.append(keypoints)
        
        # Analyze biomechanics
        metrics = analyze_frame_biomechanics(keypoints)
        all_metrics.append(metrics)
        
        # Detect phase
        phase = detect_shot_phase(metrics, prev_phase)
        all_phases.append(phase)
        prev_phase = phase
    
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
    
    # Generate RAW frames as base64 images (NO skeleton - frontend will draw it)
    annotated_frames_base64 = []
    for i, frame in enumerate(frames):
        # DON'T draw skeleton - frontend handles this with offset and effects
        # Just return the raw frame
        
        # Convert to base64
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        annotated_frames_base64.append(frame_base64)
    
    # Also create key screenshots for the 3 main phases
    key_screenshots = []
    release_idx = release_frame
    setup_idx = max(0, release_idx - len(frames) // 3)
    followthrough_idx = min(len(frames) - 1, release_idx + len(frames) // 4)
    
    for idx, label in [(setup_idx, 'SETUP'), (release_idx, 'RELEASE'), (followthrough_idx, 'FOLLOW_THROUGH')]:
        if idx < len(frames):
            keypoints = all_keypoints[idx] if idx < len(all_keypoints) else {}
            annotated = draw_skeleton_on_frame(frames[idx], keypoints, label)
            _, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
            key_screenshots.append({
                'label': label,
                'frame_index': idx,
                'phase': label,
                'metrics': all_metrics[idx] if idx < len(all_metrics) else {},
                'keypoints': keypoints,
                'image_base64': base64.b64encode(buffer).decode('utf-8')
            })
    
    return {
        'success': True,
        'video_info': video_info,
        'frame_count': len(frames),
        'annotated_frames_base64': annotated_frames_base64,
        'phases': phase_timestamps,
        'metrics': {
            'elbow_angle_range': {
                'min': round(min(elbow_angles), 1) if elbow_angles else None,
                'max': round(max(elbow_angles), 1) if elbow_angles else None,
                'at_release': round(all_metrics[release_frame].get('elbow_angle', 0), 1)
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
                'metrics': all_metrics[i],
                'keypoint_count': len(all_keypoints[i]),
                'keypoints': all_keypoints[i],  # Include keypoints for each frame
                'ball_detected': False  # Placeholder
            }
            for i in range(len(frames))
        ],
        'all_keypoints': all_keypoints,  # Full keypoints array for all frames
        'key_screenshots': key_screenshots
    }, None


# ============ API ENDPOINTS ============

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model': 'video-analysis',
        'version': '1.0.0',
        'components': ['yolov8x-pose', 'mediapipe', 'opencv-video']
    })


@app.route('/api/analyze-video', methods=['POST'])
def api_analyze_video():
    """
    Analyze a video of a basketball shot.
    
    Expects JSON with:
    - video: base64 encoded video file
    - fps: target FPS for analysis (default: 10)
    
    Returns:
    - Frame-by-frame analysis
    - Phase detection
    - Annotated video with skeleton overlay
    """
    try:
        data = request.get_json()
        
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
        result, error = analyze_video(video_path, target_fps)
        
        # Clean up
        os.unlink(video_path)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify(result)
    
    except Exception as e:
        import traceback
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/analyze-video-url', methods=['POST'])
def api_analyze_video_url():
    """
    Analyze video from URL.
    
    Expects JSON with:
    - url: video URL
    - fps: target FPS (default: 10)
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        import urllib.request
        
        # Download video
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
            urllib.request.urlretrieve(data['url'], tmp.name)
            video_path = tmp.name
        
        target_fps = data.get('fps', 10)
        
        result, error = analyze_video(video_path, target_fps)
        
        os.unlink(video_path)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify(result)
    
    except Exception as e:
        import traceback
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("VIDEO BASKETBALL ANALYSIS SERVER")
    print("=" * 60)
    print("Endpoints:")
    print("  GET  /health              - Health check")
    print("  POST /api/analyze-video   - Analyze video (base64)")
    print("  POST /api/analyze-video-url - Analyze video from URL")
    print("=" * 60)
    print("Starting server on http://localhost:5002")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5002, debug=True)





