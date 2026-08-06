import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  createSessionToken,
  verifySessionToken,
  authCookieOptions,
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE,
} from "@/lib/authToken"

/**
 * POST /api/auth/refresh — exchange a still-valid session token for a fresh one.
 *
 * THIS ROUTE DID NOT EXIST, AND ITS ABSENCE SIGNED PEOPLE OUT.
 *
 * The iOS client calls it on any 401 (Core/APIClient.swift, `refreshTokens`).
 * With no route here, Next.js answered 404; the client treats a non-200 as "the
 * session is gone", deletes both Keychain entries, and the player is thrown
 * back to sign-in. So a single unauthenticated request — one expired token, one
 * request that happened to carry no cookie — did not recover, it logged you out.
 *
 * WHAT "REFRESH" MEANS HERE. This app issues one signed HS256 session JWT with
 * a 7-day life (lib/authToken.ts); there is no separate long-lived refresh
 * credential to rotate, and inventing a second token class would be a real auth
 * change, not a bug fix. So this re-issues the session token to a caller who
 * can still present a valid one, which is what keeps an active phone signed in
 * across the 7-day boundary without asking for the password again.
 *
 * A caller with an expired or forged token gets a plain 401 and no new token —
 * this cannot resurrect a dead session, only extend a live one. The user is
 * re-read from the database on every refresh, so a deleted account stops here
 * rather than carrying a valid token for another week.
 *
 * The token is accepted from the request body, the Authorization header, or the
 * cookie, and returned both ways — the phone reads the body, the browser gets
 * the refreshed cookie.
 *
 * NO CSRF CHECK, deliberately. The caller must already hold a valid session
 * token, and the only thing a forged cross-site POST could achieve is extending
 * the victim's own session by seven days — it returns nothing an attacker can
 * read, and mutates nothing else. Requiring one would also deadlock the client
 * it exists for: the phone reaches this route while recovering from a 401, on a
 * path that carries no CSRF header, so a check here would answer 403 and hand
 * the client the same "session is gone" signal this route exists to prevent.
 */
export async function POST(request: NextRequest) {
  let bodyToken: string | undefined
  try {
    const body = (await request.json()) as Record<string, unknown> | null
    // The iOS client posts `{ refreshToken }`; accept `accessToken`/`token` too
    // so a future client does not 401 on a naming difference alone.
    for (const key of ["refreshToken", "accessToken", "token"]) {
      const value = body?.[key]
      if (typeof value === "string" && value.length > 0) {
        bodyToken = value
        break
      }
    }
  } catch {
    // No body, or not JSON — the header or cookie may still carry the token.
  }

  const header = request.headers.get("authorization") ?? ""
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : undefined
  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value

  const presented =
    (await verifySessionToken(bodyToken)) ??
    (await verifySessionToken(bearer)) ??
    (await verifySessionToken(cookie))

  if (!presented) {
    return NextResponse.json(
      { success: false, error: "Session expired. Please sign in again." },
      { status: 401 }
    )
  }

  try {
    // A token can outlive the account it names. Refusing here is what stops a
    // deleted user's phone from renewing itself indefinitely.
    const user = await prisma.user.findUnique({
      where: { id: presented.sub },
      select: { id: true, email: true },
    })
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Session expired. Please sign in again." },
        { status: 401 }
      )
    }

    const token = await createSessionToken({ sub: user.id, email: user.email })
    const res = NextResponse.json({
      success: true,
      // `refreshToken` mirrors `accessToken` because this app has one token,
      // not two. The client stores both keys and sends whichever it holds, so
      // returning the same value keeps its Keychain consistent.
      accessToken: token,
      refreshToken: token,
      expiresIn: AUTH_TOKEN_MAX_AGE,
    })
    res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions())
    return res
  } catch (error) {
    console.error("Token refresh error:", error)
    // Deliberately NOT a 401: a database blip must not read to the client as
    // "your session is gone" and take the Keychain with it.
    return NextResponse.json(
      { success: false, error: "Could not refresh the session" },
      { status: 500 }
    )
  }
}
