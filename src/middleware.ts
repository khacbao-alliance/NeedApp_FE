import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Runs at the edge before React renders — eliminates auth flash entirely
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has('auth_flag');
  const role = request.cookies.get('auth_role')?.value;
  const hasClient = request.cookies.get('auth_has_client')?.value === '1';

  // Redirect authenticated users away from guest-only pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    const dest = role === 'Client' ? (hasClient ? '/' : '/setup-client') : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Redirect Admin/Staff away from the landing page to their dashboard
  if (isLoggedIn && pathname === '/' && role !== 'Client') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/'],
};
