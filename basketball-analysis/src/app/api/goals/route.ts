import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { serializeGoal } from "@/lib/api/serializers"
import { validateCsrf } from "@/lib/csrf"
import { evaluateGoal, type GoalSession } from "@/lib/goals/progress"

/**
 * GET  /api/goals  — list the signed-in user's goals
 * POST /api/goals  — create a goal for the signed-in user
 *
 * Auth: the owning profile is derived from the session token, never from the
 * request, so a user can only ever see/create their own goals.
 */

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const goals = await prisma.goal.findMany({
    where: { userProfileId: resolved.profileId },
    orderBy: { createdAt: "asc" },
  })

  /* EACH GOAL, MEASURED AGAINST WHAT THE PLAYER ACTUALLY DID.
     `currentValue` is written by exactly one thing in the codebase — a PATCH
     carrying a number from the client — so a goal has never moved on its own.
     A player who set "65% Make Percentage" and then shot 68% for a month
     watched the bar stay at zero, on the one screen whose entire subject is
     progress. The stored value is still returned, unchanged; `progress` is the
     reading alongside it, and it says when it could not take one. */
  const sessions = await loadSessions(resolved.profileId)
  return NextResponse.json({
    success: true,
    goals: goals.map((g) => ({
      ...serializeGoal(g),
      progress: evaluateGoal(
        { category: g.category, targetValue: g.targetValue, unit: g.unit },
        sessions,
        g.currentValue,
      ),
    })),
  })
}

/**
 * The player's sessions, with the shot counts a goal needs.
 *
 * Attempts live on ShotEvent, keyed by capture session, and only `make`/`miss`
 * count — an `unknown` is an attempt nobody adjudicated, and counting it would
 * depress every make% by however often the detector was unsure.
 */
async function loadSessions(userProfileId: string): Promise<GoalSession[]> {
  const analyses = await prisma.userAnalysis.findMany({
    where: { userProfileId },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: { createdAt: true, overallScore: true, captureSessionId: true },
  })

  const ids = analyses.map((a) => a.captureSessionId).filter((v): v is string => Boolean(v))
  const tally = new Map<string, { shots: number; makes: number }>()
  if (ids.length) {
    const events = await prisma.shotEvent.findMany({
      where: { captureSessionId: { in: ids } },
      select: { captureSessionId: true, detectedResult: true },
    })
    for (const e of events) {
      if (!e.captureSessionId) continue
      if (e.detectedResult !== "make" && e.detectedResult !== "miss") continue
      const t = tally.get(e.captureSessionId) ?? { shots: 0, makes: 0 }
      t.shots += 1
      if (e.detectedResult === "make") t.makes += 1
      tally.set(e.captureSessionId, t)
    }
  }

  return analyses.map((a) => {
    const t = a.captureSessionId ? tally.get(a.captureSessionId) : undefined
    const score = a.overallScore == null ? null : Number(a.overallScore)
    return {
      at: a.createdAt,
      score: score != null && Number.isFinite(score) ? score : null,
      shots: t?.shots ?? 0,
      makes: t?.makes ?? 0,
    }
  })
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { success: false, error: "name is required" },
      { status: 400 }
    )
  }

  const num = (v: unknown, fallback = 0) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback

  const goal = await prisma.goal.create({
    data: {
      userProfileId: resolved.profileId,
      name: body.name.trim(),
      description: typeof body.description === "string" ? body.description : null,
      category: typeof body.category === "string" ? body.category : "custom",
      targetValue: num(body.targetValue),
      currentValue: num(body.currentValue),
      unit: typeof body.unit === "string" ? body.unit : "",
      xpReward: num(body.xpReward),
      deadline: body.deadline ? new Date(body.deadline) : null,
      landmark: typeof body.landmark === "string" ? body.landmark : null,
      coordinates: Array.isArray(body.coordinates) ? body.coordinates : undefined,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
    },
  })
  return NextResponse.json(
    { success: true, goal: serializeGoal(goal) },
    { status: 201 }
  )
}
