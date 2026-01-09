"use client"

import { useMemo } from "react"
import { AnalysisCardGame } from "@/components/analysis/AnalysisCardGame"
import { useAnalysisStore } from "@/stores/analysisStore"

export default function AnalysisPage() {
  const { visionAnalysisResult, currentAnalysis, uploadedFile } = useAnalysisStore()
  
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
  
  // Generate a unique session ID based on analysis data
  // This ensures points are only earned once per unique analysis
  // The AnalysisCardGame component will generate a hash from measurements if no sessionId is provided
  const sessionId = useMemo(() => {
    if (currentAnalysis?.id) return currentAnalysis.id
    // Use uploaded file name as a stable identifier
    if (uploadedFile?.name) {
      return `analysis-${uploadedFile.name}-${uploadedFile.size}`.replace(/[^a-zA-Z0-9-]/g, '_')
    }
    // Let the component generate its own ID from measurements
    return undefined
  }, [currentAnalysis?.id, uploadedFile?.name, uploadedFile?.size])

  return <AnalysisCardGame measurements={measurements} sessionId={sessionId} />
}




