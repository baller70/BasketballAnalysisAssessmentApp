// Pose Detection Service
// This service handles pose detection and biomechanical analysis
// In production, this would integrate with MediaPipe Pose or similar

import { SkeletonData, Keypoint } from "@/components/analysis/SkeletonOverlay"

export interface PoseDetectionResult {
  skeleton: SkeletonData
  confidence: number
  timestamp: number
}

export interface BiomechanicalAnalysis {
  shoulderAngle: number  // SA - angle at shoulder joint
  elbowAngle: number     // EA - angle at elbow joint  
  hipAngle: number       // HA - angle at hip joint
  kneeAngle: number      // KA - angle at knee joint
  ankleAngle: number     // AA - angle at ankle joint
  releaseHeight: number  // RH - height of release point
  releaseAngle: number   // RA - angle of ball release
  entryAngle: number     // ENA - expected entry angle
}

export interface FormFlaw {
  id: string
  category: "ELBOW" | "SHOULDER" | "HIP" | "KNEE" | "ANKLE" | "RELEASE" | "FOLLOW_THROUGH"
  severity: "MINOR" | "MODERATE" | "SEVERE"
  title: string
  description: string
  correction: string
  drills: string[]
}

// Calculate angle between three points
function calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)
  let angle = Math.abs(radians * 180 / Math.PI)
  if (angle > 180) angle = 360 - angle
  return Math.round(angle)
}

// Analyze biomechanics from skeleton data
export function analyzeBiomechanics(skeleton: SkeletonData): BiomechanicalAnalysis {
  // Compute core if not present (midpoint between hips)
  const core: Keypoint = skeleton.core ?? {
    name: "core",
    x: (skeleton.leftHip.x + skeleton.rightHip.x) / 2,
    y: (skeleton.leftHip.y + skeleton.rightHip.y) / 2,
    confidence: Math.min(skeleton.leftHip.confidence, skeleton.rightHip.confidence)
  }
  // Calculate joint angles
  const shoulderAngle = calculateAngle(core, skeleton.rightShoulder, skeleton.rightElbow)
  const elbowAngle = calculateAngle(skeleton.rightShoulder, skeleton.rightElbow, skeleton.rightWrist)
  const hipAngle = calculateAngle(skeleton.rightShoulder, skeleton.rightHip, skeleton.rightKnee)
  const kneeAngle = calculateAngle(skeleton.rightHip, skeleton.rightKnee, skeleton.rightAnkle)
  const ankleAngle = 90 // Simplified - would need foot keypoint for accurate calculation

  // Calculate release metrics
  const releaseHeight = Math.round(100 + (100 - skeleton.rightWrist.y) * 0.3) // Estimated inches
  const releaseAngle = Math.round(45 + (skeleton.rightWrist.y - skeleton.rightElbow.y) * 0.5)
  const entryAngle = Math.round(releaseAngle - 5 + Math.random() * 10) // Approximation

  return {
    shoulderAngle,
    elbowAngle,
    hipAngle,
    kneeAngle,
    ankleAngle,
    releaseHeight,
    releaseAngle,
    entryAngle,
  }
}

// Detect form flaws based on biomechanical analysis
export function detectFlaws(analysis: BiomechanicalAnalysis): FormFlaw[] {
  const flaws: FormFlaw[] = []

  // Check elbow angle
  if (analysis.elbowAngle < 80 || analysis.elbowAngle > 100) {
    flaws.push({
      id: "elbow-alignment",
      category: "ELBOW",
      severity: analysis.elbowAngle < 70 || analysis.elbowAngle > 110 ? "SEVERE" : "MODERATE",
      title: "Elbow Alignment Issue",
      description: `Elbow angle at ${analysis.elbowAngle}°. Optimal is 85-95°.`,
      correction: "Focus on keeping your elbow directly under the ball and aligned with the basket.",
      drills: ["Wall elbow drill", "One-hand form shooting", "Elbow-in release practice"],
    })
  }

  // Check knee bend
  if (analysis.kneeAngle > 155 || analysis.kneeAngle < 125) {
    flaws.push({
      id: "knee-bend",
      category: "KNEE",
      severity: analysis.kneeAngle > 165 || analysis.kneeAngle < 115 ? "SEVERE" : "MINOR",
      title: "Knee Bend Depth",
      description: `Knee angle at ${analysis.kneeAngle}°. Optimal is 130-150° for power generation.`,
      correction: "Adjust knee bend to generate more power from your legs into the shot.",
      drills: ["Wall sits", "Jump squats", "Catch-and-shoot rhythm drills"],
    })
  }

  // Check release angle
  if (analysis.releaseAngle < 42 || analysis.releaseAngle > 58) {
    flaws.push({
      id: "release-angle",
      category: "RELEASE",
      severity: "MODERATE",
      title: "Release Angle Adjustment Needed",
      description: `Release angle at ${analysis.releaseAngle}°. Optimal is 45-55°.`,
      correction: "Adjust your follow-through to achieve optimal arc on your shot.",
      drills: ["Arc shooting over obstacle", "Target release point practice", "Swish-only shooting"],
    })
  }

  // Check hip alignment
  if (analysis.hipAngle < 160) {
    flaws.push({
      id: "hip-rotation",
      category: "HIP",
      severity: "MINOR",
      title: "Hip Alignment",
      description: `Hip angle at ${analysis.hipAngle}°. Consider squaring up more to the basket.`,
      correction: "Ensure hips are squared to the basket before initiating your shot.",
      drills: ["Mirror alignment practice", "Footwork drills", "Balance board shooting"],
    })
  }

  return flaws
}

// Calculate overall form score
export function calculateFormScore(analysis: BiomechanicalAnalysis, flaws: FormFlaw[]): number {
  let score = 100
  
  // Deduct based on flaw severity
  flaws.forEach((flaw) => {
    switch (flaw.severity) {
      case "SEVERE": score -= 15; break
      case "MODERATE": score -= 8; break
      case "MINOR": score -= 4; break
    }
  })

  // Bonus for optimal angles
  if (analysis.elbowAngle >= 85 && analysis.elbowAngle <= 95) score += 5
  if (analysis.releaseAngle >= 48 && analysis.releaseAngle <= 52) score += 5
  if (analysis.kneeAngle >= 135 && analysis.kneeAngle <= 145) score += 3

  return Math.max(0, Math.min(100, score))
}

