import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-in-production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // Allow access to login page
      return NextResponse.next();
    }

    const session = request.cookies.get('session')?.value;
    const isApiRoute = pathname.startsWith('/api/admin');

    if (!session) {
      // For API routes, return JSON 401 instead of redirect
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      // Verify session
      await jwtVerify(session, SECRET_KEY);
      return NextResponse.next();
    } catch (error) {
      console.error('Session verification failed in middleware:', error);
      // For API routes, return JSON 401 instead of redirect
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*', // Must include API admin routes
  ],
};
