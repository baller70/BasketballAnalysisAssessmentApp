import { prisma } from "@/lib/prisma"

/**
 * getTotalPoints — the SINGLE canonical read of a user's point balance.
 *
 * The PointEvent ledger is the source of truth: a user's total is simply the
 * sum of every PointEvent row they own. Previously the app kept two parallel
 * tallies (the localStorage `shotiq_points_v1` blob and gamificationService's
 * own `totalPoints`) that drifted apart and never reconciled. Any consumer that
 * needs a points total — the Gamification agent included — MUST read it here so
 * everyone agrees on one number.
 *
 * Server-only (touches Prisma). Client code should read the total from
 * pointsContext (`getTotalPoints()`), which itself reconciles against this
 * ledger via GET /api/points.
 *
 * @param userProfileId  The UserProfile.id to scope to (never a User.id).
 */
export async function getTotalPoints(userProfileId: string): Promise<number> {
  if (!userProfileId) return 0
  const agg = await prisma.pointEvent.aggregate({
    _sum: { points: true },
    where: { userProfileId },
  })
  return agg._sum.points ?? 0
}
