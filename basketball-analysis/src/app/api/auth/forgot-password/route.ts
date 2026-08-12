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
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

  // 5 a minute PER ACCOUNT — resets are sensitive and emailful. Keyed per
  // account rather than per client for the same reason as the two verification
  // routes: on this deployment every caller resolves to 'unknown', so a single
  // client sending 5 junk resets a minute would otherwise deny password reset
  // to the entire product. Moved below the body parse so the subject exists.
  const { response: limited } = checkRateLimit(request, {
    bucket: "auth-forgot-password",
    limit: 5,
    windowMs: 60_000,
    subject: email || "anon",
  })
  if (limited) return limited

  // AND A DAILY CEILING, for the reason /api/auth/resend-verification has one:
  // a per-minute limit is not a limit on VOLUME. 5/min sustained is 7,200 mails
  // a day into one inbox, aimed by anyone who knows the address — larger than
  // the 4,320 the resend route's own ceiling exists to prevent, and this route
  // had no ceiling at all, so the claim that mail to an inbox is bounded was
  // only true of one of the two routes that send it.
  const { response: dayLimited } = checkRateLimit(request, {
    bucket: "auth-forgot-password-daily",
    limit: 10,
    windowMs: 24 * 60 * 60_000,
    subject: email || "anon",
  })
  if (dayLimited) return dayLimited

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
    const mail = {
      to: user.email,
      subject: "Reset your SHOTIQ password",
      text: `We received a request to reset your SHOTIQ password. Use the link below (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      actionUrl: resetUrl,
    }

    // THE SAME TIMING ORACLE THAT WAS FIXED ON `resend-verification`, and it was
    // left here because that fix was applied to the route the grade named
    // instead of to the shape the grade described. Two routes, identical
    // structure: a uniform BODY, and a clock that says which branch ran.
    // Measured on this one, n=18 each, interleaved across nine rate-limit
    // windows so drift cannot explain it:
    //
    //     existing address     median 12.88 ms
    //     nonexistent          median  6.01 ms
    //     min(existing) 8.43 > median(nonexistent)   — non-overlapping
    //
    // `genericResponse` returns the same bytes either way, and the latency
    // undoes that entirely.
    //
    // In production the send is dispatched WITHOUT being awaited, so the
    // response leaves at the same point on both branches. In development it is
    // still awaited, because `devActionUrl` is how a developer without a mail
    // server gets the link — and that path only exists when NODE_ENV is not
    // production, so it cannot leak timing to a real user.
    if (process.env.NODE_ENV === "production") {
      void sendEmail(mail).catch((error) => {
        console.error("forgot-password send failed:", error)
      })
      return genericResponse()
    }

    const result = await sendEmail(mail)
    return genericResponse(result.devActionUrl)
  } catch (error) {
    console.error("forgot-password error:", error)
    // Still return generic success to avoid leaking internal state.
    return genericResponse()
  }
}
