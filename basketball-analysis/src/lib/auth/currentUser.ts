import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/authToken"
import { prisma } from "@/lib/prisma"

export interface SessionUser {
  userId: string
  email: string
}

/**
 * Verify the signed httpOnly session JWT (auth-token) and return the user, or
 * null when unauthenticated. This is the ONLY trusted source of "who is calling"
 * — never trust a userId/userProfileId from the request body or query string.
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const verified = await verifySessionToken(token)
  if (!verified) return null
  return { userId: verified.sub, email: verified.email }
}

type ProfileResult = { profileId: string } | { error: NextResponse }

/**
 * Resolve the authenticated caller's UserProfile id. Returns either the id or a
 * ready-to-return NextResponse error (401 if not signed in, 404 if the account
 * has no profile yet). Callers MUST scope their queries to the returned
 * profileId — this is the chokepoint that prevents IDOR (one user reading or
 * mutating another user's rows by passing someone else's id).
 */
export async function resolveProfileId(
  request: NextRequest
): Promise<ProfileResult> {
  const user = await getSessionUser(request)
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    }
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.userId },
    select: { id: true },
  })
  if (!profile) {
    return {
      error: NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      ),
    }
  }

  return { profileId: profile.id }
}

/** Narrowing helper so callers can write `if (isError(r)) return r.error`. */
export function isError(r: ProfileResult): r is { error: NextResponse } {
  return "error" in r
}
