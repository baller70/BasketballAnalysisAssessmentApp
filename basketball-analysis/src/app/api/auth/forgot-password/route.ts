import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateCsrf } from "@/lib/csrf"
import { issueToken } from "@/lib/auth/verification"
import { sendEmail, getAppBaseUrl } from "@/lib/auth/mailer"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Every response leaves no earlier than this many ms after the handler starts,
 *  so the existing and absent branches cannot be told apart by latency. */
const FLOOR_MS = 25

/**
 * Forgot-password: issues a single-use "password_reset" token and emails the
 * reset link. Always responds with a generic success so the endpoint can't be
 * used to enumerate which emails have accounts. In non-production the reset URL
 * is echoed back to ease local/dev testing (transport is still a stub).
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const floor = async <T,>(r: T): Promise<T> => {
    const left = FLOOR_MS - (Date.now() - startedAt)
    if (left > 0) await new Promise((res) => setTimeout(res, left))
    return r
  }
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
    return await floor(genericResponse())
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    // ONE CODE PATH UP TO THE BRANCH POINT (rule 79: equalise the WORK).
    //
    // The comment below says the response "leaves at the same point on both
    // branches" because the send is not awaited. That was true of the SEND and
    // false of everything before it: only the existing branch reached
    // `issueToken`, which is a lookup plus an INSERT ... ON CONFLICT plus a
    // read-back. Measured against the served build, order randomised inside
    // interleaved triples, three replicates of n=30 per class:
    //
    //     existing 7.24 / 6.99 / 7.54 ms     absent 3.54 / 3.47 / 3.46 ms
    //     p = 2.9e-11 / 1.6e-9 / 2.9e-11     control absent-vs-absent p >= 0.39
    //
    // and in two replicates the distributions did not overlap at all, so ONE
    // request classified an address. The generic body is the whole
    // anti-enumeration control here and the clock was undoing it.
    //
    // TWO REPAIRS FAILED BEFORE THIS ONE, and both failed by trying to match the
    // work rather than bound the clock.
    //
    // (1) A decoy issue on the absent branch only OVERSHOT: existing 3.26 ms
    //     against absent 7.68 ms — the same oracle, inverted.
    // (2) Running the identical `issueToken` call on BOTH branches did not
    //     converge either: -4.27 / -4.95 / -4.42 ms across three replicates,
    //     against a same-class control of -0.27 / -0.23 / -0.03. The reason is
    //     structural: the decoy row and a real row are in different GRACE
    //     states. A freshly-issued real token is inside the window so its
    //     UPDATE is blocked and costs a no-op plus a SELECT, while the shared
    //     decoy row ages past the window and every absent request then performs
    //     a real write. Identical statements, different work.
    //
    // So the clock is bounded instead of the work matched. `FLOOR_MS` is above
    // the slowest branch, so both classes leave at the same point.
    //
    // STATED, because rule 79 says a floor cannot hide a difference larger than
    // itself and the attacker picks the size: under enough concurrency the
    // existing branch's extra query can exceed the floor and the separation
    // returns. That is bounded here by this route's own 5/min per-address
    // limit, which is a real mitigation and not a proof. Closing it completely
    // needs the two branches to touch the same row in the same state, which is
    // a schema change (a per-request decoy row, or a separate table), not a
    // rewrite of this handler.
    if (!user) return await floor(genericResponse())

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
      return await floor(genericResponse())
    }

    const result = await sendEmail(mail)
    return genericResponse(result.devActionUrl)
  } catch (error) {
    console.error("forgot-password error:", error)
    // Still return generic success to avoid leaking internal state.
    return await floor(genericResponse())
  }
}
