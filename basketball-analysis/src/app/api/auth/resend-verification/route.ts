import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { issueToken } from "@/lib/auth/verification"
import { getAppBaseUrl, sendEmail } from "@/lib/auth/mailer"
import { validateCsrf } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/rateLimit"

/**
 * POST /api/auth/resend-verification — re-send the email-verification link for
 * the signed-in user. issueToken invalidates any previous token, so only the
 * newest link works. Returns whether the account is already verified so the
 * client can show the right state.
 */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const { response: limited } = checkRateLimit(request, {
    bucket: "resend-verification",
    limit: 3,
    windowMs: 60_000,
  })
  if (limited) return limited

  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, emailVerified: true },
  })
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true })
  }

  try {
    const { token } = await issueToken(user.id, "email_verify")
    const verifyUrl = `${getAppBaseUrl()}/api/auth/verify-email?token=${token}`
    await sendEmail({
      to: user.email,
      subject: "Verify your SHOTIQ email",
      text: `Confirm your email to finish setting up your account:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
      actionUrl: verifyUrl,
    })
  } catch (error) {
    console.error("Failed to resend verification email:", error)
    return NextResponse.json(
      { success: false, error: "Could not send the email. Try again shortly." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, alreadyVerified: false, email: user.email })
}

/** GET — report the signed-in user's verification status (for the /verify-email page). */
export async function GET(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, emailVerified: true },
  })
  return NextResponse.json({
    success: true,
    email: user?.email ?? null,
    verified: !!user?.emailVerified,
  })
}
