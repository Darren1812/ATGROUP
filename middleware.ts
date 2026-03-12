// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // PUBLIC PATHS: allow access without token
  const publicPaths = ['/', '/login', '/api/login']; 
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // PROTECTED PATHS: require token
  if (!token) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated users can access protected pages
  return NextResponse.next();
}

// Apply middleware to all pages except Next.js internals
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
