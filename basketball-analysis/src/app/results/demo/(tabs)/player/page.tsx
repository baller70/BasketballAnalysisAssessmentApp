"use client"

import { useMemo } from "react"
import Link from "next/link"
import { PlayerLockInGame } from "@/components/analysis/LockInOrSave/PlayerLockInGame"
import { useAnalysisStore } from "@/stores/analysisStore"
import {
  scoreShootingForm,
  normalizeAngles,
  consistencyFromHistory,
} from "@/lib/scoring/biomechanicalScoring"

export default function PlayerPage() {
  const { visionAnalysisResult, formAnalysisResult, analysisHistory } = useAnalysisStore()

  const hasAnalysis =
    !!(visionAnalysisResult?.success && visionAnalysisResult.angles) || !!formAnalysisResult

  // Build one canonical angle record from whichever real source produced it,
  // then run the SAME biomechanical scorer the rest of the app uses. Joints the
  // engine didn't measure stay unmeasured (null) — never defaulted to a fake.
  const { stats, overall, consistencyScore, formScore } = useMemo(() => {
    const anglesRecord: Record<string, number> = {}
    if (visionAnalysisResult?.angles) Object.assign(anglesRecord, visionAnalysisResult.angles)
    if (formAnalysisResult?.angles) {
      for (const a of formAnalysisResult.angles) {
        if (a.name === "Elbow Angle" && anglesRecord.elbow == null) anglesRecord.elbow = a.angle
        else if (a.name === "Knee Bend" && anglesRecord.knee == null) anglesRecord.knee = a.angle
        else if (a.name === "Shoulder Angle" && anglesRecord.shoulder == null) anglesRecord.shoulder = a.angle
      }
    }

    const scores = scoreShootingForm(normalizeAngles(anglesRecord))
    const r = (v: number | null | undefined): number =>
      v == null ? 0 : Math.round(Math.max(0, Math.min(100, v)))

    const overallScore =
      visionAnalysisResult?.overall_score ??
      scores.overallScore ??
      formAnalysisResult?.overallScore ??
      0

    // Consistency is a property of the shot SEQUENCE — derived from real history
    // variance, falling back to this shot's score when there isn't enough history.
    const historyScores = (analysisHistory || [])
      .map((a) => a.overallScore)
      .filter((s): s is number => typeof s === "number")
    const consistency = consistencyFromHistory(historyScores)

    return {
      overall: r(overallScore),
      consistencyScore: r(consistency ?? overallScore),
      formScore: r(scores.formScore ?? overallScore),
      stats: {
        release: r(scores.releaseScore),
        form: r(scores.formScore ?? overallScore),
        balance: r(scores.balanceScore),
        arc: r(scores.perJoint.release ?? scores.releaseScore),
        elbow: r(scores.perJoint.elbow),
        follow: r(scores.perJoint.wrist ?? scores.releaseScore),
        consist: r(consistency ?? overallScore),
        power: r(scores.perJoint.knee),
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visionAnalysisResult, formAnalysisResult, analysisHistory])

  // Empty state — no fabricated 80/74/78 stat bars when nothing was analyzed.
  if (!hasAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🏀</span>
        </div>
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">No Player Card Yet</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">
          Upload a shot to generate your player card with real form, balance, and release ratings.
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

  return (
    <PlayerLockInGame
      shootingStats={stats}
      overallScore={overall}
      consistencyScore={consistencyScore}
      formScore={formScore}
    />
  )
}
