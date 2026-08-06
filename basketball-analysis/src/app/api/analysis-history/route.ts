import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"
import { resolveShot } from "@/lib/shots/resolveShot"

class HistoryValidationError extends Error {}

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

  const requestedLimit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(1000, Math.max(1, requestedLimit)) : 20
  const includeAnalysis = request.nextUrl.searchParams.get("includeAnalysis") === "true"

  try {
    // Get history entries (newest first)
    const history = await prisma.analysisHistory.findMany({
      where: { userProfileId },
      orderBy: { analysisDate: "desc" },
      take: limit,
      include: {
        analysis: {
          select: {
            id: true,
            clientSessionId: true,
            mediaType: true,
            captureSessionId: true,
            ...(includeAnalysis ? {
              imageUrl: true,
              annotatedImageUrl: true,
              videoUrl: true,
              videoS3Path: true,
              shootingPhase: true,
              strengths: true,
              improvements: true,
              coachingNotes: true,
            } : {}),
          },
        },
      },
    })

    if (history.length === 0) {
      return NextResponse.json({
        success: true,
        history: [],
        stats: null,
        message: "No analysis history found for this user",
      })
    }

    // Shot counts live on ShotEvent, keyed by the capture session an analysis
    // was produced from — they were simply never projected here, which is why
    // every MAKE % and SHOTS / MAKES readout on 093 rendered as an em-dash.
    const tally = await shotTally(
      userProfileId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history.map((h: any) => h.analysis?.captureSessionId).filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
    )

    // Calculate statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    /* NULL MUST BE DROPPED BEFORE Number(), NOT AFTER.
       `Number(null)` is 0, not NaN, so an unscored session — which this table
       can now hold — would have survived an `!isNaN` filter as a ZERO and
       dragged the average down while setting lowestScore to 0. The null check
       has to come first. */
    const scores = history
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((h: any) => h.overallScore != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((h: any) => Number(h.overallScore))
      .filter((s: number) => Number.isFinite(s))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const counted = history.map((h: any) => tally.get(h.analysis?.captureSessionId ?? "")).filter(Boolean) as { shots: number; makes: number }[]
    const totalShots = counted.reduce((a, c) => a + c.shots, 0)
    const totalMakes = counted.reduce((a, c) => a + c.makes, 0)
    const stats = {
      totalAnalyses: history.length,
      averageScore: scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : null,
      highestScore: scores.length > 0 ? Math.max(...scores) : null,
      lowestScore: scores.length > 0 ? Math.min(...scores) : null,
      latestScore: scores[0] ?? null,
      overallTrend: calculateTrend(history),
      improvementRate: calculateImprovementRate(history),
      // Null rather than zero when nothing in the range has a capture behind
      // it, so the UI can say "—" instead of claiming the user took no shots.
      totalShots: counted.length ? totalShots : null,
      totalMakes: counted.length ? totalMakes : null,
      makePct: counted.length && totalShots > 0
        ? Math.round((totalMakes / totalShots) * 1000) / 10
        : null,
    }

    // Format history entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedHistory = history.map((entry: any) => ({
      id: entry.id,
      analysisId: entry.analysisId,
      clientSessionId: entry.analysis?.clientSessionId ?? null,
      mediaType: entry.analysis?.mediaType ?? null,
      captureSessionId: entry.analysis?.captureSessionId ?? null,
      shots: tally.get(entry.analysis?.captureSessionId ?? "")?.shots ?? null,
      makes: tally.get(entry.analysis?.captureSessionId ?? "")?.makes ?? null,
      recordedAt: entry.analysisDate,
      scores: {
        overall: entry.overallScore != null ? Number(entry.overallScore) : null,
        form: entry.formScore != null ? Number(entry.formScore) : null,
        balance: entry.balanceScore != null ? Number(entry.balanceScore) : null,
        release: entry.releaseScore != null ? Number(entry.releaseScore) : null,
        consistency: entry.consistencyScore != null ? Number(entry.consistencyScore) : null,
      },
      angles: {
        elbow: entry.elbowAngle != null ? Number(entry.elbowAngle) : null,
        knee: entry.kneeAngle != null ? Number(entry.kneeAngle) : null,
        release: entry.releaseAngle != null ? Number(entry.releaseAngle) : null,
      },
      scoreChange: entry.scoreChange != null ? Number(entry.scoreChange) : null,
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
 * Attempts and makes per capture session, from the detector's ShotEvent rows.
 *
 * `ShotEventCorrection` is append-only human review, so it wins over the
 * detector: a `false_shot` correction drops the attempt entirely and a
 * `make_miss` correction replaces `detectedResult`. Only the caller's own rows
 * are read (the profile comes from the session), so this cannot leak another
 * user's session counts.
 */
async function shotTally(userProfileId: string, captureSessionIds: string[]) {
  const tally = new Map<string, { shots: number; makes: number }>()
  const ids = Array.from(new Set(captureSessionIds))
  if (ids.length === 0) return tally

  const events = await prisma.shotEvent.findMany({
    where: { userProfileId, captureSessionId: { in: ids } },
    select: {
      captureSessionId: true,
      detected: true,
      detectedResult: true,
      corrections: {
        where: { kind: { in: ["false_shot", "make_miss"] } },
        orderBy: { createdAt: "asc" },
        select: { kind: true, value: true },
      },
    },
  })

  for (const id of ids) tally.set(id, { shots: 0, makes: 0 })
  for (const event of events) {
    const bucket = tally.get(event.captureSessionId ?? "")
    if (!bucket) continue

    // Same resolver the shot-context panel reads, so a shot cannot count as a
    // make here and read as a miss there.
    const { dropped, result } = resolveShot(event)
    if (dropped) continue
    bucket.shots += 1
    if (result === "make") bucket.makes += 1
  }

  // A capture session that produced no usable attempt has nothing to report;
  // drop it so the UI shows "—" rather than a fabricated 0 / 0.
  for (const [id, bucket] of tally) if (bucket.shots === 0) tally.delete(id)
  return tally
}

/**
 * Calculate overall trend (improving, declining, stable)
 */
function calculateTrend(history: { overallScore: unknown; scoreChange: unknown }[]): string {
  if (history.length < 2) return "insufficient_data"

  const recentChanges = history
    .slice(0, 5)
    .filter(h => h.scoreChange != null)
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
    .filter(h => h.scoreChange != null)
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
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const body = await request.json()

    // Only an explicit whitelist is accepted. In particular, userProfileId,
    // id, and relation fields can never be mass-assigned from the client.
    const analysisId = typeof body.analysisId === "string" && body.analysisId.length <= 191
      ? body.analysisId.trim()
      : ""
    const overallScore = finiteMetric(body.overallScore, "overallScore", 0, 100, true)

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

    const analysisDate = body.analysisDate == null ? new Date() : new Date(body.analysisDate)
    if (Number.isNaN(analysisDate.getTime())) {
      return NextResponse.json({ success: false, error: "analysisDate is invalid" }, { status: 400 })
    }

    const historyEntry = await prisma.$transaction(async (tx) => {
      // Cast PostgreSQL's `void` lock result so Prisma can deserialize the raw
      // query without P2010 while the transaction lock remains in effect.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userProfileId}))::text AS lock_result`
      const entry = await tx.analysisHistory.upsert({
        where: { analysisId },
        create: {
          userProfileId,
          analysisId,
          analysisDate,
          overallScore: overallScore as number,
          formScore: finiteMetric(body.formScore, "formScore", 0, 100),
          balanceScore: finiteMetric(body.balanceScore, "balanceScore", 0, 100),
          releaseScore: finiteMetric(body.releaseScore, "releaseScore", 0, 100),
          consistencyScore: finiteMetric(body.consistencyScore, "consistencyScore", 0, 100),
          elbowAngle: finiteMetric(body.elbowAngle, "elbowAngle", -360, 360),
          kneeAngle: finiteMetric(body.kneeAngle, "kneeAngle", -360, 360),
          releaseAngle: finiteMetric(body.releaseAngle, "releaseAngle", -360, 360),
          improvementAreas: jsonField(body.improvementAreas),
          regressionAreas: jsonField(body.regressionAreas),
          progressNotes: optionalText(body.progressNotes, 20_000),
          milestonesAchieved: jsonField(body.milestonesAchieved),
        },
        update: {
          analysisDate,
          overallScore: overallScore as number,
          formScore: finiteMetric(body.formScore, "formScore", 0, 100),
          balanceScore: finiteMetric(body.balanceScore, "balanceScore", 0, 100),
          releaseScore: finiteMetric(body.releaseScore, "releaseScore", 0, 100),
          consistencyScore: finiteMetric(body.consistencyScore, "consistencyScore", 0, 100),
          elbowAngle: finiteMetric(body.elbowAngle, "elbowAngle", -360, 360),
          kneeAngle: finiteMetric(body.kneeAngle, "kneeAngle", -360, 360),
          releaseAngle: finiteMetric(body.releaseAngle, "releaseAngle", -360, 360),
          improvementAreas: jsonField(body.improvementAreas),
          regressionAreas: jsonField(body.regressionAreas),
          progressNotes: optionalText(body.progressNotes, 20_000),
          milestonesAchieved: jsonField(body.milestonesAchieved),
        },
      })

      const chronological = await tx.analysisHistory.findMany({
        where: { userProfileId },
        orderBy: [{ analysisDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: { id: true, overallScore: true, scoreChange: true },
      })
      /* Chain each scored session to the PREVIOUS SCORED one, skipping the
         unscored rows this table can now hold. Subtracting straight from the
         row before would have read `Number(null)` as 0 and written a delta of
         -84 or +84 the moment an unscored session landed between two scored
         ones — and an unscored row has no score change of its own at all. */
      let previousScored: { overallScore: unknown } | null = null
      for (let index = 0; index < chronological.length; index += 1) {
        const current = chronological[index]
        const scoreChange = current.overallScore == null || previousScored == null
          ? null
          : Number(current.overallScore) - Number(previousScored.overallScore)
        if (current.overallScore != null) previousScored = current
        const storedScoreChange = current.scoreChange == null ? null : Number(current.scoreChange)
        if (storedScoreChange === scoreChange) continue
        await tx.analysisHistory.update({
          where: { id: current.id },
          data: { scoreChange },
        })
      }
      return entry
    }, { maxWait: 10_000, timeout: 30_000 })

    return NextResponse.json({
      success: true,
      historyId: historyEntry.id,
    })
  } catch (error) {
    if (error instanceof HistoryValidationError || error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: error.message || "Request body is invalid" },
        { status: 400 },
      )
    }
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
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

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

function finiteMetric(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number,
  required = false,
): number | undefined {
  if (value == null && !required) return undefined
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new HistoryValidationError(`${name} is invalid`)
  }
  return value
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value == null || value === "") return undefined
  if (typeof value !== "string" || value.length > maxLength) {
    throw new HistoryValidationError("progressNotes is invalid")
  }
  return value
}

function jsonField(value: unknown): never | undefined {
  if (value == null) return undefined
  return value as never
}
