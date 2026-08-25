import { NextResponse } from 'next/server'

/**
 * Auth providers descriptor.
 *
 * This app uses a custom email/password (credentials) flow — jose-signed
 * httpOnly session JWT + bcrypt — NOT NextAuth and NOT any OAuth provider.
 * This endpoint exists only so generic clients can discover the single
 * supported sign-in method; it advertises nothing we don't actually implement.
 */
/**
 * PER REQUEST, DECLARED. This handler takes no arguments and reads nothing
 * request-scoped, which is exactly the shape Next 14 classifies as static and
 * PRERENDERS — and that is not hypothetical here: /api/auth/csrf had the same
 * shape and its token was frozen into the dist, shared by every caller, the
 * moment the build started succeeding. This route reports which auth providers are configured, from the environment,
 * so baking one build's answer into the artefact would serve stale data with no
 * error anywhere.
 *
 * It is dynamic today only because Next happens to classify it so. Declaring it
 * removes the dependence on that classification, and docs/shotiq/csrf-gate.mjs
 * now fails if a zero-argument handler appears without this line.
 */
export const dynamic = 'force-dynamic'

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
