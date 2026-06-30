import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { serializeGoal } from "@/lib/api/serializers"
import { validateCsrf } from "@/lib/csrf"

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
  return NextResponse.json({ success: true, goals: goals.map(serializeGoal) })
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
