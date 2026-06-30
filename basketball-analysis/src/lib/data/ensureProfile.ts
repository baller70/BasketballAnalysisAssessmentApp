import { prisma } from "@/lib/prisma"

/**
 * Ensure a UserProfile row exists for the given User and return its id.
 *
 * A `User` (auth record) and a `UserProfile` (app/analysis record) are separate
 * tables linked by `UserProfile.userId`. Historically signup created only the
 * User, so `resolveProfileId` 404'd for brand-new accounts and every
 * profile-scoped feature (goals, workouts, save-analysis, settings, points)
 * failed. Call this once at signup — and defensively anywhere a profile is
 * required — to guarantee the profile exists.
 *
 * Idempotent: if a profile already exists it is returned unchanged. Safe under
 * races via an upsert on the unique `userId`.
 *
 * @param userId  The `User.id` from the session/auth record.
 * @returns       The `UserProfile.id` to scope all profile-owned queries to.
 */
export async function ensureUserProfile(userId: string): Promise<string> {
  if (!userId) {
    throw new Error("ensureUserProfile: userId is required")
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  })

  return profile.id
}
