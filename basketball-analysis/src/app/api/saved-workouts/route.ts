import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"

/**
 * GET  /api/saved-workouts  — list the signed-in user's saved workouts
 * POST /api/saved-workouts  — create a saved workout for the signed-in user
 *
 * Auth: the owning profile is derived from the session token, never from the
 * request, so a user can only ever see/create their own saved workouts.
 */

// Dates pass through (NextResponse.json renders them as ISO); the drillIds Json
// field passes through as-is.
function serializeSavedWorkout(s: {
  id: string
  name: string
  drillCount: number
  drillIds: unknown
  totalMade: number
  totalMissed: number
  lastPlayed: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    name: s.name,
    drillCount: s.drillCount,
    drillIds: s.drillIds,
    totalMade: s.totalMade,
    totalMissed: s.totalMissed,
    lastPlayed: s.lastPlayed ?? undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const savedWorkouts = await prisma.savedWorkout.findMany({
    where: { userProfileId: resolved.profileId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({
    success: true,
    savedWorkouts: savedWorkouts.map(serializeSavedWorkout),
  })
}

export async function POST(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { success: false, error: "name is required" },
      { status: 400 }
    )
  }

  const int = (v: unknown, fallback = 0) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback

  const savedWorkout = await prisma.savedWorkout.create({
    data: {
      userProfileId: resolved.profileId,
      name: body.name.trim(),
      drillCount: int(body.drillCount),
      drillIds: Array.isArray(body.drillIds) ? body.drillIds : [],
      totalMade: int(body.totalMade),
      totalMissed: int(body.totalMissed),
      lastPlayed: body.lastPlayed ? new Date(body.lastPlayed) : null,
    },
  })
  return NextResponse.json(
    { success: true, savedWorkout: serializeSavedWorkout(savedWorkout) },
    { status: 201 }
  )
}
