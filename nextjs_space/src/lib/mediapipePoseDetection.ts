/**
 * MediaPipe Pose Detection Service
 * Uses BlazePose model for high-accuracy pose detection with 33 keypoints
 */

// MediaPipe BlazePose landmark indices and names (33 points)
export const MEDIAPIPE_KEYPOINT_NAMES = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
  'right_eye_inner', 'right_eye', 'right_eye_outer',
  'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
  'left_index', 'right_index', 'left_thumb', 'right_thumb',
  'left_hip', 'right_hip', 'left_knee', 'right_knee',
  'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index'
];

// Map MediaPipe keypoint names to MoveNet-compatible names for backwards compatibility
export const MEDIAPIPE_TO_MOVENET_MAP: Record<string, string> = {
  'nose': 'nose',
  'left_eye': 'left_eye',
  'right_eye': 'right_eye', 
  'left_ear': 'left_ear',
  'right_ear': 'right_ear',
  'left_shoulder': 'left_shoulder',
  'right_shoulder': 'right_shoulder',
  'left_elbow': 'left_elbow',
  'right_elbow': 'right_elbow',
  'left_wrist': 'left_wrist',
  'right_wrist': 'right_wrist',
  'left_hip': 'left_hip',
  'right_hip': 'right_hip',
  'left_knee': 'left_knee',
  'right_knee': 'right_knee',
  'left_ankle': 'left_ankle',
  'right_ankle': 'right_ankle',
};

export interface MediaPipeKeypoint {
  name: string;
  x: number;       // 0-1 normalized
  y: number;       // 0-1 normalized
  z: number;       // Depth (relative to hip midpoint)
  visibility: number;  // 0-1 visibility score
}

export interface DetectedKeypoint {
  name: string;
  x: number;       // 0-1 normalized
  y: number;       // 0-1 normalized
  confidence: number;
  z?: number;      // Optional depth for MediaPipe
}

export interface PoseDetectionResult {
  keypoints: DetectedKeypoint[];
  fullKeypoints: MediaPipeKeypoint[];  // All 33 MediaPipe keypoints
  isShootingPose: boolean;
  confidence: number;
}

// Singleton Pose instance
let poseInstance: import('@mediapipe/pose').Pose | null = null;
let isInitializing = false;

/**
 * Initialize MediaPipe Pose detector
 */
async function initializeDetector(): Promise<import('@mediapipe/pose').Pose> {
  if (poseInstance) return poseInstance;
  
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (poseInstance) return poseInstance;
  }
  
  isInitializing = true;
  
  try {
    const { Pose } = await import('@mediapipe/pose');
    
    poseInstance = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
      },
    });
    
    poseInstance.setOptions({
      modelComplexity: 2,  // 0=Lite, 1=Full, 2=Heavy (most accurate)
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    console.log('MediaPipe Pose initialized with Heavy model');
    return poseInstance;
  } catch (error) {
    console.error('Failed to initialize MediaPipe Pose:', error);
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
 * Create canvas from image for MediaPipe processing
 */
function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 0, 0);
  }
  return canvas;
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

  const leftArmRaised = !!(leftWrist && leftShoulder &&
    leftWrist.confidence > 0.3 && leftShoulder.confidence > 0.3 &&
    leftWrist.y < leftShoulder.y);

  const rightArmRaised = !!(rightWrist && rightShoulder &&
    rightWrist.confidence > 0.3 && rightShoulder.confidence > 0.3 &&
    rightWrist.y < rightShoulder.y);

  return leftArmRaised || rightArmRaised;
}

/**
 * Detect pose from image URL using MediaPipe
 */
export async function detectPoseFromImage(imageUrl: string): Promise<PoseDetectionResult> {
  try {
    const pose = await initializeDetector();
    const image = await loadImage(imageUrl);
    const canvas = imageToCanvas(image);

    return new Promise((resolve, reject) => {
      pose.onResults((results) => {
        if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
          resolve({
            keypoints: [],
            fullKeypoints: [],
            isShootingPose: false,
            confidence: 0,
          });
          return;
        }

        // Convert to full MediaPipe keypoints (33 points)
        const fullKeypoints: MediaPipeKeypoint[] = results.poseLandmarks.map((landmark, idx) => ({
          name: MEDIAPIPE_KEYPOINT_NAMES[idx] || `keypoint_${idx}`,
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
          visibility: landmark.visibility || 0,
        }));

        // Convert to backwards-compatible DetectedKeypoint format
        const keypoints: DetectedKeypoint[] = fullKeypoints.map((kp) => ({
          name: kp.name,
          x: kp.x,
          y: kp.y,
          z: kp.z,
          confidence: kp.visibility,
        }));

        // Calculate average confidence (visibility)
        const visibleKeypoints = keypoints.filter(kp => kp.confidence > 0.1);
        const avgConfidence = visibleKeypoints.length > 0
          ? visibleKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / visibleKeypoints.length
          : 0;

        const isShootingPose = checkShootingPose(keypoints);

        resolve({
          keypoints,
          fullKeypoints,
          isShootingPose,
          confidence: avgConfidence,
        });
      });

      // Process the image
      pose.send({ image: canvas }).catch(reject);
    });
  } catch (error) {
    console.error('MediaPipe pose detection error:', error);
    throw error;
  }
}

/**
 * Get compatible keypoints for existing analysis functions (17 MoveNet-style points)
 */
export function getCompatibleKeypoints(keypoints: DetectedKeypoint[]): DetectedKeypoint[] {
  const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]));
  const compatibleKeypoints: DetectedKeypoint[] = [];

  // Extract only the 17 keypoints that map to MoveNet format
  Object.entries(MEDIAPIPE_TO_MOVENET_MAP).forEach(([mediaPipeName, moveNetName]) => {
    const kp = keypointMap.get(mediaPipeName);
    if (kp) {
      compatibleKeypoints.push({
        ...kp,
        name: moveNetName,  // Use MoveNet-compatible name
      });
    }
  });

  return compatibleKeypoints;
}

/**
 * Cleanup pose detector resources
 */
export async function disposeDetector(): Promise<void> {
  if (poseInstance) {
    poseInstance.close();
    poseInstance = null;
  }
}

