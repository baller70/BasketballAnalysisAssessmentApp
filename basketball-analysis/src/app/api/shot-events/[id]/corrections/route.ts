import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { isError, resolveProfileId } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"

/**
 * Corrections are append-only. The detector's ShotEvent row is never changed;
 * each human decision is recorded with its kind and value so it can be audited
 * and replayed when the detector is benchmarked.
 */

const correctionKindSchema = z.enum([
  "false_shot",
  "false-shot",
  "falseShot",
  "make_miss",
  "make-miss",
  "make",
  "miss",
  "shooter",
  "phase",
])

const correctionSchema = z.object({
  /** `kind` is the canonical request field; `type` is accepted for clients
   * that use the terminology from the review UI. */
  kind: correctionKindSchema.optional(),
  type: correctionKindSchema.optional(),
  value: z.unknown().optional(),
  correctedValue: z.unknown().optional(),
  correction: z.unknown().optional(),
  timestampMs: z.number().int().min(0).optional(),
  frameIndex: z.number().int().min(0).optional(),
  reason: z.string().trim().max(2000).optional(),
}).refine((body) => Boolean(body.kind || body.type), {
  message: "kind is required",
  path: ["kind"],
})

type RouteContext = { params: { id: string } | Promise<{ id: string }> }

function canonicalKind(kind: z.infer<typeof correctionKindSchema>) {
  if (kind === "false-shot" || kind === "falseShot") return "false_shot" as const
  if (kind === "make-miss" || kind === "make" || kind === "miss") return "make_miss" as const
  return kind
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  // `normalizeValue` rejects missing values (except the false-shot boolean
  // default), so every value reaching Prisma is JSON-safe and non-undefined.
  return value as Prisma.InputJsonValue
}

function normalizeValue(
  kind: ReturnType<typeof canonicalKind>,
  body: z.infer<typeof correctionSchema>
) {
  const provided = body.value ?? body.correctedValue ?? body.correction
  if (kind === "false_shot") {
    if (provided === undefined) return true
    if (typeof provided !== "boolean") return null
    return provided
  }
  if (kind === "make_miss") {
    const value = provided ?? (body.kind === "make" || body.type === "make" ? "make" : body.kind === "miss" || body.type === "miss" ? "miss" : undefined)
    if (value !== "make" && value !== "miss") return null
    return value
  }
  if (kind === "shooter") {
    if (typeof provided !== "string" && !(provided && typeof provided === "object")) return null
    return provided
  }
  if (provided === undefined) return null
  if (typeof provided !== "string" && !(provided && typeof provided === "object")) return null
  return provided
}

async function eventId(context: RouteContext) {
  const params = await context.params
  return params.id
}

export async function GET(request: NextRequest, context: RouteContext) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const id = await eventId(context)
  const shotEvent = await prisma.shotEvent.findFirst({
    where: { id, userProfileId: resolved.profileId },
    select: { id: true },
  })
  if (!shotEvent) {
    return NextResponse.json(
      { success: false, error: "Shot event not found" },
      { status: 404 },
    )
  }

  const corrections = await prisma.shotEventCorrection.findMany({
    where: { shotEventId: id, userProfileId: resolved.profileId },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ success: true, shotEventId: id, corrections })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const id = await eventId(context)
  const shotEvent = await prisma.shotEvent.findFirst({
    where: { id, userProfileId: resolved.profileId },
    select: { id: true },
  })
  if (!shotEvent) {
    return NextResponse.json(
      { success: false, error: "Shot event not found" },
      { status: 404 },
    )
  }

  const parsed = correctionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid shot correction", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const kind = canonicalKind((parsed.data.kind || parsed.data.type) as z.infer<typeof correctionKindSchema>)
  const value = normalizeValue(kind, parsed.data)
  if (value === null) {
    return NextResponse.json(
      { success: false, error: "A valid correction value is required" },
      { status: 400 },
    )
  }

  const correction = await prisma.shotEventCorrection.create({
    data: {
      shotEventId: id,
      userProfileId: resolved.profileId,
      kind,
      value: jsonValue(value),
      timestampMs: parsed.data.timestampMs,
      frameIndex: parsed.data.frameIndex,
      reason: parsed.data.reason,
    },
  })

  return NextResponse.json({ success: true, correction }, { status: 201 })
}
