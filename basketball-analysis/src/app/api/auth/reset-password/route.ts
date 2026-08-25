import { NextRequest, NextResponse } from "next/server"
import * as bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateCsrf } from "@/lib/csrf"
import { consumeToken } from "@/lib/auth/verification"

const MIN_PASSWORD_LENGTH = 6

/**
 * Reset-password: validates a single-use "password_reset" token, then sets a
 * fresh bcrypt password hash. The token is consumed (single-use) regardless of
 * outcome to prevent replay. Does NOT auto-login — the client redirects to
 * /signin afterwards.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === "string" ? body.token : ""
  const password = typeof body?.password === "string" ? body.password : ""

  // 10 attempts a minute PER TOKEN. The token IS the account here — there is no
  // address in this request — and it is the thing being guessed, so keying on it
  // is what a brute-force guard wants: 10/min against any one token, and one
  // client hammering token A cannot lock out a player redeeming token B. Moved
  // below the body parse so the token exists to key on.
  //
  // The token is a secret and this key never leaves the process, but it is
  // truncated to 120 chars by `checkRateLimit` and lives only in an in-memory
  // map for one window.
  const { response: limited } = checkRateLimit(request, {
    bucket: "auth-reset-password",
    limit: 10,
    windowMs: 60_000,
    subject: token || "anon",
  })
  if (limited) return limited

  if (!token) {
    return NextResponse.json(
      { error: "Reset token is required" },
      { status: 400 }
    )
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    )
  }

  try {
    const userId = await consumeToken(token, "password_reset")
    if (!userId) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: "Your password has been reset. You can now sign in.",
    })
  } catch (error) {
    console.error("reset-password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
