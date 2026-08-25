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

  /**
   * ONE DAILY BUDGET PER ACCOUNT, spent only when mail is actually sent.
   *
   * A per-minute limit is not a limit on VOLUME: 3/min sustained is 4,320
   * identical emails a day into one inbox, aimed by anyone who knows the
   * address. So there is a ceiling. But the first version keyed it on the same
   * `subject` as the per-minute limit, which resolves to the ADDRESS when the
   * caller is anonymous and to `u:<id>` when they are signed in — two budgets
   * for one account. Measured, that was worth two things, both wrong: the real
   * ceiling on mail to one inbox was 20/day rather than 10, and eleven
   * unauthenticated requests locked an ANONYMOUS player out of resend for 24
   * hours — exactly the player this route's own comment says it exists for.
   *
   * Keyed on the resolved account's address, both callers share one budget, and
   * it is charged where the cost is: next to the send, after the account is
   * known, so a request naming an address that does not exist cannot spend
   * anyone's.
   *
   * WHAT HITTING IT COSTS A PLAYER, stated rather than glossed: not
   * verification. Issuance is idempotent now, so the code already in their
   * inbox stays valid for its TTL and still verifies — the ceiling withholds
   * another COPY of a credential they already hold. The residual case is a
   * player whose mail never arrived and who needs a fresh send on a day an
   * attacker has spent the budget; that is real, and it is why the number is 10
   * and not 3.
   *
   * Best-effort: the store is per-process and in memory, so a restart forgives
   * the count and each instance of a multi-instance deployment keeps its own. A
   * durable cap belongs with the durable store `rateLimit.ts` already says this
   * should become.
   */
  const dailyCeiling = (accountEmail: string) =>
    !!checkRateLimit(request, {
      bucket: "resend-verification-daily",
      limit: 10,
      windowMs: 24 * 60 * 60_000,
      subject: `acct:${accountEmail}`,
    }).response

  // A CHEAP GUARD ON WORK, keyed on whatever the caller typed. This exists only
  // to bound how much lookup an unidentified caller can force before the real
  // limit is reached; it is deliberately loose, because a tight limit keyed on
  // an attacker-chosen string is a lockout waiting to happen.
  const { response: floodLimited } = checkRateLimit(request, {
    bucket: "resend-verification-flood",
    limit: 20,
    windowMs: 60_000,
    subject,
  })
  if (floodLimited) return floodLimited

  /**
   * THE COOLDOWN, and it is ONE budget per account.
   *
   * This was keyed on `subject`, which resolves to the ADDRESS for an anonymous
   * caller and to `u:<id>` for a signed-in one — two budgets for one account.
   * Measured on a single account inside one minute: 3 of 4 anonymous requests
   * accepted AND 3 of 4 signed-in requests accepted, i.e. 6 sends where the
   * comment promises 3. That is the identical defect the daily ceiling below
   * had, one line above it, fixed there and not here.
   *
   * Keyed on the resolved account and charged where the cost is, both callers
   * share one 3/min window, so `RESEND_COOLDOWN_SECONDS` and the limit agree
   * for a player who signs in halfway through the countdown.
   */
  const perMinute = (accountEmail: string) =>
    !!checkRateLimit(request, {
      bucket: "resend-verification",
      limit: 3,
      windowMs: 60_000,
      subject: `acct:${accountEmail}`,
    }).response

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
      if (perMinute(user.email) || dailyCeiling(user.email)) {
        // Uniform with the success shape: refusing differently here would say
        // "this address exists and has been mailed a lot today".
        return NextResponse.json({ success: true, cooldownSeconds: RESEND_COOLDOWN_SECONDS })
      }
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

  if (perMinute(user.email)) {
    return NextResponse.json({
      success: false,
      error: "Please wait a moment before asking for another email.",
    }, { status: 429 })
  }

  if (dailyCeiling(user.email)) {
    return NextResponse.json({
      success: false,
      error: "That address has been sent too many emails today. Try again tomorrow.",
    }, { status: 429 })
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
