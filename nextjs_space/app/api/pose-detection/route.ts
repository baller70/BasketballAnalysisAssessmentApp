/**
 * API Route: Pose Detection (Direct Python Execution)
 * 
 * This route executes the Python hybrid pose detection script directly
 * via Node.js child_process, eliminating the need for a separate Python server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const maxDuration = 60; // Allow up to 60 seconds for pose detection

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🔄 Running Python hybrid pose detection...');

    // Create a Python script to run pose detection
    const pythonScript = path.join(process.cwd(), '..', 'python-scraper', 'hybrid_pose_detection.py');
    const scriptDir = path.dirname(pythonScript);

    // Check if the script exists
    if (!fs.existsSync(pythonScript)) {
      console.error(`Python script not found: ${pythonScript}`);
      return NextResponse.json(
        { error: 'Pose detection script not found' },
        { status: 500 }
      );
    }

    // Execute Python script with image data
    const result = await runPythonScript(pythonScript, scriptDir, body.image);
    
    console.log('✅ Pose detection successful');
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ Pose detection error:', error);
    return NextResponse.json(
      { error: 'Pose detection failed', details: error.message },
      { status: 500 }
    );
  }
}

function runPythonScript(scriptPath: string, cwd: string, imageData: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', `
import sys
import json
import base64
import numpy as np
from PIL import Image
import cv2
import io
import os
os.chdir('${cwd}')
sys.path.insert(0, '${cwd}')

# Disable SSL verification
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

# Import the hybrid pose detection modules
from ultralytics import YOLO
import mediapipe as mp

# Load models
yolo_detect = YOLO('yolov8n.pt')
yolo_pose = YOLO('yolov8x-pose.pt')
mediapipe_pose = mp.solutions.pose.Pose(
    static_image_mode=True,
    model_complexity=2,
    enable_segmentation=False,
    min_detection_confidence=0.3
)

# Read image data from stdin
image_data = sys.stdin.read()
image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
image = Image.open(io.BytesIO(image_bytes))
image_np = np.array(image)
h, w = image_np.shape[:2]

# YOLO pose detection
results = yolo_pose(image_np, verbose=False)
if len(results) > 0 and len(results[0].keypoints) > 0:
    kp = results[0].keypoints.data[0].cpu().numpy()
    keypoints = {}
    keypoint_names = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
                      'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                      'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
                      'left_knee', 'right_knee', 'left_ankle', 'right_ankle']
    
    for i, name in enumerate(keypoint_names):
        if i < len(kp):
            keypoints[name] = {
                'x': float(kp[i][0]),
                'y': float(kp[i][1]),
                'confidence': float(kp[i][2]) if len(kp[i]) > 2 else 1.0
            }
    
    # Basketball detection (simple circle detection)
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1, minDist=50,
                               param1=50, param2=30, minRadius=10, maxRadius=100)
    
    basketball = None
    if circles is not None:
        circles = np.uint16(np.around(circles))
        circle = circles[0][0]
        basketball = {'x': int(circle[0]), 'y': int(circle[1]), 'radius': int(circle[2])}
    
    output = {
        'success': True,
        'keypoints': keypoints,
        'confidence': float(np.mean([kp[i][2] for i in range(len(kp)) if len(kp[i]) > 2])),
        'basketball': basketball,
        'image_size': {'width': w, 'height': h},
        'method': 'hybrid'
    }
    print(json.dumps(output))
else:
    print(json.dumps({'error': 'No person detected'}))
`], { cwd });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr);
        reject(new Error(`Python script exited with code ${code}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        console.error('Failed to parse Python output:', stdout);
        console.error('stderr:', stderr);
        reject(new Error('Failed to parse pose detection results'));
      }
    });

    // Write image data to Python script's stdin
    python.stdin.write(imageData);
    python.stdin.end();
  });
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    method: 'embedded-python',
    message: 'Python hybrid pose detection embedded in Next.js'
  });
}
