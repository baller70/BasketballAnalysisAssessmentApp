import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/authToken'
import { validateCsrf } from '@/lib/csrf'

/**
 * Sign out: clears the httpOnly auth-token cookie server-side.
 * The client cannot delete an httpOnly cookie from JS, so it calls this route.
 */
export async function POST(request: NextRequest) {
  // CSRF: reject requests that don't echo the double-submit token.
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const response = NextResponse.json({ success: true })

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
