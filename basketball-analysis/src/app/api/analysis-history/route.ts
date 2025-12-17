import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/analysis-history
 * 
 * Retrieve user's analysis history for progress tracking.
 * Shows improvement trends over time.
 */

export async function GET(request: NextRequest) {
  const userProfileId = request.nextUrl.searchParams.get("userProfileId")
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20")
  const includeAnalysis = request.nextUrl.searchParams.get("includeAnalysis") === "true"

  if (!userProfileId) {
    return NextResponse.json(
      { success: false, error: "userProfileId parameter required" },
      { status: 400 }
    )
  }

  try {
    // Get history entries
    const history = await prisma.analysisHistory.findMany({
      where: { userProfileId },
      orderBy: { createdAt: "desc" },
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
      recordedAt: entry.recordedAt,
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
 * Manually add a history entry (for batch imports or corrections)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { userProfileId, analysisId, overallScore, ...optionalFields } = body

    if (!userProfileId || !analysisId || overallScore === undefined) {
      return NextResponse.json(
        { success: false, error: "userProfileId, analysisId, and overallScore are required" },
        { status: 400 }
      )
    }

    // Create history entry
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
 * Delete a history entry
 */
export async function DELETE(request: NextRequest) {
  const historyId = request.nextUrl.searchParams.get("id")

  if (!historyId) {
    return NextResponse.json(
      { success: false, error: "History ID required" },
      { status: 400 }
    )
  }

  try {
    await prisma.analysisHistory.delete({
      where: { id: historyId },
    })

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




