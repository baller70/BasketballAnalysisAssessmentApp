import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/authToken'

/**
 * Sign out: clears the httpOnly auth-token cookie server-side.
 * The client cannot delete an httpOnly cookie from JS, so it calls this route.
 */
export async function POST() {
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
