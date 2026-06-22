/**
 * CSRF protection — double-submit cookie pattern.
 *
 * Flow:
 *  1. Client calls GET /api/auth/csrf, which sets a non-httpOnly `csrf-token`
 *     cookie and returns the same token in the JSON body.
 *  2. On any state-changing request (POST signin/signup/signout), the client
 *     echoes the token back in the `x-csrf-token` header.
 *  3. The server compares the header to the cookie. A match proves the request
 *     originated from our own page (an attacker's cross-site form can send the
 *     cookie but cannot read it to set the matching header).
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export const CSRF_COOKIE_NAME = 'csrf-token'
export const CSRF_HEADER_NAME = 'x-csrf-token'
export const CSRF_MAX_AGE = 60 * 60 * 24 // 24h

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Validate the CSRF token on a state-changing request. Returns a 403 response
 * when the check fails, or null when the request is allowed to proceed.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }

  return null
}
