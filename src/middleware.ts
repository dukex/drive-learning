import { NextRequest, NextResponse } from 'next/server'
import { betterAuth } from 'better-auth'
import Database from 'better-sqlite3'

// Create auth instance for middleware
const database = new Database('database.sqlite')
const auth = betterAuth({
  database,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:7777',
  secret: process.env.BETTER_AUTH_SECRET!,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ['https://www.googleapis.com/auth/drive.file']
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
})

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard']

// Define public routes that should redirect authenticated users
const publicRoutes = ['/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    // Get session from request headers/cookies
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    const isAuthenticated = !!session?.user
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.includes(pathname)

    // Handle protected routes
    if (isProtectedRoute && !isAuthenticated) {
      // Redirect unauthenticated users to welcome page
      const url = new URL('/', request.url)
      return NextResponse.redirect(url)
    }

    // Handle public routes for authenticated users
    if (isPublicRoute && isAuthenticated) {
      // Redirect authenticated users to dashboard
      const url = new URL('/dashboard', request.url)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue to avoid breaking the app
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}