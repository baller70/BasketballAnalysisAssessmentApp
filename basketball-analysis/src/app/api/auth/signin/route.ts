import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateCsrf } from "@/lib/csrf"
import {
  createSessionToken,
  authCookieOptions,
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE,
} from "@/lib/authToken"

// Basic RFC-ish email validation — good enough to reject obvious garbage.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  // Session security is non-negotiable: refuse to authenticate at all if the
  // signing secret is missing, rather than silently downgrading to an
  // unsigned/insecure session.
  if (!process.env.NEXTAUTH_SECRET) {
    console.error("NEXTAUTH_SECRET is not configured; refusing to issue a session")
    return NextResponse.json(
      { error: "Server auth is misconfigured. Please contact support." },
      { status: 500 }
    )
  }

  // Rate limit: 10 signin attempts per minute per IP.
  const { response: limited } = checkRateLimit(request, {
    bucket: 'auth-signin',
    limit: 10,
    windowMs: 60_000,
  })
  if (limited) return limited

  // CSRF: reject requests that don't echo the double-submit token.
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Find user
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email },
      })
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        { error: "Database connection failed. 503" },
        { status: 503 }
      )
    }

    // Use a generic message so we don't leak whether the email exists.
    // Still run bcrypt.compare against a dummy hash when the user is missing
    // to keep response timing roughly constant.
    const passwordHash =
      user?.password || "$2a$10$0000000000000000000000000000000000000000000000000000"
    const isValidPassword = await bcrypt.compare(password, passwordHash)

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Return user (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user

    // Issue a signed, httpOnly session token. If this fails we must NOT log the
    // user in via any insecure fallback — fail the request instead.
    const token = await createSessionToken({ sub: user.id, email: user.email })

    // The token is also returned in the body for native clients, which have no
    // cookie jar to rely on and send it as `Authorization: Bearer`. The iOS app
    // has always looked for `accessToken` here (Core/APIClient.swift) and
    // always found nothing, so its Keychain stayed empty and every request it
    // made was authenticated only by an incidental cookie.
    //
    // This is the same token the cookie carries, handed to a client that has
    // already proved the password on this very request — it discloses nothing
    // the caller does not already hold. Browsers keep using the httpOnly
    // cookie, which stays the safer carrier where a cookie jar exists.
    const res = NextResponse.json(
      { user: userWithoutPassword, accessToken: token, expiresIn: AUTH_TOKEN_MAX_AGE },
      { status: 200 }
    )
    res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions())

    return res
  } catch (error) {
    console.error("Sign in error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's a Prisma/database error
    if (errorMessage.includes("P1001") || errorMessage.includes("P1002") || errorMessage.includes("Can't reach database") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("Connection refused") || errorMessage.includes("timed out")) {
      return NextResponse.json(
        { error: "Database connection failed. 503" },
        { status: 503 }
      )
    }

    // Don't leak internal error details to the client (already logged above).
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
