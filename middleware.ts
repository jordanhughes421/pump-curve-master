import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/dashboard/login', '/dashboard/register'];
  
  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => pathname === path);
  
  // If the user is not authenticated and trying to access a protected route
  if (!token && !isPublicPath) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/dashboard/login', request.url));
  }
  
  // If the user is authenticated and trying to access login/register pages
  if (token && isPublicPath && pathname !== '/') {
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
}; 