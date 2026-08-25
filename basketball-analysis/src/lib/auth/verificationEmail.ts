/**
 * The one place that composes and sends a verification email.
 *
 * Signup and resend used to build the same message twice, and when the
 * six-digit code was added for iOS 005-verify-email that would have been two
 * places to forget it — the exact shape of defect that ships a screen whose
 * code boxes no email ever fills. Both paths call this instead, so the code the
 * player is asked for is the code the player is sent, by construction.
 *
 * BOTH credentials go out together and either one verifies the address:
 *   - the LINK (`email_verify`, 24h) — the pre-existing web path, unchanged;
 *   - the CODE (`email_verify_code`, 10min) — what canonical 005 draws.
 * Issuing one does not invalidate the other; each type is invalidated per user
 * within its own type by `issueToken`/`issueEmailCode`.
 */

import { issueToken, issueEmailCode, EMAIL_CODE_LENGTH } from "@/lib/auth/verification"
import { getAppBaseUrl, sendEmail, type SendEmailResult } from "@/lib/auth/mailer"

export interface VerificationDispatch {
  result: SendEmailResult
  /** The emailed code. NEVER return this to a browser. */
  code: string
  verifyUrl: string
}

/** Group the digits 284-715 so they are readable in a mail client. */
function readable(code: string): string {
  const half = Math.floor(EMAIL_CODE_LENGTH / 2)
  return `${code.slice(0, half)} ${code.slice(half)}`
}

export async function sendVerificationEmail(
  userId: string,
  email: string,
  opts: { welcome?: boolean } = {}
): Promise<VerificationDispatch> {
  const [{ token }, { code }] = await Promise.all([
    issueToken(userId, "email_verify"),
    issueEmailCode(userId),
  ])

  const verifyUrl = `${getAppBaseUrl()}/api/auth/verify-email?token=${token}`
  // The screen that ASKS for the code has to be reachable from the mail that
  // carries it, or the code is a credential with nowhere to be typed. The
  // address rides in the query only so the screen can name it back; the code is
  // always checked against the account the server resolves, never against this
  // string.
  const codeUrl = `${getAppBaseUrl()}/verify-email?email=${encodeURIComponent(email)}`
  const opening = opts.welcome
    ? "Welcome to SHOTIQ! Confirm your email to finish setting up your account."
    : "Confirm your email to finish setting up your account."

  const result = await sendEmail({
    to: email,
    subject: "Verify your SHOTIQ email",
    text:
      `${opening}\n\n` +
      `Your verification code is ${readable(code)}\n` +
      `Enter it here — the code expires in 10 minutes:\n\n${codeUrl}\n\n` +
      `Or open this link instead and we will confirm it for you. It works for ` +
      `24 hours:\n\n${verifyUrl}`,
    actionUrl: verifyUrl,
  })

  return { result, code, verifyUrl }
}
