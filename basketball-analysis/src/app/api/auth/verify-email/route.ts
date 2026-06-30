import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeToken } from "@/lib/auth/verification"
import { getAppBaseUrl } from "@/lib/auth/mailer"

/**
 * Email verification landing route.
 *
 * The link emailed at signup points here with `?token=`. We consume the
 * single-use "email_verify" token, stamp `User.emailVerified`, and redirect the
 * user back into the app with a status flag. Invalid/expired tokens redirect
 * with an error flag rather than exposing a raw JSON error.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || ""
  const base = getAppBaseUrl()

  const userId = await consumeToken(token, "email_verify")
  if (!userId) {
    return NextResponse.redirect(new URL("/signin?verified=invalid", base))
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    })
  } catch (error) {
    console.error("Failed to mark email verified:", error)
    return NextResponse.redirect(new URL("/signin?verified=error", base))
  }

  return NextResponse.redirect(new URL("/signin?verified=success", base))
}
