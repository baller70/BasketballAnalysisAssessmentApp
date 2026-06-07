"use client"

import { useState } from "react"
import { ScoreOrPassGame } from "@/components/comparison/ScoreOrPass"
import { useAnalysisStore } from "@/stores/analysisStore"
import { Camera, Gamepad2 } from "lucide-react"

export default function ComparePage() {
  const [viewMode, setViewMode] = useState<'photo' | 'game'>('game')
  const { visionAnalysisResult, uploadedImageBase64 } = useAnalysisStore()

  // Get user analysis data for comparison
  const userAnalysisData = visionAnalysisResult?.angles ? {
    angles: {
      elbowAngle: visionAnalysisResult.angles.right_elbow_angle || visionAnalysisResult.angles.left_elbow_angle,
      kneeAngle: visionAnalysisResult.angles.right_knee_angle || visionAnalysisResult.angles.left_knee_angle,
      hipAngle: visionAnalysisResult.angles.hip_tilt,
      shoulderAngle: visionAnalysisResult.angles.shoulder_tilt || visionAnalysisResult.angles.left_shoulder_angle,
      releaseAngle: visionAnalysisResult.angles.release_angle,
      followThroughAngle: visionAnalysisResult.angles.follow_through_angle,
    },
    overallScore: visionAnalysisResult.overall_score
  } : undefined

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
        <button
          onClick={() => setViewMode('photo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'photo'
              ? 'bg-[#FF6B35] text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          Photo Compare
        </button>
        <button
          onClick={() => setViewMode('game')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'game'
              ? 'bg-[#FF6B35] text-white'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Score or Pass
        </button>
      </div>

      {/* Content */}
      {viewMode === 'photo' ? (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm text-center">
          <Camera className="w-12 h-12 text-[#FF6B35] mx-auto mb-4" />
          <h3 className="text-slate-900 font-bold text-lg mb-2">Photo Comparison</h3>
          <p className="text-slate-500 text-sm mb-4">
            Upload your shooting form image to compare with elite shooters
          </p>
          {uploadedImageBase64 ? (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-green-600 text-sm">✓ Image uploaded - comparison available</p>
            </div>
          ) : (
            <p className="text-slate-400 text-xs">No image uploaded yet</p>
          )}
        </div>
      ) : (
        <ScoreOrPassGame userAnalysis={userAnalysisData} />
      )}
    </div>
  )
}

