import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateCsrf } from "@/lib/csrf"
import { issueToken } from "@/lib/auth/verification"
import { sendEmail, getAppBaseUrl } from "@/lib/auth/mailer"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Forgot-password: issues a single-use "password_reset" token and emails the
 * reset link. Always responds with a generic success so the endpoint can't be
 * used to enumerate which emails have accounts. In non-production the reset URL
 * is echoed back to ease local/dev testing (transport is still a stub).
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute per IP — resets are sensitive + emailful.
  const { response: limited } = checkRateLimit(request, {
    bucket: "auth-forgot-password",
    limit: 5,
    windowMs: 60_000,
  })
  if (limited) return limited

  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

  // Generic response used for every outcome (no account enumeration).
  const genericResponse = (devResetUrl?: string) =>
    NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
      ...(devResetUrl ? { devResetUrl } : {}),
    })

  if (!email || !EMAIL_REGEX.test(email)) {
    return genericResponse()
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return genericResponse()
    }

    const { token } = await issueToken(user.id, "password_reset")
    const resetUrl = `${getAppBaseUrl()}/reset-password?token=${token}`
    const result = await sendEmail({
      to: user.email,
      subject: "Reset your SHOTIQ password",
      text: `We received a request to reset your SHOTIQ password. Use the link below (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      actionUrl: resetUrl,
    })

    return genericResponse(result.devActionUrl)
  } catch (error) {
    console.error("forgot-password error:", error)
    // Still return generic success to avoid leaking internal state.
    return genericResponse()
  }
}
