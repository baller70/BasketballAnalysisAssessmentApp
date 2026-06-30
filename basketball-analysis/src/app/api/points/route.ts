import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { ensureUserProfile } from "@/lib/data/ensureProfile"
import { validateCsrf } from "@/lib/csrf"
import { POINT_ACTIONS, getTierByPoints } from "@/lib/points/pointsConfig"

/**
 * /api/points — the canonical points ledger API.
 *
 * Audit fix: the app previously kept TWO unreconciled point tallies — the
 * localStorage `shotiq_points_v1` blob and gamificationService's own counter —
 * and earns fired on UI clicks rather than verified activity. This route makes
 * the PointEvent table the single source of truth:
 *
 *  - GET  → the caller's true balance = SUM(PointEvent.points), plus recent
 *           history. Derived, never client-asserted.
 *  - POST → records ONE earn. The server validates the earn `type` against the
 *           canonical POINT_ACTIONS table and enforces cooldown / per-day caps /
 *           idempotency on the server side. The client total is NEVER trusted —
 *           the awarded value comes from POINT_ACTIONS, and the response returns
 *           the freshly recomputed ledger sum.
 *
 * Identity is always derived from the signed session (never a body/query id),
 * so a user can only ever read or write their own ledger.
 */

/** Sum the ledger for a profile — the one true total. */
async function sumPoints(userProfileId: string): Promise<number> {
  const agg = await prisma.pointEvent.aggregate({
    _sum: { points: true },
    where: { userProfileId },
  })
  return agg._sum.points ?? 0
}

function totalsPayload(total: number, extra: Record<string, unknown> = {}) {
  return {
    success: true,
    totalPoints: total,
    // Points are never spent down in the ledger, so lifetime === current total.
    lifetimePoints: total,
    currentTier: getTierByPoints(total),
    ...extra,
  }
}

// GET /api/points — caller-scoped canonical balance + recent history.
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const userProfileId = await ensureUserProfile(user.userId)
    const total = await sumPoints(userProfileId)
    const history = await prisma.pointEvent.findMany({
      where: { userProfileId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        points: true,
        metadata: true,
        createdAt: true,
      },
    })

    return NextResponse.json(totalsPayload(total, { history }))
  } catch (error) {
    console.error("Error reading points ledger:", error)
    return NextResponse.json(
      { success: false, error: "Failed to read points" },
      { status: 500 }
    )
  }
}

interface EarnInput {
  type?: unknown
  metadata?: unknown
  idempotencyKey?: unknown
}

// POST /api/points — record one validated earn into the ledger.
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  let body: EarnInput
  try {
    body = (await request.json()) as EarnInput
  } catch {
    return NextResponse.json(
      { success: false, earned: false, reason: "Invalid request body" },
      { status: 400 }
    )
  }

  const type = typeof body.type === "string" ? body.type : null
  const action = type ? POINT_ACTIONS[type] : null
  if (!type || !action) {
    // Reject any earn whose type isn't in the canonical, server-owned table.
    return NextResponse.json(
      { success: false, earned: false, reason: "Invalid action" },
      { status: 400 }
    )
  }

  const metadata =
    body.metadata && typeof body.metadata === "object"
      ? (body.metadata as Record<string, unknown>)
      : {}
  const idempotencyKey =
    typeof body.idempotencyKey === "string"
      ? body.idempotencyKey
      : typeof metadata.idempotencyKey === "string"
        ? (metadata.idempotencyKey as string)
        : null

  try {
    const userProfileId = await ensureUserProfile(user.userId)

    // ---- Idempotency: same key never double-counts (safe under retries) ----
    if (idempotencyKey) {
      const dup = await prisma.pointEvent.findFirst({
        where: {
          userProfileId,
          type,
          metadata: { path: ["idempotencyKey"], equals: idempotencyKey },
        },
        select: { id: true },
      })
      if (dup) {
        const total = await sumPoints(userProfileId)
        return NextResponse.json(
          totalsPayload(total, {
            earned: false,
            points: 0,
            reason: "Duplicate",
          })
        )
      }
    }

    // ---- Server-side cooldown ----
    if (action.cooldown) {
      const last = await prisma.pointEvent.findFirst({
        where: { userProfileId, type },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
      if (last && Date.now() - last.createdAt.getTime() < action.cooldown) {
        const total = await sumPoints(userProfileId)
        return NextResponse.json(
          totalsPayload(total, {
            earned: false,
            points: 0,
            reason: "Action on cooldown",
          })
        )
      }
    }

    // ---- Server-side per-day cap ----
    if (action.maxPerDay) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const todayCount = await prisma.pointEvent.count({
        where: { userProfileId, type, createdAt: { gte: dayStart } },
      })
      if (todayCount >= action.maxPerDay) {
        const total = await sumPoints(userProfileId)
        return NextResponse.json(
          totalsPayload(total, {
            earned: false,
            points: 0,
            reason: "Daily limit reached",
          })
        )
      }
    }

    // ---- Award: value comes from POINT_ACTIONS, NOT the client ----
    const finalMeta = idempotencyKey
      ? { ...metadata, idempotencyKey }
      : metadata
    await prisma.pointEvent.create({
      data: {
        userProfileId,
        type,
        points: action.points,
        metadata: Object.keys(finalMeta).length
          ? (finalMeta as object)
          : undefined,
      },
    })

    const total = await sumPoints(userProfileId)
    return NextResponse.json(
      totalsPayload(total, { earned: true, points: action.points })
    )
  } catch (error) {
    console.error("Error recording point event:", error)
    return NextResponse.json(
      { success: false, earned: false, reason: "Failed to record points" },
      { status: 500 }
    )
  }
}
