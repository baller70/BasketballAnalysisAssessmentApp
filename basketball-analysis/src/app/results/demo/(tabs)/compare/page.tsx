"use client"

import { useEffect, useMemo, useState } from "react"
import { ScoreOrPassGame } from "@/components/comparison/ScoreOrPass"
import { PhotoCompare } from "@/components/comparison/PhotoCompare"
import { Phase6ComparisonPanel } from "@/components/comparison/Phase6ComparisonPanel"
import { useAnalysisStore } from "@/stores/analysisStore"
import {
  fetchShooterDataset,
  findTopMatches,
  type UserPhysicalProfile,
  type UserShootingMetrics,
} from "@/services/comparisonAlgorithm"
import type { ShooterProfile } from "@/data/shooterDatabase"
import { Camera, Gamepad2 } from "lucide-react"

// Parse "6'2", "6-2" or raw inches into total inches. Returns undefined if blank.
function parseHeightInches(height?: string): number | undefined {
  if (!height) return undefined
  const ftIn = height.match(/(\d+)['\-](\d+)/)
  if (ftIn) return parseInt(ftIn[1]) * 12 + parseInt(ftIn[2])
  const n = parseInt(height)
  return !isNaN(n) && n > 40 && n < 100 ? n : undefined
}

// PlayerProfile.skillLevel ("PROFESSIONAL") -> algorithm skill level ("ELITE").
function mapSkillLevel(
  level?: string
): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE" {
  switch (level) {
    case "BEGINNER":
      return "BEGINNER"
    case "ADVANCED":
      return "ADVANCED"
    case "PROFESSIONAL":
    case "ELITE":
      return "ELITE"
    default:
      return "INTERMEDIATE"
  }
}

export default function ComparePage() {
  const [viewMode, setViewMode] = useState<"photo" | "game">("photo")
  const {
    visionAnalysisResult,
    uploadedImageBase64,
    playerProfile,
    detectedKeypoints,
  } = useAnalysisStore()

  // Live, consolidated reference-shooter dataset (GET /api/shooters with a
  // bundled fallback). Shared by the match panel and the photo overlay so the
  // whole tab runs on ONE dataset.
  const [shooters, setShooters] = useState<ShooterProfile[] | null>(null)
  // Latest persisted analysis (fallback when the in-memory store is empty,
  // e.g. a returning user opens the compare tab directly).
  const [latest, setLatest] = useState<{
    angles?: Record<string, number | null>
    imageUrl?: string | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchShooterDataset().then((d) => {
      if (!cancelled) setShooters(d)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/analysis-history?limit=1&includeAnalysis=true", {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.success || !data.history?.length) return
        const h = data.history[0]
        setLatest({
          angles: h.angles,
          imageUrl: h.analysis?.annotatedImageUrl || h.analysis?.imageUrl || null,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // REAL measured shooting metrics from the latest on-device analysis.
  const userMetrics: UserShootingMetrics = useMemo(() => {
    const a = visionAnalysisResult?.angles
    if (a) {
      return {
        elbowAngle: a.right_elbow_angle ?? a.left_elbow_angle,
        kneeAngle: a.right_knee_angle ?? a.left_knee_angle,
        releaseAngle: a.release_angle,
        shoulderTilt: a.shoulder_tilt ?? a.left_shoulder_angle,
        hipTilt: a.hip_tilt,
        followThroughAngle: a.follow_through_angle,
      }
    }
    // Fallback to persisted history (elbow/knee/release only).
    if (latest?.angles) {
      return {
        elbowAngle: latest.angles.elbow ?? undefined,
        kneeAngle: latest.angles.knee ?? undefined,
        releaseAngle: latest.angles.release ?? undefined,
      }
    }
    return {}
  }, [visionAnalysisResult, latest])

  // Algorithm-shaped physical profile (drives matching + PhotoCompare reference).
  const physicalProfile: UserPhysicalProfile = useMemo(
    () => ({
      heightInches: parseHeightInches(playerProfile.height) ?? 72,
      weightLbs: playerProfile.weight ? parseInt(playerProfile.weight) : undefined,
      wingspanInches: parseHeightInches(playerProfile.wingspan),
      age: playerProfile.age ?? 25,
      skillLevel: mapSkillLevel(playerProfile.skillLevel),
    }),
    [playerProfile]
  )

  const hasMetrics = useMemo(
    () => Object.values(userMetrics).some((v) => typeof v === "number" && !isNaN(v)),
    [userMetrics]
  )

  // Top matched shooter -> reference image for the photo overlay.
  const topMatch = useMemo(() => {
    if (!shooters || !hasMetrics) return null
    return findTopMatches(physicalProfile, userMetrics, 1, shooters)[0] ?? null
  }, [shooters, hasMetrics, physicalProfile, userMetrics])

  const userImage = uploadedImageBase64 || latest?.imageUrl || null
  const referenceImage = topMatch?.shooter.imageUrl || null

  // Props for the consolidated match panel (string-shaped, real metrics).
  const panelProfile = useMemo(
    () => ({
      name: playerProfile.name,
      age: playerProfile.age,
      height: playerProfile.height,
      weight: playerProfile.weight ? parseInt(playerProfile.weight) : undefined,
      wingspan: playerProfile.wingspan,
      skillLevel: mapSkillLevel(playerProfile.skillLevel),
    }),
    [playerProfile]
  )

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
        <button
          onClick={() => setViewMode("photo")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === "photo"
              ? "bg-[#FF6B35] text-white"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Camera className="w-4 h-4" />
          Photo Compare
        </button>
        <button
          onClick={() => setViewMode("game")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            viewMode === "game"
              ? "bg-[#FF6B35] text-white"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Score or Pass
        </button>
      </div>

      {/* Content */}
      {viewMode === "photo" ? (
        <div className="space-y-6">
          <PhotoCompare
            beforeImage={userImage}
            afterImage={referenceImage}
            beforeLabel="You"
            afterLabel={topMatch?.shooter.name || "Reference"}
            beforeKeypoints={
              visionAnalysisResult?.keypoints ??
              (detectedKeypoints.length ? detectedKeypoints : null)
            }
          />

          {/* Consolidated match panel — ONE algorithm, REAL measured metrics,
              live /api/shooters dataset. */}
          <Phase6ComparisonPanel
            userProfile={panelProfile}
            userMetrics={userMetrics}
            overallScore={visionAnalysisResult?.overall_score ?? undefined}
            shooters={shooters ?? undefined}
          />
        </div>
      ) : (
        <ScoreOrPassGame
          userProfile={{
            height: physicalProfile.heightInches,
            weight: physicalProfile.weightLbs,
          }}
          userAnalysis={{
            imageUrl: userImage || undefined,
            angles: hasMetrics
              ? {
                  elbowAngle: userMetrics.elbowAngle,
                  kneeAngle: userMetrics.kneeAngle,
                  shoulderAngle: userMetrics.shoulderTilt,
                  hipAngle: userMetrics.hipTilt,
                  releaseAngle: userMetrics.releaseAngle,
                }
              : undefined,
            overallScore: visionAnalysisResult?.overall_score,
          }}
        />
      )}
    </div>
  )
}
