/**
 * Pluggable email transport.
 *
 * Email is delivered via SMTP using nodemailer. By default it targets the
 * production box's local MTA (127.0.0.1:25); override with SMTP_HOST/SMTP_PORT
 * (and optional SMTP_USER/SMTP_PASS) to point at any other relay. The token
 * flows that call it (verify-email, forgot-password) do not need to change —
 * the function signature and result shape are stable.
 */

import nodemailer, { type Transporter } from "nodemailer"

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
  /** Whether the message was accepted by the transport. */
  sent: boolean
  /**
   * In non-production we echo the action link back so callers can return it to
   * the client / log it. NEVER populated in production.
   */
  devActionUrl?: string
}

/**
 * Lazily-created, reused SMTP transport. Built from env config, defaulting to
 * the production box's local mail server.
 */
let transporter: Transporter | null = null

function getTransport(): Transporter {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST || "127.0.0.1"
  const port = Number(process.env.SMTP_PORT || 25)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  // Local MTAs (e.g. Postfix on the box) often present a self-signed cert for
  // opportunistic STARTTLS. Accept it for localhost; validate for external
  // relays. Override explicitly with SMTP_TLS_REJECT_UNAUTHORIZED=true/false.
  const isLocal = host === "127.0.0.1" || host === "localhost"
  const rejectUnauthorized =
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED != null
      ? process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "true"
      : !isLocal

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    // Only authenticate when both credentials are supplied; the local MTA
    // accepts unauthenticated mail from localhost.
    ...(user && pass ? { auth: { user, pass } } : {}),
    tls: { rejectUnauthorized },
  })

  return transporter
}

/** Default From header; override with EMAIL_FROM. */
function getFrom(): string {
  return process.env.EMAIL_FROM || "SHOTIQ AI <noreply@shotiqai.com>"
}

/** Minimal HTML escaping for values interpolated into the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Build a simple HTML body, surfacing the action link as a button + fallback. */
function buildHtml(message: OutboundEmail): string {
  const safeText = escapeHtml(message.text).replace(/\n/g, "<br />")
  const button = message.actionUrl
    ? `
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(message.actionUrl)}"
           style="display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          ${escapeHtml(message.subject)}
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${escapeHtml(message.actionUrl)}" style="color: #2563eb;">${escapeHtml(message.actionUrl)}</a>
      </p>`
    : ""

  return `<!doctype html>
<html>
  <body style="margin: 0; padding: 0; background: #f3f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width: 480px; background: #ffffff; border-radius: 8px; padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
            <tr>
              <td>
                <h1 style="margin: 0 0 16px; font-size: 20px;">${escapeHtml(APP_NAME)}</h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.5;">${safeText}</p>
                ${button}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Send an email over SMTP. On success returns `{ sent: true }`. On failure the
 * error is logged and `{ sent: false }` is returned (with the dev action link
 * outside production) — this NEVER throws, so auth flows do not 500 when mail
 * delivery is unavailable.
 */
export async function sendEmail(message: OutboundEmail): Promise<SendEmailResult> {
  const isProd = process.env.NODE_ENV === "production"

  try {
    await getTransport().sendMail({
      from: getFrom(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: buildHtml(message),
    })

    console.info(
      `[mailer] ${APP_NAME} email -> ${message.to} | ${message.subject}`
    )

    return {
      sent: true,
      devActionUrl: isProd ? undefined : message.actionUrl,
    }
  } catch (error) {
    console.error(
      `[mailer] failed to send ${APP_NAME} email -> ${message.to} | ${message.subject}`,
      error
    )

    return {
      sent: false,
      devActionUrl: isProd ? undefined : message.actionUrl,
    }
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
