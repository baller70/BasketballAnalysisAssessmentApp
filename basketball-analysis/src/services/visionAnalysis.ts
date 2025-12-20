/**
 * @file visionAnalysis.ts
 * @description Vision AI service for basketball shooting pose detection and analysis
 * 
 * PURPOSE:
 * - Connects to the Python hybrid pose detection backend
 * - Sends images for pose detection (YOLOv8-pose + MediaPipe + OpenCV)
 * - Converts raw pose data to analysis results
 * - Provides health check for backend connectivity
 * 
 * MAIN FUNCTIONS:
 * - analyzeShootingForm(imageFile, ballPosition?) - Main analysis function
 * - checkHybridServerHealth() - Check if Python backend is running
 * 
 * BACKEND ENDPOINTS CALLED:
 * - POST {HYBRID_API_URL}/api/detect-pose - Pose detection
 * - POST {HYBRID_API_URL}/api/analyze-form - Form analysis
 * - GET {HYBRID_API_URL}/health - Health check
 * 
 * USED BY:
 * - src/app/page.tsx (handleImageAnalysis)
 * 
 * RETURNS:
 * - VisionAnalysisResult with keypoints, angles, score, and feedback
 * 
 * ENVIRONMENT:
 * - NEXT_PUBLIC_HYBRID_API_URL - Python backend URL (default: http://localhost:5001)
 */

import { fileToBase64 } from "@/lib/utils"

const HYBRID_API_URL = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'

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
 * Analyze shooting form using the hybrid backend
 */
export async function analyzeShootingForm(
  imageFile: File,
  ballPosition?: { x: number; y: number; confidence: number } | null
): Promise<VisionAnalysisResult> {
  try {
    const base64Image = await fileToBase64(imageFile)

    console.log('🎯 Calling hybrid pose detection...')
    const poseResponse = await fetch(`${HYBRID_API_URL}/api/detect-pose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image: base64Image,
        ball_hint: ballPosition
      })
    })

    if (!poseResponse.ok) {
      const errorText = await poseResponse.text()
      throw new Error(`Pose detection failed: ${errorText}`)
    }

    const poseResult = await poseResponse.json()

    if (!poseResult.success) {
      return {
        success: false,
        error: poseResult.error || 'Pose detection failed'
      }
    }

    console.log('✅ Pose detection complete:', {
      keypoints: Object.keys(poseResult.keypoints || {}).length,
      confidence: poseResult.confidence,
      basketball: poseResult.basketball ? 'detected' : 'not found'
    })

    // Call form analysis
    console.log('📊 Analyzing shooting form...')
    let analysisResult = { overall_score: 75, feedback: [] }
    
    try {
      const analysisResponse = await fetch(`${HYBRID_API_URL}/api/analyze-form`, {
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
      } else {
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
        coachingTip: improvements[0] || 'Keep practicing your form!',
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
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Cannot connect to image analysis server (port 5001). Run: python3 python-scraper/hybrid_pose_detection.py'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }
  }
}

/**
 * Check if the hybrid server is online
 */
export async function checkHybridServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${HYBRID_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
