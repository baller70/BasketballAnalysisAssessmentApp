import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"

/**
 * GET /api/analysis-history
 *
 * Retrieve the signed-in user's analysis history for progress tracking.
 * Auth: the owning profile is derived from the session token, never from the
 * request, so a user can only ever read their own history (prevents IDOR).
 */

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20")
  const includeAnalysis = request.nextUrl.searchParams.get("includeAnalysis") === "true"

  try {
    // Get history entries (newest first)
    const history = await prisma.analysisHistory.findMany({
      where: { userProfileId },
      orderBy: { analysisDate: "desc" },
      take: limit,
      include: includeAnalysis ? {
        analysis: {
          select: {
            id: true,
            imageUrl: true,
            annotatedImageUrl: true,
            shootingPhase: true,
            strengths: true,
            improvements: true,
            coachingNotes: true,
          },
        },
      } : undefined,
    })

    if (history.length === 0) {
      return NextResponse.json({
        success: true,
        history: [],
        stats: null,
        message: "No analysis history found for this user",
      })
    }

    // Calculate statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scores = history.map((h: any) => Number(h.overallScore)).filter((s: number) => !isNaN(s))
    const stats = {
      totalAnalyses: history.length,
      averageScore: scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : null,
      highestScore: scores.length > 0 ? Math.max(...scores) : null,
      lowestScore: scores.length > 0 ? Math.min(...scores) : null,
      latestScore: scores[0] || null,
      overallTrend: calculateTrend(history),
      improvementRate: calculateImprovementRate(history),
    }

    // Format history entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedHistory = history.map((entry: any) => ({
      id: entry.id,
      analysisId: entry.analysisId,
      recordedAt: entry.analysisDate,
      scores: {
        overall: entry.overallScore ? Number(entry.overallScore) : null,
        form: entry.formScore ? Number(entry.formScore) : null,
        balance: entry.balanceScore ? Number(entry.balanceScore) : null,
        release: entry.releaseScore ? Number(entry.releaseScore) : null,
        consistency: entry.consistencyScore ? Number(entry.consistencyScore) : null,
      },
      angles: {
        elbow: entry.elbowAngle ? Number(entry.elbowAngle) : null,
        knee: entry.kneeAngle ? Number(entry.kneeAngle) : null,
        release: entry.releaseAngle ? Number(entry.releaseAngle) : null,
      },
      scoreChange: entry.scoreChange ? Number(entry.scoreChange) : null,
      improvementAreas: entry.improvementAreas,
      regressionAreas: entry.regressionAreas,
      analysis: includeAnalysis ? entry.analysis : undefined,
    }))

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      stats,
    })
  } catch (error) {
    console.error("Analysis history error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to retrieve history" },
      { status: 500 }
    )
  }
}

/**
 * Calculate overall trend (improving, declining, stable)
 */
function calculateTrend(history: { overallScore: unknown; scoreChange: unknown }[]): string {
  if (history.length < 2) return "insufficient_data"

  const recentChanges = history
    .slice(0, 5)
    .map(h => Number(h.scoreChange))
    .filter(c => !isNaN(c))

  if (recentChanges.length === 0) return "stable"

  const avgChange = recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length

  if (avgChange > 2) return "improving"
  if (avgChange < -2) return "declining"
  return "stable"
}

/**
 * Calculate improvement rate (% of sessions showing improvement)
 */
function calculateImprovementRate(history: { scoreChange: unknown }[]): number | null {
  const changes = history
    .map(h => Number(h.scoreChange))
    .filter(c => !isNaN(c))

  if (changes.length === 0) return null

  const improvements = changes.filter(c => c > 0).length
  return Math.round((improvements / changes.length) * 100)
}

/**
 * POST /api/analysis-history
 *
 * Manually add a history entry (for batch imports or corrections). The owning
 * profile is taken from the session, and the referenced analysis must belong to
 * the caller — a user can never write history against another user's analysis.
 */
export async function POST(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const body = await request.json()

    // userProfileId from the body is intentionally ignored; we trust the session.
    const { analysisId, overallScore, ...optionalFields } = body
    delete optionalFields.userProfileId

    if (!analysisId || overallScore === undefined) {
      return NextResponse.json(
        { success: false, error: "analysisId and overallScore are required" },
        { status: 400 }
      )
    }

    // Verify the referenced analysis belongs to the caller (prevents IDOR).
    const owned = await prisma.userAnalysis.findFirst({
      where: { id: analysisId, userProfileId },
      select: { id: true },
    })
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      )
    }

    const historyEntry = await prisma.analysisHistory.create({
      data: {
        userProfileId,
        analysisId,
        overallScore,
        ...optionalFields,
      },
    })

    return NextResponse.json({
      success: true,
      historyId: historyEntry.id,
    })
  } catch (error) {
    console.error("Create history error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create history entry" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/analysis-history?id=xxx
 *
 * Delete one of the caller's own history entries.
 */
export async function DELETE(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  const historyId = request.nextUrl.searchParams.get("id")

  if (!historyId) {
    return NextResponse.json(
      { success: false, error: "History ID required" },
      { status: 400 }
    )
  }

  try {
    // Scope the delete to the caller so they can't delete another user's row.
    const result = await prisma.analysisHistory.deleteMany({
      where: { id: historyId, userProfileId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "History entry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "History entry deleted",
    })
  } catch (error) {
    console.error("Delete history error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete history entry" },
      { status: 500 }
    )
  }
}
