/**
 * TensorFlow.js Pose Detection Service
 * Uses MoveNet SinglePose Lightning model for real-time pose detection
 */

import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

// MoveNet keypoint names (17 points)
const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

export interface DetectedKeypoint {
  name: string;
  x: number;       // 0-1 normalized
  y: number;       // 0-1 normalized
  confidence: number;
}

export interface PoseDetectionResult {
  keypoints: DetectedKeypoint[];
  isShootingPose: boolean;
  confidence: number;
}

// Singleton detector instance
let detector: poseDetection.PoseDetector | null = null;
let isInitializing = false;

/**
 * Initialize TensorFlow.js and load MoveNet model
 */
async function initializeDetector(): Promise<poseDetection.PoseDetector> {
  if (detector) return detector;
  
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (detector) return detector;
  }
  
  isInitializing = true;
  
  try {
    // Set TensorFlow.js backend
    await tf.setBackend('webgl');
    await tf.ready();
    
    console.log('TensorFlow.js backend:', tf.getBackend());
    
    // Create MoveNet detector (SinglePose Lightning is fastest)
    const model = poseDetection.SupportedModels.MoveNet;
    detector = await poseDetection.createDetector(model, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    });
    
    console.log('MoveNet detector initialized');
    return detector;
  } catch (error) {
    console.error('Failed to initialize pose detector:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Load image from URL into HTMLImageElement
 */
async function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
}

/**
 * Detect pose from image URL
 */
export async function detectPoseFromImage(imageUrl: string): Promise<PoseDetectionResult> {
  try {
    // Initialize detector if needed
    const det = await initializeDetector();
    
    // Load the image
    const image = await loadImage(imageUrl);
    
    // Run pose estimation
    const poses = await det.estimatePoses(image, {
      flipHorizontal: false,
    });
    
    if (!poses || poses.length === 0) {
      return {
        keypoints: [],
        isShootingPose: false,
        confidence: 0
      };
    }
    
    // Get the first (and only for SinglePose) detected pose
    const pose = poses[0];
    
    // Convert keypoints to normalized coordinates (0-1)
    const normalizedKeypoints: DetectedKeypoint[] = pose.keypoints.map((kp, idx) => ({
      name: KEYPOINT_NAMES[idx] || kp.name || `keypoint_${idx}`,
      x: kp.x / image.width,
      y: kp.y / image.height,
      confidence: kp.score || 0
    }));
    
    // Calculate average confidence
    const avgConfidence = normalizedKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / normalizedKeypoints.length;
    
    // Check if it's a shooting pose (at least one wrist above shoulder level)
    const isShootingPose = checkShootingPose(normalizedKeypoints);
    
    return {
      keypoints: normalizedKeypoints,
      isShootingPose,
      confidence: avgConfidence
    };
  } catch (error) {
    console.error('Pose detection error:', error);
    throw error;
  }
}

/**
 * Check if the detected pose is a shooting pose
 */
function checkShootingPose(keypoints: DetectedKeypoint[]): boolean {
  const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]));

  const leftWrist = keypointMap.get('left_wrist');
  const rightWrist = keypointMap.get('right_wrist');
  const leftShoulder = keypointMap.get('left_shoulder');
  const rightShoulder = keypointMap.get('right_shoulder');

  // Check if either arm is raised (wrist Y < shoulder Y means wrist is higher)
  const leftArmRaised = !!(leftWrist && leftShoulder &&
    leftWrist.confidence > 0.3 && leftShoulder.confidence > 0.3 &&
    leftWrist.y < leftShoulder.y);

  const rightArmRaised = !!(rightWrist && rightShoulder &&
    rightWrist.confidence > 0.3 && rightShoulder.confidence > 0.3 &&
    rightWrist.y < rightShoulder.y);

  return leftArmRaised || rightArmRaised;
}

/**
 * Cleanup detector resources
 */
export async function disposeDetector(): Promise<void> {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}

