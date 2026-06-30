import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"

/**
 * GET /api/training-preferences  — the signed-in user's preferences (or null)
 * PUT /api/training-preferences  — upsert the signed-in user's preferences
 *
 * Auth: the owning profile is derived from the session token, never from the
 * request, so a user can only ever read/write their own preferences row.
 */

function serializePreference(p: {
  id: string
  frequency: number
  preferredDuration: number
  drillCount: number
  workoutMode: string
  soundEnabled: boolean
  ageLevel: string
  autoPopulateFromFlaws: boolean
  notificationsEnabled: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: p.id,
    frequency: p.frequency,
    preferredDuration: p.preferredDuration,
    drillCount: p.drillCount,
    workoutMode: p.workoutMode,
    soundEnabled: p.soundEnabled,
    ageLevel: p.ageLevel,
    autoPopulateFromFlaws: p.autoPopulateFromFlaws,
    notificationsEnabled: p.notificationsEnabled,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const pref = await prisma.trainingPreference.findUnique({
    where: { userProfileId: resolved.profileId },
  })
  return NextResponse.json({
    success: true,
    preferences: pref ? serializePreference(pref) : null,
  })
}

export async function PUT(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid body" },
      { status: 400 }
    )
  }

  const int = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback
  const bool = (v: unknown, fallback: boolean) =>
    typeof v === "boolean" ? v : fallback
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v : fallback

  const values = {
    frequency: int(body.frequency, 3),
    preferredDuration: int(body.preferredDuration, 30),
    drillCount: int(body.drillCount, 3),
    workoutMode: str(body.workoutMode, "continuous"),
    soundEnabled: bool(body.soundEnabled, true),
    ageLevel: str(body.ageLevel, "high-school"),
    autoPopulateFromFlaws: bool(body.autoPopulateFromFlaws, false),
    notificationsEnabled: bool(body.notificationsEnabled, true),
  }

  const pref = await prisma.trainingPreference.upsert({
    where: { userProfileId: resolved.profileId },
    update: values,
    create: { userProfileId: resolved.profileId, ...values },
  })
  return NextResponse.json({
    success: true,
    preferences: serializePreference(pref),
  })
}
