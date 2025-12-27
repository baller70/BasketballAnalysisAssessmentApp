import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/signin', '/signup']

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

export function middleware(request: NextRequest) {
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

  // Check if user is authenticated by looking for auth data in localStorage
  // Since middleware runs on server, we'll check cookies or use a different approach
  // For now, we'll redirect all protected routes to signin if no session cookie exists
  const isAuthenticated = request.cookies.get('user-session')?.value
  
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
