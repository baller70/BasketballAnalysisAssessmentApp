import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { CSRF_COOKIE_NAME, CSRF_MAX_AGE } from '@/lib/csrf'

/**
 * CSRF token endpoint (double-submit cookie pattern).
 *
 * Generates a cryptographically-random per-request token, returns it in the
 * JSON body for the client to echo back in the `x-csrf-token` header, and also
 * sets it as a cookie so the server can compare the two. The cookie is
 * intentionally NOT httpOnly so the client can read it for the double-submit
 * comparison.
 */
export async function GET() {
  const csrfToken = randomBytes(32).toString('hex')

  const response = NextResponse.json({ csrfToken })

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_MAX_AGE,
  })

  return response
}
