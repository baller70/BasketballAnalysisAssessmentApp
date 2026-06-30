import { NextResponse } from 'next/server'

/**
 * Auth providers descriptor.
 *
 * This app uses a custom email/password (credentials) flow — jose-signed
 * httpOnly session JWT + bcrypt — NOT NextAuth and NOT any OAuth provider.
 * This endpoint exists only so generic clients can discover the single
 * supported sign-in method; it advertises nothing we don't actually implement.
 */
export async function GET() {
  return NextResponse.json({
    credentials: {
      id: 'credentials',
      name: 'Email and password',
      type: 'credentials',
      signinUrl: '/api/auth/signin',
      signupUrl: '/api/auth/signup',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
