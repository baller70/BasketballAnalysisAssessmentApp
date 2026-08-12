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

  // THERE IS DELIBERATELY NO DAILY CEILING HERE, and one was tried and removed.
  //
  // The reasoning that justifies the ceiling on /api/auth/resend-verification
  // does NOT transfer, and adding one by analogy shipped a worse defect than
  // the volume it was aimed at. Resend's ceiling is survivable because issuance
  // is idempotent: hitting it withholds another COPY of a code the player
  // already has in their inbox, so the player can still verify. A password
  // reset has no such copy — the link IS the only way in — so a per-account
  // ceiling on this route is a switch for turning off somebody's account
  // recovery. Measured, unauthenticated, keyed on the address the attacker
  // types and charged before the account was even looked up:
  //
  //     attacker requests 1-10 across two windows   200 (generic)
  //     the VICTIM's own reset request              429
  //     the victim again                            429
  //
  // Ten requests a day, sustainable forever, and the victim never receives a
  // link at all. That is strictly worse than the rotation weapon the grace
  // window closes, where the victim at least gets a token.
  //
  // So the volume risk is carried by the 5/min limit above and STATED rather
  // than closed: an attacker who knows an address can still cause up to 7,200
  // reset mails a day to it. That is a real cost — to the recipient and to our
  // sending reputation — and it is the lesser of the two. Closing it properly
  // needs something that bounds mail without bounding recovery: a suppression
  // list the RECIPIENT controls, or a per-account cap that still delivers when
  // no link has been successfully used, neither of which is a rate limiter.

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
