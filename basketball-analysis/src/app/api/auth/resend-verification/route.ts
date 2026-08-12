import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { RESEND_COOLDOWN_SECONDS } from "@/lib/auth/verification"
import { sendVerificationEmail } from "@/lib/auth/verificationEmail"
import { validateCsrf } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/rateLimit"

/**
 * POST /api/auth/resend-verification — re-send the verification email (link AND
 * six-digit code) for a user. Issuing invalidates the previous link and the
 * previous code, so only the newest of each works.
 *
 * IDENTIFYING THE USER. A session identifies it when there is one. Failing
 * that, an `email` in the body does — because the player 005 is written for has
 * just created an account on a phone and may not have a settled session, and a
 * "Resend email" button that only works when signed in is a button that does
 * not work at the one moment it is needed.
 *
 * NOT AN EXISTENCE ORACLE. In the anonymous case the response is the SAME
 * whether or not the address belongs to an account, and it never echoes the
 * address back. That is the same treatment /api/auth/forgot-password gives the
 * same question. In the session case the address is the caller's own, so it is
 * returned — they already know it.
 *
 * `cooldownSeconds` is the number the UI counts down from ("Resend code in
 * 0:42" on canonical 005). It comes from the server so the countdown and the
 * rate limit below cannot disagree.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const body = await request.json().catch(() => null)
  const bodyEmail =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

  const session = await getSessionUser(request)

  // 3 a minute PER ACCOUNT, and the per-account part is the fix. Keyed on the
  // client alone it was keyed on nothing — `request.ip` is undefined under
  // `next start` and the default trusted-proxy depth is 0, so every caller
  // shared one 3/min budget. Measured: three junk resends at other addresses
  // made a real player's own "Resend code" return 429; after the window,
  // victim-first returned 200. Three requests a minute, unauthenticated, denied
  // this screen's other action to everyone.
  //
  // The limiter sits below the body parse so there is a subject to key on. The
  // cooldown this route reports is per account too, so the limit and the
  // countdown still cannot disagree.
  const { response: limited } = checkRateLimit(request, {
    bucket: "resend-verification",
    limit: 3,
    windowMs: 60_000,
    subject: session ? `u:${session.userId}` : bodyEmail || "anon",
  })
  if (limited) return limited

  if (!session) {
    if (!bodyEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: bodyEmail },
      select: { id: true, email: true, emailVerified: true },
    })
    // UNIFORM IN CONTENT, AND NOW UNIFORM IN TIME. The comment that stood here
    // said "the work is skipped, the answer is not distinguishable" — and the
    // body was indistinguishable while the CLOCK was not, because the send was
    // awaited only when the account existed. Measured, 8 samples each:
    //
    //     existing, unverified   9-13 ms
    //     nonexistent             5-8 ms     non-overlapping
    //
    // So an attacker read the answer off the latency instead of the payload,
    // which is the same oracle the uniform response was written to deny. The
    // send is now dispatched WITHOUT being awaited, so the response leaves at
    // the same point on both paths.
    //
    // Stated rather than hidden: a smaller difference remains in the lookup
    // itself — a row found and a row missed are not identical work — and
    // closing that needs a constant-time floor on the whole handler. This
    // removes the millisecond-scale signal that was actually measurable, not
    // every conceivable one.
    if (user && !user.emailVerified) {
      void sendVerificationEmail(user.id, user.email).catch((error) => {
        console.error("Failed to resend verification email:", error)
      })
    }
    return NextResponse.json({
      success: true,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, emailVerified: true },
  })
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true, email: user.email })
  }

  try {
    await sendVerificationEmail(user.id, user.email)
  } catch (error) {
    console.error("Failed to resend verification email:", error)
    return NextResponse.json(
      { success: false, error: "Could not send the email. Try again shortly." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    alreadyVerified: false,
    email: user.email,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  })
}

/** GET — report the signed-in user's verification status (for the /verify-email page). */
export async function GET(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, emailVerified: true },
  })
  return NextResponse.json({
    success: true,
    email: user?.email ?? null,
    verified: !!user?.emailVerified,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  })
}
