import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { isError, resolveProfileId } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"

/**
 * Detector output is written in batches by Results/live capture. The caller's
 * profile is always derived from the signed session; neither profile nor
 * ownership can be supplied by the client.
 */
const shotEventSchema = z.object({
  sequence: z.number().int().min(0).optional(),
  timestampMs: z.number().int().min(0).optional(),
  startFrame: z.number().int().min(0).optional(),
  endFrame: z.number().int().min(0).optional(),
  thumbnailUrl: z.string().trim().max(500_000).optional(),
  detected: z.boolean().default(true),
  detectedResult: z.enum(["make", "miss", "unknown"]).optional(),
  detectedShooter: z.string().trim().max(255).optional(),
  detectedPhase: z.string().trim().max(50).optional(),
  confidence: z.number().min(0).max(1).optional(),
  phaseMarkers: z.unknown().optional(),
  metadata: z.unknown().optional(),
})

const createShotEventsSchema = z.object({
  captureSessionId: z.string().trim().min(1).max(255).optional(),
  events: z.array(shotEventSchema).min(1).max(200),
})

const jsonValue = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (value === undefined) return undefined
  // JSON.stringify/parse gives Prisma a JSON-safe value and rejects circular
  // detector payloads before they reach the database.
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  } catch {
    return undefined
  }
}

const REVIEW_CONFIDENCE_THRESHOLD = 0.6

type ShotEventWithCorrections = Prisma.ShotEventGetPayload<{
  include: { corrections: true }
}>

function serializeShotEvent(event: ShotEventWithCorrections) {
  return {
    ...event,
    confidence: event.confidence == null ? undefined : Number(event.confidence),
  }
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const params = new URL(request.url).searchParams
  const requestedLimit = Number(params.get("limit"))
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(200, Math.max(1, Math.floor(requestedLimit)))
    : 100
  const captureSessionId = params.get("captureSessionId") || undefined

  const shotEvents = await prisma.shotEvent.findMany({
    where: { userProfileId: resolved.profileId, captureSessionId },
    orderBy: [{ timestampMs: "asc" }, { createdAt: "asc" }],
    take: limit,
    include: { corrections: { orderBy: { createdAt: "asc" } } },
  })
  return NextResponse.json({ success: true, shotEvents: shotEvents.map(serializeShotEvent) })
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const parsed = createShotEventsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid shot events", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { captureSessionId, events } = parsed.data
  if (captureSessionId) {
    const captureSession = await prisma.captureSession.findFirst({
      where: { id: captureSessionId, userProfileId: resolved.profileId },
      select: { id: true },
    })
    if (!captureSession) {
      return NextResponse.json(
        { success: false, error: "Capture session not found" },
        { status: 404 },
      )
    }
  }

  const shotEvents = await prisma.$transaction(
    events.map((event) => {
      const trusted = event.confidence !== undefined
        && event.confidence >= REVIEW_CONFIDENCE_THRESHOLD
        && event.detected !== false
      const metadata = jsonValue(event.metadata)
      const metadataWithTrust = metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? { ...(metadata as Record<string, unknown>), trusted, reviewOnly: !trusted }
        : metadata === undefined
          ? { trusted, reviewOnly: !trusted }
          : { trusted, reviewOnly: !trusted, detectorMetadata: metadata }

      return prisma.shotEvent.create({
        data: {
          userProfileId: resolved.profileId,
          captureSessionId,
          sequence: event.sequence,
          timestampMs: event.timestampMs,
          startFrame: event.startFrame,
          endFrame: event.endFrame,
          thumbnailUrl: event.thumbnailUrl,
          detected: event.detected,
          detectedResult: event.detectedResult,
          detectedShooter: event.detectedShooter,
          detectedPhase: event.detectedPhase,
          confidence: event.confidence,
          phaseMarkers: jsonValue(event.phaseMarkers),
          metadata: metadataWithTrust as Prisma.InputJsonValue,
        },
        include: { corrections: true },
      })
    }),
  )

  return NextResponse.json({ success: true, shotEvents: shotEvents.map(serializeShotEvent) }, { status: 201 })
}
