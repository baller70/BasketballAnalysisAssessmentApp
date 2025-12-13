/**
 * RoboFlow Pose Estimation Service
 * Handles pose detection, angle calculation, and shooting phase identification
 * for basketball shooting form analysis
 */

import axios from 'axios'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface KeyPoint {
  x: number
  y: number
  confidence: number
  name: string
}

export interface PoseDetectionResult {
  keypoints: {
    head: KeyPoint
    leftShoulder: KeyPoint
    rightShoulder: KeyPoint
    leftElbow: KeyPoint
    rightElbow: KeyPoint
    leftWrist: KeyPoint
    rightWrist: KeyPoint
    leftKnee: KeyPoint
    rightKnee: KeyPoint
    leftAnkle: KeyPoint
    rightAnkle: KeyPoint
  }
  angles: {
    elbowAngle: number
    kneeAngle: number
    wristAngle: number
    shoulderAngle: number
    hipAngle: number
    releaseAngle: number
  }
  shootingPhase: 'stance' | 'dip' | 'rise' | 'release' | 'follow_through'
  phaseConfidence: number
  overallConfidence: number
  imageWidth: number
  imageHeight: number
  detectedHand: 'left' | 'right' | 'unknown'
}

// ============================================
// ROBOFLOW POSE DETECTION
// ============================================

/**
 * Detect pose using RoboFlow API
 * 
 * This uses RoboFlow's pose estimation models to detect body keypoints
 * For basketball analysis, we use either:
 * 1. Pre-trained pose models from RoboFlow Universe
 * 2. Custom trained basketball shooting pose model
 * 
 * @param base64Image - Base64 encoded image string
 * @returns Pose detection result with keypoints and angles
 */
export async function detectPose(base64Image: string): Promise<PoseDetectionResult> {
  const apiKey = process.env.ROBOFLOW_API_KEY

  if (!apiKey) {
    throw new Error('ROBOFLOW_API_KEY not configured')
  }

  try {
    // Clean base64 string (remove data URL prefix if present)
    let imageData = base64Image
    if (imageData.startsWith('data:')) {
      imageData = imageData.split(',')[1]
    }

    // RoboFlow Pose Estimation API
    // Using a general pose estimation model
    // Replace with your custom basketball model if available
    const modelEndpoint = 'https://detect.roboflow.com/coco-pose/1'
    
    const response = await axios({
      method: 'POST',
      url: modelEndpoint,
      params: {
        api_key: apiKey,
        confidence: 0.3, // Lower threshold to detect more keypoints
      },
      data: imageData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000, // 30 second timeout
    })

    const predictions = response.data.predictions || []
    const imageInfo = response.data.image || {}

    if (predictions.length === 0) {
      throw new Error('No person detected in image')
    }

    // Get the prediction with highest confidence (assumes single person)
    const mainPrediction = predictions.reduce((prev: any, current: any) => 
      (current.confidence > prev.confidence) ? current : prev
    )

    // Extract keypoints from RoboFlow response
    const keypoints = extractKeypoints(mainPrediction, imageInfo.width, imageInfo.height)

    // Calculate biomechanical angles
    const angles = calculateAngles(keypoints)

    // Identify shooting phase
    const { phase, confidence } = identifyShootingPhase(keypoints, angles)

    // Determine dominant hand
    const detectedHand = detectShootingHand(keypoints)

    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(keypoints)

    return {
      keypoints,
      angles,
      shootingPhase: phase,
      phaseConfidence: confidence,
      overallConfidence,
      imageWidth: imageInfo.width || 1,
      imageHeight: imageInfo.height || 1,
      detectedHand,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      if (status === 401) {
        throw new Error('Invalid RoboFlow API key')
      }

      if (status === 404) {
        throw new Error('Pose detection model not found. Please configure a valid model.')
      }

      throw new Error(`RoboFlow API error: ${message}`)
    }

    throw error
  }
}

// ============================================
// KEYPOINT EXTRACTION
// ============================================

/**
 * Extract keypoints from RoboFlow prediction response
 * Maps RoboFlow keypoint names to our standardized format
 */
function extractKeypoints(prediction: any, imgWidth: number, imgHeight: number): PoseDetectionResult['keypoints'] {
  const kpts = prediction.keypoints || {}
  
  // Helper to normalize coordinates to percentage
  const normalize = (x: number, y: number) => ({
    x: (x / imgWidth) * 100,
    y: (y / imgHeight) * 100,
  })

  // Extract keypoints with fallbacks
  // RoboFlow COCO pose model keypoint names
  const getKeypoint = (name: string, aliases: string[] = []): KeyPoint => {
    const allNames = [name, ...aliases]
    
    for (const kptName of allNames) {
      const kpt = kpts[kptName]
      if (kpt) {
        const coords = normalize(kpt.x, kpt.y)
        return {
          x: coords.x,
          y: coords.y,
          confidence: kpt.confidence || 0,
          name: kptName,
        }
      }
    }

    // Return default if not found
    return {
      x: 50,
      y: 50,
      confidence: 0,
      name: name,
    }
  }

  return {
    head: getKeypoint('nose', ['head', 'face']),
    leftShoulder: getKeypoint('left_shoulder', ['shoulder_left']),
    rightShoulder: getKeypoint('right_shoulder', ['shoulder_right']),
    leftElbow: getKeypoint('left_elbow', ['elbow_left']),
    rightElbow: getKeypoint('right_elbow', ['elbow_right']),
    leftWrist: getKeypoint('left_wrist', ['wrist_left']),
    rightWrist: getKeypoint('right_wrist', ['wrist_right']),
    leftKnee: getKeypoint('left_knee', ['knee_left']),
    rightKnee: getKeypoint('right_knee', ['knee_right']),
    leftAnkle: getKeypoint('left_ankle', ['ankle_left']),
    rightAnkle: getKeypoint('right_ankle', ['ankle_right']),
  }
}

// ============================================
// ANGLE CALCULATIONS
// ============================================

/**
 * Calculate biomechanical angles from keypoints
 * Returns angles in degrees
 */
function calculateAngles(keypoints: PoseDetectionResult['keypoints']): PoseDetectionResult['angles'] {
  // Determine which side to use (the one with higher confidence)
  const useLeftSide = 
    (keypoints.leftElbow.confidence + keypoints.leftWrist.confidence + keypoints.leftShoulder.confidence) >
    (keypoints.rightElbow.confidence + keypoints.rightWrist.confidence + keypoints.rightShoulder.confidence)

  const shoulder = useLeftSide ? keypoints.leftShoulder : keypoints.rightShoulder
  const elbow = useLeftSide ? keypoints.leftElbow : keypoints.rightElbow
  const wrist = useLeftSide ? keypoints.leftWrist : keypoints.rightWrist
  const knee = useLeftSide ? keypoints.leftKnee : keypoints.rightKnee
  const ankle = useLeftSide ? keypoints.leftAnkle : keypoints.rightAnkle

  // Calculate elbow angle (shoulder-elbow-wrist)
  const elbowAngle = calculateAngle3Points(shoulder, elbow, wrist)

  // Calculate knee angle (hip-knee-ankle)
  // We don't have hip directly, so use shoulder as approximation
  const kneeAngle = calculateAngle3Points(shoulder, knee, ankle)

  // Calculate wrist angle (elbow-wrist-fingertips)
  // Since we don't have fingertips, use projection
  const wristAngle = calculateWristAngle(elbow, wrist)

  // Calculate shoulder angle (relative to vertical)
  const shoulderAngle = calculateShoulderAngle(shoulder, elbow)

  // Calculate hip angle (approximated from shoulder-knee angle)
  const hipAngle = Math.abs(shoulder.x - knee.x) * 0.5

  // Calculate release angle (trajectory of ball)
  const releaseAngle = calculateReleaseAngle(shoulder, wrist)

  return {
    elbowAngle,
    kneeAngle,
    wristAngle,
    shoulderAngle,
    hipAngle,
    releaseAngle,
  }
}

/**
 * Calculate angle between three points
 * Returns angle in degrees (0-180)
 */
function calculateAngle3Points(p1: KeyPoint, p2: KeyPoint, p3: KeyPoint): number {
  // Vector from p2 to p1
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
  
  // Vector from p2 to p3
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
  
  // Dot product
  const dot = v1.x * v2.x + v1.y * v2.y
  
  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  
  if (mag1 === 0 || mag2 === 0) return 90 // Default angle
  
  // Calculate angle
  const cosAngle = dot / (mag1 * mag2)
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)
  
  return angle
}

/**
 * Calculate wrist angle (flexion/extension)
 */
function calculateWristAngle(elbow: KeyPoint, wrist: KeyPoint): number {
  const dx = wrist.x - elbow.x
  const dy = wrist.y - elbow.y
  
  // Angle relative to horizontal
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  return Math.abs(angle)
}

/**
 * Calculate shoulder angle relative to vertical
 */
function calculateShoulderAngle(shoulder: KeyPoint, elbow: KeyPoint): number {
  const dx = elbow.x - shoulder.x
  const dy = elbow.y - shoulder.y
  
  // Angle relative to vertical (90 degrees = horizontal)
  const angle = Math.atan2(dx, dy) * (180 / Math.PI)
  
  return Math.abs(angle)
}

/**
 * Calculate release angle (trajectory)
 */
function calculateReleaseAngle(shoulder: KeyPoint, wrist: KeyPoint): number {
  const dx = wrist.x - shoulder.x
  const dy = shoulder.y - wrist.y // Inverted because y increases downward
  
  // Angle relative to horizontal
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  return Math.max(0, Math.min(90, angle))
}

// ============================================
// SHOOTING PHASE IDENTIFICATION
// ============================================

/**
 * Identify which phase of the shooting motion the player is in
 */
function identifyShootingPhase(
  keypoints: PoseDetectionResult['keypoints'],
  angles: PoseDetectionResult['angles']
): { phase: PoseDetectionResult['shootingPhase']; confidence: number } {
  // Determine which side to analyze
  const useLeftSide = 
    (keypoints.leftElbow.confidence + keypoints.leftWrist.confidence) >
    (keypoints.rightElbow.confidence + keypoints.rightWrist.confidence)

  const wrist = useLeftSide ? keypoints.leftWrist : keypoints.rightWrist
  const shoulder = useLeftSide ? keypoints.leftShoulder : keypoints.rightShoulder
  const knee = useLeftSide ? keypoints.leftKnee : keypoints.rightKnee

  // Phase detection logic based on biomechanics

  // RELEASE PHASE: Arms extended upward, ball above head
  if (wrist.y < shoulder.y - 5 && angles.elbowAngle > 150) {
    return { phase: 'release', confidence: 0.9 }
  }

  // FOLLOW-THROUGH: Arms still extended, wrist dropped
  if (wrist.y < shoulder.y && angles.elbowAngle > 160 && angles.wristAngle < 30) {
    return { phase: 'follow_through', confidence: 0.85 }
  }

  // RISE PHASE: Arms moving up, moderate elbow bend
  if (wrist.y < shoulder.y + 5 && angles.elbowAngle > 90 && angles.elbowAngle < 150) {
    return { phase: 'rise', confidence: 0.8 }
  }

  // DIP PHASE: Ball at chest level, knees bent
  if (wrist.y > shoulder.y && wrist.y < knee.y && angles.kneeAngle < 160) {
    return { phase: 'dip', confidence: 0.75 }
  }

  // STANCE: Ready position
  return { phase: 'stance', confidence: 0.7 }
}

/**
 * Detect which hand is the shooting hand
 */
function detectShootingHand(keypoints: PoseDetectionResult['keypoints']): 'left' | 'right' | 'unknown' {
  const leftConfidence = keypoints.leftWrist.confidence + keypoints.leftElbow.confidence
  const rightConfidence = keypoints.rightWrist.confidence + keypoints.rightElbow.confidence

  if (leftConfidence > rightConfidence && leftConfidence > 1.0) {
    return 'left'
  } else if (rightConfidence > leftConfidence && rightConfidence > 1.0) {
    return 'right'
  }

  return 'unknown'
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(keypoints: PoseDetectionResult['keypoints']): number {
  const allKeypoints = Object.values(keypoints)
  const totalConfidence = allKeypoints.reduce((sum, kp) => sum + kp.confidence, 0)
  const avgConfidence = totalConfidence / allKeypoints.length

  return Math.round(avgConfidence * 100) / 100
}

// ============================================
// BATCH PROCESSING
// ============================================

/**
 * Process multiple images for sequence analysis
 */
export async function detectPoseSequence(
  base64Images: string[]
): Promise<PoseDetectionResult[]> {
  const results: PoseDetectionResult[] = []

  for (const image of base64Images) {
    try {
      const result = await detectPose(image)
      results.push(result)
    } catch (error) {
      console.error('Error processing image in sequence:', error)
      // Continue with next image
    }
  }

  return results
}

/**
 * Analyze consistency across multiple shots
 */
export function analyzeConsistency(results: PoseDetectionResult[]): {
  consistencyScore: number
  varianceReport: Record<string, number>
} {
  if (results.length < 2) {
    return {
      consistencyScore: 100,
      varianceReport: {},
    }
  }

  // Calculate variance for each angle
  const angleKeys: (keyof PoseDetectionResult['angles'])[] = [
    'elbowAngle',
    'kneeAngle',
    'releaseAngle',
    'shoulderAngle',
  ]

  const variances: Record<string, number> = {}

  for (const key of angleKeys) {
    const values = results.map(r => r.angles[key])
    const variance = calculateVariance(values)
    variances[key] = variance
  }

  // Calculate overall consistency score (lower variance = higher consistency)
  const avgVariance = Object.values(variances).reduce((a, b) => a + b, 0) / Object.keys(variances).length
  const consistencyScore = Math.max(0, 100 - avgVariance)

  return {
    consistencyScore,
    varianceReport: variances,
  }
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length

  return Math.sqrt(variance) // Standard deviation
}
