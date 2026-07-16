import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import {
  evaluateRetest,
  selectCoachingTarget,
  serializeCoachingTarget,
  type CoachingFlawSignal,
  type CoachingTargetInput,
} from "@/lib/coaching/coachingTarget"

// The checked-in Prisma schema owns this delegate. Keeping the narrow shape
// here also lets the API compile before a deployment has regenerated its
// client (the generated client in a developer checkout may lag the schema).
interface CoachingTargetRow {
  id: string
  userProfileId: string
  flaw: string
  cue: string
  drillId: string
  drillName: string
  metric: string
  baseline: unknown
  targetValue: unknown
  direction: string
  confidence: unknown
  status: string
  retestValue?: unknown
  retestedAt?: Date | string | null
  createdAt?: Date
  updatedAt?: Date
}
interface CoachingTargetDelegate {
  findFirst(args: unknown): Promise<CoachingTargetRow | null>
  update(args: unknown): Promise<CoachingTargetRow>
  updateMany(args: unknown): Promise<{ count: number }>
  create(args: unknown): Promise<CoachingTargetRow>
}
const coachingTargetDb = (prisma as unknown as { coachingTarget: CoachingTargetDelegate }).coachingTarget

function toFlaws(value: unknown): CoachingTargetInput["flaws"] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string | CoachingFlawSignal =>
      typeof item === "string" || (typeof item === "object" && item !== null)
    )
  }
  // The Training tab currently supplies a boolean map (e.g. elbowAlignment:
  // true). Accept it at the boundary so the target remains useful to callers
  // that do not yet have the richer analysis payload.
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => enabled !== false)
      .map(([id]) => id)
  }
  return []
}

function serializeRow(row: Parameters<typeof serializeCoachingTarget>[0]) {
  return serializeCoachingTarget(row)
}

/** GET /api/coaching-targets — latest active target (or latest retest). */
export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  try {
    const target = await coachingTargetDb.findFirst({
      where: { userProfileId: resolved.profileId, status: "active" },
      orderBy: { createdAt: "desc" },
    }) || await coachingTargetDb.findFirst({
      where: { userProfileId: resolved.profileId },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ success: true, target: target ? serializeRow(target) : null })
  } catch (error) {
    console.error("Coaching target lookup error:", error)
    return NextResponse.json({ success: false, error: "Failed to load coaching target" }, { status: 500 })
  }
}

/**
 * POST /api/coaching-targets
 *
 * Without targetId this creates the one highest-confidence target from the
 * latest analysis signals. With targetId + retestValue it records the retest
 * and returns an improvement/no-change/regression result.
 */
export async function POST(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ success: false, error: "Request body must be JSON" }, { status: 400 })

  try {
    const targetId = typeof body.targetId === "string" ? body.targetId : undefined
    const retestValue = typeof body.retestValue === "number"
      ? body.retestValue
      : typeof body.value === "number" ? body.value : undefined
    const numericRetest = typeof retestValue === "number" && Number.isFinite(retestValue) ? retestValue : undefined

    if (targetId || retestValue !== undefined) {
      if (!targetId || numericRetest === undefined) {
        return NextResponse.json({ success: false, error: "targetId and a finite retestValue are required" }, { status: 400 })
      }
      const current = await coachingTargetDb.findFirst({
        where: { id: targetId, userProfileId: resolved.profileId },
      })
      if (!current) return NextResponse.json({ success: false, error: "Coaching target not found" }, { status: 404 })

      const result = evaluateRetest({
        baseline: Number(current.baseline),
        targetValue: Number(current.targetValue),
        direction: current.direction === "decrease" ? "decrease" : "increase",
      }, numericRetest)
      const updated = await coachingTargetDb.update({
        where: { id: current.id },
        data: {
          status: result.status,
          retestValue: result.value,
          retestedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, target: serializeRow(updated), result })
    }

    const input: CoachingTargetInput = {
      flaws: toFlaws(body.flaws ?? body.detectedFlaws),
      candidates: Array.isArray(body.candidates) ? body.candidates as CoachingFlawSignal[] : undefined,
      metrics: body.metrics && typeof body.metrics === "object"
        ? body.metrics as Record<string, number | null | undefined>
        : body.angles && typeof body.angles === "object"
          ? body.angles as Record<string, number | null | undefined>
          : undefined,
    }
    const selected = selectCoachingTarget(input)

    // Keep one active target per player. Prior retests remain available in the
    // database as a timeline, but cannot compete with the new recommendation.
    await coachingTargetDb.updateMany({
      where: { userProfileId: resolved.profileId, status: "active" },
      data: { status: "superseded" },
    })
    const created = await coachingTargetDb.create({
      data: {
        userProfileId: resolved.profileId,
        flaw: selected.flaw,
        cue: selected.cue,
        drillId: selected.drillId,
        drillName: selected.drillName,
        metric: selected.metric,
        baseline: selected.baseline,
        targetValue: selected.targetValue,
        direction: selected.direction,
        confidence: selected.confidence,
        status: "active",
      },
    })
    return NextResponse.json({ success: true, target: serializeRow(created) }, { status: 201 })
  } catch (error) {
    console.error("Coaching target mutation error:", error)
    return NextResponse.json({ success: false, error: "Failed to save coaching target" }, { status: 500 })
  }
}

/** PATCH is a convenient alias for recording a retest from mobile clients. */
export async function PATCH(request: NextRequest) {
  return POST(request)
}
