import { NextRequest, NextResponse } from "next/server"
import { ALL_ELITE_SHOOTERS } from "@/data/eliteShooters"
import {
  normalizeApiShooters,
  runFullComparison,
  type UserPhysicalProfile,
  type UserShootingMetrics,
} from "@/services/comparisonAlgorithm"

/**
 * POST /api/compare-shooters
 *
 * CONSOLIDATED. This route used to carry its OWN embedded 10-player dataset and
 * its OWN bespoke similarity scoring — a third, divergent implementation of the
 * comparison feature. It now delegates to the single shared algorithm
 * (`@/services/comparisonAlgorithm`) running over the SAME elite catalog that
 * GET /api/shooters serves (`ALL_ELITE_SHOOTERS`), so every surface of the app
 * ranks shooters identically. The hand-rolled PROFESSIONAL_SHOOTERS list and
 * calculateSimilarityScore() have been removed.
 *
 * This is a pure read/compute endpoint (no DB writes, no session): kept for the
 * mobile/legacy clients in services/mobileApi.ts.
 */

// Reference dataset = the elite catalog, normalized into the algorithm's shape.
// (Same source GET /api/shooters reads from; that route additionally layers in
// per-shooter DB biomechanics overrides — see remainingIssues.)
const REFERENCE_SHOOTERS = normalizeApiShooters(ALL_ELITE_SHOOTERS)

interface UserProfileInput {
  height?: number // inches
  weight?: number // lbs
  wingspan?: number // inches
  age?: number
  experienceLevel?: string
}

interface UserMetricsInput {
  elbowAngle?: number
  kneeAngle?: number
  releaseAngle?: number
  shoulderTilt?: number
  hipTilt?: number
  followThroughAngle?: number
  wristAngle?: number
}

interface CompareRequest {
  userProfile?: UserProfileInput
  userMetrics?: UserMetricsInput
  limit?: number
}

function mapSkillLevel(
  level?: string
): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE" {
  switch ((level || "").toUpperCase()) {
    case "BEGINNER":
      return "BEGINNER"
    case "ADVANCED":
      return "ADVANCED"
    case "ELITE":
    case "PROFESSIONAL":
    case "PRO":
      return "ELITE"
    default:
      return "INTERMEDIATE"
  }
}

const fmtHeight = (inches: number) =>
  `${Math.floor(inches / 12)}'${inches % 12}"`

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json().catch(() => ({}))
    const { userProfile = {}, userMetrics = {}, limit = 5 } = body

    const profile: UserPhysicalProfile = {
      heightInches: Number(userProfile.height) || 72,
      weightLbs: userProfile.weight ? Number(userProfile.weight) : undefined,
      wingspanInches: userProfile.wingspan ? Number(userProfile.wingspan) : undefined,
      age: Number(userProfile.age) || 25,
      skillLevel: mapSkillLevel(userProfile.experienceLevel),
    }

    const metrics: UserShootingMetrics = {
      elbowAngle: userMetrics.elbowAngle,
      kneeAngle: userMetrics.kneeAngle,
      releaseAngle: userMetrics.releaseAngle,
      shoulderTilt: userMetrics.shoulderTilt,
      hipTilt: userMetrics.hipTilt,
      followThroughAngle: userMetrics.followThroughAngle,
    }

    const result = runFullComparison(profile, metrics, REFERENCE_SHOOTERS)
    const topMatches = result.topMatches.slice(0, Math.max(1, Math.min(limit, 10)))

    const comparisons = topMatches.map(({ shooter, similarityScore, matchReasons, rank }) => ({
      id: shooter.id,
      rank,
      name: shooter.name,
      team: shooter.team,
      position: shooter.position,
      similarity: similarityScore.overall,
      similarityBreakdown: similarityScore,
      physicalMatch: {
        height: fmtHeight(shooter.heightInches),
        wingspan: fmtHeight(shooter.wingspanInches),
        weight: shooter.weightLbs,
        bodyBuild: shooter.bodyBuild,
      },
      shootingMetrics: shooter.shootingMetrics,
      traits: shooter.traits,
      imageUrl: shooter.imageUrl,
      matchReasons,
    }))

    return NextResponse.json({
      success: true,
      source: "comparisonAlgorithm",
      comparisons,
      optimalMechanics: result.optimalMechanics,
      recommendations: result.personalizedRecommendations,
    })
  } catch (error) {
    console.error("Compare shooters error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Comparison failed" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/compare-shooters
 *
 * Deprecated catalog listing. Prefer GET /api/shooters (the single source of
 * truth). Returned here (from the same elite catalog) only for backward compat.
 */
export async function GET() {
  const shooters = REFERENCE_SHOOTERS.map((s) => ({
    id: s.id,
    name: s.name,
    team: s.team,
    position: s.position,
    height: fmtHeight(s.heightInches),
    bodyBuild: s.bodyBuild,
    skillLevel: s.skillLevel,
    imageUrl: s.imageUrl,
  }))

  return NextResponse.json({
    success: true,
    deprecated: true,
    preferred: "/api/shooters",
    count: shooters.length,
    shooters,
  })
}
