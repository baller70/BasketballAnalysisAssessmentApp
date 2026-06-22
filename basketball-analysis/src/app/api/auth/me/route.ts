import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionToken, AUTH_COOKIE_NAME } from '@/lib/authToken'

/**
 * Return the currently authenticated user based on the signed session cookie.
 * Used by the client to hydrate its auth store (e.g. after an OAuth redirect).
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const session = await verifySessionToken(token)

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        profileComplete: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Failed to load current user:', err)
    return NextResponse.json({ user: null }, { status: 503 })
  }
}
