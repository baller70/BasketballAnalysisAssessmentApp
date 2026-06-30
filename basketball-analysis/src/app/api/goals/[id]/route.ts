import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { serializeGoal } from "@/lib/api/serializers"
import { validateCsrf } from "@/lib/csrf"

/**
 * PATCH  /api/goals/[id]  — update / progress / complete the signed-in user's goal
 * DELETE /api/goals/[id]  — remove the signed-in user's goal
 *
 * Auth: the owning profile is derived from the session token, and every write
 * is scoped to `{ id, userProfileId }` so a user can only ever mutate their own
 * goals (any id in the URL belonging to another user simply doesn't match).
 */

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : undefined

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const { id } = params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, error: "invalid body" },
      { status: 400 }
    )
  }

  // Build the update from only the fields the client actually sent, so a
  // partial PATCH never clobbers untouched columns.
  const data: Prisma.GoalUpdateInput = {}
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (typeof body.description === "string") data.description = body.description
  if (typeof body.category === "string") data.category = body.category
  if (typeof body.unit === "string") data.unit = body.unit
  if (typeof body.landmark === "string") data.landmark = body.landmark
  if (num(body.targetValue) !== undefined) data.targetValue = num(body.targetValue)
  if (num(body.currentValue) !== undefined) data.currentValue = num(body.currentValue)
  if (num(body.xpReward) !== undefined) data.xpReward = num(body.xpReward)
  if (Array.isArray(body.coordinates)) data.coordinates = body.coordinates
  if ("deadline" in body) data.deadline = body.deadline ? new Date(body.deadline) : null
  if ("completedAt" in body)
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null

  // Scope the write to the owner so this can never touch another user's row.
  const result = await prisma.goal.updateMany({
    where: { id, userProfileId: resolved.profileId },
    data,
  })
  if (result.count === 0) {
    return NextResponse.json(
      { success: false, error: "goal not found" },
      { status: 404 }
    )
  }

  const goal = await prisma.goal.findUnique({ where: { id } })
  return NextResponse.json({ success: true, goal: goal ? serializeGoal(goal) : null })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const { id } = params

  const result = await prisma.goal.deleteMany({
    where: { id, userProfileId: resolved.profileId },
  })
  if (result.count === 0) {
    return NextResponse.json(
      { success: false, error: "goal not found" },
      { status: 404 }
    )
  }
  return NextResponse.json({ success: true })
}
