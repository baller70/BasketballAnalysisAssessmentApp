"use client"

import { PlayerLockInGame } from "@/components/analysis/LockInOrSave/PlayerLockInGame"
import { useAnalysisStore } from "@/stores/analysisStore"

export default function PlayerPage() {
  const { visionAnalysisResult } = useAnalysisStore()
  
  // Get stats from analysis or use defaults
  const shootingStats = {
    release: visionAnalysisResult?.angles?.release_angle ? Math.round(visionAnalysisResult.angles.release_angle) : 67,
    form: visionAnalysisResult?.overall_score ? Math.round(visionAnalysisResult.overall_score * 0.9) : 73,
    balance: 80,
    arc: visionAnalysisResult?.angles?.arc_angle ? Math.round(visionAnalysisResult.angles.arc_angle) : 79,
    elbow: visionAnalysisResult?.angles?.right_elbow_angle ? Math.round(visionAnalysisResult.angles.right_elbow_angle) : 90,
    follow: 80,
    consist: 74,
    power: 78
  }

  return (
    <PlayerLockInGame 
      shootingStats={shootingStats}
      overallScore={visionAnalysisResult?.overall_score || 74}
      consistencyScore={74}
      formScore={73}
    />
  )
}


