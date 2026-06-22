import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  handleOAuthCallback,
  isSupportedProvider,
  getAppBaseUrl,
} from '@/lib/oauth'
import {
  createSessionToken,
  authCookieOptions,
  AUTH_COOKIE_NAME,
} from '@/lib/authToken'

const STATE_COOKIE_NAME = 'oauth-state'

function redirectWithError(reason: string) {
  return NextResponse.redirect(new URL(`/signin?error=${reason}`, getAppBaseUrl()))
}

/**
 * OAuth callback: validate state, exchange the code, find-or-create the user,
 * issue a session cookie, and redirect to the client hydration page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider
  if (!isSupportedProvider(provider)) {
    return redirectWithError('unsupported_provider')
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const providerError = url.searchParams.get('error')

  if (providerError) return redirectWithError('oauth_denied')
  if (!code || !state) return redirectWithError('oauth_missing_code')

  // Validate anti-forgery state against the httpOnly cookie.
  const stateCookie = request.cookies.get(STATE_COOKIE_NAME)?.value
  if (!stateCookie || stateCookie !== `${provider}:${state}`) {
    return redirectWithError('oauth_state_mismatch')
  }

  let oauthUser
  try {
    oauthUser = await handleOAuthCallback(provider, code)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return redirectWithError('oauth_exchange_failed')
  }

  // Find-or-create the user by email; link the provider on existing accounts.
  let user
  try {
    const existing = await prisma.user.findUnique({
      where: { email: oauthUser.email },
    })

    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          provider: existing.provider || provider,
          providerId: existing.providerId || oauthUser.providerId,
          avatarUrl: existing.avatarUrl || oauthUser.avatarUrl || null,
          displayName: existing.displayName || oauthUser.displayName || null,
        },
        select: { id: true, email: true, profileComplete: true },
      })
    } else {
      user = await prisma.user.create({
        data: {
          email: oauthUser.email,
          password: null,
          provider,
          providerId: oauthUser.providerId,
          firstName: oauthUser.firstName || null,
          lastName: oauthUser.lastName || null,
          displayName:
            oauthUser.displayName ||
            [oauthUser.firstName, oauthUser.lastName].filter(Boolean).join(' ') ||
            oauthUser.email.split('@')[0],
          avatarUrl: oauthUser.avatarUrl || null,
        },
        select: { id: true, email: true, profileComplete: true },
      })
    }
  } catch (dbErr) {
    console.error('OAuth user upsert error:', dbErr)
    return redirectWithError('oauth_db_error')
  }

  // Issue the signed session cookie and clear the state cookie, then redirect
  // to the client page that hydrates the auth store from the session.
  const destination = new URL('/auth/complete', getAppBaseUrl())
  const response = NextResponse.redirect(destination)

  try {
    const token = await createSessionToken({ sub: user.id, email: user.email })
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions())
  } catch (tokenErr) {
    console.error('Failed to issue session token:', tokenErr)
    return redirectWithError('oauth_token_error')
  }

  response.cookies.set(STATE_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return response
}
