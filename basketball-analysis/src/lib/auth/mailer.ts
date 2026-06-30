/**
 * Pluggable email transport.
 *
 * Email SENDING is intentionally a stub for now: it logs the message (and, in
 * non-production, returns the link so dev/test flows can complete without a
 * mail server). Wire a real transport (Resend, SES, SMTP, Postmark, …) by
 * replacing the body of `sendEmail` — the token flows that call it
 * (verify-email, forgot-password) are already complete and do not need to
 * change.
 */

const APP_NAME = "SHOTIQ"

export interface OutboundEmail {
  to: string
  subject: string
  /** Plain-text body. A real transport would also build an HTML version. */
  text: string
  /** Optional action link surfaced for dev/test convenience. */
  actionUrl?: string
}

export interface SendEmailResult {
  /** Whether the message was accepted by the (stub) transport. */
  sent: boolean
  /**
   * In non-production we echo the action link back so callers can return it to
   * the client / log it. NEVER populated in production.
   */
  devActionUrl?: string
}

/**
 * Send an email. Currently a stub: logs the message server-side. Swap the
 * implementation here to plug in a real provider.
 */
export async function sendEmail(message: OutboundEmail): Promise<SendEmailResult> {
  const isProd = process.env.NODE_ENV === "production"

  // TODO(email-transport): replace with a real provider call, e.g.
  //   await resend.emails.send({ from, to: message.to, subject, text })
  console.info(
    `[mailer:stub] ${APP_NAME} email -> ${message.to} | ${message.subject}` +
      (message.actionUrl ? ` | link: ${message.actionUrl}` : "")
  )

  return {
    sent: true,
    devActionUrl: isProd ? undefined : message.actionUrl,
  }
}

/**
 * Resolve the public base URL used to build links inside emails. Falls back to
 * localhost in development.
 */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  )
}
