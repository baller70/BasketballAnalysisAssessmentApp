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
 * already has (single-use, TTL'd, one live token per user per type) and none
 * that it lacks.
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
 * signup and on resend, there is at most ONE live token per user per type, and
 * either one verifies the address on its own. Issuing while a live token exists
 * REUSES it rather than replacing it — see `issueToken`/`issueEmailCode` for why
 * rotating was a denial-of-verification weapon rather than a hygiene measure.
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
 * Issue the token of `type` for a user: the live one if there is one, a fresh
 * one otherwise. There is at most one row per (user, type), enforced by a unique
 * constraint rather than by the order of two statements.
 */
export async function issueToken(
  userId: string,
  type: VerificationTokenType
): Promise<{ token: string; expiresAt: Date }> {
  if (!userId) throw new Error("issueToken: userId is required")

  // REUSED INSIDE ITS TTL, for the reason spelled out on `issueEmailCode`:
  // rotating on every issue turns an unauthenticated "send me my link" endpoint
  // into a way to invalidate the link already sitting in someone else's inbox.
  // That applies to the emailed verification LINK exactly as it applies to the
  // code, and to `password_reset` too — spamming forgot-password would
  // otherwise keep a victim's reset link permanently stale. The TTL is not
  // extended, so a token still dies at its original expiry.
  const existing = await prisma.verificationToken.findUnique({
    where: { uniq_verification_token_user_type: { userId, type } },
  })
  if (existing && existing.expiresAt.getTime() > Date.now()) {
    return { token: existing.token, expiresAt: existing.expiresAt }
  }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + TTL_MS[type])

  // ONE STATEMENT, NOT TWO. This was deleteMany-then-create, which makes the
  // "one live token per user per type" invariant in this file's header true only
  // when nothing races: measured, three concurrent issues left three live rows
  // for one user and the oldest still verified. The upsert targets the
  // (userId, type) unique constraint added to the schema for this, so the
  // database — not the ordering of two round trips — enforces the invariant.
  await prisma.verificationToken.upsert({
    where: { uniq_verification_token_user_type: { userId, type } },
    create: { userId, token, type, expiresAt },
    update: { token, expiresAt },
  })

  // Read back rather than trust our own write, so two racing issuers converge
  // on the row's value instead of one mailing a token that was overwritten.
  const stored = await prisma.verificationToken.findUnique({
    where: { uniq_verification_token_user_type: { userId, type } },
  })
  if (stored && stored.expiresAt.getTime() > Date.now()) {
    return { token: stored.token, expiresAt: stored.expiresAt }
  }
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

  // THE DELETE IS THE LOCK, so its result has to be read. This was
  // `delete(...).catch(() => {})`, i.e. findUnique-check-delete with the
  // outcome discarded, and two concurrent submissions of one token therefore
  // both returned success — each found the row, and one of the two deletes was
  // a no-op nobody looked at. `deleteMany` reports how many rows it actually
  // removed, and exactly one racer can get 1, so that racer is the one that
  // consumed the token.
  //
  // A wrong TYPE still returns above without deleting, so a password-reset
  // token submitted to a verify route does not destroy it (there is no
  // cross-type denial-of-service here).
  const { count } = await prisma.verificationToken
    .deleteMany({ where: { id: record.id } })
    .catch(() => ({ count: 0 }))
  if (count !== 1) return null

  if (record.expiresAt.getTime() < Date.now()) return null

  return record.userId
}

/**
 * Issue the six-digit email-verification code for a user — REUSING the live one
 * if there is one, rather than rotating it.
 *
 * WHY REUSE IS THE SECURITY FIX, not a convenience. Rotating on every issue is
 * what made this a weapon. Resend is unauthenticated and takes an address, so
 * anyone who knows a player's email could call it and invalidate the code that
 * player is reading out of their inbox. Measured before this change, and the
 * negative control is what makes it a measurement:
 *
 *     victim signs up, is mailed          567977
 *     attacker calls resend 4x            200 200 200 429
 *     victim submits 567977               400  "incorrect or has expired"
 *     control: submit the NEW code        200  success
 *
 * At 3/min that denies verification permanently AND mails the victim 4,320
 * messages a day. The per-account rate limit cannot help: the account IS the
 * thing being attacked, so keying on it only makes the attack precise. The
 * limiter's KEY was fixed in the round before this one; its VALUE — what a
 * request is allowed to DO — was not, and that was the actual hole.
 *
 * Issuance is therefore IDEMPOTENT inside the TTL. A resend re-sends the code
 * the player already has instead of replacing it, so an attacker calling it
 * changes nothing at all. This is also what a player means by "resend".
 *
 * THE TTL IS NOT EXTENDED. The reused row keeps its original `expiresAt`, so a
 * code still dies 10 minutes after it was FIRST issued and reuse cannot be used
 * to hold one alive indefinitely. Total exposure is unchanged.
 *
 * Returns the code in plaintext because the CALLER has to mail it; it is never
 * returned to a browser.
 */
export async function issueEmailCode(
  userId: string
): Promise<{ code: string; expiresAt: Date }> {
  if (!userId) throw new Error("issueEmailCode: userId is required")

  const type: VerificationTokenType = "email_verify_code"

  const live = await readLiveCode(userId, type)
  if (live) return live

  // randomInt is rejection-sampled and uniform over [0, 10). See the header.
  let code = ""
  for (let i = 0; i < EMAIL_CODE_LENGTH; i += 1) code += String(randomInt(0, 10))
  const expiresAt = new Date(Date.now() + TTL_MS[type])

  // Atomic against the (userId, type) constraint — three concurrent resends
  // used to leave three live codes with the oldest still verifying.
  await prisma.verificationToken.upsert({
    where: { uniq_verification_token_user_type: { userId, type } },
    create: { userId, token: codeTokenValue(userId, code), type, expiresAt },
    update: { token: codeTokenValue(userId, code), expiresAt },
  })

  // READ BACK RATHER THAN TRUST OUR OWN WRITE. If two requests both found no
  // live code, both upsert and the second overwrites the first — so the caller
  // that wrote first would otherwise mail a code that is no longer stored. The
  // row is the truth; return what it actually holds.
  return (await readLiveCode(userId, type)) ?? { code, expiresAt }
}

/** The user's live (unexpired) code, or null. Shape-checked, not just present. */
async function readLiveCode(
  userId: string,
  type: VerificationTokenType
): Promise<{ code: string; expiresAt: Date } | null> {
  const row = await prisma.verificationToken.findUnique({
    where: { uniq_verification_token_user_type: { userId, type } },
  })
  if (!row || row.expiresAt.getTime() <= Date.now()) return null
  const code = row.token.slice(row.token.indexOf(":") + 1)
  if (code.length !== EMAIL_CODE_LENGTH) return null
  return { code, expiresAt: row.expiresAt }
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
