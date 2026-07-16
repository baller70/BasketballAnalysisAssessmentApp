import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isError, resolveProfileId } from "@/lib/auth/currentUser"
import { createCaptureSessionSchema } from "@/lib/api/captureSessions"

const latestObservation = {
  orderBy: { timestampMs: "desc" as const },
  take: 1,
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const requestedLimit = Number(new URL(request.url).searchParams.get("limit"))
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
    : 20

  const captureSessions = await prisma.captureSession.findMany({
    where: { userProfileId: resolved.profileId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { observations: latestObservation },
  })

  return NextResponse.json({ success: true, captureSessions })
}

export async function POST(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const parsed = createCaptureSessionSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid capture session", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { observation, readinessChecks, ...input } = parsed.data
  const captureSession = await prisma.captureSession.create({
    data: {
      ...input,
      userProfileId: resolved.profileId,
      readinessChecks: readinessChecks as Prisma.InputJsonValue | undefined,
      observations: observation
        ? {
            create: {
              ...observation,
              keypoints: observation.keypoints as Prisma.InputJsonValue | undefined,
            },
          }
        : undefined,
    },
  })

  return NextResponse.json(
    { success: true, captureSession },
    { status: 201 }
  )
}
