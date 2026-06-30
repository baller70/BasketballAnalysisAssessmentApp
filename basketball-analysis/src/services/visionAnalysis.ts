/**
 * @file visionAnalysis.ts
 * @description Image shooting-form analysis — CANONICAL on-device path.
 *
 * PURPOSE:
 * - Runs the on-device TF.js MoveNet provider (services/pose) on an uploaded
 *   image entirely in the browser. No server round-trip.
 * - Converts canonical keypoints/angles into the result shape the results page,
 *   AutoScreenshots, and the flaw engine consume.
 * - All scoring comes from lib/scoring/biomechanicalScoring.ts via the provider.
 *
 * HISTORY:
 * - This used to POST to an external "hybrid" Hugging Face Space
 *   (NEXT_PUBLIC_HYBRID_API_URL) which is offline, and silently defaulted the
 *   score to 75 on failure. That fake-score behaviour is removed: when no pose
 *   can be detected we return success:false with a real error so the UI shows an
 *   empty/error state instead of an invented grade.
 *
 * MAIN FUNCTIONS:
 * - analyzeShootingForm(imageFile, ballPosition?, profileData?)
 * - checkHybridServerHealth() - now reports on-device engine readiness
 *
 * USED BY:
 * - src/app/results/demo/page.tsx (image upload handler)
 */

import {
  analyzeImageElement,
  fileToImageElement,
  keypointsToRecord,
  formAnglesToRecord,
} from '@/services/pose'

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
  // Raw provider data
  keypoints?: Record<string, { x: number; y: number; confidence: number; source?: string }>
  angles?: Record<string, number>
  basketball?: { x: number; y: number; radius: number }
  confidence?: number
  image_size?: { width: number; height: number }
  feedback?: Array<{ type: string; area: string; message: string }>
  overall_score?: number
}

/**
 * Convert keypoints to bodyPositions format for the results page.
 */
function convertKeypointsToBodyPositions(
  keypoints: Record<string, { x: number; y: number; confidence: number; source?: string }>,
  angles: Record<string, number>,
  imageSize: { width: number; height: number },
  basketball?: { x: number; y: number; radius: number } | null
): Record<string, BodyPosition> {
  const positions: Record<string, BodyPosition> = {}

  Object.entries(keypoints).forEach(([name, kp]) => {
    if (kp.confidence < 0.3) return // Skip low confidence

    const xPercent = (kp.x / imageSize.width) * 100
    const yPercent = (kp.y / imageSize.height) * 100

    let status: "good" | "warning" | "critical" = "good"
    let angle: number | null = null
    let note = ""

    if (name === 'left_elbow' || name === 'right_elbow') {
      const elbowAngle = angles[`${name.split('_')[0]}_elbow_angle`] ?? angles['elbow_angle']
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
      const kneeAngle = angles[`${name.split('_')[0]}_knee_angle`] ?? angles['knee_angle']
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
 * Analyze shooting form on-device using the canonical MoveNet provider.
 *
 * `ballPosition` is currently unused by the on-device engine (MoveNet does not
 * detect the ball) but is kept in the signature for callers and a future Pro
 * provider. `profileData` is reserved for personalized coaching.
 */
export async function analyzeShootingForm(
  imageFile: File,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept in signature for callers and a future Pro provider
  _ballPosition?: { x: number; y: number; confidence: number } | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for personalized coaching
  _profileData?: {
    heightInches?: number | null
    weightLbs?: number | null
    age?: number | null
    experienceLevel?: string | null
    dominantHand?: string | null
    shootingStyle?: string | null
  }
): Promise<VisionAnalysisResult> {
  try {
    const img = await fileToImageElement(imageFile)

    const { keypoints, form, imageSize } = await analyzeImageElement(img)

    // No person detected — surface a REAL empty state, never a fake score.
    if (!keypoints || !form || form.overallScore === null) {
      return {
        success: false,
        error:
          'No shooter detected in the image. Use a clear, full-body photo of the shooting motion and try again.'
      }
    }

    const keypointRecord = keypointsToRecord(keypoints)
    const angles = formAnglesToRecord(form)
    const score = form.overallScore

    let category = "GOOD"
    if (score >= 85) category = "EXCELLENT"
    else if (score >= 65) category = "GOOD"
    else if (score >= 50) category = "NEEDS_IMPROVEMENT"
    else category = "CRITICAL"

    const bodyPositions = convertKeypointsToBodyPositions(
      keypointRecord,
      angles,
      imageSize,
      null
    )

    // Build measurements (clean keys) from canonical angles.
    const measurements: Record<string, number> = {}
    const measurementMap: Record<string, number | null> = {
      elbowAngle: form.angles.elbow,
      kneeAngle: form.angles.knee,
      shoulderAngle: form.angles.shoulder,
      hipAngle: form.angles.hip,
      releaseAngle: form.angles.release,
      wristAngle: form.angles.wrist,
    }
    Object.entries(measurementMap).forEach(([key, value]) => {
      if (value !== null && !Number.isNaN(value)) measurements[key] = Math.round(value)
    })

    // Real feedback derived from measured form.
    const feedback: Array<{ type: string; area: string; message: string }> = form.tips.map(
      (message) => ({ type: 'improvement', area: 'form', message })
    )
    const strengths: string[] = []
    const improvements: string[] = [...form.tips]

    return {
      success: true,
      analysis: {
        overallScore: score,
        category,
        bodyPositions,
        phaseDetection: { currentPhase: 'RELEASE' },
        coachingTip: improvements[0] || 'Great form — keep it consistent!',
        strengths,
        improvements,
        measurements
      },
      keypoints: keypointRecord,
      angles,
      confidence: Math.round((form.measuredCount / 6) * 100) / 100,
      image_size: imageSize,
      feedback,
      overall_score: score
    }
  } catch (error) {
    console.error('Vision analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }
  }
}

/**
 * Report whether the on-device analysis engine is available. The canonical
 * engine runs in the browser, so this initializes MoveNet and returns true once
 * it is ready. (Name kept for backwards compatibility with existing callers.)
 */
export async function checkHybridServerHealth(): Promise<boolean> {
  try {
    const { getPoseProvider } = await import('@/services/pose')
    const provider = getPoseProvider()
    await provider.init()
    return provider.isReady()
  } catch {
    return false
  }
}
