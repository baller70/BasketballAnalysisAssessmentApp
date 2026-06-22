/**
 * Minimal OAuth 2.0 (authorization-code) helpers for social login.
 *
 * Supports Google and GitHub without pulling in NextAuth, so it coexists with
 * the existing custom email/password + JWT-cookie auth. Each provider needs a
 * client id/secret configured in env (see .env.example) and the redirect URI
 * "<APP_URL>/api/auth/oauth/<provider>/callback" registered in the provider's
 * developer console.
 */

export type OAuthProvider = 'google' | 'github'

export interface NormalizedOAuthUser {
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatarUrl?: string
  providerId: string
}

interface ProviderConfig {
  clientId?: string
  clientSecret?: string
  authUrl: string
  tokenUrl: string
  scope: string
}

function providerConfig(provider: OAuthProvider): ProviderConfig {
  switch (provider) {
    case 'google':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'openid email profile',
      }
    case 'github':
      return {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: 'read:user user:email',
      }
  }
}

export function isSupportedProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'github'
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const { clientId, clientSecret } = providerConfig(provider)
  return Boolean(clientId && clientSecret)
}

/** Resolve the app's public base URL for building redirect URIs. */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function getRedirectUri(provider: OAuthProvider): string {
  return `${getAppBaseUrl()}/api/auth/oauth/${provider}/callback`
}

/** Build the provider's authorization URL the user is redirected to. */
export function buildAuthorizationUrl(
  provider: OAuthProvider,
  state: string
): string {
  const cfg = providerConfig(provider)
  const params = new URLSearchParams({
    client_id: cfg.clientId || '',
    redirect_uri: getRedirectUri(provider),
    response_type: 'code',
    scope: cfg.scope,
    state,
  })
  if (provider === 'google') {
    params.set('access_type', 'online')
    params.set('prompt', 'select_account')
  }
  return `${cfg.authUrl}?${params.toString()}`
}

/** Exchange an authorization code for an access token. */
async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string
): Promise<string> {
  const cfg = providerConfig(provider)
  const body = new URLSearchParams({
    client_id: cfg.clientId || '',
    client_secret: cfg.clientSecret || '',
    code,
    redirect_uri: getRedirectUri(provider),
    grant_type: 'authorization_code',
  })

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`)
  }

  const data = await res.json()
  if (!data.access_token) {
    throw new Error('No access token returned by provider')
  }
  return data.access_token as string
}

function splitName(full?: string): { firstName?: string; lastName?: string } {
  if (!full) return {}
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/** Fetch and normalize the user's profile from the provider. */
async function fetchUserProfile(
  provider: OAuthProvider,
  accessToken: string
): Promise<NormalizedOAuthUser> {
  if (provider === 'google') {
    const res = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) throw new Error('Failed to fetch Google profile')
    const p = await res.json()
    if (!p.email) throw new Error('Google account has no email')
    return {
      email: String(p.email).toLowerCase(),
      firstName: p.given_name,
      lastName: p.family_name,
      displayName: p.name,
      avatarUrl: p.picture,
      providerId: String(p.sub),
    }
  }

  // GitHub
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'shotiq-ai',
  }
  const userRes = await fetch('https://api.github.com/user', { headers })
  if (!userRes.ok) throw new Error('Failed to fetch GitHub profile')
  const p = await userRes.json()

  // GitHub may hide the email on the profile; fetch the verified primary.
  let email: string | undefined = p.email
  if (!email) {
    const emailRes = await fetch('https://api.github.com/user/emails', { headers })
    if (emailRes.ok) {
      const emails = await emailRes.json()
      const primary = Array.isArray(emails)
        ? emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified) ||
          emails.find((e: { verified: boolean }) => e.verified)
        : null
      email = primary?.email
    }
  }
  if (!email) throw new Error('GitHub account has no accessible email')

  const { firstName, lastName } = splitName(p.name)
  return {
    email: String(email).toLowerCase(),
    firstName,
    lastName,
    displayName: p.name || p.login,
    avatarUrl: p.avatar_url,
    providerId: String(p.id),
  }
}

/** Full callback handling: code -> token -> normalized user profile. */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string
): Promise<NormalizedOAuthUser> {
  const accessToken = await exchangeCodeForToken(provider, code)
  return fetchUserProfile(provider, accessToken)
}
