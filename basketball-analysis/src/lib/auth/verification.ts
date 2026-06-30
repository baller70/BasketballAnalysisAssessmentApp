/**
 * Verification / password-reset token helpers.
 *
 * Backed by the `VerificationToken` table (no FK relation by design — it just
 * stores userId + an opaque single-use token + a type + an expiry). Two token
 * types are used:
 *   - "email_verify"   — confirms a newly registered email address.
 *   - "password_reset" — authorizes a password change for forgot-password.
 *
 * Tokens are cryptographically random, single-use (consumed on success), and
 * time-limited. Always look a token up via `consumeToken` so it can't be
 * replayed.
 */

import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

export type VerificationTokenType = "email_verify" | "password_reset"

// Email verification links live for 24h; password resets are shorter-lived.
const TTL_MS: Record<VerificationTokenType, number> = {
  email_verify: 1000 * 60 * 60 * 24, // 24h
  password_reset: 1000 * 60 * 60, // 1h
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
