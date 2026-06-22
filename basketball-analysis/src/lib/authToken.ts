/**
 * Auth token helpers — signed session JWTs.
 *
 * Uses `jose` (already a dependency) to sign/verify an HS256 JWT with
 * process.env.NEXTAUTH_SECRET. Tokens are issued on signin/signup and stored
 * in an httpOnly, secure, sameSite cookie.
 */

import { SignJWT, jwtVerify } from 'jose'

export const AUTH_COOKIE_NAME = 'auth-token'

// 7 days in seconds
export const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7

export interface SessionTokenPayload {
  sub: string // user id
  email: string
}

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Create a signed session JWT (HS256) that expires in 7 days.
 */
export async function createSessionToken(
  payload: SessionTokenPayload
): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_MAX_AGE}s`)
    .sign(getSecretKey())
}

/**
 * Verify and decode a session token. Returns the payload, or null if the
 * token is missing, malformed, expired, or has an invalid signature.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionTokenPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return { sub: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

/**
 * Standard cookie options for the auth token. `secure` is enabled outside of
 * development so local http testing still works.
 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_TOKEN_MAX_AGE,
  }
}
