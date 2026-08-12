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
/**
 * How long a `password_reset` token is protected from rotation. See the long
 * note in `issueToken`: reuse cannot revoke a leaked link and rotation can be
 * weaponised into a denial of account recovery, so a reset token is immutable
 * for this window and rotatable after it.
 */
const RESET_GRACE_MS = 1000 * 60 * 15

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

  // REUSE IS RIGHT FOR A VERIFICATION CREDENTIAL AND WRONG FOR A RESET ONE, and
  // the previous version of this applied one policy to both and called it
  // obvious.
  //
  // The case FOR reuse (see `issueEmailCode`): rotating on every issue turns an
  // unauthenticated "send me my link" endpoint into a way to invalidate the
  // credential already sitting in someone else's inbox. The victim is READING
  // something they already have, so rotation is a weapon aimed at them.
  //
  // The case AGAINST it for `password_reset`: there the victim is not reading an
  // old mail, they are REQUESTING a new one and reading the newest. Rotation
  // makes the freshest request win, and the freshest request is theirs. Reuse
  // removes the universal remedy for a leaked reset link — "request a new one,
  // which kills the old one" — and hands the same live token back for the rest
  // of the hour with no user-reachable way to revoke it. Measured: two
  // forgot-password calls returned byte-identical tokens with the same expiry.
  //
  // The two risks are not the same size. A stale verification code is an
  // availability nuisance against an address; a live reset link that cannot be
  // revoked is an account-takeover credential.
  //
  // BUT ROTATION IS A WEAPON TOO, and shipping it unqualified was measured as an
  // unauthenticated, indefinite denial of account RECOVERY:
  //
  //     victim requests a reset          -> link d343f28c…
  //     attacker POSTs the same address  -> 200, rotated to e23982a5…
  //     victim clicks THEIR link         -> 400 "invalid or has expired"
  //
  // 3/3, with the newest link succeeding as the positive control. Any victim's
  // link is dead within seconds, forever, for anyone who knows the address —
  // the exact mirror of the denial-of-verification weapon reuse was introduced
  // to close. Neither policy is safe on its own: reuse cannot revoke, rotation
  // can be weaponised.
  //
  // A GRACE WINDOW buys both. A token younger than `RESET_GRACE_MS` is reused,
  // so an attacker hammering the endpoint cannot invalidate a link the player
  // is walking to their inbox to click; once it is older than that, a fresh
  // request rotates, so a leaked link still has a user-reachable remedy. The
  // cost is stated rather than hidden: a leaked link stays live for up to the
  // grace window after the player asks for a new one, and a player who waits
  // longer than the grace window gets a new link (which is what they asked
  // for). 15 minutes against a 1-hour TTL puts the denial window well inside
  // the time it takes to read a mail, and the revocation delay well inside the
  // token's life.
  const existing = await prisma.verificationToken.findUnique({
    where: { uniq_verification_token_user_type: { userId, type } },
  })
  const live = !!existing && existing.expiresAt.getTime() > Date.now()
  const reusable =
    type !== "password_reset" ||
    (!!existing && existing.createdAt.getTime() > Date.now() - RESET_GRACE_MS)
  if (live && reusable && existing) {
    return { token: existing.token, expiresAt: existing.expiresAt }
  }

  return claimToken(userId, type, generateToken(), reusable)
}

/**
 * Write the (user, type) row in ONE statement and return what the row actually
 * holds. This is the primitive both issuers share.
 *
 * WHY IT IS RAW SQL. The previous version was `upsert` then `findUnique` —
 * "read back rather than trust our own write". Two round trips are not atomic,
 * and the interleave `A.upsert -> A.read -> B.upsert -> B.read` leaves A holding
 * a token that is no longer stored. Measured with an SMTP sink reading the
 * actual mail, 8 trials of two concurrent resends: **3 diverged**, e.g.
 * stored 060409 while the two mails carried 060409 and 865084. A player who
 * double-taps Resend gets two mails seconds apart and the first one's code is
 * dead. The comment there claimed the opposite in as many words, which is why
 * this now returns the row Postgres wrote rather than the row we hoped it wrote.
 *
 * `ON CONFLICT ... DO UPDATE ... WHERE expires_at <= now()` makes the whole
 * decision inside the database: a live row is left alone and NO row comes back,
 * an expired or absent one is replaced and the new row comes back. The empty
 * result is therefore meaningful — it says "someone else's live token won" —
 * and the follow-up SELECT reads that winner. Both racers converge on the same
 * value because both lost the same way.
 *
 * `reusable: false` (password_reset) drops the WHERE, so the row is always
 * replaced and the newest request always wins.
 */
async function claimToken(
  userId: string,
  type: VerificationTokenType,
  token: string,
  reusable: boolean
): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + TTL_MS[type])
  const id = randomBytes(12).toString("hex")

  // EVERY TIMESTAMP HERE IS EXPLICITLY UTC, and leaving that implicit was a
  // total, deployment-dependent failure of the product's whole credential
  // layer.
  //
  // `expires_at` is `timestamp(3) WITHOUT TIME ZONE`. Prisma's typed client
  // converts a JS Date to UTC before writing one; a raw parameter is handed to
  // Postgres, which resolves it in the SESSION's TimeZone. Moving from `upsert`
  // to `$queryRaw` therefore changed the meaning of the same Date. One
  // variable, both paths, under TimeZone='Europe/Berlin':
  //
  //     prisma typed create   JS wrote 15:08:36Z  ->  stored 15:08:36   correct
  //     $queryRaw (unfixed)   JS wrote 15:07:44Z  ->  stored 17:07:44   +2h
  //
  // West of UTC the offset is negative, so a 10-minute code is born already
  // expired and email verification returns "incorrect or has expired" for
  // everyone — measured 3/3 under America/New_York, against a 3/3 control on
  // the same build with the session reset to UTC. East of UTC the sign flips
  // and the code lives 10 minutes PLUS the offset, which quietly falsifies the
  // brute-force arithmetic the verify route argues from. `email_verify` and
  // `password_reset` are the same column and inherit both halves.
  //
  // A default `initdb` takes the TimeZone from the host, so this is invisible
  // on a UTC container and fatal on a self-hosted box — the deployment this
  // repository documents. `AT TIME ZONE 'UTC'` reads the parameter as an
  // instant and writes the naive column in UTC, and `now() AT TIME ZONE 'UTC'`
  // compares against the same clock, so neither the write nor the freshness
  // test depends on the session any more.
  const rows = reusable
    ? await prisma.$queryRaw<Array<{ token: string; expires_at: Date }>>`
        INSERT INTO verification_tokens (id, user_id, token, type, expires_at)
        VALUES (${id}, ${userId}, ${token}, ${type}, ${expiresAt}::timestamptz AT TIME ZONE 'UTC')
        ON CONFLICT (user_id, type) DO UPDATE
          SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
          WHERE verification_tokens.expires_at <= (now() AT TIME ZONE 'UTC')
        RETURNING token, expires_at`
    : await prisma.$queryRaw<Array<{ token: string; expires_at: Date }>>`
        INSERT INTO verification_tokens (id, user_id, token, type, expires_at)
        VALUES (${id}, ${userId}, ${token}, ${type}, ${expiresAt}::timestamptz AT TIME ZONE 'UTC')
        ON CONFLICT (user_id, type) DO UPDATE
          SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
        RETURNING token, expires_at`

  if (rows.length === 1) {
    return { token: rows[0].token, expiresAt: rows[0].expires_at }
  }

  // No row came back: a LIVE row blocked the update, so read the winner.
  const held = await prisma.verificationToken.findUnique({
    where: { uniq_verification_token_user_type: { userId, type } },
  })
  if (held) return { token: held.token, expiresAt: held.expiresAt }
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

  // ONE statement, via the shared primitive — see `claimToken` for why the
  // upsert-then-read this replaced mailed a dead code in 3 of 8 concurrent
  // trials. The value returned is the one Postgres actually holds, so two
  // racing resends mail the same code.
  const claimed = await claimToken(userId, type, codeTokenValue(userId, code), true)
  return {
    code: claimed.token.slice(claimed.token.indexOf(":") + 1),
    expiresAt: claimed.expiresAt,
  }
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
