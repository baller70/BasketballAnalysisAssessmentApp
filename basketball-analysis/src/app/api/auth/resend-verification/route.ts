import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { RESEND_COOLDOWN_SECONDS } from "@/lib/auth/verification"
import { sendVerificationEmail } from "@/lib/auth/verificationEmail"
import { validateCsrf } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/rateLimit"

/**
 * POST /api/auth/resend-verification — re-send the verification email (link AND
 * six-digit code) for a user. Resend RE-SENDS: inside their 10-minute and
 * 24-hour lifetimes the same code and the same link go out again, rather than
 * new ones replacing them. Rotating here was an unauthenticated way to
 * invalidate the credential in someone else's inbox — see `issueEmailCode`.
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
  const subject = session ? `u:${session.userId}` : bodyEmail || "anon"

  const { response: limited } = checkRateLimit(request, {
    bucket: "resend-verification",
    limit: 3,
    windowMs: 60_000,
    subject,
  })
  if (limited) return limited

  // AND A DAILY CEILING, because a per-minute limit is not a limit on VOLUME.
  // Reusing the code (see `issueEmailCode`) removed the ability to invalidate a
  // player's credential by spamming this route, but not the ability to spam it:
  // 3 a minute sustained is 4,320 identical emails a day into one inbox, which
  // is a mail bomb aimed by anyone who knows the address, and it is our sending
  // reputation that pays for it.
  //
  // 10 a day is far above any real use — a player resends once or twice while
  // waiting — and far below a useful weapon.
  //
  // Best-effort, and stated as such: the store is per-process and in memory, so
  // a restart forgives the count and a multi-instance deployment gives each
  // instance its own. A durable cap belongs with the durable store the top of
  // `rateLimit.ts` already says this should become.
  const { response: dayLimited } = checkRateLimit(request, {
    bucket: "resend-verification-daily",
    limit: 10,
    windowMs: 24 * 60 * 60_000,
    subject,
  })
  if (dayLimited) return dayLimited

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
