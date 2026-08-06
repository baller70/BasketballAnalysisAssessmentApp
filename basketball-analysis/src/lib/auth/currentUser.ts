import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/authToken"
import { ensureUserProfile } from "@/lib/data/ensureProfile"

export interface SessionUser {
  userId: string
  email: string
}

/**
 * Verify the signed session JWT and return the user, or null when
 * unauthenticated. This is the ONLY trusted source of "who is calling" — never
 * trust a userId/userProfileId from the request body or query string.
 *
 * Two carriers, one token. The browser sends it in the httpOnly `auth-token`
 * cookie. A native client sends it as `Authorization: Bearer <token>`, which
 * this used to ignore entirely — the iOS app has always set that header
 * (Core/APIClient.swift) and the only reason anything worked was that
 * URLSession happens to keep the signin cookie too. Anything that cleared the
 * cookie jar, or any future request built without it, silently became an
 * anonymous request.
 *
 * Accepting Bearer widens no trust boundary: it is the same HS256 token, put
 * through the same `verifySessionToken`, and a forged or expired one fails
 * exactly as it does in the cookie. The cookie is checked first so a browser
 * request cannot be re-attributed by an attacker-supplied header.
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const header = request.headers.get("authorization") ?? ""
  const bearerToken = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : undefined

  const verified =
    (await verifySessionToken(cookieToken)) ??
    (await verifySessionToken(bearerToken))
  if (!verified) return null
  return { userId: verified.sub, email: verified.email }
}

type ProfileResult = { profileId: string } | { error: NextResponse }

/**
 * Resolve the authenticated caller's UserProfile id. Returns either the id or a
 * ready-to-return NextResponse error (401 if not signed in, 500 if the profile
 * could not be read or created). Callers MUST scope their queries to the
 * returned profileId — this is the chokepoint that prevents IDOR (one user
 * reading or mutating another user's rows by passing someone else's id).
 *
 * An authenticated caller always gets a profile: it is created on demand rather
 * than 404'ing, which is what used to happen to anyone who signed up on the
 * phone and never opened the web profile page.
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

  // A signed-in account with no UserProfile row used to get 404 "Profile not
  // found" from every profile-scoped route. On the web that is nearly invisible
  // — the profile page creates one on first visit — but a player who signs up
  // on the phone never visits it, so their first capture could not be saved and
  // nothing they did on iOS ever reached the web app. The profile is not a
  // gate, it is the row their data hangs off, so create it on demand.
  //
  // `ensureUserProfile` is idempotent and race-safe (upsert on the unique
  // userId), and it is created only for a caller who has ALREADY proved who
  // they are above — this cannot mint a profile for an unauthenticated request.
  try {
    return { profileId: await ensureUserProfile(user.userId) }
  } catch (error) {
    console.error("resolveProfileId: could not ensure a profile", error)
    return {
      error: NextResponse.json(
        { success: false, error: "Profile unavailable" },
        { status: 500 }
      ),
    }
  }
}

/** Narrowing helper so callers can write `if (isError(r)) return r.error`. */
export function isError(r: ProfileResult): r is { error: NextResponse } {
  return "error" in r
}
