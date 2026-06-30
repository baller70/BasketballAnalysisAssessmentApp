"use client"

import { useMemo } from "react"
import Link from "next/link"
import { AnalysisCardGame } from "@/components/analysis/AnalysisCardGame"
import { useAnalysisStore } from "@/stores/analysisStore"

export default function AnalysisPage() {
  const { visionAnalysisResult, formAnalysisResult, currentAnalysis, uploadedFile } = useAnalysisStore()

  // A real analysis exists only when the engine produced one this session.
  const hasAnalysis =
    !!(visionAnalysisResult?.success && visionAnalysisResult.angles) || !!formAnalysisResult

  // Read a measured angle from whichever real source has it (vision record or
  // the FormAnalysis angle array). Returns null when the engine never measured
  // it — we surface that honestly instead of substituting a fake constant.
  const getAngle = (...names: string[]): number | null => {
    const visionAngles = visionAnalysisResult?.angles
    if (visionAngles) {
      for (const n of names) {
        const v = visionAngles[n]
        if (typeof v === "number" && v > 0) return v
      }
    }
    if (formAnalysisResult?.angles) {
      for (const n of names) {
        const a = formAnalysisResult.angles.find((x) => x.name === n)
        if (a && typeof a.angle === "number" && a.angle > 0) return a.angle
      }
    }
    return null
  }

  // Real measurements from the analysis. Joint angles come straight from the
  // pose engine; release height / release angle / entry angle are only shown
  // when the engine actually reported them (0 = not measured, never faked).
  const measurements = useMemo(
    () => ({
      shoulderAngle: getAngle("shoulder_tilt", "left_shoulder_angle", "right_shoulder_angle", "Shoulder Angle") ?? 0,
      elbowAngle: getAngle("right_elbow_angle", "left_elbow_angle", "Elbow Angle") ?? 0,
      hipAngle: getAngle("hip_tilt", "left_hip_angle", "right_hip_angle") ?? 0,
      kneeAngle: getAngle("right_knee_angle", "left_knee_angle", "Knee Bend") ?? 0,
      ankleAngle: getAngle("left_ankle_angle", "right_ankle_angle") ?? 0,
      releaseHeight: getAngle("release_height", "releaseHeight", "Release Height") ?? 0,
      releaseAngle: getAngle("release_angle", "releaseAngle", "Release Angle") ?? 0,
      entryAngle: getAngle("entry_angle", "entryAngle", "Entry Angle") ?? 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visionAnalysisResult, formAnalysisResult]
  )

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

  // Empty state — no fabricated demo numbers when nothing has been analyzed.
  if (!hasAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🏀</span>
        </div>
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">No Analysis Yet</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">
          Upload a shot to see your biomechanical breakdown — release, angles, and form scores.
        </p>
        <Link
          href="/results/demo"
          className="mt-5 inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55300] text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors"
        >
          Upload a Shot
        </Link>
      </div>
    )
  }

  return <AnalysisCardGame measurements={measurements} sessionId={sessionId} />
}
