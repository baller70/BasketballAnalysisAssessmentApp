/**
 * Pose Detection Service for Basketball Shooting Form Analysis
 * Uses TensorFlow.js MoveNet model for 17-point pose detection
 * Extended to 25 keypoints with computed biomechanical points
 */

// 17 MoveNet keypoints (base detection)
export const MOVENET_KEYPOINTS = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
] as const;

// Extended 25 keypoints (17 base + 8 computed biomechanical points)
export const EXTENDED_KEYPOINTS = [
  ...MOVENET_KEYPOINTS,
  'mid_shoulder',    // Computed: midpoint between shoulders
  'mid_hip',         // Computed: midpoint between hips (core/pelvis center)
  'spine_mid',       // Computed: midpoint between mid_shoulder and mid_hip
  'shooting_hand',   // Alias for dominant wrist (detected by arm position)
  'guide_hand',      // Alias for non-dominant wrist
  'ball_position',   // Estimated from wrist positions during shot
  'release_point',   // Computed from wrist trajectory at release
  'center_of_mass',  // Computed from body segment positions
] as const;

export interface PoseKeypoint {
  name: string;
  x: number;       // 0-1 normalized
  y: number;       // 0-1 normalized
  confidence: number;
}

export interface PoseDetectionResult {
  keypoints: PoseKeypoint[];
  confidence: number;
  isValid: boolean;
  boundingBox?: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  suggestion: string;
}

// Validation error codes
export const VALIDATION_ERRORS = {
  NO_PERSON: 'NO_PERSON_DETECTED',
  MULTIPLE_PEOPLE: 'MULTIPLE_PEOPLE_DETECTED',
  INCOMPLETE_BODY: 'INCOMPLETE_BODY',
  NOT_SHOOTING: 'NOT_SHOOTING_POSE',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  FACE_NOT_VISIBLE: 'FACE_NOT_VISIBLE',
  ARMS_NOT_VISIBLE: 'ARMS_NOT_VISIBLE',
  LEGS_NOT_VISIBLE: 'LEGS_NOT_VISIBLE',
} as const;

// Required keypoints for full body analysis
const REQUIRED_UPPER_BODY = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'];
const REQUIRED_LOWER_BODY = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
const REQUIRED_HEAD = ['nose'];

const MIN_CONFIDENCE_THRESHOLD = 0.3;
const SHOOTING_POSE_CONFIDENCE = 0.5;

/**
 * Validate that all required keypoints are detected with sufficient confidence
 */
export function validateFullBody(keypoints: PoseKeypoint[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]));
  
  // Check head visibility
  const headVisible = REQUIRED_HEAD.some(name => {
    const kp = keypointMap.get(name);
    return kp && kp.confidence >= MIN_CONFIDENCE_THRESHOLD;
  });
  
  if (!headVisible) {
    errors.push({
      code: VALIDATION_ERRORS.FACE_NOT_VISIBLE,
      message: 'Face/head not visible in the image',
      suggestion: 'Ensure the player\'s head is visible in the frame'
    });
  }
  
  // Check upper body
  const upperBodyMissing = REQUIRED_UPPER_BODY.filter(name => {
    const kp = keypointMap.get(name);
    return !kp || kp.confidence < MIN_CONFIDENCE_THRESHOLD;
  });
  
  if (upperBodyMissing.length > 2) {
    errors.push({
      code: VALIDATION_ERRORS.ARMS_NOT_VISIBLE,
      message: 'Arms and shoulders not fully visible',
      suggestion: 'Upload an image showing the player\'s full upper body with both arms visible'
    });
  }
  
  // Check lower body
  const lowerBodyMissing = REQUIRED_LOWER_BODY.filter(name => {
    const kp = keypointMap.get(name);
    return !kp || kp.confidence < MIN_CONFIDENCE_THRESHOLD;
  });
  
  if (lowerBodyMissing.length > 2) {
    errors.push({
      code: VALIDATION_ERRORS.LEGS_NOT_VISIBLE,
      message: 'Legs not fully visible in the image',
      suggestion: 'Upload a full-body image showing the player from head to feet'
    });
  }
  
  // Add warnings for low confidence keypoints
  keypoints.forEach(kp => {
    if (kp.confidence >= MIN_CONFIDENCE_THRESHOLD && kp.confidence < 0.5) {
      warnings.push(`Low confidence for ${kp.name.replace('_', ' ')} (${Math.round(kp.confidence * 100)}%)`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Detect if the person is in a shooting pose
 * Checks for raised arms, shooting motion characteristics
 */
export function validateShootingPose(keypoints: PoseKeypoint[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]));
  
  // Get key points for shooting detection
  const leftWrist = keypointMap.get('left_wrist');
  const rightWrist = keypointMap.get('right_wrist');
  const leftElbow = keypointMap.get('left_elbow');
  const rightElbow = keypointMap.get('right_elbow');
  const leftShoulder = keypointMap.get('left_shoulder');
  const rightShoulder = keypointMap.get('right_shoulder');
  const nose = keypointMap.get('nose');
  
  // Check if any arm is raised (wrist above shoulder level indicates shooting)
  const leftArmRaised = leftWrist && leftShoulder && 
    leftWrist.confidence >= SHOOTING_POSE_CONFIDENCE &&
    leftShoulder.confidence >= SHOOTING_POSE_CONFIDENCE &&
    leftWrist.y < leftShoulder.y; // Lower Y = higher position
  
  const rightArmRaised = rightWrist && rightShoulder &&
    rightWrist.confidence >= SHOOTING_POSE_CONFIDENCE &&
    rightShoulder.confidence >= SHOOTING_POSE_CONFIDENCE &&
    rightWrist.y < rightShoulder.y;
  
  // At least one arm should be raised for shooting pose
  if (!leftArmRaised && !rightArmRaised) {
    errors.push({
      code: VALIDATION_ERRORS.NOT_SHOOTING,
      message: 'Player does not appear to be in shooting position',
      suggestion: 'Upload an image showing the player with arms raised in shooting motion (preparing to shoot, at release point, or follow-through)'
    });
    return { isValid: false, errors, warnings };
  }
  
  // Determine shooting hand (higher wrist)
  const shootingHand = (leftWrist && rightWrist) 
    ? (leftWrist.y < rightWrist.y ? 'left' : 'right')
    : (leftArmRaised ? 'left' : 'right');
  
  // Check elbow alignment for shooting arm
  const shootingElbow = shootingHand === 'left' ? leftElbow : rightElbow;
  const shootingShoulder = shootingHand === 'left' ? leftShoulder : rightShoulder;
  const shootingWrist = shootingHand === 'left' ? leftWrist : rightWrist;
  
  if (shootingElbow && shootingShoulder && shootingWrist) {
    // Elbow should be between shoulder and wrist horizontally (proper alignment)
    const elbowX = shootingElbow.x;
    const shoulderX = shootingShoulder.x;

    // Check if wrist is near or above head level (indicates shot release position)
    if (nose && shootingWrist.confidence >= SHOOTING_POSE_CONFIDENCE) {
      const wristAboveHead = shootingWrist.y < nose.y;
      const wristNearHead = Math.abs(shootingWrist.y - nose.y) < 0.15;

      if (!wristAboveHead && !wristNearHead) {
        warnings.push('Shooting arm may not be at optimal release position');
      }
    }

    // Check for chicken wing (elbow flared out too much)
    const elbowFlare = Math.abs(elbowX - shoulderX);
    if (elbowFlare > 0.15) {
      warnings.push('Elbow appears to be flared out - this will be analyzed');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate computed keypoints from base detection
 */
export function computeExtendedKeypoints(baseKeypoints: PoseKeypoint[]): PoseKeypoint[] {
  const keypointMap = new Map(baseKeypoints.map(kp => [kp.name, kp]));
  const extended: PoseKeypoint[] = [...baseKeypoints];
  
  // Mid shoulder
  const leftShoulder = keypointMap.get('left_shoulder');
  const rightShoulder = keypointMap.get('right_shoulder');
  if (leftShoulder && rightShoulder) {
    extended.push({
      name: 'mid_shoulder',
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      confidence: Math.min(leftShoulder.confidence, rightShoulder.confidence)
    });
  }
  
  // Mid hip (core center)
  const leftHip = keypointMap.get('left_hip');
  const rightHip = keypointMap.get('right_hip');
  if (leftHip && rightHip) {
    extended.push({
      name: 'mid_hip',
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      confidence: Math.min(leftHip.confidence, rightHip.confidence)
    });
  }
  
  // Spine mid (between shoulders and hips)
  const midShoulder = extended.find(kp => kp.name === 'mid_shoulder');
  const midHip = extended.find(kp => kp.name === 'mid_hip');
  if (midShoulder && midHip) {
    extended.push({
      name: 'spine_mid',
      x: (midShoulder.x + midHip.x) / 2,
      y: (midShoulder.y + midHip.y) / 2,
      confidence: Math.min(midShoulder.confidence, midHip.confidence)
    });
  }
  
  // Determine shooting vs guide hand
  const leftWrist = keypointMap.get('left_wrist');
  const rightWrist = keypointMap.get('right_wrist');
  if (leftWrist && rightWrist) {
    const isLeftShooting = leftWrist.y < rightWrist.y;
    extended.push({
      name: 'shooting_hand',
      x: isLeftShooting ? leftWrist.x : rightWrist.x,
      y: isLeftShooting ? leftWrist.y : rightWrist.y,
      confidence: isLeftShooting ? leftWrist.confidence : rightWrist.confidence
    });
    extended.push({
      name: 'guide_hand',
      x: isLeftShooting ? rightWrist.x : leftWrist.x,
      y: isLeftShooting ? rightWrist.y : leftWrist.y,
      confidence: isLeftShooting ? rightWrist.confidence : leftWrist.confidence
    });
    
    // Ball position (estimated between wrists during shot)
    extended.push({
      name: 'ball_position',
      x: (leftWrist.x + rightWrist.x) / 2,
      y: Math.min(leftWrist.y, rightWrist.y) - 0.02,
      confidence: Math.min(leftWrist.confidence, rightWrist.confidence) * 0.8
    });
  }
  
  // Center of mass (weighted average of body segments)
  if (midShoulder && midHip) {
    // Simplified: COM is typically around 55% from feet to head
    const nose = keypointMap.get('nose');
    const leftAnkle = keypointMap.get('left_ankle');
    const rightAnkle = keypointMap.get('right_ankle');
    
    if (leftAnkle && rightAnkle) {
      const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
      const headY = nose ? nose.y : midShoulder.y - 0.1;
      const height = ankleY - headY;
      
      extended.push({
        name: 'center_of_mass',
        x: midHip.x,
        y: headY + height * 0.55, // 55% from top
        confidence: Math.min(midHip.confidence, midShoulder.confidence) * 0.7
      });
    }
  }
  
  return extended;
}

/**
 * Main validation function that runs all checks
 */
export function validateImage(keypoints: PoseKeypoint[]): ValidationResult {
  // Check for minimum keypoints detected
  if (keypoints.length < 10) {
    return {
      isValid: false,
      errors: [{
        code: VALIDATION_ERRORS.NO_PERSON,
        message: 'No person detected in the image',
        suggestion: 'Please upload an image with a clearly visible basketball player'
      }],
      warnings: []
    };
  }
  
  // Calculate overall confidence
  const avgConfidence = keypoints.reduce((sum, kp) => sum + kp.confidence, 0) / keypoints.length;
  if (avgConfidence < MIN_CONFIDENCE_THRESHOLD) {
    return {
      isValid: false,
      errors: [{
        code: VALIDATION_ERRORS.LOW_CONFIDENCE,
        message: 'Image quality too low for accurate analysis',
        suggestion: 'Upload a clearer image with better lighting and the player in focus'
      }],
      warnings: []
    };
  }
  
  // Run full body validation
  const fullBodyResult = validateFullBody(keypoints);
  if (!fullBodyResult.isValid) {
    return fullBodyResult;
  }
  
  // Run shooting pose validation
  const shootingPoseResult = validateShootingPose(keypoints);
  
  return {
    isValid: shootingPoseResult.isValid,
    errors: [...fullBodyResult.errors, ...shootingPoseResult.errors],
    warnings: [...fullBodyResult.warnings, ...shootingPoseResult.warnings]
  };
}

