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
 * Best-effort client IP extraction from common proxy headers.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
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
  options: RateLimitOptions
): { result: RateLimitResult; response: Response | null } {
  const ip = getClientIp(request)
  const result = rateLimit(ip, options)

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
