/**
 * Vision Analysis Service
 * Connects to the hybrid pose detection backend (YOLOv8-pose + MediaPipe + OpenCV)
 * via Next.js API routes that proxy to the Python backend
 */

interface BodyPosition {
  x: number  // 0-100 percentage
  y: number  // 0-100 percentage
  label: string
  angle?: number | null
  status?: "good" | "warning" | "critical"
  note?: string
}

export interface VisionAnalysisResult {
  success: boolean
  error?: string
  // Format expected by results page
  analysis?: {
    overallScore: number
    category: string
    bodyPositions: Record<string, BodyPosition>
    centerLine?: { x: number }
    phaseDetection?: { currentPhase: string }
    coachingTip?: string
    strengths?: string[]
    improvements?: string[]
    measurements?: Record<string, number>
  }
  // Raw hybrid data
  keypoints?: Record<string, { x: number; y: number; confidence: number; source?: string }>
  angles?: Record<string, number>
  basketball?: { x: number; y: number; radius: number }
  confidence?: number
  image_size?: { width: number; height: number }
  feedback?: Array<{ type: string; area: string; message: string }>
  overall_score?: number
}

/**
 * Convert hybrid keypoints to bodyPositions format for the results page
 */
function convertKeypointsToBodyPositions(
  keypoints: Record<string, { x: number; y: number; confidence: number; source?: string }>,
  angles: Record<string, number>,
  imageSize: { width: number; height: number },
  basketball?: { x: number; y: number; radius: number } | null
): Record<string, BodyPosition> {
  const positions: Record<string, BodyPosition> = {}
  
  // Convert each keypoint to percentage-based position
  Object.entries(keypoints).forEach(([name, kp]) => {
    if (kp.confidence < 0.3) return // Skip low confidence
    
    const xPercent = (kp.x / imageSize.width) * 100
    const yPercent = (kp.y / imageSize.height) * 100
    
    // Determine status based on angles
    let status: "good" | "warning" | "critical" = "good"
    let angle: number | null = null
    let note = ""
    
    // Map angle data to relevant keypoints
    if (name === 'left_elbow' || name === 'right_elbow') {
      const elbowAngle = angles[`${name.split('_')[0]}_elbow_angle`]
      if (elbowAngle) {
        angle = Math.round(elbowAngle)
        if (elbowAngle >= 80 && elbowAngle <= 100) {
          status = "good"
          note = "Good L-shape"
        } else if (elbowAngle >= 70 && elbowAngle <= 110) {
          status = "warning"
          note = "Adjust slightly"
        } else {
          status = "critical"
          note = elbowAngle < 70 ? "Too tight" : "Too flared"
        }
      }
    }
    
    if (name === 'left_knee' || name === 'right_knee') {
      const kneeAngle = angles[`${name.split('_')[0]}_knee_angle`]
      if (kneeAngle) {
        angle = Math.round(kneeAngle)
        if (kneeAngle < 150) {
          status = "good"
          note = "Good bend"
        } else if (kneeAngle > 170) {
          status = "warning"
          note = "Bend more"
        }
      }
    }
    
    // Format label
    const label = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    positions[name] = {
      x: xPercent,
      y: yPercent,
      label,
      angle,
      status,
      note: note || undefined
    }
  })
  
  // Add basketball position if detected
  if (basketball) {
    positions['ball'] = {
      x: (basketball.x / imageSize.width) * 100,
      y: (basketball.y / imageSize.height) * 100,
      label: 'Basketball',
      status: 'good'
    }
  }
  
  return positions
}

/**
 * Convert a File to base64 string (without data URL prefix)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze shooting form using the hybrid backend via Next.js API proxy
 */
export async function analyzeShootingForm(
  imageFile: File,
  ballPosition?: { x: number; y: number; confidence: number } | null
): Promise<VisionAnalysisResult> {
  try {
    const base64Image = await fileToBase64(imageFile)

    // Call pose detection via Next.js API proxy (which forwards to Python backend)
    console.log('🎯 Calling pose detection API...')
    
    const poseResponse = await fetch('/api/pose-detection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image: base64Image,
        ball_hint: ballPosition
      })
    })

    if (!poseResponse.ok) {
      const errorData = await poseResponse.json()
      throw new Error(errorData.error || `Pose detection failed: ${poseResponse.statusText}`)
    }

    const poseResult = await poseResponse.json()

    if (!poseResult.success) {
      throw new Error(poseResult.error || 'Pose detection failed')
    }

    console.log('✅ Pose detection complete:', {
      keypoints: Object.keys(poseResult.keypoints || {}).length,
      confidence: poseResult.confidence,
      basketball: poseResult.basketball ? 'detected' : 'not found',
      method: poseResult.method || 'hybrid'
    })

    // Call form analysis via Next.js API proxy
    console.log('📊 Analyzing shooting form...')
    let analysisResult = { 
      overall_score: 75, 
      feedback: []
    }
    
    try {
      const analysisResponse = await fetch('/api/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keypoints: poseResult.keypoints,
          angles: poseResult.angles
        })
      })
      
      if (analysisResponse.ok) {
        analysisResult = await analysisResponse.json()
      }
    } catch (e) {
      console.warn('Form analysis failed, using defaults:', e)
    }

    console.log('✅ Form analysis complete:', {
      score: analysisResult.overall_score,
      feedback: analysisResult.feedback?.length || 0
    })

    // Convert keypoints to bodyPositions format for the results page
    const bodyPositions = convertKeypointsToBodyPositions(
      poseResult.keypoints,
      poseResult.angles || {},
      poseResult.image_size,
      poseResult.basketball
    )

    // Determine form category
    const score = analysisResult.overall_score || 75
    let category = "GOOD"
    if (score >= 85) category = "EXCELLENT"
    else if (score >= 65) category = "GOOD"
    else if (score >= 50) category = "NEEDS_IMPROVEMENT"
    else category = "CRITICAL"

    // Extract strengths and improvements from feedback
    const strengths: string[] = []
    const improvements: string[] = []
    
    analysisResult.feedback?.forEach((fb: { type: string; message: string }) => {
      if (fb.type === 'success') {
        strengths.push(fb.message)
      } else if (fb.type === 'warning' || fb.type === 'error') {
        improvements.push(fb.message)
      }
    })

    // Build measurements from angles
    const measurements: Record<string, number> = {}
    if (poseResult.angles) {
      Object.entries(poseResult.angles).forEach(([key, value]) => {
        const cleanKey = key.replace(/_angle$/, '').replace(/^(left|right)_/, '')
        measurements[cleanKey + 'Angle'] = Math.round(value as number)
      })
    }

    return {
      success: true,
      analysis: {
        overallScore: score,
        category,
        bodyPositions,
        centerLine: poseResult.basketball ? { x: (poseResult.basketball.x / poseResult.image_size.width) * 100 } : undefined,
        phaseDetection: { currentPhase: 'RELEASE' },
        coachingTip: improvements[0] || strengths[0] || 'Keep practicing your form!',
        strengths,
        improvements,
        measurements
      },
      keypoints: poseResult.keypoints,
      angles: poseResult.angles,
      basketball: poseResult.basketball,
      confidence: poseResult.confidence,
      image_size: poseResult.image_size,
      feedback: analysisResult.feedback,
      overall_score: score
    }

  } catch (error) {
    console.error('Vision analysis error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Vision analysis failed. Please try again.'
    }
  }
}

/**
 * Check if the hybrid server is online
 */
export async function checkHybridServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/pose-detection', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
