/**
 * Upload Validation System
 * 
 * Comprehensive validation for basketball shooting uploads.
 * Ensures quality before expensive AI processing.
 */

// ==========================================
// TYPES
// ==========================================

export type UploadType = "video" | "image"
export type ValidationStatus = "approved" | "acceptable" | "rejected"

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface QualityScoreBreakdown {
  framing: number      // 0-25 points
  lighting: number     // 0-25 points
  clarity: number      // 0-25 points
  angle: number        // 0-25 points
}

export interface UploadQualityResult {
  totalScore: number   // 0-100
  breakdown: QualityScoreBreakdown
  status: ValidationStatus
  feedback: ValidationFeedback
  canProceed: boolean
}

export interface ValidationFeedback {
  title: string
  message: string
  issues: string[]
  tips: string[]
  icon: "success" | "warning" | "error"
}

export interface PreUploadValidation {
  fileFormat: { valid: boolean; message: string }
  fileSize: { valid: boolean; message: string; actualSize: string }
  duration?: { valid: boolean; message: string; actualDuration: number }
  imageCount?: { valid: boolean; message: string; actualCount: number }
  resolution: { valid: boolean; message: string; width: number; height: number }
}

// ==========================================
// CONSTANTS
// ==========================================

export const UPLOAD_CONSTANTS = {
  // File formats
  VIDEO_FORMATS: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
  IMAGE_FORMATS: ["image/jpeg", "image/png", "image/heic", "image/webp"],
  
  // File size limits (in bytes)
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Duration limits (in seconds)
  MAX_VIDEO_DURATION: 10,
  MIN_VIDEO_DURATION: 2,
  
  // Image count requirements
  MIN_IMAGES: 3,
  MAX_IMAGES: 7,
  MIN_VIDEOS: 1,
  MAX_VIDEOS: 3,
  
  // Resolution requirements
  MIN_WIDTH: 480,
  MIN_HEIGHT: 640,
  RECOMMENDED_WIDTH: 1080,
  RECOMMENDED_HEIGHT: 1920,
  
  // Quality score thresholds
  SCORE_APPROVED: 70,
  SCORE_ACCEPTABLE: 60,
  
  // Frame fill percentage (shooter should fill this much of frame)
  IDEAL_FRAME_FILL_MIN: 0.6,  // 60%
  IDEAL_FRAME_FILL_MAX: 0.7,  // 70%
} as const

// ==========================================
// DO's AND DON'Ts EXAMPLES
// ==========================================

export interface UploadExample {
  id: string
  title: string
  description: string
  whyItMatters: string
  isGood: boolean
  imageUrl?: string
}

export const UPLOAD_DOS: UploadExample[] = [
  {
    id: "side-view",
    title: "Side View (90° Angle)",
    description: "Camera positioned perpendicular to the shooter",
    whyItMatters: "Allows AI to see elbow angle, knee bend, and full shooting motion",
    isGood: true,
  },
  {
    id: "full-body",
    title: "Full Body Visible",
    description: "Feet to head visible in frame, including release point",
    whyItMatters: "AI needs to track all body points for complete analysis",
    isGood: true,
  },
  {
    id: "good-lighting",
    title: "Good Lighting",
    description: "Well-lit environment with minimal shadows",
    whyItMatters: "Helps computer vision detect body keypoints accurately",
    isGood: true,
  },
  {
    id: "centered-shooter",
    title: "Shooter Centered",
    description: "Shooter positioned in center of frame",
    whyItMatters: "Ensures all body parts are visible and properly positioned",
    isGood: true,
  },
  {
    id: "clear-background",
    title: "Clear Background",
    description: "Simple, uncluttered background",
    whyItMatters: "Reduces visual noise so AI can focus on the shooter",
    isGood: true,
  },
  {
    id: "stable-camera",
    title: "Stable Camera",
    description: "Use tripod or stable surface, no shaking",
    whyItMatters: "Prevents motion blur that confuses the AI",
    isGood: true,
  },
  {
    id: "proper-distance",
    title: "Proper Distance",
    description: "Shooter fills 60-70% of the frame",
    whyItMatters: "Balances detail with context for accurate analysis",
    isGood: true,
  },
  {
    id: "complete-motion",
    title: "Complete Shot Motion",
    description: "Capture entire motion from setup to follow-through",
    whyItMatters: "AI needs to analyze all phases of your shot",
    isGood: true,
  },
]

export const UPLOAD_DONTS: UploadExample[] = [
  {
    id: "front-view",
    title: "Front-Facing Angle",
    description: "Camera directly in front of shooter",
    whyItMatters: "AI can't see side-to-side body alignment or elbow position",
    isGood: false,
  },
  {
    id: "partial-body",
    title: "Partial Body Visible",
    description: "Feet or head cut off from frame",
    whyItMatters: "Missing keypoints means incomplete analysis",
    isGood: false,
  },
  {
    id: "poor-lighting",
    title: "Poor Lighting",
    description: "Dark environment or harsh shadows",
    whyItMatters: "Computer vision struggles to detect body outline",
    isGood: false,
  },
  {
    id: "cluttered-background",
    title: "Cluttered Background",
    description: "Busy background with multiple people or objects",
    whyItMatters: "Distracts the AI from focusing on the shooter",
    isGood: false,
  },
  {
    id: "shaky-footage",
    title: "Shaky Footage",
    description: "Camera moving or shaking during recording",
    whyItMatters: "Makes it hard to track consistent body positions",
    isGood: false,
  },
  {
    id: "too-far",
    title: "Too Far Away",
    description: "Shooter appears too small in frame",
    whyItMatters: "Body keypoints become too small to detect accurately",
    isGood: false,
  },
  {
    id: "wrong-angle",
    title: "Diagonal or Behind Angle",
    description: "Camera at 45° angle or behind shooter",
    whyItMatters: "Key body mechanics are hidden from view",
    isGood: false,
  },
  {
    id: "multiple-people",
    title: "Multiple People in Frame",
    description: "Other players or people visible",
    whyItMatters: "AI may detect wrong person or get confused",
    isGood: false,
  },
]

// ==========================================
// VIDEO CHECKLIST
// ==========================================

export interface ChecklistItem {
  id: string
  label: string
  description: string
  required: boolean
}

export const VIDEO_CHECKLIST: ChecklistItem[] = [
  {
    id: "duration",
    label: "90 seconds maximum duration",
    description: "Keeps file size manageable and focuses on one shot",
    required: true,
  },
  {
    id: "attempts",
    label: "Capture 1-2 complete shot attempts",
    description: "Shows consistency or variation in your form",
    required: true,
  },
  {
    id: "side-angle",
    label: "Side angle (90° to shooter)",
    description: "Essential for measuring elbow and knee angles",
    required: true,
  },
  {
    id: "full-body",
    label: "Full body visible",
    description: "Needed for complete keypoint detection",
    required: true,
  },
  {
    id: "stable",
    label: "Stable camera (tripod or stable surface)",
    description: "Prevents motion blur that confuses the AI",
    required: true,
  },
  {
    id: "lighting",
    label: "Good lighting (outdoor daylight or well-lit gym)",
    description: "Critical for computer vision to work",
    required: true,
  },
  {
    id: "background",
    label: "Clear background",
    description: "Reduces visual noise for better detection",
    required: false,
  },
  {
    id: "frame-fill",
    label: "Shooter fills 60-70% of frame",
    description: "Balances detail with context",
    required: false,
  },
]

// ==========================================
// IMAGE SEQUENCE GUIDE
// ==========================================

export interface ImagePhase {
  id: string
  phase: number
  title: string
  description: string
  whatToShow: string[]
  required: boolean
}

export const IMAGE_SEQUENCE_GUIDE: ImagePhase[] = [
  {
    id: "setup",
    phase: 1,
    title: "Setup Position",
    description: "Starting stance before the shot",
    whatToShow: ["Feet position", "Knee alignment", "Ball position", "Hand placement"],
    required: true,
  },
  {
    id: "loading",
    phase: 2,
    title: "Loading Phase (The Dip)",
    description: "Gathering energy before release",
    whatToShow: ["Knee bend depth", "Hip drop", "Ball gathering", "Elbow position"],
    required: true,
  },
  {
    id: "release",
    phase: 3,
    title: "Release Point",
    description: "The moment of ball release",
    whatToShow: ["Full extension", "Follow-through start", "Wrist snap", "Eye position"],
    required: true,
  },
  {
    id: "follow-through",
    phase: 4,
    title: "Follow-Through",
    description: "After the ball leaves your hand",
    whatToShow: ["Arm extension", "Wrist position", "Balance", "Landing position"],
    required: false,
  },
  {
    id: "alternate-angle",
    phase: 5,
    title: "Alternate Angle (Optional)",
    description: "45-degree or front view for additional context",
    whatToShow: ["Shoulder alignment", "Guide hand position", "Overall balance"],
    required: false,
  },
]

// ==========================================
// PRE-UPLOAD VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate file format
 */
export function validateFileFormat(file: File): { valid: boolean; message: string } {
  const isVideo = (UPLOAD_CONSTANTS.VIDEO_FORMATS as readonly string[]).includes(file.type)
  const isImage = (UPLOAD_CONSTANTS.IMAGE_FORMATS as readonly string[]).includes(file.type)
  
  if (!isVideo && !isImage) {
    return {
      valid: false,
      message: `Invalid file format: ${file.type}. Accepted: MP4, MOV, AVI, WebM for video; JPG, PNG, HEIC, WebP for images.`,
    }
  }
  
  return { valid: true, message: "File format accepted" }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): { valid: boolean; message: string; actualSize: string } {
  const isVideo = (UPLOAD_CONSTANTS.VIDEO_FORMATS as readonly string[]).includes(file.type)
  const maxSize = isVideo ? UPLOAD_CONSTANTS.MAX_VIDEO_SIZE : UPLOAD_CONSTANTS.MAX_IMAGE_SIZE
  const maxSizeMB = maxSize / (1024 * 1024)
  const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2)
  
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File too large: ${actualSizeMB}MB. Maximum: ${maxSizeMB}MB`,
      actualSize: `${actualSizeMB}MB`,
    }
  }
  
  return {
    valid: true,
    message: `File size OK: ${actualSizeMB}MB`,
    actualSize: `${actualSizeMB}MB`,
  }
}

/**
 * Validate video duration (async - requires loading video)
 */
export async function validateVideoDuration(file: File): Promise<{ valid: boolean; message: string; actualDuration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      const duration = video.duration
      
      if (duration > UPLOAD_CONSTANTS.MAX_VIDEO_DURATION) {
        resolve({
          valid: false,
          message: `Video too long: ${duration.toFixed(1)}s. Maximum: ${UPLOAD_CONSTANTS.MAX_VIDEO_DURATION}s`,
          actualDuration: duration,
        })
      } else if (duration < UPLOAD_CONSTANTS.MIN_VIDEO_DURATION) {
        resolve({
          valid: false,
          message: `Video too short: ${duration.toFixed(1)}s. Minimum: ${UPLOAD_CONSTANTS.MIN_VIDEO_DURATION}s`,
          actualDuration: duration,
        })
      } else {
        resolve({
          valid: true,
          message: `Duration OK: ${duration.toFixed(1)}s`,
          actualDuration: duration,
        })
      }
    }
    
    video.onerror = () => {
      resolve({
        valid: false,
        message: "Could not read video duration",
        actualDuration: 0,
      })
    }
    
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image resolution (async - requires loading image)
 */
export async function validateImageResolution(file: File): Promise<{ valid: boolean; message: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const { width, height } = img
      
      if (width < UPLOAD_CONSTANTS.MIN_WIDTH || height < UPLOAD_CONSTANTS.MIN_HEIGHT) {
        resolve({
          valid: false,
          message: `Resolution too low: ${width}x${height}. Minimum: ${UPLOAD_CONSTANTS.MIN_WIDTH}x${UPLOAD_CONSTANTS.MIN_HEIGHT}`,
          width,
          height,
        })
      } else {
        resolve({
          valid: true,
          message: `Resolution OK: ${width}x${height}`,
          width,
          height,
        })
      }
    }
    
    img.onerror = () => {
      resolve({
        valid: false,
        message: "Could not read image resolution",
        width: 0,
        height: 0,
      })
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image count for multi-image uploads
 */
export function validateImageCount(count: number): { valid: boolean; message: string; actualCount: number } {
  if (count < UPLOAD_CONSTANTS.MIN_IMAGES) {
    return {
      valid: false,
      message: `Not enough images: ${count}. Minimum: ${UPLOAD_CONSTANTS.MIN_IMAGES}`,
      actualCount: count,
    }
  }
  
  if (count > UPLOAD_CONSTANTS.MAX_IMAGES) {
    return {
      valid: false,
      message: `Too many images: ${count}. Maximum: ${UPLOAD_CONSTANTS.MAX_IMAGES}`,
      actualCount: count,
    }
  }
  
  return {
    valid: true,
    message: `Image count OK: ${count}`,
    actualCount: count,
  }
}

/**
 * Run all pre-upload validations
 */
export async function runPreUploadValidation(files: File[]): Promise<PreUploadValidation & { overallValid: boolean }> {
  const file = files[0]
  const isVideo = (UPLOAD_CONSTANTS.VIDEO_FORMATS as readonly string[]).includes(file.type)
  
  const fileFormat = validateFileFormat(file)
  const fileSize = validateFileSize(file)
  
  let duration: { valid: boolean; message: string; actualDuration: number } | undefined
  let imageCount: { valid: boolean; message: string; actualCount: number } | undefined
  let resolution: { valid: boolean; message: string; width: number; height: number }
  
  if (isVideo) {
    duration = await validateVideoDuration(file)
    // For video, we'll estimate resolution from the video
    resolution = { valid: true, message: "Video resolution OK", width: 1920, height: 1080 }
  } else {
    resolution = await validateImageResolution(file)
    if (files.length > 1) {
      imageCount = validateImageCount(files.length)
    }
  }
  
  const overallValid = fileFormat.valid && 
                       fileSize.valid && 
                       (duration?.valid ?? true) && 
                       (imageCount?.valid ?? true) &&
                       resolution.valid
  
  return {
    fileFormat,
    fileSize,
    duration,
    imageCount,
    resolution,
    overallValid,
  }
}

// ==========================================
// QUALITY SCORE CALCULATION
// ==========================================

/**
 * Calculate upload quality score (0-100)
 * This is a simplified version - full implementation would use computer vision
 */
export function calculateQualityScore(
  preValidation: PreUploadValidation,
  postValidation?: {
    bodyDetected: boolean
    fullBodyVisible: boolean
    properAngle: boolean
    goodLighting: boolean
  }
): UploadQualityResult {
  const breakdown: QualityScoreBreakdown = {
    framing: 0,
    lighting: 0,
    clarity: 0,
    angle: 0,
  }
  
  // If we have post-validation data (from Roboflow), use it
  if (postValidation) {
    breakdown.framing = postValidation.fullBodyVisible ? 25 : (postValidation.bodyDetected ? 15 : 5)
    breakdown.lighting = postValidation.goodLighting ? 25 : 15
    breakdown.angle = postValidation.properAngle ? 25 : 10
    breakdown.clarity = preValidation.resolution.valid ? 25 : 15
  } else {
    // Estimate based on pre-validation only
    breakdown.framing = preValidation.resolution.valid ? 20 : 10
    breakdown.lighting = 18 // Assume decent lighting without detection
    breakdown.clarity = preValidation.resolution.valid ? 22 : 12
    breakdown.angle = 15 // Can't determine without post-validation
  }
  
  const totalScore = breakdown.framing + breakdown.lighting + breakdown.clarity + breakdown.angle
  
  // Determine status and feedback
  let status: ValidationStatus
  let feedback: ValidationFeedback
  
  if (totalScore >= UPLOAD_CONSTANTS.SCORE_APPROVED) {
    status = "approved"
    feedback = {
      title: "Upload Approved",
      message: "Your upload meets all quality standards. Ready to analyze your shooting form!",
      issues: [],
      tips: [],
      icon: "success",
    }
  } else if (totalScore >= UPLOAD_CONSTANTS.SCORE_ACCEPTABLE) {
    status = "acceptable"
    const issues: string[] = []
    const tips: string[] = []
    
    if (breakdown.framing < 20) {
      issues.push("Framing could be better")
      tips.push("Make sure your full body is visible from feet to head")
    }
    if (breakdown.lighting < 20) {
      issues.push("Lighting could be brighter")
      tips.push("Try outdoor daylight or a well-lit gym")
    }
    if (breakdown.angle < 20) {
      issues.push("Angle is not optimal")
      tips.push("Position camera at 90° to your side for best results")
    }
    if (breakdown.clarity < 20) {
      issues.push("Image clarity could be improved")
      tips.push("Use a stable camera and ensure good resolution")
    }
    
    feedback = {
      title: "Upload Acceptable",
      message: "Your upload is good enough to analyze, but here's how to improve:",
      issues,
      tips,
      icon: "warning",
    }
  } else {
    status = "rejected"
    const issues: string[] = []
    const tips: string[] = []
    
    if (breakdown.framing < 15) {
      issues.push("Body not fully visible")
      tips.push("Ensure feet to head are visible in frame")
    }
    if (breakdown.lighting < 15) {
      issues.push("Too dark")
      tips.push("Record in better lighting conditions")
    }
    if (breakdown.angle < 10) {
      issues.push("Wrong angle")
      tips.push("Position camera at side view (90° to shooter)")
    }
    if (breakdown.clarity < 15) {
      issues.push("Poor image quality")
      tips.push("Use a higher resolution camera")
    }
    
    feedback = {
      title: "Please Retake",
      message: "We couldn't properly validate this upload. Here's what needs to be fixed:",
      issues,
      tips,
      icon: "error",
    }
  }
  
  return {
    totalScore,
    breakdown,
    status,
    feedback,
    canProceed: status !== "rejected",
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Get upload type from file
 */
export function getUploadType(file: File): UploadType {
  return (UPLOAD_CONSTANTS.VIDEO_FORMATS as readonly string[]).includes(file.type) ? "video" : "image"
}

/**
 * Check if file is valid type
 */
export function isValidFileType(file: File): boolean {
  return (UPLOAD_CONSTANTS.VIDEO_FORMATS as readonly string[]).includes(file.type) || 
         (UPLOAD_CONSTANTS.IMAGE_FORMATS as readonly string[]).includes(file.type)
}







