/**
 * Shooting Analysis API Service
 * Calls the Python backend for comprehensive pose and basketball detection
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface PoseKeypoint {
  x: number // Pixel X
  y: number // Pixel Y
  x_percent: number // X as percentage (0-100)
  y_percent: number // Y as percentage (0-100)
  visibility: number
}

export interface BasketballDetection {
  x: number
  y: number
  x_percent: number
  y_percent: number
  radius: number
  confidence: number
}

export interface HandPosition {
  x: number
  y: number
  x_percent: number
  y_percent: number
  confidence: number
  side: "left" | "right"
}

export interface ShootingAnalysisResult {
  success: boolean
  message: string
  image_width: number
  image_height: number
  pose_keypoints: Record<string, PoseKeypoint>
  pose_confidence: number
  basketball: BasketballDetection | null
  ball_in_hand: boolean
  shooting_hand: HandPosition | null
  guide_hand: HandPosition | null
  center_line_x: number
  center_line_x_percent: number
  shoulder_alignment: number
  hip_alignment: number
  is_shooting_pose: boolean
}

/**
 * Analyze an image for shooting form using the Python backend
 */
export async function analyzeShootingForm(
  imageFile: File | Blob
): Promise<ShootingAnalysisResult> {
  const formData = new FormData()
  formData.append("file", imageFile)

  const response = await fetch(`${API_BASE_URL}/shooting-analysis`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `Analysis failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Analyze an image from a URL
 */
export async function analyzeShootingFormFromUrl(
  imageUrl: string
): Promise<ShootingAnalysisResult> {
  // Fetch the image and convert to blob
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  
  const blob = await response.blob()
  return analyzeShootingForm(blob)
}

/**
 * Check if the backend is available
 */
export async function checkBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    })
    const data = await response.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}

/**
 * Convert percentage-based keypoints to pixel coordinates
 */
export function keypointsToPixels(
  keypoints: Record<string, PoseKeypoint>,
  imageWidth: number,
  imageHeight: number
): Record<string, { x: number; y: number; visibility: number }> {
  const result: Record<string, { x: number; y: number; visibility: number }> = {}
  
  for (const [name, kp] of Object.entries(keypoints)) {
    result[name] = {
      x: (kp.x_percent / 100) * imageWidth,
      y: (kp.y_percent / 100) * imageHeight,
      visibility: kp.visibility,
    }
  }
  
  return result
}

/**
 * Map backend keypoint names to our component's expected format
 */
export function mapKeypointsToBodyFormat(
  result: ShootingAnalysisResult
): Record<string, { x: number; y: number }> {
  const keypoints = result.pose_keypoints
  const mapped: Record<string, { x: number; y: number }> = {}
  
  // Map all available keypoints using percentages
  const mapping: Record<string, string> = {
    leftWrist: "left_wrist",
    rightWrist: "right_wrist",
    leftElbow: "left_elbow",
    rightElbow: "right_elbow",
    leftShoulder: "left_shoulder",
    rightShoulder: "right_shoulder",
    leftHip: "left_hip",
    rightHip: "right_hip",
    leftKnee: "left_knee",
    rightKnee: "right_knee",
    leftAnkle: "left_ankle",
    rightAnkle: "right_ankle",
    leftFoot: "left_foot_index",
    rightFoot: "right_foot_index",
    spine: "spine",
    core: "core",
  }
  
  for (const [ourName, backendName] of Object.entries(mapping)) {
    const kp = keypoints[backendName]
    if (kp && kp.visibility > 0.3) {
      mapped[ourName] = {
        x: kp.x_percent,
        y: kp.y_percent,
      }
    }
  }
  
  // Add basketball if detected
  if (result.basketball) {
    mapped.basketball = {
      x: result.basketball.x_percent,
      y: result.basketball.y_percent,
    }
  }
  
  // Add hand positions
  if (result.shooting_hand) {
    mapped.shootingHand = {
      x: result.shooting_hand.x_percent,
      y: result.shooting_hand.y_percent,
    }
  }
  
  if (result.guide_hand) {
    mapped.guideHand = {
      x: result.guide_hand.x_percent,
      y: result.guide_hand.y_percent,
    }
  }
  
  return mapped
}






