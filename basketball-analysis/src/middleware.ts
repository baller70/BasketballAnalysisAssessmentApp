import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, AUTH_COOKIE_NAME } from '@/lib/authToken'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/auth',
  '/results/demo',
  '/settings',
  '/badges',
  '/elite-shooters',
  '/guide',
  '/points'
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/profile',
  '/onboarding',
  '/upload',
  '/analyze',
  '/video-analysis',
  '/results',
  '/elite-shooters',
  '/badges',
  '/guide',
  '/settings',
  '/admin'
]

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

  // Authentication is established by a signed, httpOnly session JWT
  // (auth-token). We verify its signature + expiry here. A legacy
  // non-httpOnly `user-session` cookie is still accepted as a fallback for
  // backward compatibility (e.g. the offline/dev local-storage flow).
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const verified = await verifySessionToken(sessionToken)
  const legacySession = request.cookies.get('user-session')?.value
  const isAuthenticated = Boolean(verified) || Boolean(legacySession)
  
  // Check if this is a public route (including nested routes)
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // If trying to access a protected route without authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  if (isProtectedRoute && !isAuthenticated) {
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(signinUrl)
  }
  
  // If authenticated and trying to access signin/signup, redirect to home
  if (PUBLIC_ROUTES.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
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
