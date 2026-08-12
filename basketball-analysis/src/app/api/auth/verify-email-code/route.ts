import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { consumeEmailCode, normalizeEmailCode, EMAIL_CODE_LENGTH } from "@/lib/auth/verification"
import { validateCsrf } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/rateLimit"

/**
 * POST /api/auth/verify-email-code — verify an email address with the six-digit
 * code mailed at signup or resend, and stamp `User.emailVerified`.
 *
 * This is the endpoint canonical iOS 005-verify-email's six boxes submit to.
 * The LINK route next door (`/api/auth/verify-email?token=`) is untouched and
 * still works; the two are independent credentials for the same fact.
 *
 * WHO CAN CALL IT. A session is not required, and that is deliberate rather
 * than lax: the code IS the proof of address ownership, and 005 is reached
 * straight out of signup on a phone where the session may not have settled.
 * When a session is present its user wins and the body's `email` is ignored, so
 * a signed-in player can never verify somebody else's address by typing theirs.
 *
 * WHAT A GUESS BUYS. Nothing but the flag: no session is issued, no token is
 * returned, no data is read back. Against that, six digits are guarded by a
 * 10-minute TTL, single use, a per-IP rate limit, and CSRF — the same treatment
 * the sibling auth routes carry (`signup`, `resend-verification`,
 * `reset-password` all call `validateCsrf` first).
 *
 * WHAT IT NEVER SAYS. Unknown address, no code outstanding, wrong code and
 * expired code all return the same 400 with the same message. Distinguishing
 * them would turn this into an account-existence oracle for anyone with a list
 * of addresses.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  // 10 attempts a minute per IP. A million-wide space at that rate is ~95 years
  // to a 50% chance on one live 10-minute code, and the code is single-use.
  const { response: limited } = checkRateLimit(request, {
    bucket: "verify-email-code",
    limit: 10,
    windowMs: 60_000,
  })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const code = normalizeEmailCode(typeof body?.code === "string" ? body.code : "")
  const bodyEmail =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

  const fail = () =>
    NextResponse.json(
      { success: false, error: "That code is incorrect or has expired." },
      { status: 400 }
    )

  if (code.length !== EMAIL_CODE_LENGTH) return fail()

  const session = await getSessionUser(request)
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, emailVerified: true },
      })
    : bodyEmail
      ? await prisma.user.findUnique({
          where: { email: bodyEmail },
          select: { id: true, email: true, emailVerified: true },
        })
      : null

  if (!user) return fail()

  // ALREADY-VERIFIED IS A SUCCESS **ONLY FOR A CALLER WHO IS SIGNED IN**, and
  // the first version of this was an account-existence oracle for exactly the
  // majority of accounts it was written to protect.
  //
  // The comment at the top of this file promises that "unknown address, no code
  // outstanding, wrong code and expired code all return the same 400", so that
  // the route cannot be used to test a list of addresses. This block returned
  // 200 BEFORE the code was checked, for a caller identified only by
  // `body.email`, and echoed the address back:
  //
  //     unverified account, wrong code   -> 400
  //     NONEXISTENT address, wrong code  -> 400
  //     verified account, code 000000    -> 200 {"alreadyVerified":true,"email":…}
  //
  // 400 meant "unknown or unverified" and 200 meant "a registered, verified
  // ShotIQ account" — which in steady state is most of them — to anyone with a
  // list of addresses and no code at all.
  //
  // The reason the end-to-end check missed it is worth keeping: wrong-code was
  // tested only against an UNVERIFIED account, and already-verified only on the
  // SUCCESS path. Both passed. The defect is the product of the two, which is
  // rule 64 — a sweep over one axis licenses a claim about that axis only.
  //
  // Signed in, the short circuit is safe: the session already proves who the
  // caller is, so it tells them nothing they did not know, and it keeps the
  // stated UX for the player who clicked the link and then typed the code.
  // Anonymous, the caller must produce a valid code before this route will
  // confirm anything at all — including that the account exists.
  if (user.emailVerified) {
    if (session) {
      return NextResponse.json({ success: true, alreadyVerified: true, email: user.email })
    }
    const proof = await consumeEmailCode(user.id, code)
    if (!proof) return fail()
    return NextResponse.json({ success: true, alreadyVerified: true, email: user.email })
  }

  const userId = await consumeEmailCode(user.id, code)
  if (!userId) return fail()

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    })
  } catch (error) {
    console.error("Failed to mark email verified from code:", error)
    return NextResponse.json(
      { success: false, error: "Could not verify right now. Try again shortly." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, alreadyVerified: false, email: user.email })
}
