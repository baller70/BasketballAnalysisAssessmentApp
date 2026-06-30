import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, AUTH_COOKIE_NAME } from '@/lib/authToken'

// Pages reachable WITHOUT signing in. Everything else the matcher forwards here
// is protected by default ("default-deny"), so a newly added page can't
// accidentally ship without auth. This also closes a prior gap where routes in
// neither list (e.g. /media, the user's gallery) fell through as public.
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/results/demo',
  '/settings',
  '/badges',
  '/elite-shooters',
  '/guide',
  '/points',
]

// Auth pages a signed-in user should be redirected away from.
const AUTH_PAGES = ['/signin', '/signup']

const matchesRoute = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(route + '/'))

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Authentication is established SOLELY by a signed, httpOnly session JWT
  // (auth-token). We verify its signature + expiry here. There is no other
  // accepted source of authentication — a previous non-httpOnly `user-session`
  // cookie fallback was removed because it could be forged client-side
  // (anyone could set `user-session=authenticated` in devtools).
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const verified = await verifySessionToken(sessionToken)
  const isAuthenticated = Boolean(verified)
  
  // Signed-in users shouldn't sit on signin/signup — send them home.
  if (isAuthenticated && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Public routes (and their nested paths) are always allowed.
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  // Default-deny: everything else requires authentication.
  if (!isAuthenticated) {
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(signinUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
