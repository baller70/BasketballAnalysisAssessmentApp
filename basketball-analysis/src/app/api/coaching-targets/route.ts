import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"
import {
  evaluateRetest,
  hasCoachingMetricValue,
  normalizeCoachingTargetDirection,
  selectCoachingTarget,
  serializeCoachingTarget,
  CoachingTargetUnavailableError,
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
interface AnalysisHistoryDelegate {
  findFirst(args: unknown): Promise<{
    elbowAngle?: unknown
    kneeAngle?: unknown
    releaseAngle?: unknown
    balanceScore?: unknown
    formScore?: unknown
    consistencyScore?: unknown
  } | null>
}
interface CoachingTargetTransaction {
  coachingTarget: CoachingTargetDelegate
}
interface CoachingTargetClient {
  coachingTarget: CoachingTargetDelegate
  analysisHistory: AnalysisHistoryDelegate
  $transaction<T>(callback: (tx: CoachingTargetTransaction) => Promise<T>): Promise<T>
}
const coachingTargetClient = prisma as unknown as CoachingTargetClient
const coachingTargetDb = coachingTargetClient.coachingTarget

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

function hasMeasuredMetricValues(metrics: CoachingTargetInput["metrics"], metric?: string): boolean {
  if (!metrics) return false
  if (metric) return hasCoachingMetricValue(metric, metrics)
  return Object.values(metrics).some((value) => typeof value === "number" && Number.isFinite(value))
}

/** Use the most recent persisted analysis when a client did not send its live angles. */
async function latestMeasuredMetrics(profileId: string): Promise<CoachingTargetInput["metrics"]> {
  const row = await coachingTargetClient.analysisHistory.findFirst({
    where: { userProfileId: profileId },
    orderBy: { analysisDate: "desc" },
    select: {
      elbowAngle: true,
      kneeAngle: true,
      releaseAngle: true,
      balanceScore: true,
      formScore: true,
      consistencyScore: true,
    },
  })
  if (!row) return undefined
  return {
    elbowAngle: row.elbowAngle == null ? undefined : Number(row.elbowAngle),
    kneeAngle: row.kneeAngle == null ? undefined : Number(row.kneeAngle),
    releaseAngle: row.releaseAngle == null ? undefined : Number(row.releaseAngle),
    balanceScore: row.balanceScore == null ? undefined : Number(row.balanceScore),
    formScore: row.formScore == null ? undefined : Number(row.formScore),
    consistencyScore: row.consistencyScore == null ? undefined : Number(row.consistencyScore),
  }
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
async function handleMutation(request: NextRequest) {
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

      const direction = normalizeCoachingTargetDirection(current.direction)
      if (!direction) {
        return NextResponse.json({ success: false, error: "Stored coaching target has an invalid direction" }, { status: 422 })
      }
      const result = evaluateRetest({
        baseline: Number(current.baseline),
        targetValue: Number(current.targetValue),
        direction,
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

    const suppliedMetrics: CoachingTargetInput["metrics"] = body.metrics && typeof body.metrics === "object"
      ? body.metrics as Record<string, number | null | undefined>
      : body.angles && typeof body.angles === "object"
        ? body.angles as Record<string, number | null | undefined>
        : undefined

    const baseInput: Omit<CoachingTargetInput, "metrics"> = {
      flaws: toFlaws(body.flaws ?? body.detectedFlaws),
      candidates: Array.isArray(body.candidates) ? body.candidates as CoachingFlawSignal[] : undefined,
    }
    // Select once without measurements to identify the selected rule's metric.
    // Persisted history is only a valid fallback when that metric itself is
    // present; an unrelated score must never become the baseline source.
    const preview = selectCoachingTarget(baseInput)
    let metrics = suppliedMetrics
    if (!hasMeasuredMetricValues(suppliedMetrics, preview.metric)) {
      const persistedMetrics = await latestMeasuredMetrics(resolved.profileId)
      if (hasMeasuredMetricValues(persistedMetrics, preview.metric)) {
        metrics = { ...suppliedMetrics, ...persistedMetrics }
      }
    }

    // Training sends the latest on-device angles. For older clients, derive
    // them from the latest persisted history before selecting a target.
    const input: CoachingTargetInput = {
      ...baseInput,
      metrics,
    }
    const selected = selectCoachingTarget(input)

    // Keep one active target per player. Prior retests remain available in the
    // database as a timeline, but cannot compete with the new recommendation.
    // Superseding and creating are one transaction so a failed create cannot
    // leave the player without an active target. The migration also installs a
    // partial unique index as a final guard against concurrent requests.
    const created = await coachingTargetClient.$transaction(async (tx) => {
      await tx.coachingTarget.updateMany({
        where: { userProfileId: resolved.profileId, status: "active" },
        data: { status: "superseded" },
      })
      return tx.coachingTarget.create({
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
    })
    return NextResponse.json({ success: true, target: serializeRow(created) }, { status: 201 })
  } catch (error) {
    console.error("Coaching target mutation error:", error)
    if (error instanceof CoachingTargetUnavailableError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: "Failed to save coaching target" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError
  return handleMutation(request)
}

/** PATCH is a convenient alias for recording a retest from mobile clients. */
export async function PATCH(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError
  return handleMutation(request)
}
