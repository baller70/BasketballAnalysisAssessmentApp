/**
 * Vision AI Analysis Service
 * Uses GPT-4 Vision to analyze basketball shooting form
 */

interface AnnotationItem {
  position?: string
  angle?: string
  alignment?: string
  status?: "good" | "warning" | "critical"
  [key: string]: string | undefined
}

interface DrillItem {
  name: string
  purpose?: string
  reps?: string
}

export interface BodyPosition {
  x: number
  y: number
  label: string
  angle?: number | null
  status?: "good" | "warning" | "critical"
  note?: string
}

export interface VisionAnalysisResult {
  success: boolean
  error?: string
  analysis?: {
    overallScore: number
    category: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL"
    measurements: {
      elbowAngle?: number
      kneeAngle?: number
      shoulderAngle?: number
      releaseAngle?: number
      hipAngle?: number
      ankleAngle?: number
      spineAngle?: number
      balance?: number
      followThrough?: number
    }
    annotations?: {
      ball?: AnnotationItem
      shootingHand?: AnnotationItem
      guideHand?: AnnotationItem
      shootingElbow?: AnnotationItem
      shootingShoulder?: AnnotationItem
      head?: AnnotationItem
      core?: AnnotationItem
      hips?: AnnotationItem
      knees?: AnnotationItem
      feet?: AnnotationItem
      ankles?: AnnotationItem
    }
    centerLineAnalysis?: {
      verticalAlignment?: string
      shoulderHipAlignment?: string
      balancePoint?: string
    }
    phaseDetection?: {
      currentPhase?: string
      phaseQuality?: string
    }
    bodyPositions?: Record<string, BodyPosition>
    centerLine?: {
      x: number
    }
    bodyAnalysis?: {
      head?: string
      shoulders?: string
      elbow?: string
      wrist?: string
      hips?: string
      knees?: string
      feet?: string
    }
    strengths: string[]
    criticalIssues?: string[]
    improvements: string[]
    drills: (string | DrillItem)[]
    coachingTip: string
    similarProPlayer?: string
    proComparison?: string
    rawAnalysis?: string
  }
}

/**
 * Analyze a basketball shooting image using Vision AI
 * @param imageFile - The image file to analyze
 * @param ballPosition - Optional: Roboflow-detected ball position to use as anchor
 */
export async function analyzeShootingForm(
  imageFile: File,
  ballPosition?: { x: number; y: number; confidence: number } | null
): Promise<VisionAnalysisResult> {
  const formData = new FormData()
  formData.append("image", imageFile)
  
  // Pass ball position if available (from Roboflow)
  if (ballPosition) {
    formData.append("ballPosition", JSON.stringify(ballPosition))
  }

  const response = await fetch("/api/analyze-vision", {
    method: "POST",
    body: formData,
  })

  const data = await response.json()
  return data
}

/**
 * Analyze from a blob URL (converts to File first)
 */
export async function analyzeFromUrl(imageUrl: string, filename = "image.jpg"): Promise<VisionAnalysisResult> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const file = new File([blob], filename, { type: blob.type })
    return analyzeShootingForm(file)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch image",
    }
  }
}

/**
 * Check if the Vision API is configured
 */
export async function checkVisionApiHealth(): Promise<boolean> {
  try {
    // Create a tiny test image (1x1 pixel)
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const blob = await new Promise<Blob>((resolve) => 
      canvas.toBlob((b) => resolve(b!), "image/png")
    )
    const file = new File([blob], "test.png", { type: "image/png" })
    
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch("/api/analyze-vision", {
      method: "POST",
      body: formData,
    })

    // If we get a 500 with "API key not configured", it's not healthy
    if (!response.ok) {
      const data = await response.json()
      return !data.error?.includes("API key")
    }
    
    return true
  } catch {
    return false
  }
}



