"use client"

import { AnalysisCardGame } from "@/components/analysis/AnalysisCardGame"
import { useAnalysisStore } from "@/stores/analysisStore"

export default function AnalysisPage() {
  const { visionAnalysisResult } = useAnalysisStore()
  
  // Get measurements from analysis or use defaults
  const measurements = {
    shoulderAngle: visionAnalysisResult?.angles?.shoulder_tilt || visionAnalysisResult?.angles?.left_shoulder_angle || 170,
    elbowAngle: visionAnalysisResult?.angles?.right_elbow_angle || visionAnalysisResult?.angles?.left_elbow_angle || 88,
    hipAngle: visionAnalysisResult?.angles?.hip_tilt || 175,
    kneeAngle: visionAnalysisResult?.angles?.right_knee_angle || visionAnalysisResult?.angles?.left_knee_angle || 140,
    ankleAngle: visionAnalysisResult?.angles?.left_ankle_angle || visionAnalysisResult?.angles?.right_ankle_angle || 85,
    releaseHeight: 108,
    releaseAngle: 48,
    entryAngle: 44,
  }

  return <AnalysisCardGame measurements={measurements} />
}



