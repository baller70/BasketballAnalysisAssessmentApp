import { prisma } from "@/lib/prisma"
import { POINT_ACTIONS } from "@/lib/points/pointsConfig"

/**
 * Record ONE point earn, server-side, for a profile that has already been
 * authenticated by the caller.
 *
 * WHY THIS EXISTS. The points feature was complete except for the one thing
 * that makes it a feature: the ledger table, the API, the tier maths, the badge
 * grid and `earnPoints` in the context all existed, and **nothing anywhere in
 * the app ever called any of them**. `grep` for a caller of `earnPoints` or a
 * POST to /api/points returns nothing outside the context's own definition. So
 * every points number on every screen — the topbar's "2,840 POINTS", the tier,
 * the streak, the history list — was decoration over an empty table.
 *
 * The logic here is lifted verbatim out of `POST /api/points` so the two cannot
 * drift: same canonical POINT_ACTIONS table, same idempotency key, same
 * cooldown, same per-day cap, and the awarded value always taken from the
 * table rather than from any caller. What it adds is a form callable from
 * another route, so an earn can be tied to a VERIFIED SERVER EVENT — an
 * analysis row actually being written — instead of a UI click. That is what the
 * /api/points docstring says the design is for, and it is the half that was
 * missing.
 *
 * Awarding on the server also means an iOS capture earns exactly like a web
 * upload, because both land in the same `save-analysis` route. A client-side
 * earn would have left the phone silently scoreless.
 *
 * NEVER THROWS. Points are a reward on the side of the real work; a failure
 * here must not turn a saved analysis into an error the player sees. Callers
 * get `earned: false` with a reason and carry on.
 */
export interface EarnOutcome {
  earned: boolean
  points: number
  reason?: string
}

export async function recordEarn(
  userProfileId: string,
  type: string,
  metadata: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<EarnOutcome> {
  const action = POINT_ACTIONS[type]
  if (!action) return { earned: false, points: 0, reason: "Invalid action" }

  try {
    // Same key never double-counts. save-analysis is idempotent by
    // clientSessionId and is retried by the upload queue, so without this a
    // flaky network would pay a player twice for one shot.
    if (idempotencyKey) {
      const dup = await prisma.pointEvent.findFirst({
        where: {
          userProfileId,
          type,
          metadata: { path: ["idempotencyKey"], equals: idempotencyKey },
        },
        select: { id: true },
      })
      if (dup) return { earned: false, points: 0, reason: "Already awarded" }
    }

    if (action.cooldown) {
      const last = await prisma.pointEvent.findFirst({
        where: { userProfileId, type },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
      if (last && Date.now() - last.createdAt.getTime() < action.cooldown) {
        return { earned: false, points: 0, reason: "Action on cooldown" }
      }
    }

    if (action.maxPerDay) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const todayCount = await prisma.pointEvent.count({
        where: { userProfileId, type, createdAt: { gte: dayStart } },
      })
      if (todayCount >= action.maxPerDay) {
        return { earned: false, points: 0, reason: "Daily limit reached" }
      }
    }

    const finalMeta = idempotencyKey ? { ...metadata, idempotencyKey } : metadata
    await prisma.pointEvent.create({
      data: {
        userProfileId,
        type,
        points: action.points,
        metadata: Object.keys(finalMeta).length ? (finalMeta as object) : undefined,
      },
    })
    return { earned: true, points: action.points }
  } catch (error) {
    console.error(`recordEarn(${type}) failed:`, error)
    return { earned: false, points: 0, reason: "Failed to record points" }
  }
}
