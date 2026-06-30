import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { serializeWorkout } from "@/lib/api/serializers"

/**
 * GET  /api/workouts  — list the signed-in user's workouts
 * POST /api/workouts  — create a workout for the signed-in user
 *
 * Auth: the owning profile is derived from the session token, never from the
 * request, so a user can only ever see/create their own workouts.
 */

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: Prisma.WorkoutWhereInput = { userProfileId: resolved.profileId }
  const range: { gte?: Date; lte?: Date } = {}
  if (from) {
    const d = new Date(from)
    if (!Number.isNaN(d.getTime())) range.gte = d
  }
  if (to) {
    const d = new Date(to)
    if (!Number.isNaN(d.getTime())) range.lte = d
  }
  if (range.gte || range.lte) where.scheduledDate = range

  const workouts = await prisma.workout.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
  })
  return NextResponse.json({
    success: true,
    workouts: workouts.map(serializeWorkout),
  })
}

export async function POST(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const body = await request.json().catch(() => null)
  if (!body || !body.scheduledDate) {
    return NextResponse.json(
      { success: false, error: "scheduledDate is required" },
      { status: 400 }
    )
  }
  const scheduledDate = new Date(body.scheduledDate)
  if (Number.isNaN(scheduledDate.getTime())) {
    return NextResponse.json(
      { success: false, error: "scheduledDate is invalid" },
      { status: 400 }
    )
  }

  const int = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v) : undefined
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : undefined

  const workout = await prisma.workout.create({
    data: {
      userProfileId: resolved.profileId,
      name: typeof body.name === "string" ? body.name : null,
      scheduledDate,
      drillIds: Array.isArray(body.drillIds) ? body.drillIds : [],
      focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas : undefined,
      duration: int(body.duration),
      completed: typeof body.completed === "boolean" ? body.completed : false,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      totalShots: int(body.totalShots),
      totalMade: int(body.totalMade),
      totalMissed: int(body.totalMissed),
      accuracy: num(body.accuracy),
    },
  })
  return NextResponse.json(
    { success: true, workout: serializeWorkout(workout) },
    { status: 201 }
  )
}
