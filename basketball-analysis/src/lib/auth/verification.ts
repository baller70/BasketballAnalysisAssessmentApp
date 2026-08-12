/**
 * Verification / password-reset token helpers.
 *
 * Backed by the `VerificationToken` table (no FK relation by design — it just
 * stores userId + an opaque single-use token + a type + an expiry). Three token
 * types are used:
 *   - "email_verify"      — confirms a newly registered email address by LINK.
 *   - "email_verify_code" — confirms the same address by a SIX-DIGIT CODE.
 *   - "password_reset"    — authorizes a password change for forgot-password.
 *
 * Tokens are cryptographically random, single-use (consumed on success), and
 * time-limited. Always look a token up via `consumeToken` so it can't be
 * replayed.
 *
 * ---------------------------------------------------------------------------
 * WHY THE CODE IS THIS TABLE AND NOT A NEW ONE
 *
 * iOS 005-verify-email draws a six-box numeric code entry. Before this file
 * changed, nothing in the product could issue or check such a code — the whole
 * verification path was the emailed link — so drawing the boxes would have
 * shipped six controls no endpoint could answer. A six-digit code is this table
 * with a different generator: it wants exactly the properties `issueToken`
 * already has (single-use, TTL'd, prior tokens of the same type invalidated per
 * user) and none that it lacks.
 *
 * The one thing that does not transfer is the lookup. `token` is UNIQUE across
 * the whole table, and six digits are not unique across users — two accounts
 * would collide about once every 1,000 live codes (birthday bound on 1e6). So
 * the stored value is NAMESPACED, `<userId>:<code>`, which is unique by
 * construction and turns "verify this user's code" into exactly the findUnique
 * `consumeToken` already performs. Nothing about the code is guessable from the
 * row: the digits are drawn with `randomInt`, which is rejection-sampled and
 * therefore uniform (`randomBytes(1) % 10` is not — 0-5 would come up 26/256
 * and 6-9 25/256).
 *
 * The LINK path is untouched and still works. Both types are issued together on
 * signup and on resend, both are invalidated per user when a new one is issued,
 * and either one verifies the address on its own.
 */

import { randomBytes, randomInt } from "crypto"
import { prisma } from "@/lib/prisma"

export type VerificationTokenType =
  | "email_verify"
  | "email_verify_code"
  | "password_reset"

// Email verification links live for 24h; password resets are shorter-lived.
// The CODE is shorter-lived still: it is six digits, so its search space is a
// million where the link's is 2^256, and the defence against guessing is short
// life + single use + a rate limit on the endpoint rather than entropy.
const TTL_MS: Record<VerificationTokenType, number> = {
  email_verify: 1000 * 60 * 60 * 24, // 24h
  email_verify_code: 1000 * 60 * 10, // 10min
  password_reset: 1000 * 60 * 60, // 1h
}

/** Digits in an emailed verification code — the six boxes canonical 005 draws. */
export const EMAIL_CODE_LENGTH = 6

/**
 * Seconds a client must wait before asking for another code. Canonical 005
 * draws "Resend code in 0:42", i.e. a countdown mid-flight through this window.
 * The server enforces it too (the resend route is rate limited); this is the
 * number the UI counts down from so the two agree.
 */
export const RESEND_COOLDOWN_SECONDS = 60

/** `<userId>:<code>` — see the header note on why the stored value is namespaced. */
function codeTokenValue(userId: string, code: string): string {
  return `${userId}:${code}`
}

/** Strip formatting a player may paste in ("284 715", "284-715"). */
export function normalizeEmailCode(raw: string): string {
  return (raw || "").replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH)
}

function generateToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Issue a fresh token for a user. Any existing tokens of the same type for that
 * user are deleted first so only the most recent link is valid.
 */
export async function issueToken(
  userId: string,
  type: VerificationTokenType
): Promise<{ token: string; expiresAt: Date }> {
  if (!userId) throw new Error("issueToken: userId is required")

  const token = generateToken()
  const expiresAt = new Date(Date.now() + TTL_MS[type])

  // Invalidate prior tokens of this type for the user (best-effort).
  await prisma.verificationToken.deleteMany({ where: { userId, type } })

  await prisma.verificationToken.create({
    data: { userId, token, type, expiresAt },
  })

  return { token, expiresAt }
}

/**
 * Atomically validate and consume a token. Returns the owning userId on
 * success, or null if the token is unknown, the wrong type, or expired.
 * Expired/used tokens are deleted as a side effect.
 */
export async function consumeToken(
  token: string,
  type: VerificationTokenType
): Promise<string | null> {
  if (!token) return null

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || record.type !== type) return null

  // Always delete the row so the token is single-use, even if expired.
  await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {})

  if (record.expiresAt.getTime() < Date.now()) return null

  return record.userId
}

/**
 * Issue a fresh six-digit email-verification code for a user. Reuses
 * `issueToken`'s namespaced row, so the prior code for that user is deleted
 * first and only the newest one verifies.
 *
 * Returns the code in plaintext because the CALLER has to mail it; it is never
 * returned to a browser.
 */
export async function issueEmailCode(
  userId: string
): Promise<{ code: string; expiresAt: Date }> {
  if (!userId) throw new Error("issueEmailCode: userId is required")

  // randomInt is rejection-sampled and uniform over [0, 10). See the header.
  let code = ""
  for (let i = 0; i < EMAIL_CODE_LENGTH; i += 1) code += String(randomInt(0, 10))

  const type: VerificationTokenType = "email_verify_code"
  const expiresAt = new Date(Date.now() + TTL_MS[type])

  await prisma.verificationToken.deleteMany({ where: { userId, type } })
  await prisma.verificationToken.create({
    data: { userId, token: codeTokenValue(userId, code), type, expiresAt },
  })

  return { code, expiresAt }
}

/**
 * Atomically validate and consume a user's six-digit code. Returns the userId
 * on success and null on any failure (unknown, wrong user, expired, already
 * used) — the caller must not distinguish those to the client.
 *
 * A wrong code deletes nothing, so a typo does not cost the player their code;
 * a right code deletes the row, so it cannot be replayed.
 */
export async function consumeEmailCode(
  userId: string,
  code: string
): Promise<string | null> {
  const digits = normalizeEmailCode(code)
  if (!userId || digits.length !== EMAIL_CODE_LENGTH) return null
  return consumeToken(codeTokenValue(userId, digits), "email_verify_code")
}
