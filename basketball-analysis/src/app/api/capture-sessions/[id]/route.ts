import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isError, resolveProfileId } from "@/lib/auth/currentUser"
import { updateCaptureSessionSchema } from "@/lib/api/captureSessions"

type RouteContext = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const captureSession = await prisma.captureSession.findFirst({
    where: { id: params.id, userProfileId: resolved.profileId },
    include: { observations: { orderBy: { timestampMs: "asc" } } },
  })
  if (!captureSession) {
    return NextResponse.json(
      { success: false, error: "Capture session not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, captureSession })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const parsed = updateCaptureSessionSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid capture update", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const ownedSession = await prisma.captureSession.findFirst({
    where: { id: params.id, userProfileId: resolved.profileId },
    select: { id: true },
  })
  if (!ownedSession) {
    return NextResponse.json(
      { success: false, error: "Capture session not found" },
      { status: 404 }
    )
  }

  const { observation, readinessChecks, ...input } = parsed.data
  const captureSession = await prisma.captureSession.update({
    where: { id: params.id },
    data: {
      ...input,
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
    include: {
      observations: { orderBy: { timestampMs: "desc" }, take: 1 },
    },
  })

  return NextResponse.json({ success: true, captureSession })
}
