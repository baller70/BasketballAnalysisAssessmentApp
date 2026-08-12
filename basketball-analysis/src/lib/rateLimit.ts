/**
 * Simple in-memory fixed-window rate limiter.
 *
 * No external dependency — keyed by IP (or any caller-supplied key). Intended
 * for single-instance / beta deployments. State is per-process and resets on
 * restart; for multi-instance scaling this should be swapped for a shared
 * store (Redis, etc).
 */

import type { NextRequest } from 'next/server'

interface WindowState {
  count: number
  resetAt: number // epoch ms when the current window expires
}

// Map of `${bucket}:${key}` -> window state.
const store = new Map<string, WindowState>()

// Periodically evict expired entries so the map doesn't grow unbounded.
let lastSweep = 0
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k)
  }
}

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Logical bucket name so different routes don't share counters. */
  bucket: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  /** Seconds until the window resets (useful for Retry-After). */
  retryAfter: number
}

/**
 * Client IP for rate-limiting purposes.
 *
 * THE FIRST VERSION TOOK `x-forwarded-for[0]`, WHICH THE CLIENT SETS, so every
 * limit built on it was advisory. Measured on the served build:
 *
 *     14 requests, one fixed XFF     400 x10 then 429 429 429 429   limit works
 *     14 requests, ROTATING XFF      400 x14                        never fires
 *
 * That is not a theoretical weakness. This function guards the six-digit email
 * verification code, whose own route does arithmetic on the limit to argue a
 * code is unguessable; unbounded, a single-use code in a 10^6 space is
 * brute-forcible at throughput. It also guards resend, where rotating the
 * header produced 12 unauthenticated verification emails to one address — a
 * mail bomb, and worse a targeted DENIAL OF VERIFICATION, because issuing a new
 * code deletes the previous one, so the code in the victim's inbox is always
 * stale. And it guards signin, signup, forgot-password and reset-password.
 *
 * `x-forwarded-for` is a list APPENDED to by each proxy, so the entries a
 * client can forge are on the LEFT and the ones a trusted proxy wrote are on
 * the RIGHT. Reading [0] reads the attacker's entry. The only safe read is at a
 * known depth from the right, and the depth is deployment knowledge — so it is
 * configuration, and the default is to trust nothing.
 *
 *   SHOTIQ_TRUSTED_PROXY_HOPS=0  (default) ignore forwarded headers entirely
 *   SHOTIQ_TRUSTED_PROXY_HOPS=1  one proxy in front (the usual single CDN/LB)
 *   SHOTIQ_TRUSTED_PROXY_HOPS=2  two, and so on
 *
 * With 0 and no socket address available the caller is bucketed as 'unknown'.
 * That is deliberately the SAFE direction for a credential guard: everyone
 * shares one bucket, so a brute force is still throttled. It is the wrong
 * direction for availability — one noisy client can exhaust the shared budget —
 * which is exactly why a real deployment should set the hop count rather than
 * leave it at the default.
 */
const TRUSTED_PROXY_HOPS = Math.max(
  0,
  Number.parseInt(process.env.SHOTIQ_TRUSTED_PROXY_HOPS ?? '0', 10) || 0
)

export function getClientIp(request: NextRequest): string {
  // The socket peer, when the runtime exposes it. Unforgeable, so it wins.
  const direct = (request as NextRequest & { ip?: string }).ip
  if (direct) return direct

  if (TRUSTED_PROXY_HOPS > 0) {
    const xff = request.headers.get('x-forwarded-for')
    if (xff) {
      const hops = xff.split(',').map((h) => h.trim()).filter(Boolean)
      // Count from the RIGHT: hop 1 is the entry the nearest trusted proxy
      // wrote, which is the address it saw. Anything further left is client
      // supplied. If the list is shorter than the configured depth the request
      // did not come through the expected chain — do not guess.
      const ip = hops[hops.length - TRUSTED_PROXY_HOPS]
      if (ip) return ip
    }
    const real = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip')
    if (real) return real
  }

  return 'unknown'
}

/**
 * Record a hit for `key` in `bucket` and report whether it's within the limit.
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs, bucket } = options
  const now = Date.now()
  sweep(now)

  const mapKey = `${bucket}:${key}`
  const existing = store.get(mapKey)

  if (!existing || existing.resetAt <= now) {
    store.set(mapKey, { count: 1, resetAt: now + windowMs })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      retryAfter: 0,
    }
  }

  existing.count += 1
  const remaining = Math.max(0, limit - existing.count)
  const success = existing.count <= limit

  return {
    success,
    limit,
    remaining,
    retryAfter: success ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  }
}

/**
 * Convenience: rate-limit a request by client IP and return a ready-to-send
 * 429 Response when the limit is exceeded, or null when the request may proceed.
 */
export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions & { subject?: string }
): { result: RateLimitResult; response: Response | null } {
  // `subject` NARROWS THE BUCKET, and on this deployment it is the only thing
  // that makes an IP-keyed limiter usable at all.
  //
  // `request.ip` is undefined under Next 14.2.28 `next start`, and the default
  // trusted-proxy depth is 0, so `getClientIp` returns 'unknown' for EVERY
  // caller and the whole application shares one bucket. Measured on signin
  // (10/min), with both controls:
  //
  //     victim from .2, correct password        -> 200
  //     attacker sends 10 junk signins from .1  -> 401 x9, then 429
  //     victim again, same correct password     -> 429
  //
  // One client at ten requests a minute locks every user out of the product.
  // That is not a regression from the forwarded-header fix — the old code fell
  // through to 'unknown' for any client that sends no XFF, which is every real
  // browser — but the fix's own comment presented the shared bucket as a
  // deployment hypothetical, and it is the live default.
  //
  // Passing a subject (the attempted email, say) keys the window per ACCOUNT as
  // well as per client, so junk traffic against other addresses cannot consume
  // a given player's budget. It does not fix the global bucket — only real
  // client identity does, via SHOTIQ_TRUSTED_PROXY_HOPS or a runtime that
  // exposes the socket — but it removes the trivial whole-app lockout.
  const ip = getClientIp(request)
  const key = options.subject ? `${ip}|${options.subject}` : ip
  const result = rateLimit(key, options)

  if (!result.success) {
    const response = new Response(
      JSON.stringify({
        error: 'Too many requests. Please slow down and try again shortly.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    )
    return { result, response }
  }

  return { result, response: null }
}
