import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import {
  buildAuthorizationUrl,
  isProviderConfigured,
  isSupportedProvider,
  getAppBaseUrl,
} from '@/lib/oauth'

const STATE_COOKIE_NAME = 'oauth-state'

/**
 * Start the OAuth flow: generate an anti-forgery `state`, stash it in a
 * short-lived httpOnly cookie, and redirect the user to the provider.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider

  if (!isSupportedProvider(provider)) {
    return NextResponse.redirect(
      new URL('/signin?error=unsupported_provider', getAppBaseUrl())
    )
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(
      new URL(`/signin?error=${provider}_not_configured`, getAppBaseUrl())
    )
  }

  const state = randomBytes(16).toString('hex')
  const authUrl = buildAuthorizationUrl(provider, state)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(STATE_COOKIE_NAME, `${provider}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  return response
}
