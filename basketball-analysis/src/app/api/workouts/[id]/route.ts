import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { serializeWorkout } from "@/lib/api/serializers"

/**
 * PUT    /api/workouts/[id]  — update one of the signed-in user's workouts
 * DELETE /api/workouts/[id]  — delete one of the signed-in user's workouts
 *
 * Ownership is enforced by first loading the row's userProfileId and comparing
 * it to the caller's resolved profile — a mismatch (or a missing row) is a 404,
 * so a user can never read or mutate another user's workouts via the id.
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const existing = await prisma.workout.findUnique({
    where: { id: params.id },
    select: { userProfileId: true },
  })
  if (!existing || existing.userProfileId !== resolved.profileId) {
    return NextResponse.json(
      { success: false, error: "Workout not found" },
      { status: 404 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid body" },
      { status: 400 }
    )
  }

  // Only update fields that were actually provided.
  const data: Prisma.WorkoutUpdateInput = {}
  if (typeof body.name === "string") data.name = body.name
  if (body.scheduledDate !== undefined) {
    const d = new Date(body.scheduledDate)
    if (!Number.isNaN(d.getTime())) data.scheduledDate = d
  }
  if (Array.isArray(body.drillIds)) data.drillIds = body.drillIds
  if (Array.isArray(body.focusAreas)) data.focusAreas = body.focusAreas
  if (typeof body.duration === "number" && Number.isFinite(body.duration)) {
    data.duration = Math.round(body.duration)
  }
  if (typeof body.completed === "boolean") data.completed = body.completed
  if (body.completedAt !== undefined) {
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null
  }
  if (typeof body.totalShots === "number" && Number.isFinite(body.totalShots)) {
    data.totalShots = Math.round(body.totalShots)
  }
  if (typeof body.totalMade === "number" && Number.isFinite(body.totalMade)) {
    data.totalMade = Math.round(body.totalMade)
  }
  if (
    typeof body.totalMissed === "number" &&
    Number.isFinite(body.totalMissed)
  ) {
    data.totalMissed = Math.round(body.totalMissed)
  }
  if (typeof body.accuracy === "number" && Number.isFinite(body.accuracy)) {
    data.accuracy = body.accuracy
  }

  const workout = await prisma.workout.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json({ success: true, workout: serializeWorkout(workout) })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const existing = await prisma.workout.findUnique({
    where: { id: params.id },
    select: { userProfileId: true },
  })
  if (!existing || existing.userProfileId !== resolved.profileId) {
    return NextResponse.json(
      { success: false, error: "Workout not found" },
      { status: 404 }
    )
  }

  await prisma.workout.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
