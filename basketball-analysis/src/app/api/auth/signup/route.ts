import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateCsrf } from "@/lib/csrf"
import {
  createSessionToken,
  authCookieOptions,
  AUTH_COOKIE_NAME,
} from "@/lib/authToken"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 signups per minute per IP.
  const { response: limited } = checkRateLimit(request, {
    bucket: 'auth-signup',
    limit: 5,
    windowMs: 60_000,
  })
  if (limited) return limited

  // CSRF: reject requests that don't echo the double-submit token.
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const firstName = typeof body?.firstName === 'string' ? body.firstName : undefined
    const lastName = typeof body?.lastName === 'string' ? body.lastName : undefined

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      )
    }

    // Check if user already exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      })
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        { error: "Database connection failed. 503" },
        { status: 503 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        displayName: firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        createdAt: true,
        profileComplete: true,
      },
    })

    const res = NextResponse.json({ user }, { status: 201 })

    // Issue a signed, httpOnly session token.
    try {
      const token = await createSessionToken({ sub: user.id, email: user.email })
      res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions())
    } catch (tokenError) {
      console.error("Failed to issue session token:", tokenError)
    }

    return res
  } catch (error) {
    console.error("Sign up error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's a Prisma/database error
    if (errorMessage.includes("P1001") || errorMessage.includes("P1002") || errorMessage.includes("Can't reach database") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("Connection refused") || errorMessage.includes("timed out")) {
      return NextResponse.json(
        { error: "Database connection failed. 503" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
